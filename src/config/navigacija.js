// Jedinstveni popis admin nav-stavki - koriste ga i bočna traka (desktop) i donja traka (mobitel),
// da se izbornik ne duplira na dva mjesta. Redoslijed ovdje = redoslijed u izborniku.
export const navStavke = [
  { to: '/admin', label: 'Dashboard', icon: 'dashboard', exact: true, mobilePrimary: true },
  { to: '/admin/biznisbaza', label: 'BiznisBaza', icon: 'event_available', mobilePrimary: true },
  { to: '/admin/zdravlje', label: 'Zdravlje', icon: 'monitor_heart', mobilePrimary: true },
  { to: '/admin/prihodi', label: 'Prihodi', icon: 'payments', mobilePrimary: true },
  { to: '/admin/sifre', label: 'Šifre', icon: 'key', mobilePrimary: true },
  { to: '/admin/oprema', label: 'Oprema', icon: 'camera_alt', mobilePrimary: false },
  { to: '/admin/auto', label: 'Auto', icon: 'directions_car', mobilePrimary: false },
  { to: '/admin/kalendar', label: 'Kalendar', icon: 'calendar_month', mobilePrimary: false },
  { to: '/admin/drustvene-mreze', label: 'Društvene mreže', icon: 'share', mobilePrimary: false },
  { to: '/admin/korisni-linkovi', label: 'Linkovi', icon: 'link', mobilePrimary: false },
  { to: '/admin/kreativna-zona', label: 'Kreativna zona', icon: 'lightbulb', mobilePrimary: false }
];
