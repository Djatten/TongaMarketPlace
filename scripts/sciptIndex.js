// scriptIndex.js
"use strict";

let PRODUCTS = [];  // Produits classiques
let DEALS = [];     // Produits en promo

// ------- DOM -------
const catsGrid   = document.getElementById("CatsGrid");
const dealsGrid  = document.getElementById("dealsGrid");
const recGrid    = document.getElementById("recGrid");
const searchInput= document.getElementById("searchInput");
const searchBtn  = document.getElementById("searchBtn");
const yearEl     = document.getElementById("year");

// ------- Autocomplétion (création si input existe) -------
let autoCompleteContainer = null;
if (searchInput && searchInput.parentNode) {
  autoCompleteContainer = document.createElement("div");
  autoCompleteContainer.className = "autocomplete-container";
  searchInput.parentNode.appendChild(autoCompleteContainer);
}

// ------- Helpers -------
const safeImg = (p) => {
  const src = p && Array.isArray(p.images) && p.images[0] ? p.images[0] : "";
  return src || "img/placeholder.jpg";
};
const safePrice = (n) => {
  const num = Number(n);
  return Number.isFinite(num) ? num.toLocaleString() : "—";
};
// remplace l'ancienne productCardHTML
const productCardHTML = (p) => {
  const img = (p && Array.isArray(p.images) && p.images[0]) ? p.images[0] : 'img/placeholder.jpg';
  const id = encodeURIComponent(p?.id ?? '');
  return `
  <div class="product" data-id="${p?.id ?? ''}">
    <a class="product-link" href="page/produit/product.html?id=${id}" title="${(p?.title||'Produit')}">
      <div class="product-image-wrap">
        <img src="${img}" alt="${(p?.title || 'Produit')}" />
      </div>
      <div class="product-title">${p?.title || "Sans titre"}</div>
    </a>

    <div class="product-prices">
      ${p?.oldPrice ? `<div class="oldprice">${safePrice(p.oldPrice)} FCFA</div>` : ''}
      <div class="price">${safePrice(p?.price)} FCFA</div>
    </div>
  </div>
  `;
};

// ------- Chargement produits -------
async function loadProducts() {
  try {
    const res = await fetch("data/produits.json");
    const data = await res.json();
    PRODUCTS = Array.isArray(data) ? data : (data.products || []);
    console.log("[PRODUCTS] chargés:", PRODUCTS.length);

    await loadDeals(); // charge la base Deals séparée

    displayCategories();
    displayDealsAndRecs();
    populateCategoryDropdown();
  } catch (err) {
    console.error("Erreur chargement produits:", err);
  }
}

// ------- Chargement deals (JSON puis fallback JS) -------
async function loadDeals() {
  // 1) Essayer data/Deals.json
  try {
    const res = await fetch("data/Deals.json", { cache: "no-cache" });
    if (res.ok) {
      const data = await res.json();
      DEALS = Array.isArray(data) ? data : (data.deals || []);
      console.log("[DEALS] via JSON:", DEALS.length);
      if (DEALS.length) return;
    } else {
      console.warn("[DEALS] JSON non trouvé (status:", res.status, ")");
    }
  } catch (e) {
    console.warn("[DEALS] échec JSON:", e);
  }

  // 2) Fallback: data/Deals.js doit définir window.DEALS = [...]
  try {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "data/Deals.js";
      s.onload = () => resolve();
      s.onerror = (e) => reject(e);
      document.head.appendChild(s);
    });
    DEALS = (window.DEALS || window.deals || []);
    console.log("[DEALS] via JS:", DEALS.length);
  } catch (e) {
    console.error("[DEALS] échec JS:", e);
  }
}

// ------- Catégories (grille page d'accueil) -------
function displayCategories() {
  if (!catsGrid) return;
  const categories = [...new Set(PRODUCTS.map(p => p.category).filter(Boolean))].slice(0, 16);
  catsGrid.innerHTML = "";
  categories.forEach(cat => {
    const a = document.createElement("a");
    a.className = "cat";
    a.href = `page/produit/categories.html?cat=${encodeURIComponent(cat)}`;
    a.innerHTML = `
      <img src="img/logo/${cat}.jpg" alt="${cat}" />
      <div>${cat}</div>
    `;
    catsGrid.appendChild(a);
  });
}

// ------- Deals & Recommandés -------
function displayDealsAndRecs() {
  if (dealsGrid) dealsGrid.innerHTML = "";
  if (recGrid)   recGrid.innerHTML   = "";

  // Deals (jusqu'à 6)
  if (dealsGrid) {
    if (Array.isArray(DEALS) && DEALS.length) {
      DEALS.slice(0, 6).forEach(p => {
        dealsGrid.insertAdjacentHTML("beforeend", productCardHTML(p));
      });
    } else {
      dealsGrid.innerHTML = `<div class="muted">Aucun deal pour le moment.</div>`;
      console.warn("[DEALS] Vide : vérifie data/Deals.json ou data/Deals.js");
    }
  }

  // Recommandés / Tous les articles (par ex. 12)
  if (recGrid) {
    (PRODUCTS || []).slice(0, 100).forEach(p => {
      recGrid.insertAdjacentHTML("beforeend", productCardHTML(p));
    });
  }
}


// ------- Autocomplétion + Recherche live -------
if (searchInput) {
  // créer le container si pas déjà
  if (!autoCompleteContainer) {
    autoCompleteContainer = document.createElement("div");
    autoCompleteContainer.className = "autocomplete-container";
    searchInput.parentNode.style.position = "relative"; // important pour position absolute
    searchInput.parentNode.appendChild(autoCompleteContainer);
  }

  searchInput.addEventListener("input", function () {
    const query = this.value.toLowerCase().trim();
    autoCompleteContainer.innerHTML = "";

    if (!query) {
      displayDealsAndRecs(); // reset la grille si vide
      return;
    }

    const results = (PRODUCTS || []).filter(p => (p.title || "").toLowerCase().includes(query));

    // suggestions (max 7) sous la barre
    results.slice(0, 7).forEach(p => {
      const div = document.createElement("div");
      div.className = "autocomplete-item";
      div.textContent = p.title;
      div.addEventListener("click", () => {
        searchInput.value = p.title;
        autoCompleteContainer.innerHTML = "";
        showSearchResults([p]);
      });
      autoCompleteContainer.appendChild(div);
    });

    // afficher résultats dans la grille
    showSearchResults(results.slice(0, 12)); // max 12
  });
}

// ------- Bouton recherche -------
if (searchBtn && searchInput) {
  searchBtn.addEventListener("click", () => {
    const query = searchInput.value.toLowerCase().trim();
    if (!query) return;
    const results = (PRODUCTS || []).filter(p => (p.title || "").toLowerCase().includes(query));
    showSearchResults(results);
  });
}

// ------- Fonction pour afficher résultats -------
function showSearchResults(items) {
  if (!recGrid) return;
  recGrid.innerHTML = "";
  if (!items.length) {
    recGrid.innerHTML = `<div class="muted">Aucun résultat trouvé.</div>`;
    return;
  }
  items.forEach(p => recGrid.insertAdjacentHTML("beforeend", productCardHTML(p)));
}


// ------- Recherche bouton -------
if (searchBtn && searchInput) {
  searchBtn.addEventListener("click", () => {
    alert("Recherche à implémenter pour: " + searchInput.value);
  });
}


// ------- Année -------
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ------- Init -------
loadProducts();

  const slides = document.querySelectorAll(".slide");
  let index = 0;

  function showSlide(n) {
    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === n);
    });
  }

  function nextSlide() {
    index = (index + 1) % slides.length; // boucle infinie
    showSlide(index);
  }

  // Changement toutes les 3 secondes
  setInterval(nextSlide, 3000);