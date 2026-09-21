# Tin Drummer

A painted tin marching toy with a tall red shako, a cream face, brass shoulders,
a striped drum, a winding key and two articulated sticks. The body is an original
Three.js constructor in `game/assets/drummer.js`; no imported mesh, new texture,
external image or rig is required. Existing handmade material wear is applied.
The 5,140-triangle static body is 2.88 m tall. `drummer-view.js` adds rigid moving
arms, a short shuffle, anticipation and a gold range ring during wind-up. The
drummer breaks into tin fragments instead of nesting-doll shells.

## Rules

- Arrives in hours 3–6: 1, 1, 2 and 2 drummers, replacing six large dolls across
  the night. Wave sizes and all 20 paper ghosts are preserved.
- Health equals the combined health of a large doll and its two nested shells.
  Base speed is 0.72 before wave, light and music multipliers.
- First beat after 2.3 seconds; subsequent beats every 4.6 seconds. Stops moving
  and raises the sticks during the final 1.1 seconds of each wind-up.
- Beats give nearby dolls and ghosts within 3 m a 30% movement boost for 1.4
  seconds. Multiple beats refresh the timer, never multiply it. Drummers do not
  boost each other, reveal ghosts or wake sleepers.
- Lullaby sleep interrupts the wind-up and resets the beat clock. Damage wakes
  a sleeping drummer under the existing wake/grace rules.
- Defeat pays 6 brass once and releases no smaller doll; escaping costs 3 light.
  Existing prices, upgrades, gifts and rewards otherwise remain unchanged.

## Validation

63 tests pass, including eight drummer-specific checks for roster progression,
telegraph/movement, nearby boosts, stacking/expiry, the Lullaby counter, defeat,
escape and pause/reset. The seven procedural asset contracts pass. Four existing
economy-valid gift builds reach dawn with 6 / 12 / 11 / 6 light (Encore III,
Overwound III, Ghostlight III and the mixed build), each defeating all 20 ghosts.
These scripted outcomes do not imply every layout wins.

Played through hour four via visible controls. The observed run defeated two
drummers and recorded nine beats, then returned to preparation with no enemies.
Checked the encounter in 844 × 390 landscape, the roster at 390 × 844 portrait,
and the toy up close in a local, unpublished asset fixture. No browser warnings
or errors were observed. A busy scene sample reported 165 draws / 76,167 triangles.
Physical-phone performance remains unmeasured.

The close-up prompted a stick-height correction and a taller sleep marker. The
browser then stopped responding, so final stick poses were checked directly using
the actual Three.js view: both tips sit at 1.32 m on the strike, just above the
1.303 m drumhead, and rise to 2.21 m during wind-up. Resting sticks clear the head
and sleep hides the warning. Syntax and geometry checks pass for that correction.
