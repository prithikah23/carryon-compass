import { CATALOG } from './catalog';
import { TRAVEL_CATALOG, type PackingTrip } from './packing';
import type { Item, Category } from './types';

type TravelEstimate = [string, Category, number, number, string?];
/** Compact travel-size estimates; actual products vary. Weight is grams, volume litres. */
const estimates: TravelEstimate[] = [
  ['Hair dryer','tech',600,1.8,'blow dryer hairdryer'],
  ['Camera','tech',600,1,'digital camera photography dslr'],
  ['Earbuds','tech',60,0.1,'headphones earphones airpods headset'],
  ['E-reader','tech',200,0.3,'kindle ereader ebook'],
  ['Book','documents',350,0.6,'novel paperback reading'],
  ['Journal','documents',250,0.4,'notebook diary'],
  ['Tablet','tech',500,0.5,'ipad'],
  ['Umbrella','accessory',300,0.5,'rain parasol'],
  ['Water bottle','accessory',200,0.7,'flask reusable bottle empty'],
  ['Snacks','accessory',250,0.6,'food treats granola bars'],
  ['Medication','toiletry',100,0.2,'medicine pills prescriptions tablets'],
  ['First aid kit','toiletry',200,0.4,'bandages plasters medical'],
  ['Razor','toiletry',50,0.1,'shaver shaving'],
  ['Perfume','toiletry',120,0.15,'fragrance cologne'],
  ['Belt','accessory',150,0.2],
  ['Jewelry','accessory',50,0.1,'jewellery necklace earrings rings bracelet'],
  ['Yoga mat','accessory',1000,4,'exercise pilates fitness'],
  ['Gifts','accessory',500,1.5,'presents souvenirs'],
  ['Curling iron','tech',400,0.7,'curling wand curler'],
  ['Hairbrush','toiletry',100,0.2,'brush comb'],
  ['Shampoo','toiletry',120,0.15,'hair wash'],
  ['Conditioner','toiletry',120,0.15],
  ['Body wash','toiletry',120,0.15,'shower gel soap'],
  ['Soap bar','toiletry',100,0.12],
  ['Toothbrush','toiletry',25,0.05,'dental brush'],
  ['Toothpaste','toiletry',75,0.1],
  ['Dental floss','toiletry',20,0.04],
  ['Deodorant','toiletry',75,0.1,'antiperspirant'],
  ['Moisturizer','toiletry',80,0.1,'moisturiser lotion face cream'],
  ['Lip balm','toiletry',15,0.02,'chapstick'],
  ['Hand sanitizer','toiletry',70,0.08,'sanitiser'],
  ['Wet wipes','toiletry',120,0.2,'baby wipes cleansing'],
  ['Tissues','toiletry',30,0.1,'kleenex'],
  ['Makeup remover','toiletry',100,0.12,'micellar water'],
  ['Mascara','toiletry',25,0.04],
  ['Foundation','toiletry',80,0.1],
  ['Lipstick','toiletry',25,0.03],
  ['Makeup brushes','toiletry',80,0.2],
  ['Nail clippers','toiletry',30,0.03],
  ['Tweezers','toiletry',15,0.02],
  ['Hair ties','accessory',15,0.03,'scrunchies elastic'],
  ['Hair clips','accessory',30,0.05],
  ['Dry shampoo','toiletry',80,0.15],
  ['Menstrual products','toiletry',150,0.4,'tampons pads period cup'],
  ['Insect repellent','toiletry',100,0.12,'bug spray mosquito'],
  ['After-sun lotion','toiletry',120,0.15,'aloe'],
  ['Glasses','accessory',100,0.2,'spectacles eyeglasses case'],
  ['Contact lens solution','toiletry',120,0.15,'contacts liquid'],
  ['Eye drops','toiletry',25,0.03],
  ['Earplugs','accessory',10,0.02,'ear plugs'],
  ['Sleep mask','accessory',25,0.05,'eye mask'],
  ['Compression socks','basics',80,0.15,'flight socks'],
  ['Bra','basics',70,0.2,'bras bralette'],
  ['Sports bra','basics',100,0.25],
  ['Tank top','top',120,0.4,'vest camisole'],
  ['Sweater','outer',400,1.5,'jumper pullover sweatshirt hoodie'],
  ['Skirt','bottom',250,0.8],
  ['Suit jacket','outer',500,1.8,'blazer'],
  ['Dress shirt','top',200,0.7,'formal shirt'],
  ['Tie','accessory',50,0.08,'necktie'],
  ['Watch','accessory',80,0.1,'wristwatch'],
  ['Workout shorts','bottom',150,0.5,'gym running shorts'],
  ['Running shoes','shoes',600,3,'trainers gym shoes'],
  ['Slippers','shoes',200,1],
  ['Water shoes','shoes',300,1.2,'aqua shoes'],
  ['Sarong','accessory',150,0.4,'beach wrap coverup'],
  ['Beach towel','accessory',400,1.5],
  ['Goggles','accessory',100,0.2,'swimming goggles'],
  ['Dry bag','accessory',100,0.3,'waterproof bag'],
  ['Daypack','accessory',250,0.6,'foldable backpack'],
  ['Tote bag','accessory',150,0.4,'shopping bag'],
  ['Crossbody bag','accessory',300,0.8,'purse handbag'],
  ['Packing cubes','accessory',150,0.3,'organizers organisers'],
  ['Laundry bag','accessory',50,0.1,'dirty clothes bag'],
  ['Laundry detergent','toiletry',80,0.1,'washing soap sheets'],
  ['Travel clothesline','accessory',50,0.1,'washing line'],
  ['Sewing kit','accessory',40,0.08,'needle thread'],
  ['Safety pins','accessory',15,0.02],
  ['Luggage lock','accessory',70,0.08,'padlock tsa lock'],
  ['Luggage tag','accessory',25,0.03],
  ['Phone','tech',200,0.2,'smartphone mobile cellphone'],
  ['USB cable','tech',40,0.08,'charging cable cord'],
  ['Camera charger','tech',150,0.2,'battery charger'],
  ['Camera lens','tech',400,0.6,'photography lens'],
  ['Camera tripod','tech',700,1.5,'tripod'],
  ['Memory card','tech',5,0.01,'sd card storage'],
  ['Portable speaker','tech',300,0.4,'bluetooth speaker'],
  ['Smartwatch charger','tech',40,0.08,'watch charger'],
  ['Travel router','tech',150,0.2,'wifi hotspot'],
  ['Portable fan','tech',150,0.3,'hand fan'],
  ['Flashlight','tech',100,0.15,'torch headlamp'],
  ['Batteries','tech',100,0.1,'battery spare'],
  ['Pen','documents',15,0.02,'pencil writing'],
  ['Travel documents','documents',50,0.1,'tickets boarding pass itinerary visa insurance'],
  ['Guidebook','documents',300,0.5,'travel guide maps'],
  ['Playing cards','accessory',100,0.1,'card game'],
  ['Reusable cutlery','accessory',80,0.1,'spoon fork utensils'],
  ['Travel mug','accessory',250,0.6,'coffee cup'],
  ['Lunch box','accessory',200,0.8,'food container'],
  ['Zip bags','accessory',30,0.1,'ziplock ziploc plastic bags'],
];
export const COMMON_TRAVEL_ITEMS: Item[] = estimates.map(([name, category, weightG, volumeL]) => ({
  id: `travel-${name}`, catalogId: `travel-${name}`, name, category, weightG, volumeL,
  color: TRAVEL_CATALOG[0]?.color ?? '', warmth: 'light', formality: 'casual', suitable: ['city'], maxWears: 99,
}));
const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const singular = (word: string) => word.endsWith('ies') ? `${word.slice(0, -3)}y` : /(?:ches|shes|xes|zes|sses)$/.test(word) ? word.slice(0, -2) : word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word;
const catalogItems: Item[] = CATALOG.map((item) => ({ ...item, id: item.catalogId }));
const extraAliases: Record<string, string> = {
  'Hair straightener': 'straightener flat iron',
  'Neck pillow': 'pillow travel pillow',
  Swimwear: 'swimsuit bathing suit',
  'Travel adapter': 'universal adapter',
  'Makeup bag': 'cosmetics beauty',
  'Jewelry case': 'jewellery jewelry earrings necklace',
  'Contact lenses': 'contacts lenses eyes',
};
export function searchTravelItems(query: string, saved: Item[] = []): Item[] {
  const unique = new Map<string, Item>();
  for (const item of [...saved, ...TRAVEL_CATALOG, ...COMMON_TRAVEL_ITEMS, ...catalogItems]) {
    const key = normalize(item.name);
    if (!unique.has(key)) unique.set(key, item);
  }
  const words = normalize(query).split(/\s+/).filter(Boolean).map(singular);
  return [...unique.values()].filter((item) => {
    const aliases = estimates.find(([name]) => name === item.name)?.[4] ?? '';
    const catalog = CATALOG.find((e) => e.catalogId === item.catalogId)?.synonyms ?? '';
    const haystack = normalize(`${item.name} ${aliases} ${catalog} ${extraAliases[item.name] ?? ''}`).split(' ').map(singular);
    return words.every((word) => haystack.some((candidate) => candidate.includes(word)));
  }).sort((a, b) => Number(normalize(b.name) === normalize(query)) - Number(normalize(a.name) === normalize(query)));
}
export const CUSTOM_CATEGORIES: { label: string; category: Category; weightG: number; volumeL: number }[] = [
  { label: 'Clothing', category: 'top', weightG: 250, volumeL: 0.8 },
  { label: 'Shoes', category: 'shoes', weightG: 700, volumeL: 3 },
  { label: 'Toiletry', category: 'toiletry', weightG: 150, volumeL: 0.25 },
  { label: 'Tech', category: 'tech', weightG: 400, volumeL: 0.6 },
  { label: 'Book or paper', category: 'documents', weightG: 300, volumeL: 0.5 },
  { label: 'Other', category: 'accessory', weightG: 500, volumeL: 1.5 },
];
export function createCustomItem(name: string, label: string): Item {
  const preset = CUSTOM_CATEGORIES.find((c) => c.label === label) ?? CUSTOM_CATEGORIES[5];
  if (!preset) throw new Error('Missing category estimate');
  return { ...COMMON_TRAVEL_ITEMS[0], id: `custom-${name}`, name: name.trim().slice(0, 80), category: preset.category, weightG: preset.weightG, volumeL: preset.volumeL, custom: true, catalogId: undefined,
    color: TRAVEL_CATALOG[0]?.color ?? '', warmth: 'light', formality: 'casual', suitable: ['city'], maxWears: 99 };
}
export function editItemMeasurement(trip: PackingTrip, ids: string[], field: 'weightG' | 'volumeL', value: number): PackingTrip {
  if (!Number.isFinite(value) || value < 0 || (field === 'volumeL' && value === 0)) return trip;
  return { ...trip, entries: trip.entries.map((e) => ids.includes(e.item.id) ? { ...e, item: { ...e.item, [field]: value, [field === 'weightG' ? 'weightSource' : 'volumeSource']: 'user' } } : e) };
}
