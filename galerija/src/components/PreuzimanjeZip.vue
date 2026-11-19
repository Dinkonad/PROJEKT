<template>
  <div class="pozadina" role="dialog" aria-modal="true" aria-label="Preuzimanje fotografija" @mousedown.self="zatvori">
    <div class="kartica">
      <button type="button" class="x" aria-label="Zatvori" @click="zatvori"><Ikona ime="zatvori" /></button>

      <template v-if="stanje === 'greska'">
        <h2 class="naslov">Preuzimanje nije uspjelo</h2>
        <p class="tekst">{{ poruka }}</p>
        <button type="button" class="gumb gumb-glavni" @click="pokreni">Pokušaj ponovno</button>
      </template>

      <template v-else-if="stanje === 'spremno'">
        <div class="kvacica"><Ikona ime="kvacica" /></div>
        <h2 class="naslov">Preuzimanje je počelo</h2>
        <p class="tekst">Fotografije ({{ broj }}) se spremaju kao jedna ZIP datoteka u originalnoj kvaliteti.</p>
        <a class="gumb gumb-glavni" :href="url" download>Preuzmi ponovno</a>
      </template>

      <template v-else>
        <div class="kolo" role="status" aria-label="Priprema"></div>
        <h2 class="naslov">Pripremam preuzimanje</h2>
        <p class="tekst">{{ broj }} fotografija u originalnoj kvaliteti. Veliki odabiri traju koju minutu: stranicu možeš ostaviti otvorenom.</p>
        <div class="traka" role="progressbar" :aria-valuenow="Math.round(napredak * 100)" aria-valuemin="0" aria-valuemax="100">
          <div class="ispuna" :style="{ width: `${Math.max(4, napredak * 100)}%` }"></div>
        </div>
        <p class="mali">{{ Math.round(napredak * 100) }}%</p>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import Ikona from './Ikona.vue';
import { zatraziZip } from '../api.js';

const props = defineProps({
  token: { type: String, required: true },
  ids: { type: Array, default: null },      // null = sve fotke
  broj: { type: Number, default: 0 }
});
const emit = defineEmits(['zatvori', 'gotovo']);

const stanje = ref('gradi');
const napredak = ref(0);
const poruka = ref('');
const url = ref('');
let zaustavljeno = false;
let pokusaji = 0;

const pokreni = async () => {
  stanje.value = 'gradi';
  poruka.value = '';
  pokusaji = 0;
  zaustavljeno = false;
  while (!zaustavljeno) {
    try {
      const o = await zatraziZip(props.token, props.ids);
      if (o.status === 'spremno') {
        url.value = o.url;
        stanje.value = 'spremno';
        const a = document.createElement('a');
        a.href = o.url;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        a.remove();
        emit('gotovo');
        return;
      }
      if (o.status === 'greska') throw new Error('Priprema datoteke nije uspjela. Pokušaj ponovno ili odaberi manje fotografija.');
      napredak.value = Math.max(napredak.value, o.napredak || 0);
    } catch (e) {
      if (e.status === 0 && pokusaji++ < 5) { await new Promise((r) => setTimeout(r, 3000)); continue; }
      stanje.value = 'greska';
      poruka.value = e.message || 'Nepoznata greška.';
      return;
    }
    await new Promise((r) => setTimeout(r, 3000));
    if (++pokusaji > 900) { stanje.value = 'greska'; poruka.value = 'Priprema traje predugo. Odaberi manje fotografija.'; return; }
  }
};

const zatvori = () => { zaustavljeno = true; emit('zatvori'); };

onMounted(pokreni);
onBeforeUnmount(() => { zaustavljeno = true; });
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

.x svg {
  width: 20px;
  height: 20px;
}

.naslov {
  margin: 0;
  font-family: var(--font-naslov);
  font-size: 1.9rem;
  font-weight: 500;
}

.tekst {
  margin: 0;
  color: var(--tekst-2);
  font-size: 0.92rem;
}

.mali {
  margin: 0;
  color: var(--tekst-3);
  font-size: 0.82rem;
  font-variant-numeric: tabular-nums;
}

.traka {
  width: 100%;
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--bg-3);
}

.ispuna {
  height: 100%;
  border-radius: 999px;
  background: var(--akcent);
  transition: width 0.6s var(--ease);
}

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

.kvacica svg {
  width: 28px;
  height: 28px;
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
