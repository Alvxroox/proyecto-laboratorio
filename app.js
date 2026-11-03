//catálogo, favoritos y carrito.
const contenedorProductos = document.querySelector("#contenedor-productos");
const contenedorCarrito = document.querySelector("#items-carrito");
const contenedorFavoritos = document.querySelector("#contenedor-favoritos");
const contadorSuperior = document.querySelector("#contador-superior");
const contadorPanel = document.querySelector("#contador-panel");
const subtotalElemento = document.querySelector("#subtotal");
const totalElemento = document.querySelector("#total");
const buscador = document.querySelector("#buscador");
const categorias = document.querySelector("#categorias");
const notificacion = document.querySelector("#notificacion");
const modalCheckout = document.querySelector("#modal-checkout");
const formularioPedido = document.querySelector("#formulario-pedido");

let carrito = JSON.parse(localStorage.getItem("queRicoCarrito")) || [];
let favoritos = JSON.parse(localStorage.getItem("queRicoFavoritos")) || [];
let categoriaActiva = "Todos";
let textoBusqueda = "";
let temporizadorToast;

const formatoPrecio = (precio) => precio.toLocaleString("es-AR", {
  style: "currency", currency: "ARS", maximumFractionDigits: 0
});

function guardarDatos() {
  localStorage.setItem("queRicoCarrito", JSON.stringify(carrito));
  localStorage.setItem("queRicoFavoritos", JSON.stringify(favoritos));
}

function avisar(mensaje) {
  notificacion.textContent = mensaje;
  notificacion.classList.add("mostrar");
  clearTimeout(temporizadorToast);
  temporizadorToast = setTimeout(() => notificacion.classList.remove("mostrar"), 2600);
}

function tarjetaProducto(producto, esFavorito = false) {
  const guardado = favoritos.includes(producto.id);
  return `
    <article class="product-card">
      <div class="product-image-wrap">
        <img class="product-image" src="${producto.imagen}" alt="${producto.nombre}" loading="lazy"
          onerror="this.onerror=null;this.src='https://placehold.co/600x400/fce7e9/ba2434?text=Que+Rico'">
        ${producto.popular ? '<span class="popular-badge">★ Favorito de la casa</span>' : ""}
        <button class="favorite-button ${guardado ? "is-favorite" : ""}" data-accion="favorito" data-id="${producto.id}" type="button" aria-label="${guardado ? "Quitar de favoritos" : "Agregar a favoritos"}">${guardado ? "♥" : "♡"}</button>
      </div>
      <div class="product-info">
        <div class="product-title-line"><h3>${producto.nombre}</h3><span class="rating">★ 4.8</span></div>
        <p class="product-description">${producto.descripcion}</p>
        <div class="product-meta"><span>◷ ${producto.tiempo}</span><span>·</span><span>${producto.categoria}</span></div>
        <div class="product-bottom"><strong class="product-price">${formatoPrecio(producto.precio)}</strong>
          <button class="add-button" data-accion="agregar" data-id="${producto.id}" type="button"><span>+</span> Agregar</button>
        </div>
      </div>
    </article>`;
}

function renderProductos() {
  const filtrados = productos.filter(producto => {
    const coincideCategoria = categoriaActiva === "Todos" || producto.categoria === categoriaActiva;
    const texto = `${producto.nombre} ${producto.descripcion} ${producto.categoria}`.toLowerCase();
    return coincideCategoria && texto.includes(textoBusqueda.toLowerCase().trim());
  });
  contenedorProductos.innerHTML = filtrados.map(producto => tarjetaProducto(producto)).join("");
  document.querySelector("#sin-resultados").classList.toggle("hidden", filtrados.length !== 0);
  document.querySelector("#texto-resultados").textContent =
    textoBusqueda || categoriaActiva !== "Todos" ? `${filtrados.length} resultado(s)` : "Nuestros más elegidos";
}

function renderFavoritos() {
  const productosFavoritos = productos.filter(producto => favoritos.includes(producto.id));
  contenedorFavoritos.innerHTML = productosFavoritos.map(producto => tarjetaProducto(producto, true)).join("");
  document.querySelector("#sin-favoritos").classList.toggle("hidden", productosFavoritos.length > 0);
}

function renderCarrito() {
  if (carrito.length === 0) {
    contenedorCarrito.innerHTML = `<div class="cart-empty"><div>🛒</div><strong>Tu carrito está esperando</strong><p>Agregá algo rico y aparecerá acá.</p></div>`;
  } else {
    contenedorCarrito.innerHTML = carrito.map(item => `
      <article class="cart-item">
        <img src="${item.imagen}" alt="${item.nombre}" onerror="this.onerror=null;this.src='https://placehold.co/100x100/fce7e9/ba2434?text=Comida'">
        <div class="cart-item-main"><strong>${item.nombre}</strong><small>${formatoPrecio(item.precio)} c/u</small>
          <div class="quantity-controls">
            <button type="button" data-carrito-accion="disminuir" data-id="${item.id}" aria-label="Disminuir ${item.nombre}">−</button>
            <span>${item.cantidad}</span>
            <button type="button" data-carrito-accion="aumentar" data-id="${item.id}" aria-label="Aumentar ${item.nombre}">+</button>
          </div>
        </div>
        <div class="cart-item-end"><strong>${formatoPrecio(item.precio * item.cantidad)}</strong><button class="remove-item" type="button" data-carrito-accion="eliminar" data-id="${item.id}">Eliminar</button></div>
      </article>`).join("");
  }
  const cantidadTotal = carrito.reduce((acumulado, item) => acumulado + item.cantidad, 0);
  const subtotal = carrito.reduce((acumulado, item) => acumulado + item.precio * item.cantidad, 0);
  contadorSuperior.textContent = cantidadTotal;
  contadorPanel.textContent = cantidadTotal;
  subtotalElemento.textContent = formatoPrecio(subtotal);
  totalElemento.textContent = formatoPrecio(subtotal);
  document.querySelector("#total-modal").textContent = formatoPrecio(subtotal);
  document.querySelector("#abrir-checkout").disabled = carrito.length === 0;
  guardarDatos();
}

function agregarAlCarrito(id) {
  const producto = productos.find(item => item.id === id);
  if (!producto) return;
  const existente = carrito.find(item => item.id === id);
  if (existente) existente.cantidad++;
  else carrito.push({ ...producto, cantidad: 1 });
  renderCarrito();
  avisar(`${producto.nombre} se agregó a tu pedido 🛒`);
}

function alternarFavorito(id) {
  if (favoritos.includes(id)) {
    favoritos = favoritos.filter(favoritoId => favoritoId !== id);
    avisar("Producto quitado de favoritos");
  } else {
    favoritos.push(id);
    avisar("¡Guardado en tus favoritos! ♥");
  }
  guardarDatos();
  renderProductos();
  renderFavoritos();
}

// Delegación: un único listener para los botones de todas las tarjetas del catálogo.
contenedorProductos.addEventListener("click", (e) => {
  const boton = e.target.closest("button[data-accion]");
  if (!boton || !contenedorProductos.contains(boton)) return;
  const id = Number(boton.dataset.id);
  if (boton.dataset.accion === "agregar") agregarAlCarrito(id);
  if (boton.dataset.accion === "favorito") alternarFavorito(id);
});

// También delegamos las acciones de las tarjetas que se muestran en favoritos.
contenedorFavoritos.addEventListener("click", (e) => {
  const boton = e.target.closest("button[data-accion]");
  if (!boton || !contenedorFavoritos.contains(boton)) return;
  const id = Number(boton.dataset.id);
  if (boton.dataset.accion === "agregar") agregarAlCarrito(id);
  if (boton.dataset.accion === "favorito") alternarFavorito(id);
});

contenedorCarrito.addEventListener("click", (e) => {
  const boton = e.target.closest("button[data-carrito-accion]");
  if (!boton) return;
  const id = Number(boton.dataset.id);
  const item = carrito.find(producto => producto.id === id);
  if (!item) return;
  if (boton.dataset.carritoAccion === "aumentar") item.cantidad++;
  if (boton.dataset.carritoAccion === "disminuir") {
    item.cantidad--;
    if (item.cantidad <= 0) carrito = carrito.filter(producto => producto.id !== id);
  }
  if (boton.dataset.carritoAccion === "eliminar") {
    carrito = carrito.filter(producto => producto.id !== id);
    avisar("Producto eliminado del pedido");
  }
  renderCarrito();
});

categorias.addEventListener("click", (e) => {
  const boton = e.target.closest("button[data-categoria]");
  if (!boton) return;
  categoriaActiva = boton.dataset.categoria;
  categorias.querySelectorAll(".category").forEach(elemento => elemento.classList.toggle("active", elemento === boton));
  renderProductos();
});

buscador.addEventListener("input", () => {
  textoBusqueda = buscador.value;
  renderProductos();
});

document.querySelector("#ir-carrito").addEventListener("click", () => {
  document.querySelector("#panel-carrito").scrollIntoView({ behavior: "smooth", block: "center" });
});

document.querySelector("#abrir-checkout").addEventListener("click", () => {
  if (carrito.length) modalCheckout.classList.remove("hidden");
});
document.querySelector("#cerrar-checkout").addEventListener("click", () => modalCheckout.classList.add("hidden"));
modalCheckout.addEventListener("click", (e) => {
  if (e.target === modalCheckout) modalCheckout.classList.add("hidden");
});

formularioPedido.addEventListener("submit", (e) => {
  e.preventDefault();
  const datos = new FormData(formularioPedido);
  const nombre = datos.get("nombre").trim();
  const direccion = datos.get("direccion").trim();
  const total = carrito.reduce((suma, item) => suma + item.precio * item.cantidad, 0);
  const detalle = carrito.map(item => `${item.cantidad} × ${item.nombre}`).join(", ");
  modalCheckout.classList.add("hidden");
  avisar(`¡Gracias, ${nombre}! Pedido preparado por ${formatoPrecio(total)}.`);
  // Simulación local: no se envía información ni se procesa un pago.
  console.info("Resumen de pedido (demo):", { nombre, direccion, detalle, total });
  carrito = [];
  renderCarrito();
  formularioPedido.reset();
});

renderProductos();
renderFavoritos();
renderCarrito();
