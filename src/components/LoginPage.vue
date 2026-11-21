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
                  <span class="material-icons" aria-hidden="true">{{ prikaziLozinku ? 'visibility' : 'visibility_off' }}</span>
                </span>
              </div>
            </div>
            <p v-if="greškaPrijave" class="poruka-greška" role="alert">{{ greškaPrijave }}</p>

            <button class="gumb-prijava" @click="prijava">Prijava</button>

            <button v-if="faceIdDostupan" class="gumb-faceid" :disabled="faceIdUTijeku" @click="prijavaFaceIdom()">
              <span class="faceid-ikona"><span class="material-icons" aria-hidden="true">face</span></span>
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
            <h1>Nagy Photos</h1>
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
/* Prijava je uvijek tamna (prvi dojam aplikacije), bez obzira na odabranu temu */
.prijava-kontejner {
  --l-bg: #0A0A0C;
  --l-tekst: #F5F1EA;
  --l-tekst-2: #BDB6A9;
  --l-prigusen: #A09A8E;
  --l-akcent: #D6B67F;
  --l-rub: rgba(255, 238, 210, 0.16);
  color-scheme: dark;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  padding: calc(24px + env(safe-area-inset-top, 0px)) 16px calc(24px + env(safe-area-inset-bottom, 0px));
  background-color: var(--l-bg);
  background-image:
    radial-gradient(58% 44% at 10% 0%, rgba(120, 92, 44, 0.42), transparent 72%),
    radial-gradient(44% 34% at 100% 6%, rgba(214, 182, 127, 0.11), transparent 72%),
    radial-gradient(52% 40% at 0% 100%, rgba(60, 46, 24, 0.4), transparent 72%);
  font-family: var(--font-sans);
  color: var(--l-tekst);
  position: relative;
}

.prijava-kartica {
  width: 840px;
  max-width: 100%;
  position: relative;
}

.prijava-strana {
  display: flex;
  min-height: 480px;
  border-radius: 28px;
  overflow: hidden;
  border: 1px solid var(--l-rub);
  background-color: rgba(27, 26, 25, 0.55);
  background-image: linear-gradient(155deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 30%, rgba(255, 255, 255, 0) 58%);
  -webkit-backdrop-filter: blur(28px) saturate(170%);
  backdrop-filter: blur(28px) saturate(170%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 30px 80px rgba(0, 0, 0, 0.6);
}

.bijela-strana,
.crna-strana {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 44px;
}

/* desna strana: znak objektiva (blenda) koji svijetli cijanom */
.crna-strana {
  position: relative;
  overflow: hidden;
  align-items: center;
  text-align: center;
  background-color: rgba(10, 10, 12, 0.55);
  border-left: 1px solid var(--l-rub);
}

.crna-strana::before {
  content: '';
  position: absolute;
  width: 360px;
  height: 360px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -62%);
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 50%, #0A0A0C 0 31%, transparent 31.5%),
    conic-gradient(from 20deg, rgba(214, 182, 127, 0.0), rgba(214, 182, 127, 0.7), rgba(120, 92, 44, 0.15), rgba(214, 182, 127, 0.55), rgba(120, 92, 44, 0.1), rgba(214, 182, 127, 0.7), rgba(214, 182, 127, 0.0));
  -webkit-mask: radial-gradient(circle, transparent 0 30%, #000 31% 49%, transparent 50%);
  mask: radial-gradient(circle, transparent 0 30%, #000 31% 49%, transparent 50%);
  filter: blur(0.4px) drop-shadow(0 0 28px rgba(214, 182, 127, 0.35));
  pointer-events: none;
}

.crna-strana::after {
  content: '';
  position: absolute;
  width: 470px;
  height: 470px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -62%);
  border-radius: 50%;
  border: 1px solid rgba(214, 182, 127, 0.16);
  box-shadow: 0 0 0 38px rgba(214, 182, 127, 0.03), 0 0 0 39px rgba(214, 182, 127, 0.08);
  pointer-events: none;
}

.dobrodošlica {
  position: relative;
  z-index: 1;
  margin-top: auto;
  padding-top: 270px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.dobrodošlica h1 {
  font-family: var(--font-display);
  font-size: 2.3rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  margin-bottom: 8px;
}

.tekst-dobrodošlica {
  max-width: 24ch;
  color: var(--l-tekst-2);
  font-size: 0.95rem;
  line-height: 1.5;
}

.obrazac {
  width: 100%;
  max-width: 330px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}

h1 {
  font-family: var(--font-display);
  font-size: 2.7rem;
  margin-bottom: 22px;
  font-weight: 650;
  letter-spacing: -0.02em;
  color: var(--l-tekst);
}

.grupa {
  margin-bottom: 18px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: var(--l-tekst-2);
  font-size: 0.88rem;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 13px 14px;
  border: 1px solid var(--l-rub);
  border-radius: 14px;
  background-color: rgba(10, 10, 12, 0.55);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.4);
  color: var(--l-tekst);
  font-size: 16px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

input::placeholder {
  color: var(--l-prigusen);
}

input:focus {
  border-color: var(--l-akcent);
  box-shadow: 0 0 0 4px rgba(214, 182, 127, 0.16);
  outline: none;
}

.lozinka-grupa {
  position: relative;
  margin-bottom: 20px;
}

.lozinka-unos {
  position: relative;
}

.lozinka-unos input {
  padding-right: 52px;
}

.prekidac-lozinka {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: var(--l-prigusen);
  cursor: pointer;
  user-select: none;
}

.prekidac-lozinka:hover {
  color: var(--l-akcent);
}

.prekidac-lozinka .material-icons {
  font-size: 22px;
}

.poruka-greška {
  color: #FF8C97;
  font-size: 14px;
  margin-top: -6px;
  margin-bottom: 14px;
}

/* glavni gumb: svijetleći cijan s odsjajem */
.gumb-prijava {
  width: 100%;
  min-height: 48px;
  padding: 12px;
  background-color: #D6B67F;
  background-image: linear-gradient(180deg, #F2E0B8 0%, #C9A96C 100%);
  color: #1A1408;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 6px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45), 0 1px 2px rgba(0, 0, 0, 0.4);
  transition: filter 0.2s ease, transform 0.15s ease;
}

.gumb-prijava:hover {
  filter: brightness(1.08);
}

.gumb-prijava:active {
  transform: scale(0.985);
}

.gumb-faceid,
.google-prijava {
  width: 100%;
  min-height: 48px;
  padding: 11px;
  background-color: rgba(255, 255, 255, 0.06);
  background-image: linear-gradient(155deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0) 60%);
  color: var(--l-tekst);
  border: 1px solid var(--l-rub);
  border-radius: 14px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.15s ease;
}

.gumb-faceid {
  margin-top: 10px;
}

.google-prijava {
  margin-top: 14px;
}

.gumb-faceid:hover:not(:disabled),
.google-prijava:hover {
  border-color: rgba(214, 182, 127, 0.5);
  background-color: rgba(214, 182, 127, 0.08);
}

.gumb-faceid:active:not(:disabled),
.google-prijava:active {
  transform: scale(0.985);
}

.gumb-faceid:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.faceid-ikona .material-icons {
  font-size: 22px;
  color: var(--l-akcent);
}

.google-ikona {
  width: 22px;
  height: 22px;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  border-radius: 0;
}

.razdjelnik {
  display: none;
  text-align: center;
  color: var(--l-prigusen);
  font-size: 13px;
  margin: 6px 0 14px;
}

/* mobitel: samo obrazac, Face ID na vrhu kao glavna radnja (iPhone 17 širine ~402 px) */
@media (max-width: 820px) {
  .prijava-kartica {
    width: 100%;
    max-width: 430px;
  }

  .prijava-strana {
    flex-direction: column;
  }

  .crna-strana {
    display: none;
  }

  .bijela-strana {
    padding: 34px 24px 28px;
  }

  .obrazac h1 {
    order: -2;
  }

  .gumb-faceid {
    order: -1;
    margin-top: 0;
    background-color: #D6B67F;
    background-image: linear-gradient(180deg, #F2E0B8 0%, #D6B67F 46%, #B69355 100%);
    color: #1A1408;
    border: 1px solid rgba(255, 255, 255, 0.3);
    font-weight: 650;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45), 0 1px 2px rgba(0, 0, 0, 0.4);
  }

  .gumb-faceid:hover:not(:disabled) {
    background-color: #D6B67F;
    border-color: rgba(255, 255, 255, 0.3);
    filter: brightness(1.08);
  }

  .faceid-ikona .material-icons {
    color: #1A1408;
  }

  .razdjelnik {
    display: block;
    order: -1;
  }
}

@media (max-width: 480px) {
  .prijava-kontejner {
    padding-left: 12px;
    padding-right: 12px;
  }

  .obrazac {
    max-width: 100%;
  }

  .bijela-strana {
    padding: 30px 20px 24px;
  }
}
</style>
