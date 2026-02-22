/**
 * AvaxGods-style assets - paths to public folder
 */
const base = "/assets";

export const heroImg = `${base}/background/hero-img.jpg`;
export const landing = `${base}/background/landing.jpg`;
export const astral = `${base}/background/astral.jpg`;
export const saiman = `${base}/background/saiman.jpg`;
export const eoaalien = `${base}/background/eoaalien.jpg`;
export const panight = `${base}/background/panight.jpg`;

export const logo = `${base}/logo.svg`;
export const attack = `${base}/attack.png`;
export const defense = `${base}/defense.png`;
export const player01 = `${base}/player01.png`;
export const player02 = `${base}/player02.png`;

const cardNames = [
  "Ace", "Bakezori", "Black_Solus", "Calligrapher", "Chakri_Avatar",
  "Coalfist", "Desolator", "Dusk_Rigger", "Flamewreath", "Furiosa",
  "Geomancer", "Gore_Horn", "Heartseeker", "Jade_Monk", "Kaido_Expert",
  "Katara", "Ki_Beholder", "Kindling", "Lantern_Fox", "Mizuchi",
  "Orizuru", "Scarlet_Viper", "Storm_Kage", "Suzumebachi", "Tusk_Boar",
  "Twilight_Fox", "Void_Talon", "Whiplash", "Widowmaker", "Xho",
];

export const allCards = cardNames.map(
  (name) => `${base}/${name}.png`
);

export const battlegrounds = [
  { id: "bg-saiman", image: saiman, name: "Saiman" },
  { id: "bg-astral", image: astral, name: "Astral" },
  { id: "bg-eoaalien", image: eoaalien, name: "Eoaalien" },
  { id: "bg-panight", image: panight, name: "Panight" },
];

export const gameRules = [
  "Card with the same defense and attack point will cancel each other out.",
  "Attack points from the attacking card will deduct the opposing player's health points.",
  "If P1 does not defend, their health will be deducted by P2's attack.",
  "If P1 defends, P2's attack is equal to P2's attack - P1's defense.",
  "If a player defends, they refill 3 Mana",
  "If a player attacks, they spend 3 Mana",
];
