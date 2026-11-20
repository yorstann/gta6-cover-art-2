// editor-app.js — the editor: state, controls, live preview and boot.
//
// Everything the user touches lives here; the drawing itself is delegated to
// render-cover.js (preview and export share it), export-cover.js (PNG
// downloads), caption-lettering.js, color-grades.js and cover-templates.js.
// The app also answers the ?shot= deep links described in shots.json, which
// load a named photo, caption, size, template and grade and (for shot=cover)
// present the cover full-bleed so it can be captured exactly as exported.

import { TEMPLATES, templateById } from './cover-templates.js';
import { GRADES } from './color-grades.js';
import { CAPTION_THEMES } from './caption-lettering.js';
import { EXPORT_SIZES, renderCover } from './render-cover.js';
import { exportPNG } from './export-cover.js';
import { loadSamplePhotos, loadUploadedPhoto } from './sample-photos.js';
import { buildScenes } from './sample-scenes.js';
import {
  DEFAULT_DEAL_ORDER,
  dealPlacements,
  resizePlacements,
  fillAllPanels,
  panelAtPoint,
  polygonBox,
  clamp,
} from './photo-panels.js';

const $ = (id) => document.getElementById(id);

// The editor's single state object; renderCover reads exactly this shape.
const state = {
  template: 'vice-grid',
  grade: 'sunset',
  size: 'landscape',
  caption: 'PALMERA HEAT',
  subcaption: 'ONE CITY • NO BRAKES',
  captionTheme: 'sunset',
  captionPos: 'bottom',
  captionScale: 1,
  skew: true,
  badge: true,
  badgeText: 'PALMERA CITY',
  sunburst: true,
  halftone: true,
  placements: [],
  activePanel: 0,
};

let photos = [];
let photosById = new Map();
let shotMode = null;

function currentPanels() {
  return templateById(state.template).panels();
}

// Deal placements for the active template starting the deal at a given photo
// (the ?photo= deep link and the default first paint both use this).
function dealFrom(startPhotoId) {
  const count = currentPanels().length;
  if (!startPhotoId || !photosById.has(startPhotoId)) {
    state.placements = dealPlacements(count, photos);
    return;
  }
  const order = DEFAULT_DEAL_ORDER.filter((id) => photosById.has(id));
  const start = order.indexOf(startPhotoId);
  const rotated = start > 0 ? order.slice(start).concat(order.slice(0, start)) : order;
  const rest = photos.map((p) => p.id).filter((id) => !rotated.includes(id));
  const full = rotated.concat(rest);
  state.placements = Array.from({ length: count }, (_, i) => ({
    photoId: full.length ? full[i % full.length] : null,
    panX: 0,
    panY: 0,
    zoom: 1,
  }));
}

// Preview resolution: the export aspect, capped so dragging stays fluid.
function previewDims() {
  const size = EXPORT_SIZES[state.size];
  const cap = state.size === 'portrait' ? 880 : 1152;
  const scale = Math.min(1, cap / size.w);
  return { w: Math.round(size.w * scale), h: Math.round(size.h * scale) };
}

const preview = $('preview');
const pctx = preview.getContext('2d');

// Paint the preview canvas from state, then (in the editor) outline the
// active panel so it is clear which panel the controls below are editing.
// In shot=cover mode the canvas already carries the export size and the
// cover is painted full-bleed at that size instead.
function paint() {
  if (shotMode === 'cover') {
    renderCover(pctx, state, photosById, preview.width, preview.height);
    return;
  }
  const { w, h } = previewDims();
  if (preview.width !== w) preview.width = w;
  if (preview.height !== h) preview.height = h;
  renderCover(pctx, state, photosById, w, h);
  if (shotMode !== 'cover') {
    const panels = currentPanels();
    const panel = panels[state.activePanel];
    if (panel) {
      pctx.save();
      pctx.strokeStyle = 'rgba(255, 207, 63, 0.95)';
      pctx.lineWidth = 3;
      pctx.setLineDash([12, 8]);
      pctx.beginPath();
      panel.points.forEach(([x, y], i) => {
        if (i === 0) pctx.moveTo(x * w, y * h);
        else pctx.lineTo(x * w, y * h);
      });
      pctx.closePath();
      pctx.stroke();
      pctx.restore();
    }
  }
}

let paintQueued = false;
function requestPaint() {
  if (paintQueued) return;
  paintQueued = true;
  requestAnimationFrame(() => {
    paintQueued = false;
    paint();
  });
}

function setStatus(text) {
  $('status').textContent = text;
}

// ---- Photo strip -----------------------------------------------------------

function buildStrip() {
  const strip = $('strip');
  strip.textContent = '';
  for (const photo of photos) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'thumb';
    btn.title = photo.name + ' — click to put it in the selected panel';
    const thumb = document.createElement('canvas');
    thumb.width = 120;
    thumb.height = 84;
    const tctx = thumb.getContext('2d');
    const s = Math.max(120 / photo.width, 84 / photo.height);
    tctx.drawImage(photo.source, (120 - photo.width * s) / 2, (84 - photo.height * s) / 2, photo.width * s, photo.height * s);
    btn.appendChild(thumb);
    const label = document.createElement('span');
    label.textContent = photo.name;
    btn.appendChild(label);
    btn.addEventListener('click', () => {
      const placement = state.placements[state.activePanel];
      if (placement) {
        placement.photoId = photo.id;
        buildPanelList();
        requestPaint();
        setStatus(photo.name + ' is now in panel ' + (state.activePanel + 1) + '.');
      }
    });
    strip.appendChild(btn);
  }
}

// ---- Panel list ------------------------------------------------------------

function buildPanelList() {
  const list = $('panels');
  list.textContent = '';
  const panels = currentPanels();
  state.placements.forEach((placement, i) => {
    const row = document.createElement('div');
    row.className = 'panel-row' + (i === state.activePanel ? ' active' : '');

    const head = document.createElement('button');
    head.type = 'button';
    head.className = 'panel-head';
    head.textContent = 'Panel ' + (i + 1) + (panels[i] && panels[i].hero ? ' · hero' : '') + (panels[i] && panels[i].ink ? ' · caption band' : '');
    head.addEventListener('click', () => {
      state.activePanel = i;
      buildPanelList();
      requestPaint();
    });
    row.appendChild(head);

    const select = document.createElement('select');
    const inkOption = document.createElement('option');
    inkOption.value = '';
    inkOption.textContent = 'Solid ink';
    select.appendChild(inkOption);
    for (const photo of photos) {
      const opt = document.createElement('option');
      opt.value = photo.id;
      opt.textContent = photo.name;
      select.appendChild(opt);
    }
    select.value = placement.photoId || '';
    select.addEventListener('change', () => {
      placement.photoId = select.value || null;
      requestPaint();
    });
    row.appendChild(select);

    const zoomLabel = document.createElement('label');
    zoomLabel.className = 'zoom';
    zoomLabel.textContent = 'Zoom';
    const zoom = document.createElement('input');
    zoom.type = 'range';
    zoom.min = '1';
    zoom.max = '2.6';
    zoom.step = '0.02';
    zoom.value = String(placement.zoom);
    zoom.addEventListener('input', () => {
      placement.zoom = Number(zoom.value);
      requestPaint();
    });
    zoomLabel.appendChild(zoom);
    row.appendChild(zoomLabel);

    list.appendChild(row);
  });
}

// ---- Swatch groups -----------------------------------------------------------

function buildSwatches(containerId, items, currentId, onPick) {
  const box = $(containerId);
  box.textContent = '';
  for (const item of items) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'swatch' + (item.id === currentId ? ' active' : '');
    btn.textContent = item.name;
    btn.title = item.blurb || item.name;
    btn.addEventListener('click', () => onPick(item.id));
    box.appendChild(btn);
  }
}

function buildTemplateSwatches() {
  buildSwatches('templates', TEMPLATES, state.template, (id) => {
    state.template = id;
    state.placements = resizePlacements(state.placements, currentPanels().length, photos);
    state.activePanel = Math.min(state.activePanel, currentPanels().length - 1);
    buildTemplateSwatches();
    buildPanelList();
    requestPaint();
  });
}

function buildGradeSwatches() {
  buildSwatches('grades', GRADES, state.grade, (id) => {
    state.grade = id;
    buildGradeSwatches();
    requestPaint();
  });
}

function buildThemeSwatches() {
  buildSwatches('themes', CAPTION_THEMES, state.captionTheme, (id) => {
    state.captionTheme = id;
    buildThemeSwatches();
    requestPaint();
  });
}

// ---- Preview pointer handling: click selects, drag pans, wheel zooms -------

let drag = null;

function previewPoint(event) {
  const rect = preview.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / rect.width,
    y: (event.clientY - rect.top) / rect.height,
    px: event.clientX - rect.left,
    py: event.clientY - rect.top,
    w: rect.width,
    h: rect.height,
  };
}

preview.addEventListener('pointerdown', (event) => {
  const pt = previewPoint(event);
  const hit = panelAtPoint(currentPanels(), pt.x, pt.y);
  if (hit >= 0) {
    state.activePanel = hit;
    buildPanelList();
    requestPaint();
  }
  drag = { x: pt.px, y: pt.py };
  preview.setPointerCapture(event.pointerId);
});

preview.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const pt = previewPoint(event);
  const placement = state.placements[state.activePanel];
  const panel = currentPanels()[state.activePanel];
  if (!placement || !panel || panel.ink || !placement.photoId) return;
  const box = polygonBox(panel.points);
  const dx = pt.px - drag.x;
  const dy = pt.py - drag.y;
  placement.panX = clamp(placement.panX - (dx / (box.w * pt.w)) * 1.6, -1, 1);
  placement.panY = clamp(placement.panY - (dy / (box.h * pt.h)) * 1.6, -1, 1);
  drag = { x: pt.px, y: pt.py };
  requestPaint();
});

preview.addEventListener('pointerup', () => {
  drag = null;
});

preview.addEventListener('wheel', (event) => {
  const placement = state.placements[state.activePanel];
  if (!placement) return;
  event.preventDefault();
  placement.zoom = clamp(placement.zoom * (event.deltaY < 0 ? 1.07 : 0.94), 1, 2.6);
  buildPanelList();
  requestPaint();
}, { passive: false });

// ---- Uploads -----------------------------------------------------------------

async function addFiles(files) {
  const images = [...files].filter((f) => f.type.startsWith('image/'));
  if (images.length === 0) return;
  let added = 0;
  for (const file of images) {
    try {
      const photo = await loadUploadedPhoto(file, photos.length);
      photos.push(photo);
      photosById.set(photo.id, photo);
      added++;
      const placement = state.placements[state.activePanel];
      if (placement && added === 1) placement.photoId = photo.id;
    } catch {
      setStatus('One of those files could not be read as an image.');
    }
  }
  if (added > 0) {
    buildStrip();
    buildPanelList();
    requestPaint();
    setStatus(added + ' photo' + (added > 1 ? 's' : '') + ' added — your pictures never leave this machine.');
  }
}

$('upload').addEventListener('change', (event) => {
  addFiles(event.target.files);
  event.target.value = '';
});

for (const target of [preview, document.body]) {
  target.addEventListener('dragover', (event) => event.preventDefault());
  target.addEventListener('drop', (event) => {
    event.preventDefault();
    if (event.dataTransfer) addFiles(event.dataTransfer.files);
  });
}

// ---- Controls ------------------------------------------------------------------

function bindControls() {
  $('caption').addEventListener('input', (e) => {
    state.caption = e.target.value;
    requestPaint();
  });
  $('subcaption').addEventListener('input', (e) => {
    state.subcaption = e.target.value;
    requestPaint();
  });
  $('badgeText').addEventListener('input', (e) => {
    state.badgeText = e.target.value;
    requestPaint();
  });
  $('captionPos').addEventListener('change', (e) => {
    state.captionPos = e.target.value;
    requestPaint();
  });
  $('captionScale').addEventListener('input', (e) => {
    state.captionScale = Number(e.target.value);
    requestPaint();
  });
  $('skew').addEventListener('change', (e) => {
    state.skew = e.target.checked;
    requestPaint();
  });
  $('badge').addEventListener('change', (e) => {
    state.badge = e.target.checked;
    requestPaint();
  });
  $('sunburst').addEventListener('change', (e) => {
    state.sunburst = e.target.checked;
    requestPaint();
  });
  $('halftone').addEventListener('change', (e) => {
    state.halftone = e.target.checked;
    requestPaint();
  });
  $('size').addEventListener('change', (e) => {
    state.size = e.target.value;
    requestPaint();
  });
  $('fillAll').addEventListener('click', () => {
    const placement = state.placements[state.activePanel];
    if (placement && placement.photoId) {
      state.placements = fillAllPanels(state.placements, placement.photoId);
      buildPanelList();
      requestPaint();
      setStatus('Every panel now shows the same picture, cropped by the layout.');
    }
  });
  $('shuffle').addEventListener('click', () => {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    state.template = pick(TEMPLATES).id;
    state.grade = pick(GRADES).id;
    state.captionTheme = pick(CAPTION_THEMES).id;
    state.placements = currentPanels().map(() => ({
      photoId: photos.length ? pick(photos).id : null,
      panX: (Math.random() - 0.5) * 0.5,
      panY: (Math.random() - 0.5) * 0.5,
      zoom: 1 + Math.random() * 0.5,
    }));
    state.activePanel = 0;
    buildTemplateSwatches();
    buildGradeSwatches();
    buildThemeSwatches();
    buildPanelList();
    requestPaint();
    setStatus('A new look, rolled fresh. Roll again or fine-tune the panels.');
  });
  $('exportBtn').addEventListener('click', async () => {
    try {
      const name = await exportPNG(state, photosById, state.size);
      setStatus('Exported ' + name + ' — ready to post.');
    } catch (err) {
      setStatus(err.message);
    }
  });
}

// ---- Deep links (?shot=) -------------------------------------------------------

function applyDeepLink() {
  const params = new URLSearchParams(location.search);
  shotMode = params.get('shot');
  if (params.get('caption')) {
    state.caption = params.get('caption');
    $('caption').value = state.caption;
  }
  if (params.get('sub')) {
    state.subcaption = params.get('sub');
    $('subcaption').value = state.subcaption;
  }
  if (params.get('size') && EXPORT_SIZES[params.get('size')]) {
    state.size = params.get('size');
    $('size').value = state.size;
  }
  if (params.get('template') && TEMPLATES.some((t) => t.id === params.get('template'))) {
    state.template = params.get('template');
  }
  if (params.get('grade') && GRADES.some((g) => g.id === params.get('grade'))) {
    state.grade = params.get('grade');
  }
  if (params.get('theme') && CAPTION_THEMES.some((t) => t.id === params.get('theme'))) {
    state.captionTheme = params.get('theme');
  }
  dealFrom(params.get('photo'));
  if (shotMode === 'cover') {
    document.body.classList.add('shot-cover');
    // In cover mode the canvas is the whole page at export resolution.
    const size = EXPORT_SIZES[state.size];
    preview.width = size.w;
    preview.height = size.h;
  }
}

// ---- Boot ------------------------------------------------------------------------

async function boot() {
  bindControls();
  const [samplePhotos] = await Promise.all([loadSamplePhotos()]);
  photos = [...buildScenes(), ...samplePhotos];
  photosById = new Map(photos.map((p) => [p.id, p]));
  applyDeepLink();
  if (state.placements.length === 0) dealFrom(null);
  buildStrip();
  buildTemplateSwatches();
  buildGradeSwatches();
  buildThemeSwatches();
  buildPanelList();
  // Sync the static controls with any deep-linked state.
  $('caption').value = state.caption;
  $('subcaption').value = state.subcaption;
  paint();
  // Anton may land after the first paint; repaint once fonts are in.
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
    paint();
  }
  window.__viceFrame = { state, photos, exportPNG: (sizeId) => exportPNG(state, photosById, sizeId || state.size) };
  window.__viceFrameReady = true;
}

boot().catch((err) => {
  setStatus(err.message);
  window.__viceFrameReady = true;
});
