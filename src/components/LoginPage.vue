<template>
  <div class="prijava-kontejner">
    <div class="prijava-kartica">
      <div class="prijava-strana">
        <div class="bijela-strana">
          <div class="obrazac">
            <h1>Prijava</h1>

            <div class="grupa">
              <label for="email-unos">Email</label>
              <input 
                type="email" 
                id="email-unos" 
                name="email"
                autocomplete="username"
                autocapitalize="none"
                spellcheck="false"
                v-model="korisnickoIme" 
                placeholder="ime@primjer.hr…" 
                @keydown.enter="prijava"
              />
            </div>

            <div class="grupa lozinka-grupa">
              <label for="lozinka">Lozinka</label>
              <div class="lozinka-unos">
                <input 
                  :type="prikaziLozinku ? 'text' : 'password'" 
                  id="lozinka" 
                  name="password"
                  autocomplete="current-password"
                  v-model="lozinka" 
                  @keydown.enter="prijava"
                />
                <span class="prekidac-lozinka" aria-label="Prikaži ili sakrij lozinku" @click="togglePrikaziLozinku" role="button" tabindex="0" @keydown.enter.prevent="togglePrikaziLozinku">
                  {{ prikaziLozinku ? '👁️' : '🙈' }}
                </span>
              </div>
            </div>
            <p v-if="greškaPrijave" class="poruka-greška" role="alert">{{ greškaPrijave }}</p>

            <button class="gumb-prijava" @click="prijava">Prijava</button>

            <button v-if="faceIdDostupan" class="gumb-faceid" :disabled="faceIdUTijeku" @click="prijavaFaceIdom()">
              <span class="faceid-ikona">🔐</span>
              {{ faceIdUTijeku ? 'Potvrđujem...' : 'Prijavi se Face ID-om' }}
            </button>

            <div v-if="faceIdDostupan" class="razdjelnik">ili unesi podatke</div>

            <button class="google-prijava" @click="prijavaGoogleom">
              <img 
                src="https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png" 
                class="google-ikona"
                alt="Google logo">
              Prijava s Google računom
            </button>

          </div>
        </div>

        <div class="crna-strana">
          <div class="dobrodošlica">
            <h1>NAGY_PHOTO</h1>
            <p class="tekst-dobrodošlica">
              Privatna aplikacija. Pristup ima samo vlasnik.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { signInWithCustomToken } from 'firebase/auth';
import { useAuth } from '../store/auth';
import { auth } from '../services/firebase';
import { jePodrzano, prijaviSeFaceIdom } from '../services/webauthn';

const router = useRouter();
const { state, login, loginWithGoogle } = useAuth();

const jeMobilniUredaj = () => window.matchMedia('(max-width: 768px)').matches;

const faceIdDostupan = ref(jePodrzano() && jeMobilniUredaj());
const faceIdUTijeku = ref(false);

const korisnickoIme = ref('');
const lozinka = ref('');
const prikaziLozinku = ref(false);
const greškaPrijave = ref('');

watch(() => state.isLoggedIn, (prijavljen) => {
  if (prijavljen) router.push('/admin');
}, { immediate: true });

// netko tko nije vlasnik se pokušao prijaviti (odmah je odjavljen)
watch(() => state.odbijen, (odbijen) => {
  if (odbijen) greškaPrijave.value = 'Ovaj račun nema pristup aplikaciji.';
}, { immediate: true });

const očistiPolja = () => {
  korisnickoIme.value = '';
  lozinka.value = '';
  greškaPrijave.value = '';
};

const togglePrikaziLozinku = () => {
  prikaziLozinku.value = !prikaziLozinku.value;
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

const prijavaFaceIdom = async (automatski = false) => {
  greškaPrijave.value = '';
  faceIdUTijeku.value = true;
  try {
    const token = await prijaviSeFaceIdom();
    await signInWithCustomToken(auth, token);
    očistiPolja();
  } catch (error) {
    console.error('Greška pri Face ID prijavi:', error);
    if (automatski) return;
    greškaPrijave.value = error.message?.includes('nije registriran')
      ? 'Face ID nije registriran na ovom računu - prijavi se lozinkom i registriraj ga u postavkama.'
      : 'Face ID prijava nije uspjela. Pokušaj ponovno ili koristi lozinku.';
  } finally {
    faceIdUTijeku.value = false;
  }
};

onMounted(() => {
  if (faceIdDostupan.value) {
    prijavaFaceIdom(true);
  }
});

const prijavaGoogleom = async () => {
  try {
    await loginWithGoogle();
  } catch (error) {
    greškaPrijave.value = 'Google prijava nije uspjela.';
  }
};
</script>

<style scoped>
.prijava-kontejner {
    color-scheme: light;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    min-height: 100dvh;
    width: 100%;
    background-color: #F1EFEC;
    background-image:
      radial-gradient(circle at 12% 10%, rgba(18, 52, 88, 0.12), transparent 42%),
      radial-gradient(circle at 88% 18%, rgba(93, 138, 168, 0.16), transparent 42%),
      radial-gradient(circle at 25% 92%, rgba(156, 122, 84, 0.12), transparent 45%);
    font-family: var(--font-sans);
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
    transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease, opacity 0.3s ease;
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
    transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease, opacity 0.3s ease;
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
  }
  
  .prijava-strana {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    border-radius: 22px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 20px 50px rgba(18, 52, 88, 0.18);
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
    display: flex;
    flex-direction: column;
  }

  .razdjelnik {
    display: none;
    text-align: center;
    color: #5D8AA8;
    font-size: 12px;
    margin: 4px 0 14px;
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
    transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease, opacity 0.3s ease;
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
    transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease, opacity 0.3s ease;
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
  
  .dobrodošlica {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  @media (max-width: 820px) {
    .prijava-kontejner {
      padding: 24px 16px;
    }

    .prijava-kartica {
      width: 100%;
      max-width: 420px;
      height: auto;
      perspective: none;
    }

    .prijava-strana {
      position: static;
      flex-direction: column;
      height: auto;
      min-height: 0;
      transform: none !important;
    }

    .crna-strana {
      display: none;
    }

    .bijela-strana {
      padding: 32px 24px;
    }

    .obrazac h1 {
      order: -2;
    }

    .gumb-faceid {
      order: -1;
      margin-top: 4px;
      background-color: #123458;
      color: white;
      border: none;
      padding: 13px;
      font-weight: 500;
    }

    .gumb-faceid:hover:not(:disabled) {
      background-color: #1c4c80;
    }

    .razdjelnik {
      display: block;
      order: -1;
    }
  }

  @media (max-width: 480px) {
    .obrazac {
      max-width: 100%;
    }

    .bijela-strana {
      padding: 28px 20px;
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