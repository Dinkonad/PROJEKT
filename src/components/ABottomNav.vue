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
      <div class="vise-sheet" role="dialog" aria-modal="true" @click.stop>
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

        <button type="button" class="vise-stavka" @click="postavkeOtvorene = !postavkeOtvorene">
          <span class="material-icons">settings</span>
          Postavke
          <span class="material-icons vise-strelica" :class="{ otvoreno: postavkeOtvorene }">expand_more</span>
        </button>
        <div v-if="postavkeOtvorene" class="vise-postavke">
        <button type="button" class="vise-stavka" @click="$emit('toggle-tema'); viseOtvoreno = false">
          <span class="material-icons">{{ temaTamna ? 'light_mode' : 'dark_mode' }}</span>
          {{ temaTamna ? 'Svijetla tema' : 'Tamna tema' }}
        </button>

        <button type="button" class="vise-stavka" :disabled="kopijaUTijeku" @click="napraviKopiju">
          <span class="material-icons">{{ kopijaUTijeku ? 'hourglass_top' : 'backup' }}</span>
          {{ kopijaUTijeku ? 'Radim kopiju...' : 'Sigurnosna kopija' }}
        </button>
        <p v-if="kopijaPoruka" class="vise-kopija-poruka">{{ kopijaPoruka }}</p>

        <button v-if="faceIdCredentiali.length === 0" type="button" class="vise-stavka" @click="registrirajFaceId">
          <span class="material-icons">face</span>
          Registriraj Face ID
        </button>
        <div v-for="zapis in faceIdCredentiali" :key="zapis.id" class="vise-stavka vise-faceid-redak">
          <span class="material-icons">verified_user</span>
          <span class="vise-faceid-naziv">Face ID: {{ zapis.naziv }}</span>
          <button aria-label="Ukloni" type="button" class="vise-faceid-ukloni" title="Ukloni" @click="ukloniFaceIdZapis(zapis)">
            <span class="material-icons">close</span>
          </button>
        </div>

        <button v-if="pushPodrzan && !pushUkljucen" type="button" class="vise-stavka" :disabled="pushUTijeku" @click="promijeniPush">
          <span class="material-icons">notifications_none</span>
          {{ pushUTijeku ? 'Molim pričekaj...' : 'Uključi notifikacije' }}
        </button>
        <div v-for="zapis in pushPretplate" :key="zapis.endpoint" class="vise-stavka vise-faceid-redak">
          <span class="material-icons">notifications_active</span>
          <span class="vise-faceid-naziv">Notifikacije: {{ zapis.naziv || 'Nepoznat uređaj (stariji zapis)' }}</span>
          <button aria-label="Ukloni" type="button" class="vise-faceid-ukloni" title="Ukloni" @click="ukloniPushZapis(zapis)">
            <span class="material-icons">close</span>
          </button>
        </div>

        <!-- PRIVREMENO - obrisat ćemo kasnije -->
        <button v-if="pushPretplate.length > 0" type="button" class="vise-stavka" :disabled="pushTestUTijeku" @click="testirajPush">
          <span class="material-icons">bug_report</span>
          {{ pushTestUTijeku ? 'Šaljem...' : 'TEST notifikacija' }}
        </button>

        </div>

        <button type="button" class="vise-stavka odjava" @click="$emit('odjava'); viseOtvoreno = false">
          <span class="material-icons">logout</span>
          Odjava
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { obavijesti } from '@/services/obavijest.js';
import { ref, computed, onMounted } from 'vue';
import { navStavke } from '@/config/navigacija.js';
import { dohvatiRegistrirane, registrirajNoviCredential, ukloniCredential, jePodrzano } from '@/services/webauthn.js';
import { auth } from '@/services/firebase.js';
import { spremiSigurnosnuKopiju, opisRezultata } from '@/services/backup.js';
import { jePodrzanoPush, jePretplacenNaOvomUredjaju, dohvatiPushPretplate, ukljuciPushNotifikacije, iskljuciPushNotifikacije, ukloniPushPretplatu } from '@/services/push.js';

const props = defineProps({
  korisnikEmail: { type: String, default: '' },
  temaTamna: { type: Boolean, default: false }
});
defineEmits(['toggle-tema', 'odjava']);

const viseOtvoreno = ref(false);
const kopijaUTijeku = ref(false);
const kopijaPoruka = ref('');
const postavkeOtvorene = ref(false);

const napraviKopiju = async () => {
  if (kopijaUTijeku.value) return;
  kopijaUTijeku.value = true;
  kopijaPoruka.value = '';
  try {
    kopijaPoruka.value = opisRezultata(await spremiSigurnosnuKopiju());
  } catch (error) {
    console.error('Greška pri izradi sigurnosne kopije:', error);
    kopijaPoruka.value = 'Kopija nije uspjela. Pokušaj ponovno.';
  } finally {
    kopijaUTijeku.value = false;
    setTimeout(() => { kopijaPoruka.value = ''; }, 10000);
  }
};
const faceIdCredentiali = ref([]);
const pushPodrzan = ref(jePodrzanoPush());
const pushUkljucen = ref(false);
const pushPretplate = ref([]);
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
    dohvatiPushPretplate().then(lista => { pushPretplate.value = lista; });
  }
});

const promijeniPush = async () => {
  const nazivUredaja = prompt('Naziv uređaja (npr. iPhone):', 'iPhone') || 'Uređaj';
  pushUTijeku.value = true;
  try {
    await ukljuciPushNotifikacije(nazivUredaja);
    pushUkljucen.value = true;
    pushPretplate.value = await dohvatiPushPretplate();
  } catch (error) {
    console.error('Greška pri uključivanju push notifikacija:', error);
    obavijesti('Nije uspjelo: ' + error.message);
  } finally {
    pushUTijeku.value = false;
  }
};

const ukloniPushZapis = async (zapis) => {
  if (!confirm(`Ukloniti notifikacije za "${zapis.naziv}"?`)) return;
  try {
    await ukloniPushPretplatu(zapis);
    pushPretplate.value = pushPretplate.value.filter(p => p.endpoint !== zapis.endpoint);

    const registracija = await navigator.serviceWorker.getRegistration();
    const trenutnaPretplata = registracija ? await registracija.pushManager.getSubscription() : null;
    if (trenutnaPretplata && trenutnaPretplata.endpoint === zapis.endpoint) {
      await trenutnaPretplata.unsubscribe();
      pushUkljucen.value = false;
    }
  } catch (error) {
    console.error('Greška pri uklanjanju push zapisa:', error);
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
    obavijesti(`Testna notifikacija poslana na ${rezultat.broj_uredjaja} uređaj(a).`);
  } catch (error) {
    console.error('Greška pri testiranju push notifikacije:', error);
    obavijesti('Test nije uspio: ' + error.message);
  } finally {
    pushTestUTijeku.value = false;
  }
};

const registrirajFaceId = async () => {
  if (!jePodrzano()) {
    obavijesti('Ovaj uređaj/preglednik ne podržava Face ID / Touch ID.');
    return;
  }
  const nazivUredaja = prompt('Naziv uređaja (npr. iPhone):', 'iPhone') || 'Uređaj';
  try {
    const idToken = await auth.currentUser.getIdToken();
    await registrirajNoviCredential(idToken, nazivUredaja);
    faceIdCredentiali.value = await dohvatiRegistrirane();
    obavijesti('Face ID je registriran na ovom uređaju.');
  } catch (error) {
    console.error('Greška pri registraciji Face ID:', error);
    obavijesti('Registracija nije uspjela: ' + error.message);
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
    color: var(--on-accent);
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
    max-height: 75dvh;
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
    color: var(--on-accent);
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
    font-family: var(--font-sans);
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

  .vise-strelica {
    margin-left: auto;
    transition: transform 0.2s ease;
  }

  .vise-strelica.otvoreno {
    transform: rotate(180deg);
  }

  .vise-postavke {
    margin: 0 0 6px;
    padding-left: 10px;
    border-left: 2px solid var(--border-color);
  }

  .vise-kopija-poruka {
    margin: 0 4px 8px;
    padding: 0 12px;
    font-size: 0.78rem;
    line-height: 1.35;
    color: var(--text-muted);
  }

  .vise-stavka:disabled {
    opacity: 0.6;
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
