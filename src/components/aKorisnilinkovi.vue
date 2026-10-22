<template>
  <div class="stranica">
    <div class="sadrzaj">
      <div class="zaglavlje">
        <h1 class="naslov">Korisni linkovi</h1>
      </div>
      <div class="pretraga-sekcija">
        <input 
          v-model="pretraga"
          type="text" 
          placeholder="🔍 Pretražite linkove po nazivu ili URL-u..."
          class="pretraga-input"
        />
      </div>

      <div class="dodaj-sekcija">
        <div class="forma">
          <input 
            v-model="noviLink.url"
            type="text" 
            placeholder="Zalijepite link ovdje..."
            class="url-unos"
            @keyup.enter="spremi"
            @input="debounceUcitajPodatke"
          />
          
          <input 
            v-if="trebaNaziv"
            v-model="noviLink.naziv"
            type="text" 
            placeholder="Naziv"
            class="naziv-unos"
          />

          <button @click="spremi" class="gumb-spremi" :disabled="!mozeSpremi || ucitava">
            {{ ucitava ? 'Sprema...' : 'Spremi' }}
          </button>
        </div>
      </div>

      <div class="lista">
        <div v-if="ucitavaLinkove" class="ucitavanje">
          <div class="poruka">
            <p>Učitavaju se linkovi...</p>
          </div>
        </div>

        <div v-else-if="linkovi.length === 0" class="prazno">
          <div class="poruka">
            <p>Nema spremljenih linkova</p>
          </div>
        </div>

        <div v-else-if="filteredLinkovi.length === 0 && pretraga" class="nema-rezultata">
          <div class="poruka">
            <p>Nema rezultata za pretragu "{{ pretraga }}"</p>
          </div>
        </div>

        <div v-else class="redovi">
          <div 
            v-for="link in filteredLinkovi" 
            :key="link.id"
            class="red"
            :class="`tip-${link.tip}`"
            @click="otvori(link.url)"
          >
            <div class="sadrzaj-reda">
              <div class="slika">
                <img 
                  v-if="link.slika" 
                  :src="link.slika" 
                  :alt="link.naziv"
                  @error="sakriSliku"
                />
                <div v-else class="zamjena">
                  <span class="tekst">{{ dohvatiInitijale(link.tip) }}</span>
                </div>
              </div>

              <div class="informacije">
                <div class="vrh">
                  <span class="oznaka" :class="`oznaka-${link.tip}`">
                    {{ tipovi[link.tip] }}
                  </span>
                  <div class="datum">{{ formatirajDatum(link.datum) }}</div>
                </div>

                <h3 class="naziv" @click.stop="urediNaziv(link)">{{ link.naziv }}</h3>
                <div class="url">{{ skratiUrl(link.url) }}</div>
              </div>

              <div class="akcije">
                <button @click.stop="urediNaziv(link)" class="gumb-uredi" title="Uredi naziv">
                  ✏️
                </button>
                <button @click.stop="pripremiZaBrisanje(link)" class="gumb-brisi">
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Transition name="fade">
      <div class="pozadina" v-if="uredba !== null" @click="uredba = null">
        <div class="modal" @click.stop>
          <div class="modal-zaglavlje">
            <h2>Uredi naziv</h2>
          </div>
          <div class="modal-sadrzaj">
            <input 
              v-model="noviNaziv"
              type="text" 
              placeholder="Unesite novi naziv..."
              class="naziv-input-modal"
              @keyup.enter="spremiNaziv"
              ref="nazivInput"
            />
          </div>
          <div class="modal-gumbovi">
            <button class="gumb-odustani" @click="uredba = null">Odustani</button>
            <button class="gumb-potvrdi" @click="spremiNaziv" :disabled="ucitava">
              {{ ucitava ? 'Sprema...' : 'Spremi' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div class="pozadina" v-if="brisanje !== null" @click="brisanje = null">
        <div class="modal" @click.stop>
          <div class="modal-zaglavlje">
            <h2>Potvrda brisanja</h2>
          </div>
          <div class="modal-sadrzaj">
            <span class="upozorenje">⚠</span>
            <p>Jeste li sigurni da želite obrisati ovaj link?</p>
          </div>
          <div class="modal-gumbovi">
            <button class="gumb-odustani" @click="brisanje = null">Odustani</button>
            <button class="gumb-potvrdi" @click="obrisi" :disabled="ucitava">
              {{ ucitava ? 'Briše...' : 'Potvrdi' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { db } from '@/services/firebase.js';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy, 
  query,
  serverTimestamp 
} from 'firebase/firestore';

const linkovi = ref([]);
const brisanje = ref(null);
const uredba = ref(null);
const noviNaziv = ref('');
const pretraga = ref('');
const debounceTimer = ref(null);
const ucitava = ref(false);
const ucitavaLinkove = ref(true);
const noviLink = ref({
  url: '',
  tip: '',
  naziv: '',
  slika: null
});

const tipovi = {
  'youtube-video': 'YouTube Video',
  'instagram': 'Instagram',
  'tiktok': 'TikTok',
  'ostalo': 'Ostalo'
};

const filteredLinkovi = computed(() => {
  if (!pretraga.value) return linkovi.value;
  
  const termin = pretraga.value.toLowerCase();
  return linkovi.value.filter(link => 
    link.naziv.toLowerCase().includes(termin) ||
    link.url.toLowerCase().includes(termin)
  );
});

const trebaNaziv = computed(() => {
  return noviLink.value.tip === 'instagram';
});

const mozeSpremi = computed(() => {
  if (!noviLink.value.url || !noviLink.value.tip) return false;
  
  if (noviLink.value.tip === 'instagram') {
    return noviLink.value.naziv && noviLink.value.naziv.trim().length >= 2;
  }
  
  return true;
});

const prepoznajTip = (url) => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube-video';
  }
  if (url.includes('instagram.com')) {
    return 'instagram';
  }
  if (url.includes('tiktok.com')) {
    return 'tiktok';
  }
  return 'ostalo';
};

const izvuciYouTubeId = (url) => {
  const regex = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const poklapanje = url.match(regex);
  return (poklapanje && poklapanje[7].length == 11) ? poklapanje[7] : null;
};

const debounceUcitajPodatke = () => {
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value);
  }
  
  debounceTimer.value = setTimeout(() => {
    ucitajPodatke();
  }, 1000);
};

const ucitajPodatke = async () => {
  if (!noviLink.value.url) return;

  const noviTip = prepoznajTip(noviLink.value.url);
  
  if (noviLink.value.tip !== noviTip) {
    noviLink.value.tip = noviTip;
    noviLink.value.naziv = '';
    noviLink.value.slika = null;
  }

  try {
    if (noviLink.value.tip === 'youtube-video') {
      const videoId = izvuciYouTubeId(noviLink.value.url);
      if (videoId) {
        try {
          const odgovor = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
          if (odgovor.ok) {
            const podaci = await odgovor.json();
            noviLink.value.slika = podaci.thumbnail_url;
            noviLink.value.naziv = podaci.title;
          } else {
            noviLink.value.slika = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            noviLink.value.naziv = 'YouTube Video';
          }
        } catch (greska) {
          noviLink.value.slika = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
          noviLink.value.naziv = 'YouTube Video';
        }
      }
    }
    else if (noviLink.value.tip === 'instagram') {
      try {
        const odgovor = await fetch(`https://api.instagram.com/oembed?url=${encodeURIComponent(noviLink.value.url)}`);
        if (odgovor.ok) {
          const podaci = await odgovor.json();
          noviLink.value.slika = podaci.thumbnail_url;
          if (podaci.title && !noviLink.value.naziv) {
            noviLink.value.naziv = podaci.title;
          }
        }
      } catch (greska) {
        console.log('Instagram API nedostupan, korisnik će unijeti naziv ručno');
      }
    }
    else if (noviLink.value.tip === 'tiktok') {
      try {
        const odgovor = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(noviLink.value.url)}`);
        if (odgovor.ok) {
          const podaci = await odgovor.json();
          noviLink.value.slika = podaci.thumbnail_url;
          noviLink.value.naziv = podaci.title || 'TikTok Video';
        } else {
          noviLink.value.naziv = 'TikTok Video';
        }
      } catch (greska) {
        noviLink.value.naziv = 'TikTok Video';
      }
    }
    else {
      const url = new URL(noviLink.value.url);
      noviLink.value.naziv = url.hostname;
    }
  } catch (greska) {
    console.error('Greška pri dohvaćanju podataka:', greska);
    try {
      const url = new URL(noviLink.value.url);
      noviLink.value.naziv = url.hostname;
    } catch {
      noviLink.value.naziv = 'Link';
    }
  }
};

const sakriSliku = (event) => {
  event.target.style.display = 'none';
};

const dohvatiInitijale = (tip) => {
  switch(tip) {
    case 'youtube-video': return 'YT';
    case 'instagram': return 'IG';
    case 'tiktok': return 'TT';
    default: return '?';
  }
};

const spremi = async () => {
  if (!noviLink.value.url || !noviLink.value.tip || ucitava.value) {
    return;
  }

  ucitava.value = true;

  try {
    const link = {
      url: noviLink.value.url,
      naziv: noviLink.value.naziv || 'Bez naziva',
      tip: noviLink.value.tip,
      slika: noviLink.value.slika,
      datum: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'linkovi'), link);
    
    const noviLinkLocal = {
      id: docRef.id,
      ...link,
      datum: new Date()
    };

    linkovi.value.unshift(noviLinkLocal);
    
    noviLink.value = {
      url: '',
      tip: '',
      naziv: '',
      slika: null
    };
  } catch (greska) {
    console.error('Greška pri spremanju:', greska);
    alert('Greška pri spremanju linka. Pokušajte ponovno.');
  } finally {
    ucitava.value = false;
  }
};

const otvori = (url) => {
  window.open(url, '_blank');
};

const urediNaziv = (link) => {
  uredba.value = link;
  noviNaziv.value = link.naziv;
  
  setTimeout(() => {
    const input = document.querySelector('.naziv-input-modal');
    if (input) input.focus();
  }, 100);
};

const spremiNaziv = async () => {
  if (!uredba.value || !noviNaziv.value.trim() || ucitava.value) {
    return;
  }

  ucitava.value = true;

  try {
    const linkRef = doc(db, 'linkovi', uredba.value.id);
    await updateDoc(linkRef, {
      naziv: noviNaziv.value.trim()
    });

    const index = linkovi.value.findIndex(l => l.id === uredba.value.id);
    if (index > -1) {
      linkovi.value[index].naziv = noviNaziv.value.trim();
    }

    uredba.value = null;
    noviNaziv.value = '';
  } catch (greska) {
    console.error('Greška pri ažuriranju:', greska);
    alert('Greška pri ažuriranju naziva. Pokušajte ponovno.');
  } finally {
    ucitava.value = false;
  }
};

const pripremiZaBrisanje = (link) => {
  brisanje.value = link;
};

const obrisi = async () => {
  if (!brisanje.value || ucitava.value) {
    return;
  }

  ucitava.value = true;

  try {
    await deleteDoc(doc(db, 'linkovi', brisanje.value.id));
    linkovi.value = linkovi.value.filter(link => link.id !== brisanje.value.id);
    brisanje.value = null;
  } catch (greska) {
    console.error('Greška pri brisanju:', greska);
    alert('Greška pri brisanju linka. Pokušajte ponovno.');
  } finally {
    ucitava.value = false;
  }
};

const skratiUrl = (url) => {
  if (url.length > 60) {
    return url.substring(0, 60) + '...';
  }
  return url;
};

const formatirajDatum = (datum) => {
  if (!datum) return '';
  const date = datum.toDate ? datum.toDate() : new Date(datum);
  return date.toLocaleDateString('hr-HR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const ucitajLinkove = async () => {
  ucitavaLinkove.value = true;
  
  try {
    const q = query(collection(db, 'linkovi'), orderBy('datum', 'desc'));
    const querySnapshot = await getDocs(q);
    
    linkovi.value = [];
    querySnapshot.forEach((doc) => {
      linkovi.value.push({
        id: doc.id,
        ...doc.data()
      });
    });
  } catch (greska) {
    console.error('Greška pri učitavanju linkova:', greska);
  } finally {
    ucitavaLinkove.value = false;
  }
};

onMounted(() => {
  ucitajLinkove();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');

.stranica {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
  font-family: 'Roboto', sans-serif;
  color: var(--text-body);
}

.sadrzaj {
  width: 100%;
}

.zaglavlje {
  margin-bottom: 30px;
}

.naslov {
  color: var(--text-heading);
  margin-bottom: 8px;
  font-weight: 700;
  font-size: 1.8rem;
}

.zaglavlje p {
  color: var(--text-muted);
  font-size: 1rem;
  margin: 0;
}

.pretraga-sekcija {
  margin-bottom: 30px;
}

.pretraga-input {
  width: 100%;
  padding: 15px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 16px;
  font-family: 'Roboto', sans-serif;
  background-color: var(--bg-card);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 2px 4px var(--shadow-color);
}

.pretraga-input:focus {
  outline: none;
  border-color: var(--text-heading);
  box-shadow: 0 0 0 3px rgba(18, 52, 88, 0.2);
}

.dodaj-sekcija {
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  padding: 30px;
  box-shadow: var(--glass-shadow);
  margin-bottom: 40px;
}

.forma {
  display: grid;
  grid-template-columns: 3fr 2fr auto;
  gap: 15px;
  align-items: end;
}

.naziv-unos {
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 16px;
  font-family: 'Roboto', sans-serif;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  background-color: var(--bg-card);
}

.naziv-unos:focus {
  outline: none;
  border-color: var(--text-heading);
  box-shadow: 0 0 0 3px rgba(18, 52, 88, 0.2);
}

.url-unos {
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 16px;
  font-family: 'Roboto', sans-serif;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  background-color: var(--bg-card);
}

.url-unos:focus {
  outline: none;
  border-color: var(--text-heading);
  box-shadow: 0 0 0 3px rgba(18, 52, 88, 0.2);
}

.gumb-spremi {
  padding: 10px 20px;
  background-color: var(--text-heading);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.gumb-spremi:hover:not(:disabled) {
  background-color: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.gumb-spremi:disabled {
  background-color: var(--bg-card-muted);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.lista {
  margin-bottom: 30px;
}

.ucitavanje {
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  padding: 60px 30px;
  text-align: center;
  box-shadow: var(--glass-shadow);
}

.prazno {
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  padding: 60px 30px;
  text-align: center;
  box-shadow: var(--glass-shadow);
}

.nema-rezultata {
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  padding: 60px 30px;
  text-align: center;
  box-shadow: var(--glass-shadow);
}

.poruka p {
  color: var(--text-muted);
  font-size: 1.1rem;
  margin: 0;
}

.redovi {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.red {
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  padding: 20px;
  box-shadow: var(--glass-shadow);
  transition: all 0.3s ease;
  cursor: pointer;
  border-left: 4px solid var(--border-color);
  width: 100%;
}

.red:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px var(--shadow-color);
}

.red.tip-youtube-video { border-left-color: var(--text-heading); }
.red.tip-instagram { border-left-color: #e4405f; }
.red.tip-tiktok { border-left-color: #000000; }
.red.tip-ostalo { border-left-color: var(--border-color); }

.sadrzaj-reda {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
}

.slika {
  flex-shrink: 0;
  width: 120px;
  height: 90px;
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--bg-page);
  display: flex;
  align-items: center;
  justify-content: center;
}

.slika img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.zamjena {
  width: 100%;
  height: 100%;
  background-color: var(--bg-card-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-heading);
  font-weight: bold;
  font-size: 18px;
}

.informacije {
  flex: 1;
  min-width: 0;
}

.vrh {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  gap: 15px;
}

.oznaka {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: white;
  flex-shrink: 0;
}

.oznaka-youtube-video { background-color: var(--text-heading); }
.oznaka-instagram { background-color: #e4405f; }
.oznaka-tiktok { background-color: #000000; }
.oznaka-ostalo { background-color: var(--bg-card-muted); color: var(--text-heading); }

.datum {
  color: var(--text-body);
  font-size: 12px;
  opacity: 0.7;
  flex-shrink: 0;
}

.naziv {
  color: var(--text-heading);
  font-weight: 600;
  font-size: 1.1rem;
  margin: 0 0 8px 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  cursor: pointer;
  transition: color 0.2s ease;
}

.naziv:hover {
  color: var(--accent-hover);
}

.url {
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 400;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.akcije {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.gumb-uredi {
  width: 32px;
  height: 32px;
  background-color: var(--text-heading);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gumb-uredi:hover {
  background-color: var(--accent-hover);
  transform: scale(1.1);
}

.gumb-brisi {
  width: 32px;
  height: 32px;
  background-color: var(--danger);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.gumb-brisi:hover {
  background-color: var(--danger-hover);
  transform: scale(1.1);
}

.pozadina {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(3, 3, 3, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  padding: 0;
  width: 400px;
  max-width: 90%;
  box-shadow: var(--glass-shadow);
  overflow: hidden;
}

.modal-zaglavlje {
  background-color: var(--text-heading);
  color: white;
  padding: 16px 24px;
  text-align: center;
}

.modal-zaglavlje h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
}

.modal-sadrzaj {
  padding: 24px;
  text-align: center;
}

.modal-sadrzaj .upozorenje {
  font-size: 48px;
  color: var(--danger);
  margin-bottom: 16px;
  display: block;
}

.modal-sadrzaj p {
  margin: 0 0 24px 0;
  font-size: 18px;
  color: var(--text-body);
}

.naziv-input-modal {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 16px;
  font-family: 'Roboto', sans-serif;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  background-color: var(--bg-card);
}

.naziv-input-modal:focus {
  outline: none;
  border-color: var(--text-heading);
  box-shadow: 0 0 0 3px rgba(18, 52, 88, 0.2);
}

.modal-gumbovi {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 0 24px 24px;
}

.gumb-odustani, .gumb-potvrdi {
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;
  font-size: 16px;
}

.gumb-odustani {
  background-color: var(--bg-card-muted);
  color: var(--text-heading);
}

.gumb-odustani:hover {
  background-color: var(--border-color);
}

.gumb-potvrdi {
  background-color: var(--text-heading);
  color: white;
}

.gumb-potvrdi:hover:not(:disabled) {
  background-color: var(--accent-hover);
}

.gumb-potvrdi:disabled {
  background-color: var(--bg-card-muted);
  cursor: not-allowed;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .stranica {
    padding: 20px;
  }

  .naslov {
    font-size: 2rem;
  }

  .forma {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .dodaj-sekcija {
    padding: 20px;
  }

  .sadrzaj-reda {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .slika {
    width: 200px;
    height: 150px;
  }

  .vrh {
    justify-content: center;
    flex-wrap: wrap;
  }

  .akcije {
    align-self: center;
  }
}

@media (max-width: 480px) {
  .stranica {
    padding: 15px;
  }

  .naslov {
    font-size: 1.8rem;
  }

  .dodaj-sekcija {
    padding: 20px;
  }

  .red {
    padding: 15px;
  }

  .naziv {
    font-size: 1rem;
  }

  .slika {
    width: 150px;
    height: 112px;
  }

  .modal {
    width: 95%;
  }

  .modal-gumbovi {
    flex-direction: column;
    gap: 10px;
  }

  .gumb-odustani, .gumb-potvrdi {
    width: 100%;
  }
} </style>
