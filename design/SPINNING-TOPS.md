# Spinning tops — September 22, 2026

One defense visual pass, continuing the gramophone's painted toy treatment.
The base has an ivory/patterned crown, teal equator, turned wooden handle,
ivory knob and brass point. The floral panels reuse the existing face-free
region of nesting-doll-painted-v1.jpg; there are no new textures or services.

- Base: taller carved handle, alternating ivory/floral lacquer panels and
  a restrained spinning wobble.
- Bowling: lower, wider proportions, broad brass belt, rivets and shoulder
  braces. A real launch triggers recoil opposite the projectile's direction.
  The launched miniature carries the same belt and a short tapered gold trail.
- Wide Orbit: a broad teal rim with ivory/gold edges and two miniature tops
  rotating around it. A brief pair of thin sweeping arcs marks actual damage.

The simulation emits a launch notification and includes the source tower ID
in existing spin notifications. Damage, targeting, ranges, cooldowns, prices,
waves, projectile physics and ghost immunity are unchanged. Sweep radius uses
the actual attack radius, including Overwound. There is no timer-generated hit.

Model and upgrade geometry/materials are shared. Each tower owns only its two
sweep materials; these are disposed on sale/restart. Projectiles retain the
existing bounded pool and reuse one trail geometry/material. Trail length grows
from the observed distance of the current shot and resets when the pool entry
is reused. Projectile visuals are hidden between waves and after the ending.
Pause freezes the views; reduced motion removes decorative spin, wobble,
recoil and projectile trails and retains a stationary attack flash.

## Validation

- All 63 existing tests passed after integration, including full-night balance
  policies, bowling penetration, orbit reach, ghost immunity and Overwound.
- All seven constructor contracts pass. The new base top has 4,800 triangles
  versus 4,880 previously, at 1.65 × 1.94 × 1.65 m. Total static constructor
  geometry is 23,988 triangles; the game folder is 3.52 MB.
- Direct Three.js checks connected real simulation attacks to the correct
  tower view for all three branches. Verified upgrade visibility, pause,
  sweep-material cleanup, backward trail direction and trail reset on reuse.
- The local asset close-up showed all three shapes and frozen attack poses.
  The sweep was subsequently narrowed to leave the board visible.
- Normal UI playtests: Bowling cleared hour one with 14 launches; Wide Orbit
  cleared hour one with 40 attacks. Base and Bowling were inspected at
  844 × 390; Wide Orbit and its purchase panel at 390 × 844. The portrait
  document had no horizontal overflow. No browser warnings/errors reported.
- A Bowling frame with one projectile/trail used 101 draws / 48,590
  triangles. The cleared-wave Orbit frame used 103 draws / 52,028 triangles.
  These are desktop-browser samples, not physical iPhone performance results.
- The asset preview is ignored under test-results/ and is not published.
