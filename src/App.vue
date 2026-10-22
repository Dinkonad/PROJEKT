<template>
  <FaceIdGate
    v-if="prikaziVrata"
    :registrirani="registriraniCredentiali"
    @otkljucano="otkljucaj"
    @koristi-lozinku="koristiLozinku"
  />
  <router-view v-show="!prikaziVrata" />
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useAuth } from './store/auth';
import { dohvatiRegistrirane, jePodrzano } from './services/webauthn';
import FaceIdGate from './components/FaceIdGate.vue';

defineOptions({ name: 'App' });

const { state: authState, logout } = useAuth();

const registriraniCredentiali = ref([]);
const otkljucanoOveSesije = ref(false);
const provjereno = ref(false);

watch(
  () => [authState.isAdmin, authState.loading],
  async ([isAdmin, loading]) => {
    if (loading) return;
    registriraniCredentiali.value = (isAdmin && jePodrzano()) ? await dohvatiRegistrirane() : [];
    provjereno.value = true;
  },
  { immediate: true }
);

const prikaziVrata = computed(() => (
  provjereno.value
  && authState.isAdmin
  && registriraniCredentiali.value.length > 0
  && !otkljucanoOveSesije.value
));

const otkljucaj = () => {
  otkljucanoOveSesije.value = true;
};

const koristiLozinku = async () => {
  await logout();
  otkljucanoOveSesije.value = true;
};
</script>
