# Original chamber score

The current procedural score is tiring for the player over long sessions. Replace its overlapping low drones and detuned oscillator beds with recorded music built around an expressive original melody.

## Initial audition

Atlas project: `a13a8fa7-9f02-4111-8969-17390e33f85a` — The Last Light — chamber score.

- **Velvet Lullaby:** felt piano, lyrical cello, restrained chamber strings, and occasional wordless voice when supported naturally by the music model. Tender melancholy, slow 3/4, a simple original motif, and space between phrases.
- **Clockwork Waltz:** soft piano, cello, delicate plucked strings, and rare celesta accents. Slightly darker and more playful, with a gentle waltz pulse rather than a relentless rhythm.

Both should avoid piercing bells, rumbling drones, detuned pads, ticking effects, aggressive percussion, trailer-style crescendos, and loud compressed mastering. Initial demos target 90 seconds; provider constraints may change their exact duration. No existing compositions or artist recordings are supplied as references.

## Selection and finishing

Audition the recordings in the game at a comfortable low level, using both headphones and iPhone speakers. Evaluate the whole phrase and repeated listening, not just the opening. The player should be able to think about tower choices without the score constantly demanding attention.

Develop the chosen theme into a longer cue with a quiet main statement, a restrained tense variation, and a warm dawn release. Use the same melodic identity across variations. Changes in intensity should come from arrangement and musical development rather than a jump in loudness.

## Integration requirements

Keep the existing independent music/effects controls and saved preferences. Audio starts only after a player gesture. Pause, browser backgrounding, and interruptions must stop playback safely; resume and restart must never stack recordings. Music should play at its own pace when game speed changes. Make transitions and loop boundaries gentle. Load failure should leave the game and toy effects usable without falling back to the rejected drone.

Use local, compressed audio files in the published game. Inspect file size, duration, and clipping before choosing encoding and playback strategy. Keep original generated masters and provenance outside the shipped bundle. Browser activation tests do not substitute for a long listening check on a physical phone.

## Current status

Both private Atlas generations completed successfully using Stable Audio 3, configured for 90 seconds each. Atlas reports no generation errors. Both recordings were downloaded after the user explicitly approved workspace-read access. Files were decoded locally for signal checks; subjective long-session listening on the user’s iPhone remains part of the audition.

- Velvet Lullaby: node `dc71ae70-3beb-4192-ba0b-bc69b649ca2a`, audio `4eced0ac-2c9b-45d9-bec3-d4717d0d572a`, 2,174,782 bytes, seed 2053892435.
- Clockwork Waltz: node `1fb7c2a0-8bed-47aa-8cf3-0e6a310c4898`, audio `164012ab-3e26-46d4-a9df-e1300f52253a`, 2,174,782 bytes, seed 1062311426.

## First in-game audition

Velvet Lullaby is the default; Clockwork Waltz is available under Pause → Score. Both are original 90-second, 44.1 kHz stereo MP3 recordings at 192 kbps (2,174,782 bytes each). These are initial recorded cues, not the proposed longer theme variations. The generated results favor piano; the initial brief's cello/vocal instrumentation is not a verified description of the finished audio.

The procedural score, detuned beds, and synthetic music reverb are removed. Toy effects keep their existing separate volume and sounds. Each recording is fetched locally and decoded only when selected and enabled, with one decoded buffer retained; two playback sources share it briefly across a three-second loop transition. A decoded 90-second stereo cue uses roughly 32 MB at 44.1 kHz; changing tracks discards the old buffer. Pause/mute preserve the musical position, restart resets it, and endings fade out over at most six seconds. Music timing is independent of game speed.

Signal checks on decoded masters found no clipped samples. Lullaby measures −24.07 dBFS RMS / −5.26 dBFS sample peak; Waltz measures −23.64 dBFS RMS / −0.98 dBFS sample peak. Per-track gains of 0.90 and 0.855 align their average levels near −25 dBFS before the user's volume and master gain. These are RMS/sample-peak measurements, not LUFS or a medical assessment of listening fatigue. Existing user volume choices are preserved.

The original masters remain in `/private/tmp/last-light-music/`; the published MP3s are unchanged copies with gain and loop fades applied at playback. No API keys or authenticated Atlas URLs are included in the game bundle.
