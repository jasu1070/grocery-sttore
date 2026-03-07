let products = [];
let cart = [];

// ─── COMPONENT LOADER ───
async function loadComponent(id, file) {
  const el = document.getElementById(id);
  if (!el) return;
  try {
    const response = await fetch(`components/${file}`);
    const text = await response.json ? await response.json() : await response.text();
    el.innerHTML = text;
  } catch (error) {
    console.error(`Failed to load component ${file}:`, error);
  }
}

// ─── INIT ───
document.addEventListener("DOMContentLoaded", async () => {
  // Load components in parallel for better performance
  const components = [
    { id: "navbar-placeholder", file: "navbar.html" },
    { id: "hero-placeholder", file: "hero.html" },
    { id: "products-placeholder", file: "products.html" },
    { id: "about-placeholder", file: "about.html" },
    { id: "contact-placeholder", file: "contact.html" },
    { id: "footer-placeholder", file: "footer.html" },
    { id: "cart-placeholder", file: "cart.html" }
  ];

  await Promise.all(components.map(c => loadComponent(c.id, c.file)));

  // Set dynamic values from config
  const brandEls = document.querySelectorAll(".nav-brand, footer span, .footer-brand h2");
  brandEls.forEach(el => el.textContent = window.CONFIG.STORE_NAME);

  // Set email links and text
  const emailLinks = document.querySelectorAll(".store-email");
  emailLinks.forEach(link => {
    link.setAttribute("href", `mailto:${window.CONFIG.STORE_EMAIL}`);
    if (link.textContent.toLowerCase().includes("loading") || link.textContent.includes(window.CONFIG.STORE_EMAIL)) {
      link.textContent = window.CONFIG.STORE_EMAIL;
    }
  });
  
  // Set WhatsApp links and text
  const waLinks = document.querySelectorAll('a[href*="wa.me"]');
  waLinks.forEach(link => {
    const originalHref = link.getAttribute("href");
    const newHref = originalHref.replace(/wa\.me\/\d+/, `wa.me/${window.CONFIG.WHATSAPP_NUMBER}`);
    link.setAttribute("href", newHref);
    
    if (link.textContent.includes("9999999999")) {
      link.textContent = `+${window.CONFIG.WHATSAPP_NUMBER}`;
    }
  });

  // Load products
  try {
    const response = await fetch("products.json");
    products = await response.json();
    renderProducts();
  } catch (error) {
    console.error("Failed to load products:", error);
    showToast("Error loading products. Please refresh.");
  }

  // Nav scroll listener
  window.addEventListener("scroll", () => {
    const nav = document.getElementById("navbar");
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 20);
  });

  updateCartUI();
});

// ─── RENDER PRODUCTS ───
function renderProducts() {
  const carousel = document.getElementById("carousel");
  if (!carousel) return;
  
  carousel.innerHTML = products.map(p => `
    <div class="product-card">
      <div class="product-img-wrap">
        <img src="${p.img}" alt="${p.name}" loading="lazy" />
      </div>
      <div class="product-info">
        <p class="product-name">${p.name}</p>
        <p class="product-price">${window.CONFIG.CURRENCY}${p.price}</p>
        <button class="add-cart-btn" id="btn-${p.id}" onclick="addToCart(${p.id})">Add to Cart</button>
      </div>
    </div>
  `).join("");
}

// ─── CAROUSEL ───
function scrollCarousel(dir) {
  const carousel = document.getElementById("carousel");
  if (carousel) carousel.scrollBy({ left: dir * 300, behavior: "smooth" });
}

// ─── CART LOGIC ───
function addToCart(id) {
  const product = products.find(p => p.id === id);
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  updateCartUI();
  showToast("Added to cart!");
  
  const btn = document.getElementById(`btn-${id}`);
  if (btn) {
    btn.textContent = "✓ Added";
    btn.classList.add("added");
    setTimeout(() => { 
      btn.textContent = "Add to Cart"; 
      btn.classList.remove("added"); 
    }, 1200);
  }
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  updateCartUI();
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(id);
  else updateCartUI();
}

function updateCartUI() {
  const totalCount = cart.reduce((s, i) => s + i.qty, 0);
  const countEl = document.getElementById("cartCount");
  if (countEl) {
    countEl.textContent = totalCount;
    countEl.classList.toggle("visible", totalCount > 0);
  }

  const itemsEl = document.getElementById("cartItems");
  const footerEl = document.getElementById("cartFooter");
  if (!itemsEl || !footerEl) return;

  if (cart.length === 0) {
    footerEl.style.display = "none";
    itemsEl.innerHTML = `
      <div class="cart-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <p>Your cart is empty</p>
      </div>`;
    return;
  }

  footerEl.style.display = "block";
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const totalEl = document.getElementById("cartTotal");
  if (totalEl) totalEl.textContent = `${window.CONFIG.CURRENCY}${total}`;

  itemsEl.innerHTML = cart.map(i => `
    <div class="cart-item">
      <img class="cart-item-img" src="${i.img}" alt="${i.name}" />
      <div class="cart-item-details">
        <p class="cart-item-name">${i.name}</p>
        <p class="cart-item-price">${window.CONFIG.CURRENCY}${i.price} × ${i.qty} = ${window.CONFIG.CURRENCY}${i.price * i.qty}</p>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeQty(${i.id}, -1)">−</button>
          <span class="qty-val">${i.qty}</span>
          <button class="qty-btn" onclick="changeQty(${i.id}, 1)">+</button>
        </div>
      </div>
      <button class="remove-item" onclick="removeFromCart(${i.id})">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `).join("");
}

// ─── CART TOGGLE ───
function toggleCart() {
  const overlay = document.getElementById("cartOverlay");
  const drawer = document.getElementById("cartDrawer");
  if (overlay && drawer) {
    overlay.classList.toggle("open");
    drawer.classList.toggle("open");
    document.body.style.overflow = drawer.classList.contains("open") ? "hidden" : "";
  }
}

// ─── SEND ORDER ───
async function sendOrder() {
  const name = document.getElementById("custName").value.trim();
  const phone = document.getElementById("custPhone").value.trim();
  const address = document.getElementById("custAddress").value.trim();
  const msgEl = document.getElementById("formMsg");
  const btn = document.getElementById("sendOrderBtn");

  if (!msgEl || !btn) return;

  msgEl.textContent = "";

  if (!name || !phone) {
    msgEl.textContent = "Please enter your name and phone number.";
    return;
  }
  if (cart.length === 0) {
    msgEl.textContent = "Your cart is empty!";
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span>Sending...`;

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const itemLines = cart.map(i =>
    `  • ${i.name}  ×${i.qty}  =  ${window.CONFIG.CURRENCY}${i.price * i.qty}`
  ).join("\n");

  const emailBody = `
🛍️  YOU'VE GOT A NEW ORDER REQUEST!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤  Customer Name  : ${name}
📞  Phone / WA     : ${phone}
📍  Address / Notes: ${address || "Not provided"}

🧾  ORDER ITEMS:
${itemLines}

💰  Order Total    : ${window.CONFIG.CURRENCY}${total}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Please confirm availability via WhatsApp or phone call.
  `.trim();

  try {
    const res = await fetch(`https://formspree.io/f/${window.CONFIG.FORMSPREE_ID}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        subject: `🛍️ New Order Request — ${window.CONFIG.STORE_NAME}`,
        customer_name: name,
        phone: phone,
        address: address || "Not provided",
        order_items: cart.map(i => `${i.name} x${i.qty} @ ${window.CONFIG.CURRENCY}${i.price}`).join(" | "),
        order_total: `${window.CONFIG.CURRENCY}${total}`,
        message: emailBody,
      })
    });

    if (res.ok) {
      document.getElementById("orderForm").style.display = "none";
      document.getElementById("orderSuccess").style.display = "block";
      document.querySelector(".cart-total").style.display = "none";
      cart = [];
      updateCartUI();
    } else {
      const data = await res.json();
      msgEl.textContent = data?.errors?.[0]?.message || "Something went wrong. Try WhatsApp instead!";
      btn.disabled = false;
      btn.innerHTML = "📩 Send Order";
    }
  } catch (err) {
    msgEl.textContent = "Network error. Please try WhatsApp instead!";
    btn.disabled = false;
    btn.innerHTML = "📩 Send Order";
  }
}

// ─── TOAST ───
function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2000);
}
