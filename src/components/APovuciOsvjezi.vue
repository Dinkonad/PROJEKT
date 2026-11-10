<template>
  <div
    class="ptr"
    :class="{ osvjezava, spreman: pomak >= PRAG }"
    :style="stil"
    aria-hidden="true"
  >
    <span class="material-icons ptr-ikona" :style="{ transform: osvjezava ? '' : `rotate(${pomak * 3}deg)` }">
      {{ osvjezava ? 'sync' : 'arrow_downward' }}
    </span>
  </div>
</template>

<script setup>
// "Povuci prema dolje za osvježavanje" na mobitelu: radi samo kad je sadržaj skrolan do vrha.
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { osvjeziStranicu } from '@/store/osvjezavanje.js';

const props = defineProps({
  // CSS selektor elementa koji se skrola (sadržaj stranice)
  spremnik: { type: String, default: '.glavni-sadrzaj' }
});

const PRAG = 64;        // koliko treba povući (px) da se osvježavanje pokrene
const NAJVISE = 96;
const pomak = ref(0);
const osvjezava = ref(false);

const stil = computed(() => {
  const visina = osvjezava.value ? PRAG : pomak.value;
  return {
    opacity: osvjezava.value ? 1 : Math.min(1, pomak.value / 40),
    transform: `translate(-50%, ${visina - 56}px)`,
    transition: pomak.value === 0 || osvjezava.value ? 'transform 0.25s ease, opacity 0.25s ease' : 'none'
  };
});

let element = null;
let y0 = 0;
let x0 = 0;
let aktivno = false;
let odlucen = false;

const unutarPrekrivaca = (cilj) => !!cilj.closest('.prekrivka-modala, .pozadina, .lightbox-pozadina, .vise-prekrivac, .vise-sheet');

const pocetak = (e) => {
  aktivno = false;
  odlucen = false;
  if (osvjezava.value || e.touches.length !== 1 || element.scrollTop > 0 || unutarPrekrivaca(e.target) || e.target.closest('.leaflet-container')) return;
  y0 = e.touches[0].clientY;
  x0 = e.touches[0].clientX;
  aktivno = true;
};

const dalje = (e) => {
  if (!aktivno) return;
  const dy = e.touches[0].clientY - y0;
  const dx = e.touches[0].clientX - x0;

  if (!odlucen) {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) { aktivno = false; return; } // gore ili vodoravno: nije za nas
    odlucen = true;
  }
  if (e.defaultPrevented) { aktivno = false; pomak.value = 0; return; }   // npr. povlačenje retka
  if (element.scrollTop > 0) { aktivno = false; pomak.value = 0; return; }

  if (e.cancelable) e.preventDefault(); // bez ovoga iPhone "odskoči" umjesto da prati prst
  pomak.value = Math.min(NAJVISE, dy * 0.5);
};

const kraj = async () => {
  if (!aktivno) return;
  aktivno = false;
  if (pomak.value >= PRAG) {
    osvjezava.value = true;
    const najkrace = new Promise((r) => setTimeout(r, 700));
    try {
      await Promise.all([osvjeziStranicu(), najkrace]);
    } catch (error) {
      console.error('Greška pri osvježavanju:', error);
    } finally {
      osvjezava.value = false;
      pomak.value = 0;
    }
  } else {
    pomak.value = 0;
  }
};

onMounted(() => {
  element = document.querySelector(props.spremnik);
  if (!element) return;
  element.addEventListener('touchstart', pocetak, { passive: true });
  element.addEventListener('touchmove', dalje, { passive: false });
  element.addEventListener('touchend', kraj, { passive: true });
  element.addEventListener('touchcancel', kraj, { passive: true });
});

onBeforeUnmount(() => {
  if (!element) return;
  element.removeEventListener('touchstart', pocetak);
  element.removeEventListener('touchmove', dalje);
  element.removeEventListener('touchend', kraj);
  element.removeEventListener('touchcancel', kraj);
});
</script>

<style scoped>
.ptr {
  position: fixed;
  top: calc(8px + env(safe-area-inset-top, 0px));
  left: 50%;
  z-index: 950;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: var(--bg-card);
  color: var(--text-muted);
  box-shadow: var(--glass-shadow);
  pointer-events: none;
}

.ptr.spreman {
  color: var(--accent);
}

.ptr-ikona {
  font-size: 22px;
  transition: transform 0.1s linear;
}

.ptr.osvjezava .ptr-ikona {
  color: var(--accent);
  animation: ptr-vrti 0.9s linear infinite;
}

@keyframes ptr-vrti {
  to { transform: rotate(360deg); }
}
</style>
