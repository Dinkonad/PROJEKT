<template>
  <div class="pozadina" role="dialog" aria-modal="true" aria-label="Spremanje u mapu" @mousedown.self="zatvori">
    <div class="kartica">
      <button type="button" class="x" aria-label="Zatvori" @click="zatvori"><Ikona ime="zatvori" /></button>

      <template v-if="faza === 'greska'">
        <h2 class="naslov">Spremanje nije uspjelo</h2>
        <p class="tekst">{{ poruka }}</p>
        <button type="button" class="gumb gumb-glavni" @click="ponovi">Pokušaj ponovno</button>
      </template>

      <template v-else-if="faza === 'gotovo'">
        <div class="kvacica"><Ikona ime="kvacica" /></div>
        <h2 class="naslov">Spremljeno</h2>
        <p class="tekst">Fotografije ({{ fotke.length }}) su u mapi <b>{{ nazivMape }}</b> unutar odabrane mape.</p>
        <button type="button" class="gumb gumb-glavni" @click="zatvori">Zatvori</button>
      </template>

      <template v-else>
        <div class="kolo" role="status" aria-label="Spremanje"></div>
        <h2 class="naslov">Spremam fotografije</h2>
        <p class="tekst">Originali se spremaju izravno u mapu <b>{{ nazivMape }}</b>. Ostavi stranicu otvorenom.</p>
        <div class="traka" role="progressbar" :aria-valuenow="Math.round(napredak * 100)" aria-valuemin="0" aria-valuemax="100">
          <div class="ispuna" :style="{ width: `${Math.max(4, napredak * 100)}%` }"></div>
        </div>
        <p class="mali">{{ gotovo }} od {{ fotke.length }} fotografija · {{ Math.round(napredak * 100) }}%</p>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue';
import Ikona from './Ikona.vue';
import { dohvatiPreuzimanje } from '../api.js';
import { jedinstvenoIme } from '../zip.js';

// Fotke se upisuju izravno u mapu koju je korisnik odabrao (File System Access API, Chrome/Edge).
// Datoteka se prenosi streamom, pa memorija ostaje mala i radi i za nekoliko GB.
const props = defineProps({
  token: { type: String, required: true },
  fotke: { type: Array, required: true },
  dir: { type: Object, required: true },
  naziv: { type: String, default: 'galerija' }
});
const emit = defineEmits(['zatvori', 'gotovo']);

const nazivMape = (String(props.naziv || 'galerija').replace(/[\\/:*?"<>|\r\n]/g, '_').replace(/[. ]+$/g, '').trim().slice(0, 80)) || 'galerija';
const koristena = new Set();
const imena = props.fotke.map((f) => jedinstvenoIme(f.n || `${f.i}.jpg`, koristena));
const ukupnoBajtova = props.fotke.reduce((a, f) => a + (f.s || 0), 0) || 1;

const faza = ref('radi'); // radi | gotovo | greska
const poruka = ref('');
const gotovo = ref(0);
const napredak = ref(0);
let skinuto = 0;
let zaustavljeno = false;
const spremljene = new Set();
let zabranjeno = false;
let korijen = null;

const osvjezi = () => { napredak.value = Math.min(0.99, skinuto / ukupnoBajtova); };

const jedna = async (i) => {
  const f = props.fotke[i];
  for (let pokusaj = 1; pokusaj <= 3; pokusaj++) {
    if (zaustavljeno || zabranjeno) return false;
    let brojano = 0;
    try {
      const o = await dohvatiPreuzimanje(props.token, f.i);
      const odgovor = await fetch(o.url, { referrerPolicy: 'no-referrer', credentials: 'omit' });
      if (!odgovor.ok || !odgovor.body) throw new Error('dohvat');
      const rucka = await korijen.getFileHandle(imena[i], { create: true });
      const pisac = await rucka.createWritable();
      const brojac = new TransformStream({
        transform(dio, kontrola) {
          brojano += dio.byteLength;
          skinuto += dio.byteLength;
          osvjezi();
          kontrola.enqueue(dio);
        }
      });
      await odgovor.body.pipeThrough(brojac).pipeTo(pisac);
      return true;
    } catch (e) {
      skinuto -= brojano; // neuspjeli pokušaj ne smije pokvariti traku napretka
      if (e && e.status === 403) { zabranjeno = true; poruka.value = e.message || 'Preuzimanje nije dopušteno.'; return false; }
      if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) { zabranjeno = true; poruka.value = 'Preglednik nije dopustio upis u odabranu mapu. Odaberi drugu mapu.'; return false; }
      if (e && e.name === 'QuotaExceededError') { zabranjeno = true; poruka.value = 'Nema dovoljno mjesta na disku.'; return false; }
      if (pokusaj === 3) return false;
      await new Promise((r) => setTimeout(r, 800 * pokusaj));
    }
  }
  return false;
};

const pokreni = async (indeksi) => {
  faza.value = 'radi';
  poruka.value = '';
  zabranjeno = false;
  try {
    if (!korijen) korijen = await props.dir.getDirectoryHandle(nazivMape, { create: true });
  } catch (e) {
    faza.value = 'greska';
    poruka.value = 'Ne mogu napraviti mapu na odabranom mjestu. Odaberi drugu mapu.';
    return;
  }
  const red = [...indeksi];
  const radnik = async () => {
    while (red.length && !zaustavljeno && !zabranjeno) {
      const i = red.shift();
      if (await jedna(i)) { spremljene.add(i); gotovo.value = spremljene.size; }
    }
  };
  await Promise.all([radnik(), radnik(), radnik()]);
  if (zaustavljeno) return;
  if (spremljene.size < props.fotke.length) {
    faza.value = 'greska';
    if (!poruka.value) poruka.value = `Spremljeno je ${spremljene.size} od ${props.fotke.length} fotografija. Provjeri vezu i pokušaj ponovno: spremit će se samo preostale.`;
    return;
  }
  napredak.value = 1;
  faza.value = 'gotovo';
  emit('gotovo');
};

const ponovi = () => pokreni(props.fotke.map((_, i) => i).filter((i) => !spremljene.has(i)));

const zatvori = () => { zaustavljeno = true; emit('zatvori'); };
onBeforeUnmount(() => { zaustavljeno = true; });
pokreni(props.fotke.map((_, i) => i));
</script>

<style scoped>
.pozadina {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(6, 6, 8, 0.72);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  animation: ulaz 0.25s var(--ease);
}

.kartica {
  position: relative;
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 38px 28px 30px;
  text-align: center;
  border: 1px solid var(--linija);
  border-radius: 22px;
  background: var(--bg-2);
}

.x {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--tekst-2);
}

.x svg { width: 20px; height: 20px; }

.naslov {
  margin: 0;
  font-family: var(--font-naslov);
  font-size: 1.9rem;
  font-weight: 500;
}

.tekst { margin: 0; color: var(--tekst-2); font-size: 0.92rem; }
.tekst b { color: var(--tekst); font-weight: 600; word-break: break-word; }
.mali { margin: 0; color: var(--tekst-3); font-size: 0.82rem; font-variant-numeric: tabular-nums; }

.traka { width: 100%; height: 6px; overflow: hidden; border-radius: 999px; background: var(--bg-3); }
.ispuna { height: 100%; border-radius: 999px; background: var(--akcent); transition: width 0.4s var(--ease); }

.kolo {
  width: 34px;
  height: 34px;
  border: 2px solid var(--linija);
  border-top-color: var(--akcent);
  border-radius: 50%;
  animation: vrti 0.9s linear infinite;
}

.kvacica {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--akcent-tamni);
  color: var(--akcent);
}

.kvacica svg { width: 28px; height: 28px; }

@keyframes ulaz { from { opacity: 0; } }
@keyframes vrti { to { transform: rotate(360deg); } }
</style>
