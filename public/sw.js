// Service worker samo za Web Push notifikacije - ne radi caching/offline (to
// namjerno nije dodano da ne komplicira deploy nove verzije stranice).

self.addEventListener('push', (event) => {
  let podaci = { naslov: 'Nagy Photos', tijelo: '' };
  try {
    podaci = event.data ? event.data.json() : podaci;
  } catch {
    podaci.tijelo = event.data ? event.data.text() : '';
  }

  event.waitUntil(
    self.registration.showNotification(podaci.naslov || 'Nagy Photos', {
      body: podaci.tijelo || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png'
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/admin');
    })
  );
});
