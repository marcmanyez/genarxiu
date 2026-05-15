/**
 * GenArxiu — app.js | MarcMànyez | GPLv3 | v0.1
 */
'use strict';

const A4W = 595.28, A4H = 841.89;
// A5 horitzontal: 148 × 210 mm = 419.53 × 595.28 pt
const A5W = 419.53, A5H = 595.28;
const CS  = 2; // canvas retina scale
// Factor d'escala A5 respecte A4: A5W/A4W ≈ 0.7071 (√2 invers)
const A5_ESC = A5W / A4W;

const S = { tab: 'a4', logo: null, fons: null };
let _rt = null, _tt = null;

/* ── HELPERS ── */
function el(id)      { return document.getElementById(id); }
function val(id)     { const e = el(id); return e ? e.value : ''; }
function chk(id)     { const e = el(id); return e ? e.checked : false; }
function getCol(id)  { return val('ct-' + id) || '#000000'; }
function getJust(id) { const g = el(id); return g ? (g.dataset.v || 'E') : 'E'; }
function isOn(id)    { const e = el(id); return e ? e.classList.contains('on') : false; }
function fstr(sz, bold, ital, fam) {
  return (ital ? 'italic ' : '') + (bold ? 'bold ' : '') + sz + 'px ' + fam;
}

/* ── COLOR ── */
function syncPicker(id) {
  const v = el('cp-' + id).value;
  const t = el('ct-' + id), sw = el('sw-' + id);
  if (t) t.value = v;
  if (sw) sw.style.background = v;
  qR();
}
function syncText(id) {
  const v = (val('ct-' + id)).trim();
  if (/^#[0-9a-fA-F]{6}$/i.test(v)) {
    const p = el('cp-' + id), sw = el('sw-' + id);
    if (p) p.value = v;
    if (sw) sw.style.background = v;
    qR();
  }
}

/* ── BOLD / ITALIC ── */
function toggleStyle(btn) { btn.classList.toggle('on'); qR(); }

/* ── JUSTIFY ── */
function setJust(btn) {
  const g = btn.closest('.just-group');
  g.querySelectorAll('.just-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  g.dataset.v = btn.dataset.k;
  qR();
}

/* ── DARK MODE ── */
function toggleDark() {
  document.body.classList.toggle('dark');
  el('dark-btn').textContent = document.body.classList.contains('dark') ? '☀ Clar' : '🌙 Fosc';
}

/* ── FONS MODE ── */
function onFonsModeChange() {
  const img = val('fons-mode') === 'imatge';
  el('fons-color-ui').style.display = img ? 'none' : '';
  el('fons-img-ui').style.display   = img ? '' : 'none';
  qR();
}

/* ── LOGO SIZE ── */
function onLogoSize(src) {
  const v = parseInt(src.value) || 100;
  el('logo-size-num').value    = v;
  el('logo-size-slider').value = v;
  qR();
}
function getLogoSize() { return Math.max(10, Math.min(400, parseInt(val('logo-size-num')) || 100)); }

/* ── IMAGES ── */
function loadImg(file, cb) {
  if (!file) return;
  const r = new FileReader();
  r.onload = e => { const i = new Image(); i.onload = () => cb(i, file.name); i.src = e.target.result; };
  r.readAsDataURL(file);
}
function loadLogo(inp) {
  loadImg(inp.files[0], (img, name) => {
    S.logo = img;
    el('logo-name').textContent = name;
    el('logo-opts').style.display = '';
    el('status-logo').textContent = 'Logo: ' + name;
    qR();
  });
}
function clearLogo() {
  S.logo = null; el('logo-file').value = '';
  el('logo-name').textContent = '(cap)';
  el('logo-opts').style.display = 'none';
  el('status-logo').textContent = 'Sense logo';
  qR();
}
function loadFons(inp) {
  loadImg(inp.files[0], (img, name) => { S.fons = img; el('fons-name').textContent = name; qR(); });
}
function clearFons() {
  S.fons = null; el('fons-file').value = '';
  el('fons-name').textContent = '(cap)'; qR();
}

/* ── TABS ── */
function setTab(t) {
  S.tab = t;
  ['a4','a5','both'].forEach(k => el('tab-' + k).classList.toggle('on', k === t));
  el('slot-a4').style.display = (t === 'a4' || t === 'both') ? '' : 'none';
  el('slot-a5').style.display = (t === 'a5' || t === 'both') ? '' : 'none';
  qR();
}

/* ── TOAST ── */
function toast(msg) {
  const e = el('toast'); e.textContent = msg; e.classList.add('show');
  clearTimeout(_tt); _tt = setTimeout(() => e.classList.remove('show'), 2800);
}

/* ── ABOUT ── */
function showAbout() {
  alert('GenArxiu v0.1\nGenerador de Portades per a Partitures\n\nDesenvolupador: MarcMànyez\nLlicència: GPLv3');
}

/* ── READ CONFIG ── */
function cfg() {
  return {
    num: val('f-num'), tit: val('f-tit').toUpperCase(), comp: val('f-comp'),
    fnNum:  val('fn-num'),  fnTit:  val('fn-tit'),  fnComp:  val('fn-comp'),
    fsNum:  Math.max(8, parseInt(val('fs-num'))  || 48),
    fsTit:  Math.max(8, parseInt(val('fs-tit'))  || 72),
    fsComp: Math.max(8, parseInt(val('fs-comp')) || 28),
    boldNum: isOn('bold-num'), italNum: isOn('ital-num'),
    boldTit: isOn('bold-tit'), italTit: isOn('ital-tit'),
    boldComp:isOn('bold-comp'),italComp:isOn('ital-comp'),
    cNum:  getCol('num'),  cTit:  getCol('tit'),  cComp: getCol('comp'),
    cMarc: getCol('marc'), cFons: getCol('fons'),
    sNum:  chk('sub-num'), sTit:  chk('sub-tit'), sComp: chk('sub-comp'),
    showMarc:    chk('show-marc'),
    fonsIsColor: val('fons-mode') === 'color',
    jhNum:  getJust('jh-num'),  jvNum:  getJust('jv-num'),
    jhTit:  getJust('jh-tit'),  jvTit:  getJust('jv-tit'),
    jhComp: getJust('jh-comp'), jvComp: getJust('jv-comp'),
    jhLogo: getJust('jh-logo'), jvLogo: getJust('jv-logo'),
    logoSize: getLogoSize(),
  };
}

/* ── WORD WRAP ── */
function wrap(ctx, text, maxW) {
  const words = text.split(' ').filter(Boolean);
  if (!words.length) return [];
  const lines = []; let line = words[0];
  for (let i = 1; i < words.length; i++) {
    const test = line + ' ' + words[i];
    if (ctx.measureText(test).width <= maxW) line = test;
    else { lines.push(line); line = words[i]; }
  }
  lines.push(line); return lines;
}

/* ── POSITION ── */
function xH(jh, left, cen, right) { return jh==='E'?left : jh==='C'?cen : right; }
function ytop(jv, blockH, PH, MG) {
  return jv==='D' ? MG : jv==='C' ? PH/2 - blockH/2 : PH - MG - blockH;
}

/* ── DRAW BLOCK ── */
function drawBlock(ctx, lines, sz, lineH, jh, x0, xc, x1, y0, color, underline, esc) {
  ctx.fillStyle = color;
  lines.forEach((line, i) => {
    const tw = ctx.measureText(line).width;
    const tx = xH(jh, x0, xc - tw/2, x1 - tw);
    const ty = y0 + sz + i * lineH;
    ctx.fillText(line, tx, ty);
    if (underline) {
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(tx, ty+4); ctx.lineTo(tx+tw, ty+4); ctx.stroke();
      ctx.restore();
    }
  });
}

/* ══ CORE DRAW ══ */
function drawCover(ctx, C, isA5, PW, PH) {
  // ESC escala les mides de font i marges proporcionalment a la pàgina real.
  // A5 horitzontal (419.53×595.28pt) té amplada = A4W/√2 → ESC = A5W/A4W ≈ 0.7071
  const ESC  = isA5 ? A5_ESC : 1.0;
  const MG   = 50 * ESC;   // marge proporcional a la pàgina
  const OUT  = 20 * ESC;   // marc exterior proporcional
  const maxW = PW - 2 * MG;

  /* FONS */
  if (C.fonsIsColor || !S.fons) {
    ctx.fillStyle = C.cFons; ctx.fillRect(0, 0, PW, PH);
  } else {
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, PW, PH);
    const sc = Math.max(PW / S.fons.width, PH / S.fons.height);
    ctx.drawImage(S.fons,
      (PW - S.fons.width  * sc) / 2,
      (PH - S.fons.height * sc) / 2,
      S.fons.width * sc, S.fons.height * sc);
  }

  /* MARC */
  if (C.showMarc) {
    ctx.strokeStyle = C.cMarc;
    ctx.lineWidth   = 2 * ESC;
    ctx.strokeRect(OUT, OUT, PW - 2*OUT, PH - 2*OUT);
  }

  /* NÚMERO — sempre una línia, redueix mida si no cap */
  if (C.num) {
    let fsz = C.fsNum * ESC;
    ctx.font = fstr(fsz, C.boldNum, C.italNum, C.fnNum);
    while (fsz > 10 && ctx.measureText(C.num).width > maxW) {
      fsz -= 2; ctx.font = fstr(fsz, C.boldNum, C.italNum, C.fnNum);
    }
    const tw = ctx.measureText(C.num).width;
    const nx = xH(C.jhNum, MG, PW/2 - tw/2, PW - MG - tw);
    const yt = isA5 ? ytop_a5_num(C.jvNum, fsz, PH, MG) : ytop(C.jvNum, fsz, PH, MG);
    const ny = yt + fsz;
    ctx.fillStyle = C.cNum;
    ctx.fillText(C.num, nx, ny);
    if (C.sNum) {
      ctx.save(); ctx.strokeStyle = C.cNum; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(nx, ny+4); ctx.lineTo(nx+tw, ny+4); ctx.stroke();
      ctx.restore();
    }
  }

  /* LOGOTIP */
  if (S.logo) {
    const pct   = C.logoSize / 100;
    const baseW = C.fsNum * ESC * 2 * pct;
    const baseH = C.fsNum * ESC * 1.5 * pct;
    const sc    = Math.min(baseW / S.logo.width, baseH / S.logo.height);
    const lw    = S.logo.width * sc, lh = S.logo.height * sc;
    const lx    = xH(C.jhLogo, MG, PW/2 - lw/2, PW - MG - lw);
    const ly    = C.jvLogo === 'D' ? MG
                : C.jvLogo === 'C' ? PH/2 - lh/2
                : PH - MG - lh;
    ctx.drawImage(S.logo, lx, ly, lw, lh);
  }

  /* TÍTOL — wrap multilínia, justificació lliure per A5 */
  if (C.tit) {
    const sz    = C.fsTit * ESC;
    const lineH = sz * 1.25;
    ctx.font    = fstr(sz, C.boldTit, C.italTit, C.fnTit);
    const lines = wrap(ctx, C.tit, maxW);
    const bh    = sz + (lines.length - 1) * lineH;
    const yt    = ytop(C.jvTit, bh, PH, MG);
    drawBlock(ctx, lines, sz, lineH, C.jhTit, MG, PW/2, PW-MG, yt, C.cTit, C.sTit, ESC);
  }

  /* COMPOSITOR — wrap multilínia */
  if (C.comp) {
    const sz    = C.fsComp * ESC;
    const lineH = sz * 1.25;
    ctx.font    = fstr(sz, C.boldComp, C.italComp, C.fnComp);
    const lines = wrap(ctx, C.comp, maxW);
    const bh    = sz + (lines.length - 1) * lineH;
    const yt    = ytop(C.jvComp, bh, PH, MG);
    drawBlock(ctx, lines, sz, lineH, C.jhComp, MG, PW/2, PW-MG, yt, C.cComp, C.sComp, ESC);
  }
}

/* ── RENDER ── */
function qR() { clearTimeout(_rt); _rt = setTimeout(doRender, 60); }

function doRender() {
  const C    = cfg();
  const area = el('preview-area');
  const aW   = area.clientWidth - 40, aH = area.clientHeight - 40;
  const both = S.tab === 'both';

  function one(cvId, isA5) {
    const cv = el(cvId);
    const PW = isA5 ? A5W : A4W, PH = isA5 ? A5H : A4H;
    cv.width  = Math.round(PW * CS);
    cv.height = Math.round(PH * CS);
    const ctx = cv.getContext('2d');
    ctx.save(); ctx.scale(CS, CS);
    drawCover(ctx, C, isA5, PW, PH);
    ctx.restore();
    const slotW = both ? aW/2 - 10 : aW;
    const sc = Math.min(slotW/PW, aH/PH, 1);
    cv.style.width  = (PW*sc) + 'px';
    cv.style.height = (PH*sc) + 'px';
  }
  if (S.tab==='a4' || both) one('cv-a4', false);
  if (S.tab==='a5' || both) one('cv-a5', true);

  const parts = [];
  if (C.num)  parts.push('Nº: ' + C.num);
  if (C.tit)  parts.push(C.tit.slice(0,30) + (C.tit.length>30?'…':''));
  if (C.comp) parts.push(C.comp);
  const st = el('status-content');
  if (st) st.textContent = parts.join(' · ') || 'Cap contingut';
}

/* ── PDF ── */
function generatePDF(fmt) {
  const { jsPDF } = window.jspdf;
  const C = cfg(), isA5 = fmt==='a5';
  const PW = isA5?A5W:A4W, PH = isA5?A5H:A4H;
  const off = document.createElement('canvas');
  off.width = Math.round(PW*3); off.height = Math.round(PH*3);
  const ctx = off.getContext('2d'); ctx.save(); ctx.scale(3,3);
  drawCover(ctx, C, isA5, PW, PH); ctx.restore();
  const doc = new jsPDF({ orientation: isA5?'l':'p', unit:'pt', format:[PW,PH] });
  doc.addImage(off.toDataURL('image/png',1), 'PNG', 0, 0, PW, PH);
  doc.save('portada_'+fmt.toUpperCase()+'_'+new Date().toISOString().slice(0,10)+'.pdf');
  toast('PDF '+fmt.toUpperCase()+' generat correctament.');
}

/* ── EXPORT CONFIG ── */
function exportConfig() {
  const C = cfg();
  const jv = {};
  ['jh-num','jv-num','jh-tit','jv-tit','jh-comp','jv-comp','jh-logo','jv-logo'].forEach(id => {
    const g = el(id); if (g) jv[id] = g.dataset.v;
  });
  const out = {
    font_numero:C.fnNum, font_titol:C.fnTit, font_compositor:C.fnComp,
    mida_numero:C.fsNum, mida_titol:C.fsTit, mida_compositor:C.fsComp,
    bold_num:C.boldNum, ital_num:C.italNum,
    bold_tit:C.boldTit, ital_tit:C.italTit,
    bold_comp:C.boldComp, ital_comp:C.italComp,
    color_numero:C.cNum, color_titol:C.cTit, color_compositor:C.cComp,
    color_quadre:C.cMarc, fons_color:C.cFons,
    sub_num:C.sNum, sub_titol:C.sTit, sub_comp:C.sComp,
    just_num:C.jhNum, justv_num:C.jvNum, just_titol:C.jhTit, justv_titol:C.jvTit,
    just_comp:C.jhComp, justv_comp:C.jvComp, just_img:C.jhLogo, justv_img:C.jvLogo,
    logo_size:C.logoSize, mostrar_quadre:C.showMarc,
    fons_mode:C.fonsIsColor?'Color sòlid':'Imatge',
    dark_mode: document.body.classList.contains('dark'),
    _jv:jv, _version:'web-v0.1', _app:'GenArxiu',
  };
  const blob = new Blob([JSON.stringify(out,null,2)],{type:'application/json'});
  const url  = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'),{href:url,download:'genarxiu_config.json'}).click();
  URL.revokeObjectURL(url);
  toast('Configuració exportada.');
}

/* ── IMPORT CONFIG ── */
function importConfig() {
  const inp = document.createElement('input'); inp.type='file'; inp.accept='.json';
  inp.onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => { try { applyConfig(JSON.parse(ev.target.result)); toast('Configuració carregada.'); }
                       catch { toast("Error llegint el JSON."); } };
    r.readAsText(f);
  };
  inp.click();
}

function applyConfig(c) {
  function sv(id,v)  { const e=el(id); if(e&&v!=null) e.value=v; }
  function sc(id,v)  { const e=el(id); if(e) e.checked=!!v; }
  function sCol(id,h){ if(!h||!/^#[0-9a-fA-F]{6}$/i.test(h))return;
    const t=el('ct-'+id),p=el('cp-'+id),sw=el('sw-'+id);
    if(t)t.value=h; if(p)p.value=h; if(sw)sw.style.background=h; }
  function sJG(gid,v){ if(!v)return; const g=el(gid); if(!g)return;
    g.dataset.v=v; g.querySelectorAll('.just-btn').forEach(b=>b.classList.toggle('on',b.dataset.k===v)); }
  function sTog(id,v){ const e=el(id); if(e) e.classList.toggle('on',!!v); }

  sv('fn-num', c.font_numero||'Arial,sans-serif');
  sv('fn-tit', c.font_titol||'Arial,sans-serif');
  sv('fn-comp',c.font_compositor||'Arial,sans-serif');
  sv('fs-num', c.mida_numero||48);
  sv('fs-tit', c.mida_titol||72);
  sv('fs-comp',c.mida_compositor||28);
  sTog('bold-num',c.bold_num);  sTog('ital-num',c.ital_num);
  sTog('bold-tit',c.bold_tit);  sTog('ital-tit',c.ital_tit);
  sTog('bold-comp',c.bold_comp);sTog('ital-comp',c.ital_comp);
  sCol('num',c.color_numero||'#000000'); sCol('tit',c.color_titol||'#000000');
  sCol('comp',c.color_compositor||'#000000'); sCol('marc',c.color_quadre||'#000000');
  sCol('fons',c.fons_color||'#ffffff');
  sc('sub-num',c.sub_num); sc('sub-tit',c.sub_titol); sc('sub-comp',c.sub_comp);
  sc('show-marc',c.mostrar_quadre??true);
  sv('fons-mode',c.fons_mode==='Imatge'?'imatge':'color'); onFonsModeChange();
  const ls = c.logo_size||100; sv('logo-size-num',ls); sv('logo-size-slider',ls);
  if (c.dark_mode) document.body.classList.add('dark');
  const jv = c._jv||{};
  sJG('jh-num',jv['jh-num']||c.just_num||'E');  sJG('jv-num',jv['jv-num']||c.justv_num||'D');
  sJG('jh-tit',jv['jh-tit']||c.just_titol||'C'); sJG('jv-tit',jv['jv-tit']||c.justv_titol||'C');
  sJG('jh-comp',jv['jh-comp']||c.just_comp||'E'); sJG('jv-comp',jv['jv-comp']||c.justv_comp||'B');
  sJG('jh-logo',jv['jh-logo']||c.just_img||'D');  sJG('jv-logo',jv['jv-logo']||c.justv_img||'D');
  qR();
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  new ResizeObserver(() => qR()).observe(el('preview-area'));
  qR();
});
