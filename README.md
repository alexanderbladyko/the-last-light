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
- Read the next-wave roster before ringing the bell. Paper ghosts join from hour two. Shine your moving lantern on them near a spinning top: they are immune to damage in darkness.
- After hours 1, 3 and 5, choose one free night gift. Mix gifts or strengthen the same gift up to rank III. You can plan your defenses first; the bell waits for your choice.
- Ring the bell to start each hour. Survive six waves; keep at least one of the stage light's 12 points.
- P or the pause button opens intermission. The 1× / 2× button speeds up combat. The score starts with Raise the curtain. Tap ♫ to mute everything, or adjust Music and Toy sounds separately in intermission. The mix is saved on this browser.

## Defenses

Spinning top (36 brass): area damage. Upgrade for 42 brass to **Bowling top**, a penetrating projectile with longer reach, or **Wide orbit**, a larger area with weaker individual hits.

Music box (42 brass): slows toys in range. Upgrade for 42 brass to **Lullaby**, which sleeps toys after uninterrupted listening until they take damage, or **Invitation**, a wider field that strongly slows toys trying to leave after passing the box. The prototype uses a tether effect rather than route-changing attraction.

Paper ghosts unfold and reveal their faces inside the lantern radius or an active Ghostlight pool. Tops ignore hidden ghosts; an airborne bowling top can hurt one only while it is exposed. Music slows and sleeps ghosts even in darkness. A ghost gives 7 brass, has no nested doll, and costs 2 light if it escapes.

Breaking a large matryoshka releases a smaller, faster one. Each shell earns brass. Cleared waves also award brass. Packing a toy away refunds 65% of its purchase and upgrade cost.

## Night gifts

Three free choices per night, offered after hours **1, 3 and 5**. A gift applies immediately and lasts until restart. Each offer presents Encore, Overwound and Ghostlight; picking an owned gift raises its rank. These are separate from individual toy branches and cost no brass. Selected gifts stay visible in the workbench and on the ending screen.

| Gift | Rank I | Rank II | Rank III | Rule |
| --- | --- | --- | --- | --- |
| Encore | 6 splash damage | 10 splash damage | 14 splash damage | Striking a sleeper creates a shockwave within 2.25 m. Pair with Lullaby. |
| Overwound | 40% faster / 10% less reach | 80% faster / 20% less reach | 120% faster / 30% less reach | Affects all current and future tops, including bowling flight. |
| Ghostlight | 1.6 m radius / 3 sec | 1.9 m radius / 4 sec | 2.2 m radius / 5 sec | Defeated ghosts leave a temporary light pool. |

Encore still respects ghost immunity. Splash wakes nearby sleepers without triggering more shockwaves; a broken source doll's newborn is excluded from that shockwave. Ghostlight reveals ghosts and applies the same defense/enemy acceleration as the lantern. Overlapping lights do not multiply the boost. Pools expire during combat and preparation, freeze during pause, and are cleared by restart. At most eight pools are retained.

## Presentation pass

The theatre now has warm lantern and footlight glows, a faint light shaft, drifting dust, hanging stars, procedural wood grain and worn paint. Dolls anticipate their hops, squash on impact and shed two tumbling shell pieces. Wide orbit adds two circling miniature tops; bowling has brass chevrons; lullaby has floating moons; invitation draws gold threads to toys being held back. Music boxes release floating notes, and an original atmospheric score plays after Start. The lighting gradually warms toward dawn.

All of this is generated locally. No external images, model downloads, paid services or new dependencies were added. That presentation pass left the rules and upgrade prices unchanged; the subsequent paper-ghost pass adds the encounter described above.

## Music and phones

**Beneath the Boards** is an original atmospheric score in `game/audio.js`: long low tones, slowly overlapping suspended chords, sparse distant bells, a faint ghost layer and a soft late-hour pulse. Its eight slow phrases last about 74 seconds. Dawn opens into a warmer sustained chord; defeat fades into an unresolved low tone. The stereo room response is generated locally once. There are no samples, music downloads, external services or new dependencies.

Audio time stays independent of 1× / 2× game speed. Pause and page hiding suspend audio; returning to a hidden game requires resuming play. Master mute and independent music/effects volumes persist locally. Resuming or restoring music from silence restarts the current phrase so the sustained bed returns immediately. A short scheduling horizon avoids frame-dependent timing; late callbacks skip missed time, and finished oscillator nodes are disconnected. Toy effects retain their crisp attacks and separate volume.

Phone layouts support compact portrait and short landscape screens, with larger toolbar controls, a bottom upgrade panel in portrait, compact landscape welcome/pause tickets, scrollable dialogs and safe-area spacing. Browser viewport checks covered 360 × 640, 390 × 844 and 844 × 390. These are desktop-browser layout/input checks, not physical iPhone/Android or mobile network benchmarks. See the playtest log for exact evidence.

## Verify and build

```sh
npm test        # 48 gameplay, gift and audio checks
npm run check   # asset contracts, triangle counts, folder size
npm run build   # produces dist/ with local Three.js included
```

The standalone game is `dist/`. Serve it as a static folder, including under a URL prefix. The app exposes the jam telemetry contract; its Start selector is `#startb`, and its movement control is `#stick` on phones. Before entry, run the official `harness/jam.mjs` against the eventual public URL and commit. No official live verdict or submission exists yet.

## Design and evidence

- [Style and scope](design/STYLE.md)
- [Reference image and exact imagegen prompt](design/REFERENCE-PROMPT.md)
- [Three candidates per asset and selection rationale](design/ASSET-SELECTION.md); open `/design/gallery.html` in the local server to compare four views.
- [Playtest evidence and remaining limitations](design/PLAYTEST.md)

The current playable contains one stage, two defense types, nested dolls, paper ghosts and three gifts with three ranks each. The Tin Drummer is a proposed next enemy. Additional acts, save/resume and broader balance testing remain future work.

Third-party code: Three.js 0.183.2 and its BufferGeometryUtils (MIT, `game/vendor/THREE-LICENSE.txt`); the unmodified 404 recipe asset loader (Apache-2.0, `design/RECIPE-LICENSE`). All toy modules, stage, game rules, UI, audio and input code were written for this game. The reference board was generated with the built-in imagegen tool and is not shipped in the game.
