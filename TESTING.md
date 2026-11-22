# Testing checklist

Run the automated checks first, then the manual pass on a phone (Android Chrome) and a desktop browser.

## Automated

```bash
node tools/generate-screens.mjs   # expect "Issues: 0"
node tools/validate-data.mjs      # expect "OK: no errors"
node tools/build-sw.mjs           # refreshes precache list and version
```

Results at delivery: 123 screens / 71 transactions (8 company-specific, encrypted), Issues 0; validation OK (27 movement types, 15 lessons, 79 tables described). A headless browser pass visited every route on 390×844 and 1440×900, opened all 71 transactions on every tab and clicked every step (each click activated the matching marker) with zero console errors, failed requests or page errors.

## Manual checklist

### Shell, language and theme
- [ ] First visit shows Arabic, RTL layout; AR | EN | FR switch re-renders the current page and persists after reload.
- [ ] Light/dark toggle persists; no unreadable text in either theme (check tables, chips, simulated-screen badges).
- [ ] Desktop: side navigation, breadcrumbs, split screen on transaction steps. Mobile (< 768 px): bottom navigation, no horizontal scroll.
- [ ] `Ctrl/⌘ K` and `/` open search; Escape closes it; filters MM, WM, LE, EWM, Inventory, Procurement, Production, Shipping, Administration narrow the results.

### Search
- [ ] `migo`, `MIGO`, `استلام`, `réception`, `101`, `M7021`, `/scwm/mon`, `quant` return relevant results.
- [ ] Arabic search ignores diacritics and alef/ya/ta-marbuta variants.

### Transactions
- [ ] Explorer lists 63 transactions while the company section is locked and 71 once it is unlocked; module and area filters, sorting and query parameters work.
- [ ] Each tab (overview, steps, fields, errors, practice, notes) renders in all three languages.
- [ ] Steps: clicking a step highlights the same numbered marker, field and arrow and scrolls it into view; clicking a marker selects the step; previous/next and keyboard arrows follow RTL direction.
- [ ] Zoom, pan, pinch (mobile), double-click zoom, fullscreen and focus mode work; markers keep their size when zooming; the screen stays sharp.
- [ ] Every simulated screen shows the “Training simulation” label.
- [ ] Favorite, bookmark, learned, share and notes (autosave) persist after reload.

### Reference modules
- [ ] Stock lifecycle: 7 stages, autoplay, detail panel, EWM vs classic notes.
- [ ] Stock statuses: tiles, diagram (mirrored in RTL), journey simulator totals.
- [ ] Movement types: list, filter, detail with ledger and reversal links.
- [ ] Error library: search and links back to transactions.

### Learning
- [ ] Three paths with 5 lessons each; lesson pages show objectives, sections, takeaways.
- [ ] Quiz: shuffled options, feedback with explanation, score; passing (≥ 70 %) marks the lesson done.
- [ ] Completing a path enables the certificate; PNG download and print work.
- [ ] Report page shows statistics; backup export → reset → import restores progress.

### PWA and offline
- [ ] Android Chrome offers *Install*; the installed app opens standalone with the correct icon and name.
- [ ] After the first full load, turn on airplane mode: dashboard, any transaction, its simulated screens, lessons and the studio still open; unknown pages show `offline.html`.
- [ ] After deploying a new version, an update toast appears; accepting it reloads once.

### Annotation Studio (`studio.html`)
- [ ] Not reachable from learner navigation; first visit asks to set a PIN; the note explains it is not secure authentication.
- [ ] Load image by drop, file picker and built-in simulated screen; *Load sample* works.
- [ ] Add markers, drag markers/arrow heads/boxes, draw a box, edit numbers/titles/descriptions, reorder, delete, renumber, undo.
- [ ] Save, reload page, *Open* the project from IndexedDB.
- [ ] Export JSON → Import JSON round-trip gives the same steps; an invalid file shows a list of errors.
- [ ] Export HTML opens standalone with working step sync; Download image produces an annotated PNG.
- [ ] Preview shows the learner viewer with synced steps.
- [ ] Adding the exported file to `data/annotations/` and the registry shows an admin/simulation switch on the transaction page.

### Content rules
- [ ] No development prompts, AI instructions, build steps or deployment notes appear anywhere in the learner interface.
- [ ] No simulated screen is presented as an SAP screenshot.
- [ ] Every button does something; no placeholder links.
- [ ] Company: a wrong code shows an error and keeps the section locked; the right code (any letter case, spaces ignored) unlocks 8 transactions; "Remember on this device" survives a reload; "Lock on this device" hides them again, including from search.
- [ ] A link to a Z transaction while locked shows the unlock prompt and opens the transaction after unlocking.
- [ ] Going back from a transaction to the explorer returns to the same scroll position.

