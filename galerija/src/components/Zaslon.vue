<template>
  <main class="zaslon">
    <div v-if="ucitava" class="kolo" role="status" aria-label="Učitavanje"></div>
    <h1 class="naslov">{{ naslov }}</h1>
    <p v-if="tekst" class="tekst">{{ tekst }}</p>
    <slot />
  </main>
</template>

<script setup>
defineProps({
  naslov: { type: String, required: true },
  tekst: { type: String, default: '' },
  ucitava: { type: Boolean, default: false }
});
</script>

<style scoped>
.zaslon {
  min-height: 100vh;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 32px 24px;
  text-align: center;
  background: radial-gradient(ellipse at 50% 30%, #1a1a1f 0%, var(--bg) 70%);
}

.naslov {
  margin: 0;
  font-family: var(--font-naslov);
  font-size: clamp(2rem, 6vw, 3rem);
  font-weight: 500;
  letter-spacing: 0.01em;
}

.tekst {
  margin: 0;
  max-width: 420px;
  color: var(--tekst-2);
}

.kolo {
  width: 34px;
  height: 34px;
  border: 2px solid var(--linija);
  border-top-color: var(--akcent);
  border-radius: 50%;
  animation: vrti 0.9s linear infinite;
}

@keyframes vrti {
  to {
    transform: rotate(360deg);
  }
}
</style>
