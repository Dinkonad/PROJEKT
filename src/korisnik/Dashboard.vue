<template>
  <div class="dashboard-container">

    <div class="gornja-traka">
      <div class="traka-sadrzaj">
        <div class="profil-padajuci">
          <div class="profil-ikona" @click="promijeniProfilMenu">
            {{ korisnikInicijali }}
          </div>
          <div class="profil-izbornik" v-if="prikaziProfilMenu">
            <div class="korisnik-email">{{ userEmail }}</div>
            <div class="izbornik-opcija odjava-opcija" @click="odjava">Odjava</div>
          </div>
        </div>
      </div>
    </div>

    <div class="glavni-sadrzaj">
      <div class="content-wrapper">
        <div class="page-header">
          <h1>Dobrodošli, {{ userEmail }}</h1>
        </div>

        <div class="gallery-section">
          <div class="gallery-header">
            <h2>Moje fotografije</h2>
            <div class="gallery-actions">
              <button @click="downloadAllImages" class="btn-download-all" :disabled="myImages.length === 0 || downloadingAll">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                {{ downloadingAll ? `Preuzimanje ${downloadProgress}/${myImages.length}` : `Preuzmi sve (${myImages.length})` }}
              </button>
            </div>
          </div>
          <div v-if="myImages.length > 0" class="images-grid">
            <div 
              v-for="(image, index) in myImages" 
              :key="index"
              class="image-card"
            >
         
              <div class="image-overlay">
                <button @click.stop="downloadImage(image)" class="overlay-download-btn" title="Preuzmi sliku">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </button>
                <button @click.stop="toggleCommentForm(image.fileName)" class="overlay-comment-btn" title="Dodaj komentar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14M5 12h14"></path>
                  </svg>
                </button>
              </div>
              
              <div class="image-preview-container" @click="openLightbox(image)">
                <img 
                  v-if="image.publicUrl"
                  :src="image.publicUrl" 
                  :alt="image.fileName"
                  class="image-preview"
                  @error="handleImageError"
                />
              </div>
              <div class="image-info" :class="{ 'has-content': getImageComments(image).length > 0 || activeCommentForm === image.fileName, 'no-content': getImageComments(image).length === 0 && activeCommentForm !== image.fileName }">
                <p class="image-name">{{ image.fileName }}</p>
                <p class="image-date">{{ formatDate(image.uploadedAt) }}</p>
                
          
                <div v-if="getImageComments(image).length > 0" class="comments-section">
                  <div class="comments-header">
                    <span class="comments-count">
                      Komentari ({{ getImageComments(image).length }})
                    </span>
                  </div>
                  
                  <div class="comments-list">
                    <div 
                      v-for="komentar in getImageComments(image)" 
                      :key="komentar.id"
                      class="comment-item"
                    >
                      <div v-if="editingComment === komentar.id" class="edit-comment-form">
                        <textarea 
                          v-model="editCommentText"
                          class="edit-comment-input"
                          rows="2"
                        ></textarea>
                        <div class="edit-comment-actions">
                          <button @click="saveEditComment(komentar)" class="save-edit-btn">Spremi</button>
                          <button @click="cancelEditComment" class="cancel-edit-btn">Otkazi</button>
                        </div>
                      </div>
                      <div v-else>
                        <div class="comment-header">
                          <div class="comment-meta">
                            <span class="comment-author">{{ komentar.authorEmail }}</span>
                            <span class="comment-date">{{ formatDate(komentar.timestamp) }}</span>
                            <span v-if="komentar.editedAt" class="comment-edited">(uređeno)</span>
                          </div>
                          <div v-if="komentar.authorEmail === userEmail" class="comment-actions">
                            <button @click="startEditComment(komentar)" class="edit-comment-btn" title="Uredi">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                            <button @click="deleteComment(komentar.id)" class="delete-comment-btn" title="Obriši">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                        <p class="comment-text">{{ komentar.text }}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
              
                <div v-if="activeCommentForm === image.fileName" class="add-comment-form">
                  <textarea 
                    :value="newComments[image.fileName] || ''"
                    @input="updateComment(image.fileName, $event.target.value)"
                    placeholder="Dodajte komentar..."
                    class="comment-input"
                    rows="2"
                    @keydown.enter.ctrl="addComment(image, $event)"
                    ref="commentInput"
                  ></textarea>
                  <div class="comment-form-actions">
                    <button 
                      @click="addComment(image)"
                      class="add-comment-btn"
                      :disabled="!newComments[image.fileName] || newComments[image.fileName].trim() === ''"
                    >
                      Dodaj
                    </button>
                    <button 
                      @click="cancelComment(image.fileName)"
                      class="cancel-comment-btn"
                    >
                      Otkazi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <div class="empty-icon">📷</div>
            <p>Nemate uploadanih fotografija</p>
            <p class="empty-subtitle">Idite na stranicu za upload kako biste dodali nove fotografije</p>
          </div>
        </div>
      </div>
    </div>
    

    <div v-if="selectedImage" class="lightbox" @click="closeLightbox">
      <div class="lightbox-content" @click.stop>
        <button @click="closeLightbox" class="lightbox-close">✕</button>
        <img :src="selectedImage.publicUrl" :alt="selectedImage.fileName" class="lightbox-image">
      </div>
    </div>
    

    <div v-if="downloadingAll" class="download-notification">
      <p>Preuzimanje {{ downloadProgress }}/{{ myImages.length }} slika...</p>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: (downloadProgress / myImages.length) * 100 + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../store/auth'

const router = useRouter()
const { state: authState, logout: authLogout } = useAuth()

const myImages = ref([])
const selectedImage = ref(null)
const prikaziProfilMenu = ref(false)
const downloadingAll = ref(false)
const downloadProgress = ref(0)
const comments = ref([])
const newComments = ref({})
const activeCommentForm = ref(null) 
const editingComment = ref(null) 
const editCommentText = ref('') 

const userEmail = computed(() => {
  return authState.currentUser?.email || 'Nepoznat korisnik'
})

const isLoggedIn = computed(() => {
  return authState.isLoggedIn
})

const isLoading = computed(() => {
  return authState.loading
})

const korisnikInicijali = computed(() => {
  return userEmail.value.charAt(0).toUpperCase()
})

const getImageComments = (image) => {
  return comments.value.filter(comment => comment.imageFileName === image.fileName)
}

const updateComment = (fileName, value) => {
  newComments.value[fileName] = value
}

const toggleCommentForm = async (fileName) => {
  if (activeCommentForm.value === fileName) {

    activeCommentForm.value = null
  } else {
    activeCommentForm.value = fileName
    await nextTick()
    const textarea = document.querySelector('.comment-input')
    if (textarea) {
      textarea.focus()
    }
  }
}

const cancelComment = (fileName) => {
  activeCommentForm.value = null
  newComments.value[fileName] = ''
}

const startEditComment = (comment) => {
  editingComment.value = comment.id
  editCommentText.value = comment.text
}

const cancelEditComment = () => {
  editingComment.value = null
  editCommentText.value = ''
}

const saveEditComment = (comment) => {
  if (!editCommentText.value || editCommentText.value.trim() === '') return
  
  comment.text = editCommentText.value.trim()
  comment.editedAt = new Date()
  saveComments()
  editingComment.value = null
  editCommentText.value = ''
}

const deleteComment = (commentId) => {
  const index = comments.value.findIndex(c => c.id === commentId)
  if (index > -1) {
    comments.value.splice(index, 1)
    saveComments()
  }
}

const addComment = (image, event = null) => {
  if (event) {
    event.preventDefault()
  }
  
  const commentText = newComments.value[image.fileName]
  if (!commentText || commentText.trim() === '') return
  
  const newComment = {
    id: Date.now() + Math.random(),
    imageFileName: image.fileName,
    text: commentText.trim(),
    authorEmail: userEmail.value,
    timestamp: new Date(),
    imageOwnerEmail: image.userEmail
  }
  
  comments.value.push(newComment)
  saveComments()
  newComments.value[image.fileName] = ''
  activeCommentForm.value = null 
}

const loadComments = () => {
  try {
    const savedComments = localStorage.getItem('image_comments')
    if (savedComments) {
      comments.value = JSON.parse(savedComments).map(comment => ({
        ...comment,
        timestamp: new Date(comment.timestamp)
      }))
    }
  } catch (error) {
    console.error('Greška pri učitavanju komentara:', error)
    comments.value = []
  }
}

const saveComments = () => {
  try {
    localStorage.setItem('image_comments', JSON.stringify(comments.value))
  } catch (error) {
    console.error('Greška pri spremanju komentara:', error)
  }
}

const odjava = async () => {
  try {
    prikaziProfilMenu.value = false
    await authLogout()
    router.push('/login')
  } catch (error) {
    console.error('Greška prilikom odjave:', error)
  }
}

const promijeniProfilMenu = () => {
  prikaziProfilMenu.value = !prikaziProfilMenu.value
}

const handleClickOutside = (event) => {
  const profilContainer = document.querySelector('.profil-padajuci')
  if (profilContainer && !profilContainer.contains(event.target)) {
    prikaziProfilMenu.value = false
  }
}

const handleImageError = (event) => {
  console.error('Greška učitavanja slike:', event.target.src)
  event.target.style.display = 'none'
}

const refreshImages = () => {
  loadImages()
}

const openLightbox = (image) => {
  selectedImage.value = image
  document.body.style.overflow = 'hidden'
}

const closeLightbox = () => {
  selectedImage.value = null
  document.body.style.overflow = 'auto'
}

const downloadImage = (image) => {
  try {
    downloadImageAsBlob(image)
  } catch (error) {
    console.error('Greška pri preuzimanju:', error)
    window.open(image.publicUrl, '_blank')
  }
}

const downloadImageAsBlob = async (image) => {
  try {
    const response = await fetch(image.publicUrl, {
      mode: 'cors',
      method: 'GET'
    })
    
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    
    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = image.fileName || 'slika.jpg'
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl)
    }, 100)
    
  } catch (error) {
    downloadImageViaCanvas(image)
  }
}

const downloadImageViaCanvas = (image) => {
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
          link.download = image.fileName || 'slika.jpg'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        }, 'image/jpeg', 0.95)
        
      } catch (canvasError) {
        downloadImageFallback(image)
      }
    }
    
    img.onerror = () => {
      downloadImageFallback(image)
    }
    
    img.src = image.publicUrl
    
  } catch (error) {
    downloadImageFallback(image)
  }
}

const downloadImageFallback = (image) => {
  const link = document.createElement('a')
  link.href = image.publicUrl
  link.download = image.fileName || 'slika.jpg'
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  
  const url = new URL(image.publicUrl)
  url.searchParams.append('download', 'true')
  url.searchParams.append('filename', image.fileName)
  link.href = url.toString()
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const downloadAllImages = async () => {
  if (myImages.value.length === 0 || downloadingAll.value) {
    return
  }

  downloadingAll.value = true
  downloadProgress.value = 0

  try {
    for (let i = 0; i < myImages.value.length; i++) {
      const image = myImages.value[i]
      downloadProgress.value = i + 1
      
      try {
        await downloadSingleImageForBatch(image, i)
      
        await new Promise(resolve => setTimeout(resolve, 800))
      } catch (error) {
        console.error(`Greška pri preuzimanju slike ${image.fileName}:`, error)
      }
    }
  } catch (error) {
    console.error('Greška pri preuzimanju svih slika:', error)
  } finally {
    downloadingAll.value = false
    downloadProgress.value = 0
  }
}

const downloadSingleImageForBatch = async (image, index) => {
  try {
    const response = await fetch(image.publicUrl, {
      mode: 'cors',
      method: 'GET'
    })
    
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    
    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const fileName = `${String(index + 1).padStart(3, '0')}_${image.fileName}`
    
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = fileName
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl)
    }, 1000)
    
  } catch (error) {
    downloadImageFallback(image)
  }
}

const formatDate = (timestamp) => {
  if (!timestamp) return 'Nepoznat datum'
  
  try {
    const date = timestamp instanceof Date ? timestamp : 
                timestamp.seconds ? new Date(timestamp.seconds * 1000) : 
                new Date(timestamp)
                
    return date.toLocaleDateString('hr-HR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return 'Greška datuma'
  }
}

const formatFileSize = (bytes) => {
  if (!bytes) return ''
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const loadImages = () => {
  try {
    if (!userEmail.value || userEmail.value === 'Nepoznat korisnik') {
      myImages.value = []
      return
    }
    
    const localStorageData = localStorage.getItem('uploadani_mediji')
    
    if (localStorageData) {
      const allImages = JSON.parse(localStorageData)
      
      myImages.value = allImages.filter(img => {
        return img.userEmail === userEmail.value
      })
    } else {
      myImages.value = []
    }
    
  } catch (error) {
    console.error('Greška pri učitavanju slika:', error)
    myImages.value = []
  }
}

onMounted(() => {
  loadImages()
  loadComments()

  newComments.value = {}
  
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  document.body.style.overflow = 'auto'
})
</script>

<style scoped>
.dashboard-container {
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
  animation: slideDown 0.3s ease;
  border: 1px solid #D4C9BE;
}

@keyframes slideDown {
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

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
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

.page-header h1 {
  color: #123458;
  margin: 0;
  font-weight: 700;
  font-size: 1.8rem;
}

.gallery-section {
  background-color: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid #D4C9BE;
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.gallery-section h2 {
  color: #123458;
  margin: 0;
  font-weight: 600;
  font-size: 1.5rem;
  position: relative;
}

.gallery-section h2::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 0;
  width: 80px;
  height: 3px;
  background-color: #123458;
  border-radius: 2px;
}

.gallery-actions {
  display: flex;
  align-items: center;
}

.btn-download-all {
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

.btn-download-all:hover:not(:disabled) {
  background-color: #1c4c80;
  transform: translateY(-2px);
}

.btn-download-all:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.7;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 25px;
  margin-top: 30px;
}

.image-card {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 2px solid #123458;
  position: relative;
}

.image-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(18, 52, 88, 0.15);
  border-color: #123458;
}

.image-overlay {
  position: absolute;
  bottom: 10px;
  right: 10px;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.2s ease;
  display: flex;
  gap: 8px;
}

.image-card:hover .image-overlay {
  opacity: 1;
}

.overlay-download-btn,
.overlay-comment-btn {
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

.overlay-comment-btn {
  background-color: rgba(0, 123, 255, 0.9);
}

.overlay-download-btn:hover {
  background-color: rgba(18, 52, 88, 1);
  transform: scale(1.1);
}

.overlay-comment-btn:hover {
  background-color: rgba(0, 123, 255, 1);
  transform: scale(1.1);
}

.image-preview-container {
  cursor: pointer;
}

.image-preview {
  width: 100%;
  height: 220px;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.image-card:hover .image-preview {
  transform: scale(1.05);
}

.image-info {
  padding: 18px;
  background-color: #ffffff;
  border-top: 1px solid #123458;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.image-info.has-content {
  min-height: 140px;
}

.image-info.no-content {
  min-height: auto;
}

.image-name {
  font-weight: 600;
  color: #123458;
  font-size: 1rem;
  margin: 0 0 8px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-date {
  font-size: 0.85rem;
  color: #123458;
  margin: 0;
  font-weight: 500;
}

.image-info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.comments-section {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #D4C9BE;
}

.comments-header {
  margin-bottom: 10px;
}

.comments-count {
  font-weight: 600;
  color: #123458;
  font-size: 0.9rem;
}

.comments-list {
  max-height: 150px;
  overflow-y: auto;
  margin-bottom: 15px;
}

.comment-item {
  background-color: white;
  border: 1px solid #D4C9BE;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 8px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 5px;
}

.comment-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.comment-actions {
  display: flex;
  gap: 5px;
  opacity: 0;
  transition: opacity 0.2s;
}

.comment-item:hover .comment-actions {
  opacity: 1;
}

.edit-comment-btn,
.delete-comment-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  border-radius: 3px;
  color: #6c757d;
  transition: all 0.2s;
}

.edit-comment-btn:hover {
  background-color: #007bff;
  color: white;
}

.delete-comment-btn:hover {
  background-color: #dc3545;
  color: white;
}

.comment-edited {
  font-size: 0.65rem;
  color: #6c757d;
  font-style: italic;
}

.edit-comment-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-comment-input {
  border: 1px solid #D4C9BE;
  border-radius: 6px;
  padding: 8px;
  font-size: 0.8rem;
  resize: vertical;
  min-height: 40px;
  font-family: inherit;
}

.edit-comment-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
}

.edit-comment-actions {
  display: flex;
  gap: 8px;
}

.save-edit-btn {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-edit-btn:hover {
  background-color: #0056b3;
}

.cancel-edit-btn {
  background-color: transparent;
  color: #6c757d;
  border: 1px solid #D4C9BE;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-edit-btn:hover {
  background-color: #f8f9fa;
  border-color: #6c757d;
}

.comment-author {
  font-weight: 600;
  color: #123458;
  font-size: 0.8rem;
}

.comment-date {
  font-size: 0.7rem;
  color: #6c757d;
}

.comment-text {
  margin: 0;
  color: #333;
  font-size: 0.85rem;
  line-height: 1.3;
}

.add-comment-form {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #D4C9BE;
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: slideDown 0.3s ease;
}

.comment-input {
  border: 1px solid #D4C9BE;
  border-radius: 6px;
  padding: 10px;
  font-size: 0.85rem;
  resize: vertical;
  min-height: 50px;
  font-family: inherit;
}

.comment-input:focus {
  outline: none;
  border-color: #123458;
  box-shadow: 0 0 0 2px rgba(18, 52, 88, 0.1);
}

.comment-form-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.add-comment-btn {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-comment-btn:hover:not(:disabled) {
  background-color: #0056b3;
}

.add-comment-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.cancel-comment-btn {
  background-color: transparent;
  color: #6c757d;
  border: 1px solid #D4C9BE;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-comment-btn:hover {
  background-color: #f8f9fa;
  border-color: #6c757d;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #123458;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.6;
}

.empty-state p {
  margin: 15px 0;
  font-size: 1.2rem;
  font-weight: 500;
}

.empty-subtitle {
  color: #6c757d !important;
  font-size: 1rem !important;
  font-weight: 400 !important;
  margin-top: 20px !important;
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

.lightbox-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.lightbox-close {
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

.lightbox-close:hover {
  background-color: rgba(255, 255, 255, 0.4);
}

.lightbox-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}



.download-notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #123458;
  color: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: slideInUp 0.3s ease;
  min-width: 280px;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.download-notification p {
  margin: 0 0 10px 0;
  font-weight: 500;
  text-align: center;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: white;
  border-radius: 4px;
  transition: width 0.3s ease;
}

@media (max-width: 768px) {
  .content-wrapper {
    padding: 15px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .page-header h1 {
    font-size: 1.5rem;
  }
  
  .images-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }
  
  .gallery-section {
    padding: 25px;
  }
  
  .gallery-section h2 {
    font-size: 1.3rem;
  }
  
  .gornja-traka {
    height: 55px;
  }
  
  .glavni-sadrzaj {
    padding-top: 65px;
  }

  .gallery-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .btn-download-all {
    width: 100%;
  }

  .lightbox-image {
    max-height: 70vh;
  }

  .image-overlay {
    position: static;
    opacity: 1;
    display: flex;
    justify-content: center;
    margin: 10px 0;
    gap: 15px;
  }

  .overlay-download-btn,
  .overlay-comment-btn {
    position: static;
    transform: none !important;
  }
}

@media (max-width: 480px) {
  .images-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
  }
  
  .image-preview {
    height: 150px;
  }
  
  .profil-izbornik {
    width: 180px;
  }

  .download-notification {
    left: 20px;
    right: 20px;
    min-width: auto;
  }

  .lightbox-image {
    max-height: 60vh;
  }

  .comment-actions {
    flex-direction: column;
  }

  .add-comment-btn,
  .cancel-comment-btn {
    width: 100%;
  }
} </style> 