// --------- Config / état ----------
const DATA_URL = "../../data/produits.json";
let PRODUCTS = [];

// --------- DOM ----------
const productGrid    = document.getElementById("productGrid");
const categoryTitle  = document.getElementById("categoryTitle");
const categoryDesc   = document.getElementById("categoryDesc");
const categoryList   = document.getElementById("categoryList");
const burger = document.getElementById("burger");
const sidebar = document.getElementById("sidebar");
const searchBtn = document.getElementById("searchBtn");
const searchBar = document.getElementById("searchBar");
const header = document.getElementById("header");
// --------- Helpers ----------
function getSelectedCategory() {
    const params = new URLSearchParams(location.search);
    return params.get("cat");
}
function safePrice(n) {
    const num = Number(n);
    return Number.isFinite(num) ? num.toLocaleString() : "—";
}

// --------- Chargement ----------
async function loadProducts() {
    try {
        const r = await fetch(DATA_URL);
        const j = await r.json();
        PRODUCTS = Array.isArray(j) ? j : (j.products || []);
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
        items = PRODUCTS.filter(p => (p.category || "").toLowerCase() === cat.toLowerCase());
        if (categoryTitle) categoryTitle.textContent = cat;
        if (categoryDesc)  categoryDesc.textContent  = `Découvrez nos produits dans la catégorie « ${cat} ».`;
    } else {
        items = PRODUCTS.slice(0, 12);
        if (categoryTitle) categoryTitle.textContent = "Toutes les catégories";
        if (categoryDesc)  categoryDesc.textContent  = "Découvrez nos univers et trouvez ce que vous cherchez.";
    }

    productGrid.innerHTML = "";

    if (!items.length) {
        productGrid.innerHTML = "<p>Aucun produit trouvé pour cette catégorie.</p>";
        return;
    }

    items.forEach(p => {
const productHTML = `
    <a href="product.html?id=${p.id}" class="product">
        <img src="../../${p.images[0]}" alt="${p.title || "Produit"}" />
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
            window.location.href = `categories.html?cat=${encodeURIComponent(cat)}`;
        });
        categoryList.appendChild(li);
    });
}

// --------- Init ----------
document.addEventListener("DOMContentLoaded", loadProducts);

burger.addEventListener("click", () => {
    if (sidebar.style.left === "-100%") {
        sidebar.style.left = "0"; // Affiche la sidebar
    } else {
        sidebar.style.left = "-100%"; // Cache la sidebar
    }
});

// --------- Recherche en live (autocomplétion) ----------
const searchInput = document.querySelector(".search-bar input");

// conteneur pour afficher les suggestions
const autoCompleteContainer = document.createElement("div");
autoCompleteContainer.className = "autocomplete-container";
searchInput.parentNode.appendChild(autoCompleteContainer);

searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase().trim();
    autoCompleteContainer.innerHTML = "";

    if (!query) return;

    const cat = getSelectedCategory();
    let items = PRODUCTS;

    // filtrer uniquement dans la catégorie courante
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

            // affiche directement le produit sélectionné
            productGrid.innerHTML = `
                <div class="product">
                    <img src="../${s.images[0]}" alt="${s.title}" />
                    <div class="product-title">${s.title}</div>
                    ${s.oldPrice ? `<div class="oldprice">${safePrice(s.oldPrice)} FCFA</div>` : ""}
                    <div class="price">${safePrice(s.price)} FCFA</div>
                </div>
            `;
        });

        autoCompleteContainer.appendChild(div);
    });
});


searchBtn.addEventListener("click", () => {
    if (searchBar.style.display === "none") {
        searchBar.style.display = "block"; // Affiche la barre de recherche
    } else {
        searchBar.style.display = "none"; // Cache la barre de recherche
    }
});
