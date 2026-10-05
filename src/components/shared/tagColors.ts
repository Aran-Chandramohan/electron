// Tailwind's scanner needs literal class strings, so colors are looked up
// from this fixed palette rather than built dynamically. Updated to follow 
// the rainbow order: Red -> Orange -> Yellow -> Green -> Cyan -> Purple -> Rose.
export const TAG_PALETTE = ['red', 'orange', 'yellow', 'emerald', 'cyan', 'purple', 'rose'] as const;

// Soft chip backgrounds, tuned for the app's dark theme
export const TAG_COLOR_CLASSES: Record<string, { chip: string; dot: string; ring: string }> = {
  red: { chip: 'bg-red-500/15 text-red-300', dot: 'bg-red-500', ring: 'ring-red-500' },
  orange: { chip: 'bg-orange-500/15 text-orange-300', dot: 'bg-orange-500', ring: 'ring-orange-500' },
  yellow: { chip: 'bg-yellow-500/15 text-yellow-300', dot: 'bg-yellow-500', ring: 'ring-yellow-500' },
  emerald: { chip: 'bg-emerald-500/15 text-emerald-300', dot: 'bg-emerald-500', ring: 'ring-emerald-500' },
  cyan: { chip: 'bg-cyan-500/15 text-cyan-300', dot: 'bg-cyan-500', ring: 'ring-cyan-500' },
  purple: { chip: 'bg-purple-500/15 text-purple-300', dot: 'bg-purple-500', ring: 'ring-purple-500' },
  rose: { chip: 'bg-rose-500/15 text-rose-300', dot: 'bg-rose-500', ring: 'ring-rose-500' },
  slate: { chip: 'bg-slate-500/15 text-slate-300', dot: 'bg-slate-400', ring: 'ring-slate-400' },
};

// Solid backgrounds (for calendar event pills). Paired with whichever text
// color actually passes contrast against that specific background — most
// Tailwind "-500" shades (yellow, cyan, emerald, orange especially) are too
// light for white text to read well, so this isn't just bg + a blanket
// text-white applied by callers.
export const TAG_SOLID_CLASSES: Record<string, { bg: string; text: string }> = {
  red: { bg: 'bg-red-500', text: 'text-white' },
  orange: { bg: 'bg-orange-500', text: 'text-neutral-950' },
  yellow: { bg: 'bg-yellow-500', text: 'text-neutral-950' },
  emerald: { bg: 'bg-emerald-500', text: 'text-neutral-950' },
  cyan: { bg: 'bg-cyan-500', text: 'text-neutral-950' },
  purple: { bg: 'bg-purple-500', text: 'text-white' },
  rose: { bg: 'bg-rose-500', text: 'text-white' },
  slate: { bg: 'bg-slate-500', text: 'text-white' },
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
