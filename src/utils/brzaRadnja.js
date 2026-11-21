// Brza radnja: adresa stranice s ?novo=1 odmah otvara prozor za unos ("Novi prihod", "Nova bilješka"...).
// Koriste je kartice "Brze radnje" na dashboardu i brza pretraga (Ctrl/Cmd+K).
// Stranica samo kaže što je "novo": useBrzaRadnja(() => otvoriFormu());
import { onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export function useBrzaRadnja(otvori) {
  const route = useRoute();
  const router = useRouter();
  onMounted(async () => {
    if (route.query.novo === undefined) return;
    router.replace({ query: {} }); // da osvježavanje stranice ne otvara prozor ponovno
    await nextTick();
    setTimeout(otvori, 250); // stranica se prvo dovrši iscrtati
  });
}
