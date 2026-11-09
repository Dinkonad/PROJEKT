<template>
  <button
    type="button"
    class="sakrij-novac"
    :class="{ aktivno: privatnost.sakrijNovac }"
    :aria-pressed="privatnost.sakrijNovac"
    :aria-label="privatnost.sakrijNovac ? 'Prikaži iznose' : 'Sakrij iznose'"
    :title="privatnost.sakrijNovac ? 'Iznosi su sakriveni - dodirni za prikaz' : 'Sakrij iznose'"
    @click="toggleSakrijNovac"
  >
    <span class="material-icons">{{ privatnost.sakrijNovac ? 'visibility_off' : 'visibility' }}</span>
  </button>
</template>

<script setup>
import { privatnost, toggleSakrijNovac } from '@/store/privatnost.js';
</script>

<style scoped>
/* samo ikona (bez pozadine), ali s područjem dodira od 40 px */
.sakrij-novac {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.sakrij-novac .material-icons {
  font-size: 24px;
}

.sakrij-novac:hover {
  color: var(--accent);
  background-color: var(--bg-card-muted);
}

.sakrij-novac.aktivno {
  color: var(--accent);
}
</style>
