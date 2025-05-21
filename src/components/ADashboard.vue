<template>
  <div class="admin-ploca">
    <div class="gornja-traka">
      <div class="traka-sadrzaj">
        <div class="profil-padajuci">
          <div class="profil-ikona" @click="promijeniProfilMenu">
            {{ korisnikInicijali }}
          </div>
          <div class="profil-izbornik" v-if="prikaziProfilMenu">
            <div class="korisnik-email">{{ korisnikEmail }}</div>
            <div class="izbornik-opcija odjava-opcija" @click="odjava">Odjava</div>
          </div>
        </div>
      </div>
    </div>

    <div class="ploca-kontejner">
      <nav class="bocna-traka">
        <div class="navigacijske-veze">
  <router-link to="/admin" class="nav-veza" exact-active-class="aktivna">
    Dashboard
  </router-link>
  <router-link to="/admin/prihodi" class="nav-veza" active-class="aktivna">
    Prihodi
  </router-link>
  <router-link to="/admin/oprema" class="nav-veza" active-class="aktivna">
    Oprema
  </router-link>
  <router-link to="/admin/cjenovnik" class="nav-veza" active-class="aktivna">
            Cjenovnik
          </router-link>
          <router-link to="/admin/korisnici" class="nav-veza" active-class="aktivna">
            Korisnici
          </router-link>
</div>
      </nav>
      
      <div class="glavni-sadrzaj">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../store/auth';

const router = useRouter();
const { logout: authLogout } = useAuth();
const prikaziProfilMenu = ref(false);

const korisnikEmail = computed(() => 'naddinko@gmail.com');
const korisnikInicijali = computed(() => korisnikEmail.value.charAt(0).toUpperCase());

const promijeniProfilMenu = () => {
  prikaziProfilMenu.value = !prikaziProfilMenu.value;
};

const odjava = async () => {
  try {
    await authLogout();
    router.push('/login');
  } catch (error) {
    console.error('Greška prilikom odjave:', error);
  }
};
</script>

<style scoped>
.admin-ploca {
  display: flex;
  flex-direction: column;
  height: 100vh;
  margin: 0;
}

.gornja-traka {
  height: 50px;
  z-index: 10;
  position: absolute;
  top: 0;
  right: 0;
  padding: 10px 20px;
}

.traka-sadrzaj {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 100%;
}

.profil-padajuci {
  position: relative;
}

.profil-ikona {
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

.profil-ikona:hover {
  transform: scale(1.05);
}

.profil-izbornik {
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

.korisnik-email {
  padding: 15px;
  border-bottom: 1px solid #eee;
  color: #555;
  font-size: 0.9rem;
  text-align: center;
}

.izbornik-opcija {
  padding: 12px 15px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.izbornik-opcija:hover {
  background-color: #f56358;
}

.odjava-opcija {
  color: white;
  font-weight: bold;
  background-color: #f44336;
  text-align: center;
}

.ploca-kontejner {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.bocna-traka {
  width: 250px;
  background-color: #123458;
  display: flex;
  flex-direction: column;
  margin: 0;
}

.navigacijske-veze {
  display: flex;
  flex-direction: column;
}

.nav-veza {
  padding: 15px;
  text-decoration: none;
  color: #ecf0f1;
  transition: background-color 0.3s, transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.nav-veza:hover {
  background-color: rgba(255,255,255,0.1);
  transform: translateX(5px);
}

.nav-veza.aktivna {
  background-color: #2261a5;
}

.nav-veza.router-link-active:not(.aktivna) {
  background-color: transparent;
}

.glavni-sadrzaj {
  flex-grow: 1;
  overflow-y: auto;
  background-color: #F1EFEC;
  margin: 0;
}
</style>