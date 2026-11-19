<template>
  <div class="pozadina" role="dialog" aria-modal="true" aria-label="Spremanje u fotografije" @mousedown.self="zatvori">
    <div class="kartica">
      <button type="button" class="x" aria-label="Zatvori" @click="zatvori"><Ikona ime="zatvori" /></button>

      <template v-if="faza === 'greska'">
        <h2 class="naslov">Spremanje nije uspjelo</h2>
        <p class="tekst">{{ poruka }}</p>
        <button type="button" class="gumb gumb-glavni" @click="ponovno">Pokušaj ponovno</button>
        <button v-if="ponudiZip" type="button" class="gumb" @click="$emit('kao-zip')">Preuzmi kao ZIP</button>
      </template>

      <template v-else-if="faza === 'spremi'">
        <div class="kvacica"><Ikona ime="preuzmi" /></div>
        <h2 class="naslov">Spremi u galeriju</h2>
        <p class="tekst">Fotografije su spremne u punoj kvaliteti. Dodirni gumb, pa u izborniku odaberi <b>Spremi slike</b> (iPhone) ili <b>Galerija</b> / <b>Fotografije</b> (Android).</p>
        <button type="button" class="gumb gumb-glavni velik" @click="spremi">Spremi {{ datoteke.length }} {{ rijec(datoteke.length) }}</button>
        <p v-if="dijelova > 1" class="mali">Dio {{ red + 1 }} od {{ dijelova }}{{ red + 1 < dijelova ? ': nakon spremanja slijedi sljedeći dio.' : '.' }}</p>
        <p v-if="savjet" class="mali upozorenje">{{ savjet }}</p>
      </template>

      <template v-else-if="faza === 'gotovo'">
        <div class="kvacica"><Ikona ime="kvacica" /></div>
        <h2 class="naslov">Spremljeno</h2>
        <p class="tekst">Fotografije ({{ ukupnoFotki }}) su u tvojoj galeriji.</p>
        <button type="button" class="gumb gumb-glavni" @click="zatvori">Zatvori</button>
      </template>

      <template v-else>
        <div class="kolo" role="status" aria-label="Priprema"></div>
        <h2 class="naslov">Pripremam fotografije</h2>
        <p class="tekst">Skidam originale u punoj kvaliteti{{ dijelova > 1 ? ` (dio ${red + 1} od ${dijelova})` : '' }}. Ostavi stranicu otvorenom.</p>
        <div class="traka" role="progressbar" :aria-valuenow="Math.round(napredak * 100)" aria-valuemin="0" aria-valuemax="100">
          <div class="ispuna" :style="{ width: `${Math.max(4, napredak * 100)}%` }"></div>
        </div>
        <p class="mali">{{ Math.round(napredak * 100) }}%</p>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, onBeforeUnmount } from 'vue';
import Ikona from './Ikona.vue';
import { dohvatiPreuzimanje } from '../api.js';
import { podijeliNaDijelove, tipDatoteke } from '../mobilno.js';

const props = defineProps({
  token: { type: String, required: true },
  fotke: { type: Array, required: true }
});
const emit = defineEmits(['zatvori', 'kao-zip', 'gotovo']);

const dijelovi = podijeliNaDijelove(props.fotke);
const dijelova = dijelovi.length;
const ukupnoFotki = props.fotke.length;

const red = ref(0);
const faza = ref('dohvat'); // dohvat | spremi | gotovo | greska
const napredak = ref(0);
const poruka = ref('');
const savjet = ref('');
const ponudiZip = ref(false);
const datoteke = shallowRef([]);
let zaustavljeno = false;

const rijec = (n) => {
  if (n % 10 === 1 && n % 100 !== 11) return 'fotografiju';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) return 'fotografije';
  return 'fotografija';
};

const dohvatiDio = async () => {
  faza.value = 'dohvat';
  napredak.value = 0;
  poruka.value = '';
  savjet.value = '';
  ponudiZip.value = false;
  const dio = dijelovi[red.value];
  const ukupno = dio.reduce((a, f) => a + (f.s || 0), 0) || 1;
  let skinuto = 0;
  const izlaz = [];
  try {
    for (const f of dio) {
      if (zaustavljeno) return;
      const o = await dohvatiPreuzimanje(props.token, f.i);
      const odgovor = await fetch(o.url, { referrerPolicy: 'no-referrer', credentials: 'omit' });
      if (!odgovor.ok || !odgovor.body) throw new Error('Dohvat fotografije nije uspio.');
      const citac = odgovor.body.getReader();
      const komadi = [];
      for (;;) {
        const { done, value } = await citac.read();
        if (done) break;
        komadi.push(value);
        skinuto += value.length;
        napredak.value = Math.min(0.99, skinuto / ukupno);
        if (zaustavljeno) { citac.cancel(); return; }
      }
      const ime = f.n || `${f.i}.jpg`;
      izlaz.push(new File(komadi, ime, { type: tipDatoteke(ime) }));
    }
  } catch (e) {
    faza.value = 'greska';
    poruka.value = e && e.status === 403 ? (e.message || 'Preuzimanje nije dopušteno.') : 'Dohvat fotografija nije uspio. Provjeri vezu i pokušaj ponovno.';
    ponudiZip.value = !(e && e.status === 403);
    return;
  }
  if (!(navigator.canShare && navigator.canShare({ files: izlaz }))) {
    faza.value = 'greska';
    poruka.value = 'Ovaj uređaj ne može spremiti ove datoteke izravno u galeriju.';
    ponudiZip.value = true;
    return;
  }
  datoteke.value = izlaz;
  faza.value = 'spremi';
};

// Dijeljenje mora doći iz dodira korisnika, zato su fotke prije toga već skinute.
const spremi = async () => {
  savjet.value = '';
  try {
    await navigator.share({ files: datoteke.value });
  } catch (e) {
    if (e && e.name === 'AbortError') { savjet.value = 'Spremanje je prekinuto. Dodirni gumb kad si spreman.'; return; }
    faza.value = 'greska';
    poruka.value = 'Izbornik za spremanje nije se otvorio. Pokušaj ponovno ili preuzmi kao ZIP.';
    ponudiZip.value = true;
    return;
  }
  if (red.value + 1 < dijelova) {
    red.value += 1;
    datoteke.value = [];
    await dohvatiDio();
  } else {
    faza.value = 'gotovo';
    emit('gotovo');
  }
};

const ponovno = () => {
  if (datoteke.value.length) { faza.value = 'spremi'; savjet.value = ''; } else { dohvatiDio(); }
};

const zatvori = () => { zaustavljeno = true; emit('zatvori'); };
onBeforeUnmount(() => { zaustavljeno = true; });
dohvatiDio();
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
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 38px 24px 28px;
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
.tekst b { color: var(--tekst); font-weight: 600; }

.mali { margin: 0; color: var(--tekst-3); font-size: 0.82rem; font-variant-numeric: tabular-nums; }
.upozorenje { color: var(--akcent); }

.velik { width: 100%; min-height: 54px; font-size: 1rem; }

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
