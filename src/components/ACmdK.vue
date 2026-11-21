<template>
  <Teleport to="body">
    <div v-if="otvoreno" class="cmdk-pozadina" @mousedown.self="zatvori">
      <div class="cmdk" role="dialog" aria-modal="true" aria-label="Brza pretraga">
        <div class="cmdk-trazi">
          <span class="material-icons" aria-hidden="true">search</span>
          <input
            ref="polje"
            v-model="upit"
            type="text"
            class="cmdk-unos"
            placeholder="Idi na stranicu ili pokreni radnju…"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmdk-lista"
            :aria-activedescendant="aktivanId ? `cmdk-${aktivanId}` : undefined"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            @keydown="naTipku"
          />
          <kbd class="cmdk-esc">Esc</kbd>
        </div>

        <ul id="cmdk-lista" class="cmdk-lista" role="listbox">
          <template v-for="grupa in grupe" :key="grupa.naslov">
            <li class="cmdk-grupa" role="presentation">{{ grupa.naslov }}</li>
            <li
              v-for="s in grupa.stavke"
              :id="`cmdk-${s.id}`"
              :key="s.id"
              role="option"
              :aria-selected="s.id === aktivanId"
              class="cmdk-stavka"
              :class="{ aktivna: s.id === aktivanId }"
              @mousemove="aktivanId = s.id"
              @click="pokreni(s)"
            >
              <span class="material-icons cmdk-ikona" aria-hidden="true">{{ s.ikona }}</span>
              <span class="cmdk-naziv">{{ s.naziv }}</span>
              <span v-if="s.opis" class="cmdk-opis">{{ s.opis }}</span>
            </li>
          </template>
          <li v-if="!ukupno" class="cmdk-prazno" role="presentation">Nema rezultata za „{{ upit }}".</li>
        </ul>

        <div class="cmdk-podnozje" aria-hidden="true">
          <span><kbd>↑</kbd><kbd>↓</kbd> odaberi</span>
          <span><kbd>Enter</kbd> otvori</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { navStavke, brzeRadnje } from '@/config/navigacija.js';

const emit = defineEmits(['tema', 'odjava']);
const router = useRouter();

const otvoreno = ref(false);
const upit = ref('');
const aktivanId = ref('');
const polje = ref(null);
let prijasnjiFokus = null;

// bez dijakritika i velikih slova, da "sifre" nađe "Šifre"
const ocisti = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase();

const sveStavke = computed(() => [
  ...navStavke.map((s) => ({ id: `s${s.to}`, grupa: 'Stranice', naziv: s.label, ikona: s.icon, akcija: () => router.push(s.to) })),
  ...brzeRadnje.map((r) => ({
    id: `r${r.to}`, grupa: 'Brze radnje', naziv: r.naziv, ikona: r.ikona, opis: r.stranica,
    akcija: () => router.push({ path: r.to, query: { novo: 1 } })
  })),
  { id: 'a-tema', grupa: 'Aplikacija', naziv: 'Promijeni temu (tamna / svijetla)', ikona: 'contrast', akcija: () => emit('tema') },
  { id: 'a-odjava', grupa: 'Aplikacija', naziv: 'Odjava', ikona: 'logout', akcija: () => emit('odjava') }
]);

const filtrirane = computed(() => {
  const rijeci = ocisti(upit.value).split(/\s+/).filter(Boolean);
  if (!rijeci.length) return sveStavke.value;
  return sveStavke.value.filter((s) => {
    const tekst = ocisti(`${s.naziv} ${s.opis || ''} ${s.grupa}`);
    return rijeci.every((r) => tekst.includes(r));
  });
});

const grupe = computed(() => {
  const mapa = new Map();
  filtrirane.value.forEach((s) => { if (!mapa.has(s.grupa)) mapa.set(s.grupa, []); mapa.get(s.grupa).push(s); });
  return [...mapa.entries()].map(([naslov, stavke]) => ({ naslov, stavke }));
});
const ravno = computed(() => grupe.value.flatMap((g) => g.stavke));
const ukupno = computed(() => ravno.value.length);

watch(ravno, (lista) => {
  if (!lista.some((s) => s.id === aktivanId.value)) aktivanId.value = lista[0] ? lista[0].id : '';
});

const otvori = () => {
  prijasnjiFokus = document.activeElement;
  upit.value = '';
  otvoreno.value = true;
  aktivanId.value = ravno.value[0] ? ravno.value[0].id : '';
  nextTick(() => polje.value && polje.value.focus());
};

const zatvori = () => {
  otvoreno.value = false;
  if (prijasnjiFokus && prijasnjiFokus.focus) prijasnjiFokus.focus();
};

const pokreni = (s) => {
  zatvori();
  s.akcija();
};

const pomakni = (smjer) => {
  const lista = ravno.value;
  if (!lista.length) return;
  const i = lista.findIndex((s) => s.id === aktivanId.value);
  aktivanId.value = lista[(i + smjer + lista.length) % lista.length].id;
  nextTick(() => {
    const el = document.getElementById(`cmdk-${aktivanId.value}`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  });
};

const naTipku = (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); pomakni(1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); pomakni(-1); }
  else if (e.key === 'Enter') {
    e.preventDefault();
    const s = ravno.value.find((x) => x.id === aktivanId.value);
    if (s) pokreni(s);
  } else if (e.key === 'Escape') { e.preventDefault(); zatvori(); }
};

// Ctrl/Cmd+K svugdje; "/" kad se ne piše u polje
const globalnaTipka = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    if (otvoreno.value) zatvori(); else otvori();
    return;
  }
  if (e.key === '/' && !otvoreno.value && !e.ctrlKey && !e.metaKey && !e.altKey) {
    const t = e.target;
    const pise = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    if (!pise && !document.querySelector('[role="dialog"]')) { e.preventDefault(); otvori(); }
  }
};

onMounted(() => window.addEventListener('keydown', globalnaTipka));
onBeforeUnmount(() => window.removeEventListener('keydown', globalnaTipka));

defineExpose({ otvori });
</script>

<style scoped>
.cmdk-pozadina {
  position: fixed;
  inset: 0;
  z-index: 3500;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: max(12vh, 24px) 16px 16px;
  background-color: rgba(4, 4, 6, 0.6);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
}

.cmdk {
  width: min(640px, 100%);
  max-height: min(70vh, 560px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  background-color: var(--bg-card);
  background-image: var(--glass-sheen);
  box-shadow: var(--glass-shadow), 0 30px 80px rgba(0, 0, 0, 0.5);
}

.cmdk-trazi {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  border-bottom: 1px solid var(--border-color);
}

.cmdk-trazi .material-icons {
  font-size: 22px;
  color: var(--text-muted);
}

.cmdk-unos {
  flex: 1;
  min-width: 0;
  height: 56px;
  border: none;
  background: none;
  color: var(--text-heading);
  font-size: 1rem;
}

.cmdk-unos:focus,
.cmdk-unos:focus-visible {
  outline: none;
  box-shadow: none;
}

.cmdk-unos::placeholder {
  color: var(--text-muted);
}

kbd {
  padding: 2px 7px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background-color: var(--bg-card-muted);
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 0.72rem;
}

.cmdk-lista {
  list-style: none;
  margin: 0;
  padding: 8px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.cmdk-grupa {
  padding: 10px 12px 6px;
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 600;
}

.cmdk-stavka {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 44px;
  padding: 6px 12px;
  border-radius: 12px;
  color: var(--text-body);
  font-size: 0.95rem;
  cursor: pointer;
}

.cmdk-ikona {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 9px;
  background-color: var(--accent-tint);
  color: var(--accent);
  font-size: 18px;
}

.cmdk-naziv {
  flex: 1;
  min-width: 0;
}

.cmdk-opis {
  color: var(--text-muted);
  font-size: 0.82rem;
}

.cmdk-stavka.aktivna {
  background-color: color-mix(in srgb, var(--accent) 14%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 28%, transparent);
  color: var(--text-heading);
}

.cmdk-prazno {
  padding: 24px 12px;
  color: var(--text-muted);
  text-align: center;
}

.cmdk-podnozje {
  display: flex;
  gap: 18px;
  padding: 10px 16px;
  border-top: 1px solid var(--border-color);
  color: var(--text-muted);
  font-size: 0.78rem;
}

.cmdk-podnozje kbd {
  margin-right: 4px;
}

@media (max-width: 768px) {
  .cmdk-podnozje {
    display: none;
  }
}
</style>
