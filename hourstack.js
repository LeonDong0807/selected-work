(() => {
  const DIR = './';
  const PHOTOS = [
    { file: '5D3C719B-2F21-400F-98CD-6BE4C067C456.jpg', label: '正面斜角' },
    { file: '750DBE89-9811-499B-B6CA-49D7BECCA664.JPG', label: '正面・保卡背景' },
    { file: '11963038-EEEA-4E87-8318-1A0D98E0D5D5.jpg', label: '側面・錶冠' },
    { file: 'F4FD8D0D-06E1-4D33-B670-B0327DA81618.jpg', label: '面盤與錶帶' },
    { file: '95389B66-C643-4DBB-855E-4E61BA4425BC.jpg', label: '錶扣' },
    { file: '5672A151-4C32-4A8B-AB9D-0D664EE61AB3.jpg', label: '原廠盒單' },
  ];
  const total = PHOTOS.length;
  const pad = (n) => String(n).padStart(2, '0');
  const altOf = (p) => `Rolex Datejust 41 ${p.label}實拍`;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const stage = document.querySelector('.stage');
  const stageImg = document.querySelector('[data-stage-img]');
  const plate = document.querySelector('[data-plate]');
  const thumbs = document.querySelector('.thumbs');
  const loupe = document.querySelector('.loupe');
  const loupeImg = document.querySelector('[data-loupe-img]');
  let index = 0;
  let opener = null;

  // 縮圖
  PHOTOS.forEach((p, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `查看實拍 ${i + 1}：${p.label}`);
    b.setAttribute('aria-pressed', String(i === 0));
    b.innerHTML = `<img src="${DIR}${p.file}" width="640" height="480" alt="" loading="lazy"><span>${pad(i + 1)}　${p.label}</span>`;
    b.addEventListener('click', () => show(i));
    li.append(b);
    thumbs.append(li);
  });

  function show(i) {
    index = (i + total) % total;
    const p = PHOTOS[index];
    const src = DIR + p.file;

    const swap = () => {
      stageImg.src = src;
      stageImg.alt = altOf(p);
      stageImg.classList.remove('is-swapping');
    };
    if (reduceMotion.matches) swap();
    else {
      stageImg.classList.add('is-swapping');
      setTimeout(swap, 140);
    }

    loupeImg.src = src;
    loupeImg.alt = altOf(p);
    plate.textContent = pad(index + 1);
    document.querySelectorAll('[data-count]').forEach((el) => { el.textContent = `${pad(index + 1)} / ${pad(total)}`; });
    document.querySelectorAll('[data-caption]').forEach((el) => { el.textContent = p.label; });
    document.querySelectorAll('.stage__view').forEach((el) => el.setAttribute('aria-label', `放大檢視：${p.label}`));
    thumbs.querySelectorAll('button').forEach((b, n) => b.setAttribute('aria-pressed', String(n === index)));
  }

  // 前後切換（舞台與放大檢視共用 data-step）
  document.querySelectorAll('[data-step]').forEach((b) => {
    b.addEventListener('click', () => show(index + Number(b.dataset.step)));
  });

  // 舞台上的方向鍵
  stage.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
  });

  // 觸控滑動切換；滑動時不觸發放大
  let startX = null;
  let swiped = false;
  const field = document.querySelector('.stage__field');
  field.addEventListener('pointerdown', (e) => { startX = e.clientX; swiped = false; });
  field.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) {
      swiped = true;
      setTimeout(() => { swiped = false; }, 400);
      show(index + (dx < 0 ? 1 : -1));
    }
  });
  field.addEventListener('pointercancel', () => { startX = null; });

  // 放大檢視
  document.querySelectorAll('[data-open]').forEach((b) => {
    b.addEventListener('click', (e) => {
      if (swiped) { swiped = false; e.preventDefault(); return; }
      opener = b;
      loupe.showModal();
      loupe.querySelector('[data-close]').focus();
    });
  });
  loupe.querySelector('[data-close]').addEventListener('click', () => loupe.close());
  loupe.addEventListener('click', (e) => { if (e.target === loupe) loupe.close(); });
  loupe.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
    if (e.key === 'Home') { e.preventDefault(); show(0); }
    if (e.key === 'End') { e.preventDefault(); show(total - 1); }
  });
  loupe.addEventListener('close', () => { if (opener) opener.focus(); });

  // 頁內導覽：標示目前所在段落
  const links = [...document.querySelectorAll('.top nav a')];
  const linkFor = new Map(links.map((a) => [a.hash.slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) => a.removeAttribute('aria-current'));
      const link = linkFor.get(entry.target.id);
      if (link) link.setAttribute('aria-current', 'true');
    });
  }, { rootMargin: '-35% 0px -60% 0px' });
  ['photos', 'specs', 'notes'].forEach((id) => spy.observe(document.getElementById(id)));
  // 最後一段較短，捲到頁底時直接標示它
  window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY < document.documentElement.scrollHeight - 4) return;
    links.forEach((a) => a.removeAttribute('aria-current'));
    linkFor.get('notes').setAttribute('aria-current', 'true');
  }, { passive: true });

  // 預先載入其餘照片，切換時不閃白
  PHOTOS.forEach((p) => { const im = new Image(); im.src = DIR + p.file; });
})();
