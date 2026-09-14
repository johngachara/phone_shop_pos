// Runs before first paint: without this the page paints in the default
// theme and visibly flips once React mounts.
//
// A separate file rather than an inline <script> in index.html, so the CSP's
// script-src does not need 'unsafe-inline' just for this one bootstrap.
try {
  var pref = localStorage.getItem('alltech-theme')
  if (pref === 'light' || pref === 'dark') {
    document.documentElement.setAttribute('data-theme', pref)
  }
} catch (e) {
  // Storage can throw in private mode.
}
