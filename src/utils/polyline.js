// Dekodiranje "encoded polyline" (preciznost 1e-5) koji backend sprema za svaku rutu (garmin_rute.py).
// Vraća [[lat, lon], ...].
export function dekodirajPolyline(tekst) {
  const tocke = [];
  let i = 0;
  let lat = 0;
  let lon = 0;

  while (i < tekst.length) {
    for (let os = 0; os < 2; os++) {
      let pomak = 0;
      let rezultat = 0;
      let b;
      do {
        b = tekst.charCodeAt(i++) - 63;
        rezultat |= (b & 0x1f) << pomak;
        pomak += 5;
      } while (b >= 0x20 && i <= tekst.length);
      const promjena = rezultat & 1 ? ~(rezultat >> 1) : rezultat >> 1;
      if (os === 0) lat += promjena;
      else lon += promjena;
    }
    tocke.push([lat / 1e5, lon / 1e5]);
  }
  return tocke;
}
