// Mali ZIP pisac za preglednik (bez kompresije: fotke su već komprimirane). Bez vanjskih paketa.
// Ograničenje: do 4 GB ukupno i do 65 535 datoteka (ovdje se koristi za male odabire).

const TABLICA = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

// nastavlja CRC-32 preko dijela podataka (početna vrijednost je 0)
export const crcDodaj = (crc, dio) => {
  let c = crc ^ 0xffffffff;
  for (let i = 0; i < dio.length; i++) c = TABLICA[(c ^ dio[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const dosVrijeme = (d) => ({
  vrijeme: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
  datum: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()
});

// zapisi: [{ ime, dijelovi: [Uint8Array|Blob...], velicina, crc }]
export function sloziZip(zapisi, sada = new Date()) {
  const enc = new TextEncoder();
  const { vrijeme, datum } = dosVrijeme(sada);
  const dijelovi = [];
  const sredisnji = [];
  let pomak = 0;

  for (const z of zapisi) {
    const ime = enc.encode(z.ime);
    const lok = new DataView(new ArrayBuffer(30));
    lok.setUint32(0, 0x04034b50, true);
    lok.setUint16(4, 20, true);
    lok.setUint16(6, 0x0800, true); // imena u UTF-8
    lok.setUint16(8, 0, true); // bez kompresije
    lok.setUint16(10, vrijeme, true);
    lok.setUint16(12, datum, true);
    lok.setUint32(14, z.crc, true);
    lok.setUint32(18, z.velicina, true);
    lok.setUint32(22, z.velicina, true);
    lok.setUint16(26, ime.length, true);
    lok.setUint16(28, 0, true);
    dijelovi.push(lok.buffer, ime, ...z.dijelovi);

    const sr = new DataView(new ArrayBuffer(46));
    sr.setUint32(0, 0x02014b50, true);
    sr.setUint16(4, 20, true);
    sr.setUint16(6, 20, true);
    sr.setUint16(8, 0x0800, true);
    sr.setUint16(10, 0, true);
    sr.setUint16(12, vrijeme, true);
    sr.setUint16(14, datum, true);
    sr.setUint32(16, z.crc, true);
    sr.setUint32(20, z.velicina, true);
    sr.setUint32(24, z.velicina, true);
    sr.setUint16(28, ime.length, true);
    sr.setUint32(42, pomak, true);
    sredisnji.push(sr.buffer, ime);
    pomak += 30 + ime.length + z.velicina;
  }

  const velicinaSredisnjeg = sredisnji.reduce((a, x) => a + x.byteLength, 0);
  const kraj = new DataView(new ArrayBuffer(22));
  kraj.setUint32(0, 0x06054b50, true);
  kraj.setUint16(8, zapisi.length, true);
  kraj.setUint16(10, zapisi.length, true);
  kraj.setUint32(12, velicinaSredisnjeg, true);
  kraj.setUint32(16, pomak, true);

  return new Blob([...dijelovi, ...sredisnji, kraj.buffer], { type: 'application/zip' });
}

// ime datoteke bez zabranjenih znakova; ista imena dobiju " (2)", " (3)"...
export const jedinstvenoIme = (ime, koristena) => {
  const osnova = String(ime || 'fotografija').replace(/[\\/:*?"<>|\r\n]/g, '_');
  let rez = osnova;
  let n = 2;
  while (koristena.has(rez.toLowerCase())) {
    const t = osnova.lastIndexOf('.');
    rez = t > 0 ? `${osnova.slice(0, t)} (${n})${osnova.slice(t)}` : `${osnova} (${n})`;
    n += 1;
  }
  koristena.add(rez.toLowerCase());
  return rez;
};
