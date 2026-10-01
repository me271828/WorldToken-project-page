(() => {
  'use strict';
  const long = document.getElementById('history-long');
  const short = document.getElementById('history-short');
  const pair = [long, short];
  const play = document.getElementById('play-both');
  const restart = document.getElementById('restart-both');
  const speed = document.getElementById('compare-speed');
  const clock = document.getElementById('compare-clock');
  const error = document.getElementById('compare-error');
  let running = false, frame = 0, generation = 0;
  const timeText = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const updateClock = () => { clock.textContent = `${timeText(short.currentTime)} / ${timeText(Number.isFinite(short.duration) ? short.duration : 210)} simulated`; };
  const rate = () => pair.forEach(v => { v.playbackRate = Number(speed.value); });
  const pause = () => {
    running = false; generation++; cancelAnimationFrame(frame);
    pair.forEach(v => v.pause()); play.textContent = 'Play both'; play.setAttribute('aria-pressed', 'false'); updateClock();
  };
  const align = t => pair.forEach(v => {
    if (!Number.isFinite(v.duration)) return;
    const target = Math.min(t, Math.max(0, v.duration - .06));
    if (Math.abs(v.currentTime - target) > .12) v.currentTime = target;
  });
  function tick() {
    if (!running) return;
    if (short.ended) { pause(); return; }
    const t = short.currentTime;
    if (t >= long.duration - .06) { long.pause(); }
    else if (!long.seeking && Math.abs(long.currentTime - t) > .18) long.currentTime = t;
    updateClock(); frame = requestAnimationFrame(tick);
  }
  async function start(reset = false) {
    pause(); error.hidden = true;
    document.querySelectorAll('video').forEach(v => { if (!pair.includes(v)) v.pause(); });
    if (reset || short.ended) pair.forEach(v => { v.currentTime = 0; });
    align(short.currentTime); rate();
    const g = ++generation; running = true; play.textContent = 'Pause both'; play.setAttribute('aria-pressed', 'true');
    try {
      await Promise.all(pair.filter(v => short.currentTime < v.duration - .06).map(v => v.play()));
      if (g === generation && running) tick();
    } catch (e) { if (g === generation) { pause(); if (e.name !== 'AbortError') error.hidden = false; } }
  }
  play.addEventListener('click', () => running ? pause() : start());
  restart.addEventListener('click', () => start(true));
  speed.addEventListener('change', rate);
  const ready = () => {
    const available = pair.every(item => item.readyState >= 1 && !item.error);
    play.disabled = !available; restart.disabled = !available;
    rate(); updateClock();
  };
  pair.forEach(v => {
    ['loadedmetadata', 'loadeddata', 'canplay'].forEach(event => v.addEventListener(event, ready));
    v.addEventListener('error', () => { pause(); error.hidden = false; });
  });
  ready();
  document.querySelectorAll('.demo-card video').forEach(v => {
    v.defaultPlaybackRate = .5; v.playbackRate = .5;
    v.addEventListener('loadedmetadata', () => { v.playbackRate = .5; });
  });
  const extended = document.getElementById('extended-video');
  const extendedSpeed = document.getElementById('extended-speed');
  const extendedToggle = document.getElementById('extended-toggle');
  const extendedError = document.getElementById('extended-error');
  const setExtendedSpeed = () => {
    extended.defaultPlaybackRate = Number(extendedSpeed.value);
    extended.playbackRate = Number(extendedSpeed.value);
  };
  setExtendedSpeed();
  extended.addEventListener('loadedmetadata', setExtendedSpeed);
  extendedSpeed.addEventListener('change', setExtendedSpeed);
  extendedToggle.addEventListener('click', async () => {
    if (!extended.paused) { extended.pause(); return; }
    extendedError.hidden = true;
    try { await extended.play(); }
    catch (e) { if (e.name !== 'AbortError') extendedError.hidden = false; }
  });
  ['play', 'pause', 'ended'].forEach(event => extended.addEventListener(event, () => {
    extendedToggle.textContent = extended.paused ? 'Play video' : 'Pause video';
    extendedToggle.setAttribute('aria-pressed', String(!extended.paused));
  }));
  extended.addEventListener('error', () => { extendedError.hidden = false; });
  short.addEventListener('timeupdate', updateClock);
  short.addEventListener('pause', () => { if (running && !short.ended) pause(); });
  short.addEventListener('seeked', () => { if (running) align(short.currentTime); });
  document.querySelectorAll('video').forEach(v => v.addEventListener('play', () => {
    if (!pair.includes(v)) { pause(); document.querySelectorAll('video').forEach(other => { if (other !== v) other.pause(); }); }
  }));
  document.addEventListener('visibilitychange', () => { if (document.hidden) { pause(); document.querySelectorAll('video').forEach(v => v.pause()); } });
  document.getElementById('copy-bibtex').addEventListener('click', async () => {
    const content = document.getElementById('bibtex').textContent;
    const status = document.getElementById('copy-status');
    try { await navigator.clipboard.writeText(content); status.textContent = 'BibTeX copied.'; }
    catch { const selection = window.getSelection(); const range = document.createRange(); range.selectNodeContents(document.getElementById('bibtex')); selection.removeAllRanges(); selection.addRange(range); status.textContent = 'Citation selected. Press Ctrl+C or Command+C to copy.'; }
  });
})();
