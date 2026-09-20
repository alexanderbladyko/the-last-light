# The Last Light

A haunted toy theatre tower defense. Keep the last stage light alive until dawn.

```sh
npm install
npm run dev
```

Open the URL printed by the server. All game assets are original procedural Three.js modules; the reference board is in `design/` and is not shipped. Run `npm test` for simulation tests and `npm run build` for a standalone `dist/` folder.

First playable built September 20, 2026. Local development has no paid services or external runtime requests.

## Play

- Raise the curtain. A spinning top and a music box are already in place.
- Tap a numbered brass socket to buy a defense; tap an occupied socket to choose an upgrade. The two branches are mutually exclusive for that toy.
- Drag on the floor to move the lantern, use WASD / arrows, or drag the on-screen joystick in narrow layouts.
- The light doubles top firing speed and strengthens music, but makes enemies move 65% faster. Positioning matters.
- Ring the bell to start each hour. Survive six waves; keep at least one of the stage light's 12 points.
- P or the pause button opens intermission. The 1× / 2× button speeds up combat. Sound starts after the first gesture and can be muted on desktop.

## Defenses

Spinning top (36 brass): area damage. Upgrade for 42 brass to **Bowling top**, a penetrating projectile with longer reach, or **Wide orbit**, a larger area with weaker individual hits.

Music box (42 brass): slows toys in range. Upgrade for 42 brass to **Lullaby**, which sleeps toys after uninterrupted listening until they take damage, or **Invitation**, a wider field that strongly slows toys trying to leave after passing the box. The prototype uses a tether effect rather than route-changing attraction.

Breaking a large matryoshka releases a smaller, faster one. Each shell earns brass. Cleared waves also award brass. Packing a toy away refunds 65% of its purchase and upgrade cost.

## Verify and build

```sh
npm test        # 15 mechanics and full-night checks
npm run check   # asset contracts, triangle counts, folder size
npm run build   # produces dist/ with local Three.js included
```

The standalone game is `dist/`. Serve it as a static folder, including under a URL prefix. The app exposes the jam telemetry contract; its Start selector is `#startb`, and its movement control is `#stick` on phones. Before entry, run the official `harness/jam.mjs` against the eventual public URL and commit. No official live verdict or submission exists yet.

## Design and evidence

- [Style and scope](design/STYLE.md)
- [Reference image and exact imagegen prompt](design/REFERENCE-PROMPT.md)
- [Three candidates per asset and selection rationale](design/ASSET-SELECTION.md); open `/design/gallery.html` in the local server to compare four views.
- [Playtest evidence and remaining limitations](design/PLAYTEST.md)

The first version intentionally contains one stage, two defense types and nested-doll enemies. More enemy types, additional acts, save/resume and a full balance pass remain future work.

Third-party code: Three.js 0.183.2 and its BufferGeometryUtils (MIT, `game/vendor/THREE-LICENSE.txt`); the unmodified 404 recipe asset loader (Apache-2.0, `design/RECIPE-LICENSE`). All toy modules, stage, game rules, UI, audio and input code were written for this game. The reference board was generated with the built-in imagegen tool and is not shipped in the game.
