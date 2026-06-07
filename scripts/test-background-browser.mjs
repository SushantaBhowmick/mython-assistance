/**

 * Browser smoke test for background playback intent.

 * Run: node scripts/test-background-browser.mjs

 *

 * Requires dev server on http://localhost:3000 and: npm install -D playwright

 */



import { chromium } from "playwright";



const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";



const TEST_TRACK = {

  videoId: "dQw4w9WgXcQ",

  title: "Test Track",

  channelTitle: "Test Channel",

  thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",

};



async function main() {

  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL ?? "msedge",
  });

  const page = await browser.newPage();



  try {

    await page.goto(`${BASE}/music`, { waitUntil: "networkidle", timeout: 45000 });



    await page.waitForFunction(

      () => Boolean(window.__MYTHON_PLAYER_TEST__?.getState),

      { timeout: 20000 },

    );



    const playbackCheck = await page.evaluate((track) => {

      const store = window.__MYTHON_PLAYER_TEST__;

      store.getState().playTrack(track);



      const playing = store.getState().isPlaying;

      if (!playing) {

        return { ok: false, reason: "playTrack did not set isPlaying" };

      }



      Object.defineProperty(document, "visibilityState", {

        configurable: true,

        get: () => "hidden",

      });

      document.dispatchEvent(new Event("visibilitychange"));



      return {

        ok: store.getState().isPlaying === true,

        isPlaying: store.getState().isPlaying,

        visibility: document.visibilityState,

      };

    }, TEST_TRACK);



    if (!playbackCheck.ok) {

      throw new Error(

        playbackCheck.reason ??

          `isPlaying=${playbackCheck.isPlaying} after background hide`,

      );

    }



    const pauseIntentCheck = await page.evaluate(() => {

      const store = window.__MYTHON_PLAYER_TEST__;

      store.getState().resume();



      const before = store.getState().isPlaying;

      store.getState().pause();

      const afterUserPause = store.getState().isPlaying;



      store.getState().resume();

      const afterResume = store.getState().isPlaying;



      return {

        before,

        afterUserPause,

        afterResume,

      };

    });



    if (pauseIntentCheck.afterUserPause !== false) {

      throw new Error("User pause did not set isPlaying=false");

    }



    if (pauseIntentCheck.afterResume !== true) {

      throw new Error("Resume did not set isPlaying=true");

    }



    console.log("Background hide check:", playbackCheck);

    console.log("User pause/resume check:", pauseIntentCheck);

    console.log("\nBrowser background smoke test passed.");

  } finally {

    await browser.close();

  }

}



main().catch((error) => {

  console.error("\nBrowser test failed:", error.message ?? error);

  process.exit(1);

});


