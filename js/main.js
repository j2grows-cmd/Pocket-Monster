'use strict';
/* Boot. */
(function () {
  function start(data) {
    buildWorld(); World.buildMini(); bootEngine();
    const go = () => {
      // fonts.check() also says yes when the face was never declared (offline, blocked), so look for a face that really loaded
      try { for (const f of document.fonts) if (f.family.replace(/["']/g, '') === 'Jersey 20' && f.status === 'loaded') FONT_SCALE = 1.22; } catch (e) { /* keep fallback sizing */ }
      if (data && data.v === 1 && data.party) { S = data; Game.fadeA = 1; startWorld(); } else titleFlow();
    };
    if (document.fonts && document.fonts.load) {
      Promise.race([document.fonts.load('20px "Jersey 20"'), new Promise(r => setTimeout(r, 1500))]).then(go, go);
    } else go();
  }
  // When hosted somewhere that can hot-swap the page, carry the running game across.
  const hot = window.claude && window.claude.hot;
  if (hot && hot.snapshot) hot.snapshot(() => (S && Game.scene !== 'title' ? JSON.parse(JSON.stringify(S)) : {}));
  if (hot && hot.ready) hot.ready(start); else start((hot && hot.data) || {});
})();
