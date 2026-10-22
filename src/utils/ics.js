// Generira i preuzima .ics datoteku za radne dane iz BiznisBaze (jedan ili više odjednom).
// iPhone (Safari/Chrome) otvara preuzetu .ics direktno u Apple Calendar.

const dvaBroja = (n) => String(n).padStart(2, '0');

// pretvara "YYYY-MM-DD" + "HH:MM" u ICS floating-local format "YYYYMMDDTHHMMSS"
const uIcsFormat = (datum, vrijeme) => {
  const [godina, mjesec, dan] = datum.split('-');
  const [sat, minuta] = vrijeme.split(':');
  return `${godina}${mjesec}${dan}T${sat}${minuta}00`;
};

const ocistiTekst = (tekst = '') => tekst.replace(/[\r\n]+/g, ' ').replace(/,/g, '\\,').replace(/;/g, '\\;');

const dtstampSada = () => {
  const sada = new Date();
  return `${sada.getUTCFullYear()}${dvaBroja(sada.getUTCMonth() + 1)}${dvaBroja(sada.getUTCDate())}T${dvaBroja(sada.getUTCHours())}${dvaBroja(sada.getUTCMinutes())}${dvaBroja(sada.getUTCSeconds())}Z`;
};

const gradiVEvent = ({ datum, pocetnoVrijeme, zavrsnoVrijeme, opis }, dtstamp) => [
  'BEGIN:VEVENT',
  `UID:${crypto.randomUUID()}@nagyphotos-biznisbaza`,
  `DTSTAMP:${dtstamp}`,
  `DTSTART:${uIcsFormat(datum, pocetnoVrijeme)}`,
  `DTEND:${uIcsFormat(datum, zavrsnoVrijeme)}`,
  `SUMMARY:${ocistiTekst(opis) || 'Rad'}`,
  'END:VEVENT'
].join('\r\n');

export function generirajICS(unos) {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NagyPhotos//BiznisBaza//HR',
    'CALSCALE:GREGORIAN',
    gradiVEvent(unos, dtstampSada()),
    'END:VCALENDAR'
  ].join('\r\n');
}

export function generirajVisestrukiICS(unosi) {
  const dtstamp = dtstampSada();
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NagyPhotos//BiznisBaza//HR',
    'CALSCALE:GREGORIAN',
    ...unosi.map(u => gradiVEvent(u, dtstamp)),
    'END:VCALENDAR'
  ].join('\r\n');
}

const preuzmiTekstDatoteku = (sadrzaj, nazivDatoteke, mimeTip) => {
  const blob = new Blob([sadrzaj], { type: mimeTip });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nazivDatoteke;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export function preuzmiICS(unos) {
  preuzmiTekstDatoteku(generirajICS(unos), `rad-${unos.datum}.ics`, 'text/calendar;charset=utf-8');
}

export function preuzmiVisestrukiICS(unosi, nazivDatoteke = 'raspored.ics') {
  preuzmiTekstDatoteku(generirajVisestrukiICS(unosi), nazivDatoteke, 'text/calendar;charset=utf-8');
}
