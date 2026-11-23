import { spawn } from "node:child_process";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";

const browserPath = process.argv[2];
if (!browserPath) throw new Error("Pass the path to a Chromium browser executable.");
const profile = await mkdtemp(path.join(tmpdir(), "portfolio-previews-"));
const preview = spawn(process.execPath, ["scripts/preview.mjs"], { windowsHide: true });
const browser = spawn(browserPath, ["--headless", "--disable-gpu", "--remote-debugging-port=9237", `--user-data-dir=${profile}`, "about:blank"], { windowsHide: true, stdio: "ignore" });
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
let socket;
try {
  let target;
  for (let attempt = 0; attempt < 50 && !target; attempt++) {
    try { target = (await (await fetch("http://127.0.0.1:9237/json/list")).json()).find(tab => tab.type === "page"); }
    catch { await wait(200); }
  }
  if (!target) throw new Error("Browser debugging endpoint unavailable.");
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let sequence = 0;
  function send(method, params = {}) {
    const id = ++sequence;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => { socket.removeEventListener("message", receive); reject(new Error(method + " timed out")); }, 10000);
      function receive(event) {
        const reply = JSON.parse(event.data);
        if (reply.id !== id) return;
        clearTimeout(timeout);
        socket.removeEventListener("message", receive);
        if (reply.error) reject(new Error(reply.error.message));
        else resolve(reply.result);
      }
      socket.addEventListener("message", receive);
      socket.send(JSON.stringify({ id, method, params }));
    });
  }
  const evaluate = async expression => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 1000, deviceScaleFactor: 1, mobile: false });
  await mkdir("public/images/work-previews", { recursive: true });
  for (const [prefix, slug] of [["tools", "qr-code-generator"], ["tools", "image-compressor"], ["tools", "pdf-editor"], ["tools", "business-startup-calculator"], ["games", "neon-dash"]]) {
    const url = `http://127.0.0.1:3100/${prefix}/${slug}/`;
    await send("Page.navigate", { url });
    let ready = false;
    for (let attempt = 0; attempt < 40 && !ready; attempt++) {
      await wait(150);
      try { ready = await evaluate(`location.href === ${JSON.stringify(url)} && document.readyState === "complete" && !!document.querySelector("main h1")`); } catch {}
    }
    if (!ready) throw new Error(`Page failed to load: ${url}`);
    await evaluate("document.fonts.ready.then(() => true)");
    await wait(650);
    if (prefix === "games") {
      if (!await evaluate(`(() => { const play = [...document.querySelectorAll(".neon-overlay button")].find(button => button.textContent === "Play"); if (!play) return false; play.click(); return true; })()`)) throw new Error("Play button unavailable.");
      await wait(1050);
    }
    const clip = await evaluate(prefix === "games"
      ? `(() => { const {x,y,width,height} = document.querySelector(".neon-arena").getBoundingClientRect(); return {x,y,width,height,scale:1}; })()`
      : `(() => { const {x,y,width} = document.querySelector("main .ng-panel, main .section").getBoundingClientRect(); return {x,y,width,height:width * .5625,scale:1}; })()`);
    const { data } = await send("Page.captureScreenshot", { format: "png", clip, captureBeyondViewport: true });
    await sharp(Buffer.from(data, "base64")).resize({ width: 900, withoutEnlargement: true }).webp({ quality: 83 }).toFile(`public/images/work-previews/${slug}.webp`);
    console.log(`Captured ${slug}`);
  }
} finally {
  socket?.close();
  browser.kill();
  preview.kill();
  if (path.dirname(path.resolve(profile)) === path.resolve(tmpdir()) && path.basename(profile).startsWith("portfolio-previews-")) {
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 }).catch(() => {});
  }
}
