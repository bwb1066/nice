export default function decorate(block) {
  const rows = [...block.children];

  // Row 1: hero (text + image)
  const heroRow = rows[0];
  if (heroRow) {
    heroRow.classList.add('eaph-hero');
    const [textCol, imgCol] = [...heroRow.children];
    if (textCol) textCol.classList.add('eaph-hero-text');
    if (imgCol) imgCol.classList.add('eaph-hero-img');
  }

  // Row 2: feature cards
  const cardsRow = rows[1];
  if (cardsRow) {
    cardsRow.classList.add('eaph-cards');
    [...cardsRow.children].forEach((card) => {
      card.classList.add('eaph-card');
      // Style "Learn more" links
      card.querySelectorAll('a').forEach((a) => {
        a.classList.add('eaph-link');
        const bc = a.closest('.button-container');
        if (bc) bc.style.display = 'inline';
        a.classList.remove('button', 'primary', 'secondary');
      });
    });
  }
}
