<template>
    <div class="login-container">
    
      <admin-login
        v-if="showAdminPanel"
        @close="closeAdminPanel"
        @login="handleAdminLogin"
      />
  
      <div v-if="!showAdminPanel" class="login-card" :class="{ 'flip': isSignup }">
        <div class="login-side">
          <div class="white-side">
            <div class="login-form">
              <h1>Login</h1>
              
              <div class="form-group">
                <label for="email-input">Email</label>
                <input 
                  type="email" 
                  id="email-input" 
                  v-model="username" 
                  placeholder="kreso123@exempl.com" 
                />
              </div>
              
              <div class="form-group">
                <label for="password">Lozinka</label>
                <input type="password" id="password" v-model="password" />
              </div>
              
              <button class="login-button" @click="login">Login</button>
              
              <button class="google-login-button" @click="loginWithGoogle">
                <img 
                  src="https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png" 
                  class="google-icon"
                  alt="Google logo">
                Prijava s Google računom
              </button>
              
              <div class="signup-option">
                Stvori račun <a @click.prevent="toggleMode" class="signup-link">Registracija</a>
              </div>
            </div>
          </div>
          
          <div class="black-side">
            <div class="welcome-content">
              <h1>Neki naslov ce biti</h1>
              <p class="welcome-text">
                nesto ce pisati kratko 
              </p>
              
            </div>
          </div>
        </div>
        
        <div class="signup-side">
          <div class="black-side">
            <div class="welcome-content">
              <h1>nesto kratko</h1>
              <p class="welcome-text">
                nesto nepisati ovdje zanimljivo
              </p>
              
            </div>
          </div>
          
          <div class="white-side">
            <div class="login-form">
              <h1>Registracija</h1>
              
              <div class="form-group">
                <label for="new-username">Korisničko ime</label>
                <input 
                  type="text" 
                  id="new-username" 
                  v-model="newUsername" 
                  placeholder="Vaše korisničko ime"
                />
              </div>
              
              <div class="form-group">
                <label for="email">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  v-model="email" 
                  placeholder="primjer@domena.com" 
                />
              </div>
              
              <div class="form-group">
                <label for="new-password">Lozinka</label>
                <input type="password" id="new-password" v-model="newPassword" />
              </div>
              
              <button class="login-button" @click="signup">Registracija</button>
              
              <div class="signup-option">
                Već imate račun? <a @click.prevent="toggleMode" class="signup-link">Prijava</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import { useAuth } from '../store/auth';
  import AdminLogin from './AdminLogin.vue';
  
  export default {
    name: 'LoginPage',
    components: {
      AdminLogin
    },
    setup() {
      const router = useRouter();
      const { state, login, loginWithGoogle, signup, loginAsAdmin } = useAuth();
      
      const username = ref('');
      const password = ref('');
      const newUsername = ref('');
      const email = ref('');
      const newPassword = ref('');
      const isSignup = ref(false);
      const showAdminPanel = ref(false);
      
      watch(() => state.isLoggedIn, (isLoggedIn) => {
        if (isLoggedIn) {
          if (state.isAdmin) {
            router.push('/admin');
          } else {
            router.push('/dashboard');
          }
        }
      }, { immediate: true });
      
      const clearFormFields = () => {
        username.value = '';
        password.value = '';
        newUsername.value = '';
        email.value = '';
        newPassword.value = '';
      };
  
      const handleLogin = async () => {
        try {
          await login(username.value, password.value);
          clearFormFields();
        } catch (error) {
          alert('Prijava nije uspjela: ' + error.message);
        }
      };
  
      const handleLoginWithGoogle = async () => {
        try {
          await loginWithGoogle();
        } catch (error) {
          alert('Google prijava nije uspjela: ' + error.message);
        }
      };
  
      const handleSignup = async () => {
        try {
          await signup(newUsername.value, email.value, newPassword.value);
          isSignup.value = false;
          clearFormFields();
        } catch (error) {
          alert('Registracija nije uspjela: ' + error.message);
        }
      };
  
      const handleAdminLogin = async (adminEmail, adminPassword) => {
        try {
          await loginAsAdmin(adminEmail, adminPassword);
          showAdminPanel.value = false;
          alert('Uspješno ste prijavljeni kao administrator!');
        } catch (error) {
          alert('Admin prijava nije uspjela: ' + error.message);
        }
      };
  
      const showAdminLogin = () => {
        if (state.isAdmin) {
          alert('Već ste prijavljeni kao administrator!');
          return;
        }
        showAdminPanel.value = true;
      };
  
      const closeAdminPanel = () => {
        showAdminPanel.value = false;
      };
  
      const toggleMode = () => {
        isSignup.value = !isSignup.value;
      };
  
      return {
        username,
        password,
        newUsername,
        email,
        newPassword,
        isSignup,
        showAdminPanel,
        login: handleLogin,
        loginWithGoogle: handleLoginWithGoogle,
        signup: handleSignup,
        toggleMode,
        showAdminLogin,
        closeAdminPanel,
        handleAdminLogin
      };
    }
  };
  </script>
  
  <style scoped>
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    width: 100%;
    background-color: #f0f0f0;
    font-family: Arial, sans-serif;
    perspective: 1500px;
    position: relative;
  }
  
  .google-login-button {
    width: 100%;
    padding: 12px;
    background-color: white;
    color: #444;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
    margin-top: 15px;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  }
  
  .google-login-button:hover {
    background-color: #f8f8f8;
    border-color: #aaa;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
  
  .google-login-button:active {
    background-color: #f0f0f0;
    transform: translateY(1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .google-icon {
    width: 30px;  
    height: 30px; 
    margin-right: 10px;
  }
  
  .login-card {
    width: 800px;
    height: 450px;
    position: relative;
    transform-style: preserve-3d;
    transition: transform 0.8s;
  }
  
  .login-card.flip {
    transform: rotateY(180deg);
  }
  
  .login-side, .signup-side {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    display: flex;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }
  
  .signup-side {
    transform: rotateY(180deg);
  }
  
  .white-side, .black-side {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 40px;
  }
  
  .white-side {
    background-color: white;
  }
  
  .black-side {
    background-color: black;
    color: white;
  }
  
  .login-form {
    width: 100%;
    max-width: 320px;
    margin: 0 auto;
  }
  
  h1 {
    font-size: 32px;
    margin-bottom: 30px;
    font-weight: normal;
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
  
  .signup-option {
    margin-top: 20px;
    text-align: center;
    font-size: 14px;
    color: #555;
  }
  
  .signup-link {
    color: #0066ff;
    cursor: pointer;
    text-decoration: underline;
    transition: all 0.3s ease;
  }
  
  .signup-link:hover {
    color: #004bb9;
  }
  
  .welcome-content {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  @media (max-width: 820px) {
    .login-card {
      width: 95%;
      height: auto;
    }
    
    .login-side, .signup-side {
      flex-direction: column;
      height: auto;
      min-height: 500px;
    }
    
    .white-side, .black-side {
      padding: 30px;
    }
  }
  
  @media (max-width: 480px) {
    .login-form {
      max-width: 100%;
    }
  }
  </style>