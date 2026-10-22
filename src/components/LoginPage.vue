<template>
  <div class="prijava-kontejner">
    <admin-prijava
      v-if="prikaziAdminPanel"
      @zatvori="zatvoriAdminPanel"
      @prijava="handleAdminPrijava"
    />

    <div v-if="!prikaziAdminPanel" class="prijava-kartica" :class="{ 'okretanje': jeRegistracija }">
      <div class="prijava-strana">
        <div class="bijela-strana">
          <div class="obrazac">
            <h1>Prijava</h1>

            <div class="grupa">
              <label for="email-unos">Email</label>
              <input 
                type="email" 
                id="email-unos" 
                v-model="korisnickoIme" 
                placeholder="kreso123@exempl.com" 
              />
            </div>

            <div class="grupa lozinka-grupa">
              <label for="lozinka">Lozinka</label>
              <div class="lozinka-unos">
                <input 
                  :type="prikaziLozinku ? 'text' : 'password'" 
                  id="lozinka" 
                  v-model="lozinka" 
                />
                <span class="prekidac-lozinka" @click="togglePrikaziLozinku">
                  {{ prikaziLozinku ? '👁️' : '🙈' }}
                </span>
              </div>
            </div>
            <p v-if="greškaPrijave" class="poruka-greška">{{ greškaPrijave }}</p>

            <button class="gumb-prijava" @click="prijava">Prijava</button>

            <button v-if="faceIdDostupan" class="gumb-faceid" :disabled="faceIdUTijeku" @click="prijavaFaceIdom">
              <span class="faceid-ikona">🔐</span>
              {{ faceIdUTijeku ? 'Potvrđujem...' : 'Prijavi se Face ID-om' }}
            </button>

            <button class="google-prijava" @click="prijavaGoogleom">
              <img 
                src="https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png" 
                class="google-ikona"
                alt="Google logo">
              Prijava s Google računom
            </button>

            <div class="opcija-registracija">
              Stvori račun <a @click.prevent="promijeniNačin" class="poveznica-registracija">Registracija</a>
            </div>
          </div>
        </div>

        <div class="crna-strana">
          <div class="dobrodošlica">
            <h1>NAGY_PHOTO</h1>
            <p class="tekst-dobrodošlica">
              Prijavi se da bi pregledao cijeli sadrzaj
            </p>
          </div>
        </div>
      </div>
      <div class="registracija-strana">
        <div class="crna-strana">
          <div class="dobrodošlica">
            <h1>NAGY_PHOTO</h1>
            <p class="tekst-dobrodošlica">
              Ako si prvi puta ovdje prijavi se na stranicu 
            </p>
          </div>
        </div>

        <div class="bijela-strana">
          <div class="obrazac">
            <h1>Registracija</h1>

            <div class="grupa">
              <label for="novo-korisnicko-ime">Korisničko ime</label>
              <input 
                type="text" 
                id="novo-korisnicko-ime" 
                v-model="novoKorisnickoIme" 
                placeholder="Vaše korisničko ime"
              />
            </div>

            <div class="grupa">
              <label for="email">Email</label>
              <input 
                type="email" 
                id="email" 
                v-model="email" 
                placeholder="kreso123@exempl.com" 
              />
            </div>

            <div class="grupa lozinka-grupa">
              <label for="nova-lozinka">Lozinka</label>
              <div class="lozinka-unos">
                <input 
                  :type="prikaziNovuLozinku ? 'text' : 'password'" 
                  id="nova-lozinka" 
                  v-model="novaLozinka" 
                />
                <span class="prekidac-lozinka" @click="togglePrikaziNovuLozinku">
                  {{ prikaziNovuLozinku ? '🙈' : '👁️' }}
                </span>
              </div>
            </div>
            <p v-if="greškaRegistracije" class="poruka-greška">{{ greškaRegistracije }}</p>

            <button class="gumb-prijava" @click="registracija">Registracija</button>

            <div class="opcija-registracija">
              Već imate račun? <a @click.prevent="promijeniNačin" class="poveznica-registracija">Prijava</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { signInWithCustomToken } from 'firebase/auth';
import { useAuth } from '../store/auth';
import { auth } from '../services/firebase';
import { jePodrzano, prijaviSeFaceIdom } from '../services/webauthn';
import AdminPrijava from './ADashboard.vue';

const router = useRouter();
const { state, login, loginWithGoogle, signup, loginAsAdmin } = useAuth();

const faceIdDostupan = ref(jePodrzano());
const faceIdUTijeku = ref(false);

const korisnickoIme = ref('');
const lozinka = ref('');
const novoKorisnickoIme = ref('');
const email = ref('');
const novaLozinka = ref('');

const jeRegistracija = ref(false);
const prikaziAdminPanel = ref(false);
const prikaziLozinku = ref(false);
const prikaziNovuLozinku = ref(false);

const greškaPrijave = ref('');
const greškaRegistracije = ref('');

watch(() => state.isLoggedIn, (isLoggedIn) => {
  if (isLoggedIn) {
    router.push(state.isAdmin ? '/admin' : '/dashboard');
  }
}, { immediate: true });

const očistiPolja = () => {
  korisnickoIme.value = '';
  lozinka.value = '';
  novoKorisnickoIme.value = '';
  email.value = '';
  novaLozinka.value = '';
  greškaPrijave.value = '';
  greškaRegistracije.value = '';
};

const togglePrikaziLozinku = () => {
  prikaziLozinku.value = !prikaziLozinku.value;
};

const togglePrikaziNovuLozinku = () => {
  prikaziNovuLozinku.value = !prikaziNovuLozinku.value;
};

const prijava = async () => {
  greškaPrijave.value = '';
  if (!korisnickoIme.value || !lozinka.value) {
    greškaPrijave.value = 'Email i lozinka su obavezni.';
    return;
  }

  try {
    await login(korisnickoIme.value, lozinka.value);
    očistiPolja();
  } catch (error) {
    greškaPrijave.value = 'Pogrešan email ili lozinka.';
  }
};

const prijavaFaceIdom = async () => {
  greškaPrijave.value = '';
  faceIdUTijeku.value = true;
  try {
    const token = await prijaviSeFaceIdom();
    await signInWithCustomToken(auth, token);
    očistiPolja();
  } catch (error) {
    console.error('Greška pri Face ID prijavi:', error);
    greškaPrijave.value = error.message?.includes('nije registriran')
      ? 'Face ID nije registriran na ovom računu - prijavi se lozinkom i registriraj ga u postavkama.'
      : 'Face ID prijava nije uspjela. Pokušaj ponovno ili koristi lozinku.';
  } finally {
    faceIdUTijeku.value = false;
  }
};

const prijavaGoogleom = async () => {
  try {
    await loginWithGoogle();
  } catch (error) {
    greškaPrijave.value = 'Google prijava nije uspjela.';
  }
};

const registracija = async () => {
  greškaRegistracije.value = '';
  if (!novoKorisnickoIme.value || !email.value || !novaLozinka.value) {
    greškaRegistracije.value = 'Sva polja su obavezna.';
    return;
  }

  try {
    await signup(novoKorisnickoIme.value, email.value, novaLozinka.value);
    jeRegistracija.value = false;
    očistiPolja();
  } catch (error) {
    greškaRegistracije.value = 'Registracija nije uspjela.';
  }
};

const handleAdminPrijava = async (adminEmail, adminPassword) => {
  try {
    await loginAsAdmin(adminEmail, adminPassword);
    prikaziAdminPanel.value = false;
  } catch (error) {
    alert('Admin prijava nije uspjela: ' + error.message);
  }
};

const prikaziAdminPrijavu = () => {
  if (state.isAdmin) {
    alert('Već ste prijavljeni kao administrator!');
    return;
  }
  prikaziAdminPanel.value = true;
};

const zatvoriAdminPanel = () => {
  prikaziAdminPanel.value = false;
};

const promijeniNačin = () => {
  jeRegistracija.value = !jeRegistracija.value;
  greškaPrijave.value = '';
  greškaRegistracije.value = '';
};
</script>

<style scoped>
.prijava-kontejner {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    width: 100%;
    background-color: #F1EFEC;
    background-image:
      radial-gradient(circle at 12% 10%, rgba(18, 52, 88, 0.12), transparent 42%),
      radial-gradient(circle at 88% 18%, rgba(93, 138, 168, 0.16), transparent 42%),
      radial-gradient(circle at 25% 92%, rgba(156, 122, 84, 0.12), transparent 45%);
    font-family: Arial, sans-serif;
    perspective: 1500px;
    position: relative;
  }
  
  .gumb-faceid {
    width: 100%;
    padding: 10px;
    background-color: #F1EFEC;
    color: #123458;
    border: 1px solid #D4C9BE;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
    margin-top: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.3s ease;
  }

  .gumb-faceid:hover:not(:disabled) {
    background-color: #e5e1da;
  }

  .gumb-faceid:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .faceid-ikona {
    font-size: 18px;
  }

  .google-prijava {
    width: 100%;
    padding: 10px;
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
  
  .google-prijava:hover {
    background-color: #f8f8f8;
    border-color: #aaa;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
  
  .google-prijava:active {
    background-color: #f0f0f0;
    transform: translateY(1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .google-ikona {
    width: 30px;  
    height: 30px; 
    margin-right: 10px;
  }
  
  .prijava-kartica {
    width: 800px;
    height: 450px;
    position: relative;
    transform-style: preserve-3d;
    transition: transform 0.8s;
  }
  
  .prijava-kartica.okretanje {
    transform: rotateY(180deg);
  }
  
  .prijava-strana, .registracija-strana {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    display: flex;
    border-radius: 22px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 20px 50px rgba(18, 52, 88, 0.18);
  }

  .registracija-strana {
    transform: rotateY(180deg);
  }

  .bijela-strana, .crna-strana {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 40px;
  }

  .bijela-strana {
    background-color: rgba(255, 255, 255, 0.68);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
    backdrop-filter: blur(24px) saturate(160%);
  }

  .crna-strana {
    background-color: rgba(18, 52, 88, 0.82);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
    backdrop-filter: blur(24px) saturate(160%);
    color: white;
  }
  
  .obrazac {
    width: 100%;
    max-width: 320px;
    margin: 0 auto;
  }
  
  h1 {
    font-size: 32px;
    margin-bottom: 15px;
    font-weight: normal;
  }
  
  .grupa {
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
    border-color: #030303;
    box-shadow: #030303;
    outline: none;
  }
  
  .gumb-prijava {
    width: 100%;
    padding: 12px;
    background-color: #123458;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
    margin-top: 10px;
    transition: all 0.3s ease;
  }
  
  .gumb-prijava:hover {
    background-color: #2261a5;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
  
  .gumb-prijava:active {
    background-color: #2261a5;
    transform: translateY(1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  .opcija-registracija {
    margin-top: 20px;
    text-align: center;
    font-size: 14px;
    color: #555;
  }
  
  .poveznica-registracija {
    color: #0066ff;
    cursor: pointer;
    text-decoration: underline;
    transition: all 0.3s ease;
  }
  
  .poveznica-registracija:hover {
    color: #004bb9;
  }
  
  .dobrodošlica {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  @media (max-width: 820px) {
    .prijava-kartica {
      width: 95%;
      height: auto;
    }
    
    .prijava-strana, .registracija-strana {
      flex-direction: column;
      height: auto;
      min-height: 500px;
    }
    
    .bijela-strana, .crna-strana {
      padding: 30px;
    }
  }
  
  @media (max-width: 480px) {
    .obrazac {
      max-width: 100%;
    }
  }

  .lozinka-grupa {
    position: relative;
    margin-bottom: 20px;
  }

  .lozinka-unos {
    position: relative;
  }

  input {
    width: 100%;
    padding: 10px;
    padding-right: 65px; 
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
  }

  .prekidac-lozinka {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    user-select: none;
    font-size: 18px;
  } 
  
  .poruka-greška {
    color: red;
    font-size: 14px;
    margin-top: -10px;
    margin-bottom: 15px;
  }
</style>