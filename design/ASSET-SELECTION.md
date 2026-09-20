# Asset selection — September 20, 2026

Reference: `reference-board.png`; prompt and generation tool recorded in `REFERENCE-PROMPT.md`.

The gallery at `/design/gallery.html` compares three original construction strategies per asset, each from front, right, rear and left. The selected implementation is candidate 2 for all five assets, for different reasons:

- Matryoshka: the lathed body keeps the nesting seam and recognisable continuous silhouette. The sphere assembly has a visibly intersected face; the alternative faceted stack is overly pointed.
- Top: the lathed body joins the handle and tip cleanly. The cone assembly leaves the finial floating; the ring stack looks more like a spool.
- Music box: separate wall panels and an upright, decorated lid read as an actual mechanism. Visual verification caught a full-width rim plate hiding the drum; replaced with four narrow rim rails, then checked in the game.
- Lantern: the octagonal brass cage, opaque warm core and wheels preserve the reference's silhouette without transparent glass or a rig. The cylinder-only version reads as a can; the square version is less cohesive with the other toys.
- Theatre: folded curtains and scalloped swags read most clearly in the three-quarter game camera. Side and rear views confirm structure; the rear is intentionally a plain stage back.

All selected modules return Groups, have finite bounds and bases at zero (within 5 mm), use constructor geometry, and load without external assets. Their combined unique geometry is 18,500 triangles before placement. Live game scenery is baked by material with the recipe loader; animated toys move as rigid groups.

Known first-version visual limitations: simple materials without surface wear, low variety, a compact view on phones. These are deliberate scope limits, not a claim of parity with the generated concept image.
