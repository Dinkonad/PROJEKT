<template>

    <h1>Ja sam korisnik</h1>
    <button @click="logout">Odjava</button>
</template>

<script>
import { useRouter } from 'vue-router';
import { useAuth } from '../store/auth';

export default {
  name: 'Dashboard',
  setup() {
    const router = useRouter();
    const { logout: authLogout } = useAuth();

    const logout = async () => {
      await authLogout();
      router.push('/login');
    };

    return {
      logout
    };
  }
};
</script>
