import "server-only";

const MIN_GAP_MS = 1200;

let chain: Promise<void> = Promise.resolve();
let lastSearchAt = 0;

export function waitForYouTubeSearchSlot(): Promise<void> {
  chain = chain.then(async () => {
    const now = Date.now();
    const wait = MIN_GAP_MS - (now - lastSearchAt);
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    lastSearchAt = Date.now();
  });

  return chain;
}
