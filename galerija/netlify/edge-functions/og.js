// Lijep pregled linka u WhatsAppu / Instagramu / iMessageu: preglednici i aplikacije za poruke ne izvršavaju JavaScript,
// pa naslov i naslovnu sliku ubacujemo u HTML prije slanja. Ako išta pođe po zlu, vraća se obična stranica (galerija radi svejedno).
// PIN galerije: backend ne vraća sliku, samo naslov.

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const okolina = (ime) => {
  try { return (globalThis.Netlify?.env?.get(ime) ?? globalThis.Deno?.env?.get(ime) ?? '').toString(); } catch { return ''; }
};

export default async (request, context) => {
  const odgovor = await context.next();
  try {
    const m = new URL(request.url).pathname.match(/^\/g\/([A-Za-z0-9_-]{16,64})\/?$/);
    if (!m || !(odgovor.headers.get('content-type') || '').includes('text/html')) return odgovor;
    const api = okolina('VITE_API_URL').replace(/\/+$/, '');
    if (!api) return odgovor;

    const kontrola = new AbortController();
    const odbrojavanje = setTimeout(() => kontrola.abort(), 2500);
    let og = null;
    try {
      const r = await fetch(`${api}/javno/g/${m[1]}/og`, { signal: kontrola.signal });
      if (r.ok) og = await r.json();
    } finally {
      clearTimeout(odbrojavanje);
    }
    if (!og || !og.naslov) return odgovor;

    const marka = okolina('VITE_MARKA') || 'Nagy Photos';
    const naslov = esc(og.naslov);
    const opis = esc(`Tvoje fotografije: ${marka}`);
    const slika = og.slika ? `${api}/javno/g/${m[1]}/naslovna` : '';
    const tagovi = [
      `<meta property="og:type" content="website">`,
      `<meta property="og:title" content="${naslov}">`,
      `<meta property="og:description" content="${opis}">`,
      `<meta property="og:site_name" content="${esc(marka)}">`,
      slika ? `<meta property="og:image" content="${esc(slika)}">` : '',
      `<meta name="twitter:card" content="${slika ? 'summary_large_image' : 'summary'}">`,
      `<meta name="twitter:title" content="${naslov}">`,
      slika ? `<meta name="twitter:image" content="${esc(slika)}">` : ''
    ].join('\n    ');

    let html = await odgovor.text();
    html = html.replace('<!--OG-->', tagovi).replace(/<title>[\s\S]*?<\/title>/, `<title>${naslov}</title>`);
    const zaglavlja = new Headers(odgovor.headers);
    zaglavlja.delete('content-length');
    zaglavlja.set('cache-control', 'no-store');
    return new Response(html, { status: odgovor.status, headers: zaglavlja });
  } catch {
    return odgovor;
  }
};

export const config = { path: '/g/*' };
