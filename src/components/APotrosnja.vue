<template>
  <section class="sekcija potrosnja" aria-labelledby="potrosnja-naslov">
    <div class="sekcija-zaglavlje">
      <h2 id="potrosnja-naslov">Zdravlje aplikacije</h2>
      <div class="pot-akcije">
        <span v-if="podaci" class="pot-znacka" :class="`z-${znackaRazina}`" >{{ ukupniTekst }}</span>
        <button type="button" class="pot-osvjezi" :disabled="ucitava" aria-label="Osvježi potrošnju" @click="ucitaj(true)">
          <span class="material-icons" :class="{ vrti: ucitava }" aria-hidden="true">refresh</span>
        </button>
      </div>
    </div>

    <p v-if="greska" class="pot-greska" role="alert">{{ greska }}</p>

    <div v-else-if="!podaci" class="pot-skeleton" aria-busy="true">
      <span class="sr-only">Učitava se potrošnja…</span>
      <div v-for="n in 3" :key="n" class="pot-skel"></div>
    </div>

    <div v-else class="pot-mreza">
      <article v-for="k in kartice" :key="k.naziv" class="pot-kartica">
        <header class="pot-kartica-zaglavlje">
          <span class="material-icons" aria-hidden="true">{{ k.ikona }}</span>
          <h3>{{ k.naziv }}</h3>
        </header>

        <p v-if="k.poruka" class="pot-poruka" :class="{ 'pot-poruka-upozorenje': k.upozorenje }">{{ k.poruka }}</p>

        <ul v-else class="pot-redovi">
          <li v-for="r in k.redovi" :key="r.oznaka" class="pot-red">
            <div class="pot-red-gore">
              <span class="pot-oznaka">{{ r.oznaka }}</span>
              <span class="pot-vrijednost">{{ r.vrijednost }}</span>
            </div>
            <div class="pot-traka" role="progressbar" :aria-valuenow="Math.round(r.udio * 100)" aria-valuemin="0" aria-valuemax="100" :aria-label="r.oznaka">
              <div class="pot-ispuna" :class="`r-${r.razina}`" :style="{ width: `${Math.max(2, Math.min(100, r.udio * 100))}%` }"></div>
            </div>
            <span v-if="r.sitno" class="pot-sitno-red">{{ r.sitno }}</span>
          </li>
        </ul>
      </article>
    </div>

    <p v-if="podaci" class="pot-sitno">
      Čitanja, pisanja i brisanja Firestorea gledaju se za zadnja 24 sata (besplatna kvota je dnevna). R2 je točan zbroj,
      a promet Rendera je procjena. Sate rada Render ne daje, pa ih gledaj na njihovoj stranici.
    </p>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { dohvatiPotrosnju } from '@/services/potrosnja.js';

const podaci = ref(null);
const greska = ref('');
const ucitava = ref(false);

const CIJENA_R2_GB = 0.015;
const broj = (n) => Number(n || 0).toLocaleString('hr-HR');
const gb = (b) => `${(b / 1e9).toFixed(b / 1e9 < 10 ? 2 : 1).replace('.', ',')} GB`;
const razinaZa = (udio) => (udio >= 0.85 ? 'kriticno' : udio >= 0.6 ? 'pazi' : 'uredu');

const ucitaj = async (osvjezi = false) => {
  if (ucitava.value) return;
  ucitava.value = true;
  greska.value = '';
  try {
    podaci.value = await dohvatiPotrosnju(osvjezi);
  } catch (e) {
    greska.value = e.message || 'Potrošnja se ne može učitati.';
  } finally {
    ucitava.value = false;
  }
};

const kartice = computed(() => {
  const p = podaci.value;
  if (!p) return [];
  const izlaz = [];

  const fs = p.firestore || {};
  if (fs.kvote) {
    const nazivi = { citanja: 'Čitanja', pisanja: 'Pisanja', brisanja: 'Brisanja' };
    izlaz.push({
      naziv: 'Firestore',
      ikona: 'storage',
      redovi: Object.keys(nazivi).map((k) => {
        const udio = (fs.zadnja24h[k] || 0) / fs.kvote[k];
        return {
          oznaka: `${nazivi[k]} (24 h)`,
          vrijednost: `${broj(fs.zadnja24h[k])} / ${broj(fs.kvote[k])}`,
          udio,
          razina: razinaZa(udio),
          sitno: `ovaj mjesec: ${broj(fs.mjesec[k])}`
        };
      })
    });
  } else {
    izlaz.push({ naziv: 'Firestore', ikona: 'storage', poruka: fs.greska || 'Nema podataka.', upozorenje: !!fs.savjet });
  }

  const r2 = p.r2 || {};
  if (r2.bajtova !== undefined) {
    const udio = r2.bajtova / (r2.besplatnoGB * 1e9);
    const trosak = Math.max(0, r2.bajtova / 1e9 - r2.besplatnoGB) * CIJENA_R2_GB;
    izlaz.push({
      naziv: 'Cloudflare R2',
      ikona: 'cloud',
      redovi: [{
        oznaka: 'Pohrana',
        vrijednost: `${gb(r2.bajtova)} / ${r2.besplatnoGB} GB`,
        udio,
        razina: razinaZa(udio),
        sitno: trosak > 0 ? `≈ ${trosak.toFixed(2).replace('.', ',')} $ mjesečno iznad besplatnog` : `${broj(r2.objekata)} datoteka, trošak 0 $`
      }]
    });
  } else {
    izlaz.push({ naziv: 'Cloudflare R2', ikona: 'cloud', poruka: r2.greska || 'Nema podataka.' });
  }

  const rd = p.render || {};
  if (rd.gb !== undefined) {
    const udio = rd.gb / rd.besplatnoGB;
    izlaz.push({
      naziv: 'Render',
      ikona: 'dns',
      redovi: [{
        oznaka: 'Izlazni promet (ovaj mjesec)',
        vrijednost: `${rd.gb.toFixed(2).replace('.', ',')} / ${rd.besplatnoGB} GB`,
        udio,
        razina: razinaZa(udio),
        sitno: udio >= 0.85 ? 'Blizu granice: nakon 5 GB Render zaustavlja servise.' : 'procjena iz Render API-ja'
      }]
    });
  } else {
    izlaz.push({ naziv: 'Render', ikona: 'dns', poruka: rd.greska || 'Nema podataka.' });
  }
  return izlaz;
});

const ukupnaRazina = computed(() => {
  const udjeli = kartice.value.flatMap((k) => (k.redovi || []).map((r) => r.udio));
  return udjeli.length ? razinaZa(Math.max(...udjeli)) : 'uredu';
});

const nesto_nepovezano = computed(() => kartice.value.some((k) => k.poruka));

const znackaRazina = computed(() => (ukupnaRazina.value === 'uredu' && nesto_nepovezano.value ? 'pazi' : ukupnaRazina.value));

const ukupniTekst = computed(() => {
  if (ukupnaRazina.value === 'uredu' && nesto_nepovezano.value) return 'Nepotpuni podaci';
  return { uredu: 'Sve u redu', pazi: 'Pazi na potrošnju', kriticno: 'Blizu granice' }[ukupnaRazina.value];
});

onMounted(() => ucitaj());
</script>

<style scoped>
.potrosnja {
  display: block;
}

.potrosnja .sekcija-zaglavlje {
  flex-wrap: wrap;
  gap: 10px 14px;
  margin-bottom: 14px;
}

.pot-akcije {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pot-znacka {
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid transparent;
}

.pot-znacka.z-uredu {
  color: var(--success);
  background-color: color-mix(in srgb, var(--success) 14%, transparent);
  border-color: color-mix(in srgb, var(--success) 30%, transparent);
}

.pot-znacka.z-pazi {
  color: var(--warm);
  background-color: color-mix(in srgb, var(--warm) 14%, transparent);
  border-color: color-mix(in srgb, var(--warm) 32%, transparent);
}

.pot-znacka.z-kriticno {
  color: var(--danger);
  background-color: color-mix(in srgb, var(--danger) 14%, transparent);
  border-color: color-mix(in srgb, var(--danger) 32%, transparent);
}

.pot-osvjezi {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  background: none;
  color: var(--text-muted);
  cursor: pointer;
}

.pot-osvjezi:hover:not(:disabled) {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 40%, var(--glass-border));
}

.pot-osvjezi .material-icons {
  font-size: 20px;
}

.vrti {
  animation: pot-vrtnja 0.9s linear infinite;
}

@keyframes pot-vrtnja {
  to { transform: rotate(360deg); }
}

.pot-greska {
  margin: 0;
  padding: 12px 14px;
  border: 1px solid color-mix(in srgb, var(--danger) 35%, transparent);
  border-radius: 12px;
  color: var(--danger);
  font-size: 0.9rem;
}

.pot-mreza,
.pot-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.pot-skel {
  height: 168px;
  border-radius: 16px;
  background-color: var(--glass-bg-muted);
  border: 1px solid var(--glass-border);
}

.pot-kartica {
  padding: 16px 18px 18px;
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  background-color: color-mix(in srgb, var(--bg-card-muted) 55%, transparent);
}

.pot-kartica-zaglavlje {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.pot-kartica-zaglavlje .material-icons {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  background-color: var(--accent-tint);
  color: var(--accent);
  font-size: 18px;
}

.pot-kartica-zaglavlje h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-heading);
}

.pot-redovi {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 14px;
}

.pot-red-gore {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
  font-size: 0.85rem;
}

.pot-oznaka {
  color: var(--text-muted);
}

.pot-vrijednost {
  color: var(--text-heading);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.pot-traka {
  height: 6px;
  border-radius: 999px;
  background-color: color-mix(in srgb, var(--text-muted) 22%, transparent);
  overflow: hidden;
}

.pot-ispuna {
  height: 100%;
  border-radius: 999px;
  background-color: var(--accent);
  transition: width 0.5s ease;
}

.pot-ispuna.r-pazi {
  background-color: var(--warm);
}

.pot-ispuna.r-kriticno {
  background-color: var(--danger);
}

.pot-sitno-red {
  display: block;
  margin-top: 5px;
  color: var(--text-muted);
  font-size: 0.78rem;
}

.pot-poruka {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.88rem;
  line-height: 1.5;
}

.pot-poruka-upozorenje {
  color: var(--warm);
}

.pot-sitno {
  margin: 16px 0 0;
  color: var(--text-muted);
  font-size: 0.8rem;
  line-height: 1.5;
}
</style>
