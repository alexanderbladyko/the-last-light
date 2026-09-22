# Gramophone — September 22, 2026

One defense visual pass. The gramophone has a scalloped eight-petal brass bell,
painted botanical panels, wooden cornices and feet, a visible record, tonearm
and winding crank. It reuses the original local gramophone-panel-v1.jpg artwork.
No new image generation, external assets, services or dependencies.

The default asset remains a complete pure Three.js constructor. Distinct
material values preserve the horn, record and crank batches through the
unchanged recipe loader. The view reparents those batches around three rigid
pivots; geometry stays shared between instances. Owned materials and ripple
materials are disposed on sale/restart. Upgrade parts reuse horn geometry and
one shared crescent mesh. There are no skeletal rigs or physics bodies.

The record and crank turn during combat. The horn eases toward the nearest
enemy inside the real music range, within a limited turn that keeps its mouth
readable. The cabinet trembles softly while affecting toys. Pause freezes the
mechanism. Reduced-motion mode stops rotation and wobble and uses static rings.

- Base: teal cabinet and warm brass bell.
- Lullaby: blue cabinet/interior, physical crescent crest, low blue emission
  while playing and slower expanding blue ripples.
- Invitation: burgundy cabinet and two smaller, splayed brass horns, with
  warm ripples and the existing tether effect.

Three pooled ripple meshes replace the former short-lived music pulse meshes;
the effect appears when enemies are in range. Floating notes start near horn
height. The old floating upgrade moon/halo are replaced by physical model parts.
Gramophone tap targets include the taller crest and wider twin horn silhouette.
No simulation, route, economy, upgrade rules, audio or other toy models changed.

## Validation

- All 63 existing tests pass, including full-night simulation policies.
- Asset contract and JavaScript syntax checks pass; no whitespace errors.
- Static gramophone: 6,284 triangles, 1.94 × 2.51 × 1.88 m before placement.
  All seven constructor assets total 24,068 triangles; game folder 3.51 MB.
- Direct Three.js checks verify the three moving groups survive baking,
  target tracking, branch changes, pause, material disposal and shared-geometry
  preservation for base, Lullaby and Invitation.
- Local close-up inspected the three forms, then a second angle. Refined the
  crescent cut, exposed more of the record, scalloped the horn and separated
  the twin mouths after that inspection.
- Normal game controls exercised purchasing both upgrades, selling Lullaby,
  rebuilding the gramophone and choosing Invitation. The final forms were
  inspected at 390 × 844 portrait and 844 × 390 landscape. No horizontal
  overflow or console warnings/errors in the final phone check.
- Live combat at 1280 × 720 showed record rotation and the horn turning toward
  passing toys. A sampled scene with four enemies used 110 draws / 51,616
  triangles. These are desktop-browser checks, not physical iPhone benchmarks.
- The local three-model preview is under ignored test-results/ and is excluded
  from the published build.
