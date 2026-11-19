<template>
  <main class="pin">
    <div class="kartica">
      <Ikona ime="lokot" class="ikona" />
      <h1 class="naslov">{{ naziv }}</h1>
      <p v-if="klijent" class="klijent">{{ klijent }}</p>
      <p class="tekst">Ova galerija je zaštićena. Upiši PIN koji si dobio od fotografa.</p>
      <form class="forma" @submit.prevent="posalji">
        <label class="sr-only" for="pin">PIN</label>
        <input
          id="pin"
          ref="polje"
          v-model="pin"
          class="unos"
          :class="{ tresi }"
          type="password"
          inputmode="numeric"
          autocomplete="off"
          maxlength="12"
          placeholder="PIN"
          :disabled="zauzet"
        />
        <p v-if="greska" class="greska" role="alert">{{ greska }}</p>
        <button class="gumb gumb-glavni" type="submit" :disabled="zauzet || pin.length < 4">{{ zauzet ? 'Provjera...' : 'Otvori galeriju' }}</button>
      </form>
    </div>
  </main>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import Ikona from './Ikona.vue';

const props = defineProps({
  naziv: { type: String, default: '' },
  klijent: { type: String, default: '' },
  greska: { type: String, default: '' },
  zauzet: { type: Boolean, default: false }
});
const emit = defineEmits(['posalji']);

const pin = ref('');
const tresi = ref(false);
const polje = ref(null);

const posalji = () => emit('posalji', pin.value);

watch(() => props.greska, (g) => {
  if (!g) return;
  tresi.value = true;
  pin.value = '';
  setTimeout(() => { tresi.value = false; polje.value?.focus(); }, 450);
});

onMounted(() => polje.value?.focus());
</script>

<style scoped>
.pin {
  min-height: 100vh;
  min-height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: radial-gradient(ellipse at 50% 20%, #1c1c22 0%, var(--bg) 70%);
}

.kartica {
  width: 100%;
  max-width: 380px;
  padding: 36px 28px 30px;
  text-align: center;
  border: 1px solid var(--linija);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.03);
  -webkit-backdrop-filter: blur(18px);
  backdrop-filter: blur(18px);
  animation: ulaz 0.6s var(--ease) both;
}

.ikona {
  width: 30px;
  height: 30px;
  color: var(--akcent);
}

.naslov {
  margin: 14px 0 0;
  font-family: var(--font-naslov);
  font-size: 2rem;
  font-weight: 500;
  line-height: 1.15;
}

.klijent {
  margin: 4px 0 0;
  color: var(--tekst-2);
  font-size: 0.9rem;
}

.tekst {
  margin: 14px 0 22px;
  color: var(--tekst-2);
  font-size: 0.92rem;
}

.forma {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.unos {
  width: 100%;
  height: 52px;
  padding: 0 16px;
  border: 1px solid var(--linija);
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.35);
  text-align: center;
  font-size: 1.2rem;
  letter-spacing: 0.3em;
}

.unos:focus {
  outline: none;
  border-color: var(--akcent);
}

.unos.tresi {
  animation: tresi 0.4s;
}

.greska {
  margin: 0;
  color: var(--greska);
  font-size: 0.88rem;
}

@keyframes ulaz {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
}

@keyframes tresi {
  20%, 60% {
    transform: translateX(-6px);
  }
  40%, 80% {
    transform: translateX(6px);
  }
}
</style>
