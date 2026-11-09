// "Sakrij iznose" - kao u mobilnom bankarstvu: jednim dodirom se svi iznosi u appu zamijene s ••••,
// pa se app može pokazati drugima bez da vide novac. Stanje se pamti na ovom uređaju.

import { reactive } from 'vue';

const KLJUC = 'nagyphotos_sakrij_novac';

const procitaj = () => {
  try {
    return localStorage.getItem(KLJUC) === '1';
  } catch {
    return false;
  }
};

const stanje = reactive({ sakrijNovac: procitaj() });

export const MASKA = '••••';

export function postaviSakrijNovac(vrijednost) {
  stanje.sakrijNovac = !!vrijednost;
  try {
    localStorage.setItem(KLJUC, stanje.sakrijNovac ? '1' : '0');
  } catch {
    // privatni način rada ili blokirano spremanje - radi i bez pamćenja
  }
}

export const toggleSakrijNovac = () => postaviSakrijNovac(!stanje.sakrijNovac);

// Poziva se pri crtanju predloška (npr. formatCurrency), pa se prikaz sam osvježi kad se stanje promijeni.
export const prikaziNovac = (tekst) => (stanje.sakrijNovac ? MASKA : tekst);

export const privatnost = stanje;
