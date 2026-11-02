<template>
  <div class="obavijesti" role="status" aria-live="polite">
    <TransitionGroup name="obavijest">
      <button
        v-for="o in obavijestiStanje.lista"
        :key="o.id"
        type="button"
        class="obavijest"
        :class="`obavijest-${o.vrsta}`"
        aria-label="Zatvori poruku"
        @click="ukloniObavijest(o.id)"
      >
        <span class="material-icons obavijest-ikona" aria-hidden="true">{{ o.vrsta === 'greska' ? 'error_outline' : 'check_circle' }}</span>
        <span class="obavijest-tekst">{{ o.tekst }}</span>
      </button>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { obavijestiStanje, ukloniObavijest } from '@/services/obavijest.js';
</script>

<style scoped>
.obavijesti {
  position: fixed;
  top: calc(12px + env(safe-area-inset-top, 0px));
  left: 0;
  right: 0;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  pointer-events: none;
}

.obavijest {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 440px;
  width: 100%;
  padding: 12px 16px;
  text-align: left;
  font-family: var(--font-sans);
  font-size: 0.9rem;
  line-height: 1.4;
  color: var(--text-heading);
  background-color: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-left: 4px solid var(--success);
  border-radius: var(--radius-small);
  box-shadow: var(--glass-shadow);
  cursor: pointer;
  pointer-events: auto;
}

.obavijest-greska {
  border-left-color: var(--danger);
}

.obavijest-ikona {
  font-size: 20px;
  color: var(--success);
  flex-shrink: 0;
}

.obavijest-greska .obavijest-ikona {
  color: var(--danger);
}

.obavijest-tekst {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}

.obavijest-enter-active,
.obavijest-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.obavijest-enter-from,
.obavijest-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
