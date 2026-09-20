# The Last Light — first playable

Original haunted toy theatre, based on the attached generated reference board: crooked carved wood, painted tin, warm brass, plum nesting dolls, teal defenses, honey light and a midnight backdrop. No human anatomy, skeletal rigs, external meshes or simulated rigid bodies.

Palette: ink #141920, midnight #243343, plum #78394e, coral #c67461, teal #4d9187, brass #d7b477, cream #f2e3bc, wood #846044. All scenery and toys are geometry constructed in code. References are documentation only; no generated raster art ships in the game.

Scale: theatre floor 20 × 15 m; doll 1.25 m; top 1.3 m; music box 1 m; rolling lantern 1.2 m. Bodies face +Z, grounded at y=0. One tilted fixed camera, soft warm key and cooler fill, readable floor, curtain frame. Stage sockets carry UI numbers, not texture glyphs.

Scope: one curved lane, six sockets, two defenses, nested enemies, mobile/desktop moving spotlight, six waves through dawn, mutually exclusive upgrades, synthesized audio, pause and restart. The first version is a local playable slice, not a submitted jam entry.

Recipe: https://github.com/404-Repo/404-game-recipe (read GAME.md, 404.md, asset contract and traps). Agent-written geometry from the reference; compare three construction variants per asset. Keep code history and evidence. No copied reference-game assets or code.

Acceptance: real Start and restart work; light moves with pointer/touch and keyboard; light boosts both sides; doll shells release faster smaller dolls; top/music upgrades alter mechanics; clear win/loss; pause freezes game; portrait controls remain reachable; no runtime errors or remote runtime dependencies.


## Presentation pass — September 20

Keep the same toy designs and palette. Add wear in the material shader after the recipe loader merges the geometry; grain fades at small screen sizes to avoid aliasing. Keep the surrounding floor clean and dark. Warm point lights and footlight glows sit against a cooler violet fill, with a slow dawn transition. The 64 px radial glow texture is drawn at runtime; there are no shipped raster assets.

Movement conveys construction: a short compression before each hop, a wooden wobble on impact, two curved pieces when a doll breaks. Upgrade decoration is driven by the existing simulation state, including actual sleep and the invitation's strong slow. It does not change attack ranges or rules. Circling miniature tops are decorative; the wide-orbit damage remains an area sweep.

The selected doll model now has an uneven smile, scarf knot and painted apron dots. Candidate gallery files preserve the original selection exercise; the current shipping models in `game/assets/` include this pass. The original candidate generator is provenance, not a build step, and would overwrite these later model edits if rerun.


## Paper ghosts — gameplay pass

A sixth procedural asset joins the toy cast: a torn, folded sheet with a surprised face. It floats with a small sway, folds into a blue silhouette in darkness, and opens into warm paper inside the moving lantern radius. Its face follows the camera horizontally so the reveal reads on the small stage. Defeat scatters paper scraps. The live hidden/exposed count uses the same lantern test as combat, while the folded appearance eases over a fraction of a second.

Ghosts join from hour two, with a shared roster driving both preview text and actual arrivals. Music affects them in darkness; damage requires lantern exposure. The stage lamps are decorative: only the moving lantern opens a ghost. No second lane, new upgrade branch or rig was added.


## Night gifts — gameplay pass

Three paper cards appear after hours 1, 3 and 5. Each offers a new gift or the complete stronger version of an owned gift. They are free and last for the current night. The player can close the offer to plan defenses, then return through the bell button; a pending gift prevents advancing the wave. Cards fit compact portrait and landscape screens, and owned gift names/ranks remain visible.

Encore turns a Lullaby wake into a lilac floor pulse with sparks. Splash cannot trigger another Encore, and hidden ghosts stay immune. Overwound increases top rotation and attack cadence while reducing actual range; the selected tower's range ring uses the simulation value. Ghostlight adds a pale teal floor disc, rim and drifting central mote at a defeated ghost's position. Their radius and fade are driven by the real pool state. These effects use only Three.js constructor geometry and existing generated materials; there is no new imported model or rig.

Ghostlight extends the earlier light rule: both the moving lantern and a temporary pool reveal ghosts, boost defenses and accelerate enemies. Decorative stage lamps remain decorative. The original six waves, tower prices and asset models are unchanged in this pass. A Tin Drummer remains a separate proposed gameplay addition.
