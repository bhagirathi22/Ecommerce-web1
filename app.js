const state = {
  products: [],
  filteredProducts: [],
  cart: JSON.parse(localStorage.getItem("nova-cart") || "[]"),
  filters: {
    search: "",
    category: "All",
    sort: "featured",
  },
};

const productGrid = document.getElementById("productGrid");
const categoryFilters = document.getElementById("categoryFilters");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const cartCount = document.getElementById("cartCount");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");
const toastElement = document.getElementById("liveToast");
const toastMessage = document.getElementById("toastMessage");

function showToast(message) {
  toastMessage.textContent = message;
  const toast = new bootstrap.Toast(toastElement);
  toast.show();
}

function saveCart() {
  localStorage.setItem("nova-cart", JSON.stringify(state.cart));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function getFilteredProducts() {
  const filtered = state.products.filter((product) => {
    const matchesSearch = `${product.name} ${product.description}`.toLowerCase().includes(state.filters.search.toLowerCase());
    const matchesCategory = state.filters.category === "All" || product.category === state.filters.category;
    return matchesSearch && matchesCategory;
  });

  switch (state.filters.sort) {
    case "price-low":
      filtered.sort((a, b) => a.price - b.price);
      break;
    case "price-high":
      filtered.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      filtered.sort((a, b) => b.rating - a.rating);
      break;
    default:
      filtered.sort((a, b) => a.id - b.id);
      break;
  }

  return filtered;
}

function renderCategories() {
  const categories = ["All", ...new Set(state.products.map((product) => product.category))];
  categoryFilters.innerHTML = categories
    .map((category) => {
      const active = category === state.filters.category ? "active" : "";
      return `<button class="btn btn-sm filter-pill ${active}" data-category="${category}">${category}</button>`;
    })
    .join("");
}

function renderProducts() {
  state.filteredProducts = getFilteredProducts();
  if (!state.filteredProducts.length) {
    productGrid.innerHTML = `
      <div class="col-12">
        <div class="alert alert-light border text-center py-5">
          No products matched your search. Try a different keyword or filter.
        </div>
      </div>`;
    return;
  }

  productGrid.innerHTML = state.filteredProducts
    .map(
      (product) => `
        <div class="col-md-6 col-xl-4">
          <div class="product-card h-100 bg-white">
            <div class="card-body p-4 d-flex flex-column">
              <div class="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <p class="text-muted small mb-1">${product.category}</p>
                  <h5 class="fw-semibold mb-0">${product.name}</h5>
                </div>
                <div class="product-icon">${product.icon}</div>
              </div>
              <p class="text-muted flex-grow-1">${product.description}</p>
              <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="fw-bold">${formatCurrency(product.price)}</span>
                <span class="text-warning">★ ${product.rating}</span>
              </div>
              <button class="btn btn-primary" data-add="${product.id}">Add to cart</button>
            </div>
          </div>
        </div>
      `
    )
    .join("");
}

function renderCart() {
  if (!state.cart.length) {
    cartItems.innerHTML = `
      <div class="text-center text-muted py-5">
        <p class="mb-2 fw-semibold">Your cart is empty</p>
        <p class="small">Add a few products to see them here.</p>
      </div>`;
    cartTotal.textContent = formatCurrency(0);
    cartCount.textContent = "0";
    return;
  }

  cartItems.innerHTML = state.cart
    .map((item) => {
      const product = state.products.find((entry) => entry.id === item.id);
      if (!product) return "";
      return `
        <div class="cart-item p-3 mb-3">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h6 class="mb-1">${product.name}</h6>
              <p class="text-muted small mb-0">${formatCurrency(product.price)}</p>
            </div>
            <span class="fw-semibold">${formatCurrency(product.price * item.qty)}</span>
          </div>
          <div class="d-flex justify-content-between align-items-center">
            <div class="btn-group btn-group-sm" role="group">
              <button class="btn btn-outline-secondary" data-cart-action="decrease" data-id="${product.id}">-</button>
              <button class="btn btn-outline-secondary disabled">${item.qty}</button>
              <button class="btn btn-outline-secondary" data-cart-action="increase" data-id="${product.id}">+</button>
            </div>
            <button class="btn btn-link text-danger p-0" data-cart-action="remove" data-id="${product.id}">Remove</button>
          </div>
        </div>`;
    })
    .join("");

  const total = state.cart.reduce((acc, item) => {
    const product = state.products.find((entry) => entry.id === item.id);
    return acc + (product ? product.price * item.qty : 0);
  }, 0);

  cartTotal.textContent = formatCurrency(total);
  cartCount.textContent = state.cart.reduce((acc, item) => acc + item.qty, 0);
}

function addToCart(productId) {
  const existing = state.cart.find((item) => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({ id: productId, qty: 1 });
  }
  saveCart();
  renderCart();
  showToast("Item added to cart");
}

function updateCart(action, productId) {
  const item = state.cart.find((entry) => entry.id === productId);
  if (!item) return;

  if (action === "increase") {
    item.qty += 1;
  } else if (action === "decrease") {
    item.qty -= 1;
    if (item.qty <= 0) {
      state.cart = state.cart.filter((entry) => entry.id !== productId);
    }
  } else if (action === "remove") {
    state.cart = state.cart.filter((entry) => entry.id !== productId);
  }

  saveCart();
  renderCart();
}

searchInput.addEventListener("input", (event) => {
  state.filters.search = event.target.value;
  renderProducts();
});

sortSelect.addEventListener("change", (event) => {
  state.filters.sort = event.target.value;
  renderProducts();
});

categoryFilters.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-category]");
  if (!button) return;
  state.filters.category = button.dataset.category;
  renderCategories();
  renderProducts();
});

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-add]");
  if (!button) return;
  addToCart(Number(button.dataset.add));
});

cartItems.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-cart-action]");
  if (!button) return;
  updateCart(button.dataset.cartAction, Number(button.dataset.id));
});

checkoutBtn.addEventListener("click", () => {
  if (!state.cart.length) {
    showToast("Your cart is empty");
    return;
  }
  state.cart = [];
  saveCart();
  renderCart();
  showToast("Mock checkout complete. Thanks for shopping!");
});

async function init() {
  const response = await fetch("./data/products.json");
  state.products = await response.json();
  renderCategories();
  renderProducts();
  renderCart();
}

init();
