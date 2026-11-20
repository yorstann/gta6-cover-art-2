// sample-scenes.js — three original illustrated scenes drawn procedurally on canvas.
//
// GTA-style covers are illustrated, not photographed, so Vice Frame 2 ships poster
// scenes painted with flat vector shapes: a sunset pier with a lowrider silhouette,
// a neon boulevard at night, and a beach with a lifeguard tower and a speedboat.
// Each scene renders once onto its own offscreen canvas at 1920 x 1200, large
// enough to stay razor sharp when a panel is exported at full poster size, and
// the photo system then treats each canvas exactly like a loaded photograph.

export const SCENE_WIDTH = 1920;
export const SCENE_HEIGHT = 1200;

// A tiny deterministic random source, so the scenes paint the same way on every
// machine and every load (mulberry32).
function makeRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function verticalGradient(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}

// One palm tree silhouette: a curved trunk built from two arcs and a crown of
// drooping fronds drawn as tapered strokes, with two coconuts at the crown.
function drawPalm(ctx, x, y, s, lean, color) {
  const topX = x + lean * s;
  const topY = y - s;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  // Trunk: a few stacked segments, each thinner, following a gentle curve.
  const segments = 7;
  let px = x;
  let py = y;
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const nx = x + lean * s * t * t;
    const ny = y - s * t;
    ctx.lineWidth = s * 0.075 * (1 - t * 0.55);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(nx, ny);
    ctx.stroke();
    px = nx;
    py = ny;
  }
  // Fronds: arcs that rise off the crown and droop at the tips.
  const fronds = 9;
  for (let i = 0; i < fronds; i++) {
    const ang = Math.PI * (0.08 + (i / (fronds - 1)) * 0.84);
    const len = s * (0.52 + (i % 3) * 0.09);
    const ex = topX + Math.cos(ang) * len;
    const ey = topY - Math.sin(ang) * len * 0.55 + len * 0.34;
    const mx = topX + Math.cos(ang) * len * 0.5;
    const my = topY - Math.sin(ang) * len * 0.62;
    ctx.lineWidth = s * 0.045;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(topX - s * 0.045, topY + s * 0.03, s * 0.045, 0, Math.PI * 2);
  ctx.arc(topX + s * 0.05, topY + s * 0.045, s * 0.038, 0, Math.PI * 2);
  ctx.fill();
}

// A lowrider-style car silhouette: long body, low stance, big whitewall wheels,
// with a thin sunset rim light along the roofline and hood.
function drawLowrider(ctx, x, y, s, body, rim) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // Ground shadow.
  ctx.fillStyle = 'rgba(10, 2, 18, 0.45)';
  ctx.beginPath();
  ctx.ellipse(310, 178, 320, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body.
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(8, 150);
  ctx.quadraticCurveTo(4, 118, 40, 108);
  ctx.lineTo(120, 100);
  ctx.quadraticCurveTo(150, 58, 215, 50);
  ctx.lineTo(360, 46);
  ctx.quadraticCurveTo(430, 48, 470, 92);
  ctx.lineTo(560, 104);
  ctx.quadraticCurveTo(606, 110, 604, 140);
  ctx.quadraticCurveTo(603, 158, 580, 160);
  ctx.lineTo(508, 160);
  ctx.arc(452, 160, 56, 0, Math.PI, true);
  ctx.lineTo(212, 160);
  ctx.arc(156, 160, 56, 0, Math.PI, true);
  ctx.lineTo(30, 160);
  ctx.quadraticCurveTo(10, 160, 8, 150);
  ctx.fill();
  // Cabin glass.
  ctx.fillStyle = 'rgba(140, 30, 70, 0.85)';
  ctx.beginPath();
  ctx.moveTo(168, 96);
  ctx.quadraticCurveTo(192, 64, 232, 58);
  ctx.lineTo(300, 55);
  ctx.lineTo(300, 96);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(314, 55);
  ctx.lineTo(356, 54);
  ctx.quadraticCurveTo(404, 56, 436, 94);
  ctx.lineTo(314, 96);
  ctx.closePath();
  ctx.fill();
  // Rim light along the top edge.
  ctx.strokeStyle = rim;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(44, 106);
  ctx.lineTo(120, 98);
  ctx.quadraticCurveTo(150, 56, 215, 48);
  ctx.lineTo(360, 44);
  ctx.quadraticCurveTo(428, 46, 468, 90);
  ctx.stroke();
  // Wheels: tyre, whitewall ring, hub.
  for (const wx of [156, 452]) {
    ctx.fillStyle = '#0a0512';
    ctx.beginPath();
    ctx.arc(wx, 160, 54, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f4ead8';
    ctx.beginPath();
    ctx.arc(wx, 160, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1b1030';
    ctx.beginPath();
    ctx.arc(wx, 160, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd98a';
    ctx.beginPath();
    ctx.arc(wx, 160, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Scene A: a sunset pier — gradient sky, a low sun, banded clouds, a calm sea
// with a sun streak, a wooden pier, palm silhouettes and the lowrider.
function paintSunsetPier() {
  const c = makeCanvas(SCENE_WIDTH, SCENE_HEIGHT);
  const ctx = c.getContext('2d');
  const W = SCENE_WIDTH;
  const H = SCENE_HEIGHT;
  const horizon = H * 0.62;
  const rand = makeRandom(20261);

  // Sky.
  ctx.fillStyle = verticalGradient(ctx, 0, horizon, [
    [0, '#2a1052'],
    [0.38, '#7a1e63'],
    [0.68, '#d63d63'],
    [0.9, '#ff7a45'],
    [1, '#ffb35c'],
  ]);
  ctx.fillRect(0, 0, W, horizon);

  // Cloud bands: flat rounded bars in dusk purples and pinks.
  const cloudCols = ['rgba(46, 16, 84, 0.55)', 'rgba(122, 30, 99, 0.5)', 'rgba(255, 122, 140, 0.35)'];
  for (let i = 0; i < 26; i++) {
    const cy = rand() * horizon * 0.8;
    const cw = 140 + rand() * 420;
    const cx = rand() * W - 100;
    ctx.fillStyle = cloudCols[i % cloudCols.length];
    ctx.beginPath();
    ctx.roundRect(cx, cy, cw, 10 + rand() * 16, 12);
    ctx.fill();
  }

  // Sun: a big low disc with a warm halo, clipped by the horizon.
  const sunX = W * 0.60;
  const sunY = horizon - H * 0.05;
  const halo = ctx.createRadialGradient(sunX, sunY, 40, sunX, sunY, 420);
  halo.addColorStop(0, 'rgba(255, 205, 110, 0.85)');
  halo.addColorStop(0.5, 'rgba(255, 140, 80, 0.35)');
  halo.addColorStop(1, 'rgba(255, 140, 80, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(sunX - 440, sunY - 440, 880, 880);
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 128, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe3a3';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 104, 0, Math.PI * 2);
  ctx.fill();

  // Sea.
  ctx.fillStyle = verticalGradient(ctx, horizon, H, [
    [0, '#ff8a5c'],
    [0.25, '#c94b6d'],
    [0.7, '#5c2158'],
    [1, '#2a1052'],
  ]);
  ctx.fillRect(0, horizon, W, H - horizon);
  // Sun streak on the water: jittered horizontal dashes under the sun.
  for (let i = 0; i < 60; i++) {
    const t = i / 60;
    const ry = horizon + 12 + t * (H - horizon - 30);
    const spread = 60 + t * 300;
    const rx = sunX + (rand() - 0.5) * spread;
    const rw = 40 + rand() * (90 + t * 160);
    ctx.fillStyle = `rgba(255, ${190 + Math.floor(rand() * 40)}, 110, ${0.5 - t * 0.3})`;
    ctx.fillRect(rx - rw / 2, ry, rw, 4 + t * 5);
  }
  // Ripple lines.
  ctx.strokeStyle = 'rgba(255, 170, 150, 0.25)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 22; i++) {
    const ry = horizon + 20 + rand() * (H - horizon - 40);
    const rx = rand() * W;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + 60 + rand() * 180, ry);
    ctx.stroke();
  }

  // Distant headland on the left.
  ctx.fillStyle = '#3a1460';
  ctx.beginPath();
  ctx.moveTo(0, horizon);
  ctx.quadraticCurveTo(180, horizon - 90, 430, horizon - 26);
  ctx.quadraticCurveTo(560, horizon - 6, 700, horizon);
  ctx.closePath();
  ctx.fill();

  // The pier: a deck running from the lower left toward the sun, with posts
  // and a railing, all in deep silhouette.
  ctx.fillStyle = '#1c0a33';
  ctx.beginPath();
  ctx.moveTo(0, H * 0.86);
  ctx.lineTo(W * 0.52, horizon + 26);
  ctx.lineTo(W * 0.56, horizon + 40);
  ctx.lineTo(0, H * 0.97);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(0, H * 0.94, W, H * 0.06);
  // Deck planks edge + posts.
  ctx.fillStyle = '#12061f';
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const px = 60 + t * (W * 0.46);
    const py = H * 0.885 - t * (H * 0.885 - horizon - 30);
    ctx.fillRect(px, py, 16 - t * 7, H - py);
  }
  // Lamp posts with warm globes along the pier.
  for (let i = 0; i < 3; i++) {
    const t = i / 2;
    const lx = 190 + t * (W * 0.34);
    const ly = H * 0.865 - t * (H * 0.865 - horizon - 34);
    const lh = 120 - t * 52;
    ctx.strokeStyle = '#1c0a33';
    ctx.lineWidth = 9 - t * 3;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx, ly - lh);
    ctx.stroke();
    const glow = ctx.createRadialGradient(lx, ly - lh, 2, lx, ly - lh, 44 - t * 14);
    glow.addColorStop(0, 'rgba(255, 220, 150, 0.95)');
    glow.addColorStop(1, 'rgba(255, 200, 120, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lx, ly - lh, 44 - t * 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe9b0';
    ctx.beginPath();
    ctx.arc(lx, ly - lh, 8 - t * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Foreground boardwalk band + the lowrider parked on it.
  ctx.fillStyle = '#170829';
  ctx.fillRect(0, H * 0.955, W, H * 0.045);
  drawLowrider(ctx, W * 0.56, H * 0.70, 1.06, '#20093d', '#ff9a5c');

  // Palms framing both sides.
  drawPalm(ctx, 96, H * 1.0, 560, 0.22, '#170829');
  drawPalm(ctx, 210, H * 1.02, 430, 0.3, '#1e0a38');
  drawPalm(ctx, W - 120, H * 1.0, 620, -0.2, '#170829');
  drawPalm(ctx, W - 300, H * 1.03, 400, -0.34, '#1e0a38');

  // Birds: small double arcs.
  ctx.strokeStyle = 'rgba(30, 8, 48, 0.8)';
  ctx.lineWidth = 5;
  for (let i = 0; i < 7; i++) {
    const bx = 240 + rand() * (W - 480);
    const by = 90 + rand() * 260;
    const bs = 13 + rand() * 12;
    ctx.beginPath();
    ctx.arc(bx - bs, by, bs, Math.PI * 1.15, Math.PI * 1.85);
    ctx.arc(bx + bs, by, bs, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }
  return c;
}

// A neon sign: a glowing shape (diamond, bolt, ring or palm disc) with a halo.
function drawNeonSign(ctx, x, y, s, color, kind) {
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = color;
  ctx.shadowBlur = 34;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 7;
  ctx.lineJoin = 'round';
  if (kind === 'diamond') {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.72, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s * 0.72, 0);
    ctx.closePath();
    ctx.stroke();
  } else if (kind === 'bolt') {
    ctx.beginPath();
    ctx.moveTo(s * 0.18, -s);
    ctx.lineTo(-s * 0.42, s * 0.18);
    ctx.lineTo(-s * 0.02, s * 0.18);
    ctx.lineTo(-s * 0.18, s);
    ctx.lineTo(s * 0.42, -s * 0.18);
    ctx.lineTo(s * 0.02, -s * 0.18);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'ring') {
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.34, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Palm disc: a filled circle with a dark palm cut into it.
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    drawPalm(ctx, -s * 0.06, s * 0.62, s * 1.05, 0.16, '#0a0618');
  }
  ctx.restore();
}

// Scene B: a neon boulevard at night — star sky, two walls of buildings with
// lit windows and glowing signs, and a wet street full of smeared reflections.
function paintNeonBoulevard() {
  const c = makeCanvas(SCENE_WIDTH, SCENE_HEIGHT);
  const ctx = c.getContext('2d');
  const W = SCENE_WIDTH;
  const H = SCENE_HEIGHT;
  const ground = H * 0.72;
  const rand = makeRandom(777);

  // Night sky.
  ctx.fillStyle = verticalGradient(ctx, 0, ground, [
    [0, '#04040f'],
    [0.6, '#0a1030'],
    [1, '#1a0f38'],
  ]);
  ctx.fillRect(0, 0, W, ground);
  // Stars.
  for (let i = 0; i < 130; i++) {
    ctx.fillStyle = `rgba(220, 230, 255, ${0.25 + rand() * 0.6})`;
    const r = rand() * 2.1 + 0.5;
    ctx.fillRect(rand() * W, rand() * ground * 0.5, r, r);
  }
  // Moon.
  ctx.fillStyle = '#e8ecff';
  ctx.beginPath();
  ctx.arc(W * 0.86, H * 0.13, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0a1030';
  ctx.beginPath();
  ctx.arc(W * 0.875, H * 0.115, 40, 0, Math.PI * 2);
  ctx.fill();

  // Building rows: left and right walls converging toward a lit centre block.
  const winCols = ['#ffd98a', '#9be8ff', '#ff9be0', '#fff3c9'];
  function building(x, w, top, tone) {
    ctx.fillStyle = tone;
    ctx.fillRect(x, top, w, ground - top);
    const cols = Math.max(2, Math.floor(w / 44));
    const rows = Math.max(3, Math.floor((ground - top) / 52));
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        if (rand() < 0.42) continue;
        ctx.fillStyle = winCols[Math.floor(rand() * winCols.length)];
        ctx.globalAlpha = 0.5 + rand() * 0.5;
        ctx.fillRect(x + 10 + i * ((w - 20) / cols), top + 14 + j * ((ground - top - 24) / rows), 15, 20);
      }
    }
    ctx.globalAlpha = 1;
  }
  building(0, 300, 150, '#0a0a22');
  building(316, 240, 260, '#0d0d2a');
  building(572, 200, 350, '#0a0a22');
  building(1150, 200, 330, '#0d0d2a');
  building(1366, 240, 240, '#0a0a22');
  building(1622, 298, 140, '#0d0d2a');
  // Centre hotel block, taller and brighter.
  building(792, 336, 190, '#101034');
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(792, 176, 336, 10);

  // Wet street.
  ctx.fillStyle = verticalGradient(ctx, ground, H, [
    [0, '#131338'],
    [0.4, '#0b0b26'],
    [1, '#05050f'],
  ]);
  ctx.fillRect(0, ground, W, H - ground);
  // Centre dashes rushing toward the viewer.
  ctx.fillStyle = 'rgba(255, 240, 190, 0.75)';
  for (let i = 0; i < 6; i++) {
    const t = i / 6;
    const dy = ground + 26 + t * (H - ground - 40);
    const dw = 6 + t * 26;
    ctx.fillRect(W / 2 - dw / 2, dy, dw, 8 + t * 30);
  }

  // Neon signs on the facades, then their reflections smeared down the street.
  const signs = [
    { x: 150, y: 300, s: 74, color: '#ff2e88', kind: 'palm' },
    { x: 436, y: 420, s: 56, color: '#22d3ee', kind: 'diamond' },
    { x: 660, y: 330, s: 48, color: '#facc15', kind: 'bolt' },
    { x: 960, y: 300, s: 66, color: '#ff2e88', kind: 'ring' },
    { x: 1252, y: 430, s: 52, color: '#a78bfa', kind: 'diamond' },
    { x: 1490, y: 320, s: 62, color: '#22d3ee', kind: 'palm' },
    { x: 1760, y: 450, s: 54, color: '#ff9a3d', kind: 'bolt' },
  ];
  for (const s of signs) drawNeonSign(ctx, s.x, s.y, s.s, s.color, s.kind);
  // Reflections: soft vertical streaks under each sign, wobbling wider as they fall.
  for (const s of signs) {
    const g = ctx.createLinearGradient(0, ground, 0, H);
    g.addColorStop(0, s.color + 'aa');
    g.addColorStop(1, s.color + '00');
    ctx.fillStyle = g;
    const wob = 10 + rand() * 16;
    ctx.beginPath();
    ctx.moveTo(s.x - s.s * 0.5, ground);
    ctx.lineTo(s.x + s.s * 0.5, ground);
    ctx.lineTo(s.x + s.s * 0.5 + wob, H);
    ctx.lineTo(s.x - s.s * 0.5 - wob, H);
    ctx.closePath();
    ctx.globalAlpha = 0.30;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // Window-light shimmer across the street.
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = winCols[Math.floor(rand() * winCols.length)];
    ctx.globalAlpha = 0.05 + rand() * 0.12;
    const ry = ground + rand() * (H - ground);
    ctx.fillRect(rand() * W, ry, 30 + rand() * 130, 3 + rand() * 4);
  }
  ctx.globalAlpha = 1;

  // Silhouette palms against the neon.
  drawPalm(ctx, 60, ground + 66, 330, 0.18, '#06061a');
  drawPalm(ctx, W - 66, ground + 60, 360, -0.16, '#06061a');
  return c;
}

// Scene C: a bright beach — sun and clouds, turquoise sea, a speedboat with a
// foam wake, a lifeguard tower, an umbrella and soft sand.
function paintBeachDay() {
  const c = makeCanvas(SCENE_WIDTH, SCENE_HEIGHT);
  const ctx = c.getContext('2d');
  const W = SCENE_WIDTH;
  const H = SCENE_HEIGHT;
  const seaTop = H * 0.34;
  const sandTop = H * 0.74;
  const rand = makeRandom(415);

  // Sky.
  ctx.fillStyle = verticalGradient(ctx, 0, seaTop, [
    [0, '#1d7fd1'],
    [0.7, '#63b8ec'],
    [1, '#bfe8ff'],
  ]);
  ctx.fillRect(0, 0, W, seaTop);
  // Sun with short rays, upper right.
  const sunX = W * 0.82;
  const sunY = H * 0.14;
  ctx.strokeStyle = 'rgba(255, 224, 130, 0.85)';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(sunX + Math.cos(a) * 92, sunY + Math.sin(a) * 92);
    ctx.lineTo(sunX + Math.cos(a) * 128, sunY + Math.sin(a) * 128);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 74, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe98a';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 58, 0, Math.PI * 2);
  ctx.fill();
  // Clouds: clusters of white ellipses.
  function cloud(x, y, s) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    for (const [dx, dy, r] of [[0, 0, 46], [52, 8, 36], [-54, 10, 34], [8, -20, 38], [96, 16, 26]]) {
      ctx.beginPath();
      ctx.ellipse(x + dx * s, y + dy * s, r * s, r * 0.62 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  cloud(300, 130, 1.15);
  cloud(760, 84, 0.8);
  cloud(1240, 170, 0.95);
  cloud(1640, 250, 0.66);

  // Sea.
  ctx.fillStyle = verticalGradient(ctx, seaTop, sandTop, [
    [0, '#37b6d9'],
    [0.55, '#1f9ec4'],
    [1, '#57c9dd'],
  ]);
  ctx.fillRect(0, seaTop, W, sandTop - seaTop);
  // Sparkle + foam strokes.
  for (let i = 0; i < 70; i++) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.12 + rand() * 0.3})`;
    ctx.lineWidth = 3 + rand() * 3;
    const ry = seaTop + 16 + rand() * (sandTop - seaTop - 30);
    const rx = rand() * W;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + 30 + rand() * 110, ry);
    ctx.stroke();
  }

  // Speedboat: sleek hull, red stripe, windscreen, and a fan of foam wake.
  const boatX = W * 0.56;
  const boatY = seaTop + (sandTop - seaTop) * 0.42;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.beginPath();
  ctx.moveTo(boatX - 330, boatY + 66);
  ctx.quadraticCurveTo(boatX - 120, boatY + 26, boatX + 30, boatY + 52);
  ctx.quadraticCurveTo(boatX - 90, boatY + 84, boatX - 330, boatY + 88);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(boatX - 60, boatY + 30);
  ctx.lineTo(boatX + 250, boatY + 22);
  ctx.quadraticCurveTo(boatX + 330, boatY + 24, boatX + 322, boatY + 52);
  ctx.quadraticCurveTo(boatX + 200, boatY + 78, boatX + 40, boatY + 74);
  ctx.lineTo(boatX - 60, boatY + 62);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e3352b';
  ctx.fillRect(boatX - 58, boatY + 44, 372, 13);
  ctx.fillStyle = '#173a5e';
  ctx.beginPath();
  ctx.moveTo(boatX + 120, boatY + 22);
  ctx.lineTo(boatX + 168, boatY - 16);
  ctx.lineTo(boatX + 226, boatY - 14);
  ctx.lineTo(boatX + 252, boatY + 22);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f2f5f7';
  ctx.fillRect(boatX + 60, boatY + 2, 210, 12);

  // Sand.
  ctx.fillStyle = verticalGradient(ctx, sandTop, H, [
    [0, '#ffe3a1'],
    [1, '#f7c873'],
  ]);
  ctx.fillRect(0, sandTop, W, H - sandTop);
  // Wet-sand foam edge where sea meets sand.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.beginPath();
  ctx.moveTo(0, sandTop);
  for (let x = 0; x <= W; x += 80) {
    ctx.quadraticCurveTo(x + 40, sandTop + 14 + rand() * 10, x + 80, sandTop + 2);
  }
  ctx.lineTo(W, sandTop + 26);
  ctx.lineTo(0, sandTop + 26);
  ctx.closePath();
  ctx.fill();
  // Sand speckle.
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = `rgba(190, 130, 50, ${0.12 + rand() * 0.2})`;
    ctx.fillRect(rand() * W, sandTop + 40 + rand() * (H - sandTop - 50), 4, 3);
  }

  // Lifeguard tower, left foreground: legs, cross braces, cabin, roof, ramp.
  const tx = 300;
  const tBase = H * 0.985;
  const tTop = H * 0.52;
  ctx.strokeStyle = '#8c4a21';
  ctx.lineWidth = 17;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(tx - 92, tBase);
  ctx.lineTo(tx - 44, tTop + 130);
  ctx.moveTo(tx + 92, tBase);
  ctx.lineTo(tx + 44, tTop + 130);
  ctx.moveTo(tx - 78, tBase - 120);
  ctx.lineTo(tx + 66, tTop + 190);
  ctx.moveTo(tx + 78, tBase - 120);
  ctx.lineTo(tx - 66, tTop + 190);
  ctx.stroke();
  // Ramp down to the sand.
  ctx.strokeStyle = '#a35c28';
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.moveTo(tx + 40, tTop + 150);
  ctx.lineTo(tx + 250, tBase - 6);
  ctx.stroke();
  // Cabin.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(tx - 118, tTop, 236, 138);
  ctx.fillStyle = '#e3352b';
  ctx.fillRect(tx - 118, tTop + 100, 236, 38);
  ctx.fillStyle = '#173a5e';
  ctx.fillRect(tx - 84, tTop + 26, 168, 52);
  // Roof.
  ctx.fillStyle = '#e3352b';
  ctx.beginPath();
  ctx.moveTo(tx - 142, tTop + 6);
  ctx.lineTo(tx, tTop - 66);
  ctx.lineTo(tx + 142, tTop + 6);
  ctx.closePath();
  ctx.fill();

  // Beach umbrella, right foreground: striped canopy on a tilted pole.
  const ux = W * 0.8;
  const uy = H * 0.8;
  ctx.strokeStyle = '#8c4a21';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(ux + 26, uy + 190);
  ctx.lineTo(ux - 10, uy);
  ctx.stroke();
  const stripes = ['#e3352b', '#ffffff'];
  for (let i = 0; i < 6; i++) {
    const a0 = Math.PI * (1 + i / 6);
    const a1 = Math.PI * (1 + (i + 1) / 6);
    ctx.fillStyle = stripes[i % 2];
    ctx.beginPath();
    ctx.moveTo(ux - 10, uy);
    ctx.arc(ux - 10, uy, 190, a0, a1);
    ctx.closePath();
    ctx.fill();
  }

  // A palm leaning in from the right edge.
  drawPalm(ctx, W - 40, H * 1.01, 470, -0.42, '#2e7d46');
  return c;
}

// The scene catalogue: id, display name and painter for each illustrated sample.
export const SCENE_DEFS = [
  { id: 'scene-pier', name: 'Sunset Pier (illustrated)', paint: paintSunsetPier },
  { id: 'scene-neon', name: 'Neon Boulevard (illustrated)', paint: paintNeonBoulevard },
  { id: 'scene-beach', name: 'Beach Day (illustrated)', paint: paintBeachDay },
];

// Paint every scene once and return them as photo-like entries whose `source`
// is a canvas the rest of the app can draw from like any loaded photograph.
export function buildScenes() {
  return SCENE_DEFS.map((def) => {
    const canvas = def.paint();
    return { id: def.id, name: def.name, source: canvas, width: canvas.width, height: canvas.height, kind: 'scene' };
  });
}
