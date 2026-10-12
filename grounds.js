/* Tileable battleground tapestries. Same ten colours as the company.
   Side-on friezes. Walk line is row 64, same as the sprites. */
(function () {
  const palette = {
    k: "#1c1e1c",
    g: "#6a7068",
    o: "#5c6148",
    w: "#b7b1a4",
    b: "#6e5340",
    t: "#b8a57a",
    a: "#7a5c38",
    s: "#32373b",
    r: "#9a2b2b",
    n: "#4d5663",
  };

  const W = 256;
  const H = 80;
  const GROUND = 64;

  function grid() {
    return Array.from({ length: H }, function () {
      return Array(W).fill(".");
    });
  }

  function wrap(x) {
    return ((x % W) + W) % W;
  }

  function put(g, x, y, c) {
    y = Math.round(y);
    if (y < 0 || y >= H || !c || c === ".") return;
    g[y][wrap(Math.round(x))] = c;
  }

  function hline(g, x, y, n, c) {
    for (let i = 0; i < n; i++) put(g, x + i, y, c);
  }

  function vline(g, x, y, n, c) {
    for (let i = 0; i < n; i++) put(g, x, y + i, c);
  }

  function rect(g, x, y, w, h, c) {
    for (let j = 0; j < h; j++) hline(g, x, y + j, w, c);
  }

  function band(g, y0, y1, c) {
    const a = Math.max(0, y0);
    const b = Math.min(H, y1);
    for (let y = a; y < b; y++) hline(g, 0, y, W, c);
  }

  function hash(n) {
    n = Math.imul(n ^ (n >>> 16), 2246822507);
    n = Math.imul(n ^ (n >>> 13), 3266489909);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  function speckle(g, y0, y1, c, chance, salt) {
    for (let y = y0; y < y1; y++) {
      for (let x = 0; x < W; x++) {
        if (hash(x * 131 + y * 917 + salt) < chance) put(g, x, y, c);
      }
    }
  }

  function speckleBox(g, x, y, w, h, c, chance, salt) {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        if (hash((x + i) * 17 + (y + j) * 31 + salt) < chance) put(g, x + i, y + j, c);
      }
    }
  }

  function waveY(x, base, amp, salt) {
    return base + Math.round(Math.sin((x + salt) * 0.055) * amp + Math.sin((x + salt) * 0.021) * amp);
  }

  function cloud(g, x, y, w) {
    hline(g, x + 2, y, w - 2, "n");
    hline(g, x, y + 1, w, "n");
    hline(g, x + 3, y + 2, Math.max(4, w - 6), "s");
  }

  function hedgehog(g, x, y) {
    put(g, x, y, "k");
    put(g, x - 2, y, "k");
    put(g, x + 2, y, "k");
    put(g, x - 1, y - 1, "k");
    put(g, x + 1, y - 1, "k");
    put(g, x, y - 2, "k");
    put(g, x - 3, y - 2, "s");
    put(g, x + 3, y - 2, "s");
    put(g, x - 2, y - 3, "k");
    put(g, x + 2, y - 3, "k");
    put(g, x, y - 3, "s");
    put(g, x - 1, y - 4, "k");
    put(g, x + 1, y - 4, "k");
    put(g, x, y - 5, "k");
    put(g, x - 3, y - 1, "k");
    put(g, x + 3, y - 1, "k");
  }

  function wire(g, x0, x1, y, h) {
    for (let x = x0; x <= x1; x += 16) {
      vline(g, x, y - h, h + 1, "k");
      put(g, x, y - h - 1, "s");
    }
    for (let x = x0; x <= x1; x++) {
      if (x % 16 === 0) continue;
      put(g, x, y - h + (x % 6 === 0 ? 1 : 0), "s");
      if (x % 4 === 0) put(g, x, y - h + 3, "k");
    }
  }

  function tuft(g, x, y, c) {
    put(g, x, y, c);
    put(g, x - 1, y, c);
    put(g, x + 1, y, c);
    put(g, x, y - 1, c);
    put(g, x + 1, y - 2, c);
    put(g, x - 1, y - 1, "k");
  }

  function pine(g, x, y, h) {
    const top = y - h;
    put(g, x, top, "k");
    for (let i = 1; i < h - 3; i++) {
      const halfL = 1 + Math.floor((i * 2) / 5) - (hash(x + i) > 0.65 ? 1 : 0);
      const halfR = 1 + Math.floor((i * 2) / 6) + (hash(x * 3 + i) > 0.6 ? 1 : 0);
      hline(g, x - halfL, top + i, halfL + halfR + 1, i % 5 === 0 ? "k" : "o");
      if (hash(x + i * 3) < 0.3) put(g, x - halfL, top + i, "w");
      if (hash(x + i * 7) < 0.2) put(g, x + halfR, top + i, "k");
    }
    vline(g, x, y - 4, 5, "a");
    put(g, x - 1, y, "a");
    put(g, x + 1, y - 1, "a");
  }

  function palm(g, x, y, h) {
    for (let i = 0; i < h; i++) {
      const lean = i > h - 5 ? 1 : 0;
      put(g, x + lean, y - i, i < 3 ? "b" : "a");
      if (i < 3) put(g, x + lean - 1, y - i, "b");
    }
    const tipX = x + 1;
    const tipY = y - h + 1;
    rect(g, tipX - 2, tipY, 5, 2, "o");
    hline(g, tipX - 7, tipY + 1, 6, "o");
    hline(g, tipX + 2, tipY + 1, 7, "o");
    hline(g, tipX - 8, tipY + 2, 4, "k");
    hline(g, tipX + 5, tipY + 2, 4, "k");
    hline(g, tipX - 6, tipY + 3, 3, "o");
    hline(g, tipX + 4, tipY + 3, 3, "o");
    put(g, tipX, tipY - 1, "o");
    put(g, tipX - 4, tipY, "o");
    put(g, tipX + 4, tipY, "o");
  }

  function house(g, x, y, w, h, ruined) {
    const peak = Math.floor(w / 2);
    for (let row = 0; row <= peak; row++) {
      hline(g, x + peak - row, y - h - peak + row, row * 2 + (w % 2 === 0 ? 0 : 1), "b");
    }
    rect(g, x, y - h, w, h, ruined ? "s" : "g");
    put(g, x + w - 1, y - h, "k");
    speckleBox(g, x, y - h, w, h, ruined ? "b" : "o", 0.12, x);
    for (let i = 2; i < w - 2; i += 4) {
      rect(g, x + i, y - h + 3, 2, 3, "k");
      if (ruined) rect(g, x + i, y - h + 8, 2, 4, "k");
    }
    if (ruined) {
      put(g, x + 1, y - h - 1, "s");
      rect(g, x + w - 4, y - h - 2, 3, 4, "k");
      hline(g, x, y - 1, 3, "k");
    } else {
      hline(g, x + 1, y - 2, 2, "a");
      put(g, x + 2, y - 3, "a");
    }
  }

  function hull(g, x, y, w) {
    rect(g, x, y - 8, w, 5, "s");
    rect(g, x + 4, y - 12, 8, 4, "s");
    hline(g, x + 12, y - 10, Math.max(6, w - 8), "k");
    put(g, x + 11, y - 11, "k");
    hline(g, x - 1, y - 3, w + 2, "k");
    for (let i = 0; i < w; i += 3) put(g, x + i, y - 2, "k");
    put(g, x + 6, y - 11, "a");
  }

  function ruin(g, x, y, w, h) {
    for (let i = 0; i < w; i++) {
      const drop = Math.floor(hash(x * 13 + i * 19) * Math.min(8, h / 2));
      for (let j = drop; j < h; j++) {
        const ch = hash(x + i + j * 7) < 0.16 ? "k" : hash(x + i * 3) < 0.2 ? "a" : "b";
        put(g, x + i, y - h + j, ch);
      }
      if (drop > 2 && hash(x + i) < 0.4) put(g, x + i, y - h + drop - 1, "s");
    }
    for (let i = 3; i < w - 3; i += 5) {
      for (let j = 8; j < h - 6; j += 7) {
        rect(g, x + i, y - h + j, 2, 3, "k");
      }
    }
    hline(g, x - 1, y, w + 2, "s");
    speckleBox(g, x - 2, y - 2, w + 4, 3, "k", 0.25, x);
  }

  function bunker(g, x, y, w) {
    rect(g, x, y - 6, w, 6, "g");
    hline(g, x - 1, y - 7, w + 2, "s");
    hline(g, x + 2, y - 4, 4, "k");
    put(g, x + w - 2, y - 3, "k");
  }

  function linesOf(g) {
    return g.map(function (row) {
      return row.join("");
    });
  }

  function pack() {
    return { sky: grid(), far: grid(), ground: grid(), mid: grid(), near: grid() };
  }

  function linesPack(L) {
    return {
      sky: linesOf(L.sky),
      far: linesOf(L.far),
      ground: linesOf(L.ground),
      mid: linesOf(L.mid),
      near: linesOf(L.near),
    };
  }

  function drawJuno(L) {
    cloud(L.sky, 16, 6, 18);
    cloud(L.sky, 88, 9, 24);
    cloud(L.sky, 168, 5, 16);
    cloud(L.sky, 222, 10, 20);
    for (let x = 0; x < W; x++) {
      const sea = waveY(x, 36, 1, 2);
      for (let y = 28; y <= sea; y++) put(L.far, x, y, "n");
      put(L.far, x, sea, hash(x + 4) < 0.5 ? "w" : "n");
      put(L.far, x, sea + 1, "w");
    }
    speckle(L.far, 28, 38, "s", 0.08, 11);
    hull(L.far, 184, 40, 16);
    band(L.ground, 38, 50, "a");
    speckle(L.ground, 38, 50, "t", 0.16, 3);
    band(L.ground, 50, 72, "t");
    speckle(L.ground, 50, 72, "a", 0.13, 8);
    speckle(L.ground, 50, 72, "w", 0.05, 21);
    band(L.ground, 72, H, "o");
    speckle(L.ground, 72, H, "g", 0.12, 5);
    for (let x = 6; x < W; x += 17) tuft(L.near, x + (x % 5), 71, "o");
    wire(L.mid, 4, 252, 59, 8);
    [18, 52, 86, 122, 158, 194, 230].forEach(function (x) {
      hedgehog(L.mid, x, 63);
    });
    bunker(L.near, 210, 72, 14);
    hline(L.ground, 0, GROUND, W, "a");
  }

  function drawBocage(L) {
    cloud(L.sky, 36, 7, 22);
    cloud(L.sky, 148, 5, 14);
    band(L.far, 28, 46, "g");
    speckle(L.far, 28, 46, "o", 0.22, 2);
    for (let x = 0; x < W; x++) {
      const top = waveY(x, 36, 2, 9);
      put(L.far, x, top, "k");
      put(L.far, x, top + 1, "o");
    }
    pine(L.far, 18, 50, 20);
    pine(L.far, 150, 49, 18);
    pine(L.far, 246, 50, 16);
    band(L.mid, 46, 58, "o");
    speckle(L.mid, 46, 58, "g", 0.2, 4);
    speckle(L.mid, 46, 58, "k", 0.07, 6);
    for (let x = 0; x < W; x += 64) {
      rect(L.mid, x, 40, 30, 18, "o");
      speckleBox(L.mid, x, 40, 30, 18, "k", 0.14, x);
      speckleBox(L.mid, x, 40, 30, 18, "g", 0.16, x + 2);
      house(L.mid, x + 36, 58, 16, 14, false);
    }
    band(L.ground, 58, 74, "a");
    speckle(L.ground, 58, 74, "b", 0.18, 7);
    speckle(L.ground, 58, 74, "t", 0.1, 12);
    band(L.ground, 74, H, "b");
    hline(L.ground, 0, 58, W, "s");
    tuft(L.near, 68, 63, "o");
    tuft(L.near, 198, 63, "o");
    hline(L.ground, 0, GROUND, W, "a");
  }

  function drawStalingrad(L) {
    speckle(L.sky, 0, 22, "w", 0.035, 2);
    speckle(L.sky, 0, 24, "k", 0.05, 1);
    const blocks = [
      [2, 20, 24, 34],
      [28, 26, 20, 28],
      [50, 16, 30, 38],
      [84, 22, 18, 32],
      [106, 14, 34, 40],
      [144, 28, 22, 26],
      [170, 18, 28, 36],
      [202, 22, 26, 32],
      [230, 16, 24, 38],
    ];
    blocks.forEach(function (b) {
      ruin(L.far, b[0], 54, b[2], b[3]);
    });
    for (let x = 14; x < W; x += 42) {
      vline(L.mid, x, 38, 20, "k");
      hline(L.mid, x - 3, 38, 7, "s");
      put(L.mid, x + 1, 44, "k");
    }
    hull(L.mid, 116, 56, 18);
    band(L.ground, 54, H, "w");
    speckle(L.ground, 54, H, "s", 0.12, 9);
    speckle(L.ground, 54, H, "k", 0.06, 10);
    speckle(L.ground, 54, H, "b", 0.05, 11);
    rect(L.near, 68, 60, 10, 4, "k");
    rect(L.near, 198, 61, 8, 3, "s");
    hline(L.ground, 0, GROUND, W, "s");
  }

  function drawArdennes(L) {
    speckle(L.sky, 0, 30, "s", 0.07, 1);
    cloud(L.sky, 20, 7, 20);
    cloud(L.sky, 118, 4, 28);
    cloud(L.sky, 198, 8, 16);
    const clumps = [6, 14, 18, 48, 70, 76, 102, 108, 140, 168, 174, 178, 206, 230, 238];
    clumps.forEach(function (x, i) {
      pine(L.far, x, 54, 12 + ((i * 5) % 11));
    });
    band(L.ground, 48, H, "w");
    speckle(L.ground, 48, H, "n", 0.05, 4);
    speckle(L.ground, 62, H, "s", 0.045, 5);
    hline(L.ground, 0, 58, W, "s");
    band(L.ground, 59, 67, "a");
    speckle(L.ground, 59, 67, "k", 0.1, 8);
    speckle(L.ground, 59, 67, "w", 0.22, 9);
    rect(L.mid, 86, 61, 12, 4, "k");
    tuft(L.near, 88, 60, "o");
    rect(L.near, 174, 62, 8, 3, "s");
    hline(L.ground, 0, GROUND, W, "w");
  }

  function drawAlamein(L) {
    speckle(L.sky, 0, 22, "w", 0.045, 1);
    for (let x = 0; x < W; x++) {
      const ridge = waveY(x, 38, 3, 1);
      for (let y = 30; y <= ridge; y++) put(L.far, x, y, y === ridge ? "b" : "a");
    }
    band(L.ground, 40, H, "t");
    speckle(L.ground, 40, H, "a", 0.2, 2);
    speckle(L.ground, 40, H, "b", 0.09, 3);
    speckle(L.ground, 40, H, "w", 0.05, 4);
    for (let x = 0; x < W; x++) {
      const dune = waveY(x, 50, 2, 14);
      put(L.ground, x, dune, "a");
      put(L.ground, x, dune + 1, "b");
    }
    wire(L.mid, 12, 244, 58, 6);
    hull(L.mid, 60, 58, 20);
    hull(L.mid, 186, 56, 14);
    for (let x = 10; x < W; x += 20) tuft(L.near, x, 63, hash(x) < 0.45 ? "o" : "a");
    hline(L.ground, 0, GROUND, W, "a");
  }

  function drawTarawa(L) {
    cloud(L.sky, 28, 7, 16);
    cloud(L.sky, 156, 5, 22);
    for (let x = 0; x < W; x++) {
      const sea = waveY(x, 34, 1, 7);
      for (let y = 24; y <= sea; y++) put(L.far, x, y, "n");
      put(L.far, x, sea, "w");
    }
    speckle(L.far, 24, 36, "s", 0.07, 2);
    hull(L.far, 80, 38, 18);
    band(L.mid, 36, 48, "w");
    speckle(L.mid, 36, 48, "s", 0.14, 3);
    speckle(L.mid, 36, 48, "n", 0.1, 4);
    for (let x = 0; x < W; x += 7) {
      rect(L.mid, x, 47, 5, 3, "a");
      put(L.mid, x + 5, 47, "k");
      put(L.mid, x + 2, 46, "s");
    }
    palm(L.mid, 32, 63, 34);
    palm(L.mid, 44, 63, 22);
    palm(L.mid, 124, 63, 36);
    palm(L.mid, 196, 63, 30);
    palm(L.mid, 210, 63, 20);
    band(L.ground, 48, 74, "t");
    speckle(L.ground, 48, 74, "a", 0.15, 5);
    speckle(L.ground, 48, 74, "w", 0.07, 6);
    band(L.ground, 74, H, "a");
    hedgehog(L.near, 68, 63);
    hedgehog(L.near, 158, 63);
    hedgehog(L.near, 234, 63);
    hline(L.ground, 0, GROUND, W, "t");
  }

  function animFrame(id, frame) {
    const L = pack();
    if (id === "juno" || id === "tarawa") {
      const base = id === "juno" ? 36 : 34;
      for (let x = 0; x < W; x++) {
        if (hash(x * 11 + frame * 29) < 0.22) {
          put(L.far, x, waveY(x, base, 1, 2 + frame) + (frame % 2), "w");
        }
      }
    }
    if (id === "juno" || id === "bocage" || id === "ardennes" || id === "tarawa") {
      const y = 6 + (frame % 3);
      hline(L.sky, 20 + frame * 2, y, 8, "n");
    }
    if (id === "stalingrad") {
      for (let i = 0; i < 28; i++) {
        const h = hash(i * 17 + frame * 3);
        put(L.sky, Math.floor(h * W), 4 + ((i * 3 + frame * 2) % 22), h > 0.5 ? "w" : "k");
      }
    }
    if (id === "ardennes") {
      for (let i = 0; i < 36; i++) {
        const h = hash(i * 23 + 9);
        put(L.far, Math.floor(h * W), 8 + ((i * 5 + frame * 3) % 40), "w");
      }
    }
    if (id === "alamein") {
      for (let x = 0; x < W; x++) {
        if (hash(x + frame * 13) < 0.12) put(L.far, x, waveY(x, 38, 3, 1) - (frame % 2), "w");
      }
    }
    if (id === "bocage") {
      const puff = 8 - frame;
      put(L.mid, 44, puff, "s");
      put(L.mid, 108, puff + 1, "s");
      put(L.mid, 172, puff, "w");
      put(L.mid, 236, puff + 1, "s");
    }
    if (id === "tarawa") {
      const lean = frame % 2;
      [32, 44, 124, 196, 210].forEach(function (x) {
        put(L.mid, x + 6 + lean, 30, "o");
        put(L.mid, x - 5 - lean, 31, "o");
      });
    }
    return linesPack(L);
  }

  const grounds = [
    {
      id: "juno",
      name: "Juno",
      line: "Normandy. Tide going out. Hedgehogs in the sand.",
      sky: "w",
      floor: "o",
      walkTop: 50,
      walkBot: 70,
      draw: drawJuno,
    },
    {
      id: "bocage",
      name: "Bocage",
      line: "A sunken lane. Hedge on both sides, farm behind.",
      sky: "w",
      floor: "b",
      walkTop: 58,
      walkBot: 72,
      draw: drawBocage,
    },
    {
      id: "stalingrad",
      name: "Stalingrad",
      line: "Broken facades. Snow and brick on the same street.",
      sky: "s",
      floor: "w",
      walkTop: 54,
      walkBot: 72,
      draw: drawStalingrad,
    },
    {
      id: "ardennes",
      name: "Ardennes",
      line: "Winter pines and a logged road through the snow.",
      sky: "n",
      floor: "w",
      walkTop: 54,
      walkBot: 70,
      draw: drawArdennes,
    },
    {
      id: "alamein",
      name: "El Alamein",
      line: "Ridge, wire, and two wrecks on the sand.",
      sky: "t",
      floor: "t",
      walkTop: 48,
      walkBot: 70,
      draw: drawAlamein,
    },
    {
      id: "tarawa",
      name: "Tarawa",
      line: "Reef, seawall, palms. The Pacific coming in.",
      sky: "w",
      floor: "a",
      walkTop: 50,
      walkBot: 70,
      draw: drawTarawa,
    },
  ];

  const DEPTHS = [
    { key: "sky", haze: 0.48, para: 0.14, z: -64 },
    { key: "far", haze: 0.56, para: 0.32, z: -44 },
    { key: "ground", haze: 0.1, para: 1, z: -22 },
    { key: "mid", haze: 0.34, para: 0.74, z: -18 },
    { key: "near", haze: 0.04, para: 1, z: -12 },
  ];

  function rgbOf(ch) {
    const hex = palette[ch] || "#ff00ff";
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function mix(a, b, t) {
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ];
  }

  function sample(rows, x, y) {
    if (y < 0 || y >= rows.length) return null;
    const ch = rows[y][wrap(x)];
    return !ch || ch === "." ? null : ch;
  }

  function blit(img, cols, rows, land, opts) {
    const camX = opts.camX || 0;
    const drift = opts.drift || 0;
    const frame = opts.frame || 0;
    const pin = opts.pin;
    const air = rgbOf(land.sky);
    const floor = rgbOf(land.floor);
    const anim = land.anim[frame % land.anim.length];
    for (let y = 0; y < rows; y++) {
      const sy = y - pin + GROUND;
      for (let x = 0; x < cols; x++) {
        let col = sy < 0 ? air : sy >= H ? mix(floor, air, 0.12) : air;
        if (sy >= 0 && sy < H) {
          DEPTHS.forEach(function (d) {
            const shift = Math.round(camX * d.para + (d.key === "sky" ? drift : 0));
            const ch = sample(land.layers[d.key], x + shift, sy);
            if (!ch) return;
            col = mix(rgbOf(ch), air, d.haze);
            const extra = sample(anim[d.key], x + shift, sy);
            if (extra) col = mix(rgbOf(extra), air, d.haze * 0.7);
          });
        }
        const i = (y * cols + x) * 4;
        img.data[i] = col[0];
        img.data[i + 1] = col[1];
        img.data[i + 2] = col[2];
        img.data[i + 3] = 255;
      }
    }
  }

  function paintLayer(canvas, land, key, opts) {
    const depth = DEPTHS.find(function (d) { return d.key === key; });
    const tiles = opts.tiles || 5;
    const extraTop = opts.extraTop || 16;
    const extraBot = opts.extraBot || 20;
    const w = W * tiles;
    const h = extraTop + H + extraBot;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(w, h);
    const air = rgbOf(land.sky);
    const floor = rgbOf(land.floor);
    const frame = opts.frame || 0;
    const drift = opts.drift || 0;
    const anim = land.anim[frame % land.anim.length];
    for (let y = 0; y < h; y++) {
      const sy = y - extraTop;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const sx = x + (key === "sky" ? drift : 0);
        if (key === "sky") {
          let col = air;
          if (sy >= 0 && sy < H) {
            const ch = sample(land.layers.sky, sx, sy);
            if (ch) col = mix(rgbOf(ch), air, depth.haze);
            const extra = sample(anim.sky, sx, sy);
            if (extra) col = mix(rgbOf(extra), air, depth.haze * 0.7);
          }
          img.data[i] = col[0];
          img.data[i + 1] = col[1];
          img.data[i + 2] = col[2];
          img.data[i + 3] = 255;
          continue;
        }
        if (sy < 0 || sy >= H) {
          if (key === "ground" && sy >= H) {
            const col = mix(floor, air, 0.12);
            img.data[i] = col[0];
            img.data[i + 1] = col[1];
            img.data[i + 2] = col[2];
            img.data[i + 3] = 255;
          }
          continue;
        }
        const ch = sample(land.layers[key], sx, sy);
        const extra = sample(anim[key], sx, sy);
        if (!ch && !extra) continue;
        let col = ch ? mix(rgbOf(ch), air, depth.haze) : mix(rgbOf(extra), air, depth.haze);
        if (ch && extra) col = mix(rgbOf(extra), air, depth.haze * 0.7);
        img.data[i] = col[0];
        img.data[i + 1] = col[1];
        img.data[i + 2] = col[2];
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return { extraTop: extraTop, extraBot: extraBot, groundY: extraTop + GROUND };
  }

  function stampShadow(img, cols, rows, cx, cy) {
    for (let dy = 0; dy <= 1; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
        if (Math.abs(dx) + dy * 2 > 5) continue;
        const i = (y * cols + x) * 4;
        img.data[i] = img.data[i] * 0.45;
        img.data[i + 1] = img.data[i + 1] * 0.45;
        img.data[i + 2] = img.data[i + 2] * 0.45;
      }
    }
  }

  grounds.forEach(function (land) {
    const L = pack();
    land.draw(L);
    land.layers = linesPack(L);
    land.anim = [0, 1, 2, 3].map(function (frame) {
      return animFrame(land.id, frame);
    });
  });

  window.PIXEL_GROUNDS = {
    palette: palette,
    grounds: grounds,
    W: W,
    H: H,
    ground: GROUND,
    depths: DEPTHS,
    blit: blit,
    paintLayer: paintLayer,
    stampShadow: stampShadow,
  };
})();
