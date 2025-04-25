<template>
  <h1>Ja sam korisnik</h1>
  <button @click="odjava" class="gumb-odjava">Odjava</button>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuth } from '../store/auth';

const router = useRouter();
const { logout: authLogout } = useAuth();

const odjava = async () => {
  await authLogout();
  router.push('/login');
};
</script>

<style scoped>
.gumb-odjava {
  padding: 0.5rem 1rem;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.gumb-odjava:hover {
  background-color: #d32f2f;
}
</style>