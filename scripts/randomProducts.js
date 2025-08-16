(async function() {
  const container = document.getElementById("random-products-container");
  const produits = await (await fetch("data/produits.json")).json();
  const selected = produits.sort(() => 0.5 - Math.random()).slice(0, 20);

  const placed = [];

  function isOverlap(x, y, w, h) {
    return placed.some(p =>
      x < p.x + p.w + 10 &&
      x + w + 10 > p.x &&
      y < p.y + p.h + 10 &&
      y + h + 10 > p.y
    );
  }

  selected.forEach(prod => {
    const card = document.createElement("div");
    card.className = "random-card";
    card.innerHTML = `
      <a href="FichesProduit/produits.html"><img src="${prod.image}" alt="${prod.nom}"></a>
      <h3>${prod.nom}</h3>
      <p>${prod.prix}</p>
    `;
    container.appendChild(card);

    const { width: w, height: h } = card.getBoundingClientRect();
    const cw = container.clientWidth, ch = container.clientHeight;

    let x, y;
    let attempts = 0;
    do {
      x = Math.random() * (cw - w - 20) + 10;
      y = Math.random() * (ch - h - 20) + 10;
      attempts++;
      if (attempts > 100) break;
    } while (isOverlap(x, y, w, h));

    placed.push({ x, y, w, h });
    card.style.left = x + "px";
    card.style.top = y + "px";

    const delay = Math.random() * 2;
    card.style.animationDelay = `${delay}s`;
  });

  container.addEventListener("mousemove", e => {
    const rect = container.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width - 0.5;
    const my = (e.clientY - rect.top) / rect.height - 0.5;

    document.querySelectorAll(".random-card").forEach(card => {
      const moveX = mx * 10;
      const moveY = my * 10;
      card.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
  });
})();
