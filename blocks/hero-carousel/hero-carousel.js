const SLIDE_DURATION = 20000;

export default function decorate(block) {
  const rows = [...block.children];
  const controlsRow = rows.pop();
  const controlTds = [...controlsRow.querySelectorAll('tr:last-child td')];

  // Check for a "Discover more" row (colspan=3, between block name and controls)
  const allTrs = [...controlsRow.querySelectorAll('tr')];
  let discoverMoreHtml = '';
  if (allTrs.length >= 3) {
    const middleRow = allTrs[1];
    const cell = middleRow.querySelector('td[colspan]');
    if (cell) {
      discoverMoreHtml = cell.innerHTML;
    }
  }

  // Extract data before clearing
  const slidePictures = [];
  const slides = rows.map((row, i) => {
    const [mediaCol, contentCol] = [...row.children];
    const picture = mediaCol?.querySelector('picture');
    const videoLink = mediaCol?.querySelector('a[href$=".mp4"]');
    slidePictures[i] = picture || null;
    const videoSrc = videoLink?.href || '';
    const heading = contentCol?.querySelector('h1,h2,h3')?.innerHTML || '';
    let body = '';
    const ctas = [];
    contentCol?.querySelectorAll('p').forEach((p) => {
      const a = p.querySelector('a');
      if (a) ctas.push({ text: a.textContent, href: a.href });
      else if (p.textContent.trim()) body += `${p.textContent.trim()} `;
    });
    return {
      videoSrc, heading, body: body.trim(), ctas,
    };
  });

  const labels = controlTds.map((td) => td.textContent.trim());

  // Inline CSS - no external file dependencies
  const css = `
    <style>
      .hcx { position:relative; width:100%; height:800px; overflow:hidden; }
      .hcx-slides { position:relative; width:100%; height:100%; }
      .hcx-s { position:absolute; top:0; left:0; width:100%; height:100%; transform:translateX(100%); transition:transform .4s cubic-bezier(.4,0,.2,1); pointer-events:none; z-index:0; }
      .hcx-s.on { transform:translateX(0); pointer-events:auto; z-index:1; }
      .hcx-s.hcx-exit { transform:translateX(-100%); z-index:0; }
      .hcx-s > picture, .hcx-s > picture img, .hcx-s > video { position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; object-position:top; }
      .hcx-c { position:absolute; top:0; left:0; bottom:20%; width:55%; z-index:2; display:flex; flex-direction:column; justify-content:center; padding:0 5% 0 8%; box-sizing:border-box; }
      .hcx-c.hcx-centered { left:0; width:100%; top:auto; bottom:20%; align-items:center; text-align:center; padding:0 8%; justify-content:flex-end; padding-bottom:15px; }
      .hcx-discover { display:inline-flex; align-items:center; gap:8px; padding:14px 28px; background:white; border-radius:30px; font-size:16px; font-weight:500; color:rgb(34,33,43); cursor:pointer; transition:all 0.2s ease; }
      .hcx-discover:hover { background:#22212b; color:#fff; }
      .hcx-discover:hover .icon-blue-arrow img { filter:brightness(0) invert(1); }
      .hcx-discover .icon-blue-arrow { display:inline-flex; align-items:center; }
      .hcx-discover .icon-blue-arrow img { width:24px; height:24px; transition:filter 0.2s ease; }
      .hcx-c h2, .hcx-c h2 strong { font-size:54px; font-weight:500 !important; line-height:65px; margin:0 0 20px; color:#fff; }
      .hcx-c .button-container { display:inline; }
      .hcx-c a.button { all:unset; cursor:pointer; }
      .hcx-c a.button::after { display:none; }
      .hcx-c p { font-size:16px; font-weight:300; line-height:1.6; margin:0 0 12px; color:rgba(255,255,255,.9); }
      .hcx-btn { display:inline-flex; align-items:center; gap:8px; padding:12px 24px; border-radius:24px; font-size:14px; font-weight:500; text-decoration:none; margin-right:12px; margin-top:8px; }
      .hcx-dark, .hcx-dark:any-link { background:#22212b; color:#fff; border:1px solid #22212b; }
      .hcx-dark:hover { opacity:0.85; }
      .hcx-light, .hcx-light:any-link { background:#fff; color:#22212b; border:1px solid #fff; }
      .hcx-light:hover { background:#22212b; color:#fff; }
      .hcx-play-icon { display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border-radius:50%; border:1.5px solid currentColor; font-size:10px; }
      .hcx-ctrls { position:absolute; bottom:0; left:0; right:0; z-index:10; display:flex; justify-content:center; padding:20px 8%; }
      .hcx-cb { flex:1; max-width:280px; background:none; border:none; padding:12px 16px; cursor:pointer; text-align:center; }
      .hcx-cb span { display:block; font-size:14px; font-weight:400; color:#22212b; margin-bottom:8px; }
      .hcx-cb.on span { font-weight:600; }
      .hcx-pb { width:100%; height:3px; background:rgba(0,0,0,.15); border-radius:2px; overflow:hidden; }
      .hcx-pb > div { height:100%; width:0; background:#3694fd; border-radius:2px; }
      @media (max-width: 899px) {
        .hcx { height:100vh; min-height:600px; max-height:900px; }
        .hcx-c { width:100%; bottom:25%; padding:0 6%; box-sizing:border-box; }
        .hcx-c.hcx-centered { bottom:25%; padding:0 6%; }
        .hcx-c h2, .hcx-c h2 strong { font-size:28px; line-height:36px; }
        .hcx-c p { font-size:14px; line-height:1.5; }
        .hcx-btn { padding:10px 20px; font-size:13px; }
        .hcx-ctrls { padding:12px 4%; flex-wrap:wrap; }
        .hcx-cb { max-width:none; padding:8px 8px; }
        .hcx-cb span { font-size:11px; }
        .hcx-discover { padding:10px 20px; font-size:14px; }
      }
    </style>
  `;

  // Build slides HTML
  let sh = '';
  slides.forEach((s, i) => {
    let bg = '';
    if (slidePictures[i]) bg = `<div data-slide-pic="${i}"></div>`;
    else if (s.videoSrc) bg = `<video autoplay muted loop playsinline><source src="${s.videoSrc}" type="video/mp4"></video>`;

    let btns = '';
    s.ctas.forEach((c, ci) => {
      const icon = ci === 0 ? '<span class="hcx-play-icon">&#9654;</span>' : '';
      btns += `<a href="${c.href}" class="hcx-btn ${ci === 0 ? 'hcx-dark' : 'hcx-light'}">${icon}${c.text}</a>`;
    });

    // For the last slide with no heading/body, inject "Discover more" from controls table
    const isLastEmpty = !s.heading && !s.body && i === slides.length - 1 && discoverMoreHtml;
    const centered = !s.heading && !s.body ? ' hcx-centered' : '';
    const discoverBtn = isLastEmpty ? `<div class="hcx-discover">${discoverMoreHtml}</div>` : '';
    const content = (s.heading || s.body || btns || discoverBtn) ? `<div class="hcx-c${centered}">
      ${s.heading ? `<h2>${s.heading}</h2>` : ''}
      ${s.body ? `<p>${s.body}</p>` : ''}
      ${btns ? `<div>${btns}</div>` : ''}
      ${discoverBtn}
    </div>` : '';

    sh += `<div class="hcx-s${i === 0 ? ' on' : ''}" data-i="${i}">${bg}${content}</div>`;
  });

  // Build controls HTML
  let ch = '';
  labels.forEach((l, i) => {
    ch += `<button type="button" class="hcx-cb${i === 0 ? ' on' : ''}" data-i="${i}"><span>${l}</span><div class="hcx-pb"><div></div></div></button>`;
  });

  block.innerHTML = `${css}<div class="hcx"><div class="hcx-slides">${sh}</div><div class="hcx-ctrls">${ch}</div></div>`;

  // Replace picture placeholders
  block.querySelectorAll('[data-slide-pic]').forEach((el) => {
    const pic = slidePictures[el.dataset.slidePic];
    if (pic) {
      const slide = el.parentElement;
      slide.insertBefore(pic, el);
      el.remove();
    }
  });

  // Logic
  const root = block.querySelector('.hcx');
  let cur = 0;
  let tmr;

  function startTimer() {
    clearTimeout(tmr);
    root.querySelectorAll('.hcx-pb > div').forEach((b) => { b.style.transition = 'none'; b.style.width = '0'; });
    const bar = root.querySelectorAll('.hcx-cb')[cur]?.querySelector('.hcx-pb > div');
    if (bar) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        bar.style.transition = `width ${SLIDE_DURATION}ms linear`;
        bar.style.width = '100%';
      }));
    }
    tmr = setTimeout(() => {
      const next = (cur + 1) % slides.length;
      const prev = cur;
      cur = next;
      const allSlides = root.querySelectorAll('.hcx-s');
      allSlides[prev].classList.remove('on');
      allSlides[prev].classList.add('hcx-exit');
      setTimeout(() => allSlides[prev].classList.remove('hcx-exit'), 400);
      allSlides[next].classList.add('on');
      root.querySelectorAll('.hcx-cb').forEach((c, i) => { c.classList.toggle('on', i === next); });
      allSlides.forEach((s, i) => {
        const v = s.querySelector('video');
        if (v) { if (i === next) { v.currentTime = 0; v.play(); } else v.pause(); }
      });
      startTimer();
    }, SLIDE_DURATION);
  }

  function go(n) {
    if (n === cur) return;
    const prev = cur;
    cur = n;
    const allSlides = root.querySelectorAll('.hcx-s');
    allSlides[prev].classList.remove('on');
    allSlides[prev].classList.add('hcx-exit');
    setTimeout(() => allSlides[prev].classList.remove('hcx-exit'), 400);
    allSlides[n].classList.add('on');
    root.querySelectorAll('.hcx-cb').forEach((c, i) => { c.classList.toggle('on', i === n); });
    allSlides.forEach((s, i) => {
      const v = s.querySelector('video');
      if (v) { if (i === n) { v.currentTime = 0; v.play(); } else v.pause(); }
    });
    startTimer();
  }

  root.querySelectorAll('.hcx-cb').forEach((b) => b.addEventListener('click', () => go(+b.dataset.i)));
  startTimer();
}
