// Jedinstveni popis admin nav-stavki - koriste ga i bočna traka (desktop) i donja traka (mobitel),
// da se izbornik ne duplira na dva mjesta. Redoslijed ovdje = redoslijed u izborniku.
// mobilePrimary: prvih pet stavki je u donjoj traci na mobitelu, ostale su pod "Više".
export const navStavke = [
  { to: '/admin', label: 'Dashboard', icon: 'dashboard', exact: true, mobilePrimary: true },
  { to: '/admin/prihodi', label: 'Prihodi', icon: 'payments', mobilePrimary: true },
  { to: '/admin/biznisbaza', label: 'BiznisBaza', icon: 'event_available', mobilePrimary: true },
  { to: '/admin/zdravlje', label: 'Zdravlje', icon: 'monitor_heart', mobilePrimary: true },
  { to: '/admin/biljeske', label: 'Bilješke', icon: 'sticky_note_2', mobilePrimary: true },
  { to: '/admin/galerije', label: 'Galerije', icon: 'photo_library', mobilePrimary: false },
  { to: '/admin/auto', label: 'Auto', icon: 'directions_car', mobilePrimary: false },
  { to: '/admin/korisni-linkovi', label: 'Linkovi', icon: 'link', mobilePrimary: false },
  { to: '/admin/drustvene-mreze', label: 'Društvene mreže', icon: 'share', mobilePrimary: false },
  { to: '/admin/oprema', label: 'Oprema', icon: 'camera_alt', mobilePrimary: false },
  { to: '/admin/kalendar', label: 'Kalendar', icon: 'calendar_month', mobilePrimary: false },
  { to: '/admin/sifre', label: 'Šifre', icon: 'key', mobilePrimary: false }
];

// Brze radnje: otvaraju stranicu s već otvorenim prozorom za unos (?novo=1, vidi utils/brzaRadnja.js).
// Prikazuju se na dashboardu i u brzoj pretrazi (Ctrl/Cmd+K).
export const brzeRadnje = [
  { naziv: 'Novi prihod', stranica: 'Prihodi', ikona: 'payments', to: '/admin/prihodi' },
  { naziv: 'Nova bilješka', stranica: 'Bilješke', ikona: 'note_add', to: '/admin/biljeske' },
  { naziv: 'Nova galerija', stranica: 'Galerije', ikona: 'add_photo_alternate', to: '/admin/galerije' },
  { naziv: 'Spremi link', stranica: 'Linkovi', ikona: 'link', to: '/admin/korisni-linkovi' },
  { naziv: 'Novi dan', stranica: 'BiznisBaza', ikona: 'event_available', to: '/admin/biznisbaza' },
  { naziv: 'Unos za auto', stranica: 'Auto', ikona: 'local_gas_station', to: '/admin/auto' }
];
