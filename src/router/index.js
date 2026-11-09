import { createRouter, createWebHistory } from 'vue-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { navStavke } from '../config/navigacija.js';
import { jeVlasnik } from '../config/admin.js';

import LoginPage from '../components/LoginPage.vue';
import AdminDashboard from '../components/ADashboard.vue';
import PrihodiView from '../components/APrihodi.vue';
import OpremaView from '../components/AOprema.vue';
import ABiznisbaza from '../components/ABiznisbaza.vue';
import ASifre from '../components/ASifre.vue';
import AAuto from '../components/AAuto.vue';
import AZdravlje from '../components/AZdravlje.vue';
import aKarte from '../components/aKarte.vue';
import aKorisnilinkovi from '../components/aKorisnilinkovi.vue';
import aKreativnaideja from '../components/aKreativnaideja.vue';
import AKalendar from '../components/AKalendar.vue';
import AMreze from '../components/AMreze.vue';

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage
  },
  {
    // stari link iz vremena kad je postojao klijentski dio - sada postoji samo admin
    path: '/dashboard',
    redirect: '/admin'
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: 'prihodi',
        name: 'Prihodi',
        component: PrihodiView,
        meta: { requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'oprema',
        name: 'Oprema',
        component: OpremaView,
        meta: { requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'biznisbaza',
        name: 'BiznisBaza',
        component: ABiznisbaza,
        meta: { requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'karte',
        name: 'Karte',
        component: aKarte,
        meta: { requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'sifre',
        name: 'Sifre',
        component: ASifre,
        meta: { requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'auto',
        name: 'Auto',
        component: AAuto,
        meta: { requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'zdravlje',
        name: 'Zdravlje',
        component: AZdravlje,
        meta: { requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'korisni-linkovi',
        name: 'KorisniLinkovi',
        component: aKorisnilinkovi,
        meta: { requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'kreativna-zona',
        name: 'KreativnaZona',
        component: aKreativnaideja,
        meta: { requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'kalendar',
        name: 'Kalendar',
        component: AKalendar,
        meta: { requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'drustvene-mreze',
        name: 'DrustveneMreze',
        component: AMreze,
        meta: { requiresAuth: true, requiresAdmin: true }
      },
      {
        // stari link iz prve verzije
        path: 'youtube',
        redirect: '/admin/drustvene-mreze'
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

let currentUser = null;
onAuthStateChanged(getAuth(), (user) => {
  currentUser = user;
});

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);

  if (requiresAuth && !currentUser) {
    next('/login');
  } else if (requiresAdmin && currentUser && !jeVlasnik(currentUser)) {
    next('/login');
  } else {
    next();
  }
});

// naslov kartice u pregledniku i u povijesti: "Prihodi · Nagy Photos"
router.afterEach((to) => {
  const stavka = navStavke.find(n => n.to === to.path);
  const naziv = stavka ? stavka.label : (to.path === '/login' ? 'Prijava' : '');
  document.title = naziv ? `${naziv} · Nagy Photos` : 'Nagy Photos';
});

export default router;