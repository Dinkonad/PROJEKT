<template>
  <nav class="donja-traka">
    <router-link
      v-for="stavka in primarneStavke"
      :key="stavka.to"
      :to="stavka.to"
      class="donja-stavka"
      :aria-label="stavka.label"
      v-bind="stavka.exact ? { 'exact-active-class': 'aktivna' } : { 'active-class': 'aktivna' }"
    >
      <span class="material-icons">{{ stavka.icon }}</span>
    </router-link>

    <button type="button" class="donja-stavka donja-profil" :class="{ aktivna: viseOtvoreno }" aria-label="Više" @click="viseOtvoreno = true">
      <span class="donja-avatar">{{ korisnikInicijali }}</span>
    </button>
  </nav>

  <Teleport to="body">
    <div v-if="viseOtvoreno" class="vise-prekrivac" @click="viseOtvoreno = false">
      <div class="vise-sheet" @click.stop>
        <div class="vise-rucka"></div>

        <div class="vise-profil">
          <div class="vise-ikona">{{ korisnikInicijali }}</div>
          <span class="vise-email">{{ korisnikEmail }}</span>
        </div>

        <router-link
          v-for="stavka in sekundarneStavke"
          :key="stavka.to"
          :to="stavka.to"
          class="vise-stavka"
          active-class="aktivna"
          @click="viseOtvoreno = false"
        >
          <span class="material-icons">{{ stavka.icon }}</span>
          {{ stavka.label }}
        </router-link>

        <button type="button" class="vise-stavka" @click="$emit('toggle-tema'); viseOtvoreno = false">
          <span class="material-icons">{{ temaTamna ? 'light_mode' : 'dark_mode' }}</span>
          {{ temaTamna ? 'Svijetla tema' : 'Tamna tema' }}
        </button>

        <button v-if="faceIdCredentiali.length === 0" type="button" class="vise-stavka" @click="registrirajFaceId">
          <span class="material-icons">face</span>
          Registriraj Face ID
        </button>
        <div v-for="zapis in faceIdCredentiali" :key="zapis.id" class="vise-stavka vise-faceid-redak">
          <span class="material-icons">verified_user</span>
          <span class="vise-faceid-naziv">Face ID: {{ zapis.naziv }}</span>
          <button type="button" class="vise-faceid-ukloni" title="Ukloni" @click="ukloniFaceIdZapis(zapis)">
            <span class="material-icons">close</span>
          </button>
        </div>

        <button v-if="pushPodrzan" type="button" class="vise-stavka" :disabled="pushUTijeku" @click="promijeniPush">
          <span class="material-icons">{{ pushUkljucen ? 'notifications_active' : 'notifications_none' }}</span>
          {{ pushUTijeku ? 'Molim pričekaj...' : (pushUkljucen ? 'Isključi notifikacije' : 'Uključi notifikacije') }}
        </button>

        <!-- PRIVREMENO - obrisat ćemo kasnije -->
        <button v-if="pushUkljucen" type="button" class="vise-stavka" :disabled="pushTestUTijeku" @click="testirajPush">
          <span class="material-icons">bug_report</span>
          {{ pushTestUTijeku ? 'Šaljem...' : 'TEST notifikacija' }}
        </button>

        <button type="button" class="vise-stavka odjava" @click="$emit('odjava'); viseOtvoreno = false">
          <span class="material-icons">logout</span>
          Odjava
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { navStavke } from '@/config/navigacija.js';
import { dohvatiRegistrirane, registrirajNoviCredential, ukloniCredential, jePodrzano } from '@/services/webauthn.js';
import { auth } from '@/services/firebase.js';
import { jePodrzanoPush, jePretplacenNaOvomUredjaju, ukljuciPushNotifikacije, iskljuciPushNotifikacije } from '@/services/push.js';

const props = defineProps({
  korisnikEmail: { type: String, default: '' },
  temaTamna: { type: Boolean, default: false }
});
defineEmits(['toggle-tema', 'odjava']);

const viseOtvoreno = ref(false);
const faceIdCredentiali = ref([]);
const pushPodrzan = ref(jePodrzanoPush());
const pushUkljucen = ref(false);
const pushUTijeku = ref(false);
const pushTestUTijeku = ref(false);
const BACKEND_URL = import.meta.env.VITE_GARMIN_BACKEND_URL || '';
const primarneStavke = computed(() => navStavke.filter(s => s.mobilePrimary));
const sekundarneStavke = computed(() => navStavke.filter(s => !s.mobilePrimary));
const korisnikInicijali = computed(() => (props.korisnikEmail || '?').charAt(0).toUpperCase());

onMounted(() => {
  dohvatiRegistrirane().then(lista => { faceIdCredentiali.value = lista; });
  if (pushPodrzan.value) {
    jePretplacenNaOvomUredjaju().then(stanje => { pushUkljucen.value = stanje; });
  }
});

const promijeniPush = async () => {
  pushUTijeku.value = true;
  try {
    if (pushUkljucen.value) {
      await iskljuciPushNotifikacije();
      pushUkljucen.value = false;
    } else {
      await ukljuciPushNotifikacije();
      pushUkljucen.value = true;
    }
  } catch (error) {
    console.error('Greška pri uključivanju push notifikacija:', error);
    alert('Nije uspjelo: ' + error.message);
  } finally {
    pushUTijeku.value = false;
  }
};

const testirajPush = async () => {
  pushTestUTijeku.value = true;
  try {
    const idToken = await auth.currentUser.getIdToken();
    const odgovor = await fetch(`${BACKEND_URL}/push/test`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}` }
    });
    if (!odgovor.ok) throw new Error(`Greška ${odgovor.status}`);
    const rezultat = await odgovor.json();
    alert(`Testna notifikacija poslana na ${rezultat.broj_uredjaja} uređaj(a).`);
  } catch (error) {
    console.error('Greška pri testiranju push notifikacije:', error);
    alert('Test nije uspio: ' + error.message);
  } finally {
    pushTestUTijeku.value = false;
  }
};

const registrirajFaceId = async () => {
  if (!jePodrzano()) {
    alert('Ovaj uređaj/preglednik ne podržava Face ID / Touch ID.');
    return;
  }
  const nazivUredaja = prompt('Naziv uređaja (npr. iPhone):', 'iPhone') || 'Uređaj';
  try {
    const idToken = await auth.currentUser.getIdToken();
    await registrirajNoviCredential(idToken, nazivUredaja);
    faceIdCredentiali.value = await dohvatiRegistrirane();
    alert('Face ID je registriran na ovom uređaju.');
  } catch (error) {
    console.error('Greška pri registraciji Face ID:', error);
    alert('Registracija nije uspjela: ' + error.message);
  }
};

const ukloniFaceIdZapis = async (zapis) => {
  if (!confirm(`Ukloniti Face ID za "${zapis.naziv}"?`)) return;
  try {
    await ukloniCredential(zapis);
    faceIdCredentiali.value = faceIdCredentiali.value.filter(c => c.id !== zapis.id);
  } catch (error) {
    console.error('Greška pri uklanjanju Face ID zapisa:', error);
  }
};
</script>

<style scoped>
.donja-traka {
  display: none;
}

.vise-prekrivac {
  display: none;
}

@media (max-width: 768px) {
  .donja-traka {
    display: flex;
    align-items: center;
    justify-content: space-around;
    position: fixed;
    left: 14px;
    right: 14px;
    bottom: calc(14px + env(safe-area-inset-bottom, 0));
    height: 58px;
    padding: 0 6px;
    background-color: var(--glass-bg);
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
    backdrop-filter: blur(var(--glass-blur)) saturate(160%);
    border: 1px solid var(--glass-border);
    border-radius: 999px;
    box-shadow: var(--glass-shadow);
    z-index: 950;
  }

  .donja-stavka {
    flex: 1;
    min-width: 0;
    height: 42px;
    margin: 0 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    border-radius: 999px;
    text-decoration: none;
    color: var(--text-muted);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: color 0.2s ease, background-color 0.2s ease;
  }

  .donja-stavka .material-icons {
    font-size: 24px;
  }

  .donja-stavka.aktivna {
    color: var(--accent);
    background-color: var(--glass-bg-muted);
  }

  .donja-profil {
    flex: 0 0 auto;
    width: 40px;
    margin: 0 2px;
    padding: 0;
  }

  .donja-avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent-soft), var(--accent));
    color: white;
    font-size: 13px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .donja-profil.aktivna .donja-avatar {
    box-shadow: 0 0 0 2px var(--accent);
  }

  .vise-prekrivac {
    display: block;
    position: fixed;
    inset: 0;
    background-color: rgba(3, 3, 3, 0.5);
    z-index: 1100;
  }

  .vise-sheet {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    max-height: 75vh;
    overflow-y: auto;
    background-color: var(--glass-bg);
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
    backdrop-filter: blur(var(--glass-blur)) saturate(160%);
    border: 1px solid var(--glass-border);
    border-bottom: none;
    border-radius: var(--radius-card) var(--radius-card) 0 0;
    padding: 10px 16px calc(16px + env(safe-area-inset-bottom, 0));
    box-shadow: 0 -8px 24px var(--shadow-color);
  }

  .vise-rucka {
    width: 40px;
    height: 4px;
    border-radius: 2px;
    background-color: var(--border-color);
    margin: 4px auto 14px;
  }

  .vise-profil {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 14px;
    margin-bottom: 8px;
    border-bottom: 1px solid var(--border-color);
  }

  .vise-ikona {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: var(--accent);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    flex-shrink: 0;
  }

  .vise-email {
    color: var(--text-heading);
    font-weight: 500;
    font-size: 0.9rem;
    word-break: break-word;
  }

  .vise-stavka {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    padding: 14px 8px;
    background: none;
    border: none;
    text-decoration: none;
    color: var(--text-heading);
    font-family: 'Roboto', sans-serif;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
  }

  .vise-stavka.aktivna {
    color: var(--accent);
  }

  .vise-stavka.odjava {
    color: var(--danger);
  }

  .vise-faceid-redak {
    cursor: default;
  }

  .vise-faceid-naziv {
    flex: 1;
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .vise-faceid-ukloni {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    padding: 4px;
  }
}
</style>
