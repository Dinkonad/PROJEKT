<template>
  <div class="upload-container">
    <div class="page-header">
      <h2 class="naslov">Galerija fotografija</h2>
    </div>
    
    <div class="glavni-sadrzaj">
      <div class="galerija-wrapper">
        <div class="uploadane-datoteke" v-if="filteredMediji.length > 0">
          <div class="datoteke-grid">
            <div 
              v-for="(medij, index) in filteredMediji" 
              :key="medij.id || index" 
              class="medij-item"
            >
              <!-- Delete button overlay -->
              <div class="delete-overlay">
                <button @click.stop="potvrdiZaBrisanje(medij)" class="overlay-delete-btn" title="Obriši sliku">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>

              <div class="medij-preview" @click="otvoriLightbox(medij)">
                <template v-if="medij.fileCategory === 'image'">
                  <img 
                    :src="medij.publicUrl" 
                    :alt="medij.fileName" 
                    @error="onImageError"
                  />
                </template>
                <template v-else-if="medij.fileCategory === 'video'">
                  <video 
                    :src="medij.publicUrl" 
                    @error="onVideoError"
                  ></video>
                </template>
                <div v-else class="placeholder-preview">
                  <span>{{ medij.fileCategory || 'Nepoznati tip' }}</span>
                </div>
              </div>
              <div class="medij-info">
                <p class="medij-ime">{{ skratiNaziv(medij.fileName, 25) }}</p>
                <div class="medij-detalji">
                  <span class="medij-korisnik">{{ medij.userEmail }}</span>
                  <span class="medij-datum">{{ formatDatum(medij.uploadedAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="!uploadUTijeku" class="prazno-stanje">
          <p v-if="odabraniEmail">Nema uploadanih medija za {{ odabraniEmail }}</p>
          <p v-else>Nema uploadanih medija</p>
          <p class="prazno-podnaslov">Koristite panel sa strane za upload</p>
        </div>
      </div>
      
      <div class="upload-panel">
        <h3 class="panel-naslov">Dodaj nove slike</h3>
        
        <div class="form-group">
          <label for="korisnik-dropdown">Korisnik:</label>
          <div class="custom-dropdown">
            <div class="dropdown-selected" @click="toggleDropdown">
              {{ odabraniEmail || 'Odaberite korisnika' }}
              <span class="dropdown-arrow">▼</span>
            </div>
            <div class="dropdown-menu" v-if="prikaziDropdown">
              <div 
                v-for="korisnik in korisnici" 
                :key="korisnik.id" 
                class="dropdown-item"
                @click="odaberiEmail(korisnik.email)"
                :class="{ 'active': odabraniEmail === korisnik.email }"
              >
                {{ korisnik.email }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="filter-controls">
          <button 
            class="btn-filter" 
            @click="toggleFilter"
            :class="{ 'active': prikaziSamoOdabranog }"
          >
            {{ prikaziSamoOdabranog ? 'Prikaži sve' : 'Prikaži samo odabranog' }}
          </button>
          <button 
            class="btn-delete-all" 
            @click="potvrdiZaBrisanjeSvihKorisnika"
            :disabled="!odabraniEmail || filteredMediji.length === 0"
            v-if="prikaziSamoOdabranog && odabraniEmail"
          >
            Obriši sve od {{ odabraniEmail }}
          </button>
        </div>
        
        <div 
          class="upload-zona" 
          @click="pokreniUpload" 
          @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop"
          :class="{ 'drag-over': isDragOver, 'has-files': odabraneDatoteke.length > 0 }"
        >
          <input 
            type="file" 
            ref="fileInput" 
            style="display: none" 
            @change="handleFileChange" 
            accept="image/*,video/*"
            multiple
            webkitdirectory
          />
          
          <div v-if="odabraneDatoteke.length === 0" class="upload-poruka">
            <div class="upload-ikona">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <p class="glavni-tekst">Povucite mapu ili kliknite za odabir</p>
            <p class="upload-napomena">Podržava mape sa slikama (JPG, PNG, GIF) i videima (MP4, MOV)</p>
          </div>
          
          <div v-else class="odabrane-datoteke">
            <div class="datoteke-header">
              <h4>Odabrane datoteke ({{ odabraneDatoteke.length }})</h4>
              <button class="btn-ukloni-sve" @click.stop="ukloniSveDatoteke" title="Ukloni sve">
                ✕ Ukloni sve
              </button>
            </div>
            <div class="datoteke-lista">
              <div 
                v-for="(datoteka, index) in odabraneDatoteke.slice(0, 5)" 
                :key="index"
                class="datoteka-item"
              >
                <div class="datoteka-preview">
                  <img 
                    v-if="datoteka.tip === 'image'" 
                    :src="datoteka.previewUrl" 
                    alt="Preview" 
                  />
                  <div v-else-if="datoteka.tip === 'video'" class="video-placeholder">
                    🎬
                  </div>
                </div>
                <div class="datoteka-info">
                  <span class="datoteka-ime">{{ skratiNaziv(datoteka.file.name, 20) }}</span>
                  <span class="datoteka-velicina">{{ formatirajVelicinuDatoteke(datoteka.file.size) }}</span>
                </div>
              </div>
              <div v-if="odabraneDatoteke.length > 5" class="vise-datoteka">
                + {{ odabraneDatoteke.length - 5 }} više datoteka...
              </div>
            </div>
            <div class="ukupna-velicina">
              Ukupna veličina: {{ formatirajVelicinuDatoteke(ukupnaVelicina) }}
            </div>
          </div>
        </div>
        
        <div class="upload-actions">
          <button 
            class="btn-upload" 
            @click="uploadSveDatoteke" 
            :disabled="odabraneDatoteke.length === 0 || !odabraniEmail || uploadUTijeku"
          >
            {{ uploadUTijeku ? `Upload ${trenutniUpload}/${odabraneDatoteke.length}` : `Upload ${odabraneDatoteke.length} datoteka` }}
          </button>
          <div v-if="uploadUTijeku" class="progress-container">
            <div class="progress-bar">
              <div class="progress" :style="{ width: `${ukupniProgress}%` }"></div>
            </div>
            <div class="progress-text">
              {{ trenutniUpload }}/{{ odabraneDatoteke.length }} - {{ Math.round(ukupniProgress) }}%
            </div>
          </div>
        </div>
        
        <div v-if="statusPoruka" class="status-poruka" :class="{ 'success': !jeLiGreska, 'error': jeLiGreska }">
          {{ statusPoruka }}
        </div>
      </div>
    </div>
    
    <!-- Lightbox -->
    <div class="lightbox" v-if="aktivniMedij" @click="zatvoriLightbox">
      <div class="lightbox-content" @click.stop>
        <button class="lightbox-close" @click="zatvoriLightbox">✕</button>
        <div class="lightbox-media">
          <img v-if="aktivniMedij.fileCategory === 'image'" :src="aktivniMedij.publicUrl" alt="Preview u punoj veličini" />
          <video v-else-if="aktivniMedij.fileCategory === 'video'" :src="aktivniMedij.publicUrl" controls autoplay></video>
        </div>
      </div>
    </div>
    
    <!-- Modal za brisanje -->
    <div class="modal-backdrop" v-if="zaBrisanjeMedij" @click="zaBrisanjeMedij = null">
      <div class="modal-potvrda" @click.stop>
        <h4>Potvrda brisanja</h4>
        <p>Jeste li sigurni da želite trajno obrisati ovu datoteku?</p>
        <p class="file-to-delete">{{ zaBrisanjeMedij ? zaBrisanjeMedij.fileName : '' }}</p>
        <div class="modal-actions">
          <button class="btn-odustani" @click="zaBrisanjeMedij = null">Odustani</button>
          <button class="btn-potvrdi" @click="obrisiPojedinacnuDatoteku" :disabled="brisanjeUTijeku">
            {{ brisanjeUTijeku ? 'Brišem...' : 'Obriši' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal za brisanje svih slika korisnika -->
    <div class="modal-backdrop" v-if="zaBrisanjeSviKorisnik" @click="zaBrisanjeSviKorisnik = null">
      <div class="modal-potvrda" @click.stop>
        <h4>Potvrda brisanja svih slika</h4>
        <p>Jeste li sigurni da želite trajno obrisati SVE slike korisnika?</p>
        <p class="user-to-delete">{{ zaBrisanjeSviKorisnik }}</p>
        <p class="files-count">Ukupno {{ filteredMediji.length }} datoteka će biti obrisano!</p>
        <div class="modal-actions">
          <button class="btn-odustani" @click="zaBrisanjeSviKorisnik = null">Odustani</button>
          <button class="btn-potvrdi" @click="obrisiSveKorisnika" :disabled="brisanjeUTijeku">
            {{ brisanjeUTijeku ? 'Brišem...' : 'Obriši sve' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { supabase } from '../services/supabase';
import { db } from '../services/firebase';
import { 
  collection, 
  onSnapshot,
  doc,
  serverTimestamp,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  deleteDoc
} from 'firebase/firestore';

// Refs
const korisnici = ref([]);
const odabraniEmail = ref(localStorage.getItem('odabraniKorisnik') || null);
const prikaziDropdown = ref(false);
const fileInput = ref(null);
const uploadUTijeku = ref(false);
const statusPoruka = ref('');
const jeLiGreska = ref(false);
const uploadaniMediji = ref([]);
const aktivniMedij = ref(null);
const zaBrisanjeMedij = ref(null);
const zaBrisanjeSviKorisnik = ref(null);
const brisanjeUTijeku = ref(false);
const prikaziSamoOdabranog = ref(localStorage.getItem('prikaziSamoOdabranog') === 'true');
const odabraneDatoteke = ref([]);
const isDragOver = ref(false);
const trenutniUpload = ref(0);
const ukupniProgress = ref(0);

let unsubscribe = null;
let unsubscribeUploads = null;

// Computed properties
const filteredMediji = computed(() => {
  if (!prikaziSamoOdabranog.value || !odabraniEmail.value) {
    return uploadaniMediji.value;
  }
  
  return uploadaniMediji.value.filter(medij => 
    medij.userEmail === odabraniEmail.value
  );
});

const ukupnaVelicina = computed(() => {
  return odabraneDatoteke.value.reduce((total, datoteka) => total + datoteka.file.size, 0);
});

// Drag & Drop handlers
const handleDragOver = (event) => {
  event.preventDefault();
  isDragOver.value = true;
};

const handleDragLeave = (event) => {
  event.preventDefault();
  isDragOver.value = false;
};

const handleDrop = async (event) => {
  event.preventDefault();
  isDragOver.value = false;
  
  const items = event.dataTransfer.items;
  const files = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if (item.kind === 'file') {
      const entry = item.webkitGetAsEntry();
      
      if (entry) {
        if (entry.isDirectory) {
          const folderFiles = await readFolderRecursively(entry);
          files.push(...folderFiles);
        } else if (entry.isFile) {
          const file = item.getAsFile();
          if (isValidFile(file)) {
            files.push(file);
          }
        }
      }
    }
  }
  
  if (files.length > 0) {
    await procesDatoteke(files);
  } else {
    statusPoruka.value = 'Nisu pronađene validne slike ili videi u povučenoj mapi';
    jeLiGreska.value = true;
  }
};

const readFolderRecursively = async (entry) => {
  const files = [];
  
  if (entry.isFile) {
    return new Promise((resolve) => {
      entry.file((file) => {
        if (isValidFile(file)) {
          resolve([file]);
        } else {
          resolve([]);
        }
      });
    });
  } else if (entry.isDirectory) {
    const reader = entry.createReader();
    
    return new Promise((resolve) => {
      reader.readEntries(async (entries) => {
        for (const childEntry of entries) {
          const childFiles = await readFolderRecursively(childEntry);
          files.push(...childFiles);
        }
        resolve(files);
      });
    });
  }
  
  return files;
};

const isValidFile = (file) => {
  const validTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/mov', 'video/avi', 'video/webm'
  ];
  return validTypes.includes(file.type);
};

const procesDatoteke = async (files) => {
  const noveDatoteke = [];
  
  for (const file of files) {
    if (isValidFile(file)) {
      const tip = file.type.startsWith('image/') ? 'image' : 'video';
      let previewUrl = null;
      
      if (tip === 'image') {
        previewUrl = URL.createObjectURL(file);
      }
      
      noveDatoteke.push({
        file,
        tip,
        previewUrl
      });
    }
  }
  
  odabraneDatoteke.value = [...odabraneDatoteke.value, ...noveDatoteke];
  resetirajStatus();
  
  if (noveDatoteke.length > 0) {
    statusPoruka.value = `Dodano ${noveDatoteke.length} datoteka za upload`;
    jeLiGreska.value = false;
  }
};

const handleFileChange = async (event) => {
  const files = Array.from(event.target.files);
  await procesDatoteke(files);
};

const pokreniUpload = () => {
  if (odabraneDatoteke.value.length === 0) {
    fileInput.value.click();
  }
};

const ukloniSveDatoteke = () => {
  odabraneDatoteke.value.forEach(datoteka => {
    if (datoteka.previewUrl) {
      URL.revokeObjectURL(datoteka.previewUrl);
    }
  });
  
  odabraneDatoteke.value = [];
  resetirajStatus();
};

const uploadSveDatoteke = async () => {
  if (odabraneDatoteke.value.length === 0 || !odabraniEmail.value) {
    statusPoruka.value = 'Molimo odaberite datoteke i korisnika';
    jeLiGreska.value = true;
    return;
  }
  
  try {
    uploadUTijeku.value = true;
    trenutniUpload.value = 0;
    ukupniProgress.value = 0;
    statusPoruka.value = 'Upload u tijeku...';
    jeLiGreska.value = false;
    
    const ukupnoDatoteka = odabraneDatoteke.value.length;
    
    for (let i = 0; i < ukupnoDatoteka; i++) {
      const datoteka = odabraneDatoteke.value[i];
      trenutniUpload.value = i + 1;
      
      try {
        await uploadPojedinacnuDatoteku(datoteka);
        ukupniProgress.value = ((i + 1) / ukupnoDatoteka) * 100;
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Greška pri uploadu datoteke ${datoteka.file.name}:`, error);
      }
    }
    
    statusPoruka.value = `Uspješno uploadano ${ukupnoDatoteka} datoteka!`;
    jeLiGreska.value = false;
    
    setTimeout(() => {
      ukloniSveDatoteke();
    }, 2000);
    
  } catch (error) {
    console.error('Greška pri uploadu:', error);
    statusPoruka.value = `Greška pri uploadu: ${error.message}`;
    jeLiGreska.value = true;
  } finally {
    uploadUTijeku.value = false;
    trenutniUpload.value = 0;
    ukupniProgress.value = 0;
  }
};

const uploadPojedinacnuDatoteku = async (datoteka) => {
  const file = datoteka.file;
  const tip = datoteka.tip;
  
  const datumVrijeme = new Date().toISOString().replace(/[:.]/g, '-');
  const korisnikDio = odabraniEmail.value.replace('@', '_at_');
  const tipBucketDio = tip === 'image' ? 'images' : 'video';
  const datotekaNaziv = `${datumVrijeme}_${file.name.replace(/\s+/g, '_')}`;
  const putanja = `${korisnikDio}/${datotekaNaziv}`;
  
  const { data, error } = await supabase.storage
    .from(tipBucketDio)
    .upload(putanja, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type
    });
  
  if (error) {
    throw error;
  }
  
  const { data: urlData } = supabase.storage
    .from(tipBucketDio)
    .getPublicUrl(putanja);
  
  if (!urlData || !urlData.publicUrl) {
    throw new Error('Problem prilikom dohvaćanja javnog URL-a');
  }
  
  const publicUrl = urlData.publicUrl;
  
  const noviMedij = {
    id: 'temp_' + Date.now() + '_' + Math.random(),
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    filePath: putanja,
    bucketName: tipBucketDio,
    publicUrl: publicUrl,
    uploadedAt: new Date(),
    userEmail: odabraniEmail.value,
    fileCategory: tip
  };
  
  uploadaniMediji.value = [noviMedij, ...uploadaniMediji.value];

  const trajna_medij_lista = JSON.parse(localStorage.getItem('uploadani_mediji') || '[]');
  trajna_medij_lista.unshift(noviMedij);  
  localStorage.setItem('uploadani_mediji', JSON.stringify(trajna_medij_lista));

  try {
    const docRef = await addDoc(collection(db, 'uploads'), {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      filePath: putanja,
      bucketName: tipBucketDio,
      publicUrl: publicUrl,
      uploadedAt: serverTimestamp(),
      userEmail: odabraniEmail.value,
      fileCategory: tip
    });
    
    const index = uploadaniMediji.value.findIndex(medij => medij.id === noviMedij.id);
    if (index !== -1) {
      uploadaniMediji.value[index].id = docRef.id;
    }
    
  } catch (firestoreError) {
    console.error('Firestore error:', firestoreError);
  }
};

// Filter and dropdown functions
const toggleFilter = () => {
  prikaziSamoOdabranog.value = !prikaziSamoOdabranog.value;
  localStorage.setItem('prikaziSamoOdabranog', prikaziSamoOdabranog.value.toString());
};

const toggleDropdown = () => {
  prikaziDropdown.value = !prikaziDropdown.value;
};

const odaberiEmail = (email) => {
  odabraniEmail.value = email;
  localStorage.setItem('odabraniKorisnik', email);
  prikaziDropdown.value = false;
};

// Helper functions
const formatirajVelicinuDatoteke = (bytes) => {
  if (!bytes) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDatum = (timestamp) => {
  if (!timestamp) return 'Nepoznat datum';
  
  const date = timestamp instanceof Date ? timestamp : 
              timestamp.seconds ? new Date(timestamp.seconds * 1000) : 
              new Date(timestamp);
              
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}.${month}.${year}`;
};

const skratiNaziv = (naziv, maxLength) => {
  if (!naziv) return '';
  if (naziv.length <= maxLength) return naziv;
  
  const ekstenzija = naziv.lastIndexOf('.');
  if (ekstenzija !== -1 && ekstenzija > maxLength - 6) {
    const ext = naziv.substring(ekstenzija);
    return naziv.substring(0, maxLength - 3 - ext.length) + '...' + ext;
  }
  
  return naziv.substring(0, maxLength - 3) + '...';
};

const onImageError = (event) => {
  console.error('Greška učitavanja slike:', event.target.src);
  event.target.src = 'https://via.placeholder.com/300x200?text=Nije+moguće+prikazati+sliku';
  event.target.classList.add('error-image');
};

const onVideoError = (event) => {
  console.error('Greška učitavanja videa:', event.target.src);
  event.target.classList.add('error-video');
  const parent = event.target.parentNode;
  const errorMessage = document.createElement('div');
  errorMessage.className = 'video-error-message';
  errorMessage.textContent = 'Video nije moguće prikazati';
  parent.replaceChild(errorMessage, event.target);
};

// Lightbox functions
const otvoriLightbox = (medij) => {
  aktivniMedij.value = medij;
  document.body.style.overflow = 'hidden'; 
};

const zatvoriLightbox = () => {
  aktivniMedij.value = null;
  document.body.style.overflow = 'auto'; 
};

// Delete functions
const potvrdiZaBrisanje = (medij) => {
  zaBrisanjeMedij.value = medij;
};

const potvrdiZaBrisanjeSvihKorisnika = () => {
  if (odabraniEmail.value && filteredMediji.value.length > 0) {
    zaBrisanjeSviKorisnik.value = odabraniEmail.value;
  }
};

const obrisiPojedinacnuDatoteku = async () => {
  if (!zaBrisanjeMedij.value || brisanjeUTijeku.value) return;
  
  try {
    brisanjeUTijeku.value = true;
    const medij = zaBrisanjeMedij.value;
    
    statusPoruka.value = 'Brisanje u tijeku...';
    jeLiGreska.value = false;
    
    try {
      const { error } = await supabase.storage
        .from(medij.bucketName)
        .remove([medij.filePath]);
        
      if (error) {
        console.error('Greška pri brisanju iz Supabase:', error);
      }
    } catch (storageError) {
      console.error('Neuspjelo brisanje iz Supabase storage:', storageError);
    }
    
    if (medij.id && !medij.id.startsWith('temp_')) {
      try {
        await deleteDoc(doc(db, 'uploads', medij.id));
      } catch (firestoreError) {
        console.error('Neuspjelo brisanje iz Firestore:', firestoreError);
      }
    }
    
    const lokalni_mediji = JSON.parse(localStorage.getItem('uploadani_mediji') || '[]');
    const index = lokalni_mediji.findIndex(m => 
      (m.id === medij.id) || 
      (m.fileName === medij.fileName && m.filePath === medij.filePath)
    );
    
    if (index !== -1) {
      lokalni_mediji.splice(index, 1);
      localStorage.setItem('uploadani_mediji', JSON.stringify(lokalni_mediji));
    }
    
    const reaktivni_index = uploadaniMediji.value.findIndex(m => 
      (m.id === medij.id) || 
      (m.fileName === medij.fileName && m.filePath === medij.filePath)
    );
    
    if (reaktivni_index !== -1) {
      uploadaniMediji.value.splice(reaktivni_index, 1);
    }
    
    statusPoruka.value = 'Datoteka je uspješno obrisana';
    jeLiGreska.value = false;
    zaBrisanjeMedij.value = null;
    
    setTimeout(() => {
      if (statusPoruka.value === 'Datoteka je uspješno obrisana') {
        statusPoruka.value = '';
      }
    }, 3000);
    
  } catch (error) {
    console.error('Greška pri brisanju datoteke:', error);
    statusPoruka.value = `Greška pri brisanju: ${error.message}`;
    jeLiGreska.value = true;
  } finally {
    brisanjeUTijeku.value = false;
  }
};

const obrisiSveKorisnika = async () => {
  if (!zaBrisanjeSviKorisnik.value || brisanjeUTijeku.value) return;
  
  try {
    brisanjeUTijeku.value = true;
    const korisnikEmail = zaBrisanjeSviKorisnik.value;
    const sviMediji = filteredMediji.value;
    
    statusPoruka.value = `Brišem ${sviMediji.length} datoteka...`;
    jeLiGreska.value = false;
    
    for (const medij of sviMediji) {
      try {
        await supabase.storage
          .from(medij.bucketName)
          .remove([medij.filePath]);
        
        if (medij.id && !medij.id.startsWith('temp_')) {
          await deleteDoc(doc(db, 'uploads', medij.id));
        }
      } catch (error) {
        console.error(`Greška pri brisanju ${medij.fileName}:`, error);
      }
    }
    
    const lokalni_mediji = JSON.parse(localStorage.getItem('uploadani_mediji') || '[]');
    const filtrirani_mediji = lokalni_mediji.filter(m => m.userEmail !== korisnikEmail);
    localStorage.setItem('uploadani_mediji', JSON.stringify(filtrirani_mediji));
    
    uploadaniMediji.value = uploadaniMediji.value.filter(m => m.userEmail !== korisnikEmail);
    
    statusPoruka.value = `Uspješno obrisano ${sviMediji.length} datoteka korisnika ${korisnikEmail}`;
    jeLiGreska.value = false;
    zaBrisanjeSviKorisnik.value = null;
    
    setTimeout(() => {
      statusPoruka.value = '';
    }, 5000);
    
  } catch (error) {
    console.error('Greška pri brisanju svih datoteka:', error);
    statusPoruka.value = `Greška pri brisanju: ${error.message}`;
    jeLiGreska.value = true;
  } finally {
    brisanjeUTijeku.value = false;
  }
};

const resetirajStatus = () => {
  statusPoruka.value = '';
  jeLiGreska.value = false;
};

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('click', (event) => {
    const dropdownContainer = document.querySelector('.custom-dropdown');
    if (dropdownContainer && !dropdownContainer.contains(event.target)) {
      prikaziDropdown.value = false;
    }
  });
  
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && aktivniMedij.value) {
      zatvoriLightbox();
    }
  });
  
  const usersRef = collection(db, 'users');
  
  unsubscribe = onSnapshot(usersRef, (snapshot) => {
    const korisniciLista = [];
    snapshot.forEach((doc) => {
      korisniciLista.push({ id: doc.id, ...doc.data() });
    });
    korisnici.value = korisniciLista;
  }, (error) => {
    console.error('Greška pri dohvaćanju korisnika:', error);
  });
  
  const uploadsRef = collection(db, 'uploads');
  const uploadsQuery = query(uploadsRef, orderBy('uploadedAt', 'desc'), limit(50));
  
  unsubscribeUploads = onSnapshot(uploadsQuery, (snapshot) => {
    const mediji = [];
    snapshot.forEach((doc) => {
      const podaci = doc.data();
      mediji.push({ id: doc.id, ...podaci });
    });
    
    localStorage.setItem('uploadani_mediji', JSON.stringify(mediji));
    uploadaniMediji.value = mediji;
  }, (error) => {
    console.error('Greška pri dohvaćanju uploadanih medija:', error);
    const lokalni_mediji = JSON.parse(localStorage.getItem('uploadani_mediji') || '[]');
    if (lokalni_mediji.length > 0) {
      uploadaniMediji.value = lokalni_mediji;
    }
  });
  
  const lokalni_mediji = JSON.parse(localStorage.getItem('uploadani_mediji') || '[]');
  if (lokalni_mediji.length > 0) {
    uploadaniMediji.value = lokalni_mediji;
  }
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
  
  if (unsubscribeUploads) {
    unsubscribeUploads();
  }
  
  odabraneDatoteke.value.forEach(datoteka => {
    if (datoteka.previewUrl) {
      URL.revokeObjectURL(datoteka.previewUrl);
    }
  });
  
  document.body.style.overflow = 'auto';
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');

.upload-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Roboto', sans-serif;
  color: #030303;
  background-color: #F1EFEC;
  border-radius: 12px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.06);
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.naslov {
  color: #123458;
  margin-bottom: 10px;
  font-weight: 700;
  font-size: 2rem;
  position: relative;
  display: inline-block;
}

.naslov::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 3px;
  background-color: #123458;
  border-radius: 2px;
}

.glavni-sadrzaj {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
}

.galerija-wrapper {
  min-height: 400px;
}

.uploadane-datoteke {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid #D4C9BE;
  height: 100%;
}

.datoteke-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 20px;
}

.medij-item {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 2px solid #123458;
  position: relative;
}

.medij-item:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(18, 52, 88, 0.15);
  border-color: #123458;
}

.delete-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.medij-item:hover .delete-overlay {
  opacity: 1;
}

.overlay-delete-btn {
  background-color: rgba(229, 57, 53, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
}

.overlay-delete-btn:hover {
  background-color: rgba(229, 57, 53, 1);
  transform: scale(1.1);
}

.medij-preview {
  width: 100%;
  height: 180px;
  overflow: hidden;
  position: relative;
  background-color: #F1EFEC;
  cursor: pointer;
}

.medij-preview img,
.medij-preview video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.medij-item:hover .medij-preview img,
.medij-item:hover .medij-preview video {
  transform: scale(1.05);
}

.placeholder-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F1EFEC;
  color: #6c757d;
  font-size: 0.8rem;
}

.medij-info {
  padding: 15px;
  background-color: #F1EFEC;
  border-top: 1px solid #123458;
}

.medij-ime {
  font-weight: 600;
  color: #123458;
  font-size: 1rem;
  margin: 0 0 8px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.medij-detalji {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #5D8AA8;
  margin-bottom: 8px;
}

.medij-korisnik {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 50%;
}

.medij-datum {
  color: #6c757d;
  font-weight: 500;
}

.prazno-stanje {
  background-color: white;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  border: 1px solid #D4C9BE;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.prazno-stanje p {
  margin: 5px 0;
  color: #123458;
  font-weight: 500;
  font-size: 1.1rem;
}

.prazno-podnaslov {
  color: #6c757d;
  font-size: 0.9rem !important;
  font-weight: 400 !important;
  margin-top: 10px !important;
}

.upload-panel {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid #D4C9BE;
}

.panel-naslov {
  color: #123458;
  margin: 0 0 20px 0;
  font-weight: 600;
  font-size: 1.2rem;
  text-align: center;
  position: relative;
}

.panel-naslov::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 2px;
  background-color: #123458;
  border-radius: 2px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #123458;
  font-size: 0.9rem;
}

.custom-dropdown {
  position: relative;
  width: 100%;
}

.dropdown-selected {
  background-color: white;
  border: 1px solid #D4C9BE;
  border-radius: 8px;
  padding: 10px 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);
  font-size: 0.9rem;
}

.dropdown-selected:hover {
  border-color: #5D8AA8;
  box-shadow: 0 3px 8px rgba(93, 138, 168, 0.15);
}

.dropdown-arrow {
  font-size: 0.7rem;
  color: #123458;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  background-color: white;
  border: 1px solid #D4C9BE;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  z-index: 100;
  margin-top: 5px;
}

.dropdown-item {
  padding: 10px 15px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.dropdown-item:hover {
  background-color: rgba(93, 138, 168, 0.08);
}

.dropdown-item.active {
  background-color: #123458;
  color: white;
  font-weight: 500;
}

.filter-controls {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-filter {
  width: 100%;
  padding: 8px 12px;
  background-color: #123458;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-filter:hover {
  background-color: #1c4c80;
}

.btn-filter.active {
  background-color: #1c4c80;
  box-shadow: 0 2px 8px rgba(18, 52, 88, 0.3);
}

.btn-delete-all {
  width: 100%;
  padding: 8px 12px;
  background-color: #e53935;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete-all:hover:not(:disabled) {
  background-color: #c62828;
}

.btn-delete-all:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.7;
}

.upload-zona {
  border: 2px dashed #D4C9BE;
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  margin: 15px 0;
  transition: all 0.3s ease;
  background-color: rgba(212, 201, 190, 0.1);
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.upload-zona:hover,
.upload-zona.drag-over {
  border-color: #5D8AA8;
  background-color: rgba(93, 138, 168, 0.1);
  transform: translateY(-2px);
}

.upload-zona.has-files {
  padding: 15px;
  min-height: auto;
}

.upload-ikona {
  color: #123458;
  margin-bottom: 15px;
  display: flex;
  justify-content: center;
}

.glavni-tekst {
  color: #123458;
  margin: 10px 0;
  font-weight: 600;
  font-size: 1rem;
}

.upload-napomena {
  font-size: 0.85rem;
  color: #6c757d;
  margin: 8px 0;
}

.odabrane-datoteke {
  background-color: rgba(93, 138, 168, 0.05);
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #5D8AA8;
}

.datoteke-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #D4C9BE;
}

.datoteke-header h4 {
  margin: 0;
  color: #123458;
  font-size: 1rem;
  font-weight: 600;
}

.btn-ukloni-sve {
  background-color: #e53935;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 6px 12px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-ukloni-sve:hover {
  background-color: #c62828;
  transform: translateY(-1px);
}

.datoteke-lista {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 10px;
}

.datoteka-item {
  display: flex;
  align-items: center;
  padding: 8px;
  margin-bottom: 8px;
  background-color: white;
  border-radius: 6px;
  border: 1px solid #D4C9BE;
  transition: all 0.2s;
}

.datoteka-item:hover {
  border-color: #5D8AA8;
  box-shadow: 0 2px 8px rgba(93, 138, 168, 0.1);
}

.datoteka-preview {
  width: 40px;
  height: 40px;
  margin-right: 10px;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #D4C9BE;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F1EFEC;
}

.datoteka-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-placeholder {
  font-size: 1.2rem;
  color: #5D8AA8;
}

.datoteka-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.datoteka-ime {
  font-weight: 500;
  color: #123458;
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.datoteka-velicina {
  font-size: 0.7rem;
  color: #5D8AA8;
  background-color: rgba(93, 138, 168, 0.1);
  padding: 2px 6px;
  border-radius: 10px;
  display: inline-block;
  width: fit-content;
}

.vise-datoteka {
  text-align: center;
  color: #5D8AA8;
  font-style: italic;
  font-size: 0.85rem;
  padding: 10px;
  background-color: rgba(93, 138, 168, 0.05);
  border-radius: 6px;
  border: 1px dashed #5D8AA8;
}

.ukupna-velicina {
  text-align: center;
  font-weight: 600;
  color: #123458;
  font-size: 0.9rem;
  padding: 8px;
  background-color: white;
  border-radius: 6px;
  border: 1px solid #D4C9BE;
}

.upload-actions {
  margin: 15px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-upload {
  background-color: #123458;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 3px 6px rgba(18, 52, 88, 0.2);
  font-size: 0.95rem;
  width: 100%;
}

.btn-upload:hover:not(:disabled) {
  background-color: #1c4c80;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(18, 52, 88, 0.3);
}

.btn-upload:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.7;
  transform: none;
  box-shadow: none;
}

.progress-container {
  width: 100%;
}

.progress-bar {
  width: 100%;
  height: 10px;
  background-color: #D4C9BE;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 8px;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #123458, #5D8AA8);
  border-radius: 10px;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 0.8rem;
  color: #123458;
  font-weight: 500;
}

.status-poruka {
  margin: 12px 0;
  padding: 10px;
  border-radius: 6px;
  font-weight: 500;
  text-align: center;
  font-size: 0.85rem;
}

.status-poruka.success {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10B981;
  border: 1px solid #10B981;
}

.status-poruka.error {
  background-color: rgba(229, 57, 53, 0.1);
  color: #E53935;
  border: 1px solid #E53935;
}

.lightbox {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.9);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
}

.lightbox-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.lightbox-close {
  position: absolute;
  top: -40px;
  right: 0;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
  z-index: 10;
}

.lightbox-close:hover {
  background-color: rgba(255, 255, 255, 0.4);
}

.lightbox-media {
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-media img,
.lightbox-media video {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 5px;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.2);
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-potvrda {
  background-color: white;
  border-radius: 10px;
  padding: 20px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  animation: fadeInUp 0.3s;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-potvrda h4 {
  color: #123458;
  margin: 0 0 15px 0;
  font-size: 1.2rem;
  font-weight: 600;
  text-align: center;
  border-bottom: 1px solid #D4C9BE;
  padding-bottom: 10px;
}

.modal-potvrda p {
  margin: 10px 0;
  color: #333;
  font-size: 1rem;
  text-align: center;
}

.file-to-delete {
  font-weight: 500;
  color: #e53935;
  background-color: rgba(229, 57, 53, 0.1);
  padding: 8px;
  border-radius: 5px;
  margin: 15px 0;
  word-break: break-all;
}

.user-to-delete {
  font-weight: 600;
  color: #123458;
  background-color: rgba(18, 52, 88, 0.1);
  padding: 8px;
  border-radius: 5px;
  margin: 15px 0;
  text-align: center;
}

.files-count {
  font-weight: 500;
  color: #e53935;
  background-color: rgba(229, 57, 53, 0.1);
  padding: 8px;
  border-radius: 5px;
  margin: 15px 0;
  text-align: center;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.btn-odustani {
  padding: 8px 20px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 5px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  flex: 1;
  margin-right: 10px;
}

.btn-odustani:hover {
  background-color: #5a6268;
}

.btn-potvrdi {
  padding: 8px 20px;
  background-color: #e53935;
  color: white;
  border: none;
  border-radius: 5px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  flex: 1;
  margin-left: 10px;
}

.btn-potvrdi:hover:not(:disabled) {
  background-color: #c62828;
}

.btn-potvrdi:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.7;
}

.error-image, 
.error-video {
  opacity: 0.7;
  border: 2px solid #E53935;
}

.video-error-message {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(229, 57, 53, 0.1);
  color: #E53935;
  padding: 10px;
  text-align: center;
  font-weight: 500;
  font-size: 0.8rem;
}
</style>