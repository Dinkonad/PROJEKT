<template>
  <router-view v-slot="{ Component }">
    <transition name="stranica-fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
  <AObavijesti />
</template>

<script setup>
import AObavijesti from './components/AObavijesti.vue';

defineOptions({ name: 'App' });
</script>

<style>
.stranica-fade-enter-active,
.stranica-fade-leave-active {
  transition: opacity 0.15s ease;
}

.stranica-fade-enter-from,
.stranica-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .stranica-fade-enter-active,
  .stranica-fade-leave-active {
    transition: none;
  }
}
</style>
