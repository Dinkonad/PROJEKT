<template>
  <header class="hero" :style="{ backgroundColor: boja || '#15151a' }">
    <div ref="pozadina" class="pozadina">
      <img v-if="slika" :src="slika" alt="" class="slika" :class="{ ucitano }" decoding="async" fetchpriority="high" @load="ucitano = true" />
    </div>
    <div class="sjena"></div>

    <div class="sadrzaj">
      <p v-if="gornja" class="gornja">{{ gornja }}</p>
      <h1 class="naslov">{{ naslov }}</h1>
      <p class="meta">{{ meta }}</p>
      <div class="gumbi">
        <button type="button" class="gumb gumb-glavni" @click="$emit('pogledaj')">
          Pogledaj fotografije
        </button>
        <button type="button" class="gumb" :disabled="false" @click="$emit('preuzmi')">
          <Ikona :ime="zakljucano ? 'lokot' : 'preuzmi'" />
          {{ zakljucano ? 'Preuzimanje zaključano' : preuzmiTekst }}
        </button>
      </div>
    </div>

    <button type="button" class="dolje" aria-label="Pomakni na fotografije" @click="$emit('pogledaj')"><Ikona ime="strelica-dolje" /></button>
  </header>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import Ikona from './Ikona.vue';

defineProps({
  naslov: { type: String, required: true },
  gornja: { type: String, default: '' },
  meta: { type: String, default: '' },
  slika: { type: String, default: '' },
  boja: { type: String, default: '' },
  zakljucano: { type: Boolean, default: false },
  preuzmiTekst: { type: String, default: 'Preuzmi sve' }
});
defineEmits(['pogledaj', 'preuzmi']);

const ucitano = ref(false);
const pozadina = ref(null);
let okvir = 0;

// sporiji pomak pozadine pri skrolanju (samo ako korisnik ne traži manje pokreta)
const naSkrol = () => {
  if (okvir) return;
  okvir = requestAnimationFrame(() => {
    okvir = 0;
    const y = window.scrollY;
    if (pozadina.value && y < window.innerHeight * 1.2) pozadina.value.style.transform = `translate3d(0, ${y * 0.25}px, 0)`;
  });
};

onMounted(() => {
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) window.addEventListener('scroll', naSkrol, { passive: true });
});
onBeforeUnmount(() => {
  window.removeEventListener('scroll', naSkrol);
  if (okvir) cancelAnimationFrame(okvir);
});
</script>

<style scoped>
.hero {
  position: relative;
  min-height: 100vh;
  min-height: 100svh;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.pozadina {
  position: absolute;
  inset: -4% 0 0;
  will-change: transform;
}

.slika {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transform: scale(1.06);
  transition: opacity 1.2s var(--ease), transform 6s var(--ease);
}

.slika.ucitano {
  opacity: 1;
  transform: scale(1);
}

.sjena {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(12, 12, 14, 0.35) 0%, rgba(12, 12, 14, 0) 30%, rgba(12, 12, 14, 0.55) 72%, rgba(12, 12, 14, 0.92) 100%);
}

.sadrzaj {
  position: relative;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 28px calc(76px + env(safe-area-inset-bottom, 0px));
  animation: podigni 1s var(--ease) 0.2s both;
}

.gornja {
  margin: 0 0 10px;
  color: var(--akcent);
  font-size: 0.78rem;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.naslov {
  margin: 0;
  max-width: 14ch;
  font-family: var(--font-naslov);
  font-size: clamp(3rem, 11vw, 7.5rem);
  font-weight: 500;
  line-height: 0.95;
  letter-spacing: -0.01em;
  text-shadow: 0 2px 30px rgba(0, 0, 0, 0.35);
  overflow-wrap: anywhere;
}

.meta {
  margin: 18px 0 0;
  color: var(--tekst-2);
  font-size: 0.95rem;
  letter-spacing: 0.04em;
}

.gumbi {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.dolje {
  position: absolute;
  left: 50%;
  bottom: calc(18px + env(safe-area-inset-bottom, 0px));
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--linija);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  transform: translateX(-50%);
  animation: njisi 2.4s ease-in-out infinite;
}

.dolje svg {
  width: 20px;
  height: 20px;
}

@keyframes podigni {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
}

@keyframes njisi {
  50% {
    transform: translate(-50%, 6px);
  }
}

@media (max-width: 600px) {
  .sadrzaj {
    padding: 0 20px calc(84px + env(safe-area-inset-bottom, 0px));
  }

  .gumbi > .gumb {
    flex: 1 1 100%;
  }
}
</style>
