// Zajedničko ponašanje svih dijaloga u aplikaciji (modali, izbornik "Više", lightbox):
//  - Escape zatvara gornji dijalog
//  - Tab ostaje unutar dijaloga dok je otvoren
//  - na računalu se fokusira prvo polje, a pri zatvaranju fokus se vraća na gumb koji ga je otvorio
//
// Svaka stranica ima svoj modal s vlastitim stanjem, pa se ovdje ne dira stanje nego se
// koristi isto što i klik izvan dijaloga: klik na pozadinu (prekrivač) koji ga već zatvara.

const PREKRIVACI = '.prekrivka-modala, .pozadina, .lightbox-pozadina, .lightbox, .vise-prekrivac';
const FOKUSABILNO = 'a[href], button:not(:disabled), input:not([type="hidden"]):not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

const gornjiPrekrivac = () => {
  const svi = document.querySelectorAll(PREKRIVACI);
  return svi.length ? svi[svi.length - 1] : null;
};

const vidljivo = (el) => el.offsetParent !== null || el === document.activeElement;

export function ukljuciPristupacnostDijaloga() {
  const prijasnjiFokus = [];
  const imaMisa = window.matchMedia('(pointer: fine)');

  document.addEventListener('keydown', (e) => {
    const prekrivac = gornjiPrekrivac();
    if (!prekrivac) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      prekrivac.click();
      return;
    }

    if (e.key === 'Tab') {
      const elementi = [...prekrivac.querySelectorAll(FOKUSABILNO)].filter(vidljivo);
      if (!elementi.length) return;
      const prvi = elementi[0];
      const zadnji = elementi[elementi.length - 1];
      if (!prekrivac.contains(document.activeElement)) {
        e.preventDefault();
        prvi.focus();
      } else if (e.shiftKey && document.activeElement === prvi) {
        e.preventDefault();
        zadnji.focus();
      } else if (!e.shiftKey && document.activeElement === zadnji) {
        e.preventDefault();
        prvi.focus();
      }
    }
  });

  const jePrekrivac = (cvor) => cvor.nodeType === 1 && cvor.matches && cvor.matches(PREKRIVACI);

  new MutationObserver((zapisi) => {
    for (const zapis of zapisi) {
      zapis.addedNodes.forEach((cvor) => {
        if (!jePrekrivac(cvor)) return;
        prijasnjiFokus.push(document.activeElement);
        // na mobitelu fokus na polje odmah otvara tipkovnicu i prekriva formu - tamo se ne radi
        if (imaMisa.matches) {
          requestAnimationFrame(() => {
            const polje = cvor.querySelector('input:not([type="hidden"]):not([type="checkbox"]), select, textarea');
            if (polje) polje.focus();
          });
        }
      });
      zapis.removedNodes.forEach((cvor) => {
        if (!jePrekrivac(cvor)) return;
        const element = prijasnjiFokus.pop();
        if (element && document.contains(element) && typeof element.focus === 'function') element.focus();
      });
    }
  }).observe(document.body, { childList: true, subtree: true });
}
