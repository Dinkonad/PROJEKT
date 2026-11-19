// Obrada fotki u pregledniku prije uploada: iz originala se rade srednja (prikaz) i mala (mreža) WebP verzija.
// ORIGINAL SE NIKAD NE DIRA: šalje se bajt po bajt kakav je (JPG, PNG, RAW...).
import exifr from 'exifr';

export const SREDNJA_PX = 2048;
export const MALA_PX = 480;
export const RAW_EXT = ['cr2', 'cr3', 'nef', 'arw', 'dng', 'orf', 'rw2', 'raf', 'srw', 'pef'];
export const SLIKA_EXT = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'tif', 'tiff'];
export const SVE_EXT = [...SLIKA_EXT, ...RAW_EXT];
export const ACCEPT = SVE_EXT.map((e) => `.${e}`).join(',');

export const ekstenzija = (ime) => {
  const m = /\.([A-Za-z0-9]+)$/.exec(ime || '');
  return m ? m[1].toLowerCase() : '';
};
export const jeRaw = (ext) => RAW_EXT.includes(ext);
export const podrzanaDatoteka = (ime) => SVE_EXT.includes(ekstenzija(ime));

// ---------- RAW: izvuci najveći ugrađeni JPEG pregled (većina RAW formata ga sadrži)

// vraća indeks odmah iza kraja JPEG-a koji počinje na 'pocetak' (preskače ugniježđene sličice u APPn segmentima)
export function krajJpega(u8, pocetak) {
  const n = u8.length;
  let i = pocetak + 2;
  while (i + 3 < n) {
    if (u8[i] !== 0xff) return -1;
    const m = u8[i + 1];
    if (m === 0xff) { i += 1; continue; }
    if (m === 0xd9) return i + 2;
    if (m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
    const duljina = (u8[i + 2] << 8) | u8[i + 3];
    if (duljina < 2) return -1;
    i += 2 + duljina;
    if (m === 0xda) {
      // podaci slike: preskoči sve dok ne dođe pravi marker (FF00 i RSTn su dio podataka)
      while (i + 1 < n) {
        if (u8[i] === 0xff) {
          const sljedeci = u8[i + 1];
          if (sljedeci === 0x00 || (sljedeci >= 0xd0 && sljedeci <= 0xd7)) { i += 2; continue; }
          if (sljedeci === 0xff) { i += 1; continue; }
          break;
        }
        i += 1;
      }
    }
  }
  return -1;
}

export function kandidatiJpega(u8, najmanje = 60 * 1024) {
  const rez = [];
  for (let i = 0; i + 3 < u8.length; i++) {
    if (u8[i] === 0xff && u8[i + 1] === 0xd8 && u8[i + 2] === 0xff) {
      const kraj = krajJpega(u8, i);
      if (kraj > i && kraj - i >= najmanje) {
        rez.push({ pocetak: i, kraj });
        i = kraj - 1; // unutar ovog JPEG-a nema smisla tražiti druge
      }
    }
  }
  return rez.sort((a, b) => b.kraj - b.pocetak - (a.kraj - a.pocetak));
}

async function pregledIzRawa(file) {
  const u8 = new Uint8Array(await file.arrayBuffer());
  for (const k of kandidatiJpega(u8).slice(0, 4)) {
    const blob = new Blob([u8.subarray(k.pocetak, k.kraj)], { type: 'image/jpeg' });
    try {
      const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
      if (Math.max(bitmap.width, bitmap.height) >= 800) return bitmap;
      bitmap.close();
    } catch { /* probaj sljedeći */ }
  }
  throw new Error('Iz ove RAW datoteke se ne može izvući pregled. Dodaj i JPEG verziju.');
}

// ---------- crtanje

async function dekodiraj(file, ext) {
  if (jeRaw(ext)) return pregledIzRawa(file);
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error(`Preglednik ne može otvoriti .${ext} datoteku. Izvezi je u JPEG.`);
  }
}

function platno(sirina, visina) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(sirina, visina);
  const c = document.createElement('canvas');
  c.width = sirina;
  c.height = visina;
  return c;
}

async function uBlob(c, tip, kvaliteta) {
  if (c.convertToBlob) return c.convertToBlob({ type: tip, quality: kvaliteta });
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('Slika se ne može spremiti.'))), tip, kvaliteta));
}

// smanjuje postupno (po pola) da se izbjegne nazubljenost kod velikog smanjenja
async function smanji(bitmap, najduza, kvaliteta) {
  const omjer = Math.min(1, najduza / Math.max(bitmap.width, bitmap.height));
  const ciljS = Math.max(1, Math.round(bitmap.width * omjer));
  const ciljV = Math.max(1, Math.round(bitmap.height * omjer));
  let izvor = bitmap;
  let s = bitmap.width;
  let v = bitmap.height;
  while (s / 2 > ciljS && v / 2 > ciljV) {
    s = Math.round(s / 2);
    v = Math.round(v / 2);
    const medu = platno(s, v);
    const g = medu.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(izvor, 0, 0, s, v);
    izvor = medu;
  }
  const izlaz = platno(ciljS, ciljV);
  const g = izlaz.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.drawImage(izvor, 0, 0, ciljS, ciljV);
  const blob = await uBlob(izlaz, 'image/webp', kvaliteta);
  if (blob.type !== 'image/webp') throw new Error('Ovaj preglednik ne zna spremiti WebP. Koristi noviji Chrome, Edge ili Safari.');
  return blob;
}

function prosjecnaBoja(bitmap) {
  const c = platno(8, 8);
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(bitmap, 0, 0, 8, 8);
  const d = g.getImageData(0, 0, 8, 8).data;
  let r = 0;
  let gr = 0;
  let b = 0;
  for (let i = 0; i < d.length; i += 4) { r += d[i]; gr += d[i + 1]; b += d[i + 2]; }
  const n = d.length / 4;
  const hex = (x) => Math.round(x / n).toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(gr)}${hex(b)}`;
}

async function datumSnimanja(file) {
  try {
    const e = await exifr.parse(file, ['DateTimeOriginal', 'CreateDate']);
    const d = e?.DateTimeOriginal || e?.CreateDate;
    if (d instanceof Date && !Number.isNaN(d.getTime())) {
      const dv = (x) => String(x).padStart(2, '0');
      return `${d.getFullYear()}-${dv(d.getMonth() + 1)}-${dv(d.getDate())}T${dv(d.getHours())}:${dv(d.getMinutes())}:${dv(d.getSeconds())}`;
    }
  } catch { /* nema EXIF-a */ }
  return file.lastModified ? new Date(file.lastModified).toISOString().slice(0, 19) : '';
}

// glavna funkcija: vraća sve što treba za upload jedne fotke
export async function pripremiFotku(file) {
  const ext = ekstenzija(file.name);
  if (!SVE_EXT.includes(ext)) throw new Error(`Format .${ext || '?'} nije podržan.`);
  const bitmap = await dekodiraj(file, ext);
  try {
    const [srednja, mala, snimljeno] = await Promise.all([smanji(bitmap, SREDNJA_PX, 0.84), smanji(bitmap, MALA_PX, 0.76), datumSnimanja(file)]);
    return { ext, srednja, mala, w: bitmap.width, h: bitmap.height, boja: prosjecnaBoja(bitmap), snimljeno };
  } finally {
    bitmap.close?.();
  }
}
