<template>
  <div class="status-servera" role="status" aria-live="polite">
    <Transition name="status">
      <div v-if="stanje !== 'uredu'" class="status-pilula" :class="`status-${stanje}`">
        <span v-if="stanje === 'budi'" class="status-vrti" aria-hidden="true"></span>
        <span v-else class="material-icons" aria-hidden="true">check_circle</span>
        <span>{{ stanje === 'budi' ? 'Server se budi. Prvi poziv može potrajati do minute.' : 'Server je spreman.' }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { useStatusServera } from '@/utils/statusServera.js';

const { stanje } = useStatusServera();
</script>

<style scoped>
.status-servera {
  position: fixed;
  top: calc(12px + env(safe-area-inset-top, 0px));
  left: 0;
  right: 0;
  z-index: 2900;
  display: flex;
  justify-content: center;
  padding: 0 16px;
  pointer-events: none;
}

.status-pilula {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  max-width: 440px;
  padding: 10px 16px;
  border: 1px solid var(--glass-border);
  border-radius: 999px;
  background-color: var(--glass-bg);
  background-image: var(--glass-sheen);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(170%);
  backdrop-filter: blur(var(--glass-blur)) saturate(170%);
  box-shadow: var(--glass-shadow);
  color: var(--text-body);
  font-size: 0.85rem;
  line-height: 1.3;
}

.status-pilula .material-icons {
  font-size: 18px;
  color: var(--success);
}

.status-vrti {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  border: 2px solid color-mix(in srgb, var(--accent) 30%, transparent);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: status-vrtnja 0.9s linear infinite;
}

@keyframes status-vrtnja {
  to { transform: rotate(360deg); }
}

/* na mobitelu poruka stoji iznad donje trake da ne prekriva naslov stranice */
@media (max-width: 768px) {
  .status-servera {
    top: auto;
    bottom: calc(88px + env(safe-area-inset-bottom, 0px));
  }

  .status-enter-from,
  .status-leave-to {
    transform: translateY(8px);
  }
}

.status-enter-active,
.status-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.status-enter-from,
.status-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
