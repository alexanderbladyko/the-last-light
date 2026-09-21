# First playable validation — September 20, 2026

## Automated gameplay checks

`npm test`: 15 tests covering valid purchases, affordability, exclusive upgrade branches, nested doll spawning, spotlight acceleration on both sides, pause, bounded movement, waking sleepers, loss, dawn, the orbit range, bowling penetration, lullaby activation and listening reset, plus a complete six-wave strategy.

The starter setup originally survived without intervention. Balance was changed so later shells get progressively tougher. The unchanged starting arrangement now loses in hour three; an economy-valid strategy that buys and upgrades defenses reaches dawn. This establishes that investment matters, not that the game is competitively balanced.

## Browser checks

- Desktop at 1280 × 900 and portrait at 390 × 844.
- Real Start button, socket selection, purchases and upgrade locking.
- Portrait joystick drag moved the lantern from [-1, 0] to approximately [-1.50, -2.25], over two metres.
- Live waves show moving nested dolls, attack pulses, projectile tops, music pulses and health bars.
- Telemetry exposed every frame through the official `__READY__`, `__START__`, and `__GAME__` contract. UI interactions do not invoke test hooks.
- The initial portrait build scene reported 43 draw calls / 25,794 triangles; a four-defense scene reported 49 / 28,610. These are samples, not a guaranteed worst-case budget or a real-phone performance measurement.

## Packaging

`npm run check` validates the five selected asset modules and reports the game directory size, approximately 2.2 MB before compression. `npm run build` emits a standalone folder. Three.js and its geometry utility are local and pinned to 0.183.2. No runtime CDN, image or sound requests. Sound is synthesized after a user gesture.

This first version is local. No public deployment, public repository, entry PR or official live-URL jam verdict has been created. The official gate was read to implement its selectors and telemetry; it has not been represented as passing. Before submission, deploy the pinned commit and run the official phone gate against that public URL.

## Completed browser run

A full run at the 390 × 844 portrait viewport used only the visible controls: place tops at sockets 1 and 5, progressively buy the orbit/bowling/invitation branches, fill sockets 6 and 3, and advance all six bells. The run reached the dawn screen with 12 light remaining and 196 shells broken. The 2× control was used for combat. During hour six, a sample with 15 enemies reported 177 draw calls and 86,942 triangles. No runtime errors occurred.

Pause was checked mid-wave: position, kills, coins and enemy count stayed unchanged while frames continued rendering. Restart after dawn returned to midnight with 12 light, 76 brass, no enemies and only the two starter defenses. A pause-display issue found during the check was fixed: hour and wave wording now remain stable during intermission.

The separately served `dist/` build was opened at its own URL prefix on the saved project server. Start and pause worked, and its console contained no warnings or errors. Physical-phone performance and the official 4G/touch gate remain unverified.

## Presentation pass validation — September 20, 2026

The existing 15 simulation checks passed; the rules, costs and balance in `sim.js` were unchanged. Asset checks passed, with 21,412 triangles across the five unique generated assets and a 2.18 MB standalone game source folder. Main and presentation modules passed syntax checks. `npm run build` succeeded, and the shipped main, presentation, CSS and doll files matched the tested source.

Browser testing used 390 × 844 portrait and 1280 × 720 desktop views. The initial wood pattern aliased on the small display; its frequency was lowered and its contrast now fades using screen-space derivatives. Phone mute is reachable and toggles its accessible label. A joystick drag moved the lantern from [-1, 0] to [-0.16, -0.86], over one metre, with the revised camera.

A complete run used the visible controls, with all four upgrade branches present: orbit at sockets 1, 5 and 6, bowling at socket 2, lullaby at socket 3 and invitation at socket 4. Most combat used 2×; hour four used 1×. Dolls hop and recoil, shell pieces scatter, miniature tops orbit, notes drift, sleeping dolls show moons and the invitation shows threads to held toys. The run reached dawn with 7 light and 191 shells broken. This different defense layout is not a comparison against the previous run's balance.

During hour six, a sample with 9 enemies reported 211 draw calls and 108,825 triangles. These are observed samples on the local desktop browser, not a peak guarantee or a physical-phone benchmark. No console warnings or errors were observed in the game or in a fresh standalone `dist/` Start check.

Pause preserved a state with 4 enemies, 95 broken shells, 63 brass and the same lantern position while the frame count advanced from 22,620 to 23,940; draw calls and triangle counts also stayed fixed. Restart after dawn cleared upgrade decoration, particles, notes and enemies, returning to 12 light, 76 brass and the two starter defenses (57 calls / 32,402 triangles). The warm dawn lighting returned to midnight.

The official public-URL gate and physical-device performance remain unverified. No deployment or entry submission was made in this pass.

## Paper ghost gameplay pass — September 20, 2026

`npm test` passes 23 checks. New coverage verifies the real spawn order against the displayed rosters; ghosts' immediate immunity outside the lantern radius; ignoring immune ghosts when selecting top targets; projectiles retaining a hit opportunity after passing an immune ghost; music and sleep in darkness; one reward with no nested doll; two light lost on escape; pause; and the six-wave limit.

The economy-valid full-night test compares the same purchase policy with the starting stationary lantern, a stationary early ambush at [-3.7, 1.07], and a lantern that follows the foremost ghost in tower range. Both stationary positions lose. The moving strategy chooses a new target every 1.5 seconds through the normal `moveLantern` API and reaches dawn with 9 light and all 20 ghosts defeated. This is evidence for these strategies, not proof that every possible stationary defense arrangement loses or that final human difficulty is settled.

The original six-wave roster now contains 0, 2, 3, 4, 5 and 6 ghosts, replacing dolls while keeping the total arrivals at 6, 8, 10, 12, 14 and 16. Ghosts have 24 / 32 / 44 / 60 / 76 health from hours two through six, reward 7 brass, do not split, and cost 2 light on escape. Existing tower prices and branches are unchanged.

Desktop browser play used only visible controls, including moving the lantern across the lane. Folded blue ghosts opened into pale paper faces and took damage while exposed. A late lantern in hour two let two ghosts escape; the left ambush defeated all three in hour three; moving across the stage defeated all four in hour four. That manual run reached hour six and lost with 131 shells broken and 13 ghosts defeated. The loss and restart screens worked. A sample in hour five with 11 enemies, including 4 ghosts, rendered at 196 calls / 98,394 triangles. These are samples, not a maximum guarantee.

A fresh standalone `dist/` run was checked at 390 × 844. The next-wave roster and rule fit the workbench; joystick, sockets and Start stayed reachable. A tap on the lane moved the light to about [-4.64, 0.23], exposed the first ghost (confirmed by the live count), and both tutorial ghosts were subsequently defeated. No warnings or errors were observed in either game run. The material shader also compiled without warnings or errors.

Pause and restart were exercised, alongside the automated test specifically freezing an exposed ghost. Restart cleared ghost models, counters, upgraded decoration and effects, returning to midnight with 12 light, 76 brass and two starter defenses (57 calls / 32,402 triangles). The next-wave panel returns to the six-doll opening. Playtesting caught announcement overlap with the live ghost cue, insufficient spacing above the desktop workbench, and a stale 'ghosts in the wings' cue after all ghosts were handled; the final source fixes these states.

The asset gallery rendered all twelve views of the three ghost constructions. Candidate 2 is selected. Asset contracts pass for all six models: 21,968 unique triangles, including 556 for the ghost, and about 2.19 MB for the game directory. The standalone build succeeds and includes the local ghost model and view module. No new dependencies or external assets were added.

Physical-device performance, wider human balance testing and the official public-URL jam gate remain pending. No public deployment or entry submission was made in this pass.


## Music and mobile pass — September 20, 2026

Added the original 16-bar, 80 BPM score “Wind the Moon”, with music-box melody, bass, plucked harmony, combat ticks, ghost and late-hour layers, and finite dawn/defeat codas. Composition pitches and synthesis are written for this game; no third-party samples or music files are used. Music follows AudioContext time independently of the render loop and the speed button. Master mute, independent music/effects volumes, private-storage fallback, pause/visibility suspension, bounded voice counts and cleanup are covered by the audio implementation.

`npm test` passes 31 checks (23 existing gameplay checks plus 8 audio tests). New tests cover the complete score and loop, phase-dependent layers, finite endings, one context/scheduler across repeated starts, pause and background suspension, delayed callbacks without catch-up bursts, 144 seconds of scheduling with voice disposal, the 80-oscillator cap, independent persistent levels, mute, denied playback retry, and unavailable Web Audio/storage. The audio tests use a simulated context; they do not measure an actual speaker or mobile processor.

Browser checks use native controls through CUA in the desktop in-app browser:

- **360 × 640 portrait:** Start, toolbar, bottom upgrade sheet, buying an orbit, bell, 2× combat, pause, both volume sliders, mute/unmute and resume. A joystick drag moved the lantern from [-1, 0] to [0.392, -1.955], about 2.40 metres. Pause held position, 3 kills, 40 brass and 5 enemies unchanged while frames advanced from 4,200 to 7,200. The displayed audio state changed from Playing to intermission and back.
- **390 × 844 portrait:** standalone `dist/` Start, lane click, purchases/upgrades, next-wave preview and combat. A lane click moved the light to [-4.639, 0.234]. The first hour cleared with 12 light and 89 brass using an upgraded starter top. Music was running after the real Start button without a second unlock gesture.
- **844 × 390 landscape:** found and fixed a 480px app minimum height that clipped the bell below the viewport. Welcome and audio/pause dialogs now use compact columns; toolbar, bell, joystick, selection and ghost cue remain reachable. Rotated the standalone build during hour two; rendering and the live game continued. That wave cleared with both ghosts defeated, 12 light and 85 brass. A 1280 × 720 desktop check also confirmed the audio dialog and restart controls. No console errors or warnings were observed in the final source or standalone runs.

The first browser audio check caught the native timer's receiver requirement: passing setInterval directly as an instance callback failed to start the scheduler. Calling the native timer through a wrapper fixed it. Subsequent Start, mute/unmute and resume checks displayed Playing from the running audio context and successfully started the scheduler. This verifies browser activation/scheduling, not a subjective listening review or physical-device speaker behavior.

Volume choices of 34% music / 44% effects survived a reload; the test restored the defaults of 70% / 80%. The compact portrait intermission dialog displays all controls without clipping. The game still uses the original tower prices, waves and simulation rules.

Asset contracts pass with 21,968 unique triangles and approximately 2.21 MB in the game directory. Syntax checks and the standalone build pass. Physical-device touch, iOS interruptions/silent-mode behavior, Android speaker playback, thermal performance, notch/browser-bar behavior on hardware, mobile 4G transfer timing and the official public-URL jam gate remain unverified. No deployment or submission was made in this pass.


## Atmospheric score revision — September 20, 2026

Replaced the bright, regularly pulsing waltz with “Beneath the Boards” after the user's listening feedback. The new composition is an eight-phrase, approximately 74-second ambient loop at an internal 52 BPM scheduling grid. Low fundamentals have quiet upper harmonics so the body of the sound is not entirely dependent on sub-bass playback. Slow 2–2.6 second attacks, slightly detuned sustained tones, sparse lower bells and a generated 3.2-second stereo room carry the atmosphere. Regular accompaniment and high mechanical ticks were removed. Ghost and late-hour layers remain subdued; dawn and defeat have sustained, finite endings. Existing toy effects keep their rapid attacks.

The audio scheduler, saved levels, master mute, pause and game-speed behavior remain. Resume and restoration from mute/music-zero now reintroduce the current phrase's sustained bed immediately, avoiding several seconds of silence while waiting for the next harmony. Old music voices are stopped on restoration, while effect voices keep their separate bus.

`npm test` passes 33 checks. Score coverage now verifies sparse melodic events, long beds and finite endings. Added envelope and generated-stereo-room checks, plus an immediate-bed restoration test for pause, master mute and music-zero. The existing 144-second scheduler cleanup/cap test and all 23 simulation checks pass. Browser Start shows the running new score, mute changes to All sound muted, pause changes to intermission, and resume returns to Playing · Beneath the Boards. No browser errors or warnings were observed. The build and source/package comparison pass.

This pass changes audio and its text only. New upgrades and monsters are recommendations for a subsequent gameplay pass. Listening preference remains the user's judgment; physical-phone speaker quality and hardware performance have not been claimed as tested.


## Night gifts — September 20, 2026

Added a free gift choice after hours 1, 3 and 5. All three gifts remain available at each offer, with repeat selections raising their rank up to III. Choices are atomic, recorded per wave and rejected before an offer, while paused, after an already claimed offer, or for invalid IDs. The next wave waits for the pending choice; the player can close the cards to buy/upgrade defenses and return later. Restart clears gifts, history, counters and pools.

Encore deals 6 / 10 / 14 splash damage within 2.25 m when a sleeping toy takes a real hit. It respects hidden-ghost immunity, triggers on lethal wake hits, excludes the source's newborn shell, and wakes neighboring sleepers without recursively creating more Encores. Overwound gives 40 / 80 / 120% faster attacks with 10 / 20 / 30% less top range and bowling flight. Music range is unchanged. Ghostlight gives defeated ghosts a 1.6 / 1.9 / 2.2 m light pool for 3 / 4 / 5 seconds. Pools reveal ghosts, accelerate both sides, expire during preparation, freeze on pause and are capped at eight. Overlap does not stack the light boost.

All **48 tests pass**: 33 existing gameplay/audio checks and 15 gift checks, including actual Lullaby/Encore activation, real attack cadence and lost edge targets, immunity, nested shells, pool lifecycle, cross-gift interactions and complete nights. The old baseline comparison now takes unused Encore gifts with no Lullaby, preserving its original strategy comparison. An initial 30%-per-rank Overwound bonus lost the tested final hour; its final 40% bonus makes that specialized strategy viable while retaining the reach tradeoff.

Economy-valid full-night simulations use normal purchases and movement, choosing a new lantern destination every 1.5 seconds. The three specialized builds and a mixed build all reach dawn with all 20 ghosts defeated:

| Choices | Light remaining | Encore bursts | Pools created |
| --- | ---: | ---: | ---: |
| Encore III, with Lullaby | 2 | 54 | 0 |
| Overwound III | 2 | 0 | 0 |
| Ghostlight III | 11 | 0 | 20 |
| Ghostlight I + Encore I + Overwound I | 3 | 64 | 20 |

These are outcomes for the tested purchase/movement policies, not a claim that all layouts or stationary play win. Balance remains open to human playtesting.

Browser play used the visible controls. Hour one opened the offer automatically; Plan my defenses first preserved it, and the bell reopened it. Choosing Ghostlight left brass unchanged and added its badge. Hours two and three created five pools from five defeated ghosts. The hour-three offer showed Ghostlight II with its stronger values; Encore I was selected with a purchased Lullaby already present. Moving the lantern to the right-hand ghosts produced an Encore and another pool. That manual run cleared hour four with 6 light, 6 ghosts defeated, 1 Encore and 6 pools created; three ghosts escaped after late lantern movement. No browser warnings or errors were observed.

The final standalone build was separately opened at `/dist/`. Its complete card set and planning button fit at **360 × 640** and **844 × 390**, verified after rotation settled. The compact layout keeps effect and tradeoff text visible. Escape defers the offer; P opens intermission without consuming it; resume leaves it available. Choosing Overwound I showed the final 40%/10% text, preserved 89 brass, and changed the upgraded starter top's reported/displayed range from 3.8 to 3.42 m while the music box stayed at 3.05 m. The prior source play also exercised the persistent gift strip and controls at 390 × 844. Restart in the final standalone build cleared the ribbon, ranks, pending offer, history, counters and pools, restoring 12 light, 76 brass and the original 2.65 m / 3.05 m starter ranges (57 draws / 32,402 triangles).

Source syntax, asset contracts and the standalone build pass. Six model types still total 21,968 unique triangles; the game folder is about 2.22 MB. Gift effects add constructor-based rings/discs/motes, no imported meshes, external assets or dependencies. Browser draw samples stayed below the jam budget, but physical-phone performance and the official public-URL gate remain unverified. This pass implements the gifts; the Tin Drummer remains a proposed next step.

## Phone framing correction — September 21, 2026

An iPhone screenshot showed that the previous landscape layout left most of the screen around a distant stage while a full-width preparation panel remained during combat. Phone cameras now fit the playable area between the HUD and controls. Decorative theatre edges may extend outside the viewport. Landscape keeps a compact right-side dock; portrait turns the board lengthwise. The title banner is removed on phones, action labels are larger, and the disabled bell is hidden during combat. Camera sizing and socket labels both follow the app's dynamic viewport height. A ResizeObserver keeps framing aligned when browser bars, orientation, or the workbench height change.

Verified in the local browser at 844 × 390, 740 × 330, 390 × 844, and 360 × 640. All six sockets and the bell remain accessible; short landscape preparation text can scroll inside its dock while the bell stays visible. Portrait joystick placement leaves the goal clear. Dragging the 360 × 640 joystick moved the lantern from [-1, 0] to [-2.79, -1.44]. Selected Wide orbit, cleared midnight with 12 light, chose Ghostlight, and started hour two; ghost visibility and the joystick remained separate at 740 × 330. Upgrade panels, the night-gift offer, and pause/rotation remained accessible. The standalone build was checked in landscape, portrait, and at 1280 × 720 desktop. No browser errors or warnings were observed.

All 48 existing tests and asset contracts pass. The build remains about 2.23 MB uncompressed with unchanged model geometry. This pass uses browser viewport checks; the updated layout still needs the user's physical iPhone check.


## September 21 — framing correction

- Fit the playable bounds at every viewport size instead of using a distant fixed desktop camera. Decorative scenery can extend beyond the viewport.
- Compact the desktop dock and header; apply portrait controls to narrow desktop/tablet windows up to 850 px.
- Verified all six sockets at 1280 × 720, 744 × 922 and 844 × 390. Selected Wide orbit and began combat successfully in landscape.
- Phone portrait retains the existing camera orientation; desktop and tablet portrait rotate gradually with the aspect ratio.
- All 48 tests and all six asset contracts pass. Physical iPhone validation still needs a published build.


## Curved runner and larger toys — September 21

Replaced the rigid carpet joins with a continuous ribbon. The shared route rounds
corners by up to 1.1 m; its entrance, exit and six tower locations stay fixed.
The route endpoint now clamps exactly at and beyond its length. Two Lullaby test
fixtures moved from distance 23.3 to 21.8 so their toys begin in the gramophone's
listening area on the shorter route. Attack, currency, waves and gift rules did
not change. All 48 tests pass, including the original starter/stationary/ambush
losses, moving-lantern win, and all four full-night gift strategies with 20 ghost
kills. Larger corner radii were discarded because they upset that balance.

The six procedural asset contracts pass: 19,136 unique triangles, about 2.93 MB
for the standalone game folder. Doll detail uses 12 × 8 spheres so the larger
faces and flowers do not add excessive per-enemy geometry.

Inspected the actual game at 1280 × 720, 744 × 922, 390 × 844 and 844 × 390.
Portrait no longer puts the backdrop along the right edge. The route, six build
points and goal fill the playing area; HUD and phone dock remain reachable.
Cleared midnight, opened/deferred a gift, and bought a top from the new small
mount. The initial portrait shadow over entering dolls was corrected by moving
the key light to the audience side. No browser errors or warnings were observed.
These are browser viewport checks, not measurements on a physical iPhone.


## Aesthetic correction — September 21

Addressed feedback that the larger board was readable but aesthetically worse.
Preserved the route, mounts, touch targets, gameplay and portrait framing. The
doll now uses an original painted cylindrical wrap on a turned body; the top
reuses its floral lacquer, and the gramophone has an original gilt front panel.
The large cream lantern block is replaced by an open bronze cage and visible
amber flame. Reduced overhead spotlight intensity, restored floor texture
contrast, and added a prefiltered reflection environment generated once for brass.
No new real-time shadow pass or full-screen postprocessing was added.

The backdrop now has sculpted velvet folds, layered paper buildings, swinging
stars and a mechanical clock that follows the displayed hour, including pause
and dawn. Static clock parts are merged; its hour hand remains separate.
The physical decorative moon from the first local draft was removed because the
existing painting already contains one. The first portrait camera angle reduced
board size, so its previous larger framing was restored before delivery.

All 48 simulation/audio tests pass. Six procedural asset contracts pass with
14,872 unique triangles, down from 19,136 in the prior pass. Browser inspection
covered 1280 × 720 desktop, 390 × 844 portrait and 844 × 390 landscape. Painted
faces follow the route correctly and midnight clears normally. The final starter
scene reports 74 draws / 36,828 rendered triangles. A reflection blur warning
seen in the first draft was corrected by reducing its filter radius. These are
desktop browser viewport checks, not physical iPhone performance measurements.

The two new image textures ship at 1024 × 512. Prompts, original paths, integration
details and shipped file paths are recorded in `PAINTED-TOYS.md`.


## Rotatable theatre experiment — September 21

Added a bounded view experiment: ±24° yaw, fixed tilt, requested zoom from 80%
to 108%, and Reset view. The fit also clamps against padded route and socket
bounds so zoom cannot crop the playing area. Rotation eases over a short interval;
reduced-motion preference makes it immediate. The default phone framing remains.
The View panel exposes turn, zoom and reset buttons. Right mouse drag turns,
wheel zooms, and two fingers use horizontal midpoint movement plus pinch distance.
A single finger or left mouse drag continues to move the lantern. Keyboard and
joystick motion still resolve through the current camera axes.

Gesture ownership is explicit. A first touch does not immediately teleport the
lantern. A second board touch stops its pending travel and takes control of the
view, including touches that begin on a toy button. Returning to one finger cannot
resume lantern dragging until all fingers lift. Camera gestures suppress stray
toy clicks. Pointer cancellation, focus loss, pause, gifts and restart clear input.
The view resets on restart. Escape closes the View panel before opening pause.

The existing stage gained a 1.3 m wooden box, feet and layered brass edge strips;
curtain wings have closed sides for the exposed angles. No decorative assets or
image files were added. A thicker rear panel initially hid the backdrop painting;
its rearward placement was corrected during the visual check.

All 54 tests pass (48 previous checks plus six camera/gesture tests). New tests
cover angle and zoom limits, reset/easing, touch tap/drag, two-finger turn/pinch,
remaining-finger isolation, toy-start gestures, third fingers, cancellation and
separate right/left mouse actions. Six asset contracts pass with 15,016 unique
triangles. Browser checks cover 744 × 922, 390 × 844 and 844 × 390: both angle
limits, maximum zoom, Reset view, rotated socket selection and lantern dragging.
Camera-button actions left the lantern at [-1,0]. No browser errors or warnings
were observed in the final source preview. A typical angled starter view reports
79 draws / 37,054 rendered triangles.

The automation surface has no native multi-touch gesture operation. Pinch and
finger handoff were verified in the input tests; physical iPhone gesture feel
still requires a hardware check. Rotating the long board in portrait necessarily
reduces its fitted scale. This remains an experiment for the user's assessment,
not a claim that rotation improves every play situation.


## Diagonal sweep and six useful placements — September 21

Replaced the rounded rectangular zigzag with two broad cubic bends and a straight
diagonal joining them. The shared rendered/simulated route remains at the same
entrance and goal. Length is 32.71 units versus 32.21 previously (about 1.6% longer),
so the unslowed, unlit opening large doll takes 39.75 seconds versus 39.14.

Repositioned the six mounts for the entrance, opening bend, diagonal, support,
far bend and final approach. Each basic top now covers approximately 3.9–4.8
units of road, instead of the previous 1.0–6.6 spread. All mounts clear the runner
by at least 1.35 units from its center. A phone check moved the starter top a
little farther from its neighbor to separate the default touch targets.

All 55 tests pass. The baseline starter, stationary-lantern and fixed-ambush
strategies still lose; investing and following ghosts with the original baseline
build still reaches dawn. Four economy-valid gift policies also win, defeating
all 20 ghosts: Encore III (5 light), Overwound III (12), Ghostlight III (12),
and a mixed Ghostlight/Encore/Overwound build (7). These are scripted policies,
not a claim that every build wins. Encore policies now use Wide orbit with Lullaby;
the others retain the diagonal Bowling top. Their lantern prioritizes ghosts and
otherwise boosts a top attacking the leading doll, deciding every 1.5 seconds.

Updated three location-dependent mechanic fixtures: the Lullaby listening window,
an overlapping Lullaby/orbit pair on the opening bend, and the Overwound edge
target. Assertions and mechanics are preserved. Added a route check for travel
budget, floor bounds, mount clearance and useful basic-top coverage. Prices,
enemy stats, wave rosters, gift effects and upgrade rules are unchanged.

Browser checks: 390 × 844 portrait at the default and both rotation limits;
844 × 390 landscape combat; 1280 × 720 desktop. Built tops at the opening and
far bends through the visible workbench. Cleared hour one with 12 light and 59
brass, opened the gift offer and returned to planning. The full route and all six
mounts stay reachable. No browser warnings or errors were observed. These are
browser viewport checks; physical iPhone performance remains a user playtest.
