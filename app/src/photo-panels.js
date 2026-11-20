// photo-panels.js — the photo list and the per-panel placement state.
//
// A "photo" here is anything drawable with a width and a height: a bundled
// photograph, an uploaded image, or one of the illustrated scene canvases.
// Each panel of the active template owns a placement: which photo fills it
// (or null for a solid ink panel), a pan offset in -1..1, and a zoom factor.
// This module keeps that state and the cover-fit maths used to draw a photo
// into a panel's bounding box; rendering itself lives in render-cover.js.

// The order photos are dealt into fresh panels: illustrated scenes first so a
// brand-new cover already looks like poster art, photographs after.
export const DEFAULT_DEAL_ORDER = ['scene-pier', 'photo-pier', 'scene-neon', 'photo-boulevard', 'scene-beach'];

// One fresh placement for a panel.
export function makePlacement(photoId) {
  return { photoId: photoId ?? null, panX: 0, panY: 0, zoom: 1 };
}

// Build placements for a panel count, dealing the built-in photos round-robin
// and leaving any later panels to repeat the deal from the top.
export function dealPlacements(panelCount, photos) {
  const byId = new Map(photos.map((p) => [p.id, p]));
  const deal = DEFAULT_DEAL_ORDER.filter((id) => byId.has(id));
  const fallback = photos.map((p) => p.id);
  const order = deal.length > 0 ? deal : fallback;
  const out = [];
  for (let i = 0; i < panelCount; i++) {
    out.push(makePlacement(order.length > 0 ? order[i % order.length] : null));
  }
  return out;
}

// Resize a placement list to a new panel count (template switch), keeping the
// placements that still exist and dealing fresh ones for the new panels.
export function resizePlacements(placements, panelCount, photos) {
  const next = placements.slice(0, panelCount);
  if (next.length < panelCount) {
    const dealt = dealPlacements(panelCount, photos);
    while (next.length < panelCount) next.push(dealt[next.length]);
  }
  return next;
}

// Point every panel at the same photo ("one photo fills all panels").
export function fillAllPanels(placements, photoId) {
  return placements.map((p) => ({ ...p, photoId }));
}

// Cover-fit maths: the drawn size of a photo scaled so it covers a box, at a
// zoom factor on top of the plain cover scale. Returns the scale plus the
// drawn width and height in box pixels.
export function coverFit(photoW, photoH, boxW, boxH, zoom) {
  const scale = Math.max(boxW / photoW, boxH / photoH) * (zoom || 1);
  return { scale, w: photoW * scale, h: photoH * scale };
}

// The draw position of a cover-fitted photo inside a box, given a pan in
// -1..1 on each axis: pan slides the photo between its two covered edges, so
// -1 shows the left/top of the photo and 1 shows the right/bottom.
export function coverOffset(photoW, photoH, boxW, boxH, placement) {
  const fit = coverFit(photoW, photoH, boxW, boxH, placement.zoom);
  const spareX = Math.max(0, fit.w - boxW);
  const spareY = Math.max(0, fit.h - boxH);
  return {
    x: -spareX * (0.5 + 0.5 * clamp(placement.panX, -1, 1)),
    y: -spareY * (0.5 + 0.5 * clamp(placement.panY, -1, 1)),
    w: fit.w,
    h: fit.h,
  };
}

export function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

// Find which panel polygon a point (in unit cover space) falls in, for
// click-to-select and drag-to-pan on the preview. Returns -1 when the point
// misses every panel.
export function panelAtPoint(panels, x, y) {
  for (let i = panels.length - 1; i >= 0; i--) {
    if (pointInPolygon(x, y, panels[i].points)) return i;
  }
  return -1;
}

// Even-odd ray casting point-in-polygon test on unit-space points.
export function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// The axis-aligned bounding box of a unit-space polygon.
export function polygonBox(points) {
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
