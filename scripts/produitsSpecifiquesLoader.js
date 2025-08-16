// Récupérer la catégorie depuis l'URL
const params = new URLSearchParams(window.location.search);
const categorie = params.get("categorie");

const titreCategorie = document.getElementById("titreCategorie");
const catalogue = document.getElementById("catalogue");
const yearSpan = document.getElementById("year");
yearSpan.textContent = new Date().getFullYear();

if (categorie) {
    titreCategorie.textContent = `Produits — ${categorie}`;
    fetch("../data/produits.json")
        .then(res => res.json())
        .then(produits => {
            const filtres = produits.filter(p => p.categorie.toLowerCase() === categorie.toLowerCase());
            if (filtres.length === 0) {
                catalogue.innerHTML = "<p>Aucun produit trouvé dans cette catégorie.</p>";
                return;
            }
            filtres.forEach(prod => {
    const card = document.createElement("div");
    card.className = "produit-card";

    card.innerHTML = `
        <img src="${prod.image}" alt="${prod.nom}">
        <h3>${prod.nom}</h3>
        <p>${prod.prix}</p>
        <p class="${prod.Etat === 'Disponible' ? 'disponible' : 'non-disponible'}">
            ${prod.Etat}
        </p>
        <div style="display:flex; gap:5px; justify-content:center; margin-top:5px; align-items: center;">
            <a href="${prod.lienWhatsapp}" target="_blank" class="btn-whatsapp">Commander</a>
            <button class="btn-ajouter-panier" data-id="${prod.id}"><img width="24" height="24" class="ShopCart" src="https://img.icons8.com/material-outlined/24/shopping-cart--v1.png" alt="shopping-cart--v1"/></button>
        </div>
    `;
    catalogue.appendChild(card);
});

        })
        .catch(err => {
            console.error("Erreur de chargement des produits :", err);
            catalogue.innerHTML = "<p>Erreur lors du chargement des produits.</p>";
        });
} else {
    titreCategorie.textContent = "Catégorie inconnue";
    catalogue.innerHTML = "<p>Veuillez sélectionner une catégorie valide.</p>";
}

// Mode clair / sombre
const toggleTheme = document.getElementById("toggleTheme");
const iconSun = document.getElementById("iconSun");
const iconMoon = document.getElementById("iconMoon");
const themeLabel = document.getElementById("themeLabel");

function applyTheme(theme) {
    if (theme === "dark") {
        document.documentElement.classList.add("dark");
        iconSun.style.display = "none";
        iconMoon.style.display = "inline";
        themeLabel.textContent = "Sombre";
    } else {
        document.documentElement.classList.remove("dark");
        iconSun.style.display = "inline";
        iconMoon.style.display = "none";
        themeLabel.textContent = "Clair";
    }
}

const savedTheme = localStorage.getItem("theme") || "light";
applyTheme(savedTheme);

toggleTheme.addEventListener("click", () => {
    const currentTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
});
