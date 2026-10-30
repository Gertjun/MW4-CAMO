// =============================================================
//  Wapen- en camolijst van Modern Warfare 4 (vast, geen gebruikersdata)
// =============================================================
// Bijwerken bij een nieuw seizoen: voeg wapens toe aan WEAPONS. Gebruik voor
// een nieuw wapen een nieuwe, vaste `id` en wijzig bestaande id's nooit: de
// voortgang in de kluis verwijst ernaar (record-id = "<wapen-id>:<camo-id>").
//
// Bronnen (okt. 2026): codmunity.gg, mw4camos.com, bosslobbies.com, mw4.gg.
// `null` betekent: nog niet bekend, de app toont dan "nog onbekend".

export const CLASSES = [
  { id: 'ar', name: 'Assault', full: 'Assault rifles' },
  { id: 'smg', name: 'SMG', full: "SMG's" },
  { id: 'shotgun', name: 'Shotgun', full: 'Shotguns' },
  { id: 'lmg', name: 'LMG', full: "LMG's" },
  { id: 'marksman', name: 'Marksman', full: 'Marksman rifles' },
  { id: 'sniper', name: 'Sniper', full: 'Sniper rifles' },
  { id: 'pistol', name: 'Pistol', full: 'Pistolen' },
  { id: 'launcher', name: 'Launcher', full: 'Launchers' },
  { id: 'melee', name: 'Melee', full: 'Melee' },
];

// Namen van de 8 militaire camo's (gelijk voor alle wapens).
export const MILITARY_NAMES = ['Shed', 'Grazer', 'Ice Storm', 'Dapple Cast', 'Indexed', 'Groundcover', 'Mosswood', 'Mausoleum'];

export const GOLD_TASK = { mp: '15 kills in één potje', dmz: '100 kills in één DMZ-potje' };

// Platinum en Harmonic Break hebben per klasse dezelfde opdracht.
export const CLASS_MASTERY = {
  ar: { platinum: { mp: 'Headshot-kills (aantal: zie het spel)', dmz: null }, harmonic: { mp: 'Double kills (aantal: zie het spel)', dmz: null } },
  smg: { platinum: { mp: '25 kills van achteren', dmz: '75 kills van achteren' }, harmonic: { mp: '50 hipfire-kills', dmz: '100 hipfire-kills' } },
  shotgun: { platinum: { mp: '50 hipfire-kills', dmz: '125 hipfire-kills' }, harmonic: { mp: '2 kills zonder herladen, 25 keer', dmz: '2 kills zonder herladen, 50 keer' } },
  lmg: { platinum: { mp: '3 kills zonder te sterven, 15 keer', dmz: '3 kills zonder schade, 50 keer' }, harmonic: { mp: '2 kills zonder de trekker los te laten, 25 keer', dmz: '2 kills zonder de trekker los te laten, 75 keer' } },
  marksman: { platinum: { mp: '75 kills liggend', dmz: '150 kills liggend' }, harmonic: { mp: '75 one-shot-kills', dmz: '150 one-shot-kills' } },
  sniper: { platinum: { mp: '75 kills liggend', dmz: '150 kills liggend' }, harmonic: { mp: '75 one-shot-kills', dmz: '150 one-shot-kills' } },
  pistol: { platinum: { mp: '20 kills van achteren', dmz: '75 kills van achteren' }, harmonic: { mp: '40 hipfire-kills', dmz: '100 hipfire-kills' } },
  launcher: { platinum: { mp: 'Kills zonder schade op te lopen (aantal: zie het spel)', dmz: null }, harmonic: { mp: 'Kills tegen spelers (aantal: zie het spel)', dmz: null } },
  melee: { platinum: { mp: null, dmz: null }, harmonic: { mp: null, dmz: null } },
};

// sp: [naam, vanaf wapenlevel, opdracht MP, opdracht DMZ]
// mil: wapenlevels voor militaire camo 1–8 (null = onbekend)
const W = (id, name, cls, mil, sp) => ({ id, name, cls, mil, sp });

export const WEAPONS = [
  // Assault rifles
  W('han-86', 'Han 86', 'ar', [10, 18, 25, 34, 42, 50, 57, 65], [
    ['Smoke', 25, '20 mounted kills', '75 mounted kills'],
    ['Stormwave', 46, '50 kills met een demper', '125 kills met een demper'],
    ['Red', 72, '3 kills zonder te sterven, 15 keer', '3 kills zonder schade, 50 keer'],
  ]),
  W('m4', 'M4', 'ar', null, [
    ['Myriad', 26, '20 point-blank-kills', '75 point-blank-kills'],
    ['Night Ops', 51, '20 mounted kills', '75 mounted kills'],
    ['Green', 72, '25 kills van achteren', '100 kills van achteren'],
  ]),
  W('hyeon-burst', 'Hyeon Burst', 'ar', null, [
    ['Ponderosa', 23, '2 kills zonder herladen, 10 keer', '2 kills zonder herladen, 30 keer'],
    ['Red Rain', 46, '20 longshot-kills', '75 longshot-kills'],
    ['Kitty Kaos', 68, '100 kills met volautomatisch vuur', '250 kills met een demper'],
  ]),
  W('patriot-xmr', 'Patriot XMR', 'ar', null, [
    ['Dune Sea', 24, '20 hipfire-kills', '75 hipfire-kills'],
    ['Scorch', 49, '30 longshot-kills', '100 longshot-kills'],
    ['Disperse', 72, '50 kills met een demper', '125 kills met een demper'],
  ]),
  W('kastov-762', 'Kastov 762', 'ar', null, [
    ['Samnim', 24, '3 kills zonder te sterven, 10 keer', '5 kills zonder schade, 25 keer'],
    ['Raster Aux', 48, '20 longshot-kills', '75 longshot-kills'],
    ['Yellow', 71, '30 hipfire-kills', '100 hipfire-kills'],
  ]),
  W('oden', 'Oden', 'ar', null, [
    ['Dark Moss', 25, '25 kills met de Miri 40MM-granaatwerper', '75 kills met de Miri 40MM-granaatwerper'],
    ['Shale', 44, '2 kills zonder herladen, 10 keer', '2 kills zonder herladen, 30 keer'],
    ['Hot Rod', 65, '100 ADS-kills', '250 ADS-kills'],
  ]),
  W('axion', 'Axion', 'ar', null, [
    ['Splinter Rock', 23, '20 longshot-kills', '75 longshot-kills'],
    ['Sunset Tropic', 45, '25 kills met de Miri 40MM-granaatwerper', '75 kills met de Miri 40MM-granaatwerper'],
    ['Cyan', 69, '2 kills zonder herladen, 25 keer', '2 kills zonder herladen, 50 keer'],
  ]),
  W('cronen-squall', 'Cronen Squall', 'ar', null, [
    ['Oni', 24, '20 point-blank-kills', '75 point-blank-kills'],
    ['Urban Smoke', 45, '20 mounted kills', '20 mounted kills'],
    ['Optical Reverb', 67, '3 kills zonder te sterven, 15 keer', '50 ADS-kills'],
  ]),

  // SMG's
  W('iso-nightshade', 'ISO Nightshade', 'smg', [12, 19, 25, 31, 38, 44, 50, 57], [
    ['Asphalt', 22, '50 ADS-kills', '125 ADS-kills'],
    ['Black Topo', 44, '10 double kills', '30 double kills'],
    ['Brown', 64, '3 kills zonder te sterven, 15 keer', '3 kills zonder schade, 50 keer'],
  ]),
  W('vel-46', 'VEL 46', 'smg', null, [
    ['Jungle Shadow', 20, '20 kills liggend', '125 ADS-kills'],
    ['Ghast', 40, '20 kills liggend', '100 kills liggend'],
    ['Gunmetal', 60, '20 headshots', '75 headshots'],
  ]),
  W('wz-55-striga', 'WZ.55 Striga', 'smg', null, [
    ['Stellation', 20, '50 kills met een demper', '125 kills met een demper'],
    ['Rattlesnake', 41, '20 kills tijdens het springen', '50 kills tijdens het springen'],
    ['Dark Tan', 60, '40 point-blank-kills', '100 point-blank-kills'],
  ]),
  W('ppsh-41', 'PPSh-41', 'smg', null, [
    ['Blackwell', 20, '10 double kills', '30 double kills'],
    ['Iron', 41, null, null],
    ['Currents', 62, '100 ADS-kills', '250 ADS-kills'],
  ]),
  W('x-58-nyx', 'X-58 Nyx', 'smg', null, [
    ['Sniper Veil', 17, '20 kills in beweging', '75 kills in beweging'],
    ['Carbonated', 35, '20 longshot-kills', '75 longshot-kills'],
    ['Lime', 53, null, null],
  ]),

  // Shotguns
  W('rezi-12', 'Rezi 12', 'shotgun', [11, 18, 26, 30, 38, 42, 47, 54], [
    ['Struck Oil', 22, '20 point-blank-kills', '75 point-blank-kills'],
    ['Brushstroke', 42, '10 longshot-kills', '50 longshot-kills'],
    ['White Pine', 60, '40 kills tijdens het springen', '100 kills tijdens het springen'],
  ]),
  W('warlord', 'Warlord', 'shotgun', null, [
    ['Redshift', 21, '20 kills in beweging', '75 kills in beweging'],
    ['Corrupted Clay', 41, '10 double kills', '30 double kills'],
    ['Magma Ire', 60, '50 kills liggend', '125 kills liggend'],
  ]),

  // LMG's
  W('finn-lmg', 'FiNN LMG', 'lmg', [12, 18, 24, 31, 37, 42, 48, 53], [
    ['Desert Tactics', 18, '20 point-blank-kills', '75 point-blank-kills'],
    ['Green Tiger', 39, '2 kills zonder herladen, 10 keer', '2 kills zonder herladen, 30 keer'],
    ['Thunderhead', 60, '30 longshot-kills', '100 longshot-kills'],
  ]),
  W('type-73', 'Type 73', 'lmg', null, [
    ['Ash Pine', 23, '20 mounted kills', '75 mounted kills'],
    ['Outcrop', 45, null, null],
    ['Foxtrail', 65, null, null],
  ]),
  W('apoc-338', 'APOC-338', 'lmg', null, [
    ['Phantom Flux', 15, '20 hipfire-kills', '75 hipfire-kills'],
    ['Mineral', 36, null, null],
    ['Tiger Swipe', 56, null, null],
  ]),

  // Marksman rifles
  W('mar-9', 'MAR-9', 'marksman', [10, 19, 29, 38, 45, 52, 58, 69], [
    ['Mangrove', 26, '20 mounted kills', '75 mounted kills'],
    ['Fungal Grid', 49, '25 kills gehurkt', '75 kills gehurkt'],
    ['White', 73, '30 longshot-kills', '100 longshot-kills'],
  ]),
  W('oris-8-6', 'Oris 8.6', 'marksman', null, [
    ['Hibiscus', 27, '10 quickscope-kills', '50 quickscope-kills'],
    ['Fire Topo', 49, '20 double kills', '50 double kills'],
    ['Deep Space', 70, '3 kills zonder te sterven, 15 keer', '3 kills zonder schade, 50 keer'],
  ]),
  W('mosin-nagant', 'Mosin-Nagant', 'marksman', null, [
    ['Ice Sheer', 25, '25 headshots', '75 headshots'],
    ['Fractal Snow', null, '3 kills zonder te sterven, 15 keer', '2 kills zonder te sterven, 30 keer'],
    ['Sticker Shock', null, '20 headshots', '250 kills met Focus'],
  ]),

  // Sniper rifles
  W('kg-7-vulcan', 'KG-7 Vulcan', 'sniper', [13, 22, 31, 38, 47, 54, 61, 69], [
    ['Treeline', 22, '10 hipfire-kills', '25 hipfire-kills'],
    ['Spidersilk', 47, '20 headshots', '75 headshots'],
    ['Tension', 75, '2 kills zonder schade, 20 keer', '2 kills zonder schade, 30 keer'],
  ]),
  W('astaroth-57', 'Astaroth .57', 'sniper', null, [
    ['Dry Brush', 20, '3 kills zonder te sterven, 10 keer', '3 kills zonder schade, 25 keer'],
    ['Backcountry', 37, '20 mounted kills', '75 mounted kills'],
    ['Dread Plague', 54, '2 kills binnen 5 seconden, 20 keer', '2 kills binnen 5 seconden, 50 keer'],
  ]),
  W('signal-50', 'Signal 50', 'sniper', null, [
    ['Anaconda', 28, '2 kills binnen 5 seconden, 10 keer', '2 kills binnen 5 seconden, 25 keer'],
    ['Ripplewave', 52, '20 quickscope-kills', '30 quickscope-kills'],
    ['Sunburn', 74, '40 longshot-kills', '100 one-shot-kills'],
  ]),

  // Pistolen
  W('sang-9mm', 'SANG 9mm', 'pistol', [9, 13, 17, 21, 25, 28, 31, 35], [
    ['Autumn', 13, '25 ADS-kills', '75 ADS-kills'],
    ['Snakeskin', 25, '3 kills zonder te sterven, 5 keer', '3 kills zonder schade, 15 keer'],
    ['Space Time', 38, '50 kills met akimbo', '125 kills met akimbo'],
  ]),
  W('krait-p68', 'Krait P68', 'pistol', null, [
    ['Off Grid', 13, '15 kills terwijl je aan een richel hangt', '50 kills terwijl je aan een richel hangt'],
    ['Urban Flamingo', 25, '15 point-blank-kills', '50 point-blank-kills'],
    ['Smokescreen', 38, '50 kills met een demper', '125 kills met een demper'],
  ]),
  W('50-gs', '.50 GS', 'pistol', null, [
    ['Frosted', 18, '20 headshots', '75 headshots'],
    ['Splatter Ops', 34, '7 double kills', '20 double kills'],
    ['Red Tiger', 50, '30 point-blank-kills', '75 point-blank-kills'],
  ]),
  W('mojave-357', 'Mojave .357', 'pistol', null, [
    ['Miami', 16, '20 headshots', '50 one-shot-kills'],
    ['Wallpaper', 30, null, null],
    ['Garland', 44, null, null],
  ]),

  // Launchers
  W('pila', 'PILA', 'launcher', null, [
    ['Frontier', 16, '10 kills met een voltreffer', '25 kills met een voltreffer'],
    ['Sandwash', 31, '5 double kills', '100 double kills'],
    ['Digital Fall', 46, '30 killstreaks of voertuigen vernietigen', '50 killstreaks of voertuigen vernietigen'],
  ]),
  W('rpg-8', 'RPG-8', 'launcher', null, [
    ['Digi Bark', 16, '10 kills met een voltreffer', '25 kills liggend'],
    ['Stone Bits', 31, '5 double kills', '25 longshot-kills'],
    ['Bubblegum Ops', 46, '30 killstreaks of voertuigen vernietigen', '50 killstreaks of voertuigen vernietigen'],
  ]),
  W('jokr', 'JOKR', 'launcher', null, [
    ['Thicket', 16, '10 kills met een voltreffer', '15 double kills'],
    ['Tectonic', 31, '5 double kills', '25 longshot-kills'],
    ['Blue Tiger', 46, '30 killstreaks of voertuigen vernietigen', '50 killstreaks of voertuigen vernietigen'],
  ]),
  W('pm-40-anvil', 'PM-40 Anvil', 'launcher', null, [
    ['Night Snow', 16, '10 kills met een voltreffer', '25 kills met een voltreffer'],
    ['Recursive', 31, '5 double kills', '2 kills zonder herladen, 20 keer'],
    ['Urban Standard', 46, '30 killstreaks of voertuigen vernietigen', '100 kills in beweging'],
  ]),

  // Melee
  W('fss-carbon-edge-1095', 'FSS Carbon Edge 1095', 'melee', null, [
    ['Raster Lite', 16, null, null],
    ['Stockpile', 31, null, null],
    ['Deathbed', 46, null, null],
  ]),
];

// ---------- Afgeleide lijsten ----------

/** Alle camo's van een wapen, in vaste volgorde (14 stuks). */
export function camosOf(weapon) {
  const list = [];
  MILITARY_NAMES.forEach((name, i) => {
    const level = weapon.mil?.[i] ?? null;
    list.push({
      id: `mil${i + 1}`, group: 'military', name, n: i + 1,
      mp: level ? `Bereik wapenlevel ${level}` : 'Bereik het vereiste wapenlevel',
      dmz: null,
    });
  });
  weapon.sp.forEach(([name, level, mp, dmz], i) => {
    list.push({ id: `sp${i + 1}`, group: 'special', name, level, mp, dmz });
  });
  const cm = CLASS_MASTERY[weapon.cls];
  list.push({ id: 'gold', group: 'mastery', name: 'Gold', ...GOLD_TASK });
  list.push({ id: 'platinum', group: 'mastery', name: 'Platinum', ...cm.platinum });
  list.push({ id: 'harmonic', group: 'mastery', name: 'Harmonic Break', ...cm.harmonic });
  return list;
}

export const CAMOS_PER_WEAPON = 14;
export const weaponById = (id) => WEAPONS.find((w) => w.id === id);
export const classById = (id) => CLASSES.find((c) => c.id === id);

// ---------- Kleurblokjes ----------
// Benadering van elke camo: [kleur 1, kleur 2, patroon].
// Patronen (zie css/app.css): metal, camo, stripe, grain, solid.
// Onbekende naam? Dan valt het blokje terug op een neutrale grijstint.
export const SWATCHES = {
  // Militair
  Shed: ['#6b5a3e', '#3f3526', 'camo'],
  Grazer: ['#a8946a', '#5d6b3e', 'camo'],
  'Ice Storm': ['#dfe7ee', '#8fa3b5', 'camo'],
  'Dapple Cast': ['#5f7a45', '#2f3d22', 'camo'],
  Indexed: ['#8a8f94', '#3e4247', 'grain'],
  Groundcover: ['#4b5a32', '#5a4630', 'camo'],
  Mosswood: ['#6f8a3a', '#34431c', 'camo'],
  Mausoleum: ['#7c7b78', '#2f2e2c', 'grain'],
  // Mastery
  Gold: ['#f2c14e', '#a8741a', 'metal'],
  Platinum: ['#e6e8ea', '#8e9499', 'metal'],
  'Harmonic Break': ['#d0204f', '#5a0a1e', 'camo'],
  // Speciaal
  Smoke: ['#9a9a9a', '#4a4a4a', 'camo'],
  Stormwave: ['#4a6d8c', '#1f3347', 'stripe'],
  Red: ['#c62828', '#c62828', 'solid'],
  Myriad: ['#7a6d9c', '#2e2a3d', 'grain'],
  'Night Ops': ['#2e3540', '#12161c', 'camo'],
  Green: ['#2e7d32', '#2e7d32', 'solid'],
  Ponderosa: ['#8a6a44', '#3e5a34', 'camo'],
  'Red Rain': ['#b3262e', '#3d0b10', 'stripe'],
  'Kitty Kaos': ['#f06292', '#7e57c2', 'camo'],
  'Dune Sea': ['#d9b98a', '#a07c4e', 'stripe'],
  Scorch: ['#e0622a', '#2a1a12', 'camo'],
  Disperse: ['#6d7f8c', '#2c363d', 'grain'],
  Samnim: ['#5f6f4a', '#a39470', 'camo'],
  'Raster Aux': ['#5c6a73', '#1f262b', 'grain'],
  Yellow: ['#f2c230', '#f2c230', 'solid'],
  'Dark Moss': ['#3f4f2a', '#1c2412', 'camo'],
  Shale: ['#6e7378', '#3a3e42', 'stripe'],
  'Hot Rod': ['#e53935', '#ff9800', 'stripe'],
  'Splinter Rock': ['#8c8478', '#4a453e', 'camo'],
  'Sunset Tropic': ['#ff8a50', '#8e24aa', 'stripe'],
  Cyan: ['#00acc1', '#00acc1', 'solid'],
  Oni: ['#b71c1c', '#1a1a1a', 'camo'],
  'Urban Smoke': ['#b0b4b8', '#55595d', 'camo'],
  'Optical Reverb': ['#26c6da', '#6a1b9a', 'stripe'],
  Asphalt: ['#4a4c4f', '#2a2b2d', 'grain'],
  'Black Topo': ['#3a3a3a', '#111111', 'stripe'],
  Brown: ['#6d4c41', '#6d4c41', 'solid'],
  'Jungle Shadow': ['#2f4a2a', '#111a10', 'camo'],
  Ghast: ['#cfd8dc', '#78909c', 'camo'],
  Gunmetal: ['#6b7177', '#2e3236', 'metal'],
  Stellation: ['#3949ab', '#0d1236', 'grain'],
  Rattlesnake: ['#a68a5b', '#3e2f1e', 'camo'],
  'Dark Tan': ['#8d7552', '#8d7552', 'solid'],
  Blackwell: ['#5a5a5a', '#1c1c1c', 'grain'],
  Iron: ['#7a7470', '#3a3634', 'metal'],
  Currents: ['#5fa58c', '#2d6b5a', 'camo'],
  'Sniper Veil': ['#7d8a5a', '#3b4229', 'camo'],
  Carbonated: ['#3c3f44', '#1b1d20', 'stripe'],
  Lime: ['#9ccc3c', '#9ccc3c', 'solid'],
  'Struck Oil': ['#2b2b2b', '#4a3d6b', 'camo'],
  Brushstroke: ['#7e8c6a', '#c9b98d', 'stripe'],
  'White Pine': ['#eceff1', '#90a4ae', 'camo'],
  Redshift: ['#e53935', '#3949ab', 'stripe'],
  'Corrupted Clay': ['#a1593a', '#4a2a1c', 'grain'],
  'Magma Ire': ['#ff5722', '#2a0d05', 'camo'],
  'Desert Tactics': ['#c8a97a', '#7a6544', 'camo'],
  'Green Tiger': ['#5f8a3a', '#1e2e14', 'stripe'],
  Thunderhead: ['#5c6b7a', '#e0e4e8', 'camo'],
  'Ash Pine': ['#8a8a80', '#3e4436', 'camo'],
  Outcrop: ['#8c7a64', '#4a4036', 'camo'],
  Foxtrail: ['#d0703a', '#5a3a22', 'camo'],
  'Phantom Flux': ['#7e57c2', '#1a1230', 'stripe'],
  Mineral: ['#8fa3a8', '#4a5a5e', 'grain'],
  'Tiger Swipe': ['#f08a24', '#1a1a1a', 'stripe'],
  Mangrove: ['#4a5a36', '#6b4a2e', 'camo'],
  'Fungal Grid': ['#9a8f6a', '#3d4a2a', 'grain'],
  White: ['#f5f5f5', '#f5f5f5', 'solid'],
  Hibiscus: ['#e91e63', '#2e7d32', 'camo'],
  'Fire Topo': ['#ff7043', '#3e1408', 'stripe'],
  'Deep Space': ['#283593', '#0a0a1a', 'grain'],
  'Ice Sheer': ['#b3e5fc', '#4f83a0', 'camo'],
  'Fractal Snow': ['#f0f4f8', '#9aaab8', 'grain'],
  'Sticker Shock': ['#ffeb3b', '#e91e63', 'camo'],
  Treeline: ['#3d5a2a', '#1a2412', 'stripe'],
  Spidersilk: ['#d7d7e0', '#6a6a7a', 'stripe'],
  Tension: ['#c62828', '#212121', 'stripe'],
  'Dry Brush': ['#b59a6a', '#6a5a3a', 'stripe'],
  Backcountry: ['#6a7a4a', '#a08a5a', 'camo'],
  'Dread Plague': ['#7cb342', '#1b2a0e', 'camo'],
  Anaconda: ['#6b7a3a', '#2a2e14', 'camo'],
  Ripplewave: ['#4fc3f7', '#01579b', 'stripe'],
  Sunburn: ['#ff7043', '#ffca28', 'camo'],
  Autumn: ['#d2691e', '#7a2e0e', 'camo'],
  Snakeskin: ['#8a7a4a', '#2e2a1a', 'grain'],
  'Space Time': ['#5e35b1', '#00bcd4', 'grain'],
  'Off Grid': ['#5a6066', '#9aa0a6', 'grain'],
  'Urban Flamingo': ['#f48fb1', '#9e9e9e', 'camo'],
  Smokescreen: ['#9e9e9e', '#e0e0e0', 'camo'],
  Frosted: ['#e1f5fe', '#81d4fa', 'grain'],
  'Splatter Ops': ['#424242', '#ffb300', 'camo'],
  'Red Tiger': ['#d32f2f', '#1a1a1a', 'stripe'],
  Miami: ['#ff4081', '#00e5ff', 'stripe'],
  Wallpaper: ['#a1887f', '#5d4037', 'grain'],
  Garland: ['#43a047', '#c62828', 'camo'],
  Frontier: ['#a0784a', '#4a5a36', 'camo'],
  Sandwash: ['#e0c9a0', '#a88a5e', 'stripe'],
  'Digital Fall': ['#d2691e', '#5d4037', 'grain'],
  'Digi Bark': ['#6d4c41', '#3e2723', 'grain'],
  'Stone Bits': ['#9e9e9e', '#5a5a5a', 'grain'],
  'Bubblegum Ops': ['#f48fb1', '#ce93d8', 'camo'],
  Thicket: ['#4a6a2e', '#22331a', 'camo'],
  Tectonic: ['#8d6e63', '#3e2723', 'stripe'],
  'Blue Tiger': ['#1e88e5', '#0d1b2a', 'stripe'],
  'Night Snow': ['#37474f', '#eceff1', 'grain'],
  Recursive: ['#00897b', '#102a26', 'grain'],
  'Urban Standard': ['#757575', '#bdbdbd', 'camo'],
  'Raster Lite': ['#b0bec5', '#607d8b', 'grain'],
  Stockpile: ['#6b7a4a', '#a0a080', 'camo'],
  Deathbed: ['#4a0e0e', '#121212', 'camo'],
};
export const DEFAULT_SWATCH = ['#9e9e9e', '#616161', 'grain'];
export const swatchOf = (name) => SWATCHES[name] || DEFAULT_SWATCH;
