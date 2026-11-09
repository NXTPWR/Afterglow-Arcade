(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Compact ambient particles: decorative only, with no external assets.
  const particleField = $('#particles');
  if (particleField && !reducedMotion) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 18; i++) {
      const particle = document.createElement('i');
      particle.style.setProperty('--x', ((i * 47 + 11) % 100) + '%');
      particle.style.setProperty('--y', ((i * 67 + 19) % 100) + '%');
      particle.style.setProperty('--delay', ((i % 9) * -0.7) + 's');
      particle.style.setProperty('--duration', (5 + (i % 6)) + 's');
      fragment.append(particle);
    }
    particleField.append(fragment);
  }

  const menuToggle = $('#menuToggle');
  const nav = $('#primaryNav');
  const setMenu = (open) => {
    if (!menuToggle || !nav) return;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  };
  menuToggle?.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
  nav?.addEventListener('click', (event) => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setMenu(false); });

  const header = $('.site-header');
  let scrollQueued = false;
  const updateScroll = () => {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 18);
    scrollQueued = false;
  };
  window.addEventListener('scroll', () => {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScroll); }
  }, { passive: true });
  updateScroll();

  // Reveal as content enters the viewport; show everything if unsupported.
  const revealItems = $$('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion) {
    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          instance.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });
    revealItems.forEach((item) => observer.observe(item));
  } else revealItems.forEach((item) => item.classList.add('in-view'));
  document.body.classList.add('reveal-ready');

  if (!reducedMotion && matchMedia('(pointer: fine)').matches) {
    $$('.game-card').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const box = card.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width - 0.5;
        const y = (event.clientY - box.top) / box.height - 0.5;
        card.style.setProperty('--tilt-x', (y * -4).toFixed(2) + 'deg');
        card.style.setProperty('--tilt-y', (x * 4).toFixed(2) + 'deg');
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      });
    });
    const cursorGlow = $('.ambient-cursor');
    if (cursorGlow) window.addEventListener('pointermove', (event) => {
      cursorGlow.style.setProperty('--pointer-x', event.clientX + 'px');
      cursorGlow.style.setProperty('--pointer-y', event.clientY + 'px');
    }, { passive: true });
  }

  const dialog = $('#authDialog');
  const authTitle = $('#authTitle');
  const authDescription = $('#authDescription');
  const authButtons = $$('[data-auth]');
  authButtons.forEach((button) => button.addEventListener('click', () => {
    const signup = button.dataset.auth === 'signup';
    if (authTitle) authTitle.textContent = signup ? 'Create your player account' : 'Player sign in';
    if (authDescription) authDescription.textContent = signup
      ? 'Account creation will be available after secure account services are configured.'
      : 'Sign-in will be available after secure account services are configured.';
    if (dialog?.showModal) dialog.showModal();
  }));
  $('#authOk')?.addEventListener('click', () => dialog?.close());
  dialog?.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  const soundButton = $('#soundToggle');
  const soundLabel = soundButton?.querySelector('span:last-child');
  let soundEnabled = false;
  try { soundEnabled = localStorage.getItem('afterglow-sound') === 'on'; } catch (_) { /* Storage may be unavailable. */ }
  const renderSound = () => {
    soundButton?.setAttribute('aria-pressed', String(soundEnabled));
    if (soundLabel) soundLabel.textContent = soundEnabled ? 'SOUND ON' : 'SOUND OFF';
  };
  renderSound();
  soundButton?.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    try { localStorage.setItem('afterglow-sound', soundEnabled ? 'on' : 'off'); } catch (_) { /* Sound still works for this session. */ }
    renderSound();
    if (soundEnabled) {
      try {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (Audio) {
          const context = new Audio();
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.type = 'sine'; oscillator.frequency.value = 660;
          gain.gain.setValueAtTime(0.0001, context.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.035, context.currentTime + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.12);
          oscillator.connect(gain); gain.connect(context.destination);
          oscillator.start(); oscillator.stop(context.currentTime + 0.13);
          oscillator.onended = () => context.close();
        }
      } catch (_) { /* Audio is optional and browser-controlled. */ }
    }
  });

  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
