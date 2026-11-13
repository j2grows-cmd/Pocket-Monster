'use strict';
/* Procedural pixel art: every monster, character and map tile is painted in code. */

function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function shade(h, f) { // f<0 darken, f>0 lighten
  const [r, g, b] = hexRgb(h), t = f < 0 ? 0 : 255, a = Math.abs(f);
  const c = v => Math.round(v + (t - v) * a).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

/* ---- vector helpers (unit space, y up is negative) ---- */
function el(g, x, y, rx, ry, col, rot) { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); g.fill(); }
function poly(g, p, col) { g.fillStyle = col; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); }
function rr(g, x, y, w, h, col) { g.fillStyle = col; g.fillRect(x, y, w, h); el(g, x + w / 2, y + h, w / 2 + 0.02, 0.07, col); }
function line(g, p, w, col) { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.stroke(); }
function curve(g, p, w, col) {
  g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(p[0], p[1]);
  for (let i = 2; i < p.length - 2; i += 2) g.quadraticCurveTo(p[i], p[i + 1], (p[i] + p[i + 2]) / 2, (p[i + 1] + p[i + 3]) / 2);
  g.lineTo(p[p.length - 2], p[p.length - 1]); g.stroke();
}
function flame(g, x, y, s) {
  poly(g, [x - .16 * s, y, x - .2 * s, y - .25 * s, x - .05 * s, y - .2 * s, x, y - .55 * s, x + .1 * s, y - .25 * s, x + .2 * s, y - .32 * s, x + .16 * s, y], '#f08a2c');
  poly(g, [x - .08 * s, y, x - .08 * s, y - .14 * s, x, y - .32 * s, x + .08 * s, y - .12 * s, x + .08 * s, y], '#fbe36a');
}
const BONE = '#f4ecd8', LEAF = '#3f9a3f', INK = '#231d2e';

const BODIES = {
  quad: {
    head: [-.5, -.98, .38], eyes: [[-.66, -1.0], [-.38, -1.0]], top: [-.5, -1.34], back: [[-.1, -1.04], [.66, -.86]], tail: [.72, -.68], wing: [.15, -.95], mouth: [-.66, -.78],
    draw(g, o) {
      rr(g, -.12, -.45, .17, .43, o.cd); rr(g, .5, -.45, .17, .43, o.cd);
      el(g, .15, -.62, .62, .4, o.c);
      if (o.f.bl) el(g, .1, -.46, .42, .2, o.c2);
      rr(g, -.36, -.45, .18, .43, o.c); rr(g, .3, -.45, .18, .43, o.c);
      el(g, -.5, -.98, .38, .36, o.c);
      el(g, -.76, -.84, .14, .11, o.cl);
    },
  },
  biped: {
    head: [-.04, -1.3, .4], eyes: [[-.22, -1.32], [.1, -1.32]], top: [-.04, -1.68], back: [[.26, -1.0], [.42, -.35]], tail: [.38, -.3], wing: [.2, -.95], mouth: [-.1, -1.1],
    draw(g, o) {
      el(g, .44, -.62, .13, .24, o.cd, -.3);
      el(g, 0, -.55, .42, .5, o.c);
      if (o.f.bl) el(g, -.06, -.48, .26, .33, o.c2);
      el(g, -.2, -.07, .22, .1, o.c); el(g, .2, -.07, .22, .1, o.c);
      el(g, -.42, -.62, .13, .24, o.c, .3);
      el(g, -.04, -1.3, .4, .38, o.c);
    },
  },
  bird: {
    head: [-.3, -1.1, .3], eyes: [[-.4, -1.13]], er: .1, top: [-.26, -1.4], back: [[0, -1.0], [.45, -.75]], tail: [.52, -.55], wing: [.1, -.8], mouth: [-.6, -1.0],
    draw(g, o) {
      poly(g, [.38, -.72, .98, -.78, .9, -.5, .38, -.4], o.cd);
      line(g, [-.05, -.22, -.05, -.02, -.16, -.02], .07, '#e8a03a'); line(g, [.22, -.22, .22, -.02, .11, -.02], .07, '#e8a03a');
      el(g, .05, -.6, .48, .42, o.c);
      if (o.f.bl) el(g, -.1, -.5, .28, .28, o.c2);
      el(g, .2, -.62, .33, .2, o.f.bl ? o.cd : o.c2, .35);
      el(g, -.3, -1.1, .3, .29, o.c);
      poly(g, [-.56, -1.16, -.86, -1.04, -.56, -.96], '#f2b03a');
    },
  },
  serpent: {
    head: [-.3, -1.32, .27], eyes: [[-.43, -1.35], [-.2, -1.35]], top: [-.3, -1.58], back: [[-.2, -.95], [.25, -.4]], tail: [.92, -.3], wing: [-.1, -.9], mouth: [-.42, -1.2],
    draw(g, o) {
      curve(g, [.95, -.32, .6, -.14, .1, -.22, -.35, -.16, -.58, -.42, -.3, -.72, -.02, -.95, -.26, -1.28], .34, o.c);
      curve(g, [.55, -.08, .1, -.14, -.3, -.1], .1, o.c2);
      el(g, -.3, -1.32, .27, .25, o.c);
    },
  },
  fish: {
    head: [-.28, -.85, .36], eyes: [[-.36, -.9]], er: .1, top: [-.05, -1.22], back: [[-.1, -1.18], [.4, -1.05]], tail: [.62, -.82], wing: [0, -1.1], mouth: [-.58, -.76], float: 1,
    draw(g, o) {
      poly(g, [.5, -.82, 1.0, -1.2, .88, -.82, 1.0, -.45], o.c2);
      poly(g, [-.15, -1.15, .2, -1.5, .38, -1.08], o.c2);
      el(g, 0, -.82, .62, .4, o.c);
      if (o.f.bl) el(g, -.04, -.62, .44, .16, o.c2);
      poly(g, [0, -.72, .28, -.48, .3, -.76], o.cd);
    },
  },
  blob: {
    head: [0, -.6, .5], eyes: [[-.22, -.62], [.14, -.62]], top: [-.02, -1.14], back: [[.15, -1.1], [.64, -.5]], tail: [.62, -.2], wing: [.2, -.9], mouth: [-.04, -.42],
    draw(g, o) {
      g.fillStyle = o.c; g.beginPath(); g.moveTo(-.72, -.02); g.bezierCurveTo(-.82, -1.0, -.4, -1.18, 0, -1.18);
      g.bezierCurveTo(.4, -1.18, .82, -1.0, .72, -.02); g.quadraticCurveTo(0, .06, -.72, -.02); g.fill();
      el(g, -.32, -.92, .14, .08, o.cl, -.5);
    },
  },
  bug: {
    head: [-.52, -.45, .28], eyes: [[-.64, -.5], [-.43, -.5]], er: .08, top: [-.52, -.74], back: [[-.1, -.72], [.6, -.68]], tail: [.74, -.42], wing: [.05, -.68], mouth: [-.7, -.36],
    draw(g, o) {
      for (const x of [-.2, .02, .26, .5]) line(g, [x, -.25, x - .07, -.01], .07, o.cd);
      el(g, .42, -.4, .34, .31, o.c); el(g, .42, -.4, .09, .3, o.c2);
      el(g, -.03, -.42, .3, .29, shade(o.c, -.15));
      el(g, -.52, -.45, .28, .27, o.c);
    },
  },
  ghost: {
    head: [0, -1.1, .5], eyes: [[-.2, -1.14], [.14, -1.14]], top: [0, -1.6], back: [[.3, -1.5], [.52, -.9]], tail: [.42, -.5], wing: [.3, -1.2], mouth: [-.03, -.92], float: 1,
    draw(g, o) {
      g.fillStyle = o.c; g.beginPath(); g.moveTo(-.5, -1.1); g.arc(0, -1.1, .5, Math.PI, 0); g.lineTo(.5, -.55);
      g.quadraticCurveTo(.4, -.2, .25, -.48); g.quadraticCurveTo(.1, -.1, -.05, -.45); g.quadraticCurveTo(-.2, -.15, -.3, -.5);
      g.quadraticCurveTo(-.42, -.3, -.5, -.55); g.closePath(); g.fill();
      el(g, -.6, -.85, .14, .1, o.c, .4); el(g, .6, -.85, .14, .1, o.c, -.4);
      el(g, -.02, -.72, .2, .08, o.c2);
    },
  },
  plant: {
    head: [0, -.95, .36], eyes: [[-.14, -.97], [.12, -.97]], top: [0, -1.4], back: [[.25, -.65], [.38, -.2]], tail: [.3, -.3], wing: [.3, -.6], mouth: [-.01, -.8],
    draw(g, o) {
      el(g, -.15, -.04, .15, .07, shade(o.c2, -.3)); el(g, .15, -.04, .15, .07, shade(o.c2, -.3));
      el(g, 0, -.35, .3, .36, o.c2);
      el(g, -.42, -.45, .22, .1, o.c2, .5); el(g, .42, -.45, .22, .1, o.c2, -.5);
      for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 - 1.57; el(g, Math.cos(a) * .36, -.95 + Math.sin(a) * .36, .2, .2, i % 2 ? o.c : o.cd); }
      el(g, 0, -.95, .3, .3, o.cl);
    },
  },
  shroom: {
    head: [0, -.42, .34], eyes: [[-.14, -.42], [.12, -.42]], top: [0, -1.32], back: [[.3, -1.25], [.7, -.85]], tail: [.3, -.2], wing: [.3, -.6], mouth: [-.01, -.26],
    draw(g, o) {
      el(g, 0, -.36, .34, .38, o.c2);
      g.fillStyle = o.c; g.beginPath(); g.ellipse(0, -.72, .78, .62, 0, Math.PI, 0); g.closePath(); g.fill();
      el(g, 0, -.72, .78, .1, o.cd);
      if (o.f.sd) { el(g, -.36, -1.0, .13, .1, o.cl); el(g, .22, -1.08, .15, .11, o.cl); el(g, .52, -.86, .08, .07, o.cl); el(g, -.02, -.88, .07, .06, o.cl); }
    },
  },
  golem: {
    head: [-.1, -.98, .42], eyes: [[-.3, -1.02], [.06, -1.02]], top: [-.05, -1.42], back: [[.2, -1.42], [.7, -.82]], tail: [.6, -.4], wing: [.4, -1.1], mouth: [-.12, -.8],
    draw(g, o) {
      rr(g, -.44, -.28, .3, .26, o.cd); rr(g, .12, -.28, .32, .26, o.cd);
      el(g, .86, -.62, .24, .26, o.cd);
      poly(g, [-.55, -.2, -.72, -.8, -.42, -1.36, .3, -1.42, .72, -.9, .6, -.2], o.c);
      poly(g, [-.42, -1.36, .3, -1.42, .12, -1.2, -.36, -1.16], o.cl);
      poly(g, [.3, -.2, .44, -.62, .6, -.2], o.cd);
      el(g, -.86, -.58, .25, .27, o.c);
    },
  },
  crab: {
    head: [0, -.45, .4], eyes: [[-.2, -.98], [.2, -.98]], er: .1, top: [0, -.78], back: [[-.38, -.76], [.38, -.76]], tail: [.45, -.6], wing: [0, -.7], mouth: [0, -.3],
    draw(g, o) {
      for (const sx of [-1, 1]) {
        for (let i = 0; i < 3; i++) line(g, [sx * (.3 + .12 * i), -.35, sx * (.58 + .14 * i), -.32 - .05 * i, sx * (.68 + .14 * i), -.01], .07, o.cd);
        line(g, [sx * .2, -.7, sx * .2, -.95], .07, o.c);
        line(g, [sx * .5, -.5, sx * .82, -.62], .13, o.c);
      }
      el(g, 0, -.45, .62, .33, o.c); el(g, 0, -.36, .44, .16, o.c2);
      for (const sx of [-1, 1]) { el(g, sx * .9, -.74, .26, .22, o.c); poly(g, [sx * .9, -.74, sx * 1.18, -.9, sx * 1.14, -.66], o.cd); }
    },
  },
  jelly: {
    head: [0, -1.05, .5], eyes: [[-.2, -1.0], [.14, -1.0]], top: [0, -1.48], back: [[.3, -1.4], [.5, -1.0]], tail: [.3, -.5], wing: [.3, -1.2], mouth: [-.03, -.85], float: 1,
    draw(g, o) {
      for (const x of [-.36, -.12, .12, .36]) curve(g, [x, -.85, x + .09, -.6, x - .09, -.36, x + .05, -.1], .09, o.cd);
      g.fillStyle = o.c; g.beginPath(); g.ellipse(0, -.85, .58, .64, 0, Math.PI, 0); g.closePath(); g.fill();
      el(g, 0, -.85, .58, .1, o.cd); el(g, 0, -1.18, .3, .16, o.c2);
    },
  },
  wing: {
    head: [0, -1.25, .22], eyes: [[-.09, -1.27], [.09, -1.27]], er: .065, top: [0, -1.46], back: [[0, -1], [0, -.6]], tail: [0, -.52], wing: [0, -1], mouth: [0, -1.12], float: 1,
    draw(g, o) {
      for (const sx of [-1, 1]) {
        if (o.f.wd) {
          poly(g, [sx * .1, -1.0, sx * .55, -1.52, sx * 1.08, -1.25, sx * .92, -.95, sx * 1.0, -.68, sx * .62, -.74, sx * .45, -.5, sx * .12, -.7], o.c);
          poly(g, [sx * .16, -.98, sx * .55, -1.36, sx * .9, -1.2, sx * .78, -.95, sx * .5, -.82, sx * .2, -.8], o.c2);
        } else {
          el(g, sx * .58, -1.15, .5, .34, o.c, sx * -.35); el(g, sx * .46, -.68, .36, .26, o.cd, sx * .45);
          el(g, sx * .64, -1.15, .2, .14, o.c2); el(g, sx * .48, -.68, .12, .1, o.c2);
        }
      }
      el(g, 0, -.85, .17, .38, o.cd); el(g, 0, -1.25, .22, .21, o.f.wd ? o.c : o.cd);
    },
  },
  orb: {
    head: [0, -.95, .52], eyes: [[-.2, -.98], [.14, -.98]], top: [0, -1.48], back: [[.22, -1.44], [.52, -.92]], tail: [.45, -.6], wing: [.35, -1.1], mouth: [-.03, -.75], float: 1,
    draw(g, o) {
      el(g, -.62, -.8, .14, .12, o.cd); el(g, .62, -.8, .14, .12, o.cd);
      el(g, 0, -.95, .52, .52, o.c); el(g, 0, -.56, .34, .07, o.c2); el(g, -.22, -1.24, .16, .09, o.cl, -.5);
    },
  },
  puff: {
    head: [0, -.9, .45], eyes: [[-.17, -.9], [.13, -.9]], top: [0, -1.45], back: [[.3, -1.38], [.62, -.9]], tail: [.5, -.6], wing: [.3, -1.1], mouth: [-.02, -.72], float: 1,
    draw(g, o) {
      el(g, 0, -.62, .52, .16, o.c2);
      el(g, -.44, -.8, .32, .32, o.c); el(g, .44, -.8, .32, .32, o.c); el(g, -.22, -1.17, .3, .3, o.c); el(g, .24, -1.17, .3, .3, o.c); el(g, 0, -.9, .45, .45, o.c);
    },
  },
};

function paintMonster(art, size) {
  const S = size || 64, cv = makeCanvas(S, S), g = cv.getContext('2d');
  const B = BODIES[art.b], f = {};
  art.f.forEach(k => f[k] = 1);
  const o = { c: art.c, c2: art.c2, cd: shade(art.c, -.3), cl: shade(art.c, .5), f };
  const k = (S < 64 ? 25.5 : 24) * art.s * S / 64;
  g.save(); g.translate(S / 2, S * 60 / 64); g.scale(k, k);
  const [hx, hy, hr] = B.head, [tx, ty] = B.tail, [wx, wy] = B.wing, [px, py] = B.top, [mx, my] = B.mouth;
  // ---- behind the body ----
  if (f.halo) { g.strokeStyle = shade(o.c2, .3); g.lineWidth = .08; g.beginPath(); g.arc(hx, hy - .05, hr + .34, 0, 7); g.stroke(); }
  if (f.cl) { el(g, -.5, -.1, .3, .2, '#eef2f8'); el(g, 0, -.06, .34, .2, '#eef2f8'); el(g, .5, -.1, .3, .2, '#eef2f8'); }
  if (f.wd && art.b !== 'wing') {
    poly(g, [wx, wy + .2, wx + .15, wy - .8, wx + .8, wy - .55, wx + .58, wy - .28, wx + .78, wy, wx + .35, wy + .05], o.c2);
    line(g, [wx, wy + .2, wx + .15, wy - .8], .07, o.cd);
  }
  if (f.wb) { el(g, wx + .3, wy - .3, .5, .2, o.c2, -.6); el(g, wx + .35, wy - .12, .42, .16, shade(o.c2, -.2), -.4); }
  if (f.wi) { el(g, wx + .12, wy - .34, .17, .42, '#e8f6fc', .5); el(g, wx + .32, wy - .22, .15, .36, '#cfeaf6', .95); }
  if (f.tn || f.tf || f.tl) curve(g, [tx - .1, ty, tx + .22, ty - .05, tx + .36, ty - .3, tx + .32, ty - .52], .11, o.c);
  if (f.tf) flame(g, tx + .32, ty - .45, .9);
  if (f.tl) el(g, tx + .36, ty - .62, .2, .11, LEAF, -.9);
  if (f.tb) line(g, [tx - .1, ty, tx + .25, ty - .18, tx + .08, ty - .36, tx + .42, ty - .62], .11, o.c2);
  if (f.tfin) poly(g, [tx - .1, ty, tx + .42, ty - .32, tx + .3, ty, tx + .42, ty + .26], o.c2);
  if (f.ts) { curve(g, [tx - .1, ty, tx + .4, ty - .25, tx + .3, ty - .8, tx - .1, ty - .9], .12, o.c); poly(g, [tx - .1, ty - 1.0, tx - .36, ty - .82, tx - .08, ty - .78], o.c2 === '#3a3a3a' ? '#3a3a3a' : shade(o.c, -.4)); }
  if (f.mn) { el(g, hx + .3, hy - .12, .19, .19, o.c2); el(g, hx + .36, hy + .14, .19, .19, o.c2); el(g, hx + .2, hy - .32, .17, .17, o.c2); }
  // ---- body ----
  B.draw(g, o);
  // ---- on top ----
  g.globalCompositeOperation = 'source-atop';
  if (f.st) { for (let i = 0; i < 3; i++) { const t = i / 2, bx = lerp(B.back[0][0], B.back[1][0], t), by = lerp(B.back[0][1], B.back[1][1], t); line(g, [bx, by - .05, bx + .06, by + .3], .07, o.cd); } }
  if (f.sd && art.b !== 'shroom') { el(g, hx + .5, hy + .25, .1, .08, o.cd); el(g, hx + .78, hy + .42, .08, .07, o.cd); el(g, hx + .95, hy + .2, .09, .07, o.cd); el(g, hx + .3, hy + .55, .07, .06, o.cd); }
  if (f.sh) { line(g, [-.2, -.95, .0, -.3], .05, shade(o.c, .35)); line(g, [.2, -1.0, .35, -.3], .05, shade(o.c, .35)); line(g, [.55, -.92, .62, -.4], .05, shade(o.c, .35)); }
  g.globalCompositeOperation = 'source-over';
  if (f.sp) { const sc = art.b === 'biped' || art.b === 'blob' ? shade(o.c, -.4) : (f.bl ? shade(o.c, -.4) : o.c2); for (let i = 0; i < 4; i++) { const t = i / 3, bx = lerp(B.back[0][0], B.back[1][0], t), by = lerp(B.back[0][1], B.back[1][1], t); poly(g, [bx - .1, by + .06, bx + .08, by - .26, bx + .14, by + .08], sc); } }
  if (f.cr || f.ic) { const cc = f.ic ? '#e2f7ff' : shade(o.c2, .2), b = B.back; const mxp = (b[0][0] + b[1][0]) / 2, myp = (b[0][1] + b[1][1]) / 2;
    poly(g, [mxp - .2, myp + .08, mxp - .12, myp - .34, mxp + .02, myp + .05], cc); poly(g, [mxp, myp + .08, mxp + .14, myp - .46, mxp + .26, myp + .1], shade(cc, -.12)); poly(g, [mxp + .22, myp + .12, mxp + .4, myp - .2, mxp + .46, myp + .16], cc); }
  if (f.er) { el(g, hx - .25, hy - .3, .14, .14, o.c); el(g, hx + .22, hy - .32, .14, .14, o.c); el(g, hx - .25, hy - .29, .07, .07, o.cl); el(g, hx + .22, hy - .31, .07, .07, o.cl); }
  if (f.ep) { poly(g, [hx - .34, hy - .16, hx - .32, hy - .64, hx - .06, hy - .3], o.c); poly(g, [hx + .04, hy - .3, hx + .3, hy - .64, hx + .34, hy - .16], o.c); poly(g, [hx - .28, hy - .3, hx - .28, hy - .52, hx - .14, hy - .32], o.cl); }
  if (f.el) { el(g, hx - .2, hy - .55, .09, .32, o.c, -.2); el(g, hx + .2, hy - .55, .09, .32, o.c, .3); el(g, hx - .2, hy - .55, .04, .2, o.cl, -.2); }
  if (f.h1) poly(g, [hx - .26, hy - .26, hx - .36, hy - .8, hx - .04, hy - .34], BONE);
  if (f.h2) { poly(g, [hx - .3, hy - .2, hx - .46, hy - .72, hx - .1, hy - .32], BONE); poly(g, [hx + .08, hy - .32, hx + .42, hy - .72, hx + .3, hy - .2], BONE); }
  if (f.hr) { g.strokeStyle = BONE; g.lineWidth = .13; g.lineCap = 'round'; g.beginPath(); g.arc(hx - .3, hy - .14, .2, -2.6, 1.9); g.stroke(); g.beginPath(); g.arc(hx + .3, hy - .14, .2, -2.2, 2.3); g.stroke(); }
  if (f.lf) { line(g, [px, py + .1, px + .02, py - .12], .06, LEAF); el(g, px + .16, py - .2, .22, .1, LEAF, -.6); el(g, px - .12, py - .18, .18, .09, shade(LEAF, .2), .6); }
  if (f.fl) flame(g, px, py + .08, 1);
  if (f.fc) { el(g, px + .1, py - .08, .08, .26, o.c2, .5); el(g, px + .24, py + .02, .08, .24, shade(o.c2, -.15), .9); el(g, px - .02, py - .1, .07, .22, shade(o.c2, .2), .15); }
  if (f.an) { curve(g, [hx - .1, hy - hr + .05, hx - .2, hy - hr - .25, hx - .34, hy - hr - .3], .05, INK); curve(g, [hx + .08, hy - hr + .05, hx + .16, hy - hr - .28, hx + .02, hy - hr - .38], .05, INK); el(g, hx - .34, hy - hr - .3, .07, .07, o.c2); el(g, hx + .02, hy - hr - .38, .07, .07, o.c2); }
  if (f.tu) { poly(g, [mx - .06, my - .02, mx - .2, my + .3, mx + .06, my + .04], BONE); poly(g, [mx + .2, my - .02, mx + .12, my + .28, mx + .32, my + .04], BONE); }
  if (f.fng) { poly(g, [mx - .04, my, mx + .02, my + .16, mx + .08, my], '#ffffff'); poly(g, [mx + .14, my, mx + .2, my + .16, mx + .26, my], '#ffffff'); }
  if (f.mk) { el(g, hx - .03, hy - .02, hr * .8, hr * .62, '#fbf7ee'); el(g, hx - .03, hy + hr * .5, hr * .3, hr * .12, o.c2); }
  // ---- eyes ----
  const er = B.er || hr * .26, es = art.eye;
  const eyes = f.eye1 ? [[hx - .03, hy]] : B.eyes;
  for (const [ex, ey] of eyes) {
    const r = f.eye1 ? er * 2.2 : es === 'b' ? er * 1.25 : er;
    if (es === 's') { line(g, [ex - r, ey, ex, ey + r * .6, ex + r, ey], .05, INK); continue; }
    el(g, ex, ey, r, r * 1.08, f.mk ? o.c2 : '#ffffff');
    el(g, ex - r * .22, ey + r * .05, r * (es === 'b' ? .66 : .56), r * (es === 'b' ? .72 : .6), INK);
    if (es === 'b' || f.eye1) el(g, ex - r * .4, ey - r * .3, r * .26, r * .26, '#ffffff');
    if (es === 'a') poly(g, [ex - r * 1.4, ey - r * .3, ex + r * 1.3, ey - r * 1.5, ex + r * 1.3, ey - r * .9, ex - r * 1.4, ey + r * .15], o.cd);
  }
  g.restore();
  return pixelize(cv, { depth: S >= 64 ? 3 : 1 });
}

/* Snap soft vector edges to hard pixels, then finish the sprite the way a pixel artist would:
   a lit rim top-left and a shaded rim bottom-right (o.depth pixels wide), and an outline that
   takes its colour from the sprite itself instead of a flat black line. */
function pixelize(cv, o) {
  o = o || {};
  const g = cv.getContext('2d'), w = cv.width, h = cv.height, depth = o.depth || 0;
  const im = g.getImageData(0, 0, w, h), d = im.data, solid = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) { if (d[i * 4 + 3] >= 110) { solid[i] = 1; d[i * 4 + 3] = 255; } else d[i * 4 + 3] = 0; }
  const at = (x, y) => x >= 0 && y >= 0 && x < w && y < h && solid[y * w + x];
  if (depth) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (!solid[i]) continue;
    const lit = !at(x - depth, y - depth), dark = !at(x + depth, y + depth) || !at(x, y + depth);
    if (dark && !lit) { d[i * 4] = d[i * 4] * 0.74 + 5; d[i * 4 + 1] = d[i * 4 + 1] * 0.70 + 4; d[i * 4 + 2] = d[i * 4 + 2] * 0.80 + 12; }
    else if (lit && !dark) { d[i * 4] += (255 - d[i * 4]) * 0.22; d[i * 4 + 1] += (255 - d[i * 4 + 1]) * 0.22; d[i * 4 + 2] += (255 - d[i * 4 + 2]) * 0.16; }
  }
  if (o.outline !== false) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (solid[i]) continue;
    const n = (y < h - 1 && solid[i + w]) ? i + w : (x > 0 && solid[i - 1]) ? i - 1 : (x < w - 1 && solid[i + 1]) ? i + 1 : (y > 0 && solid[i - w]) ? i - w : -1;
    if (n < 0) continue;
    d[i * 4] = d[n * 4] * 0.26 + 23 * 0.74; d[i * 4 + 1] = d[n * 4 + 1] * 0.24 + 22 * 0.76; d[i * 4 + 2] = d[n * 4 + 2] * 0.28 + 41 * 0.72; d[i * 4 + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  return cv;
}
function tinted(src, col) {
  const c = makeCanvas(src.width, src.height), g = c.getContext('2d');
  g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
  return c;
}

const Sprites = {
  _mon: {}, _flip: {}, _sil: {}, _white: {}, _icon: {}, _char: {}, _tile: new Map(), _edge: new Map(), _prop: {}, _misc: {},
  mon(id) { return this._mon[id] || (this._mon[id] = paintMonster(DEX[id].art)); },
  icon(id) { return this._icon[id] || (this._icon[id] = paintMonster(DEX[id].art, 32)); },
  monFlip(id) {
    if (!this._flip[id]) { const s = this.mon(id), c = makeCanvas(64, 64), g = c.getContext('2d'); g.translate(64, 0); g.scale(-1, 1); g.drawImage(s, 0, 0); this._flip[id] = c; }
    return this._flip[id];
  },
  silhouette(id) { return this._sil[id] || (this._sil[id] = tinted(this.mon(id), '#473f70')); },
  white(id, flip) { const k = id + (flip ? 'f' : ''); return this._white[k] || (this._white[k] = tinted(flip ? this.monFlip(id) : this.mon(id), '#fff9ea')); },
  char(pal, dir, frame) {
    const key = pal + '|' + dir + '|' + frame;
    return this._char[key] || (this._char[key] = paintChar(CHAR_PALS[pal] || CHAR_PALS.hero, dir, frame));
  },
  /* Head and shoulders, for the dialogue box. */
  portrait(pal) {
    const key = 'face|' + pal;
    if (!this._char[key]) { const c = makeCanvas(16, 16); c.getContext('2d').drawImage(this.char(pal, 'down', 0), 1, 0, 16, 16, 0, 0, 16, 16); this._char[key] = c; }
    return this._char[key];
  },
  tile(id, biome, frame, v) {
    const n = animFrames(id), f = n > 1 ? (frame || 0) % n : 0; v = v || 0;
    const key = ((id * 8 + biome) * 8 + f) * 16 + v;
    let t = this._tile.get(key);
    if (!t) { t = paintTile(id, biome, f, v); this._tile.set(key, t); }
    return t;
  },
  /* Soft borders where a path or water meets something else. mask: 1 N, 2 E, 4 S, 8 W. */
  edge(kind, mask, biome, frame) {
    const key = kind + '|' + mask + '|' + biome + '|' + (kind === 'shore' ? frame % 2 : 0);
    let t = this._edge.get(key);
    if (!t) { t = paintEdge(kind, mask, biome, frame % 2); this._edge.set(key, t); }
    return t;
  },
  /* Trees, boulders and palms: taller than a tile, drawn in a second pass so they overlap. */
  prop(biome, v) { const key = biome * 8 + v; return this._prop[key] || (this._prop[key] = paintProp(biome, v)); },
  tallFront(biome, frame) { const key = 'tf' + biome + frame; return this._misc[key] || (this._misc[key] = paintTallFront(biome, frame)); },
};

/* ---------- Characters (16x20 on an 18x22 canvas, drawn at 2x) ----------
   [hair, skin, top, legs, style words, accent]. Styles: long cap hat hood band beard bald bun spiky scarf cape robe apron */
const CHAR_PALS = {
  hero: ['#3b2a24', '#f2c8a0', '#db665a', '#2f3a66', 'band scarf', '#d9ad55'], rival: ['#cfd0de', '#f2c8a0', '#3a3a5e', '#25213d', 'spiky scarf', '#a89abf'],
  sage: ['#ecebe4', '#e8b890', '#f5efe0', '#6a5a4a', 'beard robe', '#3f9a8c'], guard: ['#4a3a2a', '#e8b890', '#4f7fc0', '#33406a', 'cap', '#33406a'],
  healer: ['#e88aa6', '#f2c8a0', '#db665a', '#e8a0b0', 'long apron', '#fff9ea'], shop: ['#3a5a3a', '#e8b890', '#4f7fc0', '#4a4458', 'cap apron', '#557d58'],
  warden: ['#2b2540', '#e8b890', '#d9ad55', '#473f70', 'cape band', '#a8453f'], kid: ['#b0703a', '#f2c8a0', '#f1cf6a', '#557d58', 'cap', '#db665a'],
  lass: ['#d9a441', '#f2c8a0', '#e8739a', '#7a4f8f', 'long', '#fff9ea'], hiker: ['#6a4a2a', '#d8a880', '#7f9a4c', '#6a5a3a', 'hat', '#b9834f'],
  angler: ['#3a4a5a', '#e8b890', '#5ab0d0', '#8a7a5a', 'hat', '#e9d6a0'], elder: ['#d6d4cf', '#d8a880', '#8a6a9a', '#4a4458', 'bald beard', '#8a6a9a'],
  mystic: ['#6a3a8a', '#e8c8b0', '#5a4688', '#2b2540', 'hood robe', '#473f70'], ranger: ['#2a4a2a', '#d8a880', '#557d58', '#5a4a3a', 'cap', '#3b6b45'],
  stoker: ['#8a2a1a', '#d8a880', '#db665a', '#3b3440', 'band', '#f1cf6a'], sledder: ['#f0f0f0', '#f2c8a0', '#6fcfe0', '#3a5a8a', 'hood', '#eaf6fb'],
  council: ['#1e1b35', '#e8b890', '#8a2a44', '#1e1b35', 'hood robe', '#25213d'], champ: ['#f1d98a', '#f2c8a0', '#fff9ea', '#c8a03a', 'long cape', '#d9ad55'],
};
function paintChar(pal, dir, frame) {
  if (dir === 'right') { // mirror of the left-facing sprite
    const src = paintChar(pal, 'left', frame), c = makeCanvas(18, 22), cg = c.getContext('2d');
    cg.translate(18, 0); cg.scale(-1, 1); cg.drawImage(src, 0, 0); return c;
  }
  const cv = makeCanvas(18, 22), g = cv.getContext('2d');
  const [hair, skin, top, legs, styles, acc] = pal, st = {}; (styles || '').split(' ').forEach(k => st[k] = 1);
  const hairD = shade(hair, -.28), hairL = shade(hair, .3), skinD = shade(skin, -.16), topD = shade(top, -.24), topL = shade(top, .2), legD = shade(legs, -.25), accD = shade(acc, -.25), accL = shade(acc, .25);
  const shoe = '#3b3046', blush = '#eba58c';
  const bob = frame === 3 ? 1 : 0;
  const p = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x + 1, y + 1, w, h); };
  const b = (x, y, w, h, c) => p(x, y + bob, w, h, c); // everything above the knees breathes
  const side = dir === 'left';
  // ---- legs ----
  if (st.robe) { p(side ? 5 : 4, 16, side ? 6 : 8, 3, top); p(side ? 5 : 4, 18, side ? 6 : 8, 1, topD); p(side ? 5 : 5, 19, 2, 1, shoe); p(9, 19, 2, 1, shoe); }
  else if (!side) {
    const up0 = frame === 1 ? 1 : 0, up1 = frame === 2 ? 1 : 0;
    p(5, 16 + bob, 2, 3 - up0 - bob, legs); p(4, 19 - up0, 3, 1, shoe); p(6, 16 + bob, 1, 3 - up0 - bob, legD);
    p(9, 16 + bob, 2, 3 - up1 - bob, legs); p(9, 19 - up1, 3, 1, shoe); p(10, 16 + bob, 1, 3 - up1 - bob, legD);
  } else if (frame === 1) { p(5, 16, 2, 3, legs); p(4, 19, 3, 1, shoe); p(9, 16, 2, 2, legD); p(9, 18, 3, 1, shoe); }
  else { p(6, 16 + bob, 4, 3 - bob, legs); p(8, 16 + bob, 2, 3 - bob, legD); p(5, 19, 5, 1, shoe); }
  // ---- cape behind ----
  if (st.cape) { if (dir === 'up') b(3, 10, 10, 8, acc); else if (side) b(10, 10, 2, 8, acc); else { b(2, 10, 2, 8, acc); b(12, 10, 2, 8, acc); } }
  // ---- torso and arms ----
  if (!side) {
    b(4, 10, 8, 6, top); b(10, 10, 2, 6, topD); b(4, 10, 2, 1, topL);
    b(3, 10, 1, 4, top); b(12, 10, 1, 4, topD); b(3, 14, 1, 1, skin); b(12, 14, 1, 1, skinD);
    if (!st.robe) b(4, 15, 8, 1, legD);
    if (dir === 'down') { b(7, 10, 2, 1, skinD); if (st.apron) { b(6, 11, 4, 5, acc); b(6, 15, 4, 1, accD); } }
    if (dir === 'up' && st.cape) { b(3, 10, 10, 7, acc); b(3, 16, 10, 1, accD); b(7, 11, 2, 6, accD); }
  } else {
    b(5, 10, 6, 6, top); b(9, 10, 2, 6, topD); if (!st.robe) b(5, 15, 6, 1, legD);
    const ax = frame === 1 ? 5 : 7; b(ax, 11, 2, 3, topD); b(ax, 14, 2, 1, skin);
    if (st.apron) b(5, 11, 1, 5, acc);
  }
  if (st.scarf) { if (side) { b(5, 10, 6, 1, acc); b(10, 11, 2, 3, accD); } else if (dir === 'up') { b(4, 10, 8, 1, acc); b(8, 11, 2, 3, accD); } else { b(4, 10, 8, 1, acc); b(10, 11, 2, 3, accD); } }
  // ---- head ----
  if (dir === 'down') {
    b(4, 4, 8, 5, skin); b(5, 9, 6, 1, skinD); b(3, 7, 1, 1, skin); b(12, 7, 1, 1, skin);
    b(5, 1, 6, 1, hair); b(4, 2, 8, 2, hair); b(3, 3, 1, 4, hair); b(12, 3, 1, 4, hairD); b(4, 4, 3, 1, hair); b(9, 4, 3, 1, hair); b(6, 2, 3, 1, hairL);
    if (st.bald) { b(5, 1, 6, 1, skin); b(4, 2, 8, 3, skin); b(6, 2, 2, 1, '#fff2dc'); }
    b(6, 6, 1, 2, INK); b(9, 6, 1, 2, INK); b(5, 8, 1, 1, blush); b(10, 8, 1, 1, blush);
    if (st.long) { b(3, 3, 1, 8, hair); b(12, 3, 1, 8, hairD); b(4, 9, 1, 2, hair); b(11, 9, 1, 2, hairD); }
    if (st.beard) { b(4, 8, 8, 1, hair); b(5, 9, 6, 2, hair); b(7, 8, 2, 1, skinD); }
    if (st.band) b(4, 3, 8, 1, acc);
    if (st.cap) { b(5, 0, 6, 1, acc); b(4, 1, 8, 3, acc); b(3, 4, 10, 1, accD); b(5, 1, 3, 1, accL); }
    if (st.hat) { b(5, 0, 6, 3, acc); b(5, 0, 2, 1, accL); b(2, 3, 12, 1, accD); b(5, 2, 6, 1, accD); }
    if (st.hood) { b(4, 0, 8, 1, acc); b(3, 1, 10, 2, acc); b(2, 3, 2, 7, acc); b(12, 3, 2, 7, accD); b(4, 3, 8, 1, acc); b(4, 1, 3, 1, accL); b(4, 9, 1, 1, acc); b(11, 9, 1, 1, accD); }
  } else if (dir === 'up') {
    b(5, 1, 6, 1, hair); b(4, 2, 8, 7, hair); b(3, 3, 1, 5, hair); b(12, 3, 1, 5, hairD); b(4, 7, 8, 2, hairD); b(5, 9, 6, 1, skinD); b(6, 2, 3, 1, hairL);
    if (st.bald) { b(5, 1, 6, 1, skin); b(4, 2, 8, 3, skin); }
    if (st.long) { b(3, 3, 1, 8, hair); b(12, 3, 1, 8, hairD); b(4, 9, 8, 3, hair); b(4, 11, 8, 1, hairD); }
    if (st.band) b(4, 3, 8, 1, acc);
    if (st.cap) { b(5, 0, 6, 1, acc); b(4, 1, 8, 3, acc); b(5, 1, 3, 1, accL); }
    if (st.hat) { b(5, 0, 6, 3, acc); b(2, 3, 12, 1, accD); b(5, 2, 6, 1, accD); }
    if (st.hood) { b(4, 0, 8, 1, acc); b(3, 1, 10, 9, acc); b(2, 3, 12, 6, acc); b(11, 3, 3, 6, accD); b(4, 1, 3, 1, accL); }
  } else {
    b(4, 4, 5, 5, skin); b(3, 6, 1, 1, skin); b(5, 9, 4, 1, skinD);
    b(5, 1, 6, 1, hair); b(4, 2, 8, 2, hair); b(8, 4, 5, 4, hair); b(12, 3, 1, 5, hairD); b(9, 7, 3, 1, hairD); b(4, 4, 3, 1, hair); b(6, 2, 3, 1, hairL);
    if (st.bald) { b(5, 1, 5, 1, skin); b(4, 2, 6, 3, skin); }
    b(5, 6, 1, 2, INK); b(6, 8, 1, 1, blush);
    if (st.long) { b(9, 4, 4, 8, hair); b(11, 5, 2, 7, hairD); }
    if (st.beard) { b(4, 8, 5, 2, hair); }
    if (st.band) b(4, 3, 9, 1, acc);
    if (st.cap) { b(5, 0, 6, 1, acc); b(4, 1, 9, 3, acc); b(2, 4, 6, 1, accD); b(5, 1, 3, 1, accL); }
    if (st.hat) { b(5, 0, 6, 3, acc); b(2, 3, 12, 1, accD); b(5, 2, 6, 1, accD); }
    if (st.hood) { b(4, 0, 8, 1, acc); b(4, 1, 10, 3, acc); b(8, 4, 6, 6, acc); b(11, 4, 3, 6, accD); b(4, 1, 3, 1, accL); b(4, 9, 5, 1, accD); }
  }
  if (st.bun) { b(6, 0, 4, 1, hair); b(7, -1, 2, 1, hair); }
  if (st.spiky) { b(5, 0, 1, 1, hair); b(7, 0, 2, 1, hair); b(10, 0, 1, 1, hair); }
  return pixelize(cv);
}
function paintObject(kind) {
  const cv = makeCanvas(16, 16), g = cv.getContext('2d'), p = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  if (kind === 'item') { // a small banded chest
    p(3, 7, 10, 7, '#b9834f'); p(3, 5, 10, 3, '#d9ad55'); p(4, 5, 8, 1, '#f3d68f'); p(3, 8, 10, 1, '#7a5433'); p(3, 13, 10, 1, '#7a5433'); p(11, 9, 2, 4, '#9c6b3e'); p(7, 8, 2, 3, '#f3d68f'); p(7, 10, 2, 1, '#9c7636');
  } else if (kind === 'barrier') {
    p(1, 6, 14, 3, '#b98f58'); p(1, 11, 14, 3, '#b98f58'); p(3, 4, 2, 12, '#8a6238'); p(11, 4, 2, 12, '#8a6238'); p(1, 6, 14, 1, '#d6b47c'); p(1, 11, 14, 1, '#d6b47c'); p(3, 4, 2, 1, '#d6b47c'); p(11, 4, 2, 1, '#d6b47c'); p(4, 5, 1, 11, '#6b4a2a'); p(12, 5, 1, 11, '#6b4a2a');
  } else if (kind === 'charm') { // a gold amulet on a loop
    p(6, 1, 4, 1, '#9c7636'); p(5, 2, 1, 2, '#9c7636'); p(10, 2, 1, 2, '#9c7636');
    p(7, 4, 2, 1, '#d9ad55'); p(6, 5, 4, 1, '#d9ad55'); p(5, 6, 6, 2, '#d9ad55'); p(4, 8, 8, 2, '#d9ad55'); p(5, 10, 6, 2, '#d9ad55'); p(6, 12, 4, 1, '#d9ad55'); p(7, 13, 2, 1, '#d9ad55');
    p(6, 6, 2, 2, '#f3d68f'); p(5, 8, 1, 1, '#f3d68f'); p(9, 9, 3, 2, '#9c7636'); p(8, 11, 3, 1, '#9c7636'); p(7, 8, 2, 2, '#db665a'); p(7, 8, 1, 1, '#ee8f80');
  }
  return pixelize(cv);
}
const OBJ_SPRITES = {};
function objSprite(kind) { return OBJ_SPRITES[kind] || (OBJ_SPRITES[kind] = paintObject(kind)); }

/* ---------- Tiles (16x16, drawn at 2x) ---------- */
const T = {
  VOID: 0, PATH: 1, WATER: 2, SAND: 3, FLOWER: 4, FENCE: 5, SIGN: 6, WALL: 7, DOOR: 8,
  ROOF: 9, ROOF_H: 10, ROOF_T: 11, ROOF_L: 12, WINDOW: 13, BRIDGE: 14, LAVA: 15, ROOF_S: 16,
  EMB_H: 17, EMB_T: 18, EMB_L: 19, GROUND: 20, OBST: 30, TALL: 40,
  FLOOR: 50, IWALL: 51, COUNTER: 52, MAT: 53, TABLE: 54, SHELF: 55, BED: 56, POT: 57, RUG: 58, HEARTH: 59, STONE: 60, PEDESTAL: 61, STATUE: 62, CRATE: 64,
  EAVE: 70, // + (roof id - 9)
};
function animFrames(id) { return id === 2 || id === 15 ? 4 : id === 59 || id === 4 || (id >= 40 && id < 50) ? 2 : 1; }
const ANIMATED = { 2: 1, 15: 1, 59: 1 };
const BIOMES = [
  { name: 'meadow', g: '#79b860', g2: '#68a653', g3: '#90cc74', tall: '#3f8a48', path: '#dcc08a', tree: '#3c8548' },
  { name: 'mountain', g: '#b8a987', g2: '#a69877', g3: '#cbbd9b', tall: '#8a9450', path: '#dbcba6', tree: '#5d7a4a' },
  { name: 'volcanic', g: '#584c54', g2: '#4a4048', g3: '#6a5d66', tall: '#a8473a', path: '#85736c', tree: '#3a3238' },
  { name: 'darkwood', g: '#4b7355', g2: '#40664b', g3: '#598566', tall: '#285c45', path: '#b39a6c', tree: '#234f3c' },
  { name: 'snow', g: '#e6eef4', g2: '#d2e0ea', g3: '#f9fdff', tall: '#98c4d4', path: '#b7c7d6', tree: '#2f6a58' },
  { name: 'coast', g: '#e9d6a0', g2: '#d9c48a', g3: '#f5e8bc', tall: '#7aa850', path: '#c9a06c', tree: '#3d9a4a' },
];
function isWalkable(t) {
  return t === T.PATH || t === T.SAND || t === T.FLOWER || t === T.BRIDGE || t === T.DOOR || (t >= 20 && t < 30) || (t >= 40 && t < 50) || t === T.FLOOR || t === T.MAT || t === T.RUG || t === T.STONE;
}
const isBuilding = t => (t >= 7 && t <= 13) || (t >= 16 && t <= 19) || (t >= 70 && t < 80);
const ROOF_COL = { 9: '#b5674a', 10: '#db665a', 11: '#4f7fc0', 12: '#d9ad55', 16: '#3f9a8c' };

function tallBlades(p, B, frame, rows) {
  const t = B.tall, tD = shade(t, -.24), tL = shade(t, .3), base = shade(B.g, -.24);
  for (const j of rows) for (let i = 0; i < 4; i++) {
    const x = i * 4 + (j ? 2 : 0) - 1, y = j * 8 + 1, s = frame && (i + j) % 2 ? 1 : 0;
    p(x, y + 7, 4, 1, base);
    p(x, y + 3, 1, 5, tD); p(x + 1 + s, y, 1, 3, t); p(x + 1, y + 2, 1, 6, t); p(x + 2, y + 2, 1, 6, t); p(x + 3, y + 4, 1, 4, tD);
    p(x + 1 + s, y, 1, 2, tL); p(x + 2, y + 2, 1, 1, tL);
  }
}
function paintTallFront(biome, frame) {
  const cv = makeCanvas(16, 16), g = cv.getContext('2d'), B = BIOMES[biome] || BIOMES[0];
  tallBlades((x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); }, B, frame, [1]);
  return cv;
}
function paintTile(id, biome, frame, v) {
  const cv = makeCanvas(16, 16), g = cv.getContext('2d'), B = BIOMES[biome] || BIOMES[0];
  const rng = mulberry32(id * 131 + biome * 17 + v * 53 + 5);
  const p = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const pw = (x, y, w, h, c) => { x = ((x % 16) + 16) % 16; p(x, y, w, h, c); if (x + w > 16) p(x - 16, y, w, h, c); };
  const speck = (n, cols) => { for (let i = 0; i < n; i++) p(Math.floor(rng() * 16), Math.floor(rng() * 16), 1, 1, cols[i % cols.length]); };
  const ground = () => {
    p(0, 0, 16, 16, B.g); speck(9, [B.g2, B.g2, B.g3]);
    if (biome === 0 || biome === 3) {
      for (let i = 0; i < [1, 3, 0, 2][v & 3]; i++) { const x = 1 + Math.floor(rng() * 12), y = 2 + Math.floor(rng() * 10); p(x, y + 1, 1, 2, B.g2); p(x + 1, y, 1, 3, B.g2); p(x + 2, y + 1, 1, 2, B.g2); p(x + 1, y, 1, 1, B.g3); }
      if ((v & 3) === 2) { p(10, 5, 1, 1, biome ? '#b9a3d6' : '#fbf6ea'); p(4, 11, 1, 1, biome ? '#8fcaa0' : '#f1cf6a'); }
    } else if (biome === 1) { if (v & 1) { p(4, 9, 3, 2, '#9a8d70'); p(4, 9, 2, 1, '#d8ccae'); } if (v & 2) { p(11, 4, 2, 2, '#9a8d70'); p(11, 4, 1, 1, '#d8ccae'); } }
    else if (biome === 2) { if (v & 1) { p(3, 5, 4, 1, '#3c3238'); p(6, 6, 1, 3, '#3c3238'); } if ((v & 3) === 2) { p(9, 10, 2, 1, '#c8553a'); p(10, 11, 1, 1, '#f1a04a'); } }
    else if (biome === 4) { if (v & 1) { p(5, 6, 1, 1, '#ffffff'); p(11, 10, 1, 1, '#ffffff'); } if (v & 2) { p(3, 11, 6, 1, B.g2); p(9, 4, 4, 1, B.g2); } }
    else if (biome === 5) { if ((v & 3) === 1) { p(6, 9, 2, 1, '#fbf3e4'); p(6, 10, 1, 1, '#e3a9a0'); } if ((v & 3) === 3) { p(10, 5, 3, 1, B.g2); p(4, 12, 4, 1, B.g2); } }
  };
  const floor = () => { p(0, 0, 16, 16, '#c9a06a'); for (let y = 0; y < 16; y += 4) { p(0, y + 3, 16, 1, '#a87e4a'); p((y * 5 + 3) % 16, y, 1, 3, '#a87e4a'); p((y * 7 + 9) % 16, y + 1, 2, 1, '#d6b07c'); } };
  const wall = () => {
    p(0, 0, 16, 16, '#efe3c8'); for (let y = 5; y < 12; y += 3) p(0, y, 16, 1, '#e2d4b4');
    p(0, 0, 16, 2, '#b9a888'); p(0, 12, 16, 4, '#9a917e'); p(0, 12, 16, 1, '#b8b09c'); p(0, 15, 16, 1, '#7e7666');
    for (let x = 3; x < 16; x += 6) p(x, 13, 1, 2, '#7e7666');
    if (v & 1) { p(0, 0, 2, 12, '#7a5a3c'); p(2, 0, 1, 12, '#5f452d'); }
    if (v & 2) { p(14, 0, 2, 12, '#7a5a3c'); p(13, 0, 1, 12, '#5f452d'); }
  };
  const shingles = (c, rows) => {
    const d = shade(c, -.2), dd = shade(c, -.42), l = shade(c, .22);
    p(0, 0, 16, 16, c);
    for (let y = 0; y < rows; y += 4) { p(0, y + 3, 16, 1, d); for (let x = (y % 8 ? 4 : 0); x < 16; x += 8) p(x, y, 1, 3, d); for (let x = (y % 8 ? 0 : 4); x < 16; x += 8) p(x + 1, y, 2, 1, l); }
    if (v & 1) { p(0, 0, 1, 16, dd); p(1, 0, 1, 16, l); }
    if (v & 2) { p(15, 0, 1, 16, dd); p(14, 0, 1, 16, d); }
    return [d, dd, l];
  };
  const plaque = (bg, ic) => { p(3, 1, 10, 11, '#5f452d'); p(4, 2, 8, 9, bg); p(4, 2, 8, 1, shade(bg, .25)); icon(g, ic, 4, 3, 1); p(7, 0, 2, 1, '#5f452d'); };
  const kind = id >= 70 && id < 80 ? 'eave' : id >= 40 && id < 50 ? 'tall' : id >= 30 && id < 40 ? 'ground' : id >= 20 && id < 30 ? 'ground' : id;
  switch (kind) {
    case 'ground': ground(); break;
    case 'tall': ground(); tallBlades(p, B, frame, [0, 1]); break;
    case T.PATH: {
      const c = B.path; p(0, 0, 16, 16, c); speck(11, [shade(c, -.1), shade(c, .12), shade(c, -.1)]);
      if ((v & 3) === 1) { p(4, 6, 2, 1, shade(c, -.2)); p(4, 5, 2, 1, shade(c, .2)); } if ((v & 3) === 2) { p(10, 10, 3, 1, shade(c, -.16)); p(3, 12, 2, 1, shade(c, -.16)); }
      break;
    }
    case T.SAND: p(0, 0, 16, 16, '#ecd9a3'); speck(10, ['#dcc88c', '#f6e9bd']); if (v & 1) { p(5, 9, 2, 1, '#fbf3e4'); p(5, 10, 1, 1, '#e3a9a0'); } if (v & 2) p(9, 4, 4, 1, '#dcc88c'); break;
    case T.WATER: {
      p(0, 0, 16, 16, '#4a90d6'); const o = frame * 2 + v * 5;
      for (let y = 1; y < 16; y += 5) { pw(o + y * 3, y, 5, 1, '#86c1ee'); pw(o + y * 3 + 1, y + 1, 3, 1, '#69aee6'); pw(o + y * 3 + 9, y + 2, 4, 1, '#3a78be'); }
      if ((frame + v) % 4 === 0) { p(11, 7, 1, 1, '#eaf8ff'); p(3, 12, 1, 1, '#eaf8ff'); }
      break;
    }
    case T.LAVA: {
      p(0, 0, 16, 16, '#d9512c'); const o = frame * 2 + v * 5;
      for (let y = 1; y < 16; y += 5) { pw(o + y * 2, y, 4, 2, '#f1a04a'); pw(o + y * 2 + 1, y, 2, 1, '#f9d77a'); pw(o + y * 2 + 8, y + 2, 4, 1, '#a8351f'); }
      if ((frame + v) % 2) p(12, 6, 2, 2, '#f9d77a');
      break;
    }
    case T.FLOWER: {
      ground(); const cols = ['#e8736a', '#f1cf6a', '#fbf6ea', '#b9a3d6'];
      [[3, 3], [10, 5], [6, 11], [13, 12]].forEach(([x, y], i) => { if ((v + i) % 4 === 3) return; const s = frame && i % 2 ? 1 : 0, c = cols[(i + v) % 4]; p(x, y + 2, 1, 2, '#3f8a48'); p(x + s, y, 2, 2, c); p(x + s, y, 1, 1, shade(c, .3)); });
      break;
    }
    case T.FENCE:
      ground(); p(1, 14, 14, 1, shade(B.g, -.22));
      p(0, 6, 16, 2, '#b98f58'); p(0, 10, 16, 2, '#b98f58'); p(0, 6, 16, 1, '#d6b47c'); p(0, 10, 16, 1, '#d6b47c');
      p(2, 3, 3, 11, '#8a6238'); p(11, 3, 3, 11, '#8a6238'); p(2, 3, 3, 1, '#d6b47c'); p(11, 3, 3, 1, '#d6b47c'); p(4, 4, 1, 10, '#6b4a2a'); p(13, 4, 1, 10, '#6b4a2a');
      break;
    case T.SIGN:
      ground(); p(4, 14, 9, 1, shade(B.g, -.22)); p(7, 10, 2, 5, '#7a5433');
      p(2, 2, 12, 8, '#c79a5e'); p(2, 2, 12, 1, '#e6c487'); p(2, 9, 12, 1, '#8a6238'); p(2, 2, 1, 8, '#a87c48'); p(13, 2, 1, 8, '#a87c48'); p(4, 4, 8, 1, '#6b4a2a'); p(4, 6, 6, 1, '#6b4a2a');
      break;
    case T.WALL: wall(); break;
    case T.WINDOW:
      wall(); p(3, 2, 10, 9, '#6b4a34'); p(4, 3, 8, 7, '#8fc8e8'); p(4, 3, 8, 2, '#c4e6f6'); p(8, 3, 1, 7, '#6b4a34'); p(4, 6, 8, 1, '#6b4a34');
      p(2, 10, 12, 2, '#8a6238'); p(2, 10, 12, 1, '#b98f58'); p(3, 9, 2, 1, '#5fa35a'); p(6, 9, 2, 1, '#e8736a'); p(9, 9, 2, 1, '#5fa35a'); p(11, 9, 2, 1, '#f1cf6a');
      break;
    case T.EMB_H: wall(); plaque('#db665a', 'flame'); break;
    case T.EMB_T: wall(); plaque('#33406a', 'coin'); break;
    case T.EMB_L: wall(); plaque('#25213d', 'sigil'); break;
    case T.DOOR:
      wall(); p(2, 1, 12, 15, '#5f452d'); p(3, 2, 10, 14, '#96673c'); p(3, 2, 10, 1, '#b98654'); p(8, 3, 1, 13, '#7a5433'); p(4, 4, 3, 4, '#845a32'); p(9, 4, 3, 4, '#845a32'); p(4, 10, 3, 4, '#845a32'); p(9, 10, 3, 4, '#845a32');
      p(10, 9, 1, 2, '#f3d68f'); p(1, 15, 14, 1, '#b8b09c');
      break;
    case T.ROOF: case T.ROOF_H: case T.ROOF_T: case T.ROOF_L: case T.ROOF_S: {
      const [, , l] = shingles(ROOF_COL[id], 16); p(v & 1 ? 2 : 0, 0, 16 - (v & 1 ? 2 : 0) - (v & 2 ? 2 : 0), 1, l);
      if (v & 4) { p(8, 3, 6, 10, '#8e8578'); p(8, 3, 6, 2, '#6f675c'); p(9, 6, 2, 1, '#a59c8e'); p(11, 9, 2, 1, '#a59c8e'); p(13, 5, 1, 8, '#6f675c'); }
      break;
    }
    case 'eave': {
      const [, dd] = shingles(ROOF_COL[id - 70 + 9], 12);
      p(0, 11, 16, 2, dd); p(0, 13, 16, 3, '#5f452d'); p(0, 13, 16, 1, '#7a5a3c');
      break;
    }
    case T.BRIDGE: p(0, 0, 16, 16, '#b98f58'); for (let x = 0; x < 16; x += 4) { p(x, 0, 1, 16, '#8a6238'); p(x + 1, 0, 1, 16, '#cfa56c'); } p(0, 0, 16, 2, '#6b4a2a'); p(0, 14, 16, 2, '#6b4a2a'); p(0, 2, 16, 1, '#8a6238'); break;
    case T.FLOOR: floor(); break;
    case T.STONE: p(0, 0, 16, 16, '#8f8ca0'); p(0, 7, 16, 1, '#75728a'); p(0, 15, 16, 1, '#75728a'); p(7, 0, 1, 7, '#75728a'); p(3, 8, 1, 7, '#75728a'); p(12, 8, 1, 7, '#75728a'); p(0, 0, 7, 1, '#a09db2'); p(8, 0, 8, 1, '#a09db2'); p(0, 8, 3, 1, '#a09db2'); p(4, 8, 8, 1, '#a09db2'); speck(4, ['#9d9ab0']); break;
    case T.IWALL: p(0, 0, 16, 16, '#eadcc0'); for (let x = 2; x < 16; x += 4) p(x, 2, 1, 9, '#e0d0ae'); p(0, 0, 16, 2, '#6b4a34'); p(0, 11, 16, 5, '#9a7650'); p(0, 11, 16, 1, '#6b4a2a'); p(0, 12, 16, 1, '#b58e62'); p(7, 13, 1, 3, '#7e5c3a'); p(15, 13, 1, 3, '#7e5c3a'); break;
    case T.COUNTER: floor(); p(0, 1, 16, 13, '#9c6b3e'); p(0, 1, 16, 4, '#d9b07a'); p(0, 1, 16, 1, '#ecd09c'); p(0, 5, 16, 1, '#7a5433'); p(0, 13, 16, 1, '#5f452d'); p(2, 7, 5, 5, '#8a5d34'); p(9, 7, 5, 5, '#8a5d34'); break;
    case T.MAT: floor(); p(1, 6, 14, 10, '#a8453f'); p(2, 7, 12, 8, '#db665a'); p(4, 9, 8, 4, '#ee8f80'); p(7, 10, 2, 2, '#f3d68f'); break;
    case T.RUG: p(0, 0, 16, 16, '#5b4a86'); p(1, 0, 14, 16, '#7a65a8'); p(2, 0, 1, 16, '#d9ad55'); p(13, 0, 1, 16, '#d9ad55'); p(7, 3, 2, 2, '#d9ad55'); p(6, 4, 4, 1, '#d9ad55'); p(7, 11, 2, 2, '#d9ad55'); p(6, 12, 4, 1, '#d9ad55'); break;
    case T.TABLE: floor(); p(2, 13, 12, 2, 'rgba(60,40,30,.35)'); p(1, 3, 14, 9, '#b07a44'); p(1, 3, 14, 2, '#d9b07a'); p(1, 11, 14, 1, '#7a5433'); p(2, 12, 2, 3, '#6b4a2a'); p(12, 12, 2, 3, '#6b4a2a'); p(5, 5, 3, 3, '#fbf6ea'); p(10, 6, 2, 2, '#db665a'); break;
    case T.SHELF: p(0, 0, 16, 16, '#7a5433'); p(0, 0, 16, 1, '#96673c'); p(1, 1, 14, 6, '#3b2a24'); p(1, 9, 14, 6, '#3b2a24'); ['#db665a', '#4f7fc0', '#6fb86a', '#d9ad55', '#a89abf'].forEach((c, i) => { p(2 + i * 3, 2 + (i % 2), 2, 5 - (i % 2), c); p(1 + i * 3, 10 + ((i + 1) % 2), 2, 5 - ((i + 1) % 2), c); p(2 + i * 3, 2 + (i % 2), 1, 1, shade(c, .35)); }); break;
    case T.BED: floor(); p(2, 1, 12, 14, '#fbf6ea'); p(2, 6, 12, 9, '#4f7fc0'); p(2, 14, 12, 1, '#33406a'); p(4, 2, 8, 3, '#ffffff'); p(2, 6, 12, 1, '#86c1ee'); p(2, 1, 12, 1, '#7a5433'); p(4, 9, 2, 2, '#86c1ee'); p(10, 11, 2, 2, '#86c1ee'); break;
    case T.POT: floor(); p(4, 14, 9, 1, 'rgba(60,40,30,.35)'); p(5, 10, 6, 5, '#b0603a'); p(4, 9, 8, 2, '#c8784a'); p(4, 9, 8, 1, '#e09a6a'); p(4, 2, 8, 7, '#3f8a48'); p(6, 0, 4, 3, '#3f8a48'); p(5, 3, 3, 2, '#6fb86a'); p(9, 5, 2, 2, '#2f6f43'); p(7, 1, 1, 1, '#90cc74'); break;
    case T.HEARTH: p(0, 0, 16, 16, '#6f6a7c'); p(0, 0, 16, 2, '#4a4458'); for (let x = 0; x < 16; x += 5) p(x, 2, 1, 3, '#55506a'); p(2, 4, 12, 12, '#25213d'); { const o = frame ? 1 : 0; p(4 + o, 9, 8 - o * 2, 7, '#e8763a'); p(5, 7 + o, 3, 4, '#e8763a'); p(9 - o, 6, 2, 5, '#e8763a'); p(6, 11, 4, 5, '#f9d77a'); p(7, 13 - o, 2, 3, '#fff9ea'); p(3, 15, 10, 1, '#5f452d'); } break;
    case T.PEDESTAL: floor(); p(3, 14, 11, 1, 'rgba(60,40,30,.35)'); p(3, 8, 10, 7, '#b8b4c8'); p(2, 6, 12, 3, '#d8d4e6'); p(2, 6, 12, 1, '#f0eef8'); p(3, 14, 10, 1, '#7a7690'); p(11, 9, 2, 5, '#9a96ac'); break;
    case T.STATUE: p(0, 0, 16, 16, '#8f8ca0'); p(0, 15, 16, 1, '#75728a'); p(3, 11, 10, 5, '#5c5970'); p(3, 11, 10, 1, '#75728a'); p(5, 3, 6, 8, '#b8b4c8'); p(6, 1, 4, 3, '#b8b4c8'); p(4, 5, 1, 4, '#b8b4c8'); p(11, 5, 1, 4, '#9a96ac'); p(6, 1, 2, 1, '#d8d4e6'); p(9, 4, 2, 7, '#9a96ac'); break;
    case T.CRATE: floor(); p(2, 3, 12, 12, '#b98f58'); p(2, 3, 12, 1, '#d6b47c'); p(2, 14, 12, 1, '#7a5433'); p(2, 3, 1, 12, '#7a5433'); p(13, 3, 1, 12, '#7a5433'); p(3, 4, 10, 1, '#8a6238'); for (let i = 0; i < 9; i++) p(3 + i, 5 + i, 2, 1, '#8a6238'); break;
    default: p(0, 0, 16, 16, '#171629');
  }
  return cv;
}
const EDGE_TEETH = [2, 1, 2, 2, 1, 2, 1, 1, 2, 2, 1, 2, 2, 1, 2, 1];
function paintEdge(kind, mask, biome, frame) {
  const cv = makeCanvas(16, 16), g = cv.getContext('2d'), B = BIOMES[biome] || BIOMES[0];
  const p = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  if (kind === 'path') { // the neighbouring ground creeps onto the path with a ragged edge
    const G = B.g, ln = shade(B.path, -.2);
    for (let i = 0; i < 16; i++) {
      if (mask & 1) p(i, EDGE_TEETH[i], 1, 1, ln); if (mask & 4) p(i, 15 - EDGE_TEETH[(i + 5) % 16], 1, 1, ln);
      if (mask & 8) p(EDGE_TEETH[(i + 3) % 16], i, 1, 1, ln); if (mask & 2) p(15 - EDGE_TEETH[(i + 9) % 16], i, 1, 1, ln);
    }
    for (let i = 0; i < 16; i++) {
      if (mask & 1) p(i, 0, 1, EDGE_TEETH[i], G); if (mask & 4) { const d = EDGE_TEETH[(i + 5) % 16]; p(i, 16 - d, 1, d, G); }
      if (mask & 8) p(0, i, EDGE_TEETH[(i + 3) % 16], 1, G); if (mask & 2) { const d = EDGE_TEETH[(i + 9) % 16]; p(16 - d, i, d, 1, G); }
    }
  } else { // shore: a dark bank line and a moving thread of foam
    const bank = shade(B.g, -.42), deep = '#3577bd', foam = '#b6dcf6';
    const dash = i => (i + frame * 4) % 9 < 3;
    if (mask & 1) { p(0, 0, 16, 1, bank); p(0, 1, 16, 2, deep); for (let i = 0; i < 16; i++) if (dash(i)) p(i, 3, 1, 1, foam); }
    if (mask & 4) { for (let i = 0; i < 16; i++) if (dash(i + 3)) p(i, 14, 1, 1, foam); p(0, 15, 16, 1, '#86c1ee'); }
    if (mask & 8) { p(0, 0, 1, 16, bank); p(1, 0, 1, 16, deep); for (let i = 0; i < 16; i++) if (dash(i + 2)) p(2, i, 1, 1, foam); }
    if (mask & 2) { p(15, 0, 1, 16, bank); p(14, 0, 1, 16, deep); for (let i = 0; i < 16; i++) if (dash(i + 5)) p(13, i, 1, 1, foam); }
  }
  return cv;
}
/* Tall scenery on a 22x30 canvas, anchored bottom-centre on its tile. */
function paintProp(biome, v) {
  const cv = makeCanvas(22, 30), g = cv.getContext('2d'), B = BIOMES[biome] || BIOMES[0];
  const rng = mulberry32(biome * 77 + v * 13 + 3);
  const p = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x + 1, y + 1, w, h); };
  const round = (c, cx, cy, rx, ry) => {
    const l = shade(c, .24), d = shade(c, -.24);
    for (let y = Math.floor(cy - ry) - 1; y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx) - 1; x <= cx + rx + 1; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry; if (dx * dx + dy * dy + (rng() - .5) * .22 >= 1) continue;
      const lx = x - (cx - rx * .35), ly = y - (cy - ry * .4), sx = x - (cx + rx * .35), sy = y - (cy + ry * .45);
      let col = lx * lx + ly * ly < rx * ry * .22 ? l : (sx * sx + sy * sy < rx * ry * .3 || y > cy + ry * .55) ? d : c;
      if (rng() < .1) col = col === l ? c : d;
      p(x, y, 1, 1, col);
    }
  };
  const trunk = (x, y, w, h) => { p(x, y, w, h, '#7a5433'); p(x + w - 1, y, 1, h, '#5f452d'); p(x - 1, y + h - 1, w + 2, 1, '#5f452d'); };
  const pine = (c, snow) => {
    const l = shade(c, .22), d = shade(c, -.24);
    trunk(9, 23, 2, 5);
    for (let t = 2; t >= 0; t--) { const y0 = 6 + t * 5, hw = 5 + t * 2; for (let r = 0; r < 8; r++) { const half = Math.max(1, Math.round((r + 1) / 8 * hw)); p(10 - half, y0 + r, half * 2, 1, c); p(10 + Math.floor(half / 3), y0 + r, half - Math.floor(half / 3), 1, d); if (r > 1) p(10 - half, y0 + r, Math.max(1, Math.floor(half / 2)), 1, l); if (snow && r < 3 + (t === 0 ? 1 : 0)) p(10 - half, y0 + r, Math.max(2, half + 1), 1, '#f4fbff'); } p(10 - hw, y0 + 7, hw * 2, 1, d); }
  };
  const boulder = (c, glow) => {
    const l = shade(c, .26), d = shade(c, -.24), dd = shade(c, -.42);
    p(6, 14, 8, 1, c); p(4, 15, 12, 2, c); p(3, 17, 14, 4, c); p(2, 20, 16, 5, c); p(3, 25, 14, 2, d); p(5, 27, 10, 1, dd);
    p(6, 14, 5, 1, l); p(4, 15, 5, 2, l); p(3, 17, 3, 3, l); p(14, 18, 3, 7, d); p(12, 22, 4, 4, d); p(9, 18, 1, 4, d); p(10, 21, 2, 1, d);
    if (glow) { p(8, 19, 1, 4, '#db665a'); p(9, 22, 3, 1, '#db665a'); p(11, 20, 1, 2, '#f1a04a'); }
  };
  const palm = () => {
    const c = '#3f9a52', l = '#6fc070', d = '#2f7440';
    p(10, 11, 2, 5, '#a07c4c'); p(9, 16, 2, 5, '#a07c4c'); p(9, 21, 3, 7, '#a07c4c'); p(11, 21, 1, 7, '#7a5a34'); for (let y = 13; y < 28; y += 3) p(9, y, 2, 1, '#7a5a34');
    p(2, 8, 8, 2, c); p(1, 10, 4, 2, c); p(0, 12, 2, 2, d); p(11, 8, 8, 2, c); p(16, 10, 4, 2, d); p(18, 12, 2, 2, d);
    p(5, 4, 4, 3, c); p(3, 5, 3, 2, c); p(11, 4, 4, 3, c); p(15, 5, 3, 2, d); p(8, 6, 5, 3, l); p(3, 8, 5, 1, l); p(6, 4, 2, 1, l); p(9, 10, 2, 2, '#6b4a2a');
  };
  const dead = () => { const c = '#3a3036'; p(9, 12, 3, 16, c); p(5, 10, 5, 2, c); p(4, 7, 2, 4, c); p(12, 14, 5, 2, c); p(15, 10, 2, 5, c); p(9, 12, 1, 16, '#4c4048'); p(4, 6, 2, 1, '#db665a'); p(15, 9, 2, 1, '#f1a04a'); p(8, 27, 5, 1, '#2a2228'); };
  const bush = c => { round(c, 10, 21, 8.5, 6); p(6, 19, 1, 1, '#e8736a'); p(13, 21, 1, 1, '#e8736a'); p(10, 17, 1, 1, '#e8736a'); };
  if (biome === 0) { if (v === 2) pine('#2f7a48'); else if (v === 3) bush('#4a9450'); else { trunk(9, 20, 3, 7); round(v ? '#44904c' : B.tree, 10, 13.5, 9.4, 8.4); } }
  else if (biome === 1) { if (v === 2) pine(B.tree); else boulder(v === 1 ? '#8f8674' : '#9a8f7a'); }
  else if (biome === 2) { if (v === 1) dead(); else boulder('#40363c', v !== 3); }
  else if (biome === 3) { if (v === 1) { trunk(9, 20, 3, 7); round('#2a5c48', 10, 13.5, 9.4, 8.4); } else pine(v === 3 ? '#1f4a3a' : B.tree); }
  else if (biome === 4) { if (v === 1) { boulder('#9fb2c2'); p(5, 14, 9, 2, '#f4fbff'); p(3, 16, 6, 1, '#f4fbff'); } else pine(B.tree, true); }
  else { if (v === 2) boulder('#c9b88c'); else palm(); }
  return pixelize(cv);
}
