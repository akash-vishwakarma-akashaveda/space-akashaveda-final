# Akashaveda website

Production build of the homepage design `project/Akashaveda Home v11.dc.html` (Vite + React + TypeScript, three.js).

```sh
npm install
npm run dev        # local dev server
npm run build      # typecheck + production build to dist/
npm run preview    # serve dist/
npm run models     # rebuild src/assets/models from the NASA sources in project/models
```

## Layout

- `src/components/Journey.tsx`: sticky 3D stage and the nine scroll chapters, from problem through solution to the GS → MCS → SSA pass. It also holds the status rail and the console pop-ups.
- `src/components/Consoles.tsx`: GS-01, Vyuh and Chakra dashboards. Approving in Vyuh and sending from Chakra share state.
- `src/components/Lower.tsx`: pass summary, services tabs, Chakra capabilities, deployment, missions, leadership, contact and footer.
- `src/scene/*.js`: imperative three.js / canvas modules ported from the prototype, typed by the `.d.ts` files next to them. `loaders.js` handles meshopt model loading; `quality.js` picks the device quality tier.
- `src/data/`: page copy (`content.ts`) and simulated telemetry (`sim.ts`). All console figures are illustrative.
- `src/assets/models/`: optimized NASA 3D Resources models, built by `scripts/optimize-models.mjs` and served with hashed file names.
- Theme tokens are in `src/styles/global.css` (`[data-theme]` on `<html>`). Dashboards use `.force-dark` so they stay dark in light mode.

The contact form opens a pre-filled email to contact@akashaveda.com.

## Performance

The page carries a full 3D scene, so it is built to stay light:

- **Loading.** First load is about 1.1 MB (it was 4.5 MB in the prototype setup). The models are stripped of unused UVs and textures, simplified and meshopt-compressed: the dish is 126 kB and the satellite 147 kB. three.js and the scene code are split out and start downloading alongside React, with the models preloaded. The Services 3D turntable only loads when you scroll near it. Fonts load only the weights in use.
- **Rendering.** Static geometry is merged per material and the debris is instanced, so frames take 22–80 draw calls instead of up to 350. The shadow map redraws only when the antenna moves, and all shaders compile in the background after load. Invisible sprites, beams and labels are skipped. The live orbit view on the Chakra wall renders at half rate, and only while it's in view.
- **Frame pacing.** The scene runs at 30 fps when the camera is at rest and at full rate while scrolling. It pauses when off-screen or behind a dashboard pop-up. The Services turntable and the space backdrop run at 30 fps.
- **Quality.** Phones, tablets and very low-end devices start on a low tier (no shadows or MSAA, pixel ratio 1, fewer stars and debris). Everything else starts high, and a governor steps pixel ratio and shadows down if frames keep running long. `prefers-reduced-motion` turns off pointer parallax and the animation of the space backdrop. Force a tier with `?quality=low` or `?quality=high`.
- **React.** Scroll handling is throttled to one update per animation frame and reads cached chapter positions, not layout. Chapter content and the lower page are memoized, so scrolling only re-renders the status rail, and the telemetry tick re-renders only an open dashboard.
- **Profiling.** Add `?perf` to expose `window.__scene.stats()`, which reports draw calls, triangles, pixel ratio and scene JS time.

---

# Design handoff notes (Claude Design)

This is a **handoff bundle** from Claude Design (claude.ai/design).

A user mocked up designs in HTML/CSS/JS using an AI design tool, then exported this bundle so a coding agent can implement the designs for real.

## What you should do — IMPORTANT

**Read the chat transcripts first.** There are 1 chat transcript(s) in `chats/`. The transcripts show the full back-and-forth between the user and the design assistant — they tell you **what the user actually wants** and **where they landed** after iterating. Don't skip them. The final HTML files are the output, but the chat is where the intent lives.

**Read `project/Akashaveda Home v11.dc.html` in full.** The user had this file open when they triggered the handoff, so it's almost certainly the primary design they want built. Read it top to bottom — don't skim. Then **follow its imports**: open every file it pulls in (shared components, CSS, scripts) so you understand how the pieces fit together before you start implementing.

**If anything is ambiguous, ask the user to confirm before you start implementing.** It's much cheaper to clarify scope up front than to build the wrong thing.

## About the design files

The design medium is **HTML/CSS/JS** — these are prototypes, not production code. Your job is to **recreate them pixel-perfectly** in whatever technology makes sense for the target codebase (React, Vue, native, whatever fits). Match the visual output; don't copy the prototype's internal structure unless it happens to fit.

**Don't render these files in a browser or take screenshots unless the user asks you to.** Everything you need — dimensions, colors, layout rules — is spelled out in the source. Read the HTML and CSS directly; a screenshot won't tell you anything they don't.

## Bundle contents

- `README.md` — this file
- `chats/` — conversation transcripts (read these!)
- `project/` — the `Akashaveda website redesign` project files (HTML prototypes, assets, components)
