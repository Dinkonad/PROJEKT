<template>
  <div
    ref="okvir"
    class="svjetlosnik"
    role="dialog"
    aria-modal="true"
    :aria-label="`Fotografija ${index + 1} od ${stavke.length}`"
    tabindex="-1"
    :style="{ '--prozirnost': pozadinaProzirnost }"
    @keydown.esc.stop="$emit('zatvori')"
  >
    <div
      ref="pozornica"
      class="pozornica"
      @pointerdown="naDolje"
      @pointermove="naPomak"
      @pointerup="naGore"
      @pointercancel="naGore"
      @wheel.prevent="naKotacic"
    >
      <div class="traka" :style="{ transform: `translate3d(0, ${dy}px, 0)` }">
        <div
          v-for="s in slajdovi"
          :key="s.f.i"
          class="slajd"
          :class="{ animira: anim }"
          :style="{ transform: `translate3d(calc(${s.pos * 100}% + ${dx}px), 0, 0)` }"
        >
          <div class="zumiranje" :style="s.pos === 0 ? zumStil : null">
            <img v-if="urlovi[s.f.i] && urlovi[s.f.i].t" class="mala" :src="urlovi[s.f.i].t" alt="" draggable="false" />
            <img
              v-if="urlovi[s.f.i] && urlovi[s.f.i].m"
              class="velika"
              :class="{ ucitana: ucitaneM[s.f.i] }"
              :src="urlovi[s.f.i].m"
              :alt="s.f.n"
              draggable="false"
              @load="ucitaneM[s.f.i] = true"
              @error="$emit('greska-slike', s.f.i, 'm')"
            />
            <div v-if="!(urlovi[s.f.i] && urlovi[s.f.i].t) && !(urlovi[s.f.i] && urlovi[s.f.i].m)" class="kolo" role="status" aria-label="Učitavanje"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="gore" :class="{ skriveno: !uiVidljiv }">
      <span class="brojac">{{ index + 1 }} / {{ stavke.length }}</span>
      <span class="ime">{{ trenutna.n }}</span>
      <span class="razmak"></span>
      <button type="button" class="ikona" :class="{ srce: omiljene.has(trenutna.i) }" :aria-label="omiljene.has(trenutna.i) ? 'Ukloni iz omiljenih' : 'Dodaj u omiljene'" :aria-pressed="omiljene.has(trenutna.i)" @click="$emit('srce', trenutna.i)">
        <Ikona :ime="omiljene.has(trenutna.i) ? 'srce-puno' : 'srce'" />
      </button>
      <button v-if="mozeSpremiUFotografije && trenutna.t !== 'raw' && !zakljucano" type="button" class="ikona" aria-label="Spremi u Fotografije na mobitelu" title="Spremi u Fotografije" @click="$emit('spremi', trenutna.i)">
        <Ikona ime="dijeli" />
      </button>
      <button type="button" class="ikona" :aria-label="zakljucano ? 'Preuzimanje je zaključano' : 'Preuzmi originalnu fotografiju'" :title="zakljucano ? 'Preuzimanje će biti omogućeno nakon uplate' : 'Preuzmi original'" @click="$emit('preuzmi', trenutna.i)">
        <Ikona :ime="zakljucano ? 'lokot' : 'preuzmi'" />
      </button>
      <button ref="zatvoriGumb" type="button" class="ikona" aria-label="Zatvori" @click="$emit('zatvori')"><Ikona ime="zatvori" /></button>
    </div>

    <button v-if="index > 0" type="button" class="strelica lijevo" :class="{ skriveno: !uiVidljiv }" aria-label="Prethodna fotografija" @click="idi(-1)"><Ikona ime="lijevo" /></button>
    <button v-if="index < stavke.length - 1" type="button" class="strelica desno" :class="{ skriveno: !uiVidljiv }" aria-label="Sljedeća fotografija" @click="idi(1)"><Ikona ime="desno" /></button>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import Ikona from './Ikona.vue';

const props = defineProps({
  stavke: { type: Array, required: true },
  pocetniIndex: { type: Number, default: 0 },
  urlovi: { type: Object, required: true },
  omiljene: { type: Object, required: true },
  zakljucano: { type: Boolean, default: false },
  mozeSpremiUFotografije: { type: Boolean, default: false }
});
const emit = defineEmits(['zatvori', 'srce', 'preuzmi', 'spremi', 'treba-m', 'greska-slike']);

const okvir = ref(null);
const pozornica = ref(null);
const zatvoriGumb = ref(null);
const index = ref(Math.min(Math.max(props.pocetniIndex, 0), props.stavke.length - 1));
const dx = ref(0);
const dy = ref(0);
const anim = ref(false);
const uiVidljiv = ref(true);
const zoom = reactive({ s: 1, x: 0, y: 0 });
const ucitaneM = reactive({});

const trenutna = computed(() => props.stavke[index.value]);
const slajdovi = computed(() => {
  const izlaz = [];
  for (const pos of [-1, 0, 1]) {
    const f = props.stavke[index.value + pos];
    if (f) izlaz.push({ pos, f });
  }
  return izlaz;
});
const zumStil = computed(() => ({ transform: `translate3d(${zoom.x}px, ${zoom.y}px, 0) scale(${zoom.s})`, transition: zumiranjeAktivno.value ? 'none' : 'transform 0.25s var(--ease)' }));
const pozadinaProzirnost = computed(() => Math.max(0.35, 1 - Math.abs(dy.value) / 500));

const zumiranjeAktivno = ref(false);
let skrivac = null;

const resetZoom = () => { zoom.s = 1; zoom.x = 0; zoom.y = 0; };
const sirinaEkrana = () => pozornica.value?.clientWidth || window.innerWidth;

const prikaziUi = () => {
  uiVidljiv.value = true;
  clearTimeout(skrivac);
  skrivac = setTimeout(() => { uiVidljiv.value = false; }, 3500);
};

const idi = (smjer) => {
  const novi = index.value + smjer;
  if (novi < 0 || novi >= props.stavke.length || anim.value) { dx.value = 0; return; }
  anim.value = true;
  dx.value = -smjer * sirinaEkrana();
  setTimeout(() => {
    anim.value = false;
    index.value = novi;
    dx.value = 0;
    resetZoom();
  }, 260);
};

// ---------- dodir / miš
const tocke = new Map();
let pocetak = null; // { x, y, t, os }
let pinch = null;
let zadnjiTap = { t: 0, x: 0, y: 0 };

const naDolje = (e) => {
  if (e.target.closest('button')) return;
  pozornica.value.setPointerCapture?.(e.pointerId);
  tocke.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (tocke.size === 2) {
    const [a, b] = [...tocke.values()];
    pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: zoom.s };
    pocetak = null;
    dx.value = 0;
  } else {
    pocetak = { x: e.clientX, y: e.clientY, t: performance.now(), os: null, px: e.clientX, py: e.clientY, zx: zoom.x, zy: zoom.y };
  }
};

const naPomak = (e) => {
  if (!tocke.has(e.pointerId)) { if (e.pointerType === 'mouse') prikaziUi(); return; }
  tocke.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (tocke.size === 2 && pinch) {
    const [a, b] = [...tocke.values()];
    zumiranjeAktivno.value = true;
    zoom.s = Math.min(5, Math.max(1, pinch.s * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.d)));
    if (zoom.s === 1) { zoom.x = 0; zoom.y = 0; }
    return;
  }
  if (!pocetak || anim.value) return;
  const ox = e.clientX - pocetak.x;
  const oy = e.clientY - pocetak.y;

  if (zoom.s > 1) {                       // uvećano: pomicanje slike
    zumiranjeAktivno.value = true;
    zoom.x = pocetak.zx + ox;
    zoom.y = pocetak.zy + oy;
    return;
  }
  if (!pocetak.os && (Math.abs(ox) > 8 || Math.abs(oy) > 8)) pocetak.os = Math.abs(ox) > Math.abs(oy) ? 'x' : 'y';
  if (pocetak.os === 'x') {
    const rub = (index.value === 0 && ox > 0) || (index.value === props.stavke.length - 1 && ox < 0);
    dx.value = rub ? ox * 0.3 : ox;
  } else if (pocetak.os === 'y') {
    dy.value = oy;
  }
};

const naGore = (e) => {
  const trajanje = performance.now() - (pocetak?.t || 0);
  tocke.delete(e.pointerId);
  if (pinch) {
    if (tocke.size < 2) { pinch = null; zumiranjeAktivno.value = false; if (zoom.s < 1.05) resetZoom(); }
    pocetak = null;
    return;
  }
  zumiranjeAktivno.value = false;
  if (!pocetak) return;
  const ox = e.clientX - pocetak.x;
  const oy = e.clientY - pocetak.y;
  const os = pocetak.os;
  pocetak = null;

  if (os === 'x' && zoom.s === 1) {
    const brzina = Math.abs(ox) / Math.max(trajanje, 1);
    if (Math.abs(ox) > Math.min(90, sirinaEkrana() * 0.18) || brzina > 0.5) idi(ox < 0 ? 1 : -1);
    else { anim.value = true; dx.value = 0; setTimeout(() => { anim.value = false; }, 260); }
    return;
  }
  if (os === 'y' && zoom.s === 1) {
    if (Math.abs(oy) > 110) emit('zatvori');
    else dy.value = 0;
    return;
  }
  if (Math.abs(ox) < 8 && Math.abs(oy) < 8) {      // dodir bez povlačenja
    const sad = performance.now();
    if (sad - zadnjiTap.t < 320 && Math.hypot(e.clientX - zadnjiTap.x, e.clientY - zadnjiTap.y) < 30) {
      zadnjiTap = { t: 0, x: 0, y: 0 };
      if (zoom.s > 1) resetZoom();
      else {
        const r = pozornica.value.getBoundingClientRect();
        zoom.s = 2.6;
        zoom.x = (r.left + r.width / 2 - e.clientX) * 1.6;
        zoom.y = (r.top + r.height / 2 - e.clientY) * 1.6;
      }
    } else {
      zadnjiTap = { t: sad, x: e.clientX, y: e.clientY };
      setTimeout(() => { if (zadnjiTap.t === sad) { uiVidljiv.value ? (uiVidljiv.value = false) : prikaziUi(); } }, 330);
    }
  }
};

const naKotacic = (e) => {
  const novi = Math.min(5, Math.max(1, zoom.s * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
  zoom.s = novi;
  if (novi === 1) { zoom.x = 0; zoom.y = 0; }
};

const naTipku = (e) => {
  if (e.key === 'ArrowRight') { e.preventDefault(); idi(1); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); idi(-1); }
  else if (e.key === 'Escape') emit('zatvori');
  else if (e.key === 'Home') { index.value = 0; resetZoom(); }
  else if (e.key === 'End') { index.value = props.stavke.length - 1; resetZoom(); }
  prikaziUi();
};

// Srednje verzije se traže za trenutnu i susjedne; kad stignu, odmah se učitaju u pozadini (glatko listanje).
const trebaSusjede = () => {
  const ids = [];
  for (const k of [0, 1, -1, 2]) {
    const f = props.stavke[index.value + k];
    if (f && !(props.urlovi[f.i] && props.urlovi[f.i].m)) ids.push(f.i);
  }
  if (ids.length) emit('treba-m', ids);
};

const unaprijedUcitane = new Set();
const predUcitaj = () => {
  for (const k of [1, -1, 2]) {
    const f = props.stavke[index.value + k];
    const u = f && props.urlovi[f.i] && props.urlovi[f.i].m;
    if (u && !unaprijedUcitane.has(u)) {
      unaprijedUcitane.add(u);
      const slika = new Image();
      slika.src = u;
    }
  }
};

watch(index, () => { trebaSusjede(); predUcitaj(); prikaziUi(); }, { immediate: true });
watch(() => props.urlovi, predUcitaj, { deep: true });

onMounted(() => {
  document.body.classList.add('zakljucan');
  window.addEventListener('keydown', naTipku);
  okvir.value?.focus();
  prikaziUi();
});

onBeforeUnmount(() => {
  document.body.classList.remove('zakljucan');
  window.removeEventListener('keydown', naTipku);
  clearTimeout(skrivac);
});
</script>

<style scoped>
.svjetlosnik {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(6, 6, 8, var(--prozirnost, 1));
  outline: none;
  animation: ulaz 0.28s var(--ease);
  overscroll-behavior: contain;
}

.pozornica {
  position: absolute;
  inset: 0;
  overflow: hidden;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.traka {
  position: absolute;
  inset: 0;
  will-change: transform;
}

.slajd {
  position: absolute;
  inset: 0;
  will-change: transform;
}

.slajd.animira {
  transition: transform 0.26s var(--ease);
}

.zumiranje {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: env(safe-area-inset-top, 0) 0 env(safe-area-inset-bottom, 0);
  will-change: transform;
}

.zumiranje img {
  position: absolute;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  -webkit-user-drag: none;
  pointer-events: none;
}

.zumiranje .mala {
  inset: 0;
  margin: auto;
  filter: blur(14px);
  transform: scale(1.02);
}

.zumiranje .velika {
  inset: 0;
  margin: auto;
  opacity: 0;
  transition: opacity 0.35s ease;
}

.zumiranje .velika.ucitana {
  opacity: 1;
}

.kolo {
  width: 30px;
  height: 30px;
  border: 2px solid var(--linija);
  border-top-color: var(--akcent);
  border-radius: 50%;
  animation: vrti 0.9s linear infinite;
}

.gore {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: calc(10px + env(safe-area-inset-top, 0px)) 12px 28px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0));
  transition: opacity 0.3s, transform 0.3s var(--ease);
  pointer-events: none;
}

.gore > * {
  pointer-events: auto;
}

.gore.skriveno {
  opacity: 0;
  transform: translateY(-8px);
  pointer-events: none;
}

.gore.skriveno > * {
  pointer-events: none;
}

.brojac {
  padding: 0 8px;
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
  color: var(--tekst);
}

.ime {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8rem;
  color: var(--tekst-3);
}

.razmak {
  flex: 1;
}

.ikona {
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--tekst);
  transition: background-color 0.2s;
}

.ikona:hover {
  background: rgba(255, 255, 255, 0.12);
}

.ikona svg {
  width: 24px;
  height: 24px;
}

.ikona.srce {
  color: #ff7a85;
}

.strelica {
  position: absolute;
  top: 50%;
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--linija);
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.35);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  transform: translateY(-50%);
  transition: opacity 0.3s, background-color 0.2s;
}

.strelica:hover {
  background: rgba(255, 255, 255, 0.14);
}

.strelica svg {
  width: 26px;
  height: 26px;
}

.strelica.lijevo {
  left: 18px;
}

.strelica.desno {
  right: 18px;
}

.strelica.skriveno {
  opacity: 0;
  pointer-events: none;
}

@media (hover: none) {
  .strelica {
    display: none;
  }
}

@keyframes ulaz {
  from {
    opacity: 0;
  }
}

@keyframes vrti {
  to {
    transform: rotate(360deg);
  }
}
</style>
