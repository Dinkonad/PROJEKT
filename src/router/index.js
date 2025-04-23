import { createRouter, createWebHistory } from 'vue-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import LoginPage from '../components/LoginPage.vue';
import Dashboard from '../components/Dashboard.vue';
import AdminDashboard from '../components/AdminDashboard.vue';
import PrihodiView from '../components/PrihodiView.vue';

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
  } else if (requiresAdmin && currentUser && currentUser.email !== 'naddinko@gmail.com') {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;