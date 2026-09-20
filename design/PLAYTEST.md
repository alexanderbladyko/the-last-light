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
