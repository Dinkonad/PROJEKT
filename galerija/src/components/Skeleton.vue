<template>
  <!-- Kostur stranice dok se galerija učitava: isti raspored kao prava stranica, bez teksta -->
  <div class="kostur" role="status" aria-live="polite" aria-label="Učitavanje galerije">
    <header class="k-hero">
      <div class="k-sadrzaj">
        <span class="k k-gornja"></span>
        <span class="k k-naslov"></span>
        <span class="k k-naslov k-naslov-2"></span>
        <span class="k k-meta"></span>
        <div class="k-gumbi">
          <span class="k k-gumb"></span>
          <span class="k k-gumb k-gumb-2"></span>
        </div>
      </div>
    </header>

    <div class="k-alatna">
      <span class="k k-filtar"></span>
      <span class="k k-filtar k-filtar-2"></span>
    </div>

    <div class="k-mreza">
      <div v-for="(red, i) in redovi" :key="i" class="k-red">
        <span v-for="(omjer, j) in red" :key="j" class="k k-plocica" :style="{ flexGrow: omjer }"></span>
      </div>
    </div>
  </div>
</template>

<script setup>
// omjeri širina pločica po redu (kao poravnata mreža fotki: uspravne uže, vodoravne šire)
const redovi = [
  [1.5, 0.67, 1.5],
  [0.67, 1.5, 1, 0.67],
  [1.5, 1.5, 0.67],
  [1, 0.67, 1.5, 1]
];
</script>

<style scoped>
.kostur {
  min-height: 100vh;
  background: var(--bg);
}

/* svjetlucanje koje putuje preko svih dijelova */
.k {
  display: block;
  border-radius: 6px;
  background-color: var(--bg-3);
  background-image: linear-gradient(100deg, rgba(255, 255, 255, 0) 30%, rgba(255, 255, 255, 0.06) 50%, rgba(255, 255, 255, 0) 70%);
  background-size: 200% 100%;
  background-repeat: no-repeat;
  animation: svjetluca 1.6s ease-in-out infinite;
}

@keyframes svjetluca {
  from { background-position: 150% 0; }
  to { background-position: -50% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .k { animation: none; }
}

/* ---------- naslovni dio (isti kao Hero) */
.k-hero {
  position: relative;
  min-height: 100vh;
  min-height: 100svh;
  display: flex;
  align-items: flex-end;
  background: linear-gradient(180deg, var(--bg-2) 0%, var(--bg) 100%);
}

.k-sadrzaj {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 28px calc(76px + env(safe-area-inset-bottom, 0px));
}

.k-gornja {
  width: 120px;
  height: 12px;
  margin-bottom: 18px;
  background-color: var(--akcent-tamni);
}

.k-naslov {
  width: min(560px, 80%);
  height: clamp(2.6rem, 9vw, 6.2rem);
  margin-bottom: 12px;
  border-radius: 10px;
}

.k-naslov-2 {
  width: min(360px, 55%);
}

.k-meta {
  width: 200px;
  height: 14px;
  margin-top: 22px;
}

.k-gumbi {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.k-gumb {
  width: 210px;
  height: 48px;
  border-radius: 999px;
}

.k-gumb-2 {
  width: 180px;
}

/* ---------- traka s filterima */
.k-alatna {
  display: flex;
  gap: 8px;
  max-width: 1800px;
  margin: 0 auto;
  padding: 14px 18px;
}

.k-filtar {
  width: 72px;
  height: 34px;
  border-radius: 999px;
}

.k-filtar-2 {
  width: 110px;
}

/* ---------- mreža fotki */
.k-mreza {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 1800px;
  margin: 0 auto;
}

.k-red {
  display: flex;
  gap: 6px;
  height: clamp(140px, 24vw, 320px);
}

.k-plocica {
  flex-basis: 0;
  min-width: 0;
  border-radius: 2px;
}

@media (max-width: 600px) {
  .k-sadrzaj {
    padding: 0 20px calc(84px + env(safe-area-inset-bottom, 0px));
  }

  .k-gumb,
  .k-gumb-2 {
    flex: 1 1 100%;
  }

  .k-mreza,
  .k-red {
    gap: 3px;
  }

  .k-red {
    height: 30vw;
  }

  /* na mobitelu manje pločica u redu */
  .k-red .k-plocica:nth-child(n + 4) {
    display: none;
  }
}
</style>
