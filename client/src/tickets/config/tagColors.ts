export const TAG_COLORS = [
  { key: 'red', dot: 'bg-red-500', pill: 'bg-red-500/15 text-red-500' },
  { key: 'orange', dot: 'bg-orange-500', pill: 'bg-orange-500/15 text-orange-500' },
  { key: 'yellow', dot: 'bg-yellow-500', pill: 'bg-yellow-500/15 text-yellow-500' },
  { key: 'green', dot: 'bg-green-500', pill: 'bg-green-500/15 text-green-500' },
  { key: 'teal', dot: 'bg-teal-500', pill: 'bg-teal-500/15 text-teal-500' },
  { key: 'blue', dot: 'bg-blue-500', pill: 'bg-blue-500/15 text-blue-500' },
  { key: 'purple', dot: 'bg-purple-500', pill: 'bg-purple-500/15 text-purple-500' },
  { key: 'pink', dot: 'bg-pink-500', pill: 'bg-pink-500/15 text-pink-500' },
] as const;

export type TagColorKey = typeof TAG_COLORS[number]['key'];

export function getTagColor(key: string) {
  return TAG_COLORS.find(c => c.key === key) ?? TAG_COLORS[0];
}
