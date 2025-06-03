<template>
  <div class="stranica">
    <div class="sadrzaj">
      <div class="zaglavlje">
        <h1 class="naslov">Kreativna zona</h1>
      </div>

      <div class="dodaj-sekcija">
        <div class="forma">
          <div class="unos-grupa">
            <input 
              v-model="novaIdeja.naslov"
              type="text" 
              placeholder="Naslov ideje..."
              class="naslov-unos"
              @keyup.enter="fokusNaSadrzaj"
            />
            
            <textarea 
              v-model="novaIdeja.sadrzaj"
              placeholder="Opišite svoju kreativnu ideju ovdje..."
              class="sadrzaj-textarea"
              rows="4"
              ref="sadrzajTextarea"
            ></textarea>
          </div>

          <div class="gumbovi">
            <input 
              type="file"
              accept=".txt"
              @change="ucitajFajl"
              ref="fileInput"
              class="file-input"
            />
            <button @click="otvoriFileDialog" class="gumb-file">
              Učitaj TXT
            </button>
            <button @click="spremi" class="gumb-spremi" :disabled="!mozeSpremi">
              Spremi ideju
            </button>
          </div>
        </div>
      </div>

      <div class="lista">
        <div v-if="ideje.length === 0" class="prazno">
          <div class="poruka">
            
            <p>Nema kreativnih ideja</p>
            <small>Dodajte svoju prvu ideju ili učitajte TXT fajl</small>
          </div>
        </div>

        <div v-else class="redovi">
          <div 
            v-for="ideja in ideje" 
            :key="ideja.id"
            class="red"
            :class="{ 'realizovana': ideja.realizovana }"
          >
            <div class="sadrzaj-reda">
              <div class="oznake">
                <div class="datum">{{ formatirajDatum(ideja.datum) }}</div>
              </div>

              <div class="sadrzaj-ideje" @click="otvoriLightbox(ideja)">
                <h3 class="naslov-ideje">
                  {{ ideja.naslov }}
                </h3>
                
                <div class="kratki-pregled">
                  {{ skratiTekst(ideja.sadrzaj, 150) }}
                </div>
              </div>

              <div class="akcije">
                <button 
                  @click="toggleRealizovana(ideja)" 
                  class="gumb-realizovana" 
                  :class="{ 'aktivna': ideja.realizovana }"
                  :title="ideja.realizovana ? 'Označi kao nerealizovana' : 'Označi kao realizovana'"
                >
                  {{ ideja.realizovana ? '✅' : '⭕' }}
                </button>
                <button @click="urediIdeju(ideja)" class="gumb-uredi" title="Uredi ideju">
                  ✏️
                </button>
                <button @click="eksportirajIdeju(ideja)" class="gumb-eksport" title="Eksportiraj u TXT">
                  💾
                </button>
                <button @click="pripremiZaBrisanje(ideja)" class="gumb-brisi">
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div class="lightbox-pozadina" v-if="lightboxIdeja !== null" @click="zatвориLightbox">
        <div class="lightbox-modal" @click.stop>
          <div class="lightbox-zaglavlje">
            <h2>{{ lightboxIdeja.naslov }}</h2>
            <button @click="zatвориLightbox" class="lightbox-zatvori">×</button>
          </div>
          <div class="lightbox-sadrzaj">
            <div class="lightbox-meta">
              <div class="meta-item">
                <strong>Kreirana:</strong> {{ formatirajDatumVrijeme(lightboxIdeja.datum) }}
              </div>
              <div v-if="lightboxIdeja.realizovana" class="meta-item">
                <strong>Realizovana:</strong> {{ formatirajDatumVrijeme(lightboxIdeja.datumRealizacije) }}
              </div>
            </div>
            <div class="lightbox-tekst">
              {{ lightboxIdeja.sadrzaj }}
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div class="pozadina" v-if="uredba !== null" @click="uredba = null">
        <div class="modal" @click.stop>
          <div class="modal-zaglavlje">
            <h2>Uredi ideju</h2>
          </div>
          <div class="modal-sadrzaj">
            <input 
              v-model="uredivanaNaslov"
              type="text" 
              placeholder="Naslov ideje..."
              class="naslov-input-modal"
            />
            <textarea 
              v-model="uredivaniSadrzaj"
              placeholder="Sadržaj ideje..."
              class="sadrzaj-textarea-modal"
              rows="6"
            ></textarea>
          </div>
          <div class="modal-gumbovi">
            <button class="gumb-odustani" @click="uredba = null">Odustani</button>
            <button class="gumb-potvrdi" @click="spremiUredbe">Spremi</button>
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
            <p>Jeste li sigurni da želite obrisati ovu ideju?</p>
            <strong>"{{ brisanje?.naslov }}"</strong>
          </div>
          <div class="modal-gumbovi">
            <button class="gumb-odustani" @click="brisanje = null">Odustani</button>
            <button class="gumb-potvrdi" @click="obrisi">Potvrdi</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const ideje = ref([]);
const brisanje = ref(null);
const uredba = ref(null);
const prosirenaIdeja = ref(null);
const lightboxIdeja = ref(null);
const fileInput = ref(null);
const sadrzajTextarea = ref(null);

const novaIdeja = ref({
  naslov: '',
  sadrzaj: ''
});

const uredivanaNaslov = ref('');
const uredivaniSadrzaj = ref('');

const kategorije = {
  'youtube': 'YouTube Video',
  'instagram': 'Instagram Post',
  'tiktok': 'TikTok Video',
  'podcast': 'Podcast',
  'blog': 'Blog post',
  'ostalo': 'Ostalo'
};


const filteredIdeje = computed(() => {
  return ideje.value;
});

const mozeSpremi = computed(() => {
  return novaIdeja.value.naslov.trim() && novaIdeja.value.sadrzaj.trim();
});

const fokusNaSadrzaj = () => {
  if (sadrzajTextarea.value) {
    sadrzajTextarea.value.focus();
  }
};

const otvoriFileDialog = () => {
  fileInput.value.click();
};

const ucitajFajl = (event) => {
  const file = event.target.files[0];
  if (file && file.type === 'text/plain') {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      novaIdeja.value.sadrzaj = content.trim();
    };
    reader.readAsText(file);
  }
  event.target.value = '';
};

const spremi = () => {
  if (!mozeSpremi.value) return;

  const ideja = {
    id: Date.now(),
    naslov: novaIdeja.value.naslov.trim(),
    sadrzaj: novaIdeja.value.sadrzaj.trim(),
    realizovana: false,
    datum: new Date(),
    datumRealizacije: null
  };

  ideje.value.unshift(ideja);
  spremiUMemoriju();
  
  novaIdeja.value = {
    naslov: '',
    sadrzaj: ''
  };
};

const otvoriLightbox = (ideja) => {
  lightboxIdeja.value = ideja;
};

const zatвориLightbox = () => {
  lightboxIdeja.value = null;
};

const toggleProsireno = (id) => {
  prosirenaIdeja.value = prosirenaIdeja.value === id ? null : id;
};

const toggleRealizovana = (ideja) => {
  const index = ideje.value.findIndex(i => i.id === ideja.id);
  if (index > -1) {
    ideje.value[index].realizovana = !ideje.value[index].realizovana;
    ideje.value[index].datumRealizacije = ideje.value[index].realizovana ? new Date() : null;
    spremiUMemoriju();
  }
};

const urediIdeju = (ideja) => {
  uredba.value = ideja;
  uredivanaNaslov.value = ideja.naslov;
  uredivaniSadrzaj.value = ideja.sadrzaj;
};

const spremiUredbe = () => {
  if (uredba.value && uredivanaNaslov.value.trim() && uredivaniSadrzaj.value.trim()) {
    const index = ideje.value.findIndex(i => i.id === uredba.value.id);
    if (index > -1) {
      ideje.value[index].naslov = uredivanaNaslov.value.trim();
      ideje.value[index].sadrzaj = uredivaniSadrzaj.value.trim();
      spremiUMemoriju();
    }
  }
  uredba.value = null;
};

const eksportirajIdeju = (ideja) => {
  const content = `${ideja.naslov}\n\n${ideja.sadrzaj}`;
  
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${ideja.naslov.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

const pripremiZaBrisanje = (ideja) => {
  brisanje.value = ideja;
};

const obrisi = () => {
  if (brisanje.value) {
    ideje.value = ideje.value.filter(ideja => ideja.id !== brisanje.value.id);
    spremiUMemoriju();
    brisanje.value = null;
  }
};

const skratiTekst = (tekst, maxDuzina) => {
  if (tekst.length <= maxDuzina) return tekst;
  return tekst.substring(0, maxDuzina) + '...';
};

const formatirajDatum = (datum) => {
  return new Date(datum).toLocaleDateString('hr-HR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatirajDatumVrijeme = (datum) => {
  return new Date(datum).toLocaleString('hr-HR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const spremiUMemoriju = () => {
  try {
    localStorage.setItem('kreativne_ideje', JSON.stringify(ideje.value));
  } catch (greska) {
    console.error('Greška pri spremanju:', greska);
  }
};

const ucitajIzMemorije = () => {
  try {
    const spremljeno = localStorage.getItem('kreativne_ideje');
    if (spremljeno) {
      ideje.value = JSON.parse(spremljeno).map(ideja => ({
        ...ideja,
        datum: new Date(ideja.datum),
        datumRealizacije: ideja.datumRealizacije ? new Date(ideja.datumRealizacije) : null
      }));
    }
  } catch (greska) {
    console.error('Greška pri učitavanju:', greska);
  }
};

onMounted(() => {
  ucitajIzMemorije();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');

.stranica {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
  font-family: 'Roboto', sans-serif;
  color: #030303;
  background-color: #F1EFEC;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.sadrzaj {
  width: 100%;
}

.zaglavlje {
  text-align: center;
  margin-bottom: 40px;
}

.naslov {
  text-align: center;
  color: #123458;
  margin-bottom: 10px;
  font-weight: 700;
  font-size: 2.5rem;
  position: relative;
}

.naslov::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 3px;
  background-color: #123458;
  border-radius: 2px;
}

.zaglavlje p {
  color: #5D8AA8;
  font-size: 1.1rem;
  margin: 0;
}

.pretraga-sekcija {
  display: none;
}

.dodaj-sekcija {
  background-color: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.forma {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.unos-grupa {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.naslov-unos {
  padding: 12px;
  border: 1px solid #D4C9BE;
  border-radius: 6px;
  font-size: 16px;
  font-family: 'Roboto', sans-serif;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  background-color: white;
}

.naslov-unos:focus {
  outline: none;
  border-color: #123458;
  box-shadow: 0 0 0 3px rgba(18, 52, 88, 0.2);
}

.sadrzaj-textarea {
  padding: 12px;
  border: 1px solid #D4C9BE;
  border-radius: 6px;
  font-size: 16px;
  font-family: 'Roboto', sans-serif;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  background-color: white;
  resize: vertical;
  min-height: 100px;
}

.sadrzaj-textarea:focus {
  outline: none;
  border-color: #123458;
  box-shadow: 0 0 0 3px rgba(18, 52, 88, 0.2);
}

.kategorija-tip {
  display: none;
}

.kategorija-select,
.prioritet-select {
  display: none;
}

.gumbovi {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: stretch;
}

.file-input {
  display: none;
}

.gumb-file,
.gumb-spremi {
  padding: 12px 20px;
  border-radius: 6px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  white-space: nowrap;
  text-align: center;
}

.gumb-file {
  background-color: #5D8AA8;
  color: white;
}

.gumb-file:hover {
  background-color: #4a7591;
  transform: translateY(-1px);
}

.gumb-spremi {
  background-color: #123458;
  color: #F1EFEC;
}

.gumb-spremi:hover:not(:disabled) {
  background-color: #1c4c80;
  transform: translateY(-1px);
}

.gumb-spremi:disabled {
  background-color: #D4C9BE;
  cursor: not-allowed;
  transform: none;
}

.statistike {
  display: none;
}

.lista {
  margin-bottom: 30px;
}

.prazno,
.nema-rezultata {
  background-color: white;
  border-radius: 12px;
  padding: 60px 30px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.ikona {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.6;
}

.poruka p {
  color: #5D8AA8;
  font-size: 1.1rem;
  margin: 0 0 10px 0;
}

.poruka small {
  color: #5D8AA8;
  opacity: 0.8;
  font-size: 0.9rem;
}

.redovi {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.red {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border-left: 4px solid #123458;
}

.red:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.red.realizovana {
  opacity: 0.7;
  background-color: #f8f9fa;
}

.sadrzaj-reda {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.oznake {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 15px;
}

.datum {
  color: #030303;
  font-size: 12px;
  opacity: 0.7;
}

.sadrzaj-ideje {
  flex: 1;
  cursor: pointer;
}

.naslov-ideje {
  color: #123458;
  font-weight: 600;
  font-size: 1.2rem;
  margin: 0 0 10px 0;
  cursor: pointer;
  transition: color 0.2s ease;
}

.naslov-ideje:hover {
  color: #1c4c80;
}

.kratki-pregled {
  color: #5D8AA8;
  font-size: 0.95rem;
  line-height: 1.5;
}

.lightbox-pozadina {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(3, 3, 3, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 20px;
}

.lightbox-modal {
  background-color: #F1EFEC;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.lightbox-zaglavlje {
  background-color: #123458;
  color: #F1EFEC;
  padding: 20px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.lightbox-zaglavlje h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  flex: 1;
  padding-right: 20px;
}

.lightbox-zatvori {
  background: none;
  border: none;
  color: #F1EFEC;
  font-size: 2rem;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.lightbox-zatvori:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.lightbox-sadrzaj {
  padding: 30px;
  overflow-y: auto;
  flex: 1;
}

.lightbox-meta {
  background-color: white;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #D4C9BE;
}

.lightbox-tekst {
  background-color: white;
  padding: 25px;
  border-radius: 8px;
  font-size: 1.1rem;
  line-height: 1.7;
  color: #030303;
  white-space: pre-wrap;
  border: 1px solid #D4C9BE;
  min-height: 200px;
}

.meta-item {
  margin-bottom: 8px;
  color: #5D8AA8;
  font-size: 0.9rem;
}

.akcije {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.gumb-realizovana,
.gumb-uredi,
.gumb-eksport,
.gumb-brisi {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gumb-realizovana {
  background-color: white;
  color: #123458;
  border: 1px solid #123458;
}

.gumb-realizovana.aktivna {
  background-color: #28a745;
  border-color: #28a745;
  color: white;
}

.gumb-realizovana:hover {
  background-color: #123458;
  color: white;
}

.gumb-realizovana.aktivna:hover {
  background-color: #218838;
}

.gumb-uredi {
  background-color: #123458;
  color: white;
}

.gumb-uredi:hover {
  background-color: #1c4c80;
  transform: scale(1.1);
}

.gumb-eksport {
  background-color: #5D8AA8;
  color: white;
  padding: 8px;
}

.gumb-eksport:hover {
  background-color: #4a7591;
  transform: scale(1.1);
}

.download-ikona {
  width: 16px;
  height: 16px;
  filter: brightness(0) invert(1);
}

.gumb-brisi {
  background-color: #E53935;
  color: white;
  font-size: 18px;
  font-weight: bold;
  line-height: 1;
}

.gumb-brisi:hover {
  background-color: #C62828;
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
  background-color: #F1EFEC;
  border-radius: 12px;
  padding: 0;
  width: 500px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-zaglavlje {
  background-color: #123458;
  color: #F1EFEC;
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
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.modal-sadrzaj .upozorenje {
  font-size: 48px;
  color: #E53935;
  margin-bottom: 16px;
  display: block;
  text-align: center;
}

.modal-sadrzaj p {
  margin: 0;
  font-size: 18px;
  color: #030303;
  text-align: center;
}

.modal-sadrzaj strong {
  display: block;
  margin-top: 10px;
  color: #123458;
  text-align: center;
}

.naslov-input-modal {
  width: 100%;
  padding: 12px;
  border: 1px solid #D4C9BE;
  border-radius: 6px;
  font-size: 16px;
  font-family: 'Roboto', sans-serif;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  background-color: white;
}

.naslov-input-modal:focus {
  outline: none;
  border-color: #123458;
  box-shadow: 0 0 0 3px rgba(18, 52, 88, 0.2);
}

.sadrzaj-textarea-modal {
  width: 100%;
  padding: 12px;
  border: 1px solid #D4C9BE;
  border-radius: 6px;
  font-size: 16px;
  font-family: 'Roboto', sans-serif;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  background-color: white;
  resize: vertical;
  min-height: 120px;
}

.sadrzaj-textarea-modal:focus {
  outline: none;
  border-color: #123458;
  box-shadow: 0 0 0 3px rgba(18, 52, 88, 0.2);
}

.modal-selekti {
  display: none;
}

.modal-gumbovi {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 0 24px 24px;
}

.gumb-odustani,
.gumb-potvrdi {
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;
  font-size: 16px;
}

.gumb-odustani {
  background-color: #D4C9BE;
  color: #123458;
}

.gumb-odustani:hover {
  background-color: #c5b7a9;
}

.gumb-potvrdi {
  background-color: #E53935;
  color: #F1EFEC;
}

.gumb-potvrdi:hover {
  background-color: #C62828;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
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
    flex-direction: column;
    gap: 20px;
  }

  .gumbovi {
    flex-direction: row;
    justify-content: stretch;
  }

  .gumb-file,
  .gumb-spremi {
    flex: 1;
  }

  .statistike {
    display: none;
  }

  .oznake {
    align-items: flex-start;
    gap: 8px;
  }

  .akcije {
    justify-content: center;
    margin-top: 15px;
  }

  .kategorija-tip {
    display: none;
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

  .modal {
    width: 95%;
  }

  .modal-gumbovi {
    flex-direction: column;
    gap: 10px;
  }

  .gumb-odustani,
  .gumb-potvrdi {
    width: 100%;
  }

  .statistike {
    display: none;
  }

  .lightbox-modal {
    width: 95%;
    height: 90vh;
  }

  .lightbox-zaglavlje {
    padding: 15px 20px;
  }

  .lightbox-zaglavlje h2 {
    font-size: 1.2rem;
  }

  .lightbox-sadrzaj {
    padding: 20px;
  }

  .lightbox-tekst {
    padding: 20px;
    font-size: 1rem;
  }
} </style>