<template>
  <div class="upload-container">
    <div class="page-header">
      <h2 class="naslov">Galerija fotografija</h2>
    </div>
    
    <div class="glavni-sadrzaj">
      <div class="galerija-wrapper">
        <div class="uploadane-datoteke" v-if="uploadaniMediji.length > 0">
          <div class="datoteke-grid">
            <div 
              v-for="(medij, index) in uploadaniMediji" 
              :key="medij.id || index" 
              class="medij-item"
            >
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
        
                <button class="btn-brisi" @click.stop="potvrdiZaBrisanje(medij)" title="Obriši sliku">
                  Obriši
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="!uploadUTijeku" class="prazno-stanje">
          <p>Nema uploadanih medija</p>
          <p class="prazno-podnaslov">Koristite panel sa strane za upload</p>
        </div>
      </div>
      <div class="upload-panel">
        <h3 class="panel-naslov">Dodaj novu sliku</h3>
        
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
        <div class="upload-zona" @click="pokreniUpload" @dragover.prevent @drop.prevent="handleDrop">
          <input 
            type="file" 
            ref="fileInput" 
            style="display: none" 
            @change="handleFileChange" 
            accept="image/*,video/*"
            multiple
          />
          
          <div v-if="!odabranaDatoteka" class="upload-poruka">
            <div class="upload-ikona">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <p class="glavni-tekst">Povucite ili kliknite za odabir</p>
            <p class="upload-napomena">JPG, PNG, GIF, MP4, MOV</p>
          </div>
          
          <div v-else class="odabrana-datoteka">
            <div v-if="previewUrl" class="datoteka-preview">
<img v-if="jeLiSlika" :src="previewUrl" alt="Preview" />
             <video v-else-if="jeliVideo" :src="previewUrl" controls></video>
            </div>
           <div class="datoteka-info">
           <span class="datoteka-ime">{{ skratiNaziv(odabranaDatoteka.name, 18) }}</span>
            <span class="datoteka-velicina">{{ formatirajVelicinuDatoteke(odabranaDatoteka.size) }}</span>
            </div>
          <button class="btn-ukloni" @click.stop="ukloniDatoteku" title="Ukloni">✕</button>
          </div>
        </div>
        <div class="upload-actions">
          <button 
            class="btn-upload" 
            @click="uploadDatoteku" 
            :disabled="!odabranaDatoteka || !odabraniEmail || uploadUTijeku"
          >
            Upload
          </button>
          <div v-if="uploadUTijeku" class="progress-container">
            <div class="progress-bar">
              <div class="progress" :style="{ width: `${uploadProgress}%` }"></div>
            </div>
          </div>
        </div>
        <div v-if="statusPoruka" class="status-poruka" :class="{ 'success': !jeLiGreska, 'error': jeLiGreska }">
          {{ statusPoruka }}
        </div>

        <button class="btn-osvjezi" @click="refreshImages">
          Osvježi prikaz
        </button>
      </div>
    </div>
    <div class="lightbox" v-if="aktivniMedij" @click="zatvoriLightbox">
      <div class="lightbox-content" @click.stop>
        <button class="lightbox-close" @click="zatvoriLightbox">✕</button>
        <div class="lightbox-media">
          <img v-if="aktivniMedij.fileCategory === 'image'" :src="aktivniMedij.publicUrl" alt="Preview u punoj veličini" />
          <video v-else-if="aktivniMedij.fileCategory === 'video'" :src="aktivniMedij.publicUrl" controls autoplay></video>
        </div>
      </div>
    </div>
    <div class="modal-backdrop" v-if="zaBrisanjeMedij" @click="zaBrisanjeMedij = null">
      <div class="modal-potvrda" @click.stop>
        <h4>Potvrda brisanja</h4>
        <p>Jeste li sigurni da želite trajno obrisati ovu datoteku?</p>
        <p class="file-to-delete">{{ zaBrisanjeMedij ? zaBrisanjeMedij.fileName : '' }}</p>
        <div class="modal-actions">
          <button class="btn-odustani" @click="zaBrisanjeMedij = null">Odustani</button>
          <button class="btn-potvrdi" @click="obrisiMedij">Obriši</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
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
  updateDoc,
  deleteDoc
} from 'firebase/firestore';

export default {
  setup() {
    const korisnici = ref([]);
    const odabraniEmail = ref(localStorage.getItem('odabraniKorisnik') || null);
    const prikaziDropdown = ref(false);
    const fileInput = ref(null);
    const odabranaDatoteka = ref(null);
    const previewUrl = ref(null);
    const jeLiSlika = ref(false);
    const jeliVideo = ref(false);
    const uploadUTijeku = ref(false);
    const uploadProgress = ref(0);
    const statusPoruka = ref('');
    const jeLiGreska = ref(false);
    const uploadaniMediji = ref([]);
    const aktivniMedij = ref(null);
    const zaBrisanjeMedij = ref(null);
    const brisanjeUTijeku = ref(false);
    let unsubscribe = null;
    let unsubscribeUploads = null;
    const toggleDropdown = () => {
      prikaziDropdown.value = !prikaziDropdown.value;
    };

    const odaberiEmail = (email) => {
      odabraniEmail.value = email;
      localStorage.setItem('odabraniKorisnik', email);
      prikaziDropdown.value = false;
    };

    const pokreniUpload = () => {
      if (!odabranaDatoteka.value) {
        fileInput.value.click();
      }
    };

    const handleFileChange = (event) => {
      const file = event.target.files[0];
      if (file) {
        odaberiDatoteku(file);
      }
    };

    const handleDrop = (event) => {
      const file = event.dataTransfer.files[0];
      if (file) {
        odaberiDatoteku(file);
      }
    };

    const odaberiDatoteku = (file) => {
      const tipDatoteke = file.type;
      jeLiSlika.value = tipDatoteke.startsWith('image/');
      jeliVideo.value = tipDatoteke.startsWith('video/');
      
      if (jeLiSlika.value || jeliVideo.value) {
        odabranaDatoteka.value = file;
        previewUrl.value = URL.createObjectURL(file);
        resetirajStatus();
      } else {
        statusPoruka.value = 'Nepodržani format datoteke. Molimo odaberite sliku ili video.';
        jeLiGreska.value = true;
      }
    };

    const ukloniDatoteku = () => {
      odabranaDatoteka.value = null;
      if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value);
        previewUrl.value = null;
      }
      jeLiSlika.value = false;
      jeliVideo.value = false;
      resetirajStatus();
    };
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


    const otvoriLightbox = (medij) => {
      aktivniMedij.value = medij;
      document.body.style.overflow = 'hidden'; 
    };

    const zatvoriLightbox = () => {
      aktivniMedij.value = null;
      document.body.style.overflow = 'auto'; 
    };
    const potvrdiZaBrisanje = (medij) => {
      zaBrisanjeMedij.value = medij;
    };

    const obrisiMedij = async () => {
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
            throw error;
          }
          
          console.log('Datoteka uspješno obrisana iz Supabase storage');
        } catch (storageError) {
          console.error('Neuspjelo brisanje iz Supabase storage:', storageError);
        }
        
        if (medij.id && !medij.id.startsWith('temp_')) {
          try {
            await deleteDoc(doc(db, 'uploads', medij.id));
            console.log('Zapis uspješno obrisan iz Firestore');
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
          console.log('Zapis uspješno obrisan iz localStorage');
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

    const uploadDatoteku = async () => {
      if (!odabranaDatoteka.value || !odabraniEmail.value) {
        statusPoruka.value = 'Molimo odaberite datoteku i korisnika';
        jeLiGreska.value = true;
        return;
      }
      
      try {
        uploadUTijeku.value = true;
        uploadProgress.value = 0;
        statusPoruka.value = 'Upload u tijeku...';
        jeLiGreska.value = false;
        const progressInterval = setInterval(() => {
          if (uploadProgress.value < 90) {
            uploadProgress.value += 5;
          }
        }, 300);
        const datumVrijeme = new Date().toISOString().replace(/[:.]/g, '-');
        const korisnikDio = odabraniEmail.value.replace('@', '_at_');
        const tipBucketDio = jeLiSlika.value ? 'images' : 'video';
        const datotekaNaziv = `${datumVrijeme}_${odabranaDatoteka.value.name.replace(/\s+/g, '_')}`;
        const putanja = `${korisnikDio}/${datotekaNaziv}`;
        
        console.log('Priprema za upload:', {
          bucket: tipBucketDio,
          path: putanja,
          fileType: odabranaDatoteka.value.type,
          fileSize: odabranaDatoteka.value.size
        });
        let uploadTimeout = setTimeout(() => {
          statusPoruka.value = 'Upload u tijeku... (traje duže od očekivanog)';
        }, 10000);

        const { data, error } = await supabase.storage
          .from(tipBucketDio)
          .upload(putanja, odabranaDatoteka.value, {
            cacheControl: '3600',
            upsert: true,
            contentType: odabranaDatoteka.value.type
          });
        
        clearTimeout(uploadTimeout);
        clearInterval(progressInterval);
        
        if (error) {
          console.error('Supabase upload error:', error);
          throw error;
        }
        
        console.log('Upload uspješan:', data);
   
        const { data: urlData } = supabase.storage
          .from(tipBucketDio)
          .getPublicUrl(putanja);
          
        console.log('URL data:', urlData);
        
        if (!urlData || !urlData.publicUrl) {
          throw new Error('Problem prilikom dohvaćanja javnog URL-a');
        }
        
        const publicUrl = urlData.publicUrl;
        console.log('Javni URL:', publicUrl);
        
        const noviMedij = {
          id: 'temp_' + Date.now(),
          fileName: odabranaDatoteka.value.name,
          fileType: odabranaDatoteka.value.type,
          fileSize: odabranaDatoteka.value.size,
          filePath: putanja,
          bucketName: tipBucketDio,
          publicUrl: publicUrl,
          uploadedAt: new Date(),
          userEmail: odabraniEmail.value,
          fileCategory: jeLiSlika.value ? 'image' : 'video'
        };
        uploadaniMediji.value = [noviMedij, ...uploadaniMediji.value];

        const trajna_medij_lista = JSON.parse(localStorage.getItem('uploadani_mediji') || '[]');
        trajna_medij_lista.unshift(noviMedij);  
        localStorage.setItem('uploadani_mediji', JSON.stringify(trajna_medij_lista));

        try {
          const docRef = await addDoc(collection(db, 'uploads'), {
            fileName: odabranaDatoteka.value.name,
            fileType: odabranaDatoteka.value.type,
            fileSize: odabranaDatoteka.value.size,
            filePath: putanja,
            bucketName: tipBucketDio,
            publicUrl: publicUrl,
            uploadedAt: serverTimestamp(),
            userEmail: odabraniEmail.value,
            fileCategory: jeLiSlika.value ? 'image' : 'video'
          });
          
          console.log('Metadata spremljena u Firestore, ID:', docRef.id);
          
          const index = uploadaniMediji.value.findIndex(medij => medij.id === noviMedij.id);
          if (index !== -1) {
            uploadaniMediji.value[index].id = docRef.id;
      
            const lokalni_mediji = JSON.parse(localStorage.getItem('uploadani_mediji') || '[]');
            const lokalni_index = lokalni_mediji.findIndex(
              m => m.fileName === noviMedij.fileName && m.uploadedAt === noviMedij.uploadedAt
            );
            if (lokalni_index !== -1) {
              lokalni_mediji[lokalni_index].id = docRef.id;
              localStorage.setItem('uploadani_mediji', JSON.stringify(lokalni_mediji));
            }
          }
          
        } catch (firestoreError) {
          console.error('Firestore error:', firestoreError);
        }
        
        uploadProgress.value = 100;
        statusPoruka.value = 'Datoteka je uspješno uploadana!';
        jeLiGreska.value = false;
        setTimeout(() => {
          ukloniDatoteku();
        }, 3000);
        
      } catch (error) {
        console.error('Upload error:', error);
        uploadProgress.value = 0;
        
        let errorMsg = error.message || 'Nepoznata greška';
        
        if (errorMsg.includes('CORS') || errorMsg.includes('network') || errorMsg === 'Failed to fetch') {
          errorMsg = 'Mrežna greška (možda CORS problem). Provjerite CORS postavke u Supabase-u.';
        }
        
        if (errorMsg.includes('permission') || errorMsg.includes('not authorized') || errorMsg.includes('access denied')) {
          errorMsg = 'Greška dozvola. Provjerite RLS politike u Supabase-u.';
        }
        
        statusPoruka.value = `Greška prilikom uploada: ${errorMsg}`;
        jeLiGreska.value = true;
      } finally {
        uploadUTijeku.value = false;
      }
    };
    const resetirajStatus = () => {
      statusPoruka.value = '';
      jeLiGreska.value = false;
      uploadProgress.value = 0;
    };
    const refreshImages = async () => {
      try {
        statusPoruka.value = "Osvježavam prikaz...";
        jeLiGreska.value = false;
        const uploadsRef = collection(db, 'uploads');
        const uploadsQuery = query(uploadsRef, orderBy('uploadedAt', 'desc'), limit(50));
        const snapshot = await getDocs(uploadsQuery);
        
        const mediji = [];
        snapshot.forEach((doc) => {
          mediji.push({ id: doc.id, ...doc.data() });
        });
        localStorage.setItem('uploadani_mediji', JSON.stringify(mediji));
        uploadaniMediji.value = mediji;
        
        statusPoruka.value = `Prikaz osvježen.`;
        setTimeout(() => {
          statusPoruka.value = '';
        }, 3000);
      } catch (error) {
        console.error('Greška pri osvježavanju:', error);
        
        const lokalni_mediji = JSON.parse(localStorage.getItem('uploadani_mediji') || '[]');
        if (lokalni_mediji.length > 0) {
          uploadaniMediji.value = lokalni_mediji;
          statusPoruka.value = `Koriste se lokalno spremljeni podaci`;
        } else {
          statusPoruka.value = `Greška pri osvježavanju: ${error.message}`;
          jeLiGreska.value = true;
        }
      }
    };

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
      
      if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value);
      }
      document.body.style.overflow = 'auto';
    });
    
    return {
      korisnici,
      odabraniEmail,
      prikaziDropdown,
      fileInput,
      odabranaDatoteka,
      previewUrl,
      jeLiSlika,
      jeliVideo,
      uploadUTijeku,
      uploadProgress,
      statusPoruka,
      jeLiGreska,
      uploadaniMediji,
      aktivniMedij,
      zaBrisanjeMedij,
      toggleDropdown,
      odaberiEmail,
      pokreniUpload,
      handleFileChange,
      handleDrop,
      ukloniDatoteku,
      formatirajVelicinuDatoteke,
      formatDatum,
      skratiNaziv,
      onImageError,
      onVideoError,
      otvoriLightbox,
      zatvoriLightbox,
      potvrdiZaBrisanje,
      obrisiMedij,
      uploadDatoteku,
      refreshImages
    };
  }
}
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
  grid-template-columns: 1fr 300px;
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
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.medij-item {
  background-color: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid #D4C9BE;
}

.medij-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  border-color: #5D8AA8;
}

.medij-preview {
  width: 100%;
  height: 150px;
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

.medij-info {
  padding: 10px;
  border-top: 1px solid #D4C9BE;
  background-color: #F1EFEC;
  position: relative;
}

.medij-ime {
  font-weight: 500;
  color: #123458;
  font-size: 0.9rem;
  margin: 0 0 5px 0;
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
}

.btn-brisi {
  width: 100%;
  padding: 6px 12px;
  background-color: #e53935;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-brisi:hover {
  background-color: #c62828;
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

.btn-potvrdi:hover {
  background-color: #c62828;
}

/* Prazno stanje */
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

.upload-zona {
  border: 2px dashed #D4C9BE;
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  margin: 15px 0;
  transition: all 0.2s ease;
  background-color: rgba(212, 201, 190, 0.1);
}

.upload-zona:hover {
  border-color: #5D8AA8;
  background-color: rgba(93, 138, 168, 0.05);
}

.upload-ikona {
  color: #123458;
  margin-bottom: 10px;
  display: flex;
  justify-content: center;
}

.glavni-tekst {
  color: #123458;
  margin: 8px 0;
  font-weight: 500;
  font-size: 0.9rem;
}

.upload-napomena {
  font-size: 0.8rem;
  color: #6c757d;
  margin-top: 5px;
}

.odabrana-datoteka {
  display: flex;
  align-items: center;
  position: relative;
  background-color: rgba(93, 138, 168, 0.05);
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #5D8AA8;
}

.datoteka-preview {
  width: 60px;
  height: 60px;
  margin-right: 10px;
  border-radius: 5px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #D4C9BE;
  flex-shrink: 0;
}

.datoteka-preview img, 
.datoteka-preview video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.datoteka-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.datoteka-ime {
  font-weight: 500;
  color: #123458;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.datoteka-velicina {
  font-size: 0.75rem;
  color: #5D8AA8;
  background-color: rgba(93, 138, 168, 0.1);
  padding: 2px 6px;
  border-radius: 10px;
  display: inline-block;
  margin-top: 4px;
  width: fit-content;
}

.btn-ukloni {
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: #e53935;
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: bold;
  font-size: 0.7rem;
  box-shadow: 0 1px 3px rgba(229, 57, 53, 0.3);
}

.btn-ukloni:hover {
  background-color: #c62828;
  transform: scale(1.1);
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
  height: 8px;
  background-color: #D4C9BE;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #123458, #5D8AA8);
  border-radius: 10px;
  transition: width 0.3s ease;
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
.btn-osvjezi {
  width: 100%;
  background-color: #5D8AA8;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px;
  margin-top: 15px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  font-weight: 500;
}

.btn-osvjezi:hover {
  background-color: #123458;
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

@media (max-width: 992px) {
  .glavni-sadrzaj {
    grid-template-columns: 1fr 250px;
    gap: 15px;
  }
  
  .datoteke-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 15px;
  }
}

@media (max-width: 768px) {
  .glavni-sadrzaj {
    grid-template-columns: 1fr;
  }
  
  .upload-panel {
    order: -1; 
  }
}

@media (max-width: 576px) {
  .datoteke-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 10px;
  }
  
  .medij-preview {
    height: 120px;
  }
  
  .naslov {
    font-size: 1.5rem;
  }
  
  .lightbox-media img,
  .lightbox-media video {
    max-height: 85vh;
  }
  
  .modal-potvrda {
    width: 95%;
    padding: 15px;
  }
  
  .modal-actions {
    flex-direction: column;
    gap: 10px;
  }
  
  .btn-odustani, .btn-potvrdi {
    margin: 0;
  }
}
</style>