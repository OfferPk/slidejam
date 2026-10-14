/* SlideJam v0.2 meta wiring: how-to card, daily reward + challenge, skin shop (road themes + car paint),
   achievements + stats, level-1 coach, accessibility. Coins are cosmetic only: earned by playing, never sold or cashed out. */
(function () {
  'use strict';
  window.SJ_META_BOOT = function () {
    var S = window.__sj;
    if (!S || !window.Meta || window.SJ_META) return;
    function roadThumb(it) { var e = document.createElement('div'); e.className = 'road-swatch road-sw-' + it.id; e.innerHTML = '<i></i>'; return e; }
    function paintThumb(it) {
      var w = document.createElement('div'); w.className = 'car-prev car-paint-' + it.id;
      ['#e8504f', '#4a90d9', '#3fb27f'].forEach(function (c) { var b = document.createElement('div'); b.className = 'car'; b.style.setProperty('--c', c); w.appendChild(b); });
      return w;
    }
    var tt = null;
    function toast(msg, ms) {
      var t = document.getElementById('meta-toast'); if (!t || !msg) return;
      t.textContent = msg; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(function () { t.classList.remove('show'); }, ms || 1800);
    }
    window.SJ_META = {
      key: 'slidejam.meta.v1', salt: 'slidejam', barAfter: '#home .home-actions', settingsAnchor: '#sj-settings .settings-end', previewBar: false,
      toast: toast,
      rewarded: function (ok) { window.Ads.showRewarded(ok); },
      closeSettings: function () { S.closeSettings(); },
      isFirstLevel: function () { return S.isFirstLevel(); },
      onA11y: function () { S.redraw(); },
      howtoNote: 'Coins are cosmetic only: earned by playing and spent on road themes and car paint. They can never be bought with money or cashed out.',
      howto: [
        'Drive the red TARGET car out through the EXIT on the side of the board.',
        'Every vehicle slides only along its own lane: cars facing left-right move sideways, the others move up and down.',
        'Drag a vehicle (or select it and use the arrow keys) to slide it. Clear the vehicles blocking the exit lane.',
        'Undo and Redo fix any slip. Stuck? Hint shows a good move (one free per level, then a short ad).',
        'Clear a jam in the fewest possible moves for 3 stars. Every clear earns cosmetic coins.',
        'Claim the Daily reward and finish the Daily challenge for bonus coins, then spend them in the Skin Shop.'
      ],
      coach: [
        { target: '#play canvas', text: 'Drag a vehicle along its lane. The red TARGET car needs to reach EXIT.' },
        { target: '#play .play-bar', text: 'Undo, Redo, Hint and Restart live up here.' },
        { target: '#play canvas', text: 'Clear the path in as few moves as you can for 3 stars. Have fun!' }
      ],
      challenges: [
        { id: 'triple', title: 'Shortest Route', desc: 'Clear a jam in the fewest possible moves', count: 1, test: function (d) { return d.stars >= 3; } },
        { id: 'three', title: 'Rush Trio', desc: 'Clear 3 jams', count: 3, test: function () { return true; } },
        { id: 'clean', title: 'No Rewind', desc: 'Clear a jam without Undo or Hint', count: 1, test: function (d) { return d.clean; } },
        { id: 'twostar', title: 'Smooth Traffic', desc: 'Clear 2 jams with at least 2 stars', count: 2, test: function (d) { return d.stars >= 2; } },
        { id: 'late', title: 'Heavy Traffic', desc: 'Clear a jam from level 10 or later', count: 1, test: function (d) { return d.level >= 10; } }
      ],
      playChallenge: function () { S.startLevel(Math.min(S.unlocked(), S.levelCount)); },
      achDefs: window.ACH_DEFS || [],
      stats: function (st) {
        var g = function (k) { return st.m[k] || 0; };
        return [['Jams cleared', String(g('wins'))], ['Highest level', String(Math.max(g('best_level'), S.unlocked() - 1)) + ' / ' + S.levelCount],
          ['Fewest-move clears', String(g('stars3'))], ['Clears without help', String(g('clean_wins'))], ['Total moves', String(g('moves'))]];
      },
      shop: [
        { title: 'Road themes', kind: 'road', prefix: 'road-', thumb: roadThumb, items: [
          { id: 'asphalt', name: 'City Asphalt', price: 0 }, { id: 'park', name: 'Park Lane', price: 150 },
          { id: 'desert', name: 'Desert Road', price: 200 }, { id: 'harbor', name: 'Harbor', price: 250 },
          { id: 'snow', name: 'Snow Day', price: 300 }, { id: 'night', name: 'Night Drive', price: 350 },
          { id: 'neon', name: 'Neon Strip', price: 500 }] },
        { title: 'Car paint', kind: 'paint', prefix: 'paint-', thumb: paintThumb, items: [
          { id: 'gloss', name: 'Showroom Gloss', price: 0 }, { id: 'matte', name: 'Matte', price: 150 },
          { id: 'stripe', name: 'Racing Stripes', price: 250 }, { id: 'pearl', name: 'Pearl', price: 300 },
          { id: 'twotone', name: 'Two-Tone', price: 300 }, { id: 'checker', name: 'Checkered', price: 350 },
          { id: 'neon', name: 'Neon Glow', price: 500 }] }
      ]
    };
    window.Meta.init(window.SJ_META);
  };
})();
