(() => {
  'use strict';
  const config = {
    apiKey: 'AIzaSyCWiEMkDGTIICX2ceHfK8HJiPYvV_QO-tA',
    authDomain: 'afterglow-arcade.firebaseapp.com',
    projectId: 'afterglow-arcade',
    appId: '1:287348948017:web:3b03963252cec7bcb9e910'
  };
  let auth = null;
  let db = null;
  const gameIds = ['circle', 'krillion', 'perceptle', 'headcount', 'logos', 'contexto'];
  try {
    if (!window.firebase || !firebase.initializeApp || !firebase.auth || !firebase.firestore) {
      throw new Error('Firebase libraries did not load.');
    }
    if (!firebase.apps.length) firebase.initializeApp(config);
    auth = firebase.auth();
    db = firebase.firestore();
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch((error) => console.warn('Could not persist the Firebase session:', error));
  } catch (error) {
    console.warn('Afterglow accounts are unavailable in this session:', error);
  }
  function requireAuth() {
    if (!auth) throw new Error('Account services are unavailable. Check your internet connection and try again.');
    return auth;
  }
  function progressRef(user) {
    if (!db || !user || !user.uid) throw new Error('Sign in before syncing progress.');
    return db.collection('users').doc(user.uid).collection('arcade').doc('progress');
  }
  function safeProgress(data) {
    const scores = {};
    for (const id of gameIds) {
      const score = Number(data && data.scores && data.scores[id]);
      if (Number.isFinite(score) && score >= 0 && score <= 100) scores[id] = Math.round(score);
    }
    const names = {
      circle: 'Perfect Circle', krillion: 'Krillion: The Daily Dive',
      perceptle: 'Perceptle', headcount: 'Head Count',
      logos: 'Draw Logos From Memory', contexto: 'Contexto'
    };
    const history = Array.isArray(data && data.history) ? data.history.slice(-300).flatMap((item) => {
      const name = String(item && item.name || '');
      const score = Number(item && item.score);
      const date = Date.parse(item && item.date);
      if (!Object.values(names).includes(name) || !Number.isFinite(score) || score < 0 || score > 100 || !Number.isFinite(date)) return [];
      return [{ name, score: Math.round(score), date: new Date(date).toISOString() }];
    }) : [];
    return { scores, history };
  }
  const api = {
    get available() { return Boolean(auth && db); },
    onAuthStateChanged(callback) {
      if (!auth) { callback(null); return () => {}; }
      return auth.onAuthStateChanged(callback, (error) => console.error('Firebase auth state failed:', error));
    },
    signUp(email, password) { return requireAuth().createUserWithEmailAndPassword(email, password); },
    signIn(email, password) { return requireAuth().signInWithEmailAndPassword(email, password); },
    signOut() { return requireAuth().signOut(); },
    resetPassword(email) { return requireAuth().sendPasswordResetEmail(email); },
    async readProgress(user) {
      const snapshot = await progressRef(user).get();
      return snapshot.exists ? safeProgress(snapshot.data()) : null;
    },
    async saveProgress(user, data) {
      await progressRef(user).set(safeProgress(data));
    },
    explainError(error) {
      const code = String(error && error.code || '');
      const messages = {
        'auth/email-already-in-use': 'An account already uses this email. Try signing in instead.',
        'auth/invalid-email': 'Enter a valid email address.',
        'auth/weak-password': 'Use a stronger password with at least 8 characters.',
        'auth/invalid-credential': 'That email and password combination was not recognized.',
        'auth/user-not-found': 'That email and password combination was not recognized.',
        'auth/wrong-password': 'That email and password combination was not recognized.',
        'auth/too-many-requests': 'Too many attempts. Wait a little, then try again.',
        'auth/network-request-failed': 'Could not reach Firebase. Check your internet connection.',
        'auth/unauthorized-domain': 'This app domain is not authorized in Firebase yet.',
        'permission-denied': 'Cloud saves were blocked by Firestore rules. Your local save is still available.'
      };
      return messages[code] || (error && error.message) || 'Something went wrong. Please try again.';
    }
  };
  window.AfterglowFirebase = Object.freeze(api);
  window.dispatchEvent(new Event('afterglow-firebase-ready'));
})();
