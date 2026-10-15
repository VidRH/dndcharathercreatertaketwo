import { fetchEquipment } from './useClassRaceAlignApi.js'

// Takes [{ index, name, count }] and adds the full API info as .details
// (that's where damage dice, damage type and pack contents live)
export async function withItemDetails(items) {
  return Promise.all(
    items.map(async (item) => ({ ...item, details: await fetchEquipment(item.index) })),
  )
}

// Adds up doubles: the dagger you always get + the dagger you picked = 2x Dagger
export function mergeItems(items) {
  const byIndex = new Map()
  for (const item of items) {
    const existing = byIndex.get(item.index)
    if (existing) existing.count += item.count
    else byIndex.set(item.index, { ...item })
  }
  return [...byIndex.values()]
}

export function isWeapon(item) {
  return item.details.equipment_category.index === 'weapon'
}

// One row for the attacks table: name, damage die, damage type
export function weaponRow(item) {
  const damage = item.details.damage // a net has no damage, so this can be missing
  return {
    name: item.count > 1 ? `${item.name} (x${item.count})` : item.name,
    damageDie: damage ? damage.damage_dice : '-',
    damageType: damage ? damage.damage_type.name : '-',
  }
}

// One line for the equipment box. Packs also list what's inside them.
export function gearLine(item) {
  const line = `${item.count}x ${item.name}`
  const contents = item.details.contents
  if (!contents || contents.length === 0) return line
  const inside = contents.map((thing) => `   - ${thing.quantity}x ${thing.item.name}`)
  return [line, ...inside].join('\n')
}

// Turns the API's "starting_equipment" list into our item shape
export function fixedItems(startingEquipment) {
  return startingEquipment.map((entry) => ({
    type: 'equipment',
    index: entry.equipment.index,
    name: entry.equipment.name,
    count: entry.quantity,
  }))
}
