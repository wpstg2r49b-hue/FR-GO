# Focus Reader — Read Aloud (audiobook narration) · v3, Piper

## What it does
One speaker button reads the book aloud from the sentence you are on, through every chapter and page, to the end.
Where: phone dock (speaker icon, also "Read aloud" in the ☰ menu), desktop top toolbar, Focus Mode mini bar.
While reading, a bar shows status, progress, pause/resume, stop, speed (0.8×–1.5×) and voice. The spoken sentence gets a soft
gold outline and the reader follows it. Swiping / scrolling / jumping to a bookmark makes narration follow you.
Auto-play and narration stop each other; opening another book cancels narration; the screen stays awake while reading.

## Voices (the "Voice" menu)
| Choice | What happens |
|---|---|
| **Auto · starts instantly** (default) | Reading starts at once with the **device voice**. In the background the Piper engine and the Amy voice download and start, are **benchmarked on the real book text**, and the reader switches to the AI voice at a sentence boundary **only if it speaks faster than it plays** (generation time ÷ speech time < 0.9). Otherwise the device voice simply carries on. Too slow → remembered for 3 days (choose Auto again to retry). |
| AI voices (Piper) | Forces a specific Piper voice: Amy / Ryan (low = smallest and fastest), Lessac, HFC, Ryan, Alba, Northern (medium = nicer, heavier). Shows download progress; falls back to the device voice for the session if the voice cannot keep up (median > 2.5× slower than speech) or stops responding. |
| Device voice | The browser's own speech voices. Also used for Chinese books (the Piper voices here are English). |

Falling back never overwrites your saved choice. On iPhone, installing an *Enhanced/Premium* voice (Settings → Accessibility →
Spoken Content → Voices) makes the device voice much better.

## How the AI voice works
* **Engine:** Piper VITS voices (ONNX) run with onnxruntime-web (WebAssembly, **1 thread**, no special HTTP headers needed). Text is
  phonemized with piper-phonemize (espeak-ng compiled to WASM). Everything runs in a **Web Worker** on the device; the book text is never sent anywhere.
* **Streaming:** a sentence is cut into pieces of ≤160 characters (at commas etc.); each piece is queued for playback as soon as it is generated, scheduled gap-free on the
  Web Audio clock, and only the first piece of a sentence moves the highlight. Only a few pieces are kept ahead; nothing is kept for the whole book.
* **Speed check:** warm-up is not timed; speed is the **median of recent pieces**.
* **Caching:** voice files are stored with the browser Cache API after the first download (and persistent storage is requested). iOS Safari can still evict it when space is low.
* **Where files come from (public CDNs, CORS):** voices + configs from `huggingface.co/rhasspy/piper-voices`; `onnxruntime-web@1.18.0` and `@diffusionstudio/piper-wasm@1.0.0` from jsDelivr.
  They can be overridden for testing with `window.__narrHfBase`, `__narrOrtBase`, `__narrPhBase`.

## Licences — please check before sharing the app
Piper: MIT. onnxruntime-web: MIT. piper-phonemize embeds **espeak-ng (GPL-3.0)**. **Each Piper voice has its own licence/model card** in the piper-voices
repository (some are public domain, some restrict use). Fine for personal use; read the voice's card before redistributing.

## Service worker
Not needed any more. `coi-serviceworker.js` is now a clean-up stub, and `index.html` unregisters any copy left over from the previous version.

## NOT tested — please be aware
* **The real Piper engine was never run.** The build environment has no internet, so the CDN file names, the phonemizer's calling convention and the voice URLs
  follow my knowledge of the Piper / piper-wasm / onnxruntime-web packages and are unverified. What *was* tested: the whole reading logic (Auto hand-over,
  slow-device fallback, skip flag, explicit voice, streaming of long sentences) against a simulated engine, and the worker's message flow and tensor shapes
  against fake libraries.
* No real iPhone / Android device was available. Because Auto starts with the device voice, a failure of the AI engine can only ever mean "keeps the device voice".
* If the AI voice never takes over on a phone, open the browser console and look for `[Read aloud]` lines — they state the reason (download failed, engine did not load, too slow).

## Remaining limitations
Scanned PDFs (pictures) are skipped; AI voices are English; no lock-screen controls / background playback guarantee; device-voice pause restarts the current sentence.
