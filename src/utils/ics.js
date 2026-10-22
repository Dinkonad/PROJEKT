// Generira i preuzima .ics datoteku za jedan radni dan iz BiznisBaze.
// iPhone (Safari/Chrome) otvara preuzetu .ics direktno u Apple Calendar.

const dvaBroja = (n) => String(n).padStart(2, '0');

// pretvara "YYYY-MM-DD" + "HH:MM" u ICS floating-local format "YYYYMMDDTHHMMSS"
const uIcsFormat = (datum, vrijeme) => {
  const [godina, mjesec, dan] = datum.split('-');
  const [sat, minuta] = vrijeme.split(':');
  return `${godina}${mjesec}${dan}T${sat}${minuta}00`;
};

const ocistiTekst = (tekst = '') => tekst.replace(/[\r\n]+/g, ' ').replace(/,/g, '\\,').replace(/;/g, '\\;');

export function generirajICS({ datum, pocetnoVrijeme, zavrsnoVrijeme, opis }) {
  const sada = new Date();
  const dtstamp = `${sada.getUTCFullYear()}${dvaBroja(sada.getUTCMonth() + 1)}${dvaBroja(sada.getUTCDate())}T${dvaBroja(sada.getUTCHours())}${dvaBroja(sada.getUTCMinutes())}${dvaBroja(sada.getUTCSeconds())}Z`;
  const uid = `${crypto.randomUUID()}@nagyphotos-biznisbaza`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NagyPhotos//BiznisBaza//HR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${uIcsFormat(datum, pocetnoVrijeme)}`,
    `DTEND:${uIcsFormat(datum, zavrsnoVrijeme)}`,
    `SUMMARY:${ocistiTekst(opis) || 'Rad'}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

export function preuzmiICS(unos) {
  const sadrzaj = generirajICS(unos);
  const blob = new Blob([sadrzaj], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `rad-${unos.datum}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
