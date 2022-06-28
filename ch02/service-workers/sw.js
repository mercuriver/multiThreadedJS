let counter = 0;

self.oninstall = (event) => {
  console.log("service worker install");
};

self.onactivate = (event) => {
  console.log("service worker activate");
  event.waitUntil(self.clients.claim());
};

self.onfetch = (event) => {
  console.log("fetch", event.request.url);

  if (event.request.url.endsWith("/data.json")) {
    counter += 1;

    event.respondWith(
      new Response(JSON.stringify({ counter }), {
        headers: {
          "Content-Type": "application/json",
        },
      })
    );
    return;
  }

  // fallback to normal HTTP request
  event.respondWith(fetch(event.request));
};

// chrome://inspect/#workers 에서 허용해야 디버깅 가능
