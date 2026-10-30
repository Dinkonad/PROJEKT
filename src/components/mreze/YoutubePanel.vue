<template>
  <div class="panel">
    <!-- ==================== STATUS / POVEZIVANJE ==================== -->
    <div class="povezi-okvir">
      <div class="povezi-tekst">
        <template v-if="yt.status?.povezano">
          <p>
            Povezano s YouTubeom. Podaci se sami osvježavaju svaki dan i spremaju u bazu.
          </p>
          <p class="sitno">Zadnja sinkronizacija: <strong>{{ formatDatumVrijeme(yt.status?.zadnjaSinkronizacija) }}</strong></p>
        </template>
        <template v-else>
          <p v-if="yt.kanal">Veza s YouTubeom je prekinuta - prikazani su zadnji spremljeni podaci. Poveži ponovno da se nastave osvježavati.</p>
          <p v-else>Poveži YouTube jednom (samo čitanje). Nakon toga se podaci sami povlače svaki dan i spremaju u bazu - bez ponovnog prijavljivanja.</p>
        </template>
      </div>
      <div v-if="yt.ucitano" class="povezi-gumbi">
        <button v-if="!yt.status?.povezano" class="gumb-glavni" :disabled="yt.povezuje" @click="poveziYoutube">
          <span class="material-icons">{{ yt.povezuje ? 'sync' : 'link' }}</span>
          {{ yt.povezuje ? 'Otvaram Google...' : (yt.kanal ? 'Poveži ponovno' : 'Poveži YouTube') }}
        </button>
        <template v-else>
          <button class="gumb-glavni" :disabled="yt.osvjezava" @click="osvjeziYoutube(false)">
            <span class="material-icons" :class="{ vrti: yt.osvjezava }">refresh</span>
            {{ yt.osvjezava ? 'Povlačim s YouTubea...' : 'Osvježi sada' }}
          </button>
          <button class="gumb-sporedni" :disabled="yt.osvjezava" @click="potvrdiOdspajanje">Odspoji</button>
        </template>
      </div>
    </div>

    <p v-if="yt.osvjezava" class="info-traka">
      Podaci se povlače s YouTubea. Prvi put (cijela povijest) ili ako se server budi to može trajati i do minutu.
    </p>

    <div v-if="yt.greska" class="greska-okvir">
      <span class="material-icons">error</span>
      <span>{{ yt.greska }}</span>
    </div>
    <div v-else-if="yt.status && yt.status.uspjeh === false && yt.status.greska" class="greska-okvir">
      <span class="material-icons">error</span>
      <span>Zadnja sinkronizacija nije uspjela: {{ yt.status.greska }}</span>
    </div>
    <div v-if="yt.status?.analitikaGreska" class="info-okvir">
      <span class="material-icons">info</span>
      <span>Analitika (dnevni pregledi) nije povučena: {{ yt.status.analitikaGreska }}</span>
    </div>

    <p v-if="yt.ucitava && !yt.kanal" class="info-traka">Učitavam spremljene podatke...</p>

    <div v-if="!yt.ucitava && !yt.kanal && yt.ucitano && !yt.greska && yt.status?.povezano" class="info-okvir">
      <span class="material-icons">info</span>
      <span>Još nema spremljenih podataka. Klikni "Osvježi sada".</span>
    </div>

    <template v-if="yt.kanal">
      <div class="kartice">
        <div class="kartica">
          <div class="ikona"><span class="material-icons">visibility</span></div>
          <div class="podaci"><h3>Ukupno pregleda</h3><p class="iznos">{{ broj(yt.kanal.statistics?.viewCount) }}</p></div>
        </div>
        <div class="kartica">
          <div class="ikona"><span class="material-icons">groups</span></div>
          <div class="podaci">
            <h3>Pretplatnici</h3>
            <p class="iznos">{{ yt.kanal.statistics?.hiddenSubscriberCount ? 'skriveno' : broj(yt.kanal.statistics?.subscriberCount) }}</p>
          </div>
        </div>
        <div class="kartica">
          <div class="ikona"><span class="material-icons">smart_display</span></div>
          <div class="podaci"><h3>Videa</h3><p class="iznos">{{ broj(yt.kanal.statistics?.videoCount) }}</p></div>
        </div>
        <div class="kartica">
          <div class="ikona"><span class="material-icons">calculate</span></div>
          <div class="podaci"><h3>Prosjek pregleda po videu</h3><p class="iznos">{{ broj(ytProsjekPoVideu) }}</p></div>
        </div>
      </div>

      <div v-if="yt.dnevno.length" class="kartice">
        <div class="kartica">
          <div class="ikona"><span class="material-icons">trending_up</span></div>
          <div class="podaci">
            <h3>Pregledi, zadnjih 28 dana</h3>
            <p class="iznos">{{ broj(ytZbroj28.pregledi) }}</p>
            <span v-if="ytPromjenaPregleda !== null" class="promjena" :class="ytPromjenaPregleda >= 0 ? 'gore' : 'dolje'">
              {{ ytPromjenaPregleda >= 0 ? '+' : '' }}{{ ytPromjenaPregleda.toFixed(0) }}% naspram prethodnih 28
            </span>
          </div>
        </div>
        <div class="kartica">
          <div class="ikona"><span class="material-icons">schedule</span></div>
          <div class="podaci"><h3>Sati gledanja (28 dana)</h3><p class="iznos">{{ broj(Math.round(ytZbroj28.minute / 60)) }} h</p></div>
        </div>
        <div class="kartica">
          <div class="ikona"><span class="material-icons">person_add</span></div>
          <div class="podaci">
            <h3>Pretplatnici (28 dana)</h3>
            <p class="iznos">{{ ytZbroj28.netoPretplatnika >= 0 ? '+' : '' }}{{ broj(ytZbroj28.netoPretplatnika) }}</p>
            <span class="promjena-sitno">+{{ broj(ytZbroj28.dobiveno) }} / −{{ broj(ytZbroj28.izgubljeno) }}</span>
          </div>
        </div>
        <div class="kartica">
          <div class="ikona"><span class="material-icons">thumb_up</span></div>
          <div class="podaci"><h3>Lajkovi (28 dana)</h3><p class="iznos">{{ broj(ytZbroj28.lajkovi) }}</p></div>
        </div>
      </div>

      <div v-if="yt.dnevno.length" class="sekcija">
        <h2>Pregledi po danima (zadnjih 28)</h2>
        <div class="graf">
          <div v-for="d in ytDani28" :key="d.datum" class="stupac" :title="`${formatDatum(d.datum)}: ${d.pregledi} pregleda`">
            <div class="traka" :style="{ height: d.visina + 'px' }"></div>
          </div>
        </div>
        <div class="graf-os">
          <span>{{ formatDatum(ytDani28[0]?.datum) }}</span>
          <span>najbolji dan: {{ ytNajboljiDan ? `${formatDatum(ytNajboljiDan.datum)} (${broj(ytNajboljiDan.pregledi)})` : '-' }}</span>
          <span>{{ formatDatum(ytDani28[ytDani28.length - 1]?.datum) }}</span>
        </div>
      </div>

      <div v-if="yt.dnevno.length" class="sekcija">
        <h2>Pregledi po mjesecima (zadnjih 12)</h2>
        <div class="graf graf-mjeseci">
          <div v-for="m in ytMjeseci12" :key="m.kljuc" class="stupac-mjesec" :title="`${m.kratica} ${m.godina}: ${broj(m.pregledi)} pregleda`">
            <span class="mjesec-broj">{{ m.pregledi > 0 ? kratkiBroj(m.pregledi) : '' }}</span>
            <div class="traka" :style="{ height: m.visina + 'px' }"></div>
          </div>
        </div>
        <div class="graf-os graf-os-mjeseci">
          <span v-for="m in ytMjeseci12" :key="m.kljuc">{{ m.kratica }}</span>
        </div>
      </div>

      <div v-if="yt.videa.length" class="sekcija">
        <div class="sekcija-zaglavlje">
          <h2>Videa ({{ yt.videa.length }})</h2>
          <div class="prekidac-poretka">
            <button :class="{ aktivan: poredak === 'pregledi' }" @click="poredak = 'pregledi'">Najgledaniji</button>
            <button :class="{ aktivan: poredak === 'novo' }" @click="poredak = 'novo'">Najnoviji</button>
          </div>
        </div>
        <a v-for="v in poredanaVidea" :key="v.id" class="video-red" :href="`https://www.youtube.com/watch?v=${v.id}`" target="_blank" rel="noopener">
          <img v-if="v.snippet?.thumbnails?.default?.url" :src="v.snippet.thumbnails.default.url" alt="" class="video-slika">
          <div class="video-info">
            <span class="video-naslov">{{ v.snippet?.title }}</span>
            <span class="video-datum">{{ formatDatum(v.snippet?.publishedAt) }}</span>
          </div>
          <div class="video-brojke">
            <span><span class="material-icons">visibility</span>{{ broj(v.statistics?.viewCount) }}</span>
            <span><span class="material-icons">thumb_up</span>{{ broj(v.statistics?.likeCount) }}</span>
            <span><span class="material-icons">chat_bubble_outline</span>{{ broj(v.statistics?.commentCount) }}</span>
          </div>
        </a>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
  yt,
  poveziYoutube,
  osvjeziYoutube,
  odspojiYoutube,
  ytZbroj28,
  ytPromjenaPregleda,
  ytDani28,
  ytNajboljiDan,
  ytMjeseci12,
  ytProsjekPoVideu
} from '@/store/mreze.js';

const poredak = ref('pregledi');

const broj = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString('hr-HR') : '-';
};

const kratkiBroj = (n) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace('.', ',')}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.', ',')}k`;
  return String(n);
};

const formatDatum = (vrijednost) => {
  if (!vrijednost) return '-';
  const d = new Date(vrijednost.length === 10 ? `${vrijednost}T12:00:00` : vrijednost);
  if (isNaN(d)) return '-';
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}.`;
};

const formatDatumVrijeme = (iso) => {
  if (!iso) return 'još nije bilo';
  const d = new Date(iso);
  if (isNaN(d)) return '-';
  const sat = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${formatDatum(iso)} u ${sat}`;
};

const potvrdiOdspajanje = () => {
  if (confirm('Odspojiti YouTube? Spremljeni podaci ostaju u bazi, ali se više neće osvježavati dok ga ponovno ne povežeš.')) {
    odspojiYoutube();
  }
};

const poredanaVidea = computed(() => {
  const kopija = [...yt.videa];
  if (poredak.value === 'novo') {
    return kopija.sort((a, b) => new Date(b.snippet?.publishedAt) - new Date(a.snippet?.publishedAt));
  }
  return kopija.sort((a, b) => Number(b.statistics?.viewCount || 0) - Number(a.statistics?.viewCount || 0));
});
</script>

<style scoped>
.povezi-okvir,
.sekcija {
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  box-shadow: var(--glass-shadow);
  padding: 20px;
  margin-bottom: 20px;
}

.povezi-okvir {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.povezi-tekst p {
  color: var(--text-body);
  font-size: 0.95rem;
  line-height: 1.4;
}

.povezi-gumbi {
  display: flex;
  gap: 10px;
}

.gumb-glavni,
.gumb-sporedni {
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
}

.gumb-glavni {
  background-color: var(--accent);
  color: white;
}

.gumb-glavni:disabled {
  opacity: 0.6;
  cursor: wait;
}

.gumb-sporedni {
  background-color: var(--bg-card-muted);
  color: var(--text-heading);
}

h2 {
  color: var(--text-heading);
  font-size: 1.15rem;
  font-weight: 600;
  margin-bottom: 14px;
}

.povezi-tekst .sitno {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 0.82rem;
}

.info-traka {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin: -6px 0 16px;
}

.greska-okvir,
.info-okvir {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  border-radius: var(--radius-small);
  margin-bottom: 16px;
  font-size: 0.9rem;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.greska-okvir {
  background-color: rgba(229, 57, 53, 0.12);
  color: var(--danger);
}

.info-okvir {
  background-color: var(--bg-card-muted);
  color: var(--text-body);
}

.greska-okvir .material-icons,
.info-okvir .material-icons {
  font-size: 20px;
  flex-shrink: 0;
}

.vrti {
  animation: vrtnja 1s linear infinite;
}

@keyframes vrtnja {
  to { transform: rotate(360deg); }
}

.graf-mjeseci {
  gap: 6px;
  height: 152px;
}

.stupac-mjesec {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  min-width: 0;
}

.mjesec-broj {
  color: var(--text-muted);
  font-size: 0.68rem;
  white-space: nowrap;
}

.graf-os-mjeseci span {
  flex: 1;
  text-align: center;
  font-size: 0.68rem;
}

.kartice {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.kartica {
  display: flex;
  align-items: center;
  gap: 14px;
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  box-shadow: var(--glass-shadow);
  padding: 16px;
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

.promjena,
.promjena-sitno {
  display: block;
  font-size: 0.78rem;
  margin-top: 2px;
  font-weight: 600;
}

.promjena.gore { color: var(--success); }
.promjena.dolje { color: var(--danger); }
.promjena-sitno { color: var(--text-muted); font-weight: 500; }

.graf {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 130px;
  border-bottom: 2px solid var(--border-color);
}

.stupac {
  flex: 1;
  display: flex;
  align-items: flex-end;
  min-width: 0;
}

.traka {
  width: 100%;
  background-color: var(--accent);
  border-radius: 3px 3px 0 0;
}

.graf-os {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.sekcija-zaglavlje {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.sekcija-zaglavlje h2 {
  margin-bottom: 0;
}

.prekidac-poretka {
  display: flex;
  background-color: var(--bg-card-muted);
  border-radius: var(--radius-small);
  padding: 3px;
}

.prekidac-poretka button {
  border: none;
  background: transparent;
  color: var(--text-muted);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.prekidac-poretka button.aktivan {
  background-color: var(--accent);
  color: white;
}

.video-red {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-color);
  text-decoration: none;
  color: inherit;
}

.video-red:last-child {
  border-bottom: none;
}

.video-slika {
  width: 72px;
  height: 54px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.video-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.video-naslov {
  color: var(--text-heading);
  font-weight: 600;
  font-size: 0.92rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.video-datum {
  color: var(--text-muted);
  font-size: 0.78rem;
}

.video-brojke {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.78rem;
  color: var(--text-body);
  flex-shrink: 0;
}

.video-brojke span {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
}

.video-brojke .material-icons {
  font-size: 14px;
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .povezi-okvir {
    flex-direction: column;
    align-items: stretch;
  }

  .povezi-gumbi {
    flex-direction: column;
  }

  .gumb-glavni,
  .gumb-sporedni {
    justify-content: center;
    width: 100%;
  }

  .graf-os span:nth-child(2) {
    display: none;
  }

  .video-slika {
    width: 56px;
    height: 42px;
  }
}
</style>
