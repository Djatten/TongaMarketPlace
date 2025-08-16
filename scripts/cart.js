// --- Initialisation du panier depuis localStorage ---
let panier = JSON.parse(localStorage.getItem("panier")) || [];

// Ajouter au panier
document.addEventListener("click", e => {
    if (e.target.classList.contains("btn-ajouter-panier")) {
        const prodId = e.target.dataset.id;

        // Récupère les infos du produit depuis la carte
        const card = e.target.closest(".produit-card");
        const nom = card.querySelector("h3").textContent;
        const prix = card.querySelector("p").textContent.replace(/[^\d.]/g, ''); // en nombre
        const image = card.querySelector("img").getAttribute("src");

        // Chaque clic ajoute une nouvelle entrée, même si le produit existe déjà
        panier.push({
            id: prodId,
            nom: nom,
            prix: parseFloat(prix),
            image: image,
        });

        localStorage.setItem("panier", JSON.stringify(panier));
        alert(`${nom} ajouté au panier 🛒`);
    }
});

// Calcule le total d’articles
function getTotalArticles() {
    return panier.reduce((a, b) => a + b.quantite, 0);
}
