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
        @click="klik(x.s.i)"
        @keydown.enter.prevent="klik(x.s.i)"
        @keydown.space.prevent="klik(x.s.i)"
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

        <span v-if="nacinOdabira" class="kvacica" aria-hidden="true">
          <Ikona :ime="odabrane.has(x.s.i) ? 'kvacica-krug' : 'krug'" />
        </span>
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
const emit = defineEmits(['otvori', 'prebaci', 'srce', 'vidljivo', 'greska-slike']);

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

const klik = (id) => {
  if (props.nacinOdabira) emit('prebaci', id);
  else emit('otvori', id);
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

.kvacica {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  color: #fff;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.6));
}

.kvacica svg {
  width: 26px;
  height: 26px;
}

.plocica.odabrana .kvacica {
  color: var(--akcent);
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
