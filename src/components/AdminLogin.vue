<template>
  <div class="admin-login-panel">
    <h1>Admin prijava</h1>
    <div class="form-group">
      <label for="admin-email">Admin Email</label>
      <input 
        type="email" 
        id="admin-email" 
        v-model="adminEmail" 
      />
    </div>
    
    <div class="form-group">
      <label for="admin-password">Admin Lozinka</label>
      <input type="password" id="admin-password" v-model="adminPassword" />
    </div>
    
    <button class="login-button" @click="login">Prijava</button>
    <button class="back-button" @click="close">Natrag</button>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'AdminLogin',
  emits: ['close', 'login'],
  setup(props, { emit }) {
    const adminEmail = ref('');
    const adminPassword = ref('');
    
    const login = () => {
      emit('login', adminEmail.value, adminPassword.value);
    };
    
    const close = () => {
      emit('close');
    };
    
    return {
      adminEmail,
      adminPassword,
      login,
      close
    };
  }
};
</script>

<style scoped>
.admin-login-panel {
  background-color: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 400px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #555;
}

input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  transition: all 0.3s ease;
}

input:focus {
  border-color: #0066ff;
  box-shadow: 0 0 5px rgba(0, 102, 255, 0.3);
  outline: none;
}

.login-button {
  width: 100%;
  padding: 12px;
  background-color: black;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;
  transition: all 0.3s ease;
}

.login-button:hover {
  background-color: #333;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.login-button:active {
  background-color: #000;
  transform: translateY(1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.back-button {
  padding: 10px 20px;
  background-color: #999;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 10px;
  width: 100%;
  transition: all 0.3s ease;
}

.back-button:hover {
  background-color: #777;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.back-button:active {
  background-color: #666;
  transform: translateY(1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

@media (max-width: 480px) {
  .admin-login-panel {
    width: 95%;
    max-width: 400px;
  }
}
</style>