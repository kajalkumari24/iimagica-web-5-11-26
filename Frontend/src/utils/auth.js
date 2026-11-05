// Utility helpers for auth token storage
// Provides a single place to read/write/clear tokens from localStorage or sessionStorage

export function getAuthToken(key = 'token') {
  try {
    return localStorage.getItem(key) || sessionStorage.getItem(key) || null;
  } catch (err) {
    console.error('getAuthToken error', err);
    return null;
  }
}

export function setAuthToken(token, { key = 'token', remember = true } = {}) {
  try {
    if (remember) {
      localStorage.setItem(key, token);
      try { sessionStorage.removeItem(key); } catch {}
    } else {
      sessionStorage.setItem(key, token);
      try { localStorage.removeItem(key); } catch {}
    }
  } catch (err) {
    console.error('setAuthToken error', err);
  }
}

export function clearAuthToken(key = 'token') {
  try {
    localStorage.removeItem(key);
    localStorage.removeItem("isLoggedIn");
  } catch (err) {}
  try {
    sessionStorage.removeItem(key);
  } catch (err) {}
}

// export default { getAuthToken, setAuthToken, clearAuthToken };
// Checks if a user is authenticated by looking for a token
export const isAuthenticated = () => {
  return !!getAuthToken(); // Returns true if a token exists, false otherwise
};
