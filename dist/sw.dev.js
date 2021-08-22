"use strict";

var CACHE_VERSION = 'v1';
self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE_VERSION).then(function (cache) {
    return cache.addAll(required_files);
  })["catch"](function (error) {
    console.error("[SW] Failed to install. Error: ".concat(error));
  }));
});
self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (cache_names) {
    return Promise.all(cache_names.map(function (cache_name) {
      if (cache_name !== CACHE_VERSION) {
        return caches["delete"](cache_name);
      }
    }));
  }));
});
self.addEventListener('fetch', function (event) {
  var reqURI = new URL(event.request.url);

  if (reqURI.hostname == self.location.hostname) {
    event.respondWith(caches.open(CACHE_VERSION).then(function (cache) {
      return cache.match(event.request).then(function (resp) {
        if (resp) {
          fetchNCache(event, cache);
          return resp;
        } else {
          return fetchNCache(event, cache);
        }
      });
    })["catch"](function (error) {
      console.error("[SW] Error processing request. Error: ".concat(error));
      throw error;
    }));
  } else {
    event.respondWith(caches.match(event.request).then(function (resp) {
      return resp || fetch(event.request);
    }));
  }
});

var fetchNCache = function fetchNCache(event, cache) {
  return fetch(event.request.clone()).then(function (resp) {
    if (resp.status < 400) {
      cache.put(event.request, resp.clone());
    }

    return resp;
  });
};