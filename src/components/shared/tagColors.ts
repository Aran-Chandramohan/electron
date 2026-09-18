// Tailwind's scanner needs literal class strings, so colors are looked up
// from this fixed palette rather than built dynamically (`bg-${color}-100`
// would get purged from the production build). Shared by every module that
// uses Tags — To-Do categories, Calendar event colors, and whatever's next.
export const TAG_PALETTE = ['blue', 'emerald', 'purple', 'amber', 'rose', 'cyan'] as const;

// Soft chip backgrounds, tuned for the app's dark theme (translucent tint +
// light text reads correctly on a dark surface; the light-mode "bg-*-50"
// versions this replaced would have been invisible here).
export const TAG_COLOR_CLASSES: Record<string, { chip: string; dot: string; ring: string }> = {
  blue: { chip: 'bg-blue-500/15 text-blue-300', dot: 'bg-blue-500', ring: 'ring-blue-500' },
  emerald: { chip: 'bg-emerald-500/15 text-emerald-300', dot: 'bg-emerald-500', ring: 'ring-emerald-500' },
  purple: { chip: 'bg-purple-500/15 text-purple-300', dot: 'bg-purple-500', ring: 'ring-purple-500' },
  amber: { chip: 'bg-amber-500/15 text-amber-300', dot: 'bg-amber-500', ring: 'ring-amber-500' },
  rose: { chip: 'bg-rose-500/15 text-rose-300', dot: 'bg-rose-500', ring: 'ring-rose-500' },
  cyan: { chip: 'bg-cyan-500/15 text-cyan-300', dot: 'bg-cyan-500', ring: 'ring-cyan-500' },
  slate: { chip: 'bg-slate-500/15 text-slate-300', dot: 'bg-slate-400', ring: 'ring-slate-400' },
};

// Solid backgrounds (for calendar event pills, which need to read as color
// blocks rather than soft chips).
export const TAG_SOLID_CLASSES: Record<string, string> = {
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  purple: 'bg-purple-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  cyan: 'bg-cyan-500',
  slate: 'bg-slate-500',
};

export function colorClassesFor(color: string) {
  return TAG_COLOR_CLASSES[color] ?? TAG_COLOR_CLASSES.slate;
}

export function solidColorClassFor(color: string) {
  return TAG_SOLID_CLASSES[color] ?? TAG_SOLID_CLASSES.slate;
}

export function nextPaletteColor(existingCount: number): string {
  return TAG_PALETTE[existingCount % TAG_PALETTE.length];
}
