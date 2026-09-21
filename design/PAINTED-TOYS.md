# Painted toy surfaces — September 21, 2026

Two original images generated with the built-in ImageGen tool, one request each.
No Atlas generation, shared asset publication, competitor assets or third-party
models were used. The images were visually inspected before integration.
Original 1774 × 887 PNGs were resized to 1024 × 512 JPEGs at quality 82 for the
game's small on-screen toys. The originals remain outside the shipping folder.

## Shipped files

- `/Users/maximbladyko/atlas/the-last-light/game/textures/nesting-doll-painted-v1.jpg`
- `/Users/maximbladyko/atlas/the-last-light/game/textures/gramophone-panel-v1.jpg`

The doll wrap is cylindrical, with its front centered at u=0.5 and its height
mapped to v=0…1. Triangle UVs cross the rear seam together to avoid dragging the
face across it. The spinning top reuses a floral part of the same texture that
excludes the face. The gramophone texture covers its front inset. All are applied
after constructor geometry is merged, through `game/toy-look.js`.

## Exact prompt — nesting doll

Use case: stylized-concept
Asset type: original bitmap cylindrical UV albedo texture for a Three.js matryoshka doll.
Primary request: Generate one landscape 2:1 full rectangular usable texture. The entire image is painted surface, with no silhouette, no object or rendered doll, and no lighting or shadow baked in.
UV layout: u=.5 maps to front, v=1 is top of head, v=0 is base; image top is head top. Rich burgundy lacquer with scattered tiny worn gold and teal botanical motifs. One expressive old porcelain folk-toy face centered at x=50%, y=23% of the image. Face oval width about 15% of total image and height 23%; cream skin, dark soulful eyes, small asymmetric mouth, faint rosy cheeks, chestnut hair with center part. Haunting and charming antique hand-painted character, not kawaii, skull, or baby.
Under the face at y=43%, a little tied scarf. Body below y=45% is a deep midnight teal floral apron, with large ochre and coral flowers and gold foliage clustered front center at x=38–62%, y=50–88%. Rest of wrap is red-wine scarf fabric. Narrow continuous distressed gold hem at y=94%.
Style/medium: detailed tactile antique hand-painted lacquer texture, with clear broad features and flat diffuse albedo.
Constraints: Left and right edges match burgundy for wrapping. Face and apron appear only once, centered. Original artwork. No words, watermarks, diagrams, object silhouette, perspective, render shading, scene or mockup. Full rectangular edge-to-edge painted surface.

## Exact prompt — gramophone

Use case: stylized-concept
Asset type: original bitmap front-panel albedo texture for a small Three.js 3D gramophone case.
Primary request: Generate one landscape 2:1 full rectangular painted surface, edge-to-edge. Deep midnight petrol teal enamel with aged gilt folk-botanical ornament.
Subject: One graceful central gold flower or lyre-like rosette, symmetrical curling vines, hand-painted tiny coral blossoms and muted ochre leaves. A worn gold narrow ornamental border is inset 5% from all edges.
Style/medium: sophisticated antique toy craftsmanship, bold readable central motif, very fine scratched varnish and paint crackle. Flat diffuse albedo, orthographic rectangular surface.
Constraints: Original artwork. No lettering, logos, musical notes, screws, frame geometry, render shadows, perspective, object, scene, mockup, or watermark. Entire image is usable flat painted texture.

## Source images

- Doll: `/Users/maximbladyko/.codex/generated_images/01a0c505-57e3-7ed2-98bc-db32a5f3ae1d/exec-be62bab4-64ef-4580-8eb9-5acf20254cfa.png`
- Gramophone: `/Users/maximbladyko/.codex/generated_images/01a0c505-57e3-7ed2-98bc-db32a5f3ae1d/exec-20b7a316-2ea4-4d79-85a4-134b605933df.png`

The previous `ARTWORK.md` documents the two environment textures, which are reused.
