type Subscriptions = typeof import("./public-subscriptions");

export function afterPageLoad(subscribe: (sdk: Subscriptions) => () => void, onError?: () => void) {
  let active = true;
  let stop: (() => void) | undefined;
  async function start() {
    try {
      const sdk = await import("./public-subscriptions");
      if (active && sdk.firebaseConfigured) stop = subscribe(sdk);
    } catch {
      if (active) onError?.();
    }
  }
  if (document.readyState === "loading" || document.readyState === "interactive") {
    window.addEventListener("load", start, { once: true });
  } else {
    void start();
  }
  return () => {
    active = false;
    window.removeEventListener("load", start);
    stop?.();
  };
}
