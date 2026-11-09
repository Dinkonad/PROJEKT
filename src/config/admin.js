// Jedini račun koji smije koristiti aplikaciju.
export const ADMIN_EMAIL = 'naddinko@gmail.com';

// Vlasnik je prijavljen ili lozinkom/Googleom (email se podudara) ili Face ID-om. Face ID prijava koristi
// prilagođeni token koji backend izdaje samo nakon provjere tvog uređaja, pa takav račun nema ni lozinku
// ni Google profil (providerData je prazan).
export const jeVlasnik = (korisnik) =>
  !!korisnik &&
  (korisnik.email === ADMIN_EMAIL || ((korisnik.providerData || []).length === 0 && !korisnik.isAnonymous));
