export async function enableMocking() {
  const useMocking =
    import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW !== 'false';
  if (!useMocking) {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const mockRegistrations = registrations.filter((registration) =>
        registration.active?.scriptURL.endsWith('/mockServiceWorker.js'),
      );
      await Promise.all(
        mockRegistrations.map((registration) => registration.unregister()),
      );
      if (
        navigator.serviceWorker.controller?.scriptURL.endsWith(
          '/mockServiceWorker.js',
        )
      ) {
        window.location.reload();
        await new Promise<never>(() => undefined);
      }
    }
    return;
  }

  const { mockWorker } = await import('./browser');
  await mockWorker.start({
    onUnhandledRequest(request, print) {
      const url = new URL(request.url);
      if (url.pathname.startsWith('/api/')) print.error();
    },
  });
}
