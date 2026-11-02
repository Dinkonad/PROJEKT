// Kratke poruke na vrhu ekrana (umjesto alert() prozora koji blokira stranicu i na iPhoneu izgleda kao greška preglednika).
//
// Korištenje: obavijesti('Spremljeno.')  ili  obavijesti('Greška pri spremanju.', 'greska')
// Vrsta se inače pogodi iz teksta ("Greška...", "Nije uspjelo..." -> greska).

import { reactive } from 'vue';

export const obavijestiStanje = reactive({ lista: [] });

let sljedeciId = 1;

const jeGreska = (tekst) => /gre[sš]k|nije uspj|nije uspio|neuspj|neispravn|ne podr[zž]ava/i.test(tekst);

export function ukloniObavijest(id) {
  const indeks = obavijestiStanje.lista.findIndex(o => o.id === id);
  if (indeks !== -1) obavijestiStanje.lista.splice(indeks, 1);
}

export function obavijesti(tekst, vrsta) {
  const stvarnaVrsta = vrsta || (jeGreska(String(tekst)) ? 'greska' : 'info');
  const id = sljedeciId++;
  obavijestiStanje.lista.push({ id, tekst: String(tekst), vrsta: stvarnaVrsta });
  // greške ostaju malo dulje da se stignu pročitati
  setTimeout(() => ukloniObavijest(id), stvarnaVrsta === 'greska' ? 8000 : 5000);
  return id;
}
