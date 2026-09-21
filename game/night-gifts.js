export const GIFT_HOURS = [1, 3, 5];
export const GIFT_IDS = ['encore', 'overwound', 'ghostlight'];
const gifts = {
  encore: [6, 10, 14].map((damage, i) => ({
    id: 'encore', name: 'Encore', icon: '✧', rank: i + 1, damage, radius: 2.25,
    copy: `Striking a sleeping toy sends a ${damage}-damage shockwave through nearby toys.`,
    note: 'Needs a Lullaby gramophone. Splash wakes sleepers without making another shockwave.'
  })),
  overwound: [1, 2, 3].map(rank => ({
    id: 'overwound', name: 'Overwound', icon: '↻', rank, rate: 1 + rank * .4, reach: 1 - rank * .1,
    copy: `All tops attack ${rank * 40}% faster, but lose ${rank * 10}% of their reach.`,
    note: 'Applies to current and future tops. Bowling tops also travel less far.'
  })),
  ghostlight: [1, 2, 3].map(rank => ({
    id: 'ghostlight', name: 'Ghostlight', icon: '☼', rank, radius: 1.3 + rank * .3, duration: 2 + rank,
    copy: `Defeated ghosts light a ${(1.3 + rank * .3).toFixed(1)} m radius for ${2 + rank} seconds.`,
    note: 'Reveals other ghosts. Just like your lantern, it speeds up friends and foes.'
  }))
};
export function giftInfo(id, rank) { return Object.hasOwn(gifts, id) ? gifts[id][rank - 1] : undefined; }
