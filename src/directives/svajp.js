// Povuci redak ulijevo da se otkriju radnje (Uredi / Obriši), kao u mail aplikacijama na mobitelu.
//
// Korištenje u predlošku:
//   <div v-svajp class="redak">
//     ...sadržaj retka...
//     <div data-svajp-akcije> <button>Uredi</button> <button>Obriši</button> </div>
//   </div>
//
// Elementi s data-svajp-akcije su na mobitelu smješteni odmah desno od retka (vidi main.css), a redak
// se povlačenjem pomiče ulijevo i otkriva ih. To su ISTI gumbi kao na računalu - ne kopiraju se, pa
// imaju svoje postojeće radnje. Na računalu (široki ekran) direktiva ne radi ništa.

const jeMobilni = () => window.matchMedia('(max-width: 768px)').matches;

const PRAG_SMJERA = 8;          // koliko piksela prije nego odlučimo je li pokret vodoravan ili okomit
const RAZMAK_AKCIJA = 8;        // razmak ispred i između gumba (mora odgovarati main.css)
const PO_GUMBU = 40;            // širina jednog gumba

let otvoreni = null;            // redak koji je trenutno otvoren (samo jedan odjednom)

const mjeriSirinu = (el) => {
  const akcije = el.querySelector('[data-svajp-akcije]');
  const broj = akcije ? akcije.querySelectorAll('button, a').length : 0;
  const sirina = broj ? broj * PO_GUMBU + (broj + 1) * RAZMAK_AKCIJA : 0;
  el.style.setProperty('--svajp-sirina', `${sirina}px`);
  return sirina;
};

const postavi = (el, otvori, sirina) => {
  if (otvori && sirina > 0) {
    el.style.transform = `translateX(${-sirina}px)`;
    el.setAttribute('data-svajp-otvoreno', '');
    otvoreni = el;
  } else {
    el.style.transform = '';
    el.removeAttribute('data-svajp-otvoreno');
    if (otvoreni === el) otvoreni = null;
  }
};

// dodir izvan otvorenog retka ga zatvara
let globalniSlusatelj = false;
const osigurajGlobalniSlusatelj = () => {
  if (globalniSlusatelj) return;
  globalniSlusatelj = true;
  document.addEventListener('touchstart', (e) => {
    if (otvoreni && !otvoreni.contains(e.target)) postavi(otvoreni, false, 0);
  }, { passive: true });
};

export default {
  mounted(el) {
    osigurajGlobalniSlusatelj();
    el.setAttribute('data-svajp', '');
    mjeriSirinu(el);

    let x0 = 0;
    let y0 = 0;
    let smjer = null;          // null | 'vodoravno' | 'okomito'
    let polazna = 0;
    let zadnja = 0;
    let sirina = 0;
    let blokirajKlik = false;

    const pocetak = (e) => {
      if (!jeMobilni() || e.touches.length !== 1) { smjer = 'okomito'; return; }
      if (otvoreni && otvoreni !== el) postavi(otvoreni, false, 0);
      sirina = mjeriSirinu(el);
      if (!sirina) { smjer = 'okomito'; return; }
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
      smjer = null;
      polazna = el.hasAttribute('data-svajp-otvoreno') ? -sirina : 0;
      zadnja = polazna;
    };

    const pomak = (e) => {
      if (smjer === 'okomito' || !e.touches.length) return;
      const dx = e.touches[0].clientX - x0;
      const dy = e.touches[0].clientY - y0;

      if (smjer === null) {
        if (Math.abs(dx) < PRAG_SMJERA && Math.abs(dy) < PRAG_SMJERA) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          smjer = 'vodoravno';
          el.setAttribute('data-svajp-povlaci', '');
        } else {
          smjer = 'okomito'; // obično skrolanje stranice
          return;
        }
      }

      if (e.cancelable) e.preventDefault();
      zadnja = Math.max(-sirina - 24, Math.min(0, polazna + dx));
      el.style.transform = `translateX(${zadnja}px)`;
    };

    const kraj = () => {
      if (smjer !== 'vodoravno') { smjer = null; return; }
      el.removeAttribute('data-svajp-povlaci');
      postavi(el, zadnja < -sirina / 2, sirina);
      smjer = null;
      // prst koji se podiže ne smije "kliknuti" redak (npr. otvoriti detalje)
      blokirajKlik = true;
      setTimeout(() => { blokirajKlik = false; }, 350);
    };

    const klik = (e) => {
      if (blokirajKlik) { e.preventDefault(); e.stopPropagation(); return; }
      if (!el.hasAttribute('data-svajp-otvoreno')) return;
      if (e.target.closest('[data-svajp-akcije]')) {
        // radnja se izvršava, a redak se nakon toga zatvara
        setTimeout(() => postavi(el, false, 0), 0);
        return;
      }
      // dodir na otvoreni redak samo ga zatvara (ne otvara detalje)
      e.preventDefault();
      e.stopPropagation();
      postavi(el, false, 0);
    };

    el.addEventListener('touchstart', pocetak, { passive: true });
    el.addEventListener('touchmove', pomak, { passive: false });
    el.addEventListener('touchend', kraj, { passive: true });
    el.addEventListener('touchcancel', kraj, { passive: true });
    el.addEventListener('click', klik, true);

    el.__svajpUkloni = () => {
      el.removeEventListener('touchstart', pocetak);
      el.removeEventListener('touchmove', pomak);
      el.removeEventListener('touchend', kraj);
      el.removeEventListener('touchcancel', kraj);
      el.removeEventListener('click', klik, true);
    };
  },

  updated(el) {
    mjeriSirinu(el);
  },

  unmounted(el) {
    if (otvoreni === el) otvoreni = null;
    if (el.__svajpUkloni) el.__svajpUkloni();
  }
};
