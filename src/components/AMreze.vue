<template>
  <div class="mreze">
    <h1 class="naslov">Društvene mreže</h1>

    <!-- ==================== KARTICE (TABOVI) ==================== -->
    <div class="tabovi" role="tablist">
      <button class="tab" :class="{ aktivan: tab === 'pregled' }" role="tab" @click="tab = 'pregled'">
        <span class="material-icons">dashboard</span> Pregled
      </button>
      <button
        v-for="p in PLATFORME"
        :key="p.kljuc"
        class="tab"
        :class="{ aktivan: tab === p.kljuc }"
        role="tab"
        @click="tab = p.kljuc"
      >
        <span class="tab-tockica" :style="{ backgroundColor: p.boja }"></span>
        {{ p.naziv }}
        <span v-if="sazetci[p.kljuc].povezano" class="material-icons tab-ok">check_circle</span>
      </button>
    </div>

    <!-- ==================== ZAJEDNIČKI PREGLED ==================== -->
    <div v-show="tab === 'pregled'">
      <div class="hero">
        <div class="hero-ikona"><span class="material-icons">visibility</span></div>
        <div class="hero-tekst">
          <span class="hero-oznaka">Ukupno pregleda na svim mrežama</span>
          <span class="hero-broj">{{ broj(ukupno.pregledi) }}</span>
          <span class="hero-podnaslov">
            Povezano {{ ukupno.povezanih }} od {{ ukupno.ukupnoMreza }} mreža
          </span>
        </div>
      </div>

      <div class="kartice">
        <div class="kartica">
          <div class="ikona"><span class="material-icons">groups</span></div>
          <div class="podaci"><h3>Pratitelji ukupno</h3><p class="iznos">{{ broj(ukupno.pratitelji) }}</p></div>
        </div>
        <div class="kartica">
          <div class="ikona"><span class="material-icons">video_library</span></div>
          <div class="podaci"><h3>Objava / videa</h3><p class="iznos">{{ broj(ukupno.sadrzaj) }}</p></div>
        </div>
        <div class="kartica">
          <div class="ikona"><span class="material-icons">trending_up</span></div>
          <div class="podaci"><h3>Pregledi, zadnjih 28 dana</h3><p class="iznos">{{ broj(ukupno.pregledi28) }}</p></div>
        </div>
      </div>

      <div v-if="udjeliPregleda.length" class="sekcija">
        <h2>Udio pregleda po mrežama</h2>
        <div class="udio-traka">
          <div
            v-for="u in udjeliPregleda"
            :key="u.kljuc"
            class="udio-dio"
            :style="{ width: u.postotak + '%', backgroundColor: u.boja }"
            :title="`${u.naziv}: ${u.postotak.toFixed(0)}%`"
          ></div>
        </div>
        <div class="udio-legenda">
          <span v-for="u in udjeliPregleda" :key="u.kljuc" class="udio-stavka">
            <span class="tab-tockica" :style="{ backgroundColor: u.boja }"></span>
            {{ u.naziv }}: <strong>{{ broj(u.pregledi) }}</strong> ({{ u.postotak.toFixed(0) }}%)
          </span>
        </div>
      </div>

      <div v-if="ukupno.povezanih === 0" class="sekcija prazno">
        <span class="material-icons">link_off</span>
        <p>Još nijedna mreža nije povezana. Počni s YouTubeom.</p>
        <button class="gumb-glavni" @click="tab = 'youtube'">
          <span class="material-icons">smart_display</span> Otvori YouTube
        </button>
      </div>

      <h2 class="podnaslov">Po mrežama</h2>
      <div class="platforme">
        <button v-for="p in PLATFORME" :key="p.kljuc" class="platforma" @click="tab = p.kljuc">
          <div class="platforma-glava">
            <span class="platforma-ikona" :style="{ backgroundColor: p.boja }">
              <span class="material-icons">{{ p.ikona }}</span>
            </span>
            <div class="platforma-naziv">
              <strong>{{ p.naziv }}</strong>
              <span class="status" :class="{ spojen: sazetci[p.kljuc].povezano }">
                {{ sazetci[p.kljuc].povezano ? 'Povezano' : 'Nije povezano' }}
              </span>
            </div>
            <span class="material-icons strelica">chevron_right</span>
          </div>
          <div v-if="sazetci[p.kljuc].povezano" class="platforma-brojke">
            <div><span>Pregledi</span><strong>{{ broj(sazetci[p.kljuc].pregledi) }}</strong></div>
            <div><span>Pratitelji</span><strong>{{ broj(sazetci[p.kljuc].pratitelji) }}</strong></div>
            <div><span>Sadržaj</span><strong>{{ broj(sazetci[p.kljuc].sadrzaj) }}</strong></div>
          </div>
        </button>
      </div>
    </div>

    <!-- ==================== YOUTUBE (ostaje u memoriji dok mijenjaš kartice) ==================== -->
    <div v-show="tab === 'youtube'">
      <YoutubePanel />
    </div>

    <!-- ==================== OSTALE MREŽE (još nisu povezane) ==================== -->
    <template v-for="p in PLATFORME.filter(x => x.kljuc !== 'youtube')" :key="p.kljuc">
      <div v-if="tab === p.kljuc" class="sekcija uskoro">
        <span class="uskoro-ikona" :style="{ backgroundColor: p.boja }">
          <span class="material-icons">{{ p.ikona }}</span>
        </span>
        <h2>{{ p.naziv }} još nije povezan</h2>
        <p class="uskoro-tekst">Kad se poveže, ovdje će se vidjeti:</p>
        <ul class="uskoro-lista">
          <li v-for="s in p.stavke" :key="s"><span class="material-icons">check</span>{{ s }}</li>
        </ul>
        <p v-if="p.napomena" class="uskoro-napomena">{{ p.napomena }}</p>
        <button class="gumb-glavni" disabled>
          <span class="material-icons">schedule</span> Uskoro
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import YoutubePanel from '@/components/mreze/YoutubePanel.vue';
import {
  PLATFORME,
  sazetci,
  ukupno,
  udjeliPregleda,
  yt,
  ucitajYoutube,
  osvjeziYoutube
} from '@/store/mreze.js';

const route = useRoute();
const router = useRouter();
const tab = ref('pregled');

const broj = (v) => {
  if (v === null || v === undefined) return '–';
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString('hr-HR') : '–';
};

onMounted(async () => {
  // Google nas vraća ovamo s ?youtube=povezano (ili ?youtube=greska&razlog=...)
  const povratak = route.query.youtube;
  if (povratak) {
    tab.value = 'youtube';
    router.replace({ query: {} });
  }

  if (!yt.ucitano) await ucitajYoutube();

  if (povratak === 'povezano') {
    await osvjeziYoutube(true); // prvo povezivanje: povuci cijelu povijest
  } else if (povratak === 'greska') {
    yt.greska = `Povezivanje nije uspjelo: ${route.query.razlog || 'nepoznata greška'}`;
  }
});
</script>

<style scoped>
.mreze {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px;
  font-family: 'Roboto', sans-serif;
}

.naslov {
  color: var(--text-heading);
  font-weight: 700;
  margin-bottom: 20px;
}

h2 {
  color: var(--text-heading);
  font-size: 1.15rem;
  font-weight: 600;
  margin-bottom: 14px;
}

.podnaslov {
  margin: 8px 0 12px;
}

/* ==================== TABOVI ==================== */
.tabovi {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 6px;
  margin-bottom: 20px;
  scrollbar-width: none;
}

.tabovi::-webkit-scrollbar {
  display: none;
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  min-height: 44px;
  padding: 10px 16px;
  border: 1px solid var(--glass-border);
  border-radius: 999px;
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur));
  backdrop-filter: blur(var(--glass-blur));
  color: var(--text-heading);
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.tab .material-icons {
  font-size: 18px;
}

.tab.aktivan {
  background-color: var(--accent);
  border-color: var(--accent);
  color: white;
}

.tab-ok {
  color: var(--success);
}

.tab.aktivan .tab-ok {
  color: white;
}

.tab-tockica {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-block;
}

/* ==================== HERO ==================== */
.hero {
  display: flex;
  align-items: center;
  gap: 18px;
  background: linear-gradient(135deg, var(--accent), var(--accent-hover));
  border-radius: var(--radius-card);
  box-shadow: 0 6px 18px rgba(18, 52, 88, 0.35);
  padding: 22px 24px;
  margin-bottom: 18px;
  color: white;
}

.hero-ikona {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hero-ikona .material-icons {
  font-size: 28px;
}

.hero-tekst {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.hero-oznaka {
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: rgba(255, 255, 255, 0.9);
}

.hero-broj {
  font-size: 2.2rem;
  font-weight: 800;
  line-height: 1.1;
}

.hero-podnaslov {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.85);
}

/* ==================== KARTICE / SEKCIJE ==================== */
.kartice {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.kartica,
.sekcija {
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  box-shadow: var(--glass-shadow);
}

.kartica {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
}

.sekcija {
  padding: 20px;
  margin-bottom: 20px;
}

.kartica .ikona {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-card-muted);
  color: var(--accent);
  flex-shrink: 0;
}

.kartica .podaci {
  min-width: 0;
}

.kartica .podaci h3 {
  margin: 0 0 4px;
  font-size: 0.74rem;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.kartica .podaci .iznos {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--text-heading);
}

/* ==================== UDIO ==================== */
.udio-traka {
  display: flex;
  height: 18px;
  border-radius: 999px;
  overflow: hidden;
  background-color: var(--bg-card-muted);
}

.udio-dio {
  height: 100%;
}

.udio-legenda {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin-top: 12px;
}

.udio-stavka {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-body);
  font-size: 0.88rem;
}

/* ==================== PLATFORME ==================== */
.platforme {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
}

.platforma {
  text-align: left;
  font-family: inherit;
  cursor: pointer;
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  box-shadow: var(--glass-shadow);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  color: inherit;
}

.platforma-glava {
  display: flex;
  align-items: center;
  gap: 12px;
}

.platforma-ikona,
.uskoro-ikona {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.platforma-naziv {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.platforma-naziv strong {
  color: var(--text-heading);
  font-size: 1rem;
}

.status {
  color: var(--text-muted);
  font-size: 0.8rem;
}

.status.spojen {
  color: var(--success);
  font-weight: 600;
}

.strelica {
  color: var(--text-muted);
}

.platforma-brojke {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.platforma-brojke div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.platforma-brojke span {
  color: var(--text-muted);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.platforma-brojke strong {
  color: var(--text-heading);
  font-size: 1rem;
}

/* ==================== PRAZNO / USKORO ==================== */
.prazno,
.uskoro {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.prazno .material-icons {
  font-size: 36px;
  color: var(--text-muted);
}

.prazno p {
  color: var(--text-body);
}

.uskoro {
  padding: 28px 20px;
}

.uskoro h2 {
  margin: 4px 0 0;
}

.uskoro-ikona {
  width: 56px;
  height: 56px;
  border-radius: 16px;
}

.uskoro-ikona .material-icons {
  font-size: 30px;
}

.uskoro-tekst {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.uskoro-lista {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
}

.uskoro-lista li {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-body);
  font-size: 0.92rem;
}

.uskoro-lista .material-icons {
  font-size: 18px;
  color: var(--success);
}

.uskoro-napomena {
  max-width: 420px;
  color: var(--text-muted);
  font-size: 0.82rem;
  line-height: 1.45;
}

.gumb-glavni {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  border-radius: var(--radius-small);
  padding: 12px 18px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  min-height: 44px;
  background-color: var(--accent);
  color: white;
  font-family: inherit;
}

.gumb-glavni:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .mreze {
    padding: 20px 16px 100px;
  }

  .hero {
    padding: 18px;
  }

  .hero-broj {
    font-size: 1.8rem;
  }

  .platforme {
    grid-template-columns: 1fr;
  }
}
</style>
