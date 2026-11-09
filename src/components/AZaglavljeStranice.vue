<template>
  <header class="stranica-zaglavlje">
    <div class="zaglavlje-tekst">
      <div class="naslov-red">
        <h1 class="naslov">{{ naslov }}</h1>
        <ASakrijNovac v-if="novac" />
      </div>
      <p v-if="podnaslov" class="podnaslov">{{ podnaslov }}</p>
    </div>
    <div v-if="$slots.default" class="zaglavlje-radnje">
      <slot />
    </div>
  </header>
</template>

<script setup>
import ASakrijNovac from './ASakrijNovac.vue';

defineProps({
  naslov: { type: String, required: true },
  // stranica prikazuje novac -> pokaži ikonu za sakrivanje iznosa uz naslov
  novac: { type: Boolean, default: false },
  podnaslov: { type: String, default: '' }
});
</script>

<style scoped>
/* Zajedničko zaglavlje svih stranica: naslov uvijek lijevo, radnje uvijek desno u istom redu. */
.stranica-zaglavlje {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-5);
  min-height: 46px;
  margin-bottom: var(--space-6);
}

.zaglavlje-tekst {
  min-width: 0;
}

.naslov-red {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.naslov {
  margin: 0;
  color: var(--text-heading);
  font-weight: 700;
}

.podnaslov {
  margin: var(--space-1) 0 0;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.zaglavlje-radnje {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
}

@media (max-width: 768px) {
  .stranica-zaglavlje {
    min-height: 0;
  }

  .zaglavlje-radnje {
    width: 100%;
  }

  /* na mobitelu glavna radnja ide preko cijele širine, ispod naslova */
  .zaglavlje-radnje > :slotted(.gumb-dodaj) {
    flex: 1 1 100%;
    order: -1;
  }

  .zaglavlje-radnje > :slotted(*) {
    flex: 1 1 auto;
    justify-content: center;
  }

  /* pomoćni gumbi su kompaktniji da dva stanu u isti red ispod glavnog */
  .zaglavlje-radnje > :slotted(.gumb-sekundarni),
  .zaglavlje-radnje > :slotted(.gumb-uspjeh) {
    padding-inline: 12px;
    font-size: 0.88rem;
  }
}
</style>
