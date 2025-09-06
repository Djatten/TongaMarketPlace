// scriptIndex.js
"use strict";

/**
 * scriptIndex.js — version complète avec affichage aléatoire des produits
 * - Mélange (shuffle) les produits une fois au chargement et les affiche au hasard.
 * - Conserve la logique Deals / Catégories / Autocomplete / Recherche.
 */

/* ---------------------
   Variables globales
   --------------------- */
let PRODUCTS = [];           // Produits classiques (depuis data/produits.json)
let SHUFFLED_PRODUCTS = [];  // Produits mélangés (une fois par chargement)
let DEALS = [];              // Produits en promo

/* ------- DOM ------- */
const catsGrid    = document.getElementById("CatsGrid");
const dealsGrid   = document.getElementById("dealsGrid");
const recGrid     = document.getElementById("recGrid");
const searchInput = document.getElementById("searchInput");
const searchBtn   = document.getElementById("searchBtn");
const yearEl      = document.getElementById("year");

/* ------- Autocomplétion (création si input existe) ------- */
let autoCompleteContainer = null;
if (searchInput && searchInput.parentNode) {
  autoCompleteContainer = document.createElement("div");
  autoCompleteContainer.className = "autocomplete-container";
  searchInput.parentNode.appendChild(autoCompleteContainer);
}

/* ------- Helpers ------- */
const safeImg = (p) => {
  const src = p && Array.isArray(p.images) && p.images[0] ? p.images[0] : "";
  return src || "img/placeholder.jpg";
};
const safePrice = (n) => {
  const num = Number(n);
  return Number.isFinite(num) ? num.toLocaleString() : "—";
};

// remplace l'ancienne productCardHTML mais garde le rendu précédent
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

/**
 * shuffle (Fisher-Yates)
 * Retourne une NOUVELLE array mélangée; ne modifie pas l'array d'origine.
 */
function shuffle(arr) {
  const a = Array.isArray(arr) ? arr.slice() : [];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------------------
   Chargement produits
   --------------------- */
async function loadProducts() {
  try {
    const res = await fetch("data/produits.json");
    const data = await res.json();
    PRODUCTS = Array.isArray(data) ? data : (data.products || []);
    console.log("[PRODUCTS] chargés:", PRODUCTS.length);

    // --- mélange une fois au chargement de la page ---
    SHUFFLED_PRODUCTS = shuffle(PRODUCTS);

    await loadDeals(); // charge la base Deals séparée (asynchrone)

    displayCategories();
    displayDealsAndRecs();
    populateCategoryDropdown();
  } catch (err) {
    console.error("Erreur chargement produits:", err);
  }
}

/* ---------------------
   Chargement deals
   - 1) essais data/Deals.json
   - 2) fallback: data/Deals.js qui définit window.DEALS = [...]
   --------------------- */
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

/* ---------------------
   Catégories (grille page d'accueil)
   --------------------- */
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

/* ---------------------
   Deals & Recommandés
   - Utilise SHUFFLED_PRODUCTS pour afficher les produits aléatoires
   --------------------- */
function displayDealsAndRecs() {
  if (dealsGrid) dealsGrid.innerHTML = "";
  if (recGrid)   recGrid.innerHTML   = "";

  // Deals (jusqu'à 6) — on conserve l'ordre des deals tel quel.
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

  // Recommandés / Tous les articles (ex : 100) — on utilise la version mélangée pour la découverte
  if (recGrid) {
    const source = (SHUFFLED_PRODUCTS && SHUFFLED_PRODUCTS.length) ? SHUFFLED_PRODUCTS : PRODUCTS;
    // Si tu veux vraiment garantir une rotation plus large, augmente la slice
    source.slice(0, 100).forEach(p => {
      recGrid.insertAdjacentHTML("beforeend", productCardHTML(p));
    });
  }
}

/* ---------------------
   Autocomplétion + Recherche live
   --------------------- */
if (searchInput) {
  // re-créer le container si non présent (sécurité)
  if (!autoCompleteContainer && searchInput.parentNode) {
    autoCompleteContainer = document.createElement("div");
    autoCompleteContainer.className = "autocomplete-container";
    searchInput.parentNode.style.position = "relative";
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

/* ------- Bouton recherche (un seul listener, exécute la recherche) ------- */
if (searchBtn && searchInput) {
  searchBtn.addEventListener("click", () => {
    const query = searchInput.value.toLowerCase().trim();
    if (!query) return;
    const results = (PRODUCTS || []).filter(p => (p.title || "").toLowerCase().includes(query));
    showSearchResults(results);
  });
}

/* ---------------------
   Fonction pour afficher résultats
   --------------------- */
function showSearchResults(items) {
  if (!recGrid) return;
  recGrid.innerHTML = "";
  if (!items || !items.length) {
    recGrid.innerHTML = `<div class="muted">Aucun résultat trouvé.</div>`;
    return;
  }
  items.forEach(p => recGrid.insertAdjacentHTML("beforeend", productCardHTML(p)));
}

/* ---------------------
   Populate category dropdown (simple utilitaire)
   - Crée/actualise un <select id="categoryDropdown"> si présent
   --------------------- */
function populateCategoryDropdown() {
  const sel = document.getElementById("categoryDropdown");
  if (!sel) return;
  const cats = [...new Set(PRODUCTS.map(p => p.category).filter(Boolean))];
  sel.innerHTML = `<option value="">Toutes catégories</option>`;
  cats.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    sel.appendChild(opt);
  });
}

/* ---------------------
   Année
   --------------------- */
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------------------
   Slides simple (si présent)
   --------------------- */
const slides = document.querySelectorAll(".slide");
if (slides && slides.length) {
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

  // Changement toutes les 10 secondes
  setInterval(nextSlide, 10000);
}

/* ---------------------
   Init : charger les produits
   --------------------- */
loadProducts();
