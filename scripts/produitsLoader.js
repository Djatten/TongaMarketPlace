// produitsLoader.js

const catalogue = document.getElementById('catalogue');

fetch('../data/produits.json')
  .then(res => res.json())
  .then(produits => {
    // Récupérer les catégories uniques
    const categories = [...new Set(produits.map(p => p.categorie))];

    categories.forEach(cat => {
      const section = document.createElement('section');
      const titreCat = document.createElement('h2');
      titreCat.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
      section.appendChild(titreCat);

      const grid = document.createElement('div');
      grid.className = 'grid-produits';

      const produitsCat = produits.filter(p => p.categorie === cat);
      produitsCat.forEach(prod => {
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
        grid.appendChild(card);
      });

      section.appendChild(grid);

      // Bouton Voir Plus
      const voirPlus = document.createElement('a');
      voirPlus.href = `ProduitsSpecifiques.html?categorie=${encodeURIComponent(cat)}`;
      voirPlus.textContent = 'Voir plus';
      voirPlus.className = 'btn btn-primary';
      voirPlus.style.display = 'inline-block';
      voirPlus.style.marginTop = '12px';
      section.appendChild(voirPlus);

      catalogue.appendChild(section);
    });
  })
  .catch(err => console.error('Erreur chargement produits:', err));

