// scripts/scriptProduct.js
"use strict";

/* -------------------------
   Configuration / sources
   ------------------------- */
const PRODUCTS_URL = "../../data/produits.json";
const REVIEWS_URL  = "../../data/reviews.json";

/* -------------------------
   Récupération params URL
   ------------------------- */
const params   = new URLSearchParams(location.search);
const idParam  = params.get("id");
const slugParam = params.get("slug");

/* -------------------------
   DOM refs (safely)
   ------------------------- */
const $ = (id) => document.getElementById(id);
const mainImage      = $("mainImage");
const mainImageWrap  = $("mainImageWrap");
const thumbs         = $("thumbs");
const pTitle         = $("pTitle");
const pShort         = $("pShort");
const pPrice         = $("pPrice");
const pOld           = $("pOld");
const pDescription   = $("pDescription");
const pFeatures      = $("pFeatures");
const pRating        = $("pRating");
const pReviewsCount  = $("pReviewsCount");
const qtyInput       = $("qtyInput");
const qtyMinus       = $("qtyMinus");
const qtyPlus        = $("qtyPlus");
const addCart        = $("addCart");
const whatsappLink   = $("whatsappLink");
const reviewsList    = $("reviewsList");
const reviewsSummary = $("reviewsSummary");
const similarGrid    = $("similarGrid");
const variantsWrap   = $("variants");
const yearEl         = $("year");

/* -------------------------
   State
   ------------------------- */
let PRODUCTS = [];
let SHUFFLED_PRODUCTS = []; // produits mélangés une fois au chargement
let REVIEWS  = [];
let product  = null;

/* -------------------------
   Helpers (sans placeholder)
   ------------------------- */
function firstImageOf(p) {
  if (!p) return "";
  if (Array.isArray(p.images) && p.images.length && p.images[0]) return p.images[0];
  return ""; // plus de placeholder
}
function safeValueNumber(n){ const num = Number(n); return Number.isFinite(num) ? num : 0; }
function formatPrice(n){ return safeValueNumber(n).toLocaleString(); }
function escapeHtml(str){
  if (!str) return "";
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
                   .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

/**
 * shuffle (Fisher-Yates)
 * Retourne une NOUVELLE array mélangée ; ne modifie pas l'array d'origine.
 */
function shuffle(arr) {
  const a = Array.isArray(arr) ? arr.slice() : [];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* -------------------------
   Cart helpers (localStorage)
   ------------------------- */
function getCart(){ try { return JSON.parse(localStorage.getItem("cart_v1") || "[]"); } catch { return []; } }
function saveCart(cart){ localStorage.setItem("cart_v1", JSON.stringify(cart)); updateCartCount(); }
function updateCartCount(){
  const badge = $("cartCount");
  if (!badge) return;
  const total = getCart().reduce((s,i)=> s + (Number(i.qty)||0), 0);
  badge.textContent = total || "";
  badge.style.display = total ? "inline-block" : "none";
}
function addToCart(productId, qty = 1){
  const p = PRODUCTS.find(x => String(x.id) === String(productId));
  if (!p) { alert("Produit introuvable."); return; }
  const cart = getCart();
  const idx = cart.findIndex(i => String(i.productId) === String(productId));
  if (idx >= 0) {
    cart[idx].qty = (Number(cart[idx].qty)||0) + Number(qty||1);
  } else {
    cart.push({
      productId: p.id,
      title: p.title,
      price: p.price,
      qty: Number(qty)||1,
      image: (Array.isArray(p.images) && p.images[0]) ? p.images[0] : ""
    });
  }
  saveCart(cart);
}

/* -------------------------
   Fetch helper
   ------------------------- */
async function fetchJson(url){
  const res = await fetch(url, {cache: "no-cache"});
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${url}`);
  return res.json();
}

/* -------------------------
   Init
   ------------------------- */
async function init(){
  try {
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const [pJson, rJson] = await Promise.all([
      fetchJson(PRODUCTS_URL).catch(e => { console.error(e); return []; }),
      fetchJson(REVIEWS_URL).catch(e => { console.warn("reviews not found", e); return []; })
    ]);

    PRODUCTS = Array.isArray(pJson) ? pJson : (pJson.products || []);
    REVIEWS  = Array.isArray(rJson) ? rJson : (rJson.reviews || []);

    // Mélange une fois au chargement pour affichages aléatoires (stable pendant la session)
    SHUFFLED_PRODUCTS = shuffle(PRODUCTS);

    selectProduct();
    updateCartCount();
    attachUiHandlers();
  } catch (err) {
    console.error("Init erreur:", err);
    const container = document.querySelector(".product-page");
    if (container) container.innerHTML = "<p>Erreur lors du chargement. Ouvrez la console pour détails.</p>";
  }
}

/* -------------------------
   Select product by id/slug
   ------------------------- */
function selectProduct(){
  if (!PRODUCTS || !PRODUCTS.length) {
    console.warn("Aucun produit chargé.");
    return;
  }
  if (idParam) {
    product = PRODUCTS.find(x => String(x.id) === String(idParam));
  } else if (slugParam) {
    product = PRODUCTS.find(x => String(x.slug) === String(slugParam));
  } else {
    product = PRODUCTS[0];
  }
  if (!product) {
    const container = document.querySelector(".product-page");
    if (container) container.innerHTML = "<p>Produit introuvable.</p>";
    return;
  }
  renderProduct();
}

/* -------------------------
   Render product (sans placeholder)
   ------------------------- */
function renderProduct(){
  // Images : main image src = première image (ou vide)
  const firstImg = firstImageOf(product);
  if (mainImage) {
    // Note : si firstImg est vide, src sera "../../" + "" => "../../" ; tu peux adapter si tu veux un vrai placeholder
    mainImage.src = firstImg ? ("../../" + firstImg) : "";
    mainImage.alt = product.title || "Produit";
  }

  // Thumbnails : n'ajoute que les images présentes
  if (thumbs) {
    thumbs.innerHTML = "";
    (Array.isArray(product.images) ? product.images : []).forEach((src, i) => {
      if (!src) return; // saute si chemin vide
      const img = document.createElement("img");
      img.src = "../../" + src;
      img.alt = product.title || "mini";
      if (i === 0) img.classList.add("active");
      img.addEventListener("click", () => {
        if (mainImage) mainImage.src = "../../" + src;
        thumbs.querySelectorAll("img").forEach(x => x.classList.remove("active"));
        img.classList.add("active");
      });
      thumbs.appendChild(img);
    });
  }

  // Basic info
  if (pTitle) pTitle.textContent = product.title || "Produit";
  if (pShort) pShort.textContent = product.short || "";
  if (pPrice) pPrice.textContent = `${formatPrice(product.price)} FCFA`;
  if (pOld) pOld.textContent = product.oldPrice ? `${formatPrice(product.oldPrice)} FCFA` : "";

  // Description & features
  if (pDescription) pDescription.innerHTML = product.description || "";
  if (pFeatures) {
    pFeatures.innerHTML = "";
    (product.features || []).forEach(f => {
      const li = document.createElement("li");
      li.textContent = f;
      pFeatures.appendChild(li);
    });
  }

  // Variants
  if (variantsWrap) {
    variantsWrap.innerHTML = "";
    (product.variants || []).forEach((v, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "variant-btn";
      btn.textContent = v.label || (v.name || `Option ${idx+1}`);
      btn.addEventListener("click", () => {
        variantsWrap.querySelectorAll(".variant-btn").forEach(x => x.classList.remove("active"));
        btn.classList.add("active");
      });
      variantsWrap.appendChild(btn);
    });
  }

  // Reviews and similar
  renderReviews();
  renderSimilar();

  // S'assurer que qtyInput a une valeur par défaut
  if (qtyInput && (!qtyInput.value || Number(qtyInput.value) < 1)) {
    qtyInput.value = 1;
  }

  // WhatsApp link (prérempli) - remplace par ton numéro
  updateWhatsAppLink();
}

/* -------------------------
   Met à jour le lien WhatsApp avec quantité + totaux
   ------------------------- */
function updateWhatsAppLink(){
  if (!whatsappLink || !product) return;
  const qty = Math.max(1, Number(qtyInput && qtyInput.value ? qtyInput.value : 1) || 1);
  const unitPrice = safeValueNumber(product.price);
  const total = unitPrice * qty;

  // Message : inclut quantité, prix unitaire et total (lisible)
  const msg = `Bonjour, je souhaite commander : ${product.title} (id:${product.id})\nQuantité : ${qty}\nPrix unitaire : ${formatPrice(unitPrice)} FCFA\nTotal : ${formatPrice(total)} FCFA`;

  // Remplace le numéro ci-dessous par le tien si besoin (format E.164 sans +)
  whatsappLink.href = `https://wa.me/24177067949?text=${encodeURIComponent(msg)}`;
}

/* -------------------------
   Reviews
   ------------------------- */
function renderReviews(){
  if (!REVIEWS) return;
  const revs = REVIEWS.filter(r => String(r.productId) === String(product.id));
  const count = revs.length;
  const avg = count ? (revs.reduce((s,r)=>s + Number(r.rating || 0), 0) / count) : 0;
  const rounded = Math.round(avg * 10) / 10;

  if (pRating) {
    const stars = Array.from({length:5}, (_,i) => (i < Math.round(avg) ? "★" : "☆")).join("");
    pRating.textContent = stars;
  }
  if (pReviewsCount) pReviewsCount.textContent = `(${count} avis)`;
  if (reviewsSummary) reviewsSummary.innerHTML = `<strong>${rounded || "—"}/5</strong> (${count} avis)`;

  if (reviewsList) {
    reviewsList.innerHTML = "";
    revs.slice(0, 10).forEach(r => {
      const div = document.createElement("div");
      div.className = "review";
      div.innerHTML = `
        <div class="meta"><strong>${escapeHtml(r.author || "Anonyme")}</strong> · ${"★".repeat(r.rating || 0)} · <span class="muted">${escapeHtml(r.date||"")}</span></div>
        <div class="body">${escapeHtml(r.body || "")}</div>
      `;
      reviewsList.appendChild(div);
    });
    if (!revs.length) reviewsList.innerHTML = "<p class='muted'>Pas encore d'avis pour ce produit.</p>";
  }
}

/* -------------------------
   Similar products (aléatoire via SHUFFLED_PRODUCTS)
   ------------------------- */
function renderSimilar(){
  if (!similarGrid) return;
  similarGrid.innerHTML = "";
  // On utilise SHUFFLED_PRODUCTS (mélangé au chargement) pour favoriser la découverte
  const pool = (SHUFFLED_PRODUCTS && SHUFFLED_PRODUCTS.length) ? SHUFFLED_PRODUCTS : shuffle(PRODUCTS);
  const sims = pool.filter(p => String(p.id) !== String(product.id) && p.category === product.category).slice(0,4);
  if (!sims.length) {
    similarGrid.innerHTML = "<div class='muted'>Aucun produit similaire.</div>";
    return;
  }
  sims.forEach(p2 => {
    const imgSrc = (Array.isArray(p2.images) && p2.images[0]) ? p2.images[0] : "";
    const el = document.createElement("div");
    el.className = "product";
    el.innerHTML = `
      <a href="product.html?id=${encodeURIComponent(p2.id)}">
        ${ imgSrc ? `<div class="product-image-wrap"><img src="../../${imgSrc}" alt="${escapeHtml(p2.title||'')}" /></div>` : "" }
        <div class="product-title">${escapeHtml(p2.title||'')}</div>
        <div class="price">${formatPrice(p2.price)} FCFA</div>
      </a>
    `;
    similarGrid.appendChild(el);
  });
}

/* -------------------------
   UI handlers
   ------------------------- */
function attachUiHandlers(){
  if (qtyMinus) qtyMinus.addEventListener("click", ()=> {
    qtyInput.value = Math.max(1, Number(qtyInput.value||1) - 1);
    updateWhatsAppLink();
  });
  if (qtyPlus)  qtyPlus.addEventListener("click", ()=> {
    qtyInput.value = Math.max(1, Number(qtyInput.value||1) + 1);
    updateWhatsAppLink();
  });

  if (qtyInput) {
    // mise à jour en tapant directement
    qtyInput.addEventListener("input", () => {
      // garantir entier positif minimal 1
      const v = Math.max(1, Math.floor(Number(qtyInput.value) || 1));
      qtyInput.value = v;
      updateWhatsAppLink();
    });
  }

  if (addCart) addCart.addEventListener("click", () => {
    const qty = Math.max(1, Number(qtyInput.value||1));
    addToCart(product.id, qty);
    addCart.textContent = "Ajouté ✓";
    updateCartCount();
    setTimeout(()=> addCart.textContent = "Ajouter au panier", 1200);
  });

  // Si le lien WhatsApp peut être cliqué, prévenir qu'il est toujours mis à jour
  if (whatsappLink) {
    whatsappLink.addEventListener("click", () => {
      // update avant redirection (au cas où)
      updateWhatsAppLink();
    });
  }
}

/* -------------------------
   Kickoff
   ------------------------- */
document.addEventListener("DOMContentLoaded", init);
