(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // 頂欄：捲動後出現細線
  const bar = document.querySelector('.bar');
  const onScroll = () => bar.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 頁內導覽：標示目前所在段落
  const links = [...document.querySelectorAll('.bar nav a')];
  const linkFor = new Map(links.map((a) => [a.hash.slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) => a.removeAttribute('aria-current'));
      const link = linkFor.get(entry.target.id);
      if (link) link.setAttribute('aria-current', 'true');
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  document.querySelectorAll('main > section[id]').forEach((s) => spy.observe(s));

  // 動作影像：一次只播一段，可個別開聲音
  const films = [...document.querySelectorAll('[data-film]')];
  let touched = false;
  const fmt = (s) => {
    const t = Math.max(0, Math.round(s || 0));
    return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  };

  films.forEach((fig) => {
    const video = fig.querySelector('video');
    const play = fig.querySelector('.film__play');
    const sound = fig.querySelector('.film__sound');
    const icon = play.querySelector('.ico');
    const bar = fig.querySelector('.film__progress span');
    const time = fig.querySelector('.film__time');
    const title = fig.querySelector('figcaption strong').textContent;

    const sync = () => {
      const playing = !video.paused;
      play.setAttribute('aria-pressed', String(playing));
      play.setAttribute('aria-label', `${playing ? '暫停' : '播放'}：${title}`);
      play.querySelector('.t').textContent = playing ? '暫停' : '播放';
      icon.className = `ico ${playing ? 'ico--pause' : 'ico--play'}`;
      fig.classList.toggle('is-playing', playing);
    };
    sync();
    sound.setAttribute('aria-label', `聲音：${title}`);

    video.addEventListener('play', () => {
      films.forEach((other) => { if (other !== fig) other.querySelector('video').pause(); });
      sync();
    });
    video.addEventListener('pause', sync);
    video.addEventListener('loadedmetadata', () => { time.textContent = `0:00 / ${fmt(video.duration)}`; });
    video.addEventListener('timeupdate', () => {
      const p = video.duration ? video.currentTime / video.duration : 0;
      bar.style.transform = `scaleX(${p})`;
      time.textContent = `${fmt(video.currentTime)} / ${fmt(video.duration)}`;
    });

    const toggle = () => {
      touched = true;
      if (video.paused) video.play().catch(() => {});
      else video.pause();
    };
    play.addEventListener('click', toggle);
    fig.querySelector('.film__frame').addEventListener('click', toggle);

    sound.addEventListener('click', () => {
      touched = true;
      video.muted = !video.muted;
      sound.setAttribute('aria-pressed', String(!video.muted));
      sound.querySelector('.t').textContent = video.muted ? '聲音 關' : '聲音 開';
      if (!video.muted && video.paused) video.play().catch(() => {});
    });
  });

  // 進入影像段時靜音播放第一段；離開即暫停。減少動態偏好下不自動播放。
  const section = document.getElementById('films');
  new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) {
      films.forEach((f) => f.querySelector('video').pause());
      return;
    }
    if (!touched && !reduceMotion.matches) films[0].querySelector('video').play().catch(() => {});
  }, { threshold: 0.35 }).observe(section);
})();
