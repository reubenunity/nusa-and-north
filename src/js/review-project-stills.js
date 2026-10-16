// Curated frames extracted from the supplied 4K films. Source/timestamp records
// live alongside each project's exported assets in provenance.json.
const frames = (slug, descriptions) => descriptions.map((alt, index) => ({
  src: `/films/${slug}/frame-${String(index + 1).padStart(2, '0')}.webp`, alt,
}));

export const projectStills = {
  'radisson-red-innsbruck': frames('radisson-red-innsbruck', [
    "A man in a red cap sits on a bed beneath an alpine mural in a Radisson RED Innsbruck room.",
    "Close-up of a smiling man in a red cap listening through headphones.",
    "The angular exterior of Radisson RED Innsbruck, with its red sculpture and hotel sign.",
    "A man holds a microphone beside a passing red tram on an Innsbruck street.",
    "A man records sound on a rocky alpine summit with mountains and clouds behind him.",
    "A man with a microphone kneels beside two musicians in traditional dress beneath Innsbruck’s Golden Roof."
]),
  'radisson-berlin': frames('radisson-berlin', [
    'A guest holding flowers beneath the stone colonnade in Berlin',
    'Flowers being arranged on a table beside the river',
    'Chef Michael preparing a dish in the kitchen, filmed in black and white',
    'Pasta cooking in a pan in the San Éna kitchen',
    'A table of dishes prepared for dinner',
    'Friends raising their glasses at a riverside dinner',
  ]),
};
