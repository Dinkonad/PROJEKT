// Mjesečna potrošnja goriva iz ZBIRNOG brojača litara.
//
// Na kraju mjeseca upisuješ stanje brojača (npr. 450, idući mjesec 475). Potrošnja tog mjeseca
// je RAZLIKA između dva uzastopna unosa (475 - 450 = 25 L), a trošak = razlika x cijena po litri
// upisana uz taj unos. Prvi unos nema prethodnika pa se računa cijeli brojač (450 x cijena).
//
// Računa se uvijek iznova iz spremljenih unosa, pa uređivanje ili brisanje unosa usred niza
// samo preračuna razlike - ništa se ne zbraja "dvaput".

export const jeNovoOcitanje = (o) => typeof o?.brojacLitara === 'number';

export const poredajOcitanja = (lista) =>
  [...lista].sort((a, b) => a.mjesec.localeCompare(b.mjesec) || (a.kreirano || 0) - (b.kreirano || 0));

const zaokruzi = (n) => Math.round(n * 100) / 100;

// Vraća Map: id unosa -> { potroseno, trosak, prvi, prethodniBrojac, prethodniKm, neispravno }
// "Stari" unosi (bez brojacLitara) se preskaču - oni se računaju kao i prije.
export function izracunPotrosnje(lista) {
  const nova = poredajOcitanja(lista).filter(jeNovoOcitanje);
  const rezultat = new Map();

  nova.forEach((o, i) => {
    const prethodni = i > 0 ? nova[i - 1] : null;
    const razlika = prethodni ? o.brojacLitara - prethodni.brojacLitara : o.brojacLitara;
    // brojač manji od prethodnog = pogrešan unos (ili je brojač resetiran) - ne pogađamo, samo upozorimo
    const neispravno = razlika < 0;
    const cijena = Number(o.cijenaPoLitri) || 0;

    rezultat.set(o.id, {
      potroseno: neispravno ? null : zaokruzi(razlika),
      trosak: !neispravno && cijena > 0 ? zaokruzi(razlika * cijena) : null,
      prvi: !prethodni,
      prethodniBrojac: prethodni ? prethodni.brojacLitara : null,
      prethodniKm: prethodni && typeof prethodni.kilometraza === 'number' ? prethodni.kilometraza : null,
      neispravno
    });
  });

  return rezultat;
}
