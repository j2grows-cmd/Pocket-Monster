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

function paintMonster(art) {
  const S = 64, cv = makeCanvas(S, S), g = cv.getContext('2d');
  const B = BODIES[art.b], f = {};
  art.f.forEach(k => f[k] = 1);
  const o = { c: art.c, c2: art.c2, cd: shade(art.c, -.3), cl: shade(art.c, .5), f };
  const k = 24 * art.s;
  g.save(); g.translate(32, 60); g.scale(k, k);
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
  // soft volume shading clipped to the sprite
  g.globalCompositeOperation = 'source-atop';
  const gr = g.createLinearGradient(-.8, -1.6, .8, 0);
  gr.addColorStop(0, 'rgba(255,255,255,.14)'); gr.addColorStop(.5, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(20,10,40,.3)');
  g.fillStyle = gr; g.fillRect(-2, -3, 4, 4);
  g.globalCompositeOperation = 'source-over';
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
  return pixelize(cv, INK);
}

/* Snap soft vector edges to hard pixels and add a one-pixel outline. */
function pixelize(cv, ink) {
  const g = cv.getContext('2d'), w = cv.width, h = cv.height;
  const im = g.getImageData(0, 0, w, h), d = im.data, solid = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) { if (d[i * 4 + 3] >= 110) { solid[i] = 1; d[i * 4 + 3] = 255; } else d[i * 4 + 3] = 0; }
  const [ir, ig, ib] = hexRgb(ink);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (solid[i]) continue;
    if ((x > 0 && solid[i - 1]) || (x < w - 1 && solid[i + 1]) || (y > 0 && solid[i - w]) || (y < h - 1 && solid[i + w])) { d[i * 4] = ir; d[i * 4 + 1] = ig; d[i * 4 + 2] = ib; d[i * 4 + 3] = 255; }
  }
  g.putImageData(im, 0, 0);
  return cv;
}

const Sprites = {
  _mon: {}, _flip: {}, _sil: {}, _char: {}, _tile: new Map(),
  mon(id) { return this._mon[id] || (this._mon[id] = paintMonster(DEX[id].art)); },
  monFlip(id) {
    if (!this._flip[id]) { const s = this.mon(id), c = makeCanvas(64, 64), g = c.getContext('2d'); g.translate(64, 0); g.scale(-1, 1); g.drawImage(s, 0, 0); this._flip[id] = c; }
    return this._flip[id];
  },
  silhouette(id) {
    if (!this._sil[id]) { const s = this.mon(id), c = makeCanvas(64, 64), g = c.getContext('2d'); g.drawImage(s, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#3a3350'; g.fillRect(0, 0, 64, 64); this._sil[id] = c; }
    return this._sil[id];
  },
  char(pal, dir, frame) {
    const key = pal + '|' + dir + '|' + frame;
    return this._char[key] || (this._char[key] = paintChar(CHAR_PALS[pal] || CHAR_PALS.hero, dir, frame));
  },
  tile(id, biome, frame) {
    const key = id * 64 + biome * 4 + (ANIMATED[id] ? frame : 0);
    let t = this._tile.get(key);
    if (!t) { t = paintTile(id, biome, ANIMATED[id] ? frame : 0); this._tile.set(key, t); }
    return t;
  },
};

/* ---------- Characters (16x16) ---------- */
const CHAR_PALS = {
  hero: ['#3a2a22', '#f2c8a0', '#d8483a', '#2f3f6a'], rival: ['#c8c8d8', '#f2c8a0', '#3a3a5a', '#2a2a3a'],
  sage: ['#e8e8e8', '#e8b890', '#f4f4f0', '#6a5a4a'], guard: ['#4a3a2a', '#e8b890', '#4a6a9a', '#3a4a6a'],
  healer: ['#e87a9a', '#f2c8a0', '#f8f0f0', '#e8a0b0'], shop: ['#3a5a3a', '#e8b890', '#3f8fe0', '#4a4a4a'],
  warden: ['#2a2a2a', '#e8b890', '#c8a03a', '#5a2a4a'], kid: ['#b0703a', '#f2c8a0', '#f2c83a', '#4a7a4a'],
  lass: ['#d8a03a', '#f2c8a0', '#e86a9a', '#7a4a8a'], hiker: ['#6a4a2a', '#d8a880', '#7a9a4a', '#6a5a3a'],
  angler: ['#3a4a5a', '#e8b890', '#5ab0d0', '#8a7a5a'], elder: ['#d0d0d0', '#d8a880', '#8a6a9a', '#4a4a5a'],
  mystic: ['#6a3a8a', '#e8c8b0', '#4a3a7a', '#2a2a4a'], ranger: ['#2a4a2a', '#d8a880', '#3a7a4a', '#5a4a3a'],
  stoker: ['#8a2a1a', '#d8a880', '#e8663a', '#3a3a3a'], sledder: ['#f0f0f0', '#f2c8a0', '#6fcfe0', '#3a5a8a'],
  council: ['#1a1a2a', '#e8b890', '#8a1a3a', '#1a1a2a'], champ: ['#f2e08a', '#f2c8a0', '#f8f8ff', '#c8a03a'],
};
function paintChar(pal, dir, frame) {
  const cv = makeCanvas(16, 16), g = cv.getContext('2d');
  const [hair, skin, shirt, pants] = pal, p = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  // legs
  const l0 = frame === 1 ? 2 : 3, l1 = frame === 2 ? 2 : 3;
  p(5, 12, 2, l0, pants); p(9, 12, 2, l1, pants);
  // body + arms
  p(4, 8, 8, 5, shirt); p(3, 8, 1, 3, shirt); p(12, 8, 1, 3, shirt); p(3, 11, 1, 1, skin); p(12, 11, 1, 1, skin);
  p(4, 12, 8, 1, shade(shirt, -.25));
  // head
  p(4, 2, 8, 6, skin); p(4, 1, 8, 2, hair); p(3, 2, 1, 4, hair); p(12, 2, 1, 4, hair);
  if (dir === 'down') { p(4, 3, 8, 1, hair); p(6, 5, 1, 2, INK); p(9, 5, 1, 2, INK); }
  else if (dir === 'up') { p(4, 2, 8, 5, hair); }
  else if (dir === 'left') { p(6, 3, 6, 1, hair); p(9, 4, 3, 3, hair); p(5, 5, 1, 2, INK); }
  else { p(4, 3, 6, 1, hair); p(4, 4, 3, 3, hair); p(10, 5, 1, 2, INK); }
  return pixelize(cv, INK);
}
function paintObject(kind) {
  const cv = makeCanvas(16, 16), g = cv.getContext('2d'), p = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  if (kind === 'item') { p(5, 7, 6, 6, '#e8c040'); p(4, 8, 8, 4, '#e8c040'); p(6, 8, 2, 2, '#fff4b0'); p(4, 10, 8, 1, '#a07818'); }
  else if (kind === 'barrier') { p(1, 6, 14, 3, '#b0803a'); p(1, 11, 14, 3, '#b0803a'); p(3, 4, 2, 12, '#7a5424'); p(11, 4, 2, 12, '#7a5424'); p(1, 6, 14, 1, '#d0a058'); p(1, 11, 14, 1, '#d0a058'); }
  else if (kind === 'orb') { p(5, 6, 6, 8, '#d8483a'); p(4, 7, 8, 6, '#d8483a'); p(4, 10, 8, 1, INK); p(4, 11, 8, 2, '#f4f0e8'); p(5, 13, 6, 1, '#f4f0e8'); p(7, 9, 2, 3, '#f4f0e8'); }
  return pixelize(cv, INK);
}
const OBJ_SPRITES = {};
function objSprite(kind) { return OBJ_SPRITES[kind] || (OBJ_SPRITES[kind] = paintObject(kind)); }

/* ---------- Tiles (16x16) ---------- */
const T = {
  VOID: 0, PATH: 1, WATER: 2, SAND: 3, FLOWER: 4, FENCE: 5, SIGN: 6, WALL: 7, DOOR: 8,
  ROOF: 9, ROOF_H: 10, ROOF_T: 11, ROOF_L: 12, WINDOW: 13, BRIDGE: 14, LAVA: 15, ROOF_S: 16,
  EMB_H: 17, EMB_T: 18, EMB_L: 19, GROUND: 20, OBST: 30, TALL: 40,
  FLOOR: 50, IWALL: 51, COUNTER: 52, MAT: 53, TABLE: 54, SHELF: 55, BED: 56, POT: 57, RUG: 58, HEARTH: 59, STONE: 60, PEDESTAL: 61, STATUE: 62, CRATE: 64,
  EAVE: 70, // + (roof id - 9)
};
const ANIMATED = { 2: 1, 15: 1, 59: 1 };
const BIOMES = [
  { name: 'meadow', g: '#7cc45c', g2: '#6ab34e', g3: '#90d46c', tall: '#3f9a45' },
  { name: 'mountain', g: '#b9ad8c', g2: '#a89c7c', g3: '#cabd9c', tall: '#8f9a48' },
  { name: 'volcanic', g: '#5e5458', g2: '#51484c', g3: '#6e6368', tall: '#b04a32' },
  { name: 'darkwood', g: '#4f7a52', g2: '#456e48', g3: '#5c8c5e', tall: '#2a6244' },
  { name: 'snow', g: '#eaf2f6', g2: '#d8e6ee', g3: '#ffffff', tall: '#9ccad8' },
  { name: 'coast', g: '#ecd9a0', g2: '#dcc88c', g3: '#f6e8b8', tall: '#7fb04a' },
];
function isWalkable(t) {
  return t === T.PATH || t === T.SAND || t === T.FLOWER || t === T.BRIDGE || t === T.DOOR || (t >= 20 && t < 30) || (t >= 40 && t < 50) || t === T.FLOOR || t === T.MAT || t === T.RUG || t === T.STONE;
}
function paintTile(id, biome, frame) {
  const cv = makeCanvas(16, 16), g = cv.getContext('2d'), B = BIOMES[biome] || BIOMES[0];
  const rng = mulberry32(id * 131 + biome * 17 + 5);
  const p = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const speck = (n, cols) => { for (let i = 0; i < n; i++) p(Math.floor(rng() * 16), Math.floor(rng() * 16), 1, 1, cols[i % cols.length]); };
  const ground = () => { p(0, 0, 16, 16, B.g); speck(14, [B.g2, B.g3]); if (biome === 0 || biome === 3) { for (let i = 0; i < 4; i++) { const x = Math.floor(rng() * 14), y = 2 + Math.floor(rng() * 12); p(x, y, 1, 2, B.g2); p(x + 1, y + 1, 1, 1, B.g2); } } };
  const floor = () => { p(0, 0, 16, 16, '#c89a62'); for (let y = 0; y < 16; y += 4) { p(0, y + 3, 16, 1, '#a87c48'); p((y * 3) % 16, y, 1, 3, '#a87c48'); } };
  const roofCol = { 9: '#b8643a', 10: '#d8483a', 11: '#3f78c8', 12: '#c8a03a', 16: '#3aa08a' };
  const kind = id >= 70 && id < 80 ? 'eave' : id >= 40 && id < 50 ? 'tall' : id >= 30 && id < 40 ? 'obst' : id >= 20 && id < 30 ? 'ground' : id;
  switch (kind) {
    case 'ground': ground(); break;
    case 'tall': {
      ground();
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
        const x = i * 4 + (j % 2) * 2, y = j * 8 + 2;
        p(x, y + 2, 1, 5, B.tall); p(x + 1, y, 1, 7, B.tall); p(x + 2, y + 3, 1, 4, shade(B.tall, -.2)); p(x + 1, y, 1, 1, shade(B.tall, .35));
      }
      break;
    }
    case 'obst': {
      ground();
      if (biome === 1 || biome === 2) { // boulders
        const c = biome === 1 ? '#8a8072' : '#3c3438';
        p(2, 5, 12, 9, c); p(4, 3, 8, 2, c); p(1, 8, 14, 5, c); p(4, 4, 5, 2, shade(c, .25)); p(2, 6, 3, 2, shade(c, .25)); p(3, 12, 11, 2, shade(c, -.3)); p(11, 6, 3, 6, shade(c, -.18));
        if (biome === 2) { p(6, 7, 1, 4, '#e8663a'); p(7, 10, 3, 1, '#e8663a'); p(9, 8, 1, 2, '#f7a23e'); }
      } else if (biome === 5) { // palm
        p(7, 7, 2, 9, '#8a6a3a'); p(8, 9, 1, 6, '#6a4e26');
        const f = '#3d9a4a'; p(2, 3, 12, 2, f); p(1, 5, 4, 2, f); p(11, 5, 4, 2, f); p(5, 1, 6, 2, f); p(6, 5, 4, 2, shade(f, -.25)); p(0, 7, 2, 2, f); p(14, 7, 2, 2, f); p(5, 2, 3, 1, shade(f, .3));
      } else { // trees
        const c = biome === 3 ? '#1f4a34' : biome === 4 ? '#2f6a58' : '#2f7a3a';
        p(7, 12, 2, 4, '#6a4a2a');
        p(6, 0, 4, 2, c); p(4, 2, 8, 3, c); p(2, 5, 12, 4, c); p(1, 9, 14, 3, c); p(3, 12, 10, 1, shade(c, -.3));
        p(5, 3, 3, 1, shade(c, .25)); p(3, 6, 4, 1, shade(c, .25)); p(2, 10, 5, 1, shade(c, .25)); p(10, 7, 3, 4, shade(c, -.2));
        if (biome === 4) { p(6, 0, 4, 1, '#fff'); p(4, 2, 6, 1, '#fff'); p(2, 5, 9, 1, '#fff'); p(1, 9, 8, 1, '#fff'); }
      }
      break;
    }
    case T.PATH: p(0, 0, 16, 16, '#dcbc80'); speck(16, ['#c8a86c', '#ecd09a']); break;
    case T.SAND: p(0, 0, 16, 16, '#ecd9a0'); speck(12, ['#dcc88c', '#f6e8b8']); break;
    case T.WATER: {
      p(0, 0, 16, 16, '#3f8fe0'); const o = frame ? 4 : 0;
      for (let y = 2; y < 16; y += 6) { p((o + y) % 16, y, 5, 1, '#7fbcf4'); p((o + y + 9) % 16, y + 3, 4, 1, '#2f78c8'); }
      break;
    }
    case T.LAVA: {
      p(0, 0, 16, 16, '#e8562a'); const o = frame ? 5 : 0;
      for (let y = 1; y < 16; y += 5) { p((o + y * 2) % 16, y, 4, 2, '#f7b23e'); p((o + y * 2 + 8) % 16, y + 2, 3, 1, '#b8321a'); }
      break;
    }
    case T.FLOWER: {
      ground(); const cols = ['#f25a7a', '#f7e06a', '#f4f4ff'];
      [[3, 3], [10, 5], [6, 11], [13, 12]].forEach(([x, y], i) => { p(x, y, 2, 2, cols[i % 3]); p(x, y + 2, 1, 2, '#3f8a3f'); });
      break;
    }
    case T.FENCE: ground(); p(0, 5, 16, 2, '#b08a56'); p(0, 10, 16, 2, '#b08a56'); p(2, 2, 3, 12, '#8a6636'); p(11, 2, 3, 12, '#8a6636'); p(2, 2, 3, 1, '#c8a46c'); p(11, 2, 3, 1, '#c8a46c'); break;
    case T.SIGN: ground(); p(7, 9, 2, 7, '#7a5a30'); p(2, 2, 12, 8, '#c89a5a'); p(2, 2, 12, 1, '#e8c080'); p(2, 9, 12, 1, '#8a6636'); p(4, 4, 8, 1, '#6a4a24'); p(4, 6, 6, 1, '#6a4a24'); break;
    case T.WALL: case T.WINDOW: case T.EMB_H: case T.EMB_T: case T.EMB_L: {
      p(0, 0, 16, 16, '#eadcc0'); for (let y = 3; y < 16; y += 4) p(0, y, 16, 1, '#d2c2a0'); p(0, 14, 16, 2, '#9a8a70');
      if (id === T.WINDOW) { p(4, 3, 8, 8, '#5a4a3a'); p(5, 4, 6, 6, '#9fd4f4'); p(8, 4, 1, 6, '#5a4a3a'); p(5, 7, 6, 1, '#5a4a3a'); }
      if (id === T.EMB_H) { p(3, 2, 10, 10, '#f8f0f0'); p(7, 3, 2, 8, '#d8483a'); p(4, 6, 8, 2, '#d8483a'); p(6, 4, 4, 6, '#f08a2c'); p(7, 6, 2, 4, '#fbe36a'); }
      if (id === T.EMB_T) { p(3, 2, 10, 10, '#f0f4f8'); p(5, 4, 6, 6, '#e8c040'); p(4, 5, 8, 4, '#e8c040'); p(7, 5, 2, 4, '#a07818'); }
      if (id === T.EMB_L) { p(3, 2, 10, 10, '#3a2a4a'); p(7, 3, 2, 8, '#e8c040'); p(4, 6, 8, 2, '#e8c040'); p(5, 4, 6, 6, '#e8c040'); p(7, 6, 2, 2, '#3a2a4a'); }
      break;
    }
    case T.DOOR: p(0, 0, 16, 16, '#eadcc0'); p(2, 1, 12, 15, '#6a4a2a'); p(3, 2, 10, 14, '#8a5e34'); p(3, 2, 10, 1, '#a87844'); p(11, 9, 1, 2, '#e8c040'); p(0, 14, 2, 2, '#9a8a70'); p(14, 14, 2, 2, '#9a8a70'); break;
    case T.ROOF: case T.ROOF_H: case T.ROOF_T: case T.ROOF_L: case T.ROOF_S: {
      const c = roofCol[id]; p(0, 0, 16, 16, c);
      for (let y = 0; y < 16; y += 4) { p(0, y + 3, 16, 1, shade(c, -.25)); for (let x = (y % 8 ? 4 : 0); x < 16; x += 8) p(x, y, 1, 3, shade(c, -.25)); }
      p(0, 0, 16, 1, shade(c, .3));
      break;
    }
    case 'eave': {
      const c = roofCol[id - 70 + 9]; p(0, 0, 16, 16, c);
      for (let y = 0; y < 12; y += 4) { p(0, y + 3, 16, 1, shade(c, -.25)); for (let x = (y % 8 ? 4 : 0); x < 16; x += 8) p(x, y, 1, 3, shade(c, -.25)); }
      p(0, 12, 16, 2, shade(c, -.4)); p(0, 14, 16, 2, '#5a4a3a');
      break;
    }
    case T.BRIDGE: p(0, 0, 16, 16, '#b08a56'); for (let x = 0; x < 16; x += 4) p(x, 0, 1, 16, '#8a6636'); p(0, 0, 16, 1, '#6a4a24'); p(0, 15, 16, 1, '#6a4a24'); break;
    case T.FLOOR: floor(); break;
    case T.STONE: p(0, 0, 16, 16, '#8c8a98'); p(0, 7, 16, 1, '#74727e'); p(0, 15, 16, 1, '#74727e'); p(7, 0, 1, 7, '#74727e'); p(3, 8, 1, 7, '#74727e'); p(12, 8, 1, 7, '#74727e'); speck(6, ['#9c9aa8']); break;
    case T.IWALL: p(0, 0, 16, 16, '#e8dcc4'); p(0, 0, 16, 2, '#7a5a3a'); p(0, 12, 16, 4, '#9a7a52'); p(0, 12, 16, 1, '#6a4a2a'); break;
    case T.COUNTER: floor(); p(0, 2, 16, 12, '#a06a3a'); p(0, 2, 16, 3, '#d8a868'); p(0, 13, 16, 1, '#6a4420'); break;
    case T.MAT: floor(); p(1, 6, 14, 10, '#c83a3a'); p(2, 7, 12, 8, '#e86a5a'); p(6, 10, 4, 3, '#f7e06a'); break;
    case T.RUG: floor(); p(0, 0, 16, 16, '#7a4a9a'); p(1, 1, 14, 14, '#9a6aba'); p(6, 6, 4, 4, '#e8c040'); break;
    case T.TABLE: floor(); p(1, 3, 14, 9, '#b07a44'); p(1, 3, 14, 2, '#d8a868'); p(2, 12, 2, 4, '#6a4420'); p(12, 12, 2, 4, '#6a4420'); break;
    case T.SHELF: p(0, 0, 16, 16, '#7a5230'); p(1, 1, 14, 6, '#4a3020'); p(1, 9, 14, 6, '#4a3020'); ['#d8483a', '#3f8fe0', '#5cae4e', '#e8c040', '#9a52c4'].forEach((c, i) => { p(2 + i * 3, 2, 2, 5, c); p(1 + i * 3, 10, 2, 5, c); }); break;
    case T.BED: floor(); p(2, 1, 12, 14, '#f0f0f8'); p(2, 6, 12, 9, '#5a8ad8'); p(4, 2, 8, 3, '#ffffff'); p(2, 6, 12, 1, '#3a6ab8'); break;
    case T.POT: floor(); p(5, 10, 6, 5, '#b0603a'); p(4, 9, 8, 2, '#c8784a'); p(4, 2, 8, 7, '#3d9448'); p(6, 0, 4, 3, '#3d9448'); p(5, 3, 3, 2, '#5cc468'); break;
    case T.HEARTH: p(0, 0, 16, 16, '#6a6470'); p(0, 0, 16, 2, '#4a4450'); p(2, 4, 12, 12, '#2a2430'); { const o = frame ? 1 : 0; p(4 + o, 9, 8 - o * 2, 7, '#f08a2c'); p(5, 7 + o, 3, 4, '#f08a2c'); p(9 - o, 6, 2, 5, '#f08a2c'); p(6, 11, 4, 5, '#fbe36a'); } break;
    case T.PEDESTAL: floor(); p(3, 8, 10, 7, '#b8b4c4'); p(2, 6, 12, 3, '#d8d4e4'); p(3, 14, 10, 1, '#7a7688'); break;
    case T.STATUE: p(0, 0, 16, 16, '#8c8a98'); p(3, 11, 10, 5, '#5a5866'); p(5, 3, 6, 8, '#b8b4c4'); p(6, 1, 4, 3, '#b8b4c4'); p(4, 5, 1, 4, '#b8b4c4'); p(11, 5, 1, 4, '#b8b4c4'); p(6, 4, 2, 1, '#d8d4e4'); break;
    case T.CRATE: floor(); p(2, 3, 12, 12, '#b08a56'); p(2, 3, 12, 1, '#d0a870'); p(2, 14, 12, 1, '#7a5a30'); p(2, 3, 1, 12, '#7a5a30'); p(13, 3, 1, 12, '#7a5a30'); p(3, 4, 10, 1, '#7a5a30'); for (let i = 0; i < 10; i++) p(3 + i, 5 + i, 1, 1, '#7a5a30'); break;
    default: p(0, 0, 16, 16, '#14121c');
  }
  return cv;
}
