# LogiAcademy — SAP S/4HANA Logistics Learning Platform (Professional Edition)

A static, offline-capable learning platform for SAP S/4HANA logistics (MM inventory and purchasing, classic WM, LE shipping, EWM, quality/production integration and basis tools). Arabic first (full RTL), with English and French. Runs entirely in the browser and deploys to GitHub Pages without any server code.

> SAP, S/4HANA, SAP GUI and Fiori are trademarks of SAP SE. This project is an independent training resource. Every built-in screen is a **training simulation drawn for this platform**, not an SAP screenshot, and is labelled as such in the interface.

---

## 1. What is included

| Area | Content |
|---|---|
| Transactions | 63 standard transactions in 8 groups, plus 8 company-specific Z transactions in an encrypted section, each with purpose, scenario, when to use, prerequisites, numbered steps, key fields, results, errors with causes and fixes, troubleshooting, tables, related transactions, movement types, Fiori apps, exercises, worked example and system availability (ECC / S/4HANA / compatibility scope / Stock Room Management / EWM / LE-TRA) |
| Simulated screens | 123 SVG screens (9 of them encrypted with the company section) with geometry for numbered markers, arrows and highlighted fields, two-way synced with the step list |
| Movement types | 27 movement types with debit/credit, stock effect, documents, scenario and reversal |
| Stock statuses | 7 statuses, transition diagram, accounting journey simulator |
| Stock lifecycle | 7 interactive stages (receipt → inspection → storage → production → packing → inventory → shipping) |
| Learning | 3 paths × 5 lessons, 4-question quizzes, 6 practical scenarios, progress, certificates (PNG/print), report |
| Personal space | Favorites, bookmarks, notes, search history, recently viewed, backup export/import — all in `localStorage` |
| Search | Instant multilingual search (codes, names, AR/EN/FR terms, errors, movement types, lessons, glossary) with module/area filters |
| PWA | Manifest, service worker, install prompt, offline fallback, cached content and screens |
| Annotation Studio | `studio.html` — admin tool to annotate screenshots, export/import JSON, export standalone HTML and PNG |

## 2. Project structure

```
index.html            App shell (no inline scripts)
studio.html           Annotation Studio (admin, not linked from learner navigation)
offline.html, 404.html
manifest.json         PWA manifest (icons, shortcuts, screenshots)
service-worker.js     Precache + runtime caching (generated list, see §6)
css/app.css           Design system (light/dark, RTL logical properties, print)
css/studio.css        Studio layout
js/app.js             Router setup and boot
js/core/              store, i18n, data loader + search, router, dom helpers, icons, PWA
js/views/             dashboard, explorer, transaction, viewer, lifecycle, stock, movements,
                      errors, learn, me, misc, shell, common
js/studio/studio.js   Annotation Studio
data/                 All content as JSON (see §4)
images/screens/       Generated SVG training simulations
assets/               Fonts (IBM Plex Sans Arabic, IBM Plex Mono), icons, store screenshots
tools/                Node build/validation scripts (not needed at runtime)
```

## 3. Run locally

Any static server works (ES modules and the service worker need `http://`, not `file://`):

```bash
cd logiacademy
python3 -m http.server 8080
# open http://localhost:8080/
```

## 4. Deploy to GitHub Pages

1. Create a repository and push the **contents** of this folder to the default branch (the `.nojekyll` file must be at the root).
2. *Settings → Pages → Build and deployment*: Source **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Wait for the Pages build, then open `https://<user>.github.io/<repo>/`.

All paths are relative, so the site works in a sub-folder (project pages) as well as at a domain root. `404.html` redirects unknown deep links back to the hash router.

**Updating a deployed site:** after changing files run `node tools/build-sw.mjs`, commit, push. Returning visitors see an “Update available” toast; the new version activates when they accept it.

## 5. Content: where to edit

All learner content lives in `data/` and is trilingual: every text is an object `{ "ar": "…", "en": "…", "fr": "…" }` (lists are `{ "ar": [...], "en": [...], "fr": [...] }` with the same length in each language).

| File | Content |
|---|---|
| `data/catalog.json` | List of content files loaded at start |
| `data/transactions/*.json` | Transactions, grouped by area |
| `data/screens.json` | Generated geometry of the simulated screens (do not edit by hand) |
| `data/movement-types.json`, `stock-statuses.json`, `lifecycle.json` | Reference modules |
| `data/modules.json`, `tables.json`, `glossary.json`, `errors-general.json` | Shared reference data |
| `data/learning/paths.json`, `beginner.json`, `intermediate.json`, `advanced.json` | Paths, lessons, quizzes, scenarios |
| `data/i18n/ui.json` | Interface strings (generated from `tools/ui-strings.mjs`) |
| `data/annotations/registry.json` | Admin annotations shown to learners (see §7) |

### Transaction schema (summary)

```json
{
  "code": "MIGO", "module": "MM", "areas": ["inventory"], "level": 1, "systems": ["ecc", "s4"],
  "name": {…}, "summary": {…}, "purpose": {…}, "scenario": {…},
  "whenToUse": {…lists…}, "prerequisites": {…lists…},
  "steps": [{ "f": "po", "t": {…}, "d": {…} }],
  "fields": [{ "l": "Purchase Order", "tech": "EBELN", "d": {…} }],
  "results": {…lists…},
  "errors": [{ "id": "M7021", "msg": "Deficit of …", "c": {…}, "s": {…} }],
  "troubleshooting": {…lists…}, "tables": ["MATDOC"], "related": ["MB51"], "mvts": ["101"],
  "fiori": [{ "id": "F0843", "n": "Post Goods Receipt for Purchasing Document" }],
  "exercises": [{ "t": {…}, "s": {…} }], "example": {…}, "availability": {…}, "keywords": {…}
}
```

Each step key `f` must exist on one of the transaction's simulated screens.

### Simulated screens

Screens are described in code (`tools/screens/specs-*.mjs`, helpers in `lib.mjs` and `kit.mjs`) and rendered to SVG:

```bash
node tools/generate-screens.mjs   # writes images/screens/*.svg and data/screens.json, reports "Issues: N"
```

`Issues` must be `0`: the generator checks that every step key of every transaction exists on a screen.

### Validate everything

```bash
node tools/validate-data.mjs      # language completeness, list parity, cross-references, quiz answers
node tools/ui-strings.mjs         # regenerate data/i18n/ui.json after editing interface strings
node tools/build-sw.mjs           # refresh the offline precache list and cache version
```

## 6. Offline and PWA

* `service-worker.js` precaches the app shell, fonts and icons (list generated by `tools/build-sw.mjs`), then discovers all data files, simulated screens and registered annotations from `data/catalog.json` at install time.
* Navigation: network first (4 s timeout) → cached page → `offline.html`. Data: stale-while-revalidate. Other assets: cache first.
* Progress, favorites, notes, theme and language are stored locally (`localStorage` key `la:v1`). Learners can export/import a backup from *My space → Settings*.

## 7. Annotation Studio (administrators)

Open `studio.html` directly (it is intentionally not linked from the learner navigation).

1. **Access** — the first visit asks for a PIN, stored as a SHA-256 hash in this browser. **This is client-side protection only, not secure authentication**: the studio page and every published file are publicly readable on GitHub Pages. Never put confidential screenshots or data in annotations you publish.
2. **Image** — drop a PNG/JPG/WebP, choose a file, or start from a built-in simulated screen. Choose the correct *Image source*: `simulated`, `supplied` (training-team screenshot) or `authentic`. The learner view always shows the source label; never mark a simulation as authentic.
3. **Annotate** — *Add marker* then click; *Select & drag* to move markers, arrow heads and boxes (Shift while dragging a marker also moves its arrow); *Draw box* for the selected step. Edit number, title and description in the side panel; reorder, delete, renumber; `Ctrl+Z` undo; arrow keys nudge a focused marker.
4. **Save / Open** — projects are stored in IndexedDB on this device.
5. **Export** — *Export JSON* (coordinates in percent of the image, optionally embedding the image), *Export HTML* (self-contained page with the image and an interactive step viewer), *Download image* (annotated PNG). *Import JSON* validates the file and lists every problem.
6. **Publish to learners** — copy the JSON to `data/annotations/`, add the entry shown in the *Publishing* tab to `data/annotations/registry.json`, run `node tools/build-sw.mjs`, commit and push. The transaction page then offers a switch between the admin annotation and the built-in simulation.

Annotation JSON format:

```json
{
  "transaction": "MIGO",
  "title": "Goods receipt for purchase order",
  "language": "ar",
  "source": "supplied",
  "screenshot": "migo-gr.png",
  "width": 1366, "height": 768,
  "steps": [
    { "id": 1, "title": "Select A01", "description": "…", "x": 12.5, "y": 18.2,
      "arrow": { "enabled": true, "targetX": 20.1, "targetY": 25.4 },
      "box": { "x": 15, "y": 22, "w": 18, "h": 6 } }
  ]
}
```

`screenshot` may be a file name (resolved under `images/screens/`), a relative path, or a `data:` URL. A sample is in `data/annotations/samples/migo-sample.json` (*Load sample* in the studio).

## 8. Limitations of a static deployment

* No server: no accounts, no shared progress across devices, no central reporting. Progress is per browser; clearing site data erases it (use backup export).
* The studio PIN is not security; GitHub Pages serves every file publicly.
* Certificates are generated locally and are not verifiable credentials.
* Accounting entries shown are teaching examples; real postings depend on account determination and configuration in each system.
* SAP availability statements reflect the state verified when the content was written (classic WM compatibility-scope usage rights ended at the end of 2025; Stock Room Management available with reduced scope; LE-TRA usage rights until 2030). Check current SAP notes for your release.

## 9. Testing

See [TESTING.md](TESTING.md) for the manual and automated checklist.

## 10. Company-specific section (locked)

The company's own Z transactions are not stored as readable files in this site. They live in a private folder outside the repository and are published only as `data/secure/company.json`, encrypted with AES-256-GCM. The key is derived in the browser from the access code (PBKDF2-SHA256, 600 000 iterations). Learners open **Company** in the menu, enter the code, and can choose to be remembered on that device; the standard content stays open to everyone.

How strong this is depends on the code: a short code can be guessed by someone who downloads the file and tries many codes offline. Use a long code (12+ characters) for anything sensitive, share it privately, and change it by rebuilding the file when people leave the team. Anyone who already unlocked the content may have kept a copy.

Private folder layout (keep it out of any public repository):

```
private/
  tx/custom.*.mjs           transaction texts (authoring format)
  screens/specs-z.mjs       simulated screens for the Z transactions
  build/                    generated: custom.json, screens.json, images/*.svg
```

Rebuild after any change:

```
node authoring/build-tx.mjs custom                       # writes private/build/custom.json
LOGI_PRIVATE=../private node tools/generate-screens.mjs  # public screens + private screens
LOGI_PRIVATE=../private node tools/validate-data.mjs
LOGI_PRIVATE=../private ACCESS_CODE='your code' node tools/build-secure.mjs
node tools/build-sw.mjs
```

The simulated screens use demo values only; never put server names, file paths, real customers or real document numbers into them.
