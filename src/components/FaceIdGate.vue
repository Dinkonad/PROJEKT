<template>
  <div class="faceid-gate">
    <div class="faceid-kartica">
      <span class="material-icons faceid-ikona">face</span>
      <h2>Nagy Photos</h2>
      <p v-if="stanje === 'traje'" class="faceid-status">Potvrdi Face ID / Touch ID...</p>
      <p v-else-if="stanje === 'greska'" class="faceid-status greska">Nije uspjelo. Pokušaj ponovno ili koristi lozinku.</p>
      <p v-else class="faceid-status">Otključaj da nastaviš</p>

      <button class="gumb-pokusaj" @click="pokusaj" :disabled="stanje === 'traje'">
        <span class="material-icons">fingerprint</span> Pokušaj ponovno
      </button>
      <button class="gumb-lozinka" @click="$emit('koristi-lozinku')">Koristi lozinku umjesto</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { potvrdiCredential } from '@/services/webauthn.js';

const props = defineProps({
  registrirani: { type: Array, required: true }
});
const emit = defineEmits(['otkljucano', 'koristi-lozinku']);

const stanje = ref('cekanje'); // cekanje | traje | greska

const pokusaj = async () => {
  stanje.value = 'traje';
  try {
    const uspjeh = await potvrdiCredential(props.registrirani);
    if (uspjeh) {
      emit('otkljucano');
    } else {
      stanje.value = 'greska';
    }
  } catch (error) {
    console.error('Face ID potvrda nije uspjela:', error);
    stanje.value = 'greska';
  }
};

onMounted(pokusaj);
</script>

<style scoped>
.faceid-gate {
  position: fixed;
  inset: 0;
  background: var(--bg-page);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.faceid-kartica {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
  padding: 40px;
}

.faceid-ikona {
  font-size: 56px;
  color: var(--accent);
  margin-bottom: 6px;
}

.faceid-kartica h2 {
  margin: 0;
  color: var(--text-heading);
}

.faceid-status {
  color: var(--text-muted);
  margin-bottom: 20px;
}

.faceid-status.greska {
  color: var(--danger);
}

.gumb-pokusaj {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  cursor: pointer;
  font-weight: 500;
  margin-bottom: 12px;
}

.gumb-pokusaj:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.gumb-lozinka {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.9rem;
  text-decoration: underline;
}
</style>
