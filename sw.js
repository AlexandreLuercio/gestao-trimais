
const CACHE_NAME = 'gestao-ocorrencias-v7-production';
const urlsToCache = [
  './',
  './index.html',
  // Adicione aqui outros arquivos estáticos importantes (CSS, JS, imagens) se houver
];

// Evento de Instalação: Adiciona os arquivos principais ao cache.
self.addEventListener('install', event => {
  self.skipWaiting(); // Força o SW a ativar imediatamente
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache v7');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento de Ativação: Limpa caches antigos e assume o controle da página.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Assume o controle imediato das páginas abertas.
  );
});

// Evento de Fetch: Intercepta as requisições de rede.
self.addEventListener('fetch', event => {
  // Ignora requisições que não são GET (ex: POST para o Firestore)
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Estratégia: Tenta pegar do cache primeiro. Se falhar, vai para a rede.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          networkResponse => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
               if (event.request.url.includes('firestore.googleapis.com')) {
                 return networkResponse;
               }
            }
            // Não cacheia tudo dinamicamente para evitar salvar versões velhas nesta fase de dev
            return networkResponse;
          }
        );
      })
  );
});
