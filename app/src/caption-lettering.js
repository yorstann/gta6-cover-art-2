// caption-lettering.js — the poster's words: a big condensed main line, a
// letterspaced sub-line, and a rotated sticker badge, all drawn on canvas.
//
// The main line is set in Anton (the heavy condensed face bundled in
// app/fonts/), filled with a vertical gradient, given a thick dark stroke
// and a hard offset shadow — the classic poster treatment. Its default size
// is 13% of the cover height, and it shrinks to fit when a caption runs long.

export const CAPTION_THEMES = [
  {
    id: 'sunset',
    name: 'Sunset',
    stops: [[0, '#ffffff'], [0.55, '#ffd166'], [1, '#ff8a3d']],
    stroke: '#2a0f2e',
    sub: '#ffe9c9',
  },
  {
    id: 'neon',
    name: 'Neon',
    stops: [[0, '#ffffff'], [0.5, '#ff71ce'], [1, '#01cdfe']],
    stroke: '#0b0620',
    sub: '#b8f7ff',
  },
  {
    id: 'chrome',
    name: 'Chrome',
    stops: [[0, '#ffffff'], [0.45, '#dfe6ee'], [0.58, '#8fa3b8'], [1, '#f4f8fb']],
    stroke: '#10131a',
    sub: '#e8eef4',
  },
];

// Look a caption theme up by id, falling back to Sunset.
export function captionThemeById(id) {
  return CAPTION_THEMES.find((t) => t.id === id) || CAPTION_THEMES[0];
}

// A rounded-rectangle path built from arcs, so the badge never depends on
// newer canvas helpers being present.
function roundedRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// Set the Anton face at a pixel size on a context.
function setAnton(ctx, px) {
  ctx.font = px + 'px Anton, "Arial Narrow Bold", sans-serif';
}

// The sticker badge: a rotated, thick-bordered lozenge of poster yellow with
// dark condensed text, placed in the corner opposite the caption block.
function drawBadge(ctx, W, H, text, captionAtTop) {
  const size = H * 0.036;
  setAnton(ctx, size);
  const textW = ctx.measureText(text).width;
  const padX = size * 0.7;
  const w = textW + padX * 2;
  const h = size * 1.62;
  const cx = W - W * 0.035 - w / 2;
  const cy = captionAtTop ? H - H * 0.045 - h / 2 : H * 0.045 + h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((-8 * Math.PI) / 180);
  ctx.shadowColor = 'rgba(10, 4, 16, 0.5)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = size * 0.12;
  ctx.shadowOffsetY = size * 0.16;
  roundedRectPath(ctx, -w / 2, -h / 2, w, h, h * 0.28);
  ctx.fillStyle = '#ffcf3f';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = size * 0.13;
  ctx.strokeStyle = '#17102a';
  ctx.stroke();
  ctx.fillStyle = '#17102a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, size * 0.05);
  ctx.restore();
}

// Draw the whole caption block. Options:
//   main, sub     the two lines of text (either may be empty)
//   theme         a CAPTION_THEMES entry
//   position      'bottom' or 'top'
//   scale         user size multiplier on the 13%-of-height default
//   skew          apply the -4 degree poster slant
//   badge         draw the sticker badge, with badgeText
//   bandTop       when the template has a caption band, its top edge as a
//                 fraction of the height; the block centres inside the band
export function drawCaption(ctx, W, H, opts) {
  const theme = opts.theme;
  const main = (opts.main || '').toUpperCase();
  const sub = (opts.sub || '').toUpperCase();
  if (!main && !sub && !opts.badge) return;

  let mainSize = H * 0.13 * (opts.scale || 1);
  // Shrink the main line until it fits the cover's width.
  if (main) {
    setAnton(ctx, mainSize);
    const w = ctx.measureText(main).width;
    const maxW = W * 0.94;
    if (w > maxW) mainSize = Math.max(H * 0.045, (mainSize * maxW) / w);
  }
  let subSize = mainSize * 0.30;
  let gap = mainSize * 0.30;
  let blockH = (sub ? subSize + gap : 0) + mainSize;

  // Inside a caption band the whole block must fit the band: shrink the
  // lettering rather than let the main line spill past the cover's edge.
  if (opts.bandTop != null && opts.position !== 'top') {
    const bandH = H - opts.bandTop * H;
    if (blockH > bandH * 0.94) {
      const f = (bandH * 0.94) / blockH;
      mainSize *= f;
      subSize *= f;
      gap *= f;
      blockH *= f;
    }
  }

  // Vertical anchor of the block's top edge.
  let blockTop;
  if (opts.bandTop != null && opts.position !== 'top') {
    const bandH = H - opts.bandTop * H;
    blockTop = opts.bandTop * H + Math.max(0, (bandH - blockH) / 2);
  } else if (opts.position === 'top') {
    blockTop = H * 0.045;
  } else {
    blockTop = H - H * 0.05 - blockH;
  }

  ctx.save();
  if (opts.skew) {
    const cy = blockTop + blockH / 2;
    ctx.translate(W / 2, cy);
    ctx.transform(1, 0, Math.tan((-4 * Math.PI) / 180), 1, 0, 0);
    ctx.translate(-W / 2, -cy);
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  let cursor = blockTop;
  if (sub) {
    setAnton(ctx, subSize);
    try {
      ctx.letterSpacing = Math.round(subSize * 0.34) + 'px';
    } catch {
      // Older engines have no letterSpacing; the line still reads fine.
    }
    ctx.lineWidth = subSize * 0.16;
    ctx.strokeStyle = theme.stroke;
    ctx.strokeText(sub, W / 2, cursor + subSize);
    ctx.fillStyle = theme.sub;
    ctx.fillText(sub, W / 2, cursor + subSize);
    try {
      ctx.letterSpacing = '0px';
    } catch {
      // Nothing to reset where the property does not exist.
    }
    cursor += subSize + gap;
  }

  if (main) {
    setAnton(ctx, mainSize);
    const baseline = cursor + mainSize * 0.94;
    // Hard drop shadow: an offset copy in near-black under everything.
    ctx.fillStyle = 'rgba(12, 4, 20, 0.88)';
    ctx.fillText(main, W / 2 + mainSize * 0.055, baseline + mainSize * 0.075);
    // Thick dark stroke, then the gradient fill.
    ctx.lineWidth = mainSize * 0.15;
    ctx.strokeStyle = theme.stroke;
    ctx.strokeText(main, W / 2, baseline);
    const grad = ctx.createLinearGradient(0, baseline - mainSize, 0, baseline + mainSize * 0.1);
    for (const [at, color] of theme.stops) grad.addColorStop(at, color);
    ctx.fillStyle = grad;
    ctx.fillText(main, W / 2, baseline);
  }
  ctx.restore();

  if (opts.badge && opts.badgeText) {
    drawBadge(ctx, W, H, String(opts.badgeText).toUpperCase(), opts.position === 'top');
  }
}
