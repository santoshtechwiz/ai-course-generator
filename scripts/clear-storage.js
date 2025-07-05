// Simple script to clear Redux persist storage
// Run this in browser console or add to a component for testing

// Clear all localStorage keys related to Redux persist
const clearReduxStorage = () => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('persist:') || key.includes('redux') || key.includes('subscription')) {
      localStorage.removeItem(key);
      console.log(`Cleared: ${key}`);
    }
  });
  console.log('Redux storage cleared. Refresh the page to see changes.');
};

// If running in browser
if (typeof window !== 'undefined') {
  window.clearReduxStorage = clearReduxStorage;
  console.log('Run clearReduxStorage() to clear persisted Redux state');
}

export default clearReduxStorage;
