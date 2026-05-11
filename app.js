/**
 * GenArxiu — app.js
 * Generador de Portades per a Partitures
 *
 * Desenvolupador: MarcMànyez
 * Llicència: GPLv3
 * Versió: v0.1
 *
 * Lògica completa: render canvas, export PDF, import/export config.
 * Replicació fidel del comportament de l'original Python/ReportLab.
 */

'use strict';

/* ─────────────────────────────────────────────────────
   MIDES DE PÀGINA (punts PDF: 1pt = 1/72")
   A4 vertical:      595.28 × 841.89 pt  (210 × 297 mm)
   A5 horitzontal:   841.89 × 595.28 pt  (297 × 210 mm)
───────────────────────────────────────────────────── */
const A4W = 595.28, A4H = 841.89;
const A5W = 841.89, A5H = 595.28;
const CANVAS_SCALE = 2; // 2× per resolució retina al preview

/* ─────────────────────────────────────────────────────
   ESTAT GLOBAL
───────────────────────────────────────────────────── */
const S = {
  tab:  'a4',
  logo: null,   // Image object | null
  fons: null,   // Image object | null
};
let _renderTimer = null;
let _toastTimer  = null;

/* ─────────────────────────────────────────────────────
   SECCIÓ COLLAPSIBLE
───────────────────────────────────────────────────── */
function toggleSection(header) {
  const sec = header.closest('.groupbox-wrap');
  if (!sec) return;
  const body = sec.querySelector('.groupbox-body');
  if (!body) return;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : '';
  header.querySelector('.sec-arrow').textContent = isOpen ? '►' : '▼';
}

/* ─────────────────────────────────────────────────────
   BOTONS DE JUSTIFICACIÓ
───────────────────────────────────────────────────── */
function setJust(btn) {
  const grp = btn.closest('.just-group');
  grp.querySelectorAll('.just-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  grp.dataset.v = btn.dataset.k;
  queueRender();
}

function getJust(id) {
  const g = document.getElementById(id);
  return g ? (g.dataset.v || 'E') : 'E';
}

/* ─────────────────────────────────────────────────────
   COLOR — sincronitza picker ↔ text hex
───────────────────────────────────────────────────── */
function syncPicker(id) {
  const v  = document.getElementById('cp-' + id).value;
  const ct = document.getElementById('ct-' + id);
  const sw = document.getElementById('sw-' + id);
  if (ct) ct.value = v;
  if (sw) sw.style.background = v;
  queueRender();
}

function syncText(id) {
  const v = (document.getElementById('ct-' + id).value || '').trim();
  if (/^#[0-9a-fA-F]{6}$/i.test(v)) {
    const p  = document.getElementById('cp-' + id);
    const sw = document.getElementById('sw-' + id);
    if (p)  p.value = v;
    if (sw) sw.style.background = v;
    queueRender();
  }
}

function getColor(id) {
  const el = document.getElementById('ct-' + id);
  return el ? el.value : '#000000';
}

/* ─────────────────────────────────────────────────────
   MODE FONS
───────────────────────────────────────────────────── */
function onFonsModeChange() {
  const isImg = document.getElementById('fons-mode').value === 'imatge';
  document.getElementById('fons-color-ui').style.display = isImg ? 'none' : '';
  document.getElementById('fons-img-ui').style.display   = isImg ? '' : 'none';
  queueRender();
}

/* ─────────────────────────────────────────────────────
   CÀRREGA D'IMATGES
───────────────────────────────────────────────────── */
function loadImageFile(file, onLoad) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => onLoad(img, file.name);
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function loadLogo(input) {
  loadImageFile(input.files[0], (img, name) => {
    S.logo = img;
    document.getElementById('logo-name').textContent = name;
    document.getElementById('logo-opts').style.display = '';
    document.getElementById('status-logo').textContent = 'Logo: ' + name;
    queueRender();
  });
}

function clearLogo() {
  S.logo = null;
  document.getElementById('logo-file').value = '';
  document.getElementById('logo-name').textContent = '(cap)';
  document.getElementById('logo-opts').style.display = 'none';
  document.getElementById('status-logo').textContent = 'Sense logo';
  queueRender();
}

function loadFons(input) {
  loadImageFile(input.files[0], (img, name) => {
    S.fons = img;
    document.getElementById('fons-name').textContent = name;
    queueRender();
  });
}

function clearFons() {
  S.fons = null;
  document.getElementById('fons-file').value = '';
  document.getElementById('fons-name').textContent = '(cap)';
  queueRender();
}

/* ─────────────────────────────────────────────────────
   TABS PREVIEW
───────────────────────────────────────────────────── */
function setTab(t) {
  S.tab = t;
  ['a4', 'a5', 'both'].forEach(k => {
    document.getElementById('tab-' + k).classList.toggle('on', k === t);
  });
  document.getElementById('slot-a4').style.display = (t === 'a4' || t === 'both') ? '' : 'none';
  document.getElementById('slot-a5').style.display = (t === 'a5' || t === 'both') ? '' : 'none';
  queueRender();
}

/* ─────────────────────────────────────────────────────
   TOAST
───────────────────────────────────────────────────── */
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

/* ─────────────────────────────────────────────────────
   LECTURA DE LA CONFIGURACIÓ DES DE LA UI
───────────────────────────────────────────────────── */
function readConfig() {
  return {
    num:    document.getElementById('f-num').value,
    tit:    document.getElementById('f-tit').value.toUpperCase(),
    comp:   document.getElementById('f-comp').value,

    fnNum:  document.getElementById('fn-num').value,
    fnTit:  document.getElementById('fn-tit').value,
    fnComp: document.getElementById('fn-comp').value,

    fsNum:  Math.max(8, parseInt(document.getElementById('fs-num').value)  || 48),
    fsTit:  Math.max(8, parseInt(document.getElementById('fs-tit').value)  || 72),
    fsComp: Math.max(8, parseInt(document.getElementById('fs-comp').value) || 28),

    cNum:   getColor('num'),
    cTit:   getColor('tit'),
    cComp:  getColor('comp'),
    cMarc:  getColor('marc'),
    cFons:  getColor('fons'),

    sNum:   document.getElementById('sub-num').checked,
    sTit:   document.getElementById('sub-tit').checked,
    sComp:  document.getElementById('sub-comp').checked,

    showMarc: document.getElementById('show-marc').checked,
    fonsIsColor: document.getElementById('fons-mode').value === 'color',

    jhNum:  getJust('jh-num'),
    jvNum:  getJust('jv-num'),
    jhTit:  getJust('jh-tit'),
    jvTit:  getJust('jv-tit'),
    jhComp: getJust('jh-comp'),
    jvComp: getJust('jv-comp'),
    jhLogo: getJust('jh-logo'),
    jvLogo: getJust('jv-logo'),
  };
}

/* ─────────────────────────────────────────────────────
   DIVISIÓ DEL TÍTOL EN DUES LÍNIES
   Mirall exacte de dividir_titol_en_dos() Python
───────────────────────────────────────────────────── */
function splitTitle(text) {
  const words = text.split(' ').filter(Boolean);
  if (words.length <= 2) return [text, null];
  let best = null, bestDiff = 9999;
  for (let i = 1; i < words.length; i++) {
    const l1 = words.slice(0, i).join(' ');
    const l2 = words.slice(i).join(' ');
    if (l1.split(' ').length < 2 || l2.split(' ').length < 2) continue;
    const d = Math.abs(l1.length - l2.length);
    if (d < bestDiff) { bestDiff = d; best = [l1, l2]; }
  }
  return best || [text, null];
}

/* ─────────────────────────────────────────────────────
   AJUST DE MIDA DE FONT
   Mirall exacte de ajustar_mida_titol() Python
───────────────────────────────────────────────────── */
function fitFontSize(ctx, text, font, startSz, maxW, margin) {
  let sz = startSz;
  while (sz > 10) {
    ctx.font = sz + 'px ' + font;
    if (ctx.measureText(text).width <= maxW - 2 * margin) return sz;
    sz -= 2;
  }
  return 10;
}

function fitFontSizeTwo(ctx, l1, l2, font, startSz, maxW, margin) {
  let sz = startSz;
  while (sz > 10) {
    ctx.font = sz + 'px ' + font;
    if (ctx.measureText(l1).width <= maxW - 2 * margin &&
        ctx.measureText(l2).width <= maxW - 2 * margin) return sz;
    sz -= 2;
  }
  return 10;
}

/* ─────────────────────────────────────────────────────
   HELPERS DE POSICIÓ
   ReportLab: Y=0 baix-esquerra. drawString baseline a Y.
   Canvas:    Y=0 dalt-esquerra. fillText baseline a Y.

   Conversió (PH = alçada en pt):
     ReportLab y_rl → Canvas y_cv = PH - y_rl

   Etiquetes: D=Dalt, C=Centre, B=Baix  (en resultat visual)
     D (top visual):    RL y = alt - marge - sz  →  CV y = marge + sz
     C (centre visual): RL y = alt/2             →  CV y = PH/2
     B (bottom visual): RL y = marge             →  CV y = PH - marge
───────────────────────────────────────────────────── */
function xFromJH(jh, left, cen, right) {
  return jh === 'E' ? left : jh === 'C' ? cen : right;
}
function yFromJV_A4(jv, sz, PH, MARGE) {
  if (jv === 'D') return MARGE + sz;          // top visual
  if (jv === 'C') return PH / 2;              // centre visual
  return PH - MARGE;                          // bottom visual
}
function yFromJV_A5(jv, sz, PH, MARGE) {
  // A5: C del número → alt*0.75 RL → PH - PH*0.75 CV = PH*0.25 from top
  // A5: B del compositor → alt*0.25 RL → PH - PH*0.25 CV = PH*0.75 from top
  if (jv === 'D') return MARGE + sz;
  if (jv === 'C') return PH * 0.25;           // número centre A5
  return PH - MARGE;                          // bottom visual
}
function yCompFromJV_A5(jv, sz, PH, MARGE) {
  // compositor A5: C → alt*0.25 RL → PH*0.75 CV
  if (jv === 'D') return MARGE + sz;
  if (jv === 'C') return PH * 0.75;
  return PH - MARGE;
}
function yLogoFromJV(jv, lh, PH, MARGE, a5) {
  // logo A4: D→alt-marge-h2 RL = MARGE CV; C→alt/2-h2/2 RL = PH/2-lh/2 CV; B→marge RL = PH-MARGE-lh CV
  // logo A5: C→alt*0.6-h2/2 RL → PH - (alt*0.6-h2/2+h2) CV ≈ PH - PH*0.6 + lh/2 - lh + h2 ... simpler:
  //   alt*0.6 from bottom = PH*(1-0.6) = PH*0.4 from top for the bottom of image = PH*0.4 - lh centre
  if (jv === 'D') return MARGE;
  if (jv === 'C') return a5 ? PH * 0.4 - lh / 2 : PH / 2 - lh / 2;
  return PH - MARGE - lh;
}

/* ─────────────────────────────────────────────────────
   DIBUIX PRINCIPAL
   Replica generar_pdf_temporal() i generar_pdf_temporal_a5()
   Treballa directament en coordenades de canvas (0,0 = dalt-esquerra)
───────────────────────────────────────────────────── */
function drawCover(ctx, C, isA5, PW, PH) {
  const ESC   = isA5 ? 0.65 : 1.0;
  const MARGE = isA5 ? 40 * ESC : 50;
  const OUTER = isA5 ? 15 * ESC : 20;

  /* ── FONS ── */
  if (C.fonsIsColor || !S.fons) {
    ctx.fillStyle = C.cFons;
    ctx.fillRect(0, 0, PW, PH);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, PW, PH);
    const img = S.fons;
    const sc  = Math.max(PW / img.width, PH / img.height);
    const iw  = img.width * sc, ih = img.height * sc;
    ctx.drawImage(img, (PW - iw) / 2, (PH - ih) / 2, iw, ih);
  }

  /* ── MARC ── */
  if (C.showMarc) {
    ctx.strokeStyle = C.cMarc;
    ctx.lineWidth   = isA5 ? 1.5 * ESC : 2;
    ctx.strokeRect(OUTER, OUTER, PW - 2 * OUTER, PH - 2 * OUTER);
  }

  /* ── NÚMERO ── */
  if (C.num) {
    let sz = fitFontSize(ctx, C.num, C.fnNum, C.fsNum * ESC, PW, MARGE);
    ctx.font = sz + 'px ' + C.fnNum;
    const tw = ctx.measureText(C.num).width;
    const nx = xFromJH(C.jhNum, MARGE, PW / 2 - tw / 2, PW - MARGE - tw);
    const ny = isA5
      ? yFromJV_A5(C.jvNum, sz, PH, MARGE)
      : yFromJV_A4(C.jvNum, sz, PH, MARGE);
    ctx.fillStyle = C.cNum;
    ctx.fillText(C.num, nx, ny);
    if (C.sNum) {
      const yd = ny + (isA5 ? 3 * ESC : 5);
      ctx.save(); ctx.strokeStyle = C.cNum; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(nx, yd); ctx.lineTo(nx + tw, yd); ctx.stroke();
      ctx.restore();
    }
  }

  /* ── LOGOTIP ── */
  if (S.logo) {
    const refSz = C.fsNum * ESC;
    const maxW  = refSz * 2, maxH = refSz * 1.5;
    const sc    = Math.min(maxW / S.logo.width, maxH / S.logo.height, 1);
    const lw    = S.logo.width * sc, lh = S.logo.height * sc;
    const lx    = xFromJH(C.jhLogo, MARGE, PW / 2 - lw / 2, PW - MARGE - lw);
    const ly    = yLogoFromJV(C.jvLogo, lh, PH, MARGE, isA5);
    ctx.drawImage(S.logo, lx, ly, lw, lh);
  }

  /* ── TÍTOL ── */
  if (C.tit) {
    const [l1, l2] = splitTitle(C.tit);
    let tsz = (l2 === null)
      ? fitFontSize(ctx, l1, C.fnTit, C.fsTit * ESC, PW, MARGE)
      : fitFontSizeTwo(ctx, l1, l2, C.fnTit, C.fsTit * ESC, PW, MARGE);
    const sep = tsz * 1.2;

    // A5: títol sempre centrat H i V (comportament original Python)
    const jhT = isA5 ? 'C' : C.jhTit;
    const jvT = isA5 ? 'C' : C.jvTit;
    const zC  = isA5 ? PH * 0.50 : PH / 2;

    ctx.fillStyle = C.cTit;

    function drawLine(text, y) {
      ctx.font = tsz + 'px ' + C.fnTit;
      const tw = ctx.measureText(text).width;
      const tx = jhT === 'E' ? MARGE : jhT === 'C' ? PW / 2 - tw / 2 : PW - MARGE - tw;
      ctx.fillText(text, tx, y);
      if (C.sTit) {
        const yd = y + (isA5 ? 3 * ESC : 5);
        ctx.save(); ctx.strokeStyle = C.cTit; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(tx, yd); ctx.lineTo(tx + tw, yd); ctx.stroke();
        ctx.restore();
      }
    }

    if (l2 === null) {
      // Línia única
      // RL: D→alt-marge-sz, C→alt/2, B→marge+sz
      // CV: D→MARGE+tsz, C→zC, B→PH-MARGE
      const ty = jvT === 'D' ? MARGE + tsz : jvT === 'C' ? zC : PH - MARGE;
      drawLine(l1, ty);
    } else {
      // Dues línies
      // RL D: y1=alt-marge-sep (línia1 dalt), y2=y1-sep (línia2 sota la 1a en RL → més avall visual)
      // CV D: y1=MARGE+tsz, y2=y1+sep
      // RL C: y1=alt/2+sep/2, y2=alt/2-sep/2 → CV y1=PH/2-sep/2, y2=PH/2+sep/2... però:
      //   en RL, drawString(y1) on y1>y2 posa y1 més amunt. En CV, y1<y2 posa y1 més amunt.
      //   RL y1=alt/2+sep/2 (línia1 sobre centre) → CV y1=PH/2-sep/2+tsz/2 (ajust baseline)
      // RL B: y2=marge (línia2 abaix), y1=marge+sep → CV y2=PH-MARGE, y1=y2-sep
      let y1, y2;
      if (jvT === 'D')      { y1 = MARGE + tsz; y2 = y1 + sep; }
      else if (jvT === 'C') { y1 = zC - sep / 2 + tsz / 2; y2 = y1 + sep; }
      else                  { y2 = PH - MARGE; y1 = y2 - sep; }
      drawLine(l1, y1);
      drawLine(l2, y2);
    }
  }

  /* ── COMPOSITOR ── */
  if (C.comp) {
    let sz = fitFontSize(ctx, C.comp, C.fnComp, C.fsComp * ESC, PW, MARGE);
    ctx.font = sz + 'px ' + C.fnComp;
    const tw = ctx.measureText(C.comp).width;
    const cx = xFromJH(C.jhComp, MARGE, PW / 2 - tw / 2, PW - MARGE - tw);
    const cy = isA5
      ? yCompFromJV_A5(C.jvComp, sz, PH, MARGE)
      : yFromJV_A4(C.jvComp, sz, PH, MARGE);
    ctx.fillStyle = C.cComp;
    ctx.fillText(C.comp, cx, cy);
    if (C.sComp) {
      const yd = cy + (isA5 ? 3 * ESC : 5);
      ctx.save(); ctx.strokeStyle = C.cComp; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, yd); ctx.lineTo(cx + tw, yd); ctx.stroke();
      ctx.restore();
    }
  }
}

/* ─────────────────────────────────────────────────────
   PREVIEW — renderitza canvases escalats
───────────────────────────────────────────────────── */
function queueRender() {
  clearTimeout(_renderTimer);
  _renderTimer = setTimeout(doRender, 60);
}

function doRender() {
  const C    = readConfig();
  const area = document.getElementById('preview-area');
  const aW   = area.clientWidth  - 40;
  const aH   = area.clientHeight - 40;
  const both = S.tab === 'both';

  function renderOne(cvId, isA5) {
    const cv = document.getElementById(cvId);
    const PW = isA5 ? A5W : A4W;
    const PH = isA5 ? A5H : A4H;
    cv.width  = Math.round(PW * CANVAS_SCALE);
    cv.height = Math.round(PH * CANVAS_SCALE);
    const ctx = cv.getContext('2d');
    ctx.save();
    ctx.scale(CANVAS_SCALE, CANVAS_SCALE);
    drawCover(ctx, C, isA5, PW, PH);
    ctx.restore();
    // escala CSS per encabir a l'àrea disponible
    const slotW = both ? aW / 2 - 10 : aW;
    const sc    = Math.min(slotW / PW, aH / PH, 1);
    cv.style.width  = (PW * sc) + 'px';
    cv.style.height = (PH * sc) + 'px';
  }

  if (S.tab === 'a4'  || both) renderOne('cv-a4', false);
  if (S.tab === 'a5'  || both) renderOne('cv-a5', true);

  // Actualitza barra d'estat
  const parts = [];
  if (C.num)  parts.push('Nº: ' + C.num);
  if (C.tit)  parts.push(C.tit.substring(0, 30) + (C.tit.length > 30 ? '…' : ''));
  if (C.comp) parts.push(C.comp);
  const st = document.getElementById('status-content');
  if (st) st.textContent = parts.join(' · ') || 'Cap contingut';
}

/* ─────────────────────────────────────────────────────
   EXPORTACIÓ PDF
   Renderitza a 3× resolució per qualitat d'impressió
───────────────────────────────────────────────────── */
function generatePDF(format) {
  const { jsPDF } = window.jspdf;
  const C    = readConfig();
  const isA5 = format === 'a5';
  const PW   = isA5 ? A5W : A4W;
  const PH   = isA5 ? A5H : A4H;
  const HI   = 3;

  const off = document.createElement('canvas');
  off.width  = Math.round(PW * HI);
  off.height = Math.round(PH * HI);
  const ctx = off.getContext('2d');
  ctx.save();
  ctx.scale(HI, HI);
  drawCover(ctx, C, isA5, PW, PH);
  ctx.restore();

  const doc = new jsPDF({
    orientation: isA5 ? 'l' : 'p',
    unit:        'pt',
    format:      [PW, PH],
  });
  doc.addImage(off.toDataURL('image/png', 1.0), 'PNG', 0, 0, PW, PH);
  const date = new Date().toISOString().slice(0, 10);
  doc.save('portada_' + format.toUpperCase() + '_' + date + '.pdf');
  showToast('PDF ' + format.toUpperCase() + ' generat correctament.');
}

/* ─────────────────────────────────────────────────────
   EXPORTACIÓ CONFIG JSON
   Claus compatibles amb l'original Python
───────────────────────────────────────────────────── */
function exportConfig() {
  const C  = readConfig();
  const jv = {};
  ['jh-num','jv-num','jh-tit','jv-tit','jh-comp','jv-comp','jh-logo','jv-logo'].forEach(id => {
    const g = document.getElementById(id);
    if (g) jv[id] = g.dataset.v;
  });

  const out = {
    font_numero:     C.fnNum,
    font_titol:      C.fnTit,
    font_compositor: C.fnComp,
    mida_numero:     C.fsNum,
    mida_titol:      C.fsTit,
    mida_compositor: C.fsComp,
    color_numero:    C.cNum,
    color_titol:     C.cTit,
    color_compositor:C.cComp,
    color_quadre:    C.cMarc,
    fons_color:      C.cFons,
    sub_num:         C.sNum,
    sub_titol:       C.sTit,
    sub_comp:        C.sComp,
    just_num:        C.jhNum,
    justv_num:       C.jvNum,
    just_titol:      C.jhTit,
    justv_titol:     C.jvTit,
    just_comp:       C.jhComp,
    justv_comp:      C.jvComp,
    just_img:        C.jhLogo,
    justv_img:       C.jvLogo,
    mostrar_quadre:  C.showMarc,
    fons_mode:       C.fonsIsColor ? 'Color sòlid' : 'Imatge',
    _jv:             jv,
    _version:        'web-v0.1',
    _app:            'GenArxiu',
  };

  const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href:     url,
    download: 'genarxiu_config.json',
  });
  a.click();
  URL.revokeObjectURL(url);
  showToast('Configuració exportada.');
}

/* ─────────────────────────────────────────────────────
   IMPORTACIÓ CONFIG JSON
   Compatible amb fitxers de l'original Python i del web
───────────────────────────────────────────────────── */
function importConfig() {
  const inp = document.createElement('input');
  inp.type   = 'file';
  inp.accept = '.json';
  inp.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => {
      try {
        applyConfig(JSON.parse(ev.target.result));
        showToast('Configuració carregada correctament.');
      } catch {
        showToast('Error: no s\'ha pogut llegir el JSON.');
      }
    };
    r.readAsText(file);
  };
  inp.click();
}

function applyConfig(c) {
  function sv(id, val) {
    const el = document.getElementById(id);
    if (el && val !== undefined && val !== null) el.value = val;
  }
  function sc(id, val) {
    const el = document.getElementById(id);
    if (el) el.checked = !!val;
  }
  function setColor(id, hex) {
    if (!hex || !/^#[0-9a-fA-F]{6}$/i.test(hex)) return;
    const t  = document.getElementById('ct-' + id);
    const p  = document.getElementById('cp-' + id);
    const sw = document.getElementById('sw-' + id);
    if (t)  t.value = hex;
    if (p)  p.value = hex;
    if (sw) sw.style.background = hex;
  }
  function setJustGroup(grpId, val) {
    if (!val) return;
    const g = document.getElementById(grpId);
    if (!g) return;
    g.dataset.v = val;
    g.querySelectorAll('.just-btn').forEach(b => b.classList.toggle('on', b.dataset.k === val));
  }

  sv('fn-num',  c.font_numero     || c.fnNum  || 'serif');
  sv('fn-tit',  c.font_titol      || c.fnTit  || "'Playfair Display',Georgia,serif");
  sv('fn-comp', c.font_compositor || c.fnComp || 'serif');
  sv('fs-num',  c.mida_numero     || c.fsNum  || 48);
  sv('fs-tit',  c.mida_titol      || c.fsTit  || 72);
  sv('fs-comp', c.mida_compositor || c.fsComp || 28);

  setColor('num',  c.color_numero     || c.cNum  || '#000000');
  setColor('tit',  c.color_titol      || c.cTit  || '#000000');
  setColor('comp', c.color_compositor || c.cComp || '#000000');
  setColor('marc', c.color_quadre     || c.cMarc || '#000000');
  setColor('fons', c.fons_color       || c.cFons || '#ffffff');

  sc('sub-num',  c.sub_num   ?? c.sNum  ?? false);
  sc('sub-tit',  c.sub_titol ?? c.sTit  ?? false);
  sc('sub-comp', c.sub_comp  ?? c.sComp ?? false);
  sc('show-marc', c.mostrar_quadre !== undefined ? c.mostrar_quadre : (c.showMarc !== undefined ? c.showMarc : true));

  const isImg = (c.fons_mode === 'Imatge') || (c.fonsIsColor === false);
  sv('fons-mode', isImg ? 'imatge' : 'color');
  onFonsModeChange();

  const jv = c._jv || {};
  setJustGroup('jh-num',  jv['jh-num']  || c.just_num    || 'E');
  setJustGroup('jv-num',  jv['jv-num']  || c.justv_num   || 'D');
  setJustGroup('jh-tit',  jv['jh-tit']  || c.just_titol  || 'C');
  setJustGroup('jv-tit',  jv['jv-tit']  || c.justv_titol || 'C');
  setJustGroup('jh-comp', jv['jh-comp'] || c.just_comp   || 'E');
  setJustGroup('jv-comp', jv['jv-comp'] || c.justv_comp  || 'B');
  setJustGroup('jh-logo', jv['jh-logo'] || c.just_img    || 'D');
  setJustGroup('jv-logo', jv['jv-logo'] || c.justv_img   || 'D');

  queueRender();
}

/* ─────────────────────────────────────────────────────
   DIÀLEG "QUANT A"
───────────────────────────────────────────────────── */
function showAbout() {
  alert(
    'GenArxiu v0.1\n' +
    'Generador de Portades per a Partitures\n\n' +
    'Desenvolupador: MarcMànyez\n' +
    'Llicència: GPLv3\n\n' +
    'Eina per generar portades de partitures en format PDF A4 i A5 horitzontal.'
  );
}

/* ─────────────────────────────────────────────────────
   INICI
───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // ResizeObserver per re-renderitzar quan canvia la mida de la finestra
  new ResizeObserver(() => queueRender())
    .observe(document.getElementById('preview-area'));

  queueRender();
});
