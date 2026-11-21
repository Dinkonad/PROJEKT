import { reactive } from 'vue';

// Zadana je tamna tema ("crna tinta"). Svijetla je druga opcija. Novi ključ ("tema-izbor") zato da svi
// jednom krenu od nove tamne teme, a ne od stare spremljene.
const state = reactive({
  tamna: localStorage.getItem('tema-izbor') !== 'svijetla'
});

const BOJA_TRAKE = { tamna: '#0A0A0C', svijetla: '#F3F0EA' };

const primijeniTemu = () => {
  document.documentElement.setAttribute('data-theme', state.tamna ? 'dark' : 'light');
  // boja trake preglednika / statusne trake na iPhoneu prati temu
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', state.tamna ? BOJA_TRAKE.tamna : BOJA_TRAKE.svijetla);
};

primijeniTemu();

const toggleTemu = () => {
  state.tamna = !state.tamna;
  localStorage.setItem('tema-izbor', state.tamna ? 'tamna' : 'svijetla');
  primijeniTemu();
};

export function useTheme() {
  return { state, toggleTemu };
}
