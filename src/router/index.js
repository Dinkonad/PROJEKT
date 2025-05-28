import { createRouter, createWebHistory } from 'vue-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

import LoginPage from '../components/LoginPage.vue';
import Dashboard from '../korisnik/Dashboard.vue';
import AdminDashboard from '../components/ADashboard.vue';
import PrihodiView from '../components/APrihodiView.vue';
import OpremaView from '../components/AOprema.vue';
import CjenovnikView from '../components/ACjenovnik.vue';
import aUpload from '../components/aUpload.vue';
import aKalendar from '../components/aKalendar.vue';
import aKorisnici from '../components/aKorisnici.vue'; // Dodano

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
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
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
        path: 'cjenovnik',
        name: 'Cjenovnik',
        component: CjenovnikView,
        meta: { requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'aktivnosti',
        name: 'Aktivnosti',
        component: aKorisnici, 
        meta: { requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'upload',
        name: 'Upload',
        component: aUpload,
        meta: { requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'kalendar',
        name: 'Kalendar',
        component: aKalendar,
        meta: { requiresAuth: true, requiresAdmin: true }
      }, 
    {
        path: 'upload',
        name: 'upload',
        component: aUpload,
        meta: { requiresAuth: true, requiresAdmin: true }
      },
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
  } else if (requiresAdmin && currentUser && currentUser.email !== 'naddinko@gmail.com') {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;