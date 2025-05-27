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

.modal-potvrda {
  background-color: #F1EFEC;
  border-radius: 12px;
  padding: 0;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.modal-zaglavlje {
  background-color: #123458;
  color: #F1EFEC;
  padding: 16px 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-zaglavlje h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
}.modal-potvrda {
  background-color: #F1EFEC;
  border-radius: 12px;
  padding: 0;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.potvrda-sadrzaj {
  padding: 24px;
  text-align: center;
}

.potvrda-sadrzaj .upozorenje {
  font-size: 48px;
  color: #E53935;
  margin-bottom: 16px;
}

.potvrda-sadrzaj p {
  margin: 0 0 24px 0;
  font-size: 18px;
  color: #030303;
}

.potvrda-gumbi {
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
  font-size: 14px;
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

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}.btn-delete {
  background: #E53935;
  color: white;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
}<template>
  <div class="calendar-container">
    <!-- Header -->
    <div class="calendar-header">
      <h2>Kalendar</h2>
      <button @click="showAddEventModal = true" class="btn-add-event">
        + Dodaj događaj
      </button>
    </div>

    <!-- Calendar Navigation -->
    <div class="calendar-nav">
      <button @click="previousMonth" class="nav-btn">&lt;</button>
      <h3>{{ currentMonthYear }}</h3>
      <button @click="nextMonth" class="nav-btn">&gt;</button>
    </div>

    <!-- Calendar Grid -->
    <div class="calendar-grid">
      <!-- Days of week headers -->
      <div class="day-header" v-for="day in daysOfWeek" :key="day">
        {{ day }}
      </div>
      
      <!-- Calendar days -->
      <div 
        v-for="day in calendarDays" 
        :key="day.date"
        :class="['calendar-day', {
          'other-month': !day.isCurrentMonth,
          'today': day.isToday,
          'has-events': day.events.length > 0,
          [`event-${day.events[0]?.color}`]: day.events.length > 0
        }]"
        @click="selectDay(day)"
      >
        <span class="day-number">{{ day.dayNumber }}</span>
        <div class="events-preview">
          <div 
            v-for="event in day.events.slice(0, 2)" 
            :key="event.id"
            :class="['event-dot', `event-${event.color}`]"
            :title="event.client"
          >
            {{ event.client.substring(0, 12) }}{{ event.client.length > 12 ? '...' : '' }}
          </div>
          <div v-if="day.events.length > 2" class="more-events">
            +{{ day.events.length - 2 }} više
          </div>
        </div>
      </div>
    </div>

    <!-- Events list for selected day -->
    <div v-if="selectedDay" class="selected-day-events">
      <h3>Događaji za {{ formatDate(selectedDay.date) }}</h3>
      <div v-if="selectedDay.events.length === 0" class="no-events">
        Nema događaja za ovaj dan
      </div>
      <div v-else>
        <div 
          v-for="event in selectedDay.events" 
          :key="event.id"
          :class="['event-item', `event-${event.color}`]"
        >
          <div class="event-details">
            <div class="event-client">{{ event.client }}</div>
            <div class="event-dates">
              <span v-if="event.startDate === event.endDate">
                {{ formatDate(event.startDate) }}
              </span>
              <span v-else>
                {{ formatDate(event.startDate) }} - {{ formatDate(event.endDate) }}
              </span>
            </div>
            <div class="event-description">{{ event.description }}</div>
          </div>
          <div class="event-actions">
            <button 
              @click="editEvent(event)" 
              class="btn-edit"
              style="display: flex; align-items: center; gap: 6px; padding: 8px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1); background-color: #123458; color: #F1EFEC;"
              onmouseover="this.style.backgroundColor='#1c4c80'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(18, 52, 88, 0.2)';"
              onmouseout="this.style.backgroundColor='#123458'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)';"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Uredi
            </button>
            <button 
              @click="deleteEvent(event.id)" 
              class="btn-delete"
              style="display: flex; align-items: center; gap: 6px; padding: 8px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1); background-color: #f44336; color: white;"
              onmouseover="this.style.backgroundColor='#f56358'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(245, 99, 88, 0.2)';"
              onmouseout="this.style.backgroundColor='#f44336'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)';"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              Obriši
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Event Modal -->
    <div v-if="showAddEventModal || editingEvent" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingEvent ? 'Uredi događaj' : 'Dodaj novi događaj' }}</h3>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        
        <form @submit.prevent="saveEvent" class="event-form">
          <div class="form-group">
            <label>Klijent:</label>
            <input 
              v-model="eventForm.client" 
              type="text" 
              required 
              placeholder="Ime i prezime klijenta"
            >
          </div>

          <div class="form-group">
            <label>Početni datum:</label>
            <input 
              v-model="eventForm.startDate" 
              type="date" 
              required
            >
          </div>

          <div class="form-group">
            <label>Završni datum:</label>
            <input 
              v-model="eventForm.endDate" 
              type="date" 
              required
            >
          </div>

          <div class="form-group">
            <label>Boja pozadine:</label>
            <div class="color-options">
              <label v-for="color in colorOptions" :key="color.value" class="color-option">
                <input 
                  type="radio" 
                  :value="color.value" 
                  v-model="eventForm.color"
                  required
                >
                <span :class="['color-preview', `color-${color.value}`]">{{ color.label }}</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>Opis:</label>
            <textarea 
              v-model="eventForm.description" 
              placeholder="Detalji o događaju..."
              rows="4"
              required
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn-cancel">Odustani</button>
            <button type="submit" class="btn-save">
              {{ editingEvent ? 'Spremi promjene' : 'Dodaj događaj' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    <!-- Modal za brisanje događaja -->
    <Transition name="fade">
      <div 
        v-if="eventToDelete" 
        class="pozadina" 
        @click="cancelDelete"
        style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(3, 3, 3, 0.7); display: flex; justify-content: center; align-items: center; z-index: 1000;"
      >
        <div 
          class="modal-potvrda" 
          @click.stop
          style="background-color: #F1EFEC; border-radius: 12px; padding: 0; width: 500px; max-width: 90%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); overflow: hidden;"
        >
          <div 
            class="modal-zaglavlje"
            style="background-color: #123458; color: #F1EFEC; padding: 16px 24px; display: flex; justify-content: center; align-items: center;"
          >
            <h2 style="margin: 0; font-size: 20px; font-weight: 500;">Potvrda brisanja</h2>
          </div>
          <div 
            class="potvrda-sadrzaj"
            style="padding: 24px; text-align: center;"
          >
            <span 
              class="material-icons upozorenje" 
              style="font-size: 48px; color: #E53935; margin-bottom: 16px; display: block;"
            >warning</span>
            <p style="margin: 0 0 24px 0; font-size: 18px; color: #030303;">Jeste li sigurni da želite obrisati ovaj događaj?</p>
          </div>
          <div 
            class="potvrda-gumbi"
            style="display: flex; justify-content: center; gap: 12px; padding: 0 24px 24px;"
          >
            <button 
              class="gumb-odustani" 
              @click="cancelDelete"
              style="padding: 10px 20px; border-radius: 6px; border: none; font-weight: 500; cursor: pointer; font-size: 14px; background-color: #D4C9BE; color: #123458; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
              onmouseover="this.style.backgroundColor='#c5b7a9'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(197, 183, 169, 0.2)';"
              onmouseout="this.style.backgroundColor='#D4C9BE'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)';"
            >Odustani</button>
            <button 
              class="gumb-potvrdi" 
              @click="confirmDelete"
              style="padding: 10px 20px; border-radius: 6px; border: none; font-weight: 500; cursor: pointer; font-size: 14px; background-color: #f44336; color: #F1EFEC; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
              onmouseover="this.style.backgroundColor='#f56358'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(245, 99, 88, 0.2)';"
              onmouseout="this.style.backgroundColor='#f44336'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)';"
            >Potvrdi</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script>
export default {
  name: 'aKalendar',
  data() {
    return {
      currentDate: new Date(),
      selectedDay: null,
      showAddEventModal: false,
      editingEvent: null,
      daysOfWeek: ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'],
      colorOptions: [
        { value: 'yellow', label: 'Žuta' },
        { value: 'green', label: 'Zelena' },
        { value: 'blue', label: 'Plava' },
        { value: 'orange', label: 'Narančasta' },
        { value: 'purple', label: 'Ljubičasta' },
        { value: 'red', label: 'Crvena' },
        { value: 'teal', label: 'Tirkizna' },
        { value: 'pink', label: 'Rožičasta' }
      ],
      events: JSON.parse(localStorage.getItem('calendar-events')) || [],
      eventToDelete: null,
      eventForm: {
        client: '',
        startDate: '',
        endDate: '',
        color: 'blue',
        description: ''
      }
    };
  },

  computed: {
    currentMonthYear() {
      return this.currentDate.toLocaleDateString('hr-HR', { 
        month: 'long', 
        year: 'numeric' 
      });
    },

    calendarDays() {
      const year = this.currentDate.getFullYear();
      const month = this.currentDate.getMonth();
      
      const today = new Date();
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // Početak kalendara - prva ćelija
      const firstDayOfMonth = new Date(year, month, 1);
      let startDate = new Date(firstDayOfMonth);
      
      // Pomjerimo na početak tjedna (ponedjeljak)
      const dayOfWeek = firstDayOfMonth.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate.setDate(firstDayOfMonth.getDate() - daysToSubtract);
      
      const calendarDays = [];
      
      // Generiraj 42 dana (6 tjedana × 7 dana)
      for (let i = 0; i < 42; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        const isCurrentMonth = currentDate.getMonth() === month;
        const isToday = dateString === todayString;
        
        calendarDays.push({
          date: dateString,
          dayNumber: currentDate.getDate(),
          isCurrentMonth,
          isToday,
          events: this.getEventsForDate(dateString)
        });
        
        // Debug za danas
        if (isToday) {
          console.log(`Pozicija ${i}: ${dateString} = TODAY (dan u tjednu: ${currentDate.getDay()})`);
        }
      }
      
      return calendarDays;
    }
  },

  methods: {
    createDayObject(date, isCurrentMonth) {
      const dateString = date.toISOString().split('T')[0];
      // DIREKTNO: 27. svibnja 2025 = danas
      const isToday = dateString === '2025-05-27';
      
      console.log(`Dan: ${dateString}, isToday: ${isToday}`);
      
      return {
        date: dateString,
        dayNumber: date.getDate(),
        isCurrentMonth,
        isToday: isToday,
        events: this.getEventsForDate(dateString)
      };
    },

    getEventsForDate(dateString) {
      return this.events.filter(event => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        const currentDate = new Date(dateString);
        
        return currentDate >= eventStart && currentDate <= eventEnd;
      });
    },

    previousMonth() {
      this.currentDate = new Date(
        this.currentDate.getFullYear(), 
        this.currentDate.getMonth() - 1, 
        1
      );
      this.selectedDay = null;
    },

    nextMonth() {
      this.currentDate = new Date(
        this.currentDate.getFullYear(), 
        this.currentDate.getMonth() + 1, 
        1
      );
      this.selectedDay = null;
    },

    selectDay(day) {
      this.selectedDay = day;
    },

    closeModal() {
      this.showAddEventModal = false;
      this.editingEvent = null;
      this.resetEventForm();
    },

    resetEventForm() {
      this.eventForm = {
        client: '',
        startDate: '',
        endDate: '',
        color: 'blue',
        description: ''
      };
    },

    editEvent(event) {
      this.editingEvent = event;
      this.eventForm = { ...event };
    },

    saveEvent() {
      // Provjeri da završni datum nije prije početnog
      if (new Date(this.eventForm.endDate) < new Date(this.eventForm.startDate)) {
        alert('Završni datum ne može biti prije početnog datuma!');
        return;
      }

      if (this.editingEvent) {
        // Uredi postojeći događaj
        const index = this.events.findIndex(e => e.id === this.editingEvent.id);
        if (index !== -1) {
          this.events[index] = { ...this.eventForm, id: this.editingEvent.id };
        }
      } else {
        // Dodaj novi događaj
        const newEvent = {
          ...this.eventForm,
          id: Date.now() // Jednostavan ID generator
        };
        this.events.push(newEvent);
      }
      
      // Spremi u localStorage
      this.saveToLocalStorage();
      
      this.closeModal();
      
      // Ažuriraj selectedDay ako je potrebno
      if (this.selectedDay) {
        this.selectedDay.events = this.getEventsForDate(this.selectedDay.date);
      }
    },

    deleteEvent(eventId) {
      this.eventToDelete = eventId;
    },

    confirmDelete() {
      if (this.eventToDelete) {
        this.events = this.events.filter(event => event.id !== this.eventToDelete);
        
        // Spremi u localStorage
        this.saveToLocalStorage();
        
        if (this.selectedDay) {
          this.selectedDay.events = this.getEventsForDate(this.selectedDay.date);
        }
        
        this.eventToDelete = null;
      }
    },

    cancelDelete() {
      this.eventToDelete = null;
    },

    saveToLocalStorage() {
      localStorage.setItem('calendar-events', JSON.stringify(this.events));
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('hr-HR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  },

  watch: {
    'eventForm.startDate'(newStartDate) {
      // Automatski postavi završni datum na isti dan ako nije postavljen
      if (newStartDate && !this.eventForm.endDate) {
        this.eventForm.endDate = newStartDate;
      }
      // Ako je završni datum prije početnog, postavi ga na početni datum
      if (newStartDate && this.eventForm.endDate && new Date(this.eventForm.endDate) < new Date(newStartDate)) {
        this.eventForm.endDate = newStartDate;
      }
    }
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');

.calendar-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Roboto', sans-serif;
  color: #030303;
  background-color: #F1EFEC;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.calendar-header h2 {
  margin: 0;
  color: #123458;
  font-size: 24px;
  font-weight: 700;
  position: relative;
}

.calendar-header h2::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 40px;
  height: 3px;
  background-color: #123458;
  border-radius: 2px;
}

.btn-add-event {
  background-color: #123458;
  color: #F1EFEC;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn-add-event:hover {
  background-color: #1c4c80;
  transform: translateY(-1px);
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15);
}

.calendar-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.calendar-nav h3 {
  margin: 0;
  color: #123458;
  font-size: 20px;
  font-weight: 500;
  text-transform: capitalize;
}

.nav-btn {
  background: #D4C9BE;
  border: 1px solid #D4C9BE;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  color: #123458;
}

.nav-btn:hover {
  background: #123458;
  color: #F1EFEC;
  border-color: #123458;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #D4C9BE;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.day-header {
  background: #123458;
  color: #F1EFEC;
  padding: 12px 5px;
  text-align: center;
  font-weight: 500;
  font-size: 14px;
  text-transform: uppercase;
}

.calendar-day {
  background: white;
  min-height: 80px;
  padding: 8px;
  cursor: pointer;
  position: relative;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.calendar-day:hover {
  background: rgba(212, 201, 190, 0.1);
}

.calendar-day.other-month {
  background: #F1EFEC;
  color: #5D8AA8;
}

.calendar-day.today {
  background: #ffebee !important;
  border: 2px solid #ef5350 !important;
}

.calendar-day.has-events {
  border-left: 4px solid;
}

.calendar-day.has-events.event-yellow {
  border-left-color: #ffc107;
}

.calendar-day.has-events.event-green {
  border-left-color: #4caf50;
}

.calendar-day.has-events.event-blue {
  border-left-color: #2196f3;
}

.calendar-day.has-events.event-orange {
  border-left-color: #ff9800;
}

.calendar-day.has-events.event-purple {
  border-left-color: #9c27b0;
}

.calendar-day.has-events.event-red {
  border-left-color: #f44336;
}

.calendar-day.has-events.event-teal {
  border-left-color: #009688;
}

.calendar-day.has-events.event-pink {
  border-left-color: #e91e63;
}

.day-number {
  font-weight: 500;
  font-size: 16px;
  margin-bottom: 4px;
  color: #123458;
}

.calendar-day.today .day-number {
  color: #d32f2f !important;
  font-weight: 700 !important;
}

.events-preview {
  flex: 1;
}

.event-dot {
  color: white;
  font-size: 10px;
  padding: 2px 4px;
  margin: 1px 0;
  border-radius: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.event-yellow { background: #ffc107; color: #000; }
.event-green { background: #4caf50; }
.event-blue { background: #2196f3; }
.event-orange { background: #ff9800; }
.event-purple { background: #9c27b0; }
.event-red { background: #f44336; }
.event-teal { background: #009688; }
.event-pink { background: #e91e63; }

.more-events {
  font-size: 9px;
  color: #5D8AA8;
  margin-top: 2px;
  font-weight: 500;
}

.selected-day-events {
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.selected-day-events h3 {
  margin: 0 0 16px 0;
  color: #123458;
  font-size: 18px;
  font-weight: 500;
}

.no-events {
  color: #5D8AA8;
  font-style: italic;
  text-align: center;
  padding: 15px;
  font-size: 14px;
}

.event-item {
  display: flex;
  align-items: center;
  padding: 16px;
  margin: 12px 0;
  border-radius: 8px;
  border-left: 4px solid;
  transition: all 0.3s ease;
}

.event-item.event-yellow { 
  background: #F1EFEC; 
  border-left-color: #ffc107;
}
.event-item.event-green { 
  background: #F1EFEC; 
  border-left-color: #4caf50;
}
.event-item.event-blue { 
  background: #F1EFEC; 
  border-left-color: #2196f3;
}
.event-item.event-orange { 
  background: #F1EFEC; 
  border-left-color: #ff9800;
}
.event-item.event-purple { 
  background: #F1EFEC; 
  border-left-color: #9c27b0;
}
.event-item.event-red { 
  background: #F1EFEC; 
  border-left-color: #f44336;
}
.event-item.event-teal { 
  background: #F1EFEC; 
  border-left-color: #009688;
}
.event-item.event-pink { 
  background: #F1EFEC; 
  border-left-color: #e91e63;
}

.event-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.event-details {
  flex: 1;
}

.event-client {
  font-weight: 600;
  margin-bottom: 4px;
  font-size: 16px;
  color: #123458;
}

.event-dates {
  font-weight: 500;
  margin-bottom: 6px;
  font-size: 14px;
  color: #5D8AA8;
}

.event-description {
  color: #030303;
  font-size: 14px;
  line-height: 1.4;
}

.event-actions {
  display: flex;
  gap: 8px;
}

.btn-edit {
  background: #123458;
  color: #F1EFEC;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-edit:hover {
  background: #1c4c80;
}

.btn-delete {
  background: #E53935;
  color: white;
}

.btn-delete:hover {
  background: #C62828;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(3, 3, 3, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: #F1EFEC;
  padding: 0;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  background: #123458;
  color: #F1EFEC;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.close-btn {
  background: transparent;
  color: #F1EFEC;
  border: none;
  font-size: 20px;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(241, 239, 236, 0.2);
  border-radius: 50%;
}

.event-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #123458;
  font-size: 14px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #D4C9BE;
  border-radius: 6px;
  font-size: 14px;
  font-family: 'Roboto', sans-serif;
  background: white;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #123458;
  box-shadow: 0 0 0 3px rgba(18, 52, 88, 0.2);
}

.color-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 8px;
}

.color-option {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.3s ease;
}

.color-option:hover {
  background: rgba(212, 201, 190, 0.3);
}

.color-option input[type="radio"] {
  width: auto;
  margin-right: 8px;
}

.color-preview {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: white;
  min-width: 80px;
  text-align: center;
}

.color-yellow { background: #ffc107; color: #000; }
.color-green { background: #4caf50; }
.color-blue { background: #2196f3; }
.color-orange { background: #ff9800; }
.color-purple { background: #9c27b0; }
.color-red { background: #f44336; }
.color-teal { background: #009688; }
.color-pink { background: #e91e63; }

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #D4C9BE;
}

.btn-cancel, .btn-save {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-cancel {
  background: #D4C9BE;
  color: #123458;
}

.btn-cancel:hover {
  background: #c5b7a9;
}

.btn-save {
  background: #123458;
  color: #F1EFEC;
}

.btn-save:hover {
  background: #1c4c80;
}

@media (max-width: 768px) {
  .calendar-container {
    padding: 15px;
  }
  
  .calendar-day {
    min-height: 60px;
    padding: 6px;
  }
  
  .day-header {
    padding: 10px 3px;
    font-size: 12px;
  }
  
  .event-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .event-actions {
    align-self: flex-end;
  }
  
  .modal {
    width: 95%;
    margin: 10px;
  }
  
  .color-options {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn-cancel, .btn-save {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .calendar-container {
    padding: 10px;
  }
  
  .calendar-header {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
  
  .calendar-nav {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
  
  .calendar-day {
    min-height: 50px;
    padding: 4px;
  }
  
  .day-number {
    font-size: 14px;
  }
  
  .event-dot {
    font-size: 8px;
    padding: 1px 2px;
  }
}
</style>