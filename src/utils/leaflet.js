// Učitava Leaflet (karte) s CDN-a jednom, i vraća window.L kad je spreman.
// (Isti izvor kao stranica Karta, samo bez ponavljanja koda.)

let obecanje = null;

export function ucitajLeaflet() {
  if (typeof window !== 'undefined' && window.L) return Promise.resolve(window.L);
  if (obecanje) return obecanje;

  obecanje = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-leaflet]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.setAttribute('data-leaflet', '');
      document.head.appendChild(link);
    }

    const postojeca = document.querySelector('script[src*="leaflet@1.9.4/dist/leaflet.js"]');
    if (postojeca) {
      const provjeri = () => (window.L ? resolve(window.L) : setTimeout(provjeri, 50));
      provjeri();
      return;
    }

    const skripta = document.createElement('script');
    skripta.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    skripta.onload = () => resolve(window.L);
    skripta.onerror = () => {
      obecanje = null; // dopusti ponovni pokušaj kad se vrati mreža
      reject(new Error('Karta se nije mogla učitati (provjeri internet).'));
    };
    document.head.appendChild(skripta);
  });

  return obecanje;
}
