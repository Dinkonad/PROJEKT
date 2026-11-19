// Spremanje izravno u galeriju mobitela: preko izbornika za dijeljenje (Web Share API s datotekama).
// iPhone: "Spremi X slika" ide u Fotografije. Android: Galerija / Google fotografije.

const RAW = /\.(dng|cr2|cr3|nef|arw|raf|orf|rw2|pef|srw)$/i;

export const TIPOVI = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', heic: 'image/heic', heif: 'image/heif',
  webp: 'image/webp', gif: 'image/gif', tif: 'image/tiff', tiff: 'image/tiff'
};

// samo obične slike idu u galeriju; RAW i ostalo preuzimaju se kao datoteke / ZIP
export const jeSlikaZaGaleriju = (f) => f.t !== 'raw' && f.t !== 'video' && !RAW.test(f.n || '');

// pravi dodirni uređaj (mobitel/tablet) koji zna dijeliti datoteke
export const mozeSpremitiUGaleriju = () => {
  try {
    if (!window.matchMedia('(pointer: coarse)').matches) return false;
    if (!navigator.share || !navigator.canShare) return false;
    return navigator.canShare({ files: [new File([new Uint8Array(1)], 'a.jpg', { type: 'image/jpeg' })] });
  } catch {
    return false;
  }
};

export const tipDatoteke = (ime) => TIPOVI[(String(ime || '').split('.').pop() || '').toLowerCase()] || 'image/jpeg';

// dijeli popis na dijelove (do N fotki i B bajtova), da mobitelu ne ponestane memorije
export const podijeliNaDijelove = (fotke, maxFotki = 8, maxBajtova = 120 * 1024 * 1024) => {
  const dijelovi = [];
  let tren = [];
  let bajtova = 0;
  for (const f of fotke) {
    const s = f.s || 0;
    if (tren.length && (tren.length >= maxFotki || bajtova + s > maxBajtova)) {
      dijelovi.push(tren);
      tren = [];
      bajtova = 0;
    }
    tren.push(f);
    bajtova += s;
  }
  if (tren.length) dijelovi.push(tren);
  return dijelovi;
};
