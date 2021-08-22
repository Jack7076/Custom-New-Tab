const CACHE_VERSION = 'v1';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => {
            return cache.addAll(required_files);
        }).catch((error) => {
            console.error(`[SW] Failed to install. Error: ${error}`);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cache_names) => {
            return Promise.all(
                cache_names.map((cache_name) => {
                    if (cache_name !== CACHE_VERSION) {
                        return caches.delete(cache_name);
                    }
                })
            )
        })
    )
});

self.addEventListener('fetch', (event) => {

    var reqURI = new URL(event.request.url);

    if (reqURI.hostname == self.location.hostname) {
        event.respondWith(
            caches.open(CACHE_VERSION).then((cache) => {
                return cache.match(event.request).then((resp) => {
                    if (resp) {
                        fetchNCache(event, cache);
                        return resp;
                    } else {
                        return fetchNCache(event, cache);
                    }
                });
            }).catch((error) => {
                console.error(`[SW] Error processing request. Error: ${error}`);
                throw error;
            })
        )
    } else {
        event.respondWith(
            caches.match(event.request).then((resp) => {
                return resp || fetch(event.request);
            })
        )
    }
});

var fetchNCache = (event, cache) => {
    return fetch(event.request.clone()).then((resp) => {
        if (resp.status < 400) {
            cache.put(event.request, resp.clone());
        }
        return resp;
    });
};