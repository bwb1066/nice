export default function decorate(block) {
  const col = block.querySelector(':scope > div > div');
  if (!col) return;

  // Extract heading and description (before the table)
  const heading = col.querySelector('h2, h3, h4');
  const paragraphs = [...col.querySelectorAll(':scope > p')].filter((p) => !p.querySelector('picture') && !p.querySelector('a[href*="vidyard"]') && !p.querySelector('a[href$=".mp4"]'));

  const headingHtml = heading ? heading.outerHTML : '';
  const descHtml = paragraphs.map((p) => p.outerHTML).join('');

  // Find poster image and video URL from the table
  const poster = col.querySelector('table picture');
  const videoLink = col.querySelector('table a[href*="vidyard"], table a[href*=".mp4"]');

  const posterSrc = poster?.querySelector('source[media*="600"]')?.srcset || poster?.querySelector('img')?.src || '';
  const videoUrl = videoLink?.href || '';

  block.innerHTML = `
    <div class="dvh-text">
      ${headingHtml}
      ${descHtml}
    </div>
    <div class="dvh-video-wrap">
      <img class="dvh-poster" src="${posterSrc}" alt="" role="presentation">
      <button class="dvh-play" type="button" aria-label="Watch the demo">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="23" stroke="white" stroke-width="2"/>
          <path d="M20 16L32 24L20 32V16Z" fill="white"/>
        </svg>
        <span>Watch the demo</span>
      </button>
    </div>
  `;

  const playBtn = block.querySelector('.dvh-play');
  if (playBtn && videoUrl) {
    playBtn.addEventListener('click', () => {
      const wrap = block.querySelector('.dvh-video-wrap');
      if (videoUrl.includes('vidyard')) {
        wrap.innerHTML = `<iframe src="${videoUrl}" width="100%" height="100%" frameborder="0" allowfullscreen allow="autoplay"></iframe>`;
      } else {
        wrap.innerHTML = `<video controls autoplay style="width:100%;height:100%;object-fit:cover;border-radius:16px;"><source src="${videoUrl}" type="video/mp4"></video>`;
      }
    });
  }
}
