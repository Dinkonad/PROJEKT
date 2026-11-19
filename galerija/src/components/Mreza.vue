<template>
  <div ref="kontejner" class="mreza" :style="{ '--razmak': `${razmak}px` }">
    <p v-if="!stavke.length" class="prazno">Nema fotografija u ovom prikazu.</p>

    <div v-for="(red, r) in redovi" :key="r" class="red" :style="{ height: `${red.h}px` }">
      <div
        v-for="(x, k) in red.stavke"
        :key="x.s.i"
        :ref="(el) => promatraj(el, x.s.i)"
        class="plocica"
        :class="{ odabrana: odabrane.has(x.s.i), ucitana: ucitane[x.s.i] }"
        :style="{ width: `${x.w}px`, backgroundColor: x.s.c || '#1d1d21', '--kasni': `${Math.min(k, 6) * 40}ms` }"
        role="button"
        tabindex="0"
        :aria-label="`Fotografija ${x.s.n}`"
        @click="klik(x.s.i, $event)"
        @keydown.enter.prevent="klik(x.s.i, $event)"
        @keydown.space.prevent="klik(x.s.i, $event)"
        @pointerdown="dolje($event, x.s.i)"
        @pointermove="pomak"
        @pointerup="gore"
        @pointercancel="gore"
        @pointerleave="gore"
        @contextmenu="izbornikDodira"
      >
        <img
          v-if="urlovi[x.s.i] && urlovi[x.s.i].t"
          :src="urlovi[x.s.i].t"
          :alt="x.s.n"
          draggable="false"
          decoding="async"
          @load="ucitane[x.s.i] = true"
          @error="$emit('greska-slike', x.s.i)"
        />
        <span class="sjena"></span>

        <button
          type="button"
          class="srce"
          :class="{ aktivno: omiljene.has(x.s.i) }"
          :aria-label="omiljene.has(x.s.i) ? 'Ukloni iz omiljenih' : 'Dodaj u omiljene'"
          :aria-pressed="omiljene.has(x.s.i)"
          @click.stop="$emit('srce', x.s.i)"
        >
          <Ikona :ime="omiljene.has(x.s.i) ? 'srce-puno' : 'srce'" />
        </button>

        <button
          type="button"
          class="krug"
          :class="{ aktivan: odabrane.has(x.s.i), vidljiv: nacinOdabira }"
          :aria-label="odabrane.has(x.s.i) ? 'Ukloni iz odabira' : 'Odaberi fotografiju'"
          :aria-pressed="odabrane.has(x.s.i)"
          @click.stop="$emit('odaberi', x.s.i, $event.shiftKey)"
          @keydown.enter.stop
          @keydown.space.stop
        >
          <Ikona :ime="odabrane.has(x.s.i) ? 'kvacica-krug' : 'krug'" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import Ikona from './Ikona.vue';

const props = defineProps({
  stavke: { type: Array, required: true },
  urlovi: { type: Object, required: true },
  odabrane: { type: Object, required: true },
  omiljene: { type: Object, required: true },
  nacinOdabira: { type: Boolean, default: false }
});
const emit = defineEmits(['otvori', 'odaberi', 'srce', 'vidljivo', 'greska-slike']);

const kontejner = ref(null);
const sirina = ref(0);
const ucitane = reactive({});

const razmak = computed(() => (sirina.value < 520 ? 3 : 6));
const ciljnaVisina = computed(() => (sirina.value < 520 ? 150 : sirina.value < 900 ? 210 : sirina.value < 1400 ? 270 : 320));

// poravnati redovi (kao Google Photos): svaki red je do ruba, bez praznina, omjeri stranica ostaju točni
const redovi = computed(() => {
  const W = Math.floor(sirina.value);
  if (!W || !props.stavke.length) return [];
  const razm = razmak.value;
  const cilj = ciljnaVisina.value;
  const izlaz = [];
  let red = [];
  let zbroj = 0;
  const zatvori = (zadnji) => {
    const sirinaBez = W - razm * (red.length - 1);
    let h = sirinaBez / zbroj;
    if (zadnji) h = Math.min(cilj, h);
    izlaz.push({ h: Math.floor(h), stavke: red.map((x) => ({ s: x.s, w: Math.floor(x.ar * h) })) });
    red = [];
    zbroj = 0;
  };
  for (const s of props.stavke) {
    const ar = Math.max(0.2, Math.min(5, (s.w || 3) / (s.h || 2)));
    red.push({ s, ar });
    zbroj += ar;
    if (zbroj * cilj >= W - razm * (red.length - 1)) zatvori(false);
  }
  if (red.length) zatvori(true);
  return izlaz;
});

// Klik: otvara fotku, a čim je išta odabrano, odabire/odznačuje. Ctrl/Cmd+klik odabire, Shift+klik odabire raspon.
let potisniKlik = false;
const klik = (id, e) => {
  if (potisniKlik) { potisniKlik = false; return; } // klik koji slijedi nakon dugog dodira
  if (e && (e.ctrlKey || e.metaKey)) { emit('odaberi', id, false); return; }
  if (props.nacinOdabira) { emit('odaberi', id, !!(e && e.shiftKey)); return; }
  emit('otvori', id);
};

// Dugi dodir (mobitel/tablet): počinje odabir, kao u Fotografijama
let tajmerDodira = null;
let pocetakX = 0;
let pocetakY = 0;
const dolje = (e, id) => {
  if (e.pointerType === 'mouse' || e.target.closest('.srce, .krug')) return;
  pocetakX = e.clientX;
  pocetakY = e.clientY;
  clearTimeout(tajmerDodira);
  tajmerDodira = setTimeout(() => {
    tajmerDodira = null;
    potisniKlik = true;
    if (navigator.vibrate) navigator.vibrate(12);
    emit('odaberi', id, false);
  }, 420);
};
const pomak = (e) => {
  if (tajmerDodira && Math.hypot(e.clientX - pocetakX, e.clientY - pocetakY) > 10) {
    clearTimeout(tajmerDodira);
    tajmerDodira = null;
  }
};
const gore = () => {
  clearTimeout(tajmerDodira);
  tajmerDodira = null;
  if (potisniKlik) setTimeout(() => { potisniKlik = false; }, 350); // ako klika nakon podizanja prsta nema
};
// na dodirnim uređajima dugi dodir ne smije otvoriti izbornik preglednika ("Spremi sliku" i sl.)
const izbornikDodira = (e) => {
  try { if (window.matchMedia('(hover: none)').matches) e.preventDefault(); } catch { /* ništa */ }
};

// slike se traže tek kad se plocica približi ekranu
let promatrac = null;
const elementi = new Map();
const promatraj = (el, id) => {
  const stari = elementi.get(id);
  if (stari === el) return;
  if (stari && promatrac) promatrac.unobserve(stari);
  if (el) {
    elementi.set(id, el);
    el.dataset.id = id;
    if (promatrac) promatrac.observe(el);
  } else {
    elementi.delete(id);
  }
};

let promjenaVelicine = null;
onMounted(() => {
  promatrac = new IntersectionObserver((unosi) => {
    const ids = [];
    for (const u of unosi) {
      if (u.isIntersecting) {
        ids.push(u.target.dataset.id);
        promatrac.unobserve(u.target);
      }
    }
    if (ids.length) emit('vidljivo', ids);
  }, { rootMargin: '900px 0px' });
  elementi.forEach((el) => promatrac.observe(el));

  const izmjeri = () => { sirina.value = kontejner.value ? kontejner.value.clientWidth : 0; };
  izmjeri();
  promjenaVelicine = new ResizeObserver(izmjeri);
  promjenaVelicine.observe(kontejner.value);
});

onBeforeUnmount(() => {
  promatrac?.disconnect();
  promjenaVelicine?.disconnect();
});
</script>

<style scoped>
.mreza {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--razmak);
}

.prazno {
  padding: 60px 0;
  text-align: center;
  color: var(--tekst-3);
}

.red {
  display: flex;
  gap: var(--razmak);
}

.plocica {
  position: relative;
  flex: none;
  height: 100%;
  overflow: hidden;
  cursor: zoom-in;
  border-radius: 2px;
  outline-offset: -2px;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.plocica img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transform: scale(1.04);
  transition: opacity 0.7s var(--ease) var(--kasni), transform 0.9s var(--ease) var(--kasni);
  -webkit-user-drag: none;
  user-select: none;
}

.plocica.ucitana img {
  opacity: 1;
  transform: scale(1);
}

.plocica:hover img {
  transform: scale(1.035);
  transition-delay: 0s;
}

.sjena {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 55%, rgba(0, 0, 0, 0.4));
  opacity: 0;
  transition: opacity 0.25s;
  pointer-events: none;
}

.plocica:hover .sjena,
.plocica:focus-visible .sjena,
.plocica.odabrana .sjena {
  opacity: 1;
}

.srce {
  position: absolute;
  right: 8px;
  bottom: 8px;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.35);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  color: #fff;
  opacity: 0;
  transform: scale(0.85);
  transition: opacity 0.2s, transform 0.2s var(--ease), background-color 0.2s;
}

.srce svg {
  width: 19px;
  height: 19px;
}

.plocica:hover .srce,
.srce:focus-visible,
.srce.aktivno {
  opacity: 1;
  transform: scale(1);
}

.srce.aktivno {
  color: #ff7a85;
}

/* krug za odabir: miš ga pokazuje na hover, a na dodiru je vidljiv tek kad je odabir započeo */
.krug {
  position: absolute;
  top: 6px;
  left: 6px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  color: #fff;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transform: scale(0.9);
  transition: opacity 0.15s, transform 0.2s var(--ease);
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.65));
}

.krug svg {
  width: 26px;
  height: 26px;
}

.plocica:hover .krug,
.plocica:focus-visible .krug,
.krug:focus-visible,
.krug.vidljiv {
  opacity: 1;
  pointer-events: auto;
  transform: scale(1);
}

.krug:hover {
  transform: scale(1.12);
}

.krug.aktivan {
  color: var(--akcent);
}

@media (hover: none) {
  .plocica:hover .krug {
    opacity: 0;
    pointer-events: none;
  }

  .plocica:hover .krug.vidljiv {
    opacity: 1;
    pointer-events: auto;
  }
}

.plocica.odabrana img {
  transform: scale(0.94);
  transition-delay: 0s;
}

.plocica.odabrana {
  box-shadow: inset 0 0 0 3px var(--akcent);
}

/* dodir: srce je uvijek vidljivo, hover ne postoji */
@media (hover: none) {
  .srce {
    opacity: 0.9;
    transform: scale(1);
    width: 30px;
    height: 30px;
    right: 5px;
    bottom: 5px;
  }
}
</style>
