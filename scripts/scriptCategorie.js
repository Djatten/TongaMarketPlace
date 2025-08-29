// categories.js
// --------- Config / état ----------
const DATA_URL = "../../data/produits.json";
let PRODUCTS = [];
let SHUFFLED_PRODUCTS = [];

// --------- DOM ----------
const productGrid    = document.getElementById("productGrid");
const categoryTitle  = document.getElementById("categoryTitle");
const categoryDesc   = document.getElementById("categoryDesc");
const categoryList   = document.getElementById("categoryList");
const burger         = document.getElementById("burger");
const sidebar        = document.getElementById("sidebar");
const searchBtn      = document.getElementById("searchBtn");
const searchBar      = document.getElementById("searchBar");
const header         = document.getElementById("header");

// Préfixe pour les chemins d'images (garde le même que ton projet)
const IMG_PREFIX = "../../";

// --------- Helpers ----------
function getSelectedCategory() {
    const params = new URLSearchParams(location.search);
    return params.get("cat");
}
function safePrice(n) {
    const num = Number(n);
    return Number.isFinite(num) ? num.toLocaleString() : "—";
}
function safeImgPath(p) {
    // retourne un chemin d'image sûr (préfixe + placeholder si absent)
    if (p && Array.isArray(p.images) && p.images[0]) return `${IMG_PREFIX}${p.images[0]}`;
    return `${IMG_PREFIX}img/placeholder.jpg`;
}

/**
 * shuffle (Fisher-Yates)
 * retourne une NOUVELLE array mélangée; ne modifie pas l'array d'origine.
 */
function shuffle(arr) {
    const a = Array.isArray(arr) ? arr.slice() : [];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// --------- Chargement ----------
async function loadProducts() {
    try {
        const r = await fetch(DATA_URL);
        const j = await r.json();
        PRODUCTS = Array.isArray(j) ? j : (j.products || []);
        // mélange une fois au chargement : ordre différent à chaque reload
        SHUFFLED_PRODUCTS = shuffle(PRODUCTS);

        displayCategoryProduct();
        displaySidebarCategories();
    } catch (e) {
        console.error("Erreur chargement produits:", e);
        if (productGrid) productGrid.innerHTML = "<p>Impossible de charger les produits.</p>";
    }
}

// --------- AFFICHAGE PRODUITS ----------
function displayCategoryProduct() {
    if (!productGrid) return;

    const cat = getSelectedCategory();
    let items = [];

    if (cat?.trim()) {
        // si une catégorie est sélectionnée, on filtre puis on mélange (découverte dans la catégorie)
        items = shuffle(PRODUCTS.filter(p => (p.category || "").toLowerCase() === cat.toLowerCase()));
        if (categoryTitle) categoryTitle.textContent = cat;
        if (categoryDesc)  categoryDesc.textContent  = `Découvrez nos produits dans la catégorie « ${cat} ».`;
    } else {
        // page "Toutes les catégories" : on utilise SHUFFLED_PRODUCTS (déjà mélangé)
        items = SHUFFLED_PRODUCTS.slice(0, 12);
        if (categoryTitle) categoryTitle.textContent = "Toutes les catégories";
        if (categoryDesc)  categoryDesc.textContent  = "Découvrez nos univers et trouvez ce que vous cherchez.";
    }

    productGrid.innerHTML = "";

    if (!items.length) {
        productGrid.innerHTML = "<p>Aucun produit trouvé pour cette catégorie.</p>";
        return;
    }

    // Pour de meilleures perf tu peux remplacer par DocumentFragment si nécessaire
    items.forEach(p => {
        const productHTML = `
    <a href="product.html?id=${encodeURIComponent(p.id)}" class="product">
        <img src="${safeImgPath(p)}" alt="${(p.title || "Produit")}" />
        <div class="product-title">${p.title || "Sans titre"}</div>
        ${p.oldPrice ? `<div class="oldprice">${safePrice(p.oldPrice)} FCFA</div>` : ""}
        <div class="price">${safePrice(p.price)} FCFA</div>
    </a>
    `;
        productGrid.insertAdjacentHTML("beforeend", productHTML);
    });
}

// --------- AFFICHAGE CATEGORIES (sidebar) ----------
function displaySidebarCategories() {
    if (!categoryList) return;

    const categories = [...new Set(PRODUCTS.map(p => p.category).filter(Boolean))].sort();

    categoryList.innerHTML = "";

    categories.forEach(cat => {
        const li = document.createElement("li");
        li.textContent = cat;
        li.classList.add("category-item");
        li.style.cursor = "pointer";
        li.addEventListener("click", () => {
            // fermer le drawer si présent (meilleur UX mobile)
            if (sidebar && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                const overlay = document.querySelector('.overlay');
                if (overlay) overlay.classList.remove('active');
                document.documentElement.style.overflow = '';
            }
            window.location.href = `categories.html?cat=${encodeURIComponent(cat)}`;
        });
        categoryList.appendChild(li);
    });
}

// --------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
    loadProducts();

    // --- Sidebar / burger toggle robuste ---
    if (burger && sidebar) {
        // ensure sidebar has an id for aria-controls
        if (!sidebar.id) sidebar.id = 'sidebar';

        // créer overlay s'il n'existe pas (utile pour fermer en cliquant dehors)
        let overlay = document.querySelector('.overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'overlay';
            document.body.appendChild(overlay);
        }

        // initial accessibility state
        burger.setAttribute('aria-controls', sidebar.id);
        burger.setAttribute('aria-expanded', 'false');

        const openSidebar = () => {
            sidebar.classList.add('active');
            overlay.classList.add('active');
            burger.setAttribute('aria-expanded', 'true');
            // verrouiller scroll si besoin
            document.documentElement.style.overflow = 'hidden';
        };

        const closeSidebar = () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            burger.setAttribute('aria-expanded', 'false');
            document.documentElement.style.overflow = '';
        };

        burger.addEventListener('click', (e) => {
            e.stopPropagation();
            if (sidebar.classList.contains('active')) closeSidebar();
            else openSidebar();
        });

        // fermer si on clique sur l'overlay
        overlay.addEventListener('click', closeSidebar);

        // fermer avec Escape
        window.addEventListener('keyup', (e) => {
            if (e.key === 'Escape') closeSidebar();
        });

        // fermer automatiquement si on redimensionne en desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) { // même breakpoint que ton CSS mobile
                closeSidebar();
            }
        });
    }

    // --- Toggle recherche (utilise classe .visible au lieu de manipuler display directement) ---
    if (searchBtn && searchBar) {
        searchBtn.addEventListener('click', () => {
            searchBar.classList.toggle('visible');
        });
    }
});

// --------- Recherche en live (autocomplétion) ----------
const searchInput = document.querySelector(".search-bar input");

// conteneur pour afficher les suggestions (crée seulement si input existe)
let autoCompleteContainer = null;
if (searchInput && searchInput.parentNode) {
    autoCompleteContainer = document.createElement("div");
    autoCompleteContainer.className = "autocomplete-container";
    searchInput.parentNode.appendChild(autoCompleteContainer);
}

if (searchInput) {
    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase().trim();
        if (!autoCompleteContainer) return;
        autoCompleteContainer.innerHTML = "";

        if (!query) {
            // remise à l'état initial : ré-affiche la grille (avec mélange initial)
            displayCategoryProduct();
            return;
        }

        const cat = getSelectedCategory();
        let items = PRODUCTS;

        // filtrer uniquement dans la catégorie courante si présente
        if (cat?.trim()) {
            items = PRODUCTS.filter(p => (p.category || "").toLowerCase() === cat.toLowerCase());
        }

        const suggestions = items
            .filter(p => (p.title || "").toLowerCase().includes(query))
            .slice(0, 5);

        suggestions.forEach(s => {
            const div = document.createElement("div");
            div.className = "autocomplete-item";
            div.textContent = s.title;
            div.style.cursor = "pointer";

            div.addEventListener("click", () => {
                searchInput.value = s.title;
                autoCompleteContainer.innerHTML = "";

                // affiche directement le produit sélectionné (vue simple)
                productGrid.innerHTML = `
                    <div class="product">
                        <img src="${safeImgPath(s)}" alt="${s.title}" />
                        <div class="product-title">${s.title}</div>
                        ${s.oldPrice ? `<div class="oldprice">${safePrice(s.oldPrice)} FCFA</div>` : ""}
                        <div class="price">${safePrice(s.price)} FCFA</div>
                    </div>
                `;
            });

            autoCompleteContainer.appendChild(div);
        });
    });
}
