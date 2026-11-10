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

  const accountStatus = $('#accountStatus');
  const firebaseAvailable = Boolean(window.AfterglowFirebase?.available);
  if (accountStatus) accountStatus.textContent = firebaseAvailable
    ? 'EMAIL ACCOUNTS & CLOUD SAVES READY'
    : 'ACCOUNT SERVICE UNAVAILABLE · GUEST PLAY STILL WORKS';

  const dialog = $('#authDialog');
  const authTitle = $('#authTitle');
  const authDescription = $('#authDescription');
  const authForm = $('#authForm');
  const authMessage = $('#authMessage');
  const authSubmit = $('#authSubmit');
  const authConfirmWrap = $('#authConfirmWrap');
  const authModeToggle = $('#authModeToggle');
  const authButtons = $$('[data-auth]');
  const signOutButton = $('#navSignOut');
  let authMode = 'signin';
  let activeAccount = null;
  function setAuthMessage(message, isError = false) {
    if (!authMessage) return;
    authMessage.textContent = message;
    authMessage.classList.toggle('is-error', isError);
  }
  function setAuthMode(mode) {
    authMode = mode;
    const signup = mode === 'signup';
    if (authTitle) authTitle.textContent = signup ? 'Create your player account' : 'Player sign in';
    if (authDescription) authDescription.textContent = signup ? 'Use your account to keep arcade progress synced with your installs.' : 'Sign in to load your saved arcade progress.';
    if (authSubmit) authSubmit.textContent = signup ? 'CREATE ACCOUNT' : 'SIGN IN';
    if (authConfirmWrap) authConfirmWrap.hidden = !signup;
    const password = $('#authPassword');
    if (password) password.autocomplete = signup ? 'new-password' : 'current-password';
    if (authModeToggle) authModeToggle.textContent = signup ? 'Already have an account? Sign in' : 'Need an account? Sign up';
    if ($('#authReset')) $('#authReset').hidden = signup;
    setAuthMessage('');
  }
  authButtons.forEach((button) => button.addEventListener('click', () => {
    setAuthMode(button.dataset.auth === 'signup' ? 'signup' : 'signin');
    if (dialog?.showModal) dialog.showModal();
  }));
  authModeToggle?.addEventListener('click', () => setAuthMode(authMode === 'signup' ? 'signin' : 'signup'));
  authForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = $('#authEmail')?.value.trim();
    const password = $('#authPassword')?.value || '';
    if (authMode === 'signup' && password !== ($('#authConfirm')?.value || '')) return setAuthMessage('The passwords do not match.', true);
    if (!window.AfterglowFirebase?.available) return setAuthMessage('Account services could not load. Check your connection and try again.', true);
    authSubmit.disabled = true;
    setAuthMessage(authMode === 'signup' ? 'Creating your account…' : 'Signing in…');
    try {
      if (authMode === 'signup') await window.AfterglowFirebase.signUp(email, password);
      else await window.AfterglowFirebase.signIn(email, password);
      setAuthMessage('You’re signed in. Your desktop scores will sync when you open the app.');
      window.setTimeout(() => dialog?.close(), 900);
    } catch (error) {
      setAuthMessage(window.AfterglowFirebase.explainError(error), true);
    } finally {
      authSubmit.disabled = false;
    }
  });
  $('#authReset')?.addEventListener('click', async () => {
    const email = $('#authEmail')?.value.trim();
    if (!email) return setAuthMessage('Enter your email address first.', true);
    if (!window.AfterglowFirebase?.available) return setAuthMessage('Account services could not load. Check your connection and try again.', true);
    try {
      await window.AfterglowFirebase.resetPassword(email);
      setAuthMessage('If an account exists for that email, Firebase will send password reset instructions.');
    } catch (error) {
      setAuthMessage(window.AfterglowFirebase.explainError(error), true);
    }
  });
  signOutButton?.addEventListener('click', async () => {
    try { await window.AfterglowFirebase?.signOut(); } catch (error) { console.error('Sign out failed:', error); }
  });
  window.AfterglowFirebase?.onAuthStateChanged((account) => {
    activeAccount = account;
    const signInButton = $('[data-auth="signin"]');
    const signUpButton = $('[data-auth="signup"]');
    if (signInButton) signInButton.textContent = account ? account.email : 'Sign In';
    if (signUpButton) signUpButton.hidden = Boolean(account);
    if (signOutButton) signOutButton.hidden = !account;
    if (account && authTitle && dialog?.open) {
      authTitle.textContent = 'You’re signed in';
      setAuthMessage('Your account is ready. Open the desktop app to sync scores.');
    }
  });
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
