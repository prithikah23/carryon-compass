import { describe, it, expect } from 'vitest';
import { COMMON_TRAVEL_ITEMS, searchTravelItems, createCustomItem, editItemMeasurement } from '@/lib/travel-items';
import { freshSample, pickAddedItemBag, totals } from '@/lib/packing';

describe('Effortless travel additions', () => {
  it('offers about 100 common items with positive estimates', () => {
    expect(COMMON_TRAVEL_ITEMS.length).toBeGreaterThanOrEqual(95);
    expect(COMMON_TRAVEL_ITEMS.length).toBeLessThanOrEqual(105);
    expect(COMMON_TRAVEL_ITEMS.every((i) => i.weightG > 0 && i.volumeL > 0)).toBe(true);
  });
  it('finds a hair dryer at about 600 g with partial words and plurals', () => {
    expect(searchTravelItems('hair dry')[0]?.weightG).toBe(600);
    expect(searchTravelItems('hair dryers')[0]?.name).toBe('Hair dryer');
  });
  it('finds camera with a sensible weight', () => {
    expect(searchTravelItems('camera')[0]?.weightG).toBe(600);
  });
  it('matches earbuds and headphone synonyms', () => {
    expect(searchTravelItems('earbuds').map((i) => i.name)).toContain('Headphones');
    expect(searchTravelItems('headphones').map((i) => i.name)).toContain('Earbuds');
    expect(searchTravelItems('pillow').map((i) => i.name)).toContain('Neck pillow');
    expect(searchTravelItems('swimsuits').map((i) => i.name)).toContain('Swimwear');
  });
  it('creates grandma\'s gift from Other without any measurements required', () => {
    expect(searchTravelItems("grandma's gift")).toHaveLength(0);
    const gift = createCustomItem("grandma's gift", 'Other');
    expect(gift.weightG).toBe(500);
    expect(gift.volumeL).toBe(1.5);
    expect(searchTravelItems('grandma', [gift])[0]?.name).toBe("grandma's gift");
  });
  it('assigns tech near you and falls back when that bag has no room', () => {
    const trip = freshSample();
    const camera = searchTravelItems('camera')[0];
    if (!camera) throw new Error('Missing camera');
    expect(pickAddedItemBag(trip, camera)).toBe('personal');
    expect(pickAddedItemBag({ ...trip, personalL: 0 }, camera)).toBe('carryOn');
  });
  it('updates totals and sources for measured values without affecting other entries', () => {
    const trip = freshSample();
    const gift = createCustomItem("grandma's gift", 'Other');
    const added = { ...trip, entries: [...trip.entries, { item: gift, bag: pickAddedItemBag(trip, gift), reason: 'Chosen for this trip', packed: false, essential: false, impact: 0 }] };
    expect(totals(added).usedG - totals(trip).usedG).toBe(500);
    const weighted = editItemMeasurement(added, [gift.id], 'weightG', 750);
    const edited = editItemMeasurement(weighted, [gift.id], 'volumeL', 2);
    expect(totals(edited).usedG - totals(trip).usedG).toBe(750);
    expect(edited.entries.at(-1)?.item.weightSource).toBe('user');
    expect(edited.entries.at(-1)?.item.volumeSource).toBe('user');
    expect(edited.entries[0]).toBe(trip.entries[0]);
  });
});
