
<template>
  <div class="nadzorna-ploca">
    <div class="gornja-traka">
      <div class="traka-sadrzaj">
        <div class="profil-padajuci">
          <div class="profil-ikona" @click="toggleProfilMenu">
            {{ inicijalKorisnika }}
          </div>
          <div class="profil-izbornik" v-if="pokaziProfilMenu">
            <div class="korisnik-email">{{ emailKorisnika }}</div>
            <div class="izbornik-opcija odjava-opcija" @click="odjava">Odjava</div>
          </div>
        </div>
      </div>
    </div>

    <div class="glavni-sadrzaj">
      <div class="sadrzaj-omotac">
        <div class="zaglavlje-stranice">
          <h1>Dobrodošli, {{ emailKorisnika }}</h1>
        </div>

        <div class="galerija-sekcija">
          <div class="galerija-zaglavlje">
            <h2>Moje fotografije</h2>
            <div class="galerija-akcije">
              <button @click="preuzmiSve" class="gumb-preuzmi-sve" :disabled="slikeKorisnika.length === 0 || preuzimaSeSve">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                {{ preuzimaSeSve ? `Preuzimanje ${brojPreuzeto}/${slikeKorisnika.length}` : `Preuzmi sve (${slikeKorisnika.length})` }}
              </button>
            </div>
          </div>
          
          <div v-if="slikeKorisnika.length > 0" class="slike-mreza">
            <div v-for="(slika, indeks) in slikeKorisnika" :key="indeks" class="slika-kartica">
              <div class="slika-prekrivni-sloj">
                <button @click.stop="preuzmiSliku(slika)" class="prekrivni-gumb-preuzmi" title="Preuzmi sliku">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </button>
                <button @click.stop="toggleKomentarFormu(slika.fileName)" class="prekrivni-gumb-komentar" title="Dodaj komentar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14M5 12h14"></path>
                  </svg>
                </button>
              </div>
              
              <div class="slika-pregled-kontejner" @click="prikaziSliku(slika)">
                <img v-if="slika.publicUrl" :src="slika.publicUrl" :alt="slika.fileName" class="slika-pregled" @error="greskaSlike" />
              </div>
              
              <div class="slika-informacije" :class="{ 'ima-sadrzaj': komentariSlike(slika).length > 0 || otvorenaForma === slika.fileName, 'nema-sadrzaj': komentariSlike(slika).length === 0 && otvorenaForma !== slika.fileName }">
                <p class="slika-naziv">{{ slika.fileName }}</p>
                <p class="slika-datum">{{ formatirajDatum(slika.uploadedAt) }}</p>
                
                <div v-if="komentariSlike(slika).length > 0" class="komentari-sekcija">
                  <div class="komentari-zaglavlje">
                    <span class="komentari-broj">Komentari ({{ komentariSlike(slika).length }})</span>
                  </div>
                  
                  <div class="komentari-lista">
                    <div v-for="komentar in komentariSlike(slika)" :key="komentar.id" class="komentar-stavka">
                      <div v-if="uredujemo === komentar.id" class="uredi-komentar-forma">
                        <textarea v-model="tekstZaUredbu" class="uredi-komentar-unos" rows="2"></textarea>
                        <div class="uredi-komentar-akcije">
                          <button @click="spremiUredbu(komentar)" class="spremi-uredbu-gumb" :disabled="ucitava">
                            {{ ucitava ? 'Sprema...' : 'Spremi' }}
                          </button>
                          <button @click="odustaniUredbu" class="otkazi-uredbu-gumb">Otkazi</button>
                        </div>
                      </div>
                      <div v-else>
                        <div class="komentar-zaglavlje">
                          <div class="komentar-meta">
                            <span class="komentar-autor">{{ komentar.authorEmail }}</span>
                            <span class="komentar-datum">{{ formatirajDatum(komentar.timestamp) }}</span>
                            <span v-if="komentar.editedAt" class="komentar-uredjen">(uređeno)</span>
                          </div>
                          <div v-if="komentar.authorEmail === emailKorisnika" class="komentar-akcije">
                            <button @click="pocniUredbu(komentar)" class="uredi-komentar-gumb" title="Uredi">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                            <button @click="ukloniKomentar(komentar.id)" class="ukloni-komentar-gumb" title="Obriši" :disabled="ucitava">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                        <p class="komentar-tekst">{{ komentar.text }}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div v-if="otvorenaForma === slika.fileName" class="dodaj-komentar-forma">
                  <textarea :value="noviKomentari[slika.fileName] || ''" @input="azurirajKomentar(slika.fileName, $event.target.value)" placeholder="Dodajte komentar..." class="komentar-unos" rows="2" @keydown.enter.ctrl="dodajKomentar(slika, $event)" ref="komentarUnos"></textarea>
                  <div class="komentar-forma-akcije">
                    <button @click="dodajKomentar(slika)" class="dodaj-komentar-gumb" :disabled="!noviKomentari[slika.fileName] || noviKomentari[slika.fileName].trim() === '' || ucitava">
                      {{ ucitava ? 'Sprema...' : 'Dodaj' }}
                    </button>
                    <button @click="odustaniKomentar(slika.fileName)" class="otkazi-komentar-gumb">Otkazi</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="prazno-stanje">
            <p>Nemate uploadanih fotografija</p>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="trenutnaSlika" class="lightbox" @click="zatvoriPrikaz">
      <div class="lightbox-sadrzaj" @click.stop>
        <button @click="zatvoriPrikaz" class="lightbox-zatvori">✕</button>
        <img :src="trenutnaSlika.publicUrl" :alt="trenutnaSlika.fileName" class="lightbox-slika">
      </div>
    </div>
    
    <div v-if="preuzimaSeSve" class="obavijest-preuzimanja">
      <p>Preuzimanje {{ brojPreuzeto }}/{{ slikeKorisnika.length }} slika...</p>
      <div class="traka-napretka">
        <div class="ispunjavanje-napretka" :style="{ width: (brojPreuzeto / slikeKorisnika.length) * 100 + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../store/auth'
import { db } from '@/services/firebase.js'
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy, 
  query,
  where,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore'

const router = useRouter()
const { state: authStanje, logout: authOdjava } = useAuth()

const slikeKorisnika = ref([])
const trenutnaSlika = ref(null)
const pokaziProfilMenu = ref(false)
const preuzimaSeSve = ref(false)
const brojPreuzeto = ref(0)
const komentari = ref([])
const noviKomentari = ref({})
const otvorenaForma = ref(null) 
const uredujemo = ref(null) 
const tekstZaUredbu = ref('') 
const ucitava = ref(false)

let unsubscribeKomentari = null

const emailKorisnika = computed(() => {
  return authStanje.currentUser?.email || 'Nepoznat korisnik'
})

const prijavljen = computed(() => {
  return authStanje.isLoggedIn
})

const ucitavaLoading = computed(() => {
  return authStanje.loading
})

const inicijalKorisnika = computed(() => {
  return emailKorisnika.value.charAt(0).toUpperCase()
})

const komentariSlike = (slika) => {
  return komentari.value.filter(komentar => komentar.imageFileName === slika.fileName)
}

const zabiljeziPreuzimanje = (email) => {
  try {
    const podaci = localStorage.getItem('download_stats');
    let statistike = {};
    
    if (podaci) {
      statistike = JSON.parse(podaci);
    }
    
    if (statistike[email]) {
      statistike[email]++;
    } else {
      statistike[email] = 1;
    }
    
    localStorage.setItem('download_stats', JSON.stringify(statistike));
    
    window.dispatchEvent(new CustomEvent('downloadStatsUpdated', {
      detail: { userEmail: email, newCount: statistike[email] }
    }));
    
    console.log(`Zabilježeno preuzimanje za ${email}. Ukupno: ${statistike[email]}`);
    
  } catch (greska) {
    console.error('Greška pri praćenju preuzimanja:', greska);
  }
};

const azurirajKomentar = (datoteka, vrijednost) => {
  noviKomentari.value[datoteka] = vrijednost
}

const toggleKomentarFormu = async (datoteka) => {
  if (otvorenaForma.value === datoteka) {
    otvorenaForma.value = null
  } else {
    otvorenaForma.value = datoteka
    await nextTick()
    const textarea = document.querySelector('.komentar-unos')
    if (textarea) {
      textarea.focus()
    }
  }
}

const odustaniKomentar = (datoteka) => {
  otvorenaForma.value = null
  noviKomentari.value[datoteka] = ''
}

const pocniUredbu = (komentar) => {
  uredujemo.value = komentar.id
  tekstZaUredbu.value = komentar.text
}

const odustaniUredbu = () => {
  uredujemo.value = null
  tekstZaUredbu.value = ''
}

const spremiUredbu = async (komentar) => {
  if (!tekstZaUredbu.value || tekstZaUredbu.value.trim() === '' || ucitava.value) return
  
  ucitava.value = true

  try {
    const komentarRef = doc(db, 'komentari', komentar.id)
    await updateDoc(komentarRef, {
      text: tekstZaUredbu.value.trim(),
      editedAt: serverTimestamp()
    })

    uredujemo.value = null
    tekstZaUredbu.value = ''
  } catch (greska) {
    console.error('Greška pri ažuriranju komentara:', greska)
    alert('Greška pri ažuriranju komentara. Pokušajte ponovno.')
  } finally {
    ucitava.value = false
  }
}

const ukloniKomentar = async (id) => {
  if (ucitava.value) return

  ucitava.value = true

  try {
    await deleteDoc(doc(db, 'komentari', id))
  } catch (greska) {
    console.error('Greška pri brisanju komentara:', greska)
    alert('Greška pri brisanju komentara. Pokušajte ponovno.')
  } finally {
    ucitava.value = false
  }
}

const dodajKomentar = async (slika, event = null) => {
  if (event) {
    event.preventDefault()
  }
  
  const tekst = noviKomentari.value[slika.fileName]
  if (!tekst || tekst.trim() === '' || ucitava.value) return
  
  ucitava.value = true

  try {
    const komentar = {
      imageFileName: slika.fileName,
      text: tekst.trim(),
      authorEmail: emailKorisnika.value,
      timestamp: serverTimestamp(),
      imageOwnerEmail: slika.userEmail,
      procitan: false
    }
    
    await addDoc(collection(db, 'komentari'), komentar)
    
    noviKomentari.value[slika.fileName] = ''
    otvorenaForma.value = null 
  } catch (greska) {
    console.error('Greška pri dodavanju komentara:', greska)
    alert('Greška pri dodavanju komentara. Pokušajte ponovno.')
  } finally {
    ucitava.value = false
  }
}

const ucitajKomentare = () => {
  try {
    const q = query(collection(db, 'komentari'), orderBy('timestamp', 'desc'))
    unsubscribeKomentari = onSnapshot(q, (snapshot) => {
      komentari.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    }, (error) => {
      console.error('Greška pri učitavanju komentara:', error)
    })
  } catch (greska) {
    console.error('Greška pri postavljanju listenera za komentare:', greska)
    komentari.value = []
  }
}

const odjava = async () => {
  try {
    pokaziProfilMenu.value = false
    await authOdjava()
    router.push('/login')
  } catch (greska) {
    console.error('Greška prilikom odjave:', greska)
  }
}

const toggleProfilMenu = () => {
  pokaziProfilMenu.value = !pokaziProfilMenu.value
}

const klikIzvan = (event) => {
  const profil = document.querySelector('.profil-padajuci')
  if (profil && !profil.contains(event.target)) {
    pokaziProfilMenu.value = false
  }
}

const greskaSlike = (event) => {
  console.error('Greška učitavanja slike:', event.target.src)
  event.target.style.display = 'none'
}

const prikaziSliku = (slika) => {
  trenutnaSlika.value = slika
  document.body.style.overflow = 'hidden'
}

const zatvoriPrikaz = () => {
  trenutnaSlika.value = null
  document.body.style.overflow = 'auto'
}

const preuzmiSliku = (slika) => {
  try {
    zabiljeziPreuzimanje(emailKorisnika.value);
    preuzmiKaoBlob(slika)
  } catch (greska) {
    console.error('Greška pri preuzimanju:', greska)
    window.open(slika.publicUrl, '_blank')
  }
}

const preuzmiKaoBlob = async (slika) => {
  try {
    const response = await fetch(slika.publicUrl, {
      mode: 'cors',
      method: 'GET'
    })
    
    if (!response.ok) {
      throw new Error('Mrežni odgovor nije bio u redu')
    }
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = slika.fileName || 'slika.jpg'
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setTimeout(() => {
      window.URL.revokeObjectURL(url)
    }, 100)
    
  } catch (greska) {
    preuzmiCanvas(slika)
  }
}

const preuzmiCanvas = (slika) => {
  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        
        ctx.drawImage(img, 0, 0)
        
        canvas.toBlob((blob) => {
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = slika.fileName || 'slika.jpg'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        }, 'image/jpeg', 0.95)
        
      } catch (err) {
        rezervaPreuzmi(slika)
      }
    }
    
    img.onerror = () => {
      rezervaPreuzmi(slika)
    }
    
    img.src = slika.publicUrl
    
  } catch (greska) {
    rezervaPreuzmi(slika)
  }
}

const rezervaPreuzmi = (slika) => {
  const link = document.createElement('a')
  link.href = slika.publicUrl
  link.download = slika.fileName || 'slika.jpg'
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  
  const url = new URL(slika.publicUrl)
  url.searchParams.append('download', 'true')
  url.searchParams.append('filename', slika.fileName)
  link.href = url.toString()
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const preuzmiSve = async () => {
  if (slikeKorisnika.value.length === 0 || preuzimaSeSve.value) {
    return
  }

  preuzimaSeSve.value = true
  brojPreuzeto.value = 0

  try {
    for (let i = 0; i < slikeKorisnika.value.length; i++) {
      const slika = slikeKorisnika.value[i]
      brojPreuzeto.value = i + 1
      
      try {
        await preuzmiJednu(slika, i)
        zabiljeziPreuzimanje(emailKorisnika.value);
        await new Promise(resolve => setTimeout(resolve, 800))
      } catch (greska) {
        console.error(`Greška pri preuzimanju slike ${slika.fileName}:`, greska)
      }
    }
  } catch (greska) {
    console.error('Greška pri preuzimanju svih slika:', greska)
  } finally {
    preuzimaSeSve.value = false
    brojPreuzeto.value = 0
  }
}

const preuzmiJednu = async (slika, index) => {
  try {
    const response = await fetch(slika.publicUrl, {
      mode: 'cors',
      method: 'GET'
    })
    
    if (!response.ok) {
      throw new Error('Mrežni odgovor nije bio u redu')
    }
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const naziv = `${String(index + 1).padStart(3, '0')}_${slika.fileName}`
    
    const link = document.createElement('a')
    link.href = url
    link.download = naziv
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setTimeout(() => {
      window.URL.revokeObjectURL(url)
    }, 1000)
    
  } catch (greska) {
    rezervaPreuzmi(slika)
  }
}

const formatirajDatum = (datum) => {
  if (!datum) return 'Nepoznat datum'
  
  try {
    const d = datum instanceof Date ? datum : 
                datum.seconds ? new Date(datum.seconds * 1000) : 
                datum.toDate ? datum.toDate() :
                new Date(datum)
                
    return d.toLocaleDateString('hr-HR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (greska) {
    return 'Greška datuma'
  }
}

const ucitajSlike = () => {
  try {
    if (!emailKorisnika.value || emailKorisnika.value === 'Nepoznat korisnik') {
      slikeKorisnika.value = []
      return
    }
    
    const podaci = localStorage.getItem('uploadani_mediji')
    
    if (podaci) {
      const sve = JSON.parse(podaci)
      slikeKorisnika.value = sve.filter(slika => {
        return slika.userEmail === emailKorisnika.value
      })
    } else {
      slikeKorisnika.value = []
    }
    
  } catch (greska) {
    console.error('Greška pri učitavanju slika:', greska)
    slikeKorisnika.value = []
  }
}

onMounted(() => {
  ucitajSlike()
  ucitajKomentare()
  noviKomentari.value = {}
  document.addEventListener('click', klikIzvan)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', klikIzvan)
  document.body.style.overflow = 'auto'
  
  if (unsubscribeKomentari) {
    unsubscribeKomentari()
  }
})
</script>


<style scoped>
.nadzorna-ploca {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #F1EFEC;
  font-family: 'Roboto', sans-serif;
}

.gornja-traka {
  height: 60px;
  z-index: 10;
  position: fixed;
  top: 0;
  right: 0;
  padding: 10px 20px;
  width: 100%;
  background-color: #F1EFEC;
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
  box-shadow: 0 2px 5px rgba(18, 52, 88, 0.3);
}

.profil-izbornik {
  position: absolute;
  top: 50px;
  right: 0;
  width: 220px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: klizanjeDolje 0.3s ease;
  border: 1px solid #D4C9BE;
}

@keyframes klizanjeDolje {
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
  border-bottom: 1px solid #D4C9BE;
  color: #123458;
  font-size: 0.9rem;
  text-align: center;
  font-weight: 500;
}

.izbornik-opcija {
  padding: 12px 15px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.odjava-opcija {
  color: white;
  font-weight: bold;
  background-color: #e53935;
  text-align: center;
}

.odjava-opcija:hover {
  background-color: #c62828;
}

.glavni-sadrzaj {
  flex: 1;
  overflow-y: auto;
  background-color: #F1EFEC;
  padding-top: 70px;
}

.sadrzaj-omotac {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.zaglavlje-stranice {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid #D4C9BE;
}

.zaglavlje-stranice h1 {
  color: #123458;
  margin: 0;
  font-weight: 700;
  font-size: 1.8rem;
}

.galerija-sekcija {
  background-color: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid #D4C9BE;
}

.galerija-zaglavlje {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.galerija-sekcija h2 {
  color: #123458;
  margin: 0;
  font-weight: 600;
  font-size: 1.5rem;
  position: relative;
}

.galerija-sekcija h2::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 0;
  width: 80px;
  height: 3px;
  background-color: #123458;
  border-radius: 2px;
}

.galerija-akcije {
  display: flex;
  align-items: center;
}

.gumb-preuzmi-sve {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #123458;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  min-width: 200px;
  justify-content: center;
}

.gumb-preuzmi-sve:hover:not(:disabled) {
  background-color: #1c4c80;
  transform: translateY(-2px);
}

.gumb-preuzmi-sve:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.7;
}

.slike-mreza {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 25px;
  margin-top: 30px;
}

.slika-kartica {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 2px solid #123458;
  position: relative;
}

.slika-kartica:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(18, 52, 88, 0.15);
  border-color: #123458;
}

.slika-prekrivni-sloj {
  position: absolute;
  bottom: 10px;
  right: 10px;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.2s ease;
  display: flex;
  gap: 8px;
}

.slika-kartica:hover .slika-prekrivni-sloj {
  opacity: 1;
}

.prekrivni-gumb-preuzmi,
.prekrivni-gumb-komentar {
  background-color: rgba(18, 52, 88, 0.9);
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

.prekrivni-gumb-komentar {
  background-color: rgba(0, 123, 255, 0.9);
}

.prekrivni-gumb-preuzmi:hover {
  background-color: rgba(18, 52, 88, 1);
  transform: scale(1.1);
}

.prekrivni-gumb-komentar:hover {
  background-color: rgba(0, 123, 255, 1);
  transform: scale(1.1);
}

.slika-pregled-kontejner {
  cursor: pointer;
}

.slika-pregled {
  width: 100%;
  height: 220px;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.slika-kartica:hover .slika-pregled {
  transform: scale(1.05);
}

.slika-informacije {
  padding: 18px;
  background-color: #ffffff;
  border-top: 1px solid #123458;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.slika-informacije.ima-sadrzaj {
  min-height: 140px;
}

.slika-informacije.nema-sadrzaj {
  min-height: auto;
}

.slika-naziv {
  font-weight: 600;
  color: #123458;
  font-size: 1rem;
  margin: 0 0 8px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.slika-datum {
  font-size: 0.85rem;
  color: #123458;
  margin: 0;
  font-weight: 500;
}

.komentari-sekcija {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #D4C9BE;
}

.komentari-zaglavlje {
  margin-bottom: 10px;
}

.komentari-broj {
  font-weight: 600;
  color: #123458;
  font-size: 0.9rem;
}

.komentari-lista {
  max-height: 150px;
  overflow-y: auto;
  margin-bottom: 15px;
}

.komentar-stavka {
  background-color: white;
  border: 1px solid #D4C9BE;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 8px;
}

.komentar-zaglavlje {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 5px;
}

.komentar-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.komentar-akcije {
  display: flex;
  gap: 5px;
  opacity: 0;
  transition: opacity 0.2s;
}

.komentar-stavka:hover .komentar-akcije {
  opacity: 1;
}

.uredi-komentar-gumb,
.ukloni-komentar-gumb {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  border-radius: 3px;
  color: #6c757d;
  transition: all 0.2s;
}

.uredi-komentar-gumb:hover {
  background-color: #007bff;
  color: white;
}

.ukloni-komentar-gumb:hover {
  background-color: #dc3545;
  color: white;
}

.komentar-uredjen {
  font-size: 0.65rem;
  color: #6c757d;
  font-style: italic;
}

.uredi-komentar-forma {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.uredi-komentar-unos {
  border: 1px solid #D4C9BE;
  border-radius: 6px;
  padding: 8px;
  font-size: 0.8rem;
  resize: vertical;
  min-height: 40px;
  font-family: inherit;
}

.uredi-komentar-unos:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
}

.uredi-komentar-akcije {
  display: flex;
  gap: 8px;
}

.spremi-uredbu-gumb {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.spremi-uredbu-gumb:hover {
  background-color: #0056b3;
}

.otkazi-uredbu-gumb {
  background-color: transparent;
  color: #6c757d;
  border: 1px solid #D4C9BE;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.otkazi-uredbu-gumb:hover {
  background-color: #f8f9fa;
  border-color: #6c757d;
}

.komentar-autor {
  font-weight: 600;
  color: #123458;
  font-size: 0.8rem;
}

.komentar-datum {
  font-size: 0.7rem;
  color: #6c757d;
}

.komentar-tekst {
  margin: 0;
  color: #333;
  font-size: 0.85rem;
  line-height: 1.3;
}

.dodaj-komentar-forma {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #D4C9BE;
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: klizanjeDolje 0.3s ease;
}

.komentar-unos {
  border: 1px solid #D4C9BE;
  border-radius: 6px;
  padding: 10px;
  font-size: 0.85rem;
  resize: vertical;
  min-height: 50px;
  font-family: inherit;
}

.komentar-unos:focus {
  outline: none;
  border-color: #123458;
  box-shadow: 0 0 0 2px rgba(18, 52, 88, 0.1);
}

.komentar-forma-akcije {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.dodaj-komentar-gumb {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dodaj-komentar-gumb:hover:not(:disabled) {
  background-color: #0056b3;
}

.dodaj-komentar-gumb:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.otkazi-komentar-gumb {
  background-color: transparent;
  color: #6c757d;
  border: 1px solid #D4C9BE;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.otkazi-komentar-gumb:hover {
  background-color: #f8f9fa;
  border-color: #6c757d;
}

.prazno-stanje {
  text-align: center;
  padding: 80px 20px;
  color: #123458;
}

.prazno-ikona {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.6;
}

.prazno-stanje p {
  margin: 15px 0;
  font-size: 1.2rem;
  font-weight: 500;
}

.lightbox {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.95);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.lightbox-sadrzaj {
  position: relative;
  max-width: 90%;
  max-height: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.lightbox-zatvori {
  position: absolute;
  top: -50px;
  right: 0;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.2s;
}

.lightbox-zatvori:hover {
  background-color: rgba(255, 255, 255, 0.4);
}

.lightbox-slika {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.obavijest-preuzimanja {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #123458;
  color: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: klizanjeGore 0.3s ease;
  min-width: 280px;
}

@keyframes klizanjeGore {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.obavijest-preuzimanja p {
  margin: 0 0 10px 0;
  font-weight: 500;
  text-align: center;
}

.traka-napretka {
  width: 100%;
  height: 8px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  overflow: hidden;
}

.ispunjavanje-napretka {
  height: 100%;
  background-color: white;
  border-radius: 4px;
  transition: width 0.3s ease;
}


@media (max-width: 768px) {
  .sadrzaj-omotac {
    padding: 15px;
  }
  
  .zaglavlje-stranice {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .zaglavlje-stranice h1 {
    font-size: 1.5rem;
  }
  
  .slike-mreza {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }
  
  .galerija-sekcija {
    padding: 25px;
  }
  
  .galerija-zaglavlje {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .gumb-preuzmi-sve {
    width: 100%;
  }

  .slika-prekrivni-sloj {
    position: static;
    opacity: 1;
    display: flex;
    justify-content: center;
    margin: 10px 0;
    gap: 15px;
  }
}

@media (max-width: 480px) {
  .nadzorna-ploca {
    font-size: 14px;
  }

  .sadrzaj-omotac {
    padding: 10px;
  }

  .zaglavlje-stranice {
    padding: 15px;
    margin-bottom: 20px;
  }

  .zaglavlje-stranice h1 {
    font-size: 1.3rem;
  }

  .galerija-sekcija {
    padding: 20px 15px;
  }

  .slike-mreza {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
    margin-top: 20px;
  }
  
  .slika-pregled {
    height: 150px;
  }

  .profil-ikona {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }

  .profil-izbornik {
    width: 180px;
    font-size: 0.85rem;
  }

  .komentar-forma-akcije {
    flex-direction: column;
    gap: 8px;
  }

  .dodaj-komentar-gumb,
  .otkazi-komentar-gumb {
    width: 100%;
    text-align: center;
  }
}

.komentari-lista::-webkit-scrollbar {
  width: 4px;
}

.komentari-lista::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.komentari-lista::-webkit-scrollbar-thumb {
  background: #123458;
  border-radius: 2px;
}

.komentari-lista::-webkit-scrollbar-thumb:hover {
  background: #1c4c80;
}

.prekrivni-gumb-preuzmi:focus,
.prekrivni-gumb-komentar:focus,
.profil-ikona:focus,
.lightbox-zatvori:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

.dodaj-komentar-gumb:focus,
.otkazi-komentar-gumb:focus,
.spremi-uredbu-gumb:focus,
.otkazi-uredbu-gumb:focus {
  outline: 2px solid #007bff;
  outline-offset: 1px;
}

@media print {
  .gornja-traka,
  .obavijest-preuzimanja,
  .lightbox,
  .slika-prekrivni-sloj,
  .komentar-forma-akcije {
    display: none !important;
  }

  .nadzorna-ploca {
    height: auto;
  }

  .glavni-sadrzaj {
    padding-top: 0;
  }
}

@media (prefers-contrast: high) {
  .slika-kartica {
    border-width: 3px;
    border-color: #000;
  }

  .prekrivni-gumb-preuzmi,
  .prekrivni-gumb-komentar {
    background-color: rgba(0, 0, 0, 0.9);
    border: 2px solid #fff;
  }
}

@media (prefers-reduced-motion: reduce) {
  .slika-kartica,
  .slika-pregled,
  .prekrivni-gumb-preuzmi,
  .prekrivni-gumb-komentar,
  .gumb-preuzmi-sve,
  .profil-ikona,
  .ispunjavanje-napretka {
    transition: none !important;
    animation: none !important;
  }

  .slika-kartica:hover {
    transform: none !important;
  }

  .slika-kartica:hover .slika-pregled {
    transform: none !important;
  }
}
</style>