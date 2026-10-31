# Focus Reader — Read Aloud (audiobook narration)

## What was added

One speaker button. Tap it and the book is read aloud from the sentence you are on, through every chapter and page, to the end.

| Where | Control |
|---|---|
| Phone, normal mode | speaker icon in the bottom dock (next to bookmark / theme); also "Read aloud" in the ☰ menu |
| Desktop | speaker icon in the top toolbar |
| Focus Mode | small speaker button next to the auto-read controls |

While narration is active a compact bar appears: status line, progress, **pause/resume**, **stop**, **speed** (0.8×–1.5×) and **voice**.
Tapping the speaker again pauses/resumes.

* The sentence being spoken gets a soft gold outline and the reader keeps it at the reading line (Focus Mode: it becomes the focused sentence; normal mode: the text glides to it).
* Swipe / scroll / jump to a bookmark while it is reading → narration **follows you** and carries on from where you went.
* Starting auto-play stops narration (and vice-versa) — they both move the reader, so only one runs.
* Opening another book cancels narration. Stop cancels everything immediately.
* The screen is kept awake while narrating (Screen Wake Lock).

Everything is inside `index.html`. **No extra files, no build step.**

### Other fix made while integrating
`setNodeContent()` was called in the image-page code but no longer existed, which threw a `ReferenceError` whenever a book contained image pages. It now triggers a normal re-render.

## How it works

* **Source text:** the reader's existing `sentences[]` array (already holds every chapter/page of the PDF/EPUB/TXT in order). Image-only pages and non-speakable lines are skipped; a notice says how many.
* **Units:** one sentence = one audio unit, so the highlight is exact (no "total duration ÷ sentences" guessing). Sentences over 260 characters are split at clauses for the model and joined back into one unit.
* **Text clean-up for speech:** ALL-CAPS headings → Title Case + pause; dashes → short pauses; footnote markers `[12]` and URLs removed; list bullets dropped. (Kokoro itself expands numbers, years, money, times, titles such as Mr./Dr.)
* **AI voice:** Kokoro-82M through `kokoro-js`, in a Web Worker so the page never freezes. Generates 1–3 sentences ahead of playback; audio is scheduled gap-free on the Web Audio clock. Nothing is kept for the whole book (tested: 6,000-sentence book, queue never above 3 sentences, JS heap flat).
* **Device voice:** the browser's own speech voices — used (a) if you choose "Device voice", (b) automatically if the AI voice cannot load or fails 3 times, (c) for Chinese books (kokoro-js's phonemizer is English-only).
* **Looks slow?** If the AI voice cannot keep up with real time on a phone, you get "Preparing speech…" pauses; after four stalls a hint suggests the Device voice.

## Libraries, models, licences, sizes

| Item | Version | Licence | Size / source |
|---|---|---|---|
| Kokoro-82M ONNX, 8-bit (`q8`) | `onnx-community/Kokoro-82M-v1.0-ONNX` | Apache-2.0 | ≈ 92 MB, one-time, from huggingface.co |
| Voice style files | per voice | Apache-2.0 | under 1 MB each, loaded when a voice is first used |
| kokoro-js (`dist/kokoro.web.js`, pinned 1.2.1) | 1.2.1 | Apache-2.0 | ≈ 2.1 MB, jsDelivr CDN |
| Transformers.js (bundled in kokoro.web.js) | 3.8.x | Apache-2.0 | included above |
| ONNX Runtime Web (WASM) | 1.22 | MIT | tens of MB of `.wasm`, fetched by Transformers.js from jsDelivr |
| phonemizer / eSpeak NG (inside kokoro.web.js) | 1.2.1 | npm lists Apache-2.0; it embeds **eSpeak NG, which is GPL-3.0** | included above |

**Licence note:** the eSpeak NG component is GPL-3.0. This is fine for personal use and for loading it from a CDN as above; if you redistribute a bundled copy commercially, read the eSpeak NG terms first. I could not verify the model size from this environment (Hugging Face was not reachable); ≈ 92 MB is the published size of the 8-bit file.

I chose the 8-bit model on purpose: it is the smallest practical download and runs everywhere WebAssembly runs. WebGPU (faster, but a 300 MB+ model and not reliable on mobile browsers) is deliberately **not** used.

## First use and later uses

1. First tap: status shows **"Downloading voice… 37% (34 / 92 MB, one-time)"**. You can pick **Device voice** at any moment to cancel the download and start reading immediately.
2. When the download finishes, narration starts a second or two later.
3. Later visits: the model is read from the browser cache — no download, starts in a few seconds.

**Caching caveat:** model files are stored by the browser in Cache Storage (Transformers.js default); the app also asks the browser for persistent storage. Browsers can still evict this when space is low, and iOS Safari is the most aggressive about it — expect an occasional re-download.

## Privacy

* The book text is processed **on your device only** (worker + WebAssembly). It is never sent anywhere.
* Downloaded from third parties: the library code and WASM runtime (jsDelivr) and the model/voice files (huggingface.co). No analytics, no keys, no accounts.
* Device voice: the app prefers on-device system voices, but some browsers expose cloud voices (e.g. some Chrome voices on some platforms). The app cannot see which kind it was given.

## Deployment

Static hosting only (GitHub Pages works). Replace `index.html`; nothing else is needed. All paths are absolute CDN URLs and the worker is created from an in-page blob, so it works in a repository sub-folder. No special HTTP headers are required. Without cross-origin-isolation headers (which GitHub Pages cannot set) ONNX Runtime uses a single thread — slower on phones, but working.

## Testing that was done

Run in headless Chromium (desktop and phone viewport) with a stand-in engine that returns synthetic tones, plus a local fake of the `kokoro-js` module to exercise the **real** blob-worker, dynamic-import, progress and transferable-audio path. 29 checks, all passing:

whole book read in order with no skips/repeats · image pages and non-text lines skipped · audio chunks never overlap · stop is immediate (no more highlights, no more audio, at most the one in-flight sentence finishes generating) · pause/resume continues exactly · jumping elsewhere re-starts narration there · voice/speed change · new book cancels narration · Focus Mode and normal mode follow the narrated sentence · device-voice engine (read, pause, stop) · AI-load failure falls back to device voice · Chinese book uses device voice · model-progress display · auto-play, opacity slider and earlier features unaffected · no JS errors.

Also: text clean-up and splitting verified; 6,000-sentence memory check.

## NOT tested — please be aware

* **The real Kokoro model was never run.** This environment cannot reach Hugging Face. The worker code follows the installed `kokoro-js` 1.2.1 API (checked in its source), but real-model speed and sound quality are unverified.
* **No real iPhone, iPad or Android device.** Everything below is expected behaviour, not measured behaviour.

## Compatibility expectations

| Platform | Expected |
|---|---|
| Desktop Chrome / Edge | AI voice should work; speed should be faster than real time. Device voice works. |
| Desktop Firefox | AI voice should work (module workers need Firefox 114+). Device voice works. |
| Desktop Safari | AI voice should work (Safari 16.4+). Device voice works. |
| Android Chrome | AI voice should work; may run slower than real time on mid-range phones (single-threaded WASM) — then use Device voice. Background playback is not guaranteed. |
| iPhone Safari (iOS 16.4+) | AI voice may work on recent iPhones; older ones may run out of memory loading the model, in which case it falls back to the device voice automatically. The app asks iOS to play even with the silent switch on (iOS 16.4+). Locking the phone or switching apps usually pauses web audio — the app resumes when you return. |

## Remaining limitations

* **Scanned PDFs** contain pictures, not text. They are skipped with a notice; OCR is not included.
* **AI voices are English only** (US/UK). Other languages use the device voice.
* **Background / lock-screen playback** cannot be promised from a web page; there are no lock-screen media controls.
* **Phone speed:** if generation is slower than speaking, expect short "Preparing speech…" waits.
* **Voice choice before starting:** the voice/speed menus appear once narration starts (including during the download). Your choice is remembered.
* Device-voice pause restarts the current sentence on resume (browser speech APIs cannot pause reliably).
