export default function decorate(block) {
  const rows = [...block.children];

  // Row 1: heading (single column)
  const headingRow = rows[0];
  if (headingRow) headingRow.classList.add('adcx-heading-row');

  // Row 2: 3 cards
  const cardsRow = rows[1];
  if (cardsRow) {
    cardsRow.classList.add('adcx-cards');
    [...cardsRow.children].forEach((card) => {
      card.classList.add('adcx-card');

      // Style the "Explore" CTA
      card.querySelectorAll('a').forEach((a) => {
        const bc = a.closest('.button-container');
        if (bc) bc.style.display = 'inline';
        a.classList.remove('button', 'primary', 'secondary');
      });

      // Find the Explore link (in a <p> by itself)
      card.querySelectorAll('p').forEach((p) => {
        const a = p.querySelector('a');
        if (a && !p.querySelector('picture') && a.textContent.trim() === 'Explore') {
          a.classList.add('adcx-cta');
        }
      });

      // Style product tags
      const ul = card.querySelector('ul');
      if (ul) ul.classList.add('adcx-tags');
    });
  }
}
