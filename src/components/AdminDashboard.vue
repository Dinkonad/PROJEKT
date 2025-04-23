<template>
  <div class="admin-dashboard">
    <div class="top-navbar">
      <div class="navbar-content">
        <div class="profile-dropdown">
          <div class="profile-icon" @click="toggleProfileMenu">
            {{ userInitial }}
          </div>
          <div class="profile-menu" v-if="showProfileMenu">
            <div class="user-email">{{ userEmail }}</div>
            <div class="menu-item logout-item" @click="logout">Odjava</div>
          </div>
        </div>
      </div>
    </div>

    <div class="dashboard-container">
      <nav class="sidebar">
        <div class="nav-links">
          <router-link to="/admin" class="nav-link" exact-active-class="active">
            Admin Dashboard
          </router-link>
          <router-link to="/admin/prihodi" class="nav-link" active-class="active">
            Prihodi
          </router-link>
        </div>
      </nav>
      
      <div class="main-content">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../store/auth';

export default {
  name: 'AdminDashboard',
  setup() {
    const router = useRouter();
    const { logout: authLogout } = useAuth();
    const showProfileMenu = ref(false);
    
    const userEmail = computed(() => 'naddinko@gmail.com');
    const userInitial = computed(() => userEmail.value.charAt(0).toUpperCase());
    
    const toggleProfileMenu = () => {
      showProfileMenu.value = !showProfileMenu.value;
    };
    
    const logout = async () => {
      try {
        await authLogout();
        router.push('/login');
      } catch (error) {
        console.error('Greška prilikom odjave:', error);
      }
    };
    
    return {
      logout,
      showProfileMenu,
      toggleProfileMenu,
      userEmail,
      userInitial
    };
  }
}
</script>

<style scoped>
.admin-dashboard {
  display: flex;
  flex-direction: column;
  height: 100vh;
  margin: 0;
}

.top-navbar {
  height: 50px;
  z-index: 10;
  position: absolute;
  top: 0;
  right: 0;
  padding: 10px 20px;
}

.navbar-content {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 100%;
}

.profile-dropdown {
  position: relative;
}

.profile-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #123458;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: bold;
  font-size: 16px;
  transition: transform 0.2s ease;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.profile-icon:hover {
  transform: scale(1.05);
}

.profile-menu {
  position: absolute;
  top: 50px;
  right: 0;
  width: 200px;
  background-color: white;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  overflow: hidden;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-email {
  padding: 15px;
  border-bottom: 1px solid #eee;
  color: #555;
  font-size: 0.9rem;
  text-align: center;
}

.menu-item {
  padding: 12px 15px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background-color: #f56358;
}

.logout-item {
  color: white;
  font-weight: bold;
  background-color: #f44336;
  text-align: center;
}

.dashboard-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 250px;
  background-color: #123458;
  display: flex;
  flex-direction: column;
  margin: 0;
}

.nav-links {
  display: flex;
  flex-direction: column;
}

.nav-link {
  padding: 15px;
  text-decoration: none;
  color: #ecf0f1;
  transition: background-color 0.3s, transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.nav-link:hover {
  background-color: rgba(255,255,255,0.1);
  transform: translateX(5px);
}

.nav-link.active {
  background-color: #2261a5;
}

.nav-link.router-link-active:not(.active) {
  background-color: transparent;
}

.main-content {
  flex-grow: 1;
  overflow-y: auto;
  background-color: #F1EFEC;
  margin: 0;
}
</style>