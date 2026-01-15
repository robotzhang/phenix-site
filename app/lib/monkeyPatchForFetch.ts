// src/lib/global-fetch.ts
if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  let activeRequests = 0;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const skipLoading = (init as any)?.noLoading;

    if (!skipLoading) {
      if (activeRequests === 0) window.dispatchEvent(new CustomEvent("fetchStart"));
      activeRequests++;
    }

    try {
      return await originalFetch(input, init);
    } finally {
      if (!skipLoading) {
        activeRequests--;
        if (activeRequests <= 0) {
          activeRequests = 0;
          window.dispatchEvent(new CustomEvent("fetchEnd"));
        }
      }
    }
  };
}
