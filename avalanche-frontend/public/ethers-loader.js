// This script loads ethers.js from CDN before React app is initialized
// It will be loaded in the HTML head

(function() {
  const script = document.createElement('script');
  script.src = 'https://cdn.ethers.io/lib/ethers-5.7.umd.min.js';
  script.type = 'text/javascript';
  script.async = true;
  document.head.appendChild(script);
})();