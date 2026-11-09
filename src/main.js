import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { ukljuciPristupacnostDijaloga } from './utils/pristupacnostDijaloga.js'
import svajp from './directives/svajp.js'

const app = createApp(App)
app.use(router)
app.directive('svajp', svajp)
app.mount('#app')

ukljuciPristupacnostDijaloga()
