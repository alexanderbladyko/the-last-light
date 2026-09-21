# Painted theatre — September 21, 2026

This pass changes the environment and lighting only. The six-hour game, prices,
upgrades, enemy behavior, audio and mobile camera controls are unchanged. Desktop framing is 13% closer to give the theatre more of the screen.

## Shipped artwork

- `game/textures/painted-wood-v1.jpg`: 1024 × 1024, chipped teal floorboard albedo.
- `game/textures/moonlit-village-v1.jpg`: 1536 × 512, painted rear scenic panel.

Both images were made with the built-in ImageGen tool, inspected, then resized
and JPEG-compressed for shipping (about 684 KiB combined). Original generated
PNGs remain outside the shipping folder. No competitor artwork was used.

The procedural asset modules remain pure constructor geometry. `stage-look.js`
loads the local artwork after asset merging, maps wood using geometry positions,
and adds six freestanding paper fir trees. The rear wall's restrained emissive
material keeps its painted windows readable without another light. Existing
shader wear is skipped for the two image materials, while toys retain it.

The ambient and fill are cooler and lower; the moving spotlight is stronger.
This gives the cream lantern, burgundy route and teal floor distinct values.
There is no full-screen postprocessing or extra shadow-casting light.

## Prompts

### Moonlit village

Create a standalone game texture: a flat hand-painted backdrop panel for a miniature haunted toy theatre. Landscape 3:1 composition. Entire image is the painting, no physical frame, no photographed scene, no room, no stage, no text. Deep midnight teal and blue-green paper sky, a very delicate scattering of tiny tarnished gold stars, a large pale ivory crescent moon upper right of center. Across the bottom third: layered cut-paper silhouettes of a crooked sleepy European toy village, tall narrow roofs, a few small amber-lit windows, rolling blue hills behind. Rich gouache brushwork, imperfect old painted cardboard, subtle worn pigment, sophisticated theatrical storybook mood. The upper half is mainly dark atmospheric sky. Strong simple readable shapes; detailed material texture, restrained pattern. Straight-on orthographic view, diffuse painted lighting, no perspective frame or shadows from outside objects. Designed as a texture mapped to a 3D theatre rear wall, so edge-to-edge artwork only. No characters, no UI, no watermark.

### Painted wood

A production-ready square albedo texture of old painted wood for a miniature haunted toy theatre game. Top-down perfectly orthographic, edge-to-edge surface only, no objects, no scene or perspective, no text or emblems. Weathered blue-green teal paint on wooden floorboards, long vertical grain, 8-10 narrow planks across the square with very subtle dark straight seams and staggered joins. Paint worn away around plank edges and in a few irregular patches exposing warm dark brown wood. Fine rich wood grain, distressed gouache-like artisanal finish, subtle scratches and age variation. Medium muted petrol teal and warm brown values, not black. Uniform diffuse lighting; no cast shadows, highlights, vignette, borders, nails, decorative motifs, objects, writing or watermark. Plausible PBR base color texture, seamless repeating edges if possible, consistent material scale. This must look like tangible chipped painted wood, not abstract colors or a rendered game board.

## Checks

- All 48 simulation/audio tests and six procedural asset contracts pass.
- Start and play render with the local textures; no browser warnings or errors.
- Inspected desktop, iPhone-sized landscape (844 × 390) and portrait (390 × 844).
- The mobile board remains large; the portrait camera favors the playing floor.
- These are browser viewport checks, not a physical iPhone performance test.

Next visual slice to consider after feedback: distinctive painted toy faces and
defense silhouettes. It is intentionally outside this environment pass.
