import { reactive } from 'vue';

const state = reactive({
  tamna: localStorage.getItem('tema') === 'tamna'
});

const primijeniTemu = () => {
  document.documentElement.setAttribute('data-theme', state.tamna ? 'dark' : 'light');
};

primijeniTemu();

const toggleTemu = () => {
  state.tamna = !state.tamna;
  localStorage.setItem('tema', state.tamna ? 'tamna' : 'svijetla');
  primijeniTemu();
};

export function useTheme() {
  return { state, toggleTemu };
}
