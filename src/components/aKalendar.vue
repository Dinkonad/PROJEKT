<template>
  <div class="calendar-container">
    <div class="calendar-header">
      <h2>Kalendar</h2>
      <div class="header-actions">
        <button @click="showEmailSettings = true" class="btn-settings">
          📧 Email postavke
        </button>
        <button @click="showAddEventModal = true" class="btn-add-event">
          + Dodaj događaj
        </button>
      </div>
    </div>
    <div v-if="showEmailSettings" class="modal-overlay" @click="closeEmailSettings">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Email Notifikacije</h3>
          <button @click="closeEmailSettings" class="close-btn">&times;</button>
        </div>
        
        <div class="settings-form">
          <div class="form-group">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="emailSettings.enabled"
                @change="saveEmailSettings"
              >
              <span>Omogući email podsjetnike</span>
            </label>
          </div>
          
          <div v-if="emailSettings.enabled" class="form-group">
            <label>Email adresa za podsjetnike:</label>
            <input 
              type="email" 
              v-model="emailSettings.recipientEmail"
              @blur="saveEmailSettings"
              placeholder="naddinko@gmail.com"
              required
            >
          </div>
          
          <div v-if="emailSettings.enabled" class="form-group">
            <label>Pošalji podsjetnik:</label>
            <select v-model="emailSettings.daysBeforeEvent" @change="saveEmailSettings">
              <option value="1">1 dan prije</option>
              <option value="2">2 dana prije</option>
              <option value="3">3 dana prije</option>
              <option value="7">7 dana prije</option>
            </select>
          </div>

          <div v-if="emailSettings.enabled" class="form-group">
            <label>Vrijeme slanja:</label>
            <select v-model="emailSettings.sendTime" @change="saveEmailSettings">
              <option value="06:00">06:00 (6 ujutro)</option>
              <option value="07:00">07:00 (7 ujutro)</option>
              <option value="08:00">08:00 (8 ujutro)</option>
              <option value="09:00">09:00 (9 ujutro)</option>
              <option value="10:00">10:00 (10 ujutro)</option>
              <option value="12:00">12:00 (podne)</option>
              <option value="14:00">14:00 (2 popodne)</option>
              <option value="16:00">16:00 (4 popodne)</option>
              <option value="18:00">18:00 (6 navečer)</option>
              <option value="20:00">20:00 (8 navečer)</option>
            </select>
          </div>

          <div v-if="emailSettings.enabled" class="notification-status">
            <h4>Aktivan status:</h4>
            <p v-if="emailNotifications.length === 0" class="no-notifications">
              Nema aktivnih notifikacija
            </p>
            <div v-else class="active-notifications">
              <div v-for="notification in emailNotifications.filter(n => !n.sent)" :key="notification.id" class="notification-item">
                <div class="notification-details">
                  <span class="event-title">{{ notification.eventTitle }}</span>
                  <span class="notification-date">{{ formatNotificationDate(notification.notificationDate) }}</span>
                </div>
                <span :class="['scheduled-time', { 'immediate': notification.immediate }]">
                  {{ notification.immediate ? 'HITNO' : (notification.scheduledTime || '08:00') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="calendar-nav">
      <button @click="previousMonth" class="nav-btn">&lt;</button>
      <h3>{{ currentMonthYear }}</h3>
      <button @click="nextMonth" class="nav-btn">&gt;</button>
    </div>

    <div class="calendar-grid">
      <div class="day-header" v-for="day in daysOfWeek" :key="day">
        {{ day }}
      </div>

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
            <div v-if="emailSettings.enabled && hasNotification(event.id)" class="email-indicator">
              <span v-if="isImmediateNotification(event.id)">
                📧 Email poslan odmah (hitno)
              </span>
              <span v-else>
                📧 Email podsjetnik aktiviran
              </span>
            </div>
          </div>
          <div class="event-actions">
            <button 
              @click="editEvent(event)" 
              class="btn-edit"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Uredi
            </button>
            <button 
              @click="deleteEvent(event.id)" 
              class="btn-delete"
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
          <div v-if="emailSettings.enabled" class="form-group">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="eventForm.emailNotification"
              >
              <span>Pošalji email podsjetnik {{ emailSettings.daysBeforeEvent }} {{ emailSettings.daysBeforeEvent === 1 ? 'dan' : 'dana' }} prije u {{ emailSettings.sendTime }}</span>
            </label>
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

    <Transition name="fade">
      <div 
        v-if="eventToDelete" 
        class="pozadina" 
        @click="cancelDelete"
      >
        <div 
          class="modal-potvrda" 
          @click.stop
        >
          <div class="modal-zaglavlje">
            <h2>Potvrda brisanja</h2>
          </div>
          <div class="potvrda-sadrzaj">
            <span class="material-icons upozorenje">warning</span>
            <p>Jeste li sigurni da želite obrisati ovaj događaj?</p>
          </div>
          <div class="potvrda-gumbi">
            <button 
              class="gumb-odustani" 
              @click="cancelDelete"
            >Odustani</button>
            <button 
              class="gumb-potvrdi" 
              @click="confirmDelete"
            >Potvrdi</button>
          </div>
        </div>
      </div>
    </Transition>

    <div v-if="emailSettings.enabled" class="test-email-section">
      <button @click="sendTestEmail" class="btn-test-email" :disabled="sendingTestEmail">
        {{ sendingTestEmail ? 'Šalje...' : 'Pošalji test email' }}
      </button>
      <div v-if="emailTestResult" :class="['email-result', emailTestResult.success ? 'success' : 'error']">
        {{ emailTestResult.message }}
      </div>
    </div>


    <div v-if="showImmediateEmailResult" :class="['immediate-email-result', showImmediateEmailResult.success ? 'success' : 'error']">
      <div class="result-content">
        <span class="result-icon">{{ showImmediateEmailResult.success ? '✅' : '❌' }}</span>
        <span class="result-message">{{ showImmediateEmailResult.message }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import emailjs from '@emailjs/browser';

export default {
  name: 'aKalendar',
  data() {
    return {
      currentDate: new Date(),
      selectedDay: null,
      showAddEventModal: false,
      showEmailSettings: false,
      editingEvent: null,
      sendingTestEmail: false,
      emailTestResult: null,
      showImmediateEmailResult: null, 
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
      emailNotifications: JSON.parse(localStorage.getItem('email-notifications')) || [],
      emailSettings: {
        enabled: JSON.parse(localStorage.getItem('email-settings-enabled')) || false,
        recipientEmail: localStorage.getItem('email-recipient') || 'naddinko@gmail.com',
        daysBeforeEvent: parseInt(localStorage.getItem('email-days-before')) || 3,
        sendTime: localStorage.getItem('email-send-time') || '08:00' // Novo polje
      },
      eventToDelete: null,
      eventForm: {
        client: '',
        startDate: '',
        endDate: '',
        color: 'blue',
        description: '',
        emailNotification: true
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
      
      const firstDayOfMonth = new Date(year, month, 1);
      let startDate = new Date(firstDayOfMonth);
      
      const dayOfWeek = firstDayOfMonth.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate.setDate(firstDayOfMonth.getDate() - daysToSubtract);
      
      const calendarDays = [];
      
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
      }
      
      return calendarDays;
    }
  },

  mounted() {
    emailjs.init('032xWrX5Q1Y5iEczS');

    setInterval(() => {
      this.checkAndSendNotifications();
    }, 5 * 60 * 1000);
    
    this.checkAndSendNotifications();
  },

  methods: {
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

    closeEmailSettings() {
      this.showEmailSettings = false;
      this.emailTestResult = null;
    },

    resetEventForm() {
      this.eventForm = {
        client: '',
        startDate: '',
        endDate: '',
        color: 'blue',
        description: '',
        emailNotification: this.emailSettings.enabled
      };
    },

    editEvent(event) {
      this.editingEvent = event;
      this.eventForm = { 
        ...event,
        emailNotification: this.hasNotification(event.id)
      };
    },

    saveEvent() {
      if (new Date(this.eventForm.endDate) < new Date(this.eventForm.startDate)) {
        alert('Završni datum ne može biti prije početnog datuma!');
        return;
      }

      if (this.editingEvent) {
        const index = this.events.findIndex(e => e.id === this.editingEvent.id);
        if (index !== -1) {
          this.events[index] = { ...this.eventForm, id: this.editingEvent.id };
          this.updateEmailNotification(this.events[index]);
        }
      } else {
        const newEvent = {
          ...this.eventForm,
          id: Date.now()
        };
        this.events.push(newEvent);
        this.createEmailNotification(newEvent);
      }
      
      this.saveToLocalStorage();
      this.closeModal();
      
      if (this.selectedDay) {
        this.selectedDay.events = this.getEventsForDate(this.selectedDay.date);
      }
    },

    createEmailNotification(event) {
      if (!this.emailSettings.enabled || !this.eventForm.emailNotification) {
        return;
      }

      const eventDate = new Date(event.startDate);
      const today = new Date();
      
      eventDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      const timeDiff = eventDate - today;
      const daysUntilEvent = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      
      console.log(`Događaj: ${event.client}`);
      console.log(`Datum događaja: ${event.startDate}`);
      console.log(`Danas: ${today.toISOString().split('T')[0]}`);
      console.log(`Dana do događaja: ${daysUntilEvent}`);
      console.log(`Postavka podsjetnika: ${this.emailSettings.daysBeforeEvent} dana prije`);
      
      if (daysUntilEvent <= this.emailSettings.daysBeforeEvent) {
        console.log(`🚨 HITNO: Šalje se email odmah! (${daysUntilEvent} <= ${this.emailSettings.daysBeforeEvent})`);
        this.sendImmediateNotification(event, daysUntilEvent);
        return;
      }
      
      console.log(`⏰ Zakazujem email za kasnije`);
      const notificationDate = new Date(eventDate);
      notificationDate.setDate(eventDate.getDate() - this.emailSettings.daysBeforeEvent);
      
      const [hours, minutes] = this.emailSettings.sendTime.split(':');
      notificationDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      const now = new Date();
      if (notificationDate > now) {
        const notification = {
          id: `notification_${event.id}`,
          eventId: event.id,
          eventTitle: event.client,
          eventDate: event.startDate,
          eventDescription: event.description,
          notificationDate: notificationDate.toISOString(),
          sent: false,
          recipientEmail: this.emailSettings.recipientEmail,
          scheduledTime: this.emailSettings.sendTime,
          immediate: false
        };

        this.emailNotifications.push(notification);
        this.saveEmailNotifications();
        console.log(`Email notifikacija zakazana za: ${notificationDate.toLocaleString('hr-HR')}`);
      }
    },

    async sendImmediateNotification(event, daysLeft) {
      console.log(`📧 Šalje se hitni email za: ${event.client} (${daysLeft} dana)`);
      
      const eventDateFormatted = new Date(event.startDate).toLocaleDateString('hr-HR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const templateParams = {
        to_email: this.emailSettings.recipientEmail,
        to_name: 'Korisnik',
        event_title: event.client,
        event_date: eventDateFormatted,
        event_description: event.description,
        days_left: daysLeft,
        subject: `Hitno: ${event.client} - ${daysLeft === 0 ? 'DANAS' : daysLeft === 1 ? 'SUTRA' : `za ${daysLeft} dana`}!`,
        immediate: true
      };

      console.log('📤 Šalje se email s parametrima:', templateParams);

      try {
        const response = await emailjs.send(
          'service_a3qcvtx',
          'template_ksb59iv',
          templateParams
        );

        console.log('📧 EmailJS Response:', response);

        if (response.status === 200) {
          const notification = {
            id: `notification_${event.id}`,
            eventId: event.id,
            eventTitle: event.client,
            eventDate: event.startDate,
            eventDescription: event.description,
            notificationDate: new Date().toISOString(),
            sent: true,
            recipientEmail: this.emailSettings.recipientEmail,
            scheduledTime: 'ODMAH',
            immediate: true
          };

          this.emailNotifications.push(notification);
          this.saveEmailNotifications();
  
          this.showImmediateEmailResult = {
            success: true,
            message: `✅ Email poslan odmah! Događaj "${event.client}" je ${daysLeft === 0 ? 'DANAS' : daysLeft === 1 ? 'SUTRA' : `za ${daysLeft} dana`}.`
          };
          
          console.log(`✅ Hitna email notifikacija uspješno poslana za: ${event.client}`);
        }
      } catch (error) {
        console.error('❌ Greška pri slanju emaila:', error);
        this.showImmediateEmailResult = {
          success: false,
          message: `❌ Greška pri slanju hitnog emaila: ${error.message || error.text || 'Nepoznata greška'}`
        };
      }

      setTimeout(() => {
        this.showImmediateEmailResult = null;
      }, 8000);
    },

    updateEmailNotification(event) {
      this.emailNotifications = this.emailNotifications.filter(n => n.eventId !== event.id);
      this.createEmailNotification(event);
    },

    deleteEmailNotification(eventId) {
      this.emailNotifications = this.emailNotifications.filter(n => n.eventId !== eventId);
      this.saveEmailNotifications();
    },

    hasNotification(eventId) {
      return this.emailNotifications.some(n => n.eventId === eventId);
    },

    isImmediateNotification(eventId) {
      const notification = this.emailNotifications.find(n => n.eventId === eventId);
      return notification && notification.immediate;
    },

    async checkAndSendNotifications() {
      if (!this.emailSettings.enabled) return;

      const now = new Date();
      
      for (const notification of this.emailNotifications) {
        if (!notification.sent && new Date(notification.notificationDate) <= now) {
          await this.sendEmailNotification(notification);
        }
      }
    },

    async sendEmailNotification(notification) {
      try {
        const eventDateFormatted = new Date(notification.eventDate).toLocaleDateString('hr-HR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const templateParams = {
          to_email: notification.recipientEmail,
          to_name: 'Korisnik',
          event_title: notification.eventTitle,
          event_date: eventDateFormatted,
          event_description: notification.eventDescription,
          days_left: this.emailSettings.daysBeforeEvent,
          subject: `Podsjetnik: ${notification.eventTitle}`
        };


        const response = await emailjs.send(
          'service_a3qcvtx',
          'template_ksb59iv',
          templateParams
        );

        if (response.status === 200) {
          notification.sent = true;
          this.saveEmailNotifications();
          console.log(`Email notifikacija poslana za događaj: ${notification.eventTitle}`);
        }
      } catch (error) {
        console.error('Greška pri slanju email notifikacije:', error);
      }
    },

    async sendTestEmail() {
      this.sendingTestEmail = true;
      this.emailTestResult = null;

      try {
        const templateParams = {
          to_email: this.emailSettings.recipientEmail,
          to_name: 'Korisnik',
          event_title: 'Test Event - Kalendar',
          event_date: 'Sutra u 14:00',
          event_description: 'Ovo je test email za provjeru funkcionalnosti kalendara.',
          days_left: this.emailSettings.daysBeforeEvent,
          subject: 'Test Email - Kalendar Notifikacije'
        };

        const response = await emailjs.send(
          'service_a3qcvtx',
          'template_ksb59iv',
          templateParams
        );

        if (response.status === 200) {
          this.emailTestResult = {
            success: true,
            message: 'Test email uspješno poslan na ' + this.emailSettings.recipientEmail + '!'
          };
        }
      } catch (error) {
        this.emailTestResult = {
          success: false,
          message: `Greška: ${error.message}`
        };
      } finally {
        this.sendingTestEmail = false;
        setTimeout(() => {
          this.emailTestResult = null;
        }, 5000);
      }
    },

    deleteEvent(eventId) {
      this.eventToDelete = eventId;
    },

    confirmDelete() {
      if (this.eventToDelete) {
        this.events = this.events.filter(event => event.id !== this.eventToDelete);
        this.deleteEmailNotification(this.eventToDelete);
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

    saveEmailNotifications() {
      localStorage.setItem('email-notifications', JSON.stringify(this.emailNotifications));
    },

    saveEmailSettings() {
      localStorage.setItem('email-settings-enabled', JSON.stringify(this.emailSettings.enabled));
      localStorage.setItem('email-recipient', this.emailSettings.recipientEmail);
      localStorage.setItem('email-days-before', this.emailSettings.daysBeforeEvent.toString());
      localStorage.setItem('email-send-time', this.emailSettings.sendTime);
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('hr-HR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    },

    formatNotificationDate(dateString) {
      return new Date(dateString).toLocaleDateString('hr-HR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    testDayCalculation() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const testDates = [];
      for (let i = 0; i <= 7; i++) {
        const testDate = new Date(today);
        testDate.setDate(today.getDate() + i);
        
        const daysDiff = Math.floor((testDate - today) / (1000 * 60 * 60 * 24));
        const shouldSendImmediate = daysDiff <= this.emailSettings.daysBeforeEvent;
        
        testDates.push({
          date: testDate.toLocaleDateString('hr-HR'),
          daysDiff,
          shouldSendImmediate,
          action: shouldSendImmediate ? '🚨 HITNO' : '⏰ ZAKAŽI'
        });
      }
      
      this.debugInfo = `Današnji datum: ${today.toLocaleDateString('hr-HR')}
Postavka: ${this.emailSettings.daysBeforeEvent} dana prije

Test rezultati:
${testDates.map(d => 
  `${d.date} (${d.daysDiff === 0 ? 'danas' : `+${d.daysDiff} dana`}) → ${d.action}`
).join('\n')}

EmailJS konfiguracija:
- Service ID: service_a3qcvtx
- Template ID: template_ksb59iv  
- Email: ${this.emailSettings.recipientEmail}`;
    },


    createNotificationWithTime(event) {
      const eventDate = new Date(event.startDate);
      const notificationDate = new Date(eventDate);
      notificationDate.setDate(eventDate.getDate() - this.emailSettings.daysBeforeEvent);
      

      const [hours, minutes] = this.emailSettings.sendTime.split(':');
      notificationDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      return notificationDate;
    },


    updateEmailNotification(event) {
      this.emailNotifications = this.emailNotifications.filter(n => n.eventId !== event.id);
      
      if (this.emailSettings.enabled && this.eventForm.emailNotification) {
        const notificationDate = this.createNotificationWithTime(event);
        const now = new Date();
        
        if (notificationDate > now) {
          const notification = {
            id: `notification_${event.id}`,
            eventId: event.id,
            eventTitle: event.client,
            eventDate: event.startDate,
            eventDescription: event.description,
            notificationDate: notificationDate.toISOString(),
            sent: false,
            recipientEmail: this.emailSettings.recipientEmail,
            scheduledTime: this.emailSettings.sendTime
          };

          this.emailNotifications.push(notification);
          this.saveEmailNotifications();
        }
      }
    }
  },

  watch: {
    'eventForm.startDate'(newStartDate) {
      if (newStartDate && !this.eventForm.endDate) {
        this.eventForm.endDate = newStartDate;
      }
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

.header-actions {
  display: flex;
  gap: 10px;
}

.btn-settings {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.3s ease;
}

.btn-settings:hover {
  background-color: #218838;
}

.calendar-header h2 {
  margin: 0;
  color: #123458;
  font-size: 24px;
  font-weight: 700;
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
}

.btn-add-event:hover {
  background-color: #1c4c80;
}


.settings-form {
  padding: 20px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
}

.notification-status {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.notification-status h4 {
  margin: 0 0 10px 0;
  color: #123458;
}

.no-notifications {
  color: #6c757d;
  font-style: italic;
}

.active-notifications {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notification-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: white;
  border-radius: 4px;
  border-left: 3px solid #28a745;
}

.notification-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-title {
  font-weight: 500;
}

.notification-date {
  font-size: 0.9rem;
  color: #6c757d;
}

.scheduled-time.immediate {
  background-color: #fff3cd;
  color: #856404;
  font-weight: 700;
  border: 1px solid #ffeaa7;
}


.email-indicator {
  margin-top: 8px;
  padding: 4px 8px;
  font-size: 0.8rem;
  border-radius: 4px;
  display: inline-block;
}

.email-indicator:has-text("hitno") {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.email-indicator:not(:has-text("hitno")) {
  background-color: #e8f5e8;
  color: #28a745;
}


.immediate-email-result {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1001;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  max-width: 400px;
  animation: slideInRight 0.5s ease;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.immediate-email-result.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.immediate-email-result.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.result-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.result-icon {
  font-size: 1.2rem;
}

.result-message {
  font-weight: 500;
  line-height: 1.4;
}


.email-info {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #17a2b8;
}

.email-info h4 {
  margin: 0 0 10px 0;
  color: #17a2b8;
  font-size: 1rem;
}

.status-explanation {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.status-indicator {
  width: 20px;
  text-align: center;
}

.status-indicator.scheduled {
  color: #28a745;
}

.status-indicator.immediate {
  color: #ffc107;
}

.status-indicator.sent {
  color: #17a2b8;
}


.email-indicator {
  margin-top: 8px;
  padding: 4px 8px;
  background-color: #e8f5e8;
  color: #28a745;
  font-size: 0.8rem;
  border-radius: 4px;
  display: inline-block;
}


.test-email-section {
  margin-top: 20px;
  text-align: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
}

.btn-test-email {
  background-color: #17a2b8;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-test-email:hover:not(:disabled) {
  background-color: #138496;
}

.btn-test-email:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.email-result {
  margin-top: 10px;
  padding: 10px;
  border-radius: 6px;
  font-weight: 500;
}

.email-result.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.email-result.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
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

.calendar-day.has-events.event-yellow { border-left-color: #ffc107; }
.calendar-day.has-events.event-green { border-left-color: #4caf50; }
.calendar-day.has-events.event-blue { border-left-color: #2196f3; }
.calendar-day.has-events.event-orange { border-left-color: #ff9800; }
.calendar-day.has-events.event-purple { border-left-color: #9c27b0; }
.calendar-day.has-events.event-red { border-left-color: #f44336; }
.calendar-day.has-events.event-teal { border-left-color: #009688; }
.calendar-day.has-events.event-pink { border-left-color: #e91e63; }

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

.event-item.event-yellow { background: #F1EFEC; border-left-color: #ffc107; }
.event-item.event-green { background: #F1EFEC; border-left-color: #4caf50; }
.event-item.event-blue { background: #F1EFEC; border-left-color: #2196f3; }
.event-item.event-orange { background: #F1EFEC; border-left-color: #ff9800; }
.event-item.event-purple { background: #F1EFEC; border-left-color: #9c27b0; }
.event-item.event-red { background: #F1EFEC; border-left-color: #f44336; }
.event-item.event-teal { background: #F1EFEC; border-left-color: #009688; }
.event-item.event-pink { background: #F1EFEC; border-left-color: #e91e63; }

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

.btn-edit, .btn-delete {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn-edit {
  background-color: #123458;
  color: #F1EFEC;
}

.btn-edit:hover {
  background-color: #1c4c80;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(18, 52, 88, 0.2);
}

.btn-delete {
  background-color: #f44336;
  color: white;
}

.btn-delete:hover {
  background-color: #f56358;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(245, 99, 88, 0.2);
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
.form-group textarea,
.form-group select {
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
.form-group textarea:focus,
.form-group select:focus {
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

/* Delete confirmation modal styles */
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
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
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
}

.potvrda-sadrzaj {
  padding: 24px;
  text-align: center;
}

.potvrda-sadrzaj .upozorenje {
  font-size: 48px;
  color: #E53935;
  margin-bottom: 16px;
  display: block;
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
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.gumb-odustani {
  background-color: #D4C9BE;
  color: #123458;
}

.gumb-odustani:hover {
  background-color: #c5b7a9;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(197, 183, 169, 0.2);
}

.gumb-potvrdi {
  background-color: #f44336;
  color: #F1EFEC;
}

.gumb-potvrdi:hover {
  background-color: #f56358;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(245, 99, 88, 0.2);
}

/* Fade transition */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Responsive styles */
@media (max-width: 768px) {
  .calendar-container {
    padding: 15px;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 8px;
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

  .notification-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
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

  .test-email-section {
    padding: 15px;
  }

  .btn-test-email {
    width: 100%;
  }
} </style>