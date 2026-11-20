// color-grades.js — the five colour grades, applied to one panel at a time.
//
// A grade is two steps on the panel's own offscreen canvas: a canvas filter
// while the photo is drawn (saturation, contrast, brightness), then one or
// more gradient overlays in a blend mode. Neon Nights is a true split-tone:
// a teal multiply deepens the shadows toward cyan-green while a magenta
// screen lifts the highlights toward pink, so it reads as neon even over a
// warm sunset photograph. The ink colour is what solid panels (the Triptych
// caption band) and the cover's outer frame are painted with.

export const GRADES = [
  {
    id: 'sunset',
    name: 'Sunset',
    filter: 'saturate(1.28) contrast(1.09) brightness(1.04)',
    ink: '#2a0f2e',
    overlays: [
      { mode: 'soft-light', stops: [[0, 'rgba(255, 170, 80, 0.9)'], [0.55, 'rgba(255, 90, 110, 0.55)'], [1, 'rgba(90, 20, 90, 0.9)']] },
      { mode: 'screen', stops: [[0, 'rgba(255, 150, 70, 0.20)'], [0.5, 'rgba(255, 150, 70, 0)']] },
    ],
  },
  {
    id: 'neon',
    name: 'Neon Nights',
    filter: 'saturate(1.55) contrast(1.16) brightness(1.03)',
    ink: '#070418',
    overlays: [
      // Split-tone, step one: multiply teal. Multiply is luminance-weighted,
      // so the shadows take the teal hardest; the gradient deepens it low in
      // the frame, like light pooling on a night street.
      { mode: 'multiply', stops: [[0, 'rgba(225, 252, 255, 1)'], [0.55, 'rgba(120, 225, 232, 1)'], [1, 'rgba(30, 130, 150, 1)']] },
      // Split-tone, step two: screen magenta, strongest high in the frame,
      // which pushes the highlights toward hot pink.
      { mode: 'screen', stops: [[0, 'rgba(255, 45, 150, 0.55)'], [0.45, 'rgba(255, 45, 150, 0.10)'], [1, 'rgba(20, 0, 60, 0)']] },
      // A last saturation-friendly glow so midtones keep the neon clash.
      { mode: 'soft-light', stops: [[0, 'rgba(255, 60, 200, 0.85)'], [1, 'rgba(0, 220, 230, 0.85)']] },
    ],
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    filter: 'saturate(1.18) contrast(1.05) brightness(1.08) sepia(0.22)',
    ink: '#33200d',
    overlays: [
      { mode: 'soft-light', stops: [[0, 'rgba(255, 205, 110, 0.95)'], [1, 'rgba(160, 90, 30, 0.9)']] },
      { mode: 'screen', stops: [[0, 'rgba(255, 190, 90, 0.16)'], [0.6, 'rgba(255, 190, 90, 0)']] },
    ],
  },
  {
    id: 'noir',
    name: 'Noir',
    filter: 'grayscale(1) contrast(1.28) brightness(1.06)',
    ink: '#0c0c10',
    overlays: [
      { mode: 'soft-light', stops: [[0, 'rgba(255, 255, 255, 0.7)'], [1, 'rgba(0, 0, 0, 0.9)']] },
    ],
  },
  {
    id: 'raw',
    name: 'Raw',
    filter: 'saturate(1.06) contrast(1.03)',
    ink: '#14161c',
    overlays: [],
  },
];

// Look a grade up by id, falling back to Sunset.
export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

// Paint a grade's overlays over a w x h region of a context whose photo has
// already been drawn. Each overlay is a top-to-bottom gradient; blend modes
// do the tonal work (multiply darkens, screen lightens, soft-light nudges).
export function applyGradeOverlays(ctx, grade, w, h) {
  for (const overlay of grade.overlays) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    for (const [at, color] of overlay.stops) g.addColorStop(at, color);
    ctx.save();
    ctx.globalCompositeOperation = overlay.mode;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}
