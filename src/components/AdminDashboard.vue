<template>
    <div>
      <h1>Ja sam Admin</h1>
      <button @click="logout">Odjava</button>
    </div>
  </template>
  
  <script>
  import { useRouter } from 'vue-router';
  import { useAuth } from '../store/auth';
  
  export default {
    name: 'Admin',
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
  