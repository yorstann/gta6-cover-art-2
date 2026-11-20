// render-cover.js — the one render pipeline behind both the live preview and
// the full-size PNG export, so what the editor shows is exactly what exports.
//
// A render paints, in order: the graded photo panels clipped to the active
// template's polygons, a sunburst finish inside the hero panel, the white
// keylines, the poster finish (halftone dots, a warm light leak, vignette and
// grain), and finally the caption lettering. Everything is drawn from the
// plain state object the editor keeps; nothing here touches the DOM but for
// the offscreen canvases it allocates.

import { gradeById, applyGradeOverlays } from './color-grades.js';
import { templateById } from './cover-templates.js';
import { coverOffset, polygonBox } from './photo-panels.js';
import { drawCaption, captionThemeById } from './caption-lettering.js';

// The three export sizes the bounty calls the common post sizes.
export const EXPORT_SIZES = {
  square: { id: 'square', name: 'Square', w: 1080, h: 1080 },
  portrait: { id: 'portrait', name: 'Portrait', w: 1080, h: 1350 },
  landscape: { id: 'landscape', name: 'Landscape', w: 1920, h: 1080 },
};

export function exportSize(id) {
  return EXPORT_SIZES[id] || EXPORT_SIZES.square;
}

// Trace a unit-space polygon as a path in pixel space.
function tracePolygon(ctx, points, W, H) {
  ctx.beginPath();
  points.forEach(([x, y], i) => {
    if (i === 0) ctx.moveTo(x * W, y * H);
    else ctx.lineTo(x * W, y * H);
  });
  ctx.closePath();
}

// A tileable grain canvas, generated once: mid-grey noise that the overlay
// blend turns into print-like texture.
let grainTile = null;
function getGrainTile() {
  if (grainTile) return grainTile;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');
  const img = g.createImageData(256, 256);
  let a = 987654321;
  for (let i = 0; i < img.data.length; i += 4) {
    a = (Math.imul(a, 1103515245) + 12345) | 0;
    const v = 108 + ((a >>> 16) % 88);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grainTile = c;
  return c;
}

// Sunburst rays fanning from a focal point inside the hero panel: alternating
// soft wedges of warm light, clipped to the panel so they stay behind the
// poster's subject like the rays on a printed cover.
function drawSunburst(ctx, panel, W, H) {
  const box = polygonBox(panel.points);
  const cx = (box.x + box.w * 0.5) * W;
  const cy = (box.y + box.h * 0.40) * H;
  const radius = Math.max(box.w * W, box.h * H) * 1.25;
  ctx.save();
  tracePolygon(ctx, panel.points, W, H);
  ctx.clip();
  ctx.globalCompositeOperation = 'soft-light';
  const rays = 24;
  for (let i = 0; i < rays; i += 2) {
    const a0 = (i / rays) * Math.PI * 2;
    const a1 = ((i + 1) / rays) * Math.PI * 2;
    ctx.fillStyle = 'rgba(255, 236, 190, 0.85)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, a0, a1);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// One panel: the photo (or solid ink) graded on its own offscreen canvas at
// the panel's bounding-box size, then drawn into the main canvas clipped to
// the panel polygon, so diagonal Slash panels grade cleanly too.
function drawPanel(ctx, panel, placement, photosById, grade, W, H, sunburst) {
  const box = polygonBox(panel.points);
  const bx = Math.round(box.x * W);
  const by = Math.round(box.y * H);
  const bw = Math.max(2, Math.round(box.w * W));
  const bh = Math.max(2, Math.round(box.h * H));
  const photo = placement && placement.photoId ? photosById.get(placement.photoId) : null;

  ctx.save();
  tracePolygon(ctx, panel.points, W, H);
  ctx.clip();

  if (panel.ink || !photo) {
    // Solid ink panel (the Triptych caption band, or a panel with no photo):
    // a deep grade-tinted fill with a whisper of vertical light.
    const g = ctx.createLinearGradient(0, by, 0, by + bh);
    g.addColorStop(0, grade.ink);
    g.addColorStop(1, '#05030c');
    ctx.fillStyle = g;
    ctx.fillRect(bx, by, bw, bh);
  } else {
    const off = document.createElement('canvas');
    off.width = bw;
    off.height = bh;
    const octx = off.getContext('2d');
    octx.filter = grade.filter;
    const placed = coverOffset(photo.width, photo.height, bw, bh, placement);
    octx.drawImage(photo.source, placed.x, placed.y, placed.w, placed.h);
    octx.filter = 'none';
    applyGradeOverlays(octx, grade, bw, bh);
    ctx.drawImage(off, bx, by);
  }
  ctx.restore();

  if (panel.hero && sunburst) drawSunburst(ctx, panel, W, H);
}

// The poster finish: halftone dot texture, a warm leak of light from the top
// corner, a vignette, and grain — the print-shop layer over the panels.
function drawFinish(ctx, state, W, H) {
  if (state.halftone) {
    const spacing = Math.max(6, Math.round(W * 0.0075));
    const tile = document.createElement('canvas');
    tile.width = spacing;
    tile.height = spacing;
    const tctx = tile.getContext('2d');
    tctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    tctx.beginPath();
    tctx.arc(spacing / 2, spacing / 2, spacing * 0.30, 0, Math.PI * 2);
    tctx.fill();
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.10;
    ctx.fillStyle = ctx.createPattern(tile, 'repeat');
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // Light leak.
  const leak = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.75);
  leak.addColorStop(0, 'rgba(255, 160, 80, 0.20)');
  leak.addColorStop(0.5, 'rgba(255, 120, 90, 0.06)');
  leak.addColorStop(1, 'rgba(255, 120, 90, 0)');
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = leak;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Vignette.
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.78);
  vig.addColorStop(0, 'rgba(8, 2, 14, 0)');
  vig.addColorStop(1, 'rgba(8, 2, 14, 0.40)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // Grain.
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = ctx.createPattern(getGrainTile(), 'repeat');
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// Render the full cover described by `state` into `ctx` at W x H pixels.
// `photosById` is a Map of every photo entry the panels can name.
export function renderCover(ctx, state, photosById, W, H) {
  const template = templateById(state.template);
  const grade = gradeById(state.grade);
  const panels = template.panels();

  ctx.fillStyle = grade.ink;
  ctx.fillRect(0, 0, W, H);

  panels.forEach((panel, i) => {
    drawPanel(ctx, panel, state.placements[i], photosById, grade, W, H, state.sunburst !== false);
  });

  // White keylines between the panels and around the cover's edge.
  const key = Math.max(2, Math.round(W * 0.011));
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = key;
  ctx.lineJoin = 'round';
  for (const panel of panels) {
    tracePolygon(ctx, panel.points, W, H);
    ctx.stroke();
  }
  ctx.strokeRect(key / 2, key / 2, W - key, H - key);

  drawFinish(ctx, state, W, H);

  const triptychBand = template.id === 'triptych' && state.captionPos !== 'top' ? 0.8 : null;
  drawCaption(ctx, W, H, {
    main: state.caption,
    sub: state.subcaption,
    theme: captionThemeById(state.captionTheme),
    position: state.captionPos,
    scale: state.captionScale,
    skew: state.skew,
    badge: state.badge,
    badgeText: state.badgeText,
    bandTop: triptychBand,
  });
}
