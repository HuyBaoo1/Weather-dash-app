const CACHE_NAME = 'weather-dashboard-cache-v1';
const MAIN_URLS = ['/', '/css/styles.css', '/src/main.js'];


self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return fetch('/json.icons.json')
                .then((response) => response.json())
                .then((icons) => {
                    const iconUrls = icons.map(icon => icon.src);
                    const allURLs = MAIN_URLS.concat(iconUrls);
                    return cache.addAll(allURLs);
                });
        })
    );
});

self.addEventListener('fetch', event => {
	event.respondWith(
		caches.match(event.request).then(response => {
			// If cache is found, return - otherwise fetch from network
			return (
				response ||
				fetch(event.request).then(fetchResponse => {
					// If bad response, don't cache & return
					if (!fetchResponse || !fetchResponse.ok) {
						return fetchResponse;
					}

					const cachedResponse = fetchResponse.clone();
					console.log(fetchResponse, event.request);
					// Add cloned response to cache (request as key, response as value)
					caches.open(CACHE_NAME).then(cache => {
						cache.put(event.request, cachedResponse);
					});
					// Return the fetched response of the resource to render on page
					return fetchResponse;
				})
			);
		})
	);
});
