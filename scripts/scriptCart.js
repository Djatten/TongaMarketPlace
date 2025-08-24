// scriptCart.js
"use strict";

/*
  Fonctionnalités :
  - lit 'cart_v1' (array) depuis localStorage
  - fetch produits depuis ../../data/produits.json
  - affiche uniquement les items du panier
  - permet modifier qty, supprimer, save for later
  - applique un code promo simple
  - crée un lien whatsapp pré-rempli pour checkout
  - met à jour badge #cartCount si présent
*/

const DATA_URL = "../../data/produits.json";
const CART_KEY = "cart_v1";
const SAVED_KEY = "saved_v1";

const cartBody = document.getElementById("cartBody");
const cartTable = document.getElementById("cartTable");
const emptyMessage = document.getElementById("emptyMessage");
const subtotalEl = document.getElementById("subtotal");
const discountEl = document.getElementById("discount");
const shippingEl = document.getElementById("shipping");
const totalEl = document.getElementById("total");
const checkoutBtn = document.getElementById("checkoutBtn");
const continueBtn = document.getElementById("continueBtn");
const upsellGrid = document.getElementById("upsellGrid");
const savedList = document.getElementById("savedList");
const savedItemsEl = document.getElementById("savedItems");
const promoBox = document.getElementById("promoBox");
const togglePromo = document.getElementById("togglePromo");
const applyPromo = document.getElementById("applyPromo");
const promoInput = document.getElementById("promoInput");
const promoMsg = document.getElementById("promoMsg");
const toast = document.getElementById("toast");
const cartCountBadge = document.getElementById("cartCountBadge");

let PRODUCTS = [];
let CART = []; // items: { productId, qty, variants? }
let SAVED = [];
let SHIPPING_FEE = 2500;
let APPLIED_PROMO = null;
const PROMOS = {
  "TONGA10": { type: "percent", value: 10 },
  "FREEDEL": { type: "shipping", value: 1 }
};

// utils
const format = n => (Number.isFinite(Number(n)) ? Number(n).toLocaleString() + " FCFA" : "—");
const resolveImage = (imgPath) => {
  if (!imgPath) return "../../img/placeholder.jpg";
  if (/^(https?:|\/|..\/)/.test(imgPath)) return imgPath;
  return "../../" + imgPath;
};

function readCart(){
  try { CART = JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch(e){ CART = []; }
  try { SAVED = JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"); } catch(e){ SAVED = []; }
}

function writeCart(){
  localStorage.setItem(CART_KEY, JSON.stringify(CART));
  updateBadge();
}

function writeSaved(){ localStorage.setItem(SAVED_KEY, JSON.stringify(SAVED)); }

function updateBadge(){
  const count = CART.reduce((s,i)=>s + (Number(i.qty)||0), 0);
  const el = document.querySelector("#cartCount") || cartCountBadge;
  if (el){
    el.style.display = count ? "inline-block" : "none";
    el.textContent = count;
  }
}

// show toast if sessionStorage.lastAdded exists
function showSessionAddedToast(){
  try {
    const last = sessionStorage.getItem("lastAdded");
    if (last){
      showToast(`Ajouté au panier : ${last}`);
      sessionStorage.removeItem("lastAdded");
      updateBadge();
    }
  } catch(e){}
}

function showToast(msg, timeout=2500){
  if(!toast) return;
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(()=> toast.style.display = "none", timeout);
}

// fetch products
async function loadProducts(){
  try{
    const r = await fetch(DATA_URL);
    const j = await r.json();
    PRODUCTS = Array.isArray(j) ? j : (j.products || []);
  }catch(e){
    console.error("Erreur chargement produits:", e);
    PRODUCTS = [];
  }
}

// render cart table
function renderCart(){
  readCart();
  cartBody.innerHTML = "";
  if (!CART.length) {
    cartTable.style.display = "none";
    emptyMessage.style.display = "block";
  } else {
    cartTable.style.display = "";
    emptyMessage.style.display = "none";
  }

  let subtotal = 0;

  CART.forEach((it, idx) => {
    const p = PRODUCTS.find(x => String(x.id) === String(it.productId)) || {};
    const title = p.title || "Produit";
    const img = resolveImage(p.images && p.images[0]);
    const price = Number(p.price) || 0;
    const rowSubtotal = (price * (Number(it.qty)||0));
    subtotal += rowSubtotal;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <div class="product-mini">
          <img src="${img}" alt="${title}" />
          <div>
            <div class="product-title">${title}</div>
            <div class="small muted">${p.category||''} ${it.variants? '· '+JSON.stringify(it.variants): ''}</div>
          </div>
        </div>
      </td>
      <td>${format(price)}</td>
      <td>
        <div class="qty-controls" data-idx="${idx}">
          <button class="qty-minus">−</button>
          <input class="qty-input" type="number" min="1" value="${it.qty}" />
          <button class="qty-plus">+</button>
        </div>
      </td>
      <td>${format(rowSubtotal)}</td>
      <td>
        <button class="link-btn remove" data-idx="${idx}">Supprimer</button>
        <br/>
        <button class="link-btn save" data-idx="${idx}">Enregistrer</button>
      </td>
    `;
    cartBody.appendChild(tr);
  });

  // attach events
  document.querySelectorAll(".qty-controls").forEach(ctrl=>{
    const idx = Number(ctrl.dataset.idx);
    const input = ctrl.querySelector(".qty-input");
    ctrl.querySelector(".qty-minus").onclick = ()=>{
      input.value = Math.max(1, Number(input.value||1)-1);
      CART[idx].qty = Number(input.value);
      writeCart();
      renderCart();
    };
    ctrl.querySelector(".qty-plus").onclick = ()=>{
      input.value = Number(input.value||1)+1;
      CART[idx].qty = Number(input.value);
      writeCart();
      renderCart();
    };
    input.onchange = ()=>{
      const v = Math.max(1, Number(input.value||1));
      input.value = v;
      CART[idx].qty = v;
      writeCart();
      renderCart();
    };
  });

  document.querySelectorAll(".remove").forEach(btn=>{
    btn.onclick = ()=>{
      const i = Number(btn.dataset.idx);
      CART.splice(i,1);
      writeCart();
      renderCart();
      showToast("Article supprimé du panier");
    };
  });

  document.querySelectorAll(".save").forEach(btn=>{
    btn.onclick = ()=>{
      const i = Number(btn.dataset.idx);
      const item = CART.splice(i,1)[0];
      SAVED.push(item);
      writeCart();
      writeSaved();
      renderSaved();
      renderCart();
      showToast("Article enregistré pour plus tard");
    };
  });

  // totals
  let discount = 0;
  if (APPLIED_PROMO){
    if (APPLIED_PROMO.type === "percent") discount = Math.round(subtotal * (APPLIED_PROMO.value/100));
    if (APPLIED_PROMO.type === "shipping") SHIPPING_FEE = 0;
  }
  const total = subtotal - discount + SHIPPING_FEE;
  subtotalEl.textContent = format(subtotal);
  discountEl.textContent = format(discount);
  shippingEl.textContent = format(SHIPPING_FEE);
  totalEl.textContent = format(total);

  // render upsell (some random products)
  renderUpsell();
  updateBadge();
}

// saved list
function renderSaved(){
  try{
    const saved = SAVED || [];
    savedItemsEl.innerHTML = "";
    if (!saved.length){ savedList.style.display = "none"; return; }
    savedList.style.display = "block";
    saved.forEach((it, i)=>{
      const p = PRODUCTS.find(x => String(x.id) === String(it.productId)) || {};
      const el = document.createElement("div");
      el.className = "saved-item";
      el.innerHTML = `<div style="display:flex;gap:10px;align-items:center;margin-bottom:8px">
        <img src="${resolveImage(p.images?.[0])}" style="width:64px;height:64px;object-fit:cover;border-radius:6px"/>
        <div><div style="font-weight:600">${p.title||'Produit'}</div>
          <div class="small muted">${format(p.price)}</div>
          <div style="margin-top:6px"><button class="link-btn saved-add" data-idx="${i}">Ajouter au panier</button> · <button class="link-btn saved-remove" data-idx="${i}">Supprimer</button></div>
        </div>
      </div>`;
      savedItemsEl.appendChild(el);
    });

    document.querySelectorAll(".saved-add").forEach(btn=>{
      btn.onclick = ()=>{
        const i = Number(btn.dataset.idx);
        const it = SAVED.splice(i,1)[0];
        CART.push(it);
        writeCart(); writeSaved();
        renderSaved(); renderCart();
        showToast("Article ajouté au panier");
      };
    });
    document.querySelectorAll(".saved-remove").forEach(btn=>{
      btn.onclick = ()=>{
        const i = Number(btn.dataset.idx);
        SAVED.splice(i,1);
        writeSaved(); renderSaved();
      };
    });
  }catch(e){ console.error(e) }
}

// promos
togglePromo.onclick = ()=> promoBox.style.display = (promoBox.style.display === "none" || promoBox.style.display === "") ? "flex" : "none";
applyPromo.onclick = ()=>{
  const code = (promoInput.value || "").trim().toUpperCase();
  if (!code) return;
  if (!PROMOS[code]) { promoMsg.textContent = "Code invalide."; promoMsg.style.color = "crimson"; return; }
  APPLIED_PROMO = PROMOS[code];
  promoMsg.textContent = "Code appliqué.";
  promoMsg.style.color = "green";
  renderCart();
};

// upsell: show 4 random items not in cart
function renderUpsell(){
  if (!upsellGrid) return;
  upsellGrid.innerHTML = "";
  const chosen = (PRODUCTS || []).filter(p => !CART.find(c=>String(c.productId)===String(p.id))).slice(0,8);
  for (let i=0;i<Math.min(4, chosen.length); i++){
    const p = chosen[i];
    const div = document.createElement("div");
    div.className = "product";
    div.innerHTML = `<div style="padding:8px"><img src="${resolveImage(p.images?.[0])}" style="width:100%;height:120px;object-fit:cover;border-radius:8px"/><div style="margin-top:8px;font-weight:600">${p.title}</div><div class="small muted">${format(p.price)}</div><div style="margin-top:8px"><button class="btn small" data-id="${p.id}">Ajouter</button></div></div>`;
    upsellGrid.appendChild(div);
  }
  upsellGrid.querySelectorAll("button[data-id]").forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.dataset.id;
      const existing = CART.find(c=>String(c.productId)===String(id));
      if (existing) existing.qty = (existing.qty||0) + 1; else CART.push({ productId: id, qty: 1 });
      writeCart(); renderCart();
      sessionStorage.setItem("lastAdded", (PRODUCTS.find(x=>String(x.id)===String(id))||{}).title || "Article");
      showToast("Ajouté au panier");
    };
  });
}

// checkout -> WhatsApp
checkoutBtn.onclick = ()=>{
  // build message summary
  if (!CART.length) { alert("Votre panier est vide."); return; }
  let msg = "Bonjour, je souhaite commander :%0A";
  CART.forEach(it=>{
    const p = PRODUCTS.find(x=>String(x.id)===String(it.productId)) || {};
    msg += `- ${p.title || 'Produit'} (x${it.qty}): ${format(p.price)}%0A`;
  });
  msg += `%0ATotal: ${totalEl.textContent}%0AMerci.`;
  // your number in international format (change)
  const phone = "24177067949";
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
};

// continue shopping
continueBtn.onclick = ()=> location.href = "../../index.html";

// init
(async function init(){
  await loadProducts();
  readCart();
  renderSaved();
  renderCart();
  showSessionAddedToast();
  document.getElementById("year").textContent = new Date().getFullYear();
})();
