const SUPABASE_URL = 'https://efkcnuzbmwnslhgvpxws.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVma2NudXpibXduc2xoZ3ZweHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NzA5ODksImV4cCI6MjA4OTE0Njk4OX0.stckE-88HoROHcPU9Rjlo4g-nMFBhJKHIUhSt2jlgEc';

self.addEventListener('push', function(event) {
  event.waitUntil(handlePush());
});

async function handlePush() {
  try {
    // Get current user from IndexedDB
    const empName = await getStoredEmployeeName();
    if (!empName) {
      await showNotif('אולפנים 🎬', 'יש עדכון בסידור שלך');
      return;
    }
    // Fetch latest message from Supabase
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/push_messages?employee_name=eq.${encodeURIComponent(empName)}&order=created_at.desc&limit=1`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } }
    );
    const data = await res.json();
    const msg = data?.[0]?.message || 'יש עדכון בסידור שלך';
    await showNotif('אולפנים 🎬', msg);
  } catch(e) {
    await showNotif('אולפנים 🎬', 'יש עדכון בסידור שלך');
  }
}

async function showNotif(title, body) {
  return self.registration.showNotification(title, {
    body, icon: '/sidur-avoda/icon.png',
    badge: '/sidur-avoda/icon.png',
    dir: 'rtl', lang: 'he',
    vibrate: [200, 100, 200],
    data: { url: '/sidur-avoda/sidur-avoda.html' }
  });
}

async function getStoredEmployeeName() {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open('olphanim', 1);
      req.onsuccess = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('employee')) { resolve(null); return; }
        const tx = db.transaction('employee', 'readonly');
        const store = tx.objectStore('employee');
        const get = store.get('current');
        get.onsuccess = () => resolve(get.result?.name || null);
        get.onerror = () => resolve(null);
      };
      req.onerror = () => resolve(null);
    } catch(e) { resolve(null); }
  });
}

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => clients.claim());
