// scriptIndex.optimized.js
"use strict";

/* ---------------------
   Variables globales
   --------------------- */
let PRODUCTS = [];
let SHUFFLED_PRODUCTS = [];
let DEALS = [];

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

// safeImg : retourne la première image ou placeholder
const safeImg = (p) => {
  const src = p && Array.isArray(p.images) && p.images[0] ? p.images[0] : "";
  return src || "img/placeholder.jpg";
};

// safePrice : formatage
const safePrice = (n) => {
  const num = Number(n);
  return Number.isFinite(num) ? num.toLocaleString() : "—";
};

/**
 * buildSrcsetCandidates(url)
 * Construit des candidates de srcset à partir d'une URL d'origine.
 *
 * IMPORTANT : pour que ces URL existent, TU DOIS :
 *  - soit générer côté serveur des images nommées "basename-400.webp", "basename-800.avif", etc.
 *  - soit utiliser un Image CDN (ex: Cloudinary/Imgix/ImageKit) et remplacer `makeCdnUrl(url, w, fmt)`
 *    pour renvoyer l'URL avec params (ex: url + '?w=400&fm=webp').
 *
 * Le code est tolérant : si tu n'as pas de variantes, l'image de base sera chargée via data-src.
 */
function makeCdnUrl(originalUrl, width, fmt) {
  // Option 1 (fichiers générés côté serveur) : remplace extension et ajoute suffixe -{width}.{fmt}
  try {
    // example: "/uploads/p-123.jpg" -> "/uploads/p-123-400.webp"
    const url = new URL(originalUrl, location.origin); // supporte relative + absolute
    const path = url.pathname;
    const dot = path.lastIndexOf('.');
    if (dot === -1) return originalUrl;
    const base = path.slice(0, dot);
    return `${base}-${width}.${fmt}`;
  } catch (e) {
    return originalUrl;
  }

  // Option 2 (Image CDN) -> replace by your CDN param format:
  // return `${originalUrl}?w=${width}&fm=${fmt}`;
}

// génère une string srcset pour un format donné
function buildSrcset(originalUrl, widths = [320, 480, 768, 1024], fmt = 'webp') {
  return widths.map(w => `${makeCdnUrl(originalUrl, w, fmt)} ${w}w`).join(', ');
}

/* ---------------------
   productCardHTML (optimisée pour images)
   - Utilise <picture> + sources avec data-srcset (lazy)
   - img a data-src / data-srcset et classe "lazy"
   --------------------- */
const productCardHTML = (p) => {
  const orig = safeImg(p);
  const title = (p?.title || 'Produit').replace(/"/g, '&quot;');
  const id = encodeURIComponent(p?.id ?? '');
  // width/height par défaut (à remplacer si tes données contiennent des tailles réelles)
  const w = p?.imageWidth || 400;
  const h = p?.imageHeight || 300;
  // placeholder : si ton objet produit contient un LQIP (base64) => p.placeholder
  const placeholder = p?.placeholder || "img/placeholder.jpg";

  // sizes : adapte selon ton layout ; ici on suppose grid avec 33vw pour desktop
  const sizes = "(max-width:600px) 100vw, 33vw";

  // build srcsets (AVIF, WebP) — nécessite variantes disponibles
  const avifSrcset = buildSrcset(orig, [320, 480, 768, 1024], 'avif');
  const webpSrcset = buildSrcset(orig, [320, 480, 768, 1024], 'webp');
  // fallback src (visible si JS absent / lazy fallback)
  const fallbackSrc = makeCdnUrl(orig, 768, orig.split('.').pop());

  return `
  <div class="product" data-id="${p?.id ?? ''}">
    <a class="product-link" href="page/produit/product.html?id=${id}" title="${title}">
      <div class="product-image-wrap" style="aspect-ratio: ${w}/${h};">
        <picture>
          <source type="image/avif" data-srcset="${avifSrcset}" sizes="${sizes}">
          <source type="image/webp" data-srcset="${webpSrcset}" sizes="${sizes}">
          <img
            class="lazy product-image"
            src="${placeholder}"
            data-src="${fallbackSrc}"
            alt="${title}"
            width="${w}" height="${h}"
            decoding="async"
            loading="lazy"
            style="filter: blur(8px); transition: filter .3s ease, transform .3s ease;"
          />
        </picture>
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

/* ---------------------
   IntersectionObserver lazy loader (réutilisable)
   - active les data-src / data-srcset quand l'image approche du viewport
   --------------------- */
let lazyObserver = null;
function initLazyLoading() {
  // Disconnect ancien observer si existant (prevent double observers)
  if (lazyObserver) {
    try { lazyObserver.disconnect(); } catch (e) {}
    lazyObserver = null;
  }

  const lazyImgs = Array.from(document.querySelectorAll('img.lazy'));
  if (!lazyImgs.length) return;

  if ('IntersectionObserver' in window) {
    lazyObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          // find picture parent and source tags
          const picture = img.closest('picture');
          if (picture) {
            const sources = picture.querySelectorAll('source');
            sources.forEach(s => {
              const ds = s.getAttribute('data-srcset');
              if (ds) s.setAttribute('srcset', ds);
            });
          }
          // set img srcset if data-srcset exists on img (not used here, but safe)
          const dsImg = img.getAttribute('data-srcset');
          if (dsImg) img.setAttribute('srcset', dsImg);

          // finally set src
          const ds = img.getAttribute('data-src');
          if (ds) img.src = ds;

          // on load -> remove blur
          img.addEventListener('load', () => {
            img.style.filter = 'none';
            img.style.transform = 'none';
            img.classList.remove('lazy');
          }, { once: true });

          obs.unobserve(img);
        }
      });
    }, { rootMargin: '300px 0px', threshold: 0.01 });

    lazyImgs.forEach(i => lazyObserver.observe(i));
  } else {
    // fallback : charger immédiatement
    lazyImgs.forEach(img => {
      const picture = img.closest('picture');
      if (picture) {
        picture.querySelectorAll('source').forEach(s => {
          const ds = s.getAttribute('data-srcset');
          if (ds) s.setAttribute('srcset', ds);
        });
      }
      const ds = img.getAttribute('data-src');
      if (ds) img.src = ds;
      img.style.filter = 'none';
      img.classList.remove('lazy');
    });
  }
}

/* ---------------------
   shuffle (Fisher-Yates)
   --------------------- */
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

    SHUFFLED_PRODUCTS = shuffle(PRODUCTS);

    await loadDeals();

    displayCategories();
    displayDealsAndRecs();
    populateCategoryDropdown();

    // initialise le lazy-loading sur les images affichées
    initLazyLoading();
  } catch (err) {
    console.error("Erreur chargement produits:", err);
  }
}

/* ---------------------
   Chargement deals (inchangé)
   --------------------- */
async function loadDeals() {
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
   Categories (grille page d'accueil)
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
   Deals & Recommandés (utilise SHUFFLED_PRODUCTS)
   --------------------- */
function displayDealsAndRecs() {
  if (dealsGrid) dealsGrid.innerHTML = "";
  if (recGrid)   recGrid.innerHTML   = "";

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

  if (recGrid) {
    const source = (SHUFFLED_PRODUCTS && SHUFFLED_PRODUCTS.length) ? SHUFFLED_PRODUCTS : PRODUCTS;
    source.slice(0, 100).forEach(p => {
      recGrid.insertAdjacentHTML("beforeend", productCardHTML(p));
    });
  }

  // ré-init le lazy-loading pour les nouvelles images
  initLazyLoading();
}

/* ---------------------
   Autocomplétion + Recherche live
   --------------------- */
if (searchInput) {
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
      displayDealsAndRecs();
      return;
    }

    const results = (PRODUCTS || []).filter(p => (p.title || "").toLowerCase().includes(query));

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

    showSearchResults(results.slice(0, 12));
  });
}

/* ------- Bouton recherche ------- */
if (searchBtn && searchInput) {
  searchBtn.addEventListener("click", () => {
    const query = searchInput.value.toLowerCase().trim();
    if (!query) return;
    const results = (PRODUCTS || []).filter(p => (p.title || "").toLowerCase().includes(query));
    showSearchResults(results);
  });
}

/* ---------------------
   Function: showSearchResults
   --------------------- */
function showSearchResults(items) {
  if (!recGrid) return;
  recGrid.innerHTML = "";
  if (!items || !items.length) {
    recGrid.innerHTML = `<div class="muted">Aucun résultat trouvé.</div>`;
    return;
  }
  items.forEach(p => recGrid.insertAdjacentHTML("beforeend", productCardHTML(p)));

  // ré-init lazy load après insertion
  initLazyLoading();
}

/* ---------------------
   Populate category dropdown
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
   Year
   --------------------- */
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------------------
   Slides simple (si présent)
   --------------------- */
const slides = document.querySelectorAll(".slide");
if (slides && slides.length) {
  let index = 0;
  function showSlide(n) {
    slides.forEach((slide, i) => slide.classList.toggle("active", i === n));
  }
  function nextSlide() {
    index = (index + 1) % slides.length;
    showSlide(index);
  }
  setInterval(nextSlide, 10000);
}

/* ---------------------
   Init : charger les produits
   --------------------- */
loadProducts();
