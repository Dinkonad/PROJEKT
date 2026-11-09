// Što se događa kad povučeš stranicu prema dolje ("povuci za osvježavanje").
// Svaka stranica može javiti svoju funkciju osvježavanja; ako je nema, stranica se jednostavno ponovno učita
// (to ujedno povuče i novu verziju appa).

let osnovni = null;     // postavlja ga okvir aplikacije (npr. početna stranica)
let stranicni = null;   // postavlja stranica koja je trenutno otvorena

// vraća funkciju za odjavu (pozovi je u onBeforeUnmount)
export function postaviOsvjezavanje(funkcija, razina = 'stranica') {
  if (razina === 'osnovno') osnovni = funkcija;
  else stranicni = funkcija;
  return () => {
    if (razina === 'osnovno' && osnovni === funkcija) osnovni = null;
    if (razina !== 'osnovno' && stranicni === funkcija) stranicni = null;
  };
}

export async function osvjeziStranicu() {
  const funkcija = stranicni || osnovni;
  if (funkcija) {
    await funkcija();
  } else {
    window.location.reload();
    await new Promise(() => {}); // stranica se ionako ponovno učitava
  }
}
