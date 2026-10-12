/* Front-view crew. The shared body is counted off the reference figure.
   One pixel there is the width of a leg, 12 source pixels.
   Head 2 wide and 3 tall. Neck 1. Jacket 9 by 9, hips 8 by 2.
   Side arm 3 long and 1 thick. Long arm 1 wide, down to the knee.
   Each leg 1 wide and 14 tall, with a gap of 6. Feet on one ground row.
   Forward is a six-frame slide. One leg folds along its hip. The other
   slides back straight. Frame 5 continues into frame 0.
   Standing is both legs straight, with one late pixel on the long arm.
   Sideways, both knees fold the way he is going. The foot trails
   behind the knee, not past it.
   Facing right swaps the head, the gun, and the arms. The jacket stays.
   The cast is WWII. Olive, khaki, feldgrau, brown. Helmets and peaked caps. */
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

  const W = 160;
  const H = 80;
  const GROUND = 64;
  const MID = 80;

  function grid() {
    return Array.from({ length: H }, function () {
      return Array(W).fill(".");
    });
  }

  function put(g, x, y, c) {
    x = Math.round(x);
    y = Math.round(y);
    if (y < 0 || x < 0 || y >= H || x >= W) return;
    g[y][x] = c;
  }

  function linesOf(g) {
    return g.map(function (row) {
      return row.join("");
    });
  }

  /* Down-offsets for the body. The legs use one shared slide, not these.
     Hips lead, chest and head follow, the long arm and the weapon keep
     their own clocks. A straight foot stays on the ground. */
  const base = [
    { hip: 0, chest: 0, head: 1, arm: 1, weapon: 0, reach: 0, side: 0, look: 0 },
    { hip: 0, chest: 0, head: 0, arm: 1, weapon: 0, reach: 1, side: 0, look: 0 },
    { hip: 1, chest: 0, head: 0, arm: 0, weapon: 0, reach: 1, side: 1, look: 0 },
    { hip: 1, chest: 1, head: 0, arm: 0, weapon: 0, reach: 0, side: 1, look: 0 },
    { hip: 0, chest: 1, head: 1, arm: 0, weapon: 1, reach: 1, side: 1, look: 0 },
    { hip: 0, chest: 1, head: 1, arm: 1, weapon: 1, reach: 1, side: 0, look: 0 },
  ];

  /* Right leg leads. Left leg is three frames later, so it travels
     the other way. Socket 0 is the back edge of that hip, 1 is the
     front edge, one pixel inward. The knee is bent only on the way
     forward. The way back is a straight slide. */
  const slide = [
    { socket: 0, bent: false, drop: 0 },
    { socket: 0, bent: true, drop: 0 },
    { socket: 1, bent: true, drop: 1 },
    { socket: 1, bent: false, drop: 0 },
    { socket: 1, bent: false, drop: 0 },
    { socket: 0, bent: false, drop: 0 },
  ];

  /* Not the hip slide. x is a trail behind the direction of travel.
     The knee folds that same direction. One foot stays down. The
     straight plant creeps back one pixel, twice a cycle. Frame 5
     continues into frame 0. */
  const side = [
    { x: 0, bent: false, drop: 0 },
    { x: -1, bent: false, drop: 0 },
    { x: -1, bent: true, drop: 0 },
    { x: -1, bent: true, drop: 1 },
    { x: 0, bent: true, drop: 1 },
    { x: 0, bent: false, drop: 0 },
  ];

  /* Frame 0 is the leading step, not the rear plant.
     Forward starts on the bent reach. Sideways starts on the
     travel-side knee already committed. */
  const FORWARD_LEAD = 2;
  const SIDE_LEAD = 4;

  /* Standing fidgets. Frame 0 is rest. The others glance, move an arm,
     or shift. No head or chest bob. look is -1, 0, or 1. */
  const IDLE = [
    { hip: 0, chest: 0, head: 0, arm: 0, weapon: 0, reach: 0, side: 0, look: 0 },
    { hip: 0, chest: 0, head: 0, arm: 0, weapon: 0, reach: 0, side: 0, look: -1 },
    { hip: 0, chest: 0, head: 0, arm: 1, weapon: 0, reach: 0, side: 0, look: -1 },
    { hip: 0, chest: 0, head: 0, arm: 1, weapon: 0, reach: 0, side: 0, look: 0 },
    { hip: 0, chest: 0, head: 0, arm: 0, weapon: 0, reach: 0, side: 0, look: 1 },
    { hip: 0, chest: 0, head: 0, arm: 0, weapon: 0, reach: 1, side: 1, look: 1 },
    { hip: 0, chest: 0, head: 0, arm: 0, weapon: 1, reach: 1, side: 1, look: 0 },
    { hip: 0, chest: 0, head: 0, arm: 0, weapon: 0, reach: 0, side: 0, look: 0 },
    { hip: 0, chest: 1, head: 0, arm: 0, weapon: 0, reach: 0, side: 0, look: 0 },
    { hip: 0, chest: 0, head: 0, arm: 0, weapon: 0, reach: 0, side: 0, look: 0 },
  ];

  function idlePoses(spec) {
    return (spec.idle || IDLE).map(function (pose) {
      return {
        hip: pose.hip || 0,
        chest: pose.chest || 0,
        head: pose.head || 0,
        arm: pose.arm || 0,
        weapon: pose.weapon || 0,
        reach: pose.reach || 0,
        side: pose.side || 0,
        look: pose.look == null ? 0 : pose.look,
      };
    });
  }

  function withWalk(over) {
    return base.map(function (pose, i) {
      const next = Object.assign({}, pose);
      Object.keys(over).forEach(function (key) {
        if (over[key].length !== base.length) throw new Error(key + " walk length");
        next[key] = over[key][i];
      });
      return next;
    });
  }

  function checkWalk(id, poses) {
    const keys = ["hip", "chest", "head", "arm", "weapon", "reach", "side", "look"];
    for (let i = 0; i < poses.length; i++) {
      const a = poses[i];
      const b = poses[(i + 1) % poses.length];
      keys.forEach(function (key) {
        if (Math.abs(a[key] - b[key]) > 1) {
          throw new Error(id + " " + key + " pops between " + i + " and " + ((i + 1) % poses.length));
        }
      });
      ["chest", "head", "arm", "weapon"].forEach(function (key) {
        if (Math.abs(a[key] - a.hip) > 1 || Math.abs(a[key] - a.chest) > 1) {
          throw new Error(id + " " + key + " tears on frame " + i);
        }
      });
    }
  }

  function rests(spec) {
    if (spec.chair) {
      const r = spec.wheelR || 8;
      const hipTop = GROUND - r - spec.hipH + 1;
      const chestTop = hipTop - spec.chestH;
      return {
        legTop: hipTop + spec.hipH,
        hipTop: hipTop,
        chestTop: chestTop,
        headTop: chestTop - 1 - (spec.headH || 3),
        waist: chestTop + spec.chestH - 2,
        armTop: chestTop + 2,
      };
    }
    const legTop = GROUND - spec.leg + 1;
    const hipTop = legTop - spec.hipH;
    const chestTop = hipTop - spec.chestH;
    return {
      legTop: legTop,
      hipTop: hipTop,
      chestTop: chestTop,
      headTop: chestTop - 1 - (spec.headH || 3),
      waist: chestTop + spec.chestH - 2,
      armTop: chestTop + 2,
    };
  }

  function headBox(spec, faceRight, glance, lean) {
    const w = spec.headW || 2;
    const h = spec.headH || 3;
    const shift = glance === -1 ? (faceRight ? 1 : -1) : 0;
    const left = MID - Math.floor(w / 2) + shift + (lean || 0);
    const right = left + w - 1;
    let faceCol = faceRight ? right : left;
    let markCol = faceRight ? left : right;
    if (glance === 1) {
      const swap = faceCol;
      faceCol = markCol;
      markCol = swap;
    }
    return { w: w, h: h, left: left, right: right, faceCol: faceCol, markCol: markCol };
  }

  function pistol(g, x, y, dir) {
    const s = dir === 1 ? 1 : -1;
    put(g, x, y, "k");
    put(g, x + s, y, "k");
    put(g, x + 2 * s, y, "k");
    put(g, x + 3 * s, y, "a");
    put(g, x + s, y + 1, "k");
  }

  function rifle(g, x, y, dir) {
    const s = dir === 1 ? 1 : -1;
    put(g, x - s, y + 1, "k");
    for (let i = 0; i < 7; i++) put(g, x + i * s, y, "k");
    put(g, x + 7 * s, y, "a");
    put(g, x + s, y + 1, "k");
    put(g, x + 2 * s, y + 1, "k");
  }

  function sword(g, x, y, len) {
    put(g, x, y, "k");
    put(g, x, y + 1, "k");
    for (let i = 1; i <= len; i++) put(g, x, y - i, "t");
    put(g, x, y - len - 1, "a");
  }

  function cannon(g, x, y, dir) {
    const s = dir === 1 ? 1 : -1;
    for (let i = 0; i < 7; i++) {
      put(g, x + i * s, y, "k");
      put(g, x + i * s, y + 1, "k");
    }
    put(g, x + 7 * s, y, "a");
    put(g, x + 7 * s, y + 1, "a");
    put(g, x + s, y + 2, "s");
  }

  function smallGun(g, x, y, dir) {
    const s = dir === 1 ? 1 : -1;
    put(g, x, y, "k");
    put(g, x + s, y, "k");
    put(g, x + 2 * s, y, "k");
    put(g, x + 3 * s, y, "g");
    put(g, x + s, y + 1, "k");
  }

  function spear(g, x, y, dir) {
    const s = dir === 1 ? 1 : -1;
    for (let i = 0; i <= 7; i++) put(g, x + i * s, y - i, "k");
    put(g, x + 8 * s, y - 8, "t");
    put(g, x + 8 * s, y - 9, "a");
  }

  function stick(g, x, y) {
    for (let i = 0; i < 6; i++) put(g, x, y - i, i === 0 ? "k" : "a");
  }

  function binocs(g, x, y, dir) {
    const s = dir === 1 ? 1 : -1;
    put(g, x, y, "k");
    put(g, x + s, y, "k");
    put(g, x, y + 1, "s");
    put(g, x + s, y + 1, "s");
  }

  function tipOfKind(kind, x, y, dir) {
    const s = dir === 1 ? 1 : -1;
    if (!kind || kind === "none") return { x: x + 2 * s, y: y };
    if (kind === "rifle" || kind === "cannon") return { x: x + 8 * s, y: y };
    if (kind === "shot") return { x: x + 5 * s, y: y };
    if (kind === "thompson") return { x: x + 5 * s, y: y };
    if (kind === "smg" || kind === "mp40" || kind === "ppsh") return { x: x + 4 * s, y: y };
    if (kind === "pistol" || kind === "pistols" || kind === "small") return { x: x + 4 * s, y: y };
    if (kind === "spear") return { x: x + 8 * s, y: y - 8 };
    if (kind === "stick") return { x: x, y: y - 6 };
    if (kind === "binocs") return { x: x + 2 * s, y: y };
    return { x: x + 3 * s, y: y };
  }

  function drawWeapon(g, kind, x, y, dir) {
    if (!kind || kind === "none") return;
    if (kind === "stick") return stick(g, x, y);
    if (kind === "binocs") return binocs(g, x, y, dir);
    if (kind === "rifle") rifle(g, x, y, dir);
    else if (kind === "sword") sword(g, x, y, 5);
    else if (kind === "pistols") pistol(g, x, y, dir);
    else if (kind === "cannon") cannon(g, x, y, dir);
    else if (kind === "swordpistol") sword(g, x, y, 4);
    else if (kind === "small") smallGun(g, x, y, dir);
    else if (kind === "bigsword") sword(g, x, y, 8);
    else if (kind === "spear") spear(g, x, y, dir);
    else if (kind === "smg" || kind === "mp40") smg(g, x, y, dir);
    else if (kind === "thompson") thompson(g, x, y, dir);
    else if (kind === "ppsh") ppsh(g, x, y, dir);
    else if (kind === "pistol") pistol(g, x, y, dir);
    else if (kind === "shot") shot(g, x, y, dir);
  }

  function thompson(g, x, y, dir) {
    const s = dir === 1 ? 1 : -1;
    put(g, x, y, "k");
    put(g, x + s, y, "k");
    put(g, x + 2 * s, y, "k");
    put(g, x + 3 * s, y, "k");
    put(g, x + 4 * s, y, "a");
    put(g, x, y + 1, "k");
    put(g, x + s, y + 1, "k");
    put(g, x + 2 * s, y + 1, "s");
  }

  function ppsh(g, x, y, dir) {
    const s = dir === 1 ? 1 : -1;
    put(g, x, y, "k");
    put(g, x + s, y, "k");
    put(g, x + 2 * s, y, "k");
    put(g, x + 3 * s, y, "a");
    put(g, x, y + 1, "s");
    put(g, x + s, y + 1, "s");
    put(g, x + 2 * s, y + 1, "s");
  }

  function smg(g, x, y, dir) {
    const s = dir === 1 ? 1 : -1;
    put(g, x, y, "k");
    put(g, x + s, y, "k");
    put(g, x + 2 * s, y, "k");
    put(g, x + 3 * s, y, "a");
    put(g, x, y + 1, "k");
    put(g, x + s, y + 1, "s");
  }

  function shot(g, x, y, dir) {
    const s = dir === 1 ? 1 : -1;
    for (let i = 0; i < 4; i++) {
      put(g, x + i * s, y, "k");
      put(g, x + i * s, y + 1, "k");
    }
    put(g, x + 4 * s, y, "a");
    put(g, x + 4 * s, y + 1, "a");
    put(g, x + s, y + 2, "s");
  }

  /* Eight poses. Frame 0 is the leading foot already folded.
     The other leg is four frames behind, so it is planted while this one steps.
     x is in step-pixels (scaled to the leg). y is percent of hem-to-ground.
     A knee only folds back. On the swing, the knee goes the way he is
     walking and the foot trails behind it. The old gait kicked the shin
     past the knee, the wrong way. */
  const WALK_N = 8;
  const gait = [
    { kx: 2, ky: 40, fx: -1, fy: 46, toe: -1, plant: false },
    { kx: 2, ky: 48, fx: 0, fy: 56, toe: -1, plant: false },
    { kx: 1, ky: 34, fx: 0, fy: 40, toe: 0, plant: false },
    { kx: 1, ky: 56, fx: 2, fy: 100, toe: 1, plant: true },
    { kx: 0, ky: 50, fx: 0, fy: 100, toe: 0, plant: true },
    { kx: -1, ky: 50, fx: -1, fy: 100, toe: 0, plant: true },
    { kx: -1, ky: 44, fx: -2, fy: 100, toe: -1, plant: true },
    { kx: 1, ky: 38, fx: -1, fy: 42, toe: -1, plant: false },
  ];

  function linePix(x0, y0, x1, y1) {
    const pts = [];
    const dx = x1 - x0;
    const dy = y1 - y0;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    if (steps === 0) return [[x0, y0]];
    for (let i = 0; i <= steps; i++) {
      pts.push([Math.round(x0 + (dx * i) / steps), Math.round(y0 + (dy * i) / steps)]);
    }
    return pts;
  }

  function stampLeg(g, x, y, legW, taken) {
    if (!g[y]) return;
    for (let w = 0; w < legW; w++) {
      const col = x + w;
      if (col < 0 || col >= W) continue;
      const key = col + "," + y;
      if (taken[key]) put(g, col, y, "s");
      else {
        put(g, col, y, "k");
        taken[key] = 1;
      }
    }
  }

  function reachOf(span) {
    return Math.max(1, Math.min(4, Math.round(span / 3.5)));
  }

  /* Hip, knee, shin, foot. The first pixel is the hem row. */
  function drawChain(g, hipX, hemY, legW, stepDir, pose, light, taken) {
    const span = Math.max(2, GROUND - hemY);
    const reach = reachOf(span);
    const sx = function (v) { return Math.round((v * reach) / 4) * stepDir; };
    const kneeX = hipX + sx(pose.kx);
    const kneeY = Math.min(GROUND - 2, hemY + Math.max(2, Math.round((span * pose.ky) / 100)));
    let footY = pose.plant ? GROUND : hemY + Math.round((span * pose.fy) / 100);
    if (!pose.plant) footY = Math.max(kneeY, Math.min(GROUND - 1, footY));
    const footX = hipX + sx(pose.fx);
    linePix(hipX, hemY, kneeX, kneeY).forEach(function (p) { stampLeg(g, p[0], p[1], legW, taken); });
    linePix(kneeX, kneeY, footX, footY).forEach(function (p) { stampLeg(g, p[0], p[1], legW, taken); });
    if (pose.toe !== 0) put(g, footX + sx(pose.toe), footY, light ? "t" : "k");
    else if (light && pose.plant) put(g, footX + (stepDir > 0 ? legW - 1 : 0), footY, "t");
    if (pose.plant && pose.fx !== 0) put(g, footX - stepDir, footY, "s");
    if (pose.plant) put(g, footX, GROUND + 1, "s");
    return { hipX: hipX, hipY: hemY, kneeX: kneeX, kneeY: kneeY, footX: footX, footY: footY };
  }

  function drawPlanted(g, hipX, hemY, legW, toeDir, light, taken) {
    for (let y = hemY; y <= GROUND; y++) stampLeg(g, hipX, y, legW, taken);
    const toeX = toeDir > 0 ? hipX + legW : hipX - 1;
    put(g, toeX, GROUND, light ? "t" : "k");
    put(g, hipX, GROUND + 1, "s");
  }

  const JUMP = [
    { lift: 0, hip: 3, chest: 2, head: 2, arm: 1, weapon: 1, reach: 0, side: 0, look: 0, legs: "coil" },
    { lift: 3, hip: 0, chest: 0, head: 0, arm: 0, weapon: 0, reach: 1, side: 0, look: 0, legs: "push" },
    { lift: 7, hip: 0, chest: 0, head: 0, arm: 0, weapon: -1, reach: 1, side: -1, look: 0, legs: "tuck" },
    { lift: 9, hip: 0, chest: 0, head: 0, arm: 1, weapon: -1, reach: 0, side: 0, look: 0, legs: "tuck" },
    { lift: 5, hip: 0, chest: 1, head: 1, arm: 0, weapon: 0, reach: 0, side: 0, look: 0, legs: "fall" },
    { lift: 0, hip: 2, chest: 2, head: 1, arm: 1, weapon: 1, reach: 0, side: 0, look: 0, legs: "coil" },
  ];

  function drawJumpLegs(g, hipLeft, hemY, spec, style, faceRight, taken) {
    const left = hipLeft;
    const right = hipLeft + spec.hipW - spec.legW;
    const dir = faceRight ? 1 : -1;
    if (style === "coil") {
      drawChain(g, left, hemY, spec.legW, -1, { kx: 1, ky: 62, fx: 0, fy: 100, toe: 0, plant: true }, false, taken);
      drawChain(g, right, hemY, spec.legW, 1, { kx: 1, ky: 64, fx: 1, fy: 100, toe: 1, plant: true }, true, taken);
    } else if (style === "push") {
      drawChain(g, left, hemY, spec.legW, -dir, { kx: 0, ky: 42, fx: -1, fy: 100, toe: 0, plant: true }, false, taken);
      drawChain(g, right, hemY, spec.legW, dir, { kx: 2, ky: 36, fx: 1, fy: 48, toe: 1, plant: false }, true, taken);
    } else if (style === "tuck") {
      const kneeY = hemY + 4;
      const footY = hemY + 6;
      [[left, -1, false], [right, 1, true]].forEach(function (leg) {
        const kneeX = leg[0] + leg[1];
        linePix(leg[0], hemY, kneeX, kneeY).forEach(function (p) { stampLeg(g, p[0], p[1], spec.legW, taken); });
        linePix(kneeX, kneeY, leg[0], footY).forEach(function (p) { stampLeg(g, p[0], p[1], spec.legW, taken); });
        put(g, leg[0], footY, leg[2] ? "t" : "k");
      });
    } else {
      drawChain(g, left, hemY, spec.legW, -1, { kx: 0, ky: 52, fx: 0, fy: 88, toe: 0, plant: false }, false, taken);
      drawChain(g, right, hemY, spec.legW, 1, { kx: 1, ky: 48, fx: 1, fy: 82, toe: 1, plant: false }, true, taken);
    }
  }

  function drawHat(g, kind, faceRight, headTop, glance, spec, lean) {
    if (!kind) return;
    const box = headBox(spec || {}, faceRight, glance === -1 ? -1 : glance, lean);
    const faceCol = box.faceCol;
    const markCol = box.markCol;
    const brim = faceRight ? 1 : -1;
    const left = box.left;
    const right = box.right;
    if (kind === "m1") {
      put(g, left, headTop - 1, "g");
      put(g, right, headTop - 1, "g");
      put(g, left, headTop, "g");
      put(g, right, headTop, "s");
      put(g, left + brim, headTop, "g");
    } else if (kind === "brodie") {
      put(g, left - 1, headTop, "g");
      put(g, left, headTop - 1, "g");
      put(g, right, headTop - 1, "g");
      put(g, right + 1, headTop, "g");
      put(g, left, headTop, "s");
      put(g, right, headTop, "s");
    } else if (kind === "stahl") {
      put(g, left, headTop - 1, "g");
      put(g, right, headTop - 1, "g");
      put(g, left - 1, headTop, "g");
      put(g, left, headTop, "s");
      put(g, right, headTop, "s");
      put(g, right + 1, headTop, "g");
    } else if (kind === "ushanka") {
      put(g, left - 1, headTop, "b");
      put(g, left, headTop - 1, "b");
      put(g, right, headTop - 1, "b");
      put(g, right + 1, headTop, "b");
      put(g, left, headTop, "s");
      put(g, right, headTop, "s");
    } else if (kind === "peak") {
      put(g, left, headTop - 1, "o");
      put(g, right, headTop - 1, "o");
      put(g, faceCol + brim, headTop, "s");
      put(g, markCol, headTop - 1, "s");
    } else if (kind === "schirm") {
      put(g, left, headTop - 2, "g");
      put(g, right, headTop - 2, "g");
      put(g, left, headTop - 1, "g");
      put(g, right, headTop - 1, "s");
      put(g, faceCol + brim, headTop, "k");
    } else if (kind === "fieldcap") {
      put(g, left, headTop - 1, "t");
      put(g, right, headTop - 1, "t");
      put(g, faceCol + brim, headTop, "s");
    } else if (kind === "cap") {
      put(g, faceCol, headTop - 1, "k");
      put(g, markCol, headTop - 1, "k");
      put(g, faceCol + brim, headTop, "k");
    } else if (kind === "brim") {
      put(g, faceCol, headTop - 1, "k");
      put(g, markCol, headTop - 1, "k");
      put(g, faceCol + brim, headTop - 1, "k");
      put(g, markCol - brim, headTop - 1, "k");
      put(g, faceCol + brim, headTop, "k");
    } else if (kind === "helm") {
      put(g, faceCol, headTop - 1, "g");
      put(g, markCol, headTop - 1, "g");
      put(g, faceCol, headTop, "g");
      put(g, markCol, headTop, "s");
    } else if (kind === "medic") {
      put(g, left, headTop - 1, "w");
      put(g, right, headTop - 1, "w");
      put(g, left, headTop, "r");
      put(g, right, headTop, "w");
      put(g, left + brim, headTop, "g");
    } else if (kind === "jump") {
      put(g, left, headTop - 1, "g");
      put(g, right, headTop - 1, "g");
      put(g, left, headTop, "g");
      put(g, right, headTop, "s");
      put(g, faceCol, headTop + 1, "k");
    } else if (kind === "fj") {
      put(g, left, headTop - 1, "g");
      put(g, right, headTop - 1, "g");
      put(g, left - 1, headTop, "g");
      put(g, left, headTop, "s");
      put(g, right, headTop, "s");
      put(g, right + 1, headTop, "g");
      put(g, faceCol, headTop + 1, "k");
    } else if (kind === "flight") {
      put(g, left, headTop - 1, "b");
      put(g, right, headTop - 1, "b");
      put(g, left, headTop, "k");
      put(g, right, headTop, "k");
      put(g, left - 1, headTop, "b");
      put(g, right + 1, headTop, "b");
    } else if (kind === "luftcap") {
      put(g, left, headTop - 1, "n");
      put(g, right, headTop - 1, "n");
      put(g, faceCol + brim, headTop, "s");
    } else if (kind === "homburg") {
      put(g, left - 1, headTop - 2, "k");
      put(g, left, headTop - 2, "k");
      put(g, right, headTop - 2, "k");
      put(g, right + 1, headTop - 2, "k");
      put(g, left, headTop - 1, "s");
      put(g, right, headTop - 1, "s");
      put(g, left - 1, headTop, "k");
      put(g, right + 1, headTop, "k");
    } else if (kind === "fedora") {
      put(g, left, headTop - 2, "k");
      put(g, right, headTop - 2, "k");
      put(g, left - 1, headTop - 1, "k");
      put(g, left, headTop - 1, "s");
      put(g, right, headTop - 1, "s");
      put(g, right + 1, headTop - 1, "k");
      put(g, left - 2, headTop, "k");
      put(g, right + 2, headTop, "k");
    } else if (kind === "sidepart") {
      put(g, left - 1, headTop - 1, "k");
      put(g, left, headTop - 1, "k");
      put(g, right, headTop - 1, "k");
      put(g, left - 1, headTop, "k");
      put(g, left, headTop, "k");
    } else if (kind === "marshal") {
      for (let x = left; x <= right; x++) {
        put(g, x, headTop - 2, "b");
        put(g, x, headTop - 1, x === right ? "s" : "b");
      }
      put(g, faceCol + brim, headTop, "k");
      put(g, left + Math.floor((right - left) / 2), headTop - 1, "r");
    }
  }

  function drawPack(g, kind, faceRight, chestLeft, chestRight, chestTop, chestH) {
    if (!kind) return;
    const back = faceRight ? chestLeft - 3 : chestRight + 1;
    const top = chestTop + 1;
    if (kind === "pack" || kind === "tank") {
      const h = Math.min(kind === "tank" ? 5 : 4, chestH - 1);
      for (let y = 0; y < h; y++) {
        put(g, back, top + y, "b");
        put(g, back + 1, top + y, y === 0 || y === h - 1 ? "s" : "b");
        put(g, back + 2, top + y, "s");
      }
      const strap = faceRight ? chestLeft : chestRight;
      put(g, strap, chestTop + 1, "k");
      put(g, strap, chestTop + 2, "k");
    } else if (kind === "roll") {
      put(g, back, chestTop, "b");
      put(g, back + 1, chestTop, "b");
      put(g, back + 2, chestTop, "s");
      put(g, back, chestTop + 1, "s");
      put(g, back + 1, chestTop + 1, "s");
    } else if (kind === "pouch") {
      put(g, back + 1, top + 1, "b");
      put(g, back + 2, top + 1, "s");
      put(g, back + 1, top + 2, "s");
    }
  }

  /* One garment. Collar, one opening, a hem. Not a scatter of marks. */
  function dress(g, spec, chestLeft, chestTop, chestW, chestH) {
    const cloth = spec.coat || "g";
    const extra = spec.long || 0;
    const chestRight = chestLeft + chestW - 1;
    const mid = chestLeft + Math.floor(chestW / 2);
    const tall = chestH + extra;
    const vest = spec.vest;
    const shirt = spec.shirt || "t";
    for (let y = 0; y < tall; y++) {
      for (let x = 0; x < chestW; x++) {
        const px = chestLeft + x;
        const py = chestTop + y;
        if (vest && x > 0 && x < chestW - 1 && y >= 2 && y < chestH - 1) {
          put(g, px, py, shirt);
        } else {
          put(g, px, py, cloth);
        }
      }
    }
    put(g, chestLeft + 1, chestTop, "s");
    put(g, chestRight - 1, chestTop, "s");
    if (chestW >= 6) {
      put(g, mid, chestTop, cloth);
      for (let y = 2; y < tall - 1; y++) put(g, mid, chestTop + y, "s");
    }
    for (let x = 0; x < chestW; x++) put(g, chestLeft + x, chestTop + tall - 1, "s");
    for (let y = 1; y < tall - 1; y++) put(g, chestRight, chestTop + y, "s");
    if (spec.webbing && tall > 3) {
      for (let x = 0; x < chestW; x++) put(g, chestLeft + x, chestTop + tall - 2, "k");
    }
  }

  function drawKit(g, spec, faceRight, hangX, hangTop, chestLeft, chestRight, chestTop) {
    const inw = faceRight ? 1 : -1;
    if (spec.band) {
      const y = hangTop + 3;
      put(g, hangX, y, "r");
      put(g, hangX, y + 1, "w");
      put(g, hangX, y + 2, "r");
      put(g, hangX + inw, y + 1, "k");
    }
    if (spec.medic) {
      const y = hangTop + 3;
      put(g, hangX, y, "w");
      put(g, hangX, y + 1, "r");
      put(g, hangX, y + 2, "w");
      put(g, hangX + inw, y + 1, "r");
    }
    const n = spec.chevrons || 0;
    let y = hangTop + (spec.band || spec.medic ? 7 : 3);
    for (let c = 0; c < n; c++) {
      put(g, hangX, y, "k");
      put(g, hangX + inw, y + 1, "k");
      y += 2;
    }
    const pips = spec.pips || 0;
    const pipX = faceRight ? chestRight - 1 : chestLeft + 1;
    for (let i = 0; i < pips; i++) put(g, pipX, chestTop + 1 + i, "t");
    if (spec.litzen) {
      put(g, chestLeft + 1, chestTop + 1, "t");
      put(g, chestLeft + 2, chestTop + 1, "w");
      put(g, chestRight - 1, chestTop + 1, "t");
    }
  }

  function drawTells(g, spec, faceRight, chestLeft, chestRight, chestTop, hipLeft, hipW, hipTop) {
    const mid = chestLeft + Math.floor((chestRight - chestLeft + 1) / 2);
    const flip = faceRight ? -1 : 1;
    if (spec.scarf) {
      put(g, mid, chestTop, spec.scarf);
      put(g, mid + flip, chestTop + 1, spec.scarf);
      put(g, mid + flip, chestTop + 2, spec.scarf);
    }
    if (spec.cross) {
      put(g, mid, chestTop + 2, "r");
      put(g, mid - 1, chestTop + 3, "r");
      put(g, mid, chestTop + 3, "r");
      put(g, mid + 1, chestTop + 3, "r");
      put(g, mid, chestTop + 4, "r");
    }
    if (spec.chute) {
      for (let y = 2; y <= 5; y++) {
        put(g, mid - 1, chestTop + y, "w");
        put(g, mid, chestTop + y, "k");
        put(g, mid + 1, chestTop + y, "w");
      }
    }
    if (spec.hipsword) {
      const x = hipLeft + hipW;
      put(g, x, hipTop, "k");
      put(g, x, hipTop + 1, "k");
      put(g, x, hipTop + 2, "t");
    }
    if (spec.bow) {
      put(g, mid - 1, chestTop, "k");
      put(g, mid, chestTop, "r");
      put(g, mid + 1, chestTop, "k");
    }
  }

  function drawSideArm(g, spec, pose, faceRight, chestLeft, chestRight, waist) {
    const cloth = spec.coat || "g";
    const droop = pose.side || 0;
    const handX = faceRight
      ? chestRight + spec.reach + pose.reach
      : chestLeft - spec.reach - pose.reach;
    const shoulderX = faceRight ? chestRight : chestLeft;
    const span = handX - shoulderX;
    const elbowX = shoulderX + (span >= 0 ? Math.max(1, Math.floor(span / 2)) : Math.min(-1, Math.ceil(span / 2)));
    const elbowY = waist + 1 + droop;
    const handY = waist + droop;
    const thick = spec.armT;
    function stroke(x0, y0, x1, y1, c) {
      linePix(x0, y0, x1, y1).forEach(function (p) {
        for (let t = 0; t < thick; t++) put(g, p[0], p[1] + t, c);
      });
    }
    stroke(shoulderX, waist, elbowX, elbowY, cloth);
    stroke(elbowX, elbowY, handX, handY, cloth);
    put(g, handX, handY, "k");
    put(g, handX, handY + thick, "s");
    return { handX: handX, handY: handY };
  }

  function recoilPoses(face) {
    const away = face === "right" ? -1 : face === "left" ? 1 : 0;
    return [
      { chest: 1, head: 1, arm: 1, weapon: -2, reach: -2, side: -1, lean: away },
      { chest: 0, head: 0, arm: 0, weapon: -1, reach: -1, side: 0, lean: 0 },
    ];
  }

  function framesFor(spec, mode, face, kick) {
    const jumping = mode === "jump";
    const poses = jumping ? JUMP : mode === "stand" ? idlePoses(spec) : spec.poses;
    if (!jumping) checkWalk(spec.id, poses);
    const rec = kick == null
      ? { chest: 0, head: 0, arm: 0, weapon: 0, reach: 0, side: 0, lean: 0 }
      : recoilPoses(face)[kick];
    if (!spec.chair && spec.leg < 8) {
      throw new Error(spec.id + " legs are gone");
    }
    const gap = spec.hipW - spec.legW * 2;
    if (gap < 3) throw new Error(spec.id + " legs have no gap");
    const rest = rests(spec);
    const sideProof = { left: false, right: false, outer: false };
    const sequence = jumping
      ? poses
      : kick != null && mode === "stand"
        ? [poses[0]]
        : mode === "stand"
          ? poses
          : Array.from({ length: WALK_N }, function (_, i) {
            return poses[i % poses.length];
          });

    const muzzles = [];
    const frames = sequence.map(function (pose, frame) {
      const g = grid();
      const lean = rec.lean || 0;
      const up = pose.lift || 0;
      const hipLeft = MID - Math.floor(spec.hipW / 2);
      const chestLeft = MID - Math.floor(spec.chestW / 2) + lean;
      const chestRight = chestLeft + spec.chestW - 1;
      const hipTop = rest.hipTop + pose.hip - up;
      const legTop = hipTop + spec.hipH;
      const chestTop = rest.chestTop + pose.chest + rec.chest - up;
      const headTop = rest.headTop + pose.head + rec.head - up;
      const waist = rest.waist + pose.chest + rec.chest - up;
      const cloth = spec.coat || "g";
      const body = {
        hip: pose.hip,
        chest: pose.chest + rec.chest,
        head: pose.head + rec.head,
        arm: (pose.arm || 0) + rec.arm,
        weapon: pose.weapon + rec.weapon,
        reach: pose.reach + rec.reach,
        side: (pose.side || 0) + rec.side,
        look: pose.look,
      };

      const extra = spec.long || 0;
      const jacketHem = rest.chestTop + spec.chestH - 1 + extra + pose.chest - up;
      const pantsTop = Math.min(hipTop, jacketHem);
      const pantsBot = Math.max(hipTop + spec.hipH - 1, jacketHem);
      const hemY = jacketHem;
      for (let y = pantsTop; y <= pantsBot; y++) {
        for (let x = 0; x < spec.hipW; x++) put(g, hipLeft + x, y, "k");
      }
      put(g, hipLeft + spec.hipW - 1, hemY, "s");

      dress(g, spec, chestLeft, chestTop, spec.chestW, spec.chestH);
      drawTells(g, spec, face === "right", chestLeft, chestRight, chestTop, hipLeft, spec.hipW, hipTop);
      drawPack(g, spec.pack, face === "right", chestLeft, chestRight, chestTop, spec.chestH);

      const hang = spec.hang != null ? spec.hang : Math.floor(spec.leg / 2);
      const faceRight = face === "right";
      /* Shoulders sit on the jacket corners. The hanging arm grows from
         one of them, one pixel out, so it cannot float. */
      const hangX = faceRight ? chestLeft - spec.armT : chestRight + 1;
      const gunShoulder = faceRight ? chestRight : chestLeft;
      const hangShoulder = faceRight ? chestLeft : chestRight;
      put(g, gunShoulder, chestTop, cloth);
      put(g, gunShoulder, chestTop + 1, cloth);
      put(g, hangShoulder, chestTop, cloth);
      put(g, hangShoulder, chestTop + 1, cloth);
      for (let t = 0; t < spec.armT; t++) {
        put(g, hangX + t, chestTop + 1, cloth);
      }
      const hangTop = chestTop + 1 + body.arm;
      const hangBot = rest.hipTop + spec.hipH + hang - up;
      for (let y = hangTop; y <= hangBot; y++) {
        for (let t = 0; t < spec.armT; t++) put(g, hangX + t, y, cloth);
      }
      for (let t = 0; t < spec.armT; t++) put(g, hangX + t, hangBot, "t");
      drawKit(g, spec, faceRight, hangX, hangTop, chestLeft, chestRight, chestTop);
      const armX = hangX;
      const armBot = hangBot;

      const empty = !spec.kind || spec.kind === "none";
      let gunArm = { handX: hangX, handY: hangBot };
      if (empty) {
        /* Nothing to aim. The gun-side arm hangs straight, same
           length as the other, one pixel out from the shoulder. */
        const emptyX = faceRight ? chestRight + 1 : chestLeft - spec.armT;
        const emptyTop = chestTop + 1 + body.side;
        const emptyBot = rest.hipTop + spec.hipH + hang - up;
        for (let t = 0; t < spec.armT; t++) {
          put(g, emptyX + t, chestTop + 1, cloth);
        }
        for (let y = emptyTop; y <= emptyBot; y++) {
          for (let t = 0; t < spec.armT; t++) put(g, emptyX + t, y, cloth);
        }
        for (let t = 0; t < spec.armT; t++) put(g, emptyX + t, emptyBot, "t");
      } else {
        gunArm = drawSideArm(g, spec, body, faceRight, chestLeft, chestRight, waist);
      }

      const aim = faceRight ? 1 : -1;
      if (!empty && spec.kind === "spear") {
        const prev = poses[(frame + poses.length - 1) % poses.length];
        const prevHand = faceRight
          ? chestRight + spec.reach + prev.reach
          : chestLeft - spec.reach - prev.reach;
        const prevY = rest.waist + prev.chest + (prev.side || 0);
        spear(g, prevHand, prevY, aim);
      } else if (!empty) {
        drawWeapon(g, spec.kind, gunArm.handX, gunArm.handY + body.weapon, aim);
      }
      muzzles.push(tipOfKind(spec.kind, gunArm.handX, gunArm.handY + (empty ? 0 : body.weapon), aim));

      const longGrip = faceRight ? armX + spec.armT - 1 : armX;
      if (spec.kind === "pistols") pistol(g, longGrip, armBot, aim);
      if (spec.kind === "sword") {
        put(g, hipLeft + spec.hipW - 2, hipTop, "k");
        put(g, hipLeft + spec.hipW - 2, hipTop + 1, "a");
      }
      if (spec.kind === "swordpistol") pistol(g, longGrip, armBot, aim);

      const glance = pose.look == null ? 0 : pose.look;
      const head = headBox(spec, faceRight, glance, lean);
      const faceCol = head.faceCol;
      const markCol = head.markCol;
      for (let y = 0; y < head.h; y++) {
        for (let x = head.left; x <= head.right; x++) {
          const faceSide = faceRight ? x >= head.left + Math.floor(head.w / 2) : x <= head.right - Math.floor(head.w / 2);
          put(g, x, headTop + y, faceSide ? "t" : "a");
        }
      }
      if (spec.jowl && head.w < 3) {
        put(g, head.left - 1, headTop + head.h - 1, "t");
        put(g, head.right + 1, headTop + head.h - 1, "a");
      }
      if (spec.glasses) {
        put(g, head.left - 1, headTop + 1, "k");
        put(g, head.right + 1, headTop + 1, "k");
        put(g, faceCol, headTop + 1, "s");
        put(g, markCol, headTop + 1, "s");
      }
      if (spec.stache === "wide") {
        for (let x = head.left; x <= head.right; x++) put(g, x, headTop + head.h - 1, "k");
      } else if (spec.stache) {
        put(g, faceCol, headTop + head.h - 1, "k");
      }
      const lip = headTop + head.h - 1;
      if (spec.cigar) {
        const out = faceRight ? 1 : -1;
        put(g, faceCol + out, lip, "a");
        put(g, faceCol + out * 2, lip, "b");
      }
      if (spec.holder) {
        const out = faceRight ? 1 : -1;
        put(g, faceCol + out, lip, "k");
        put(g, faceCol + out * 2, lip - 1, "k");
        put(g, faceCol + out * 3, lip - 1, "a");
      }
      if (spec.pipe) {
        const out = faceRight ? 1 : -1;
        put(g, faceCol + out, lip, "a");
        put(g, faceCol + out * 2, lip, "a");
        put(g, faceCol + out * 2, lip + 1, "k");
      }
      const chestJoin = chestTop;
      const neck = spec.jowl || spec.pipe ? "t" : "g";
      const neckEdge = spec.jowl || spec.pipe ? "a" : "s";
      for (let y = headTop + head.h; y <= chestJoin; y++) {
        put(g, markCol, y, neck);
        put(g, faceCol, y, y === headTop + head.h ? neckEdge : neck);
      }
      drawHat(g, spec.hat, faceRight, headTop, glance, spec, lean);
      if (spec.bow) {
        const knot = chestLeft + Math.floor(spec.chestW / 2);
        put(g, knot - 1, chestTop, "k");
        put(g, knot, chestTop, "r");
        put(g, knot + 1, chestTop, "k");
      }

      const taken = {};
      const sign = mode === "left" ? -1 : 1;
      const rightBack = hipLeft + spec.hipW - spec.legW;
      if (spec.chair) {
        drawChair(g, spec, hipLeft, spec.hipW, hipTop, mode === "stand" ? 0 : frame);
      } else if (jumping) {
        drawJumpLegs(g, hipLeft, hemY, spec, pose.legs, face === "right", taken);
      } else if (mode === "stand") {
        drawPlanted(g, hipLeft, hemY, spec.legW, -1, false, taken);
        drawPlanted(g, rightBack, hemY, spec.legW, 1, true, taken);
      } else {
        const lead = frame % WALK_N;
        const follow = (lead + WALK_N / 2) % WALK_N;
        const legs = mode === "left"
          ? [
            { x: hipLeft, dir: sign, phase: lead, light: false, which: "left" },
            { x: rightBack, dir: sign, phase: follow, light: true, which: "right" },
          ]
          : [
            { x: hipLeft, dir: mode === "forward" ? -1 : sign, phase: follow, light: false, which: "left" },
            { x: rightBack, dir: mode === "forward" ? 1 : sign, phase: lead, light: true, which: "right" },
          ];
        legs.forEach(function (leg) {
          const joint = drawChain(g, leg.x, hemY, spec.legW, leg.dir, gait[leg.phase], leg.light, taken);
          if (gait[leg.phase].kx !== 0 && leg.which === "left") sideProof.left = true;
          if (gait[leg.phase].kx !== 0 && leg.which === "right") sideProof.right = true;
          if (mode === "right" && joint.kneeX > hipLeft + spec.hipW - 1) sideProof.outer = true;
          if (mode === "left" && joint.kneeX < hipLeft) sideProof.outer = true;
        });
      }

      return linesOf(g);
    });

    if (!spec.chair && !jumping && (mode === "right" || mode === "left")) {
      if (!sideProof.left || !sideProof.right || !sideProof.outer) {
        throw new Error(spec.id + " knee fold stays on one side");
      }
    }
    return { frames: frames, muzzles: muzzles };
  }

  function sheepWool(g, woolLeft, woolTop, woolW, woolH) {
    for (let y = 0; y < woolH; y++) {
      for (let x = 0; x < woolW; x++) {
        const topCorner = y === 0 && (x === 0 || x === woolW - 1);
        if (topCorner) continue;
        const edge = y === 0 || y === woolH - 1 || x === 0 || x === woolW - 1;
        put(g, woolLeft + x, woolTop + y, edge ? "g" : "t");
      }
    }
    for (let x = 6; x < woolW; x++) put(g, woolLeft + x, woolTop + woolH - 1, "s");
    put(g, woolLeft + 4, woolTop + 2, "k");
    put(g, woolLeft + 5, woolTop + 3, "s");
  }

  function sheepChain(g, hipX, hemY, stepDir, pose, light) {
    const span = Math.max(2, GROUND - hemY);
    const kneeX = hipX + Math.max(-1, Math.min(1, pose.kx)) * stepDir;
    const kneeY = Math.min(GROUND - 1, hemY + Math.max(1, Math.round((span * pose.ky) / 100)));
    const footY = pose.plant ? GROUND : Math.min(GROUND - 1, Math.max(kneeY, hemY + Math.round((span * pose.fy) / 100)));
    const footX = hipX + Math.max(-1, Math.min(1, pose.fx)) * stepDir;
    linePix(hipX, hemY, kneeX, kneeY).forEach(function (p) { put(g, p[0], p[1], "k"); });
    linePix(kneeX, kneeY, footX, footY).forEach(function (p) { put(g, p[0], p[1], "k"); });
    if (pose.toe) put(g, footX + stepDir, footY, light ? "t" : "k");
    else if (light) put(g, footX, footY, "t");
  }

  function sheepHead(g, woolTop, drop, face) {
    const y = drop || 0;
    const flip = face === "right" ? -1 : 1;
    const slide = face === "right" ? 1 : 0;
    function hx(dx) {
      return MID + slide + dx * flip;
    }
    put(g, hx(-1), woolTop - 3 + y, "k");
    put(g, hx(0), woolTop - 3 + y, "t");
    put(g, hx(1), woolTop - 3 + y, "k");
    put(g, hx(-1), woolTop - 2 + y, "t");
    put(g, hx(0), woolTop - 2 + y, "a");
    put(g, hx(1), woolTop - 2 + y, "t");
    put(g, hx(0), woolTop - 1 + y, "k");
    put(g, hx(1), woolTop - 1 + y, "s");
  }

  function sheepBody(g, face, bob) {
    const woolW = 12;
    const woolH = 6;
    const woolLeft = MID - 6;
    const woolTop = GROUND - 4 + 1 - woolH + (bob || 0);
    sheepWool(g, woolLeft, woolTop, woolW, woolH);
    sheepHead(g, woolTop, 0, face);
    return { woolLeft: woolLeft, hem: woolTop + woolH - 1, woolTop: woolTop };
  }

  function sheepLegs(g, woolLeft, hem, frame, mode, sign) {
    const xs = [
      { x: 1, side: 0 },
      { x: 3, side: 0 },
      { x: 7, side: 1 },
      { x: 9, side: 1 },
    ];
    const leadSide = mode === "left" ? 0 : 1;
    xs.forEach(function (leg) {
      const x = woolLeft + leg.x;
      const outward = leg.side === 0 ? -1 : 1;
      if (mode === "stand") {
        for (let y = hem; y <= GROUND; y++) put(g, x, y, "k");
        put(g, x + outward, GROUND, leg.x === 9 ? "t" : "k");
        return;
      }
      const leading = leg.side === leadSide;
      const phase = gait[(frame + (leading ? 0 : WALK_N / 2)) % WALK_N];
      const dir = mode === "forward" ? (leg.side === 0 ? 1 : -1) : sign;
      sheepChain(g, x, hem, dir, phase, leg.x === 9);
    });
  }

  function sheepFrames() {
    return Array.from({ length: WALK_N }, function (_, frame) {
      const g = grid();
      const body = sheepBody(g, "left", frame === 2 ? 1 : 0);
      sheepLegs(g, body.woolLeft, body.hem, frame, "forward", 1);
      return linesOf(g);
    });
  }

  function sheepStill(face) {
    return [0, 1, 2, 3, 4, 5, 6, 7].map(function (frame) {
      const g = grid();
      const glance = frame === 1 ? "left" : frame === 4 ? "right" : face;
      const body = sheepBody(g, glance, 0);
      if (frame === 2) {
        const ear = glance === "right" ? MID + 2 : MID - 2;
        put(g, ear, body.woolTop - 4, "k");
      }
      if (frame === 6) {
        const ear = glance === "right" ? MID - 2 : MID + 2;
        put(g, ear, body.woolTop - 4, "k");
      }
      if (frame === 5) {
        const nose = glance === "right" ? MID + 1 : MID;
        put(g, nose, body.woolTop - 2, "t");
        put(g, nose, body.woolTop - 1, "a");
      }
      sheepLegs(g, body.woolLeft, body.hem, frame, "stand", 1);
      return linesOf(g);
    }).concat([8, 9].map(function (frame) {
      const g = grid();
      const body = sheepBody(g, face, frame === 8 ? 1 : 0);
      sheepLegs(g, body.woolLeft, body.hem, frame, "stand", 1);
      return linesOf(g);
    }));
  }

  function sheepSide(sign, face) {
    return Array.from({ length: WALK_N }, function (_, frame) {
      const g = grid();
      const body = sheepBody(g, face, 0);
      sheepLegs(g, body.woolLeft, body.hem, frame, sign > 0 ? "right" : "left", sign);
      return linesOf(g);
    });
  }

  function drawProne(g, spec, face, frame) {
    const faceRight = face === "right";
    const dir = faceRight ? 1 : -1;
    const cloth = spec.coat || "g";
    const hitch = frame === 1 || frame === 2 ? dir : 0;
    const kick = frame === 2 ? -dir : frame === 3 ? -dir * 2 : 0;
    const reach = frame === 1 || frame === 2 ? 1 : 0;
    const belly = GROUND - 2;
    const midX = MID + hitch;
    const chestLen = Math.max(7, spec.chestH - 1);
    const hipLen = 4;
    const legLen = Math.max(6, Math.min(12, (spec.leg || 12) - 2));
    const hipX = midX - dir * 2;
    for (let i = 0; i < legLen; i++) {
      const x = hipX - dir * (hipLen + i) + (i > legLen - 3 ? kick : 0);
      put(g, x, GROUND, "k");
      if (i < 3) put(g, x, GROUND - 1, "k");
    }
    put(g, hipX - dir * (hipLen + legLen), GROUND, "t");
    for (let i = 0; i < hipLen; i++) {
      const x = hipX - dir * i;
      put(g, x, GROUND, "k");
      put(g, x, GROUND - 1, "k");
    }
    const chestEnd = midX + dir;
    for (let i = 0; i < chestLen; i++) {
      const x = chestEnd + dir * i;
      put(g, x, belly, cloth);
      put(g, x, belly - 1, i === 0 ? "s" : cloth);
      put(g, x, GROUND, i < 2 ? "k" : cloth);
    }
    const collar = chestEnd + dir * (chestLen - 1);
    put(g, collar, belly - 1, "w");
    const hx = collar + dir * 2;
    const hw = spec.headW || 2;
    const hh = Math.min(3, spec.headH || 3);
    for (let y = 0; y < hh; y++) {
      for (let x = 0; x < hw; x++) {
        const px = faceRight ? hx + x : hx - x;
        put(g, px, belly - 1 - y, x >= Math.floor(hw / 2) ? "t" : "a");
      }
    }
    const hatY = belly - 1 - hh;
    const hat = spec.hat ? cloth : "a";
    put(g, hx, hatY, hat);
    put(g, hx + dir, hatY, spec.hat ? "s" : "a");
    if (spec.hat) put(g, hx + dir * 2, hatY + 1, "k");
    if (spec.stache) put(g, faceRight ? hx + hw - 1 : hx - hw + 1, belly - 1, "k");
    if (spec.glasses) {
      put(g, hx + dir, belly - 2, "k");
      put(g, hx + dir * 2, belly - 2, "k");
    }
    const armY = belly - 2;
    put(g, midX + dir * 2, armY, spec.band ? "r" : cloth);
    put(g, midX + dir * 3, armY, cloth);
    const handX = collar + dir * (1 + reach);
    put(g, handX, belly - 1, "t");
    if (spec.pack) {
      put(g, midX - dir * 2, belly - 2, "k");
      put(g, midX - dir * 3, belly - 2, "s");
    }
    const empty = !spec.kind || spec.kind === "none";
    let tip = { x: handX + dir * 2, y: belly - 1 };
    if (!empty) {
      drawWeapon(g, spec.kind, handX, belly - 1, dir);
      tip = tipOfKind(spec.kind, handX, belly - 1, dir);
    }
    const span = hipLen + legLen + chestLen + 5;
    for (let i = -span; i <= span; i++) {
      const x = midX + i;
      if (g[GROUND] && g[GROUND][x] && g[GROUND][x] !== ".") put(g, x, GROUND + 1, "s");
    }
    return tip;
  }

  function proneFrames(spec, face, crawl) {
    const n = crawl ? 4 : 2;
    const muzzles = [];
    const frames = Array.from({ length: n }, function (_, frame) {
      const g = grid();
      muzzles.push(drawProne(g, spec, face, crawl ? frame : 0));
      return linesOf(g);
    });
    return { frames: frames, muzzles: muzzles };
  }

  function cyclesFor(spec) {
    const forward = framesFor(spec, "forward", "left");
    const stand = framesFor(spec, "stand", "left");
    const standRight = framesFor(spec, "stand", "right");
    const right = framesFor(spec, "right", "right");
    const left = framesFor(spec, "left", "left");
    const recoilL0 = framesFor(spec, "stand", "left", 0);
    const recoilL1 = framesFor(spec, "stand", "left", 1);
    const recoilR0 = framesFor(spec, "stand", "right", 0);
    const recoilR1 = framesFor(spec, "stand", "right", 1);
    const recoilF0 = framesFor(spec, "stand", "front", 0);
    const recoilF1 = framesFor(spec, "stand", "front", 1);
    const recoilForward = framesFor(spec, "forward", "left", 0);
    const recoilForwardSettle = framesFor(spec, "forward", "left", 1);
    const recoilRightWalk = framesFor(spec, "right", "right", 0);
    const recoilRightWalkSettle = framesFor(spec, "right", "right", 1);
    const recoilLeftWalk = framesFor(spec, "left", "left", 0);
    const recoilLeftWalkSettle = framesFor(spec, "left", "left", 1);
    const extra = {};
    const extraMuz = {};
    if (!spec.chair) {
      const jump = framesFor(spec, "jump", "left");
      const jumpRight = framesFor(spec, "jump", "right");
      const prone = proneFrames(spec, "left", false);
      const proneRight = proneFrames(spec, "right", false);
      const crawl = proneFrames(spec, "left", true);
      const crawlRight = proneFrames(spec, "right", true);
      extra.jump = jump.frames;
      extra.jumpRight = jumpRight.frames;
      extra.prone = prone.frames;
      extra.proneRight = proneRight.frames;
      extra.crawl = crawl.frames;
      extra.crawlRight = crawlRight.frames;
      extraMuz.jump = jump.muzzles;
      extraMuz.jumpRight = jumpRight.muzzles;
      extraMuz.prone = prone.muzzles;
      extraMuz.proneRight = proneRight.muzzles;
      extraMuz.crawl = crawl.muzzles;
      extraMuz.crawlRight = crawlRight.muzzles;
    }
    return Object.assign({
      frames: forward.frames,
      stand: stand.frames,
      standRight: standRight.frames,
      forward: forward.frames,
      right: right.frames,
      left: left.frames,
      recoil: recoilL0.frames.concat(recoilL1.frames),
      recoilRight: recoilR0.frames.concat(recoilR1.frames),
      recoilFront: recoilF0.frames.concat(recoilF1.frames),
      recoilForward: recoilForward.frames,
      recoilForwardSettle: recoilForwardSettle.frames,
      recoilRightWalk: recoilRightWalk.frames,
      recoilRightWalkSettle: recoilRightWalkSettle.frames,
      recoilLeftWalk: recoilLeftWalk.frames,
      recoilLeftWalkSettle: recoilLeftWalkSettle.frames,
      muzzles: Object.assign({
        stand: stand.muzzles,
        standRight: standRight.muzzles,
        forward: forward.muzzles,
        right: right.muzzles,
        left: left.muzzles,
        recoil: recoilL0.muzzles.concat(recoilL1.muzzles),
        recoilRight: recoilR0.muzzles.concat(recoilR1.muzzles),
        recoilFront: recoilF0.muzzles.concat(recoilF1.muzzles),
        recoilForward: recoilForward.muzzles,
        recoilForwardSettle: recoilForwardSettle.muzzles,
        recoilRightWalk: recoilRightWalk.muzzles,
        recoilRightWalkSettle: recoilRightWalkSettle.muzzles,
        recoilLeftWalk: recoilLeftWalk.muzzles,
        recoilLeftWalkSettle: recoilLeftWalkSettle.muzzles,
      }, extraMuz),
    }, extra);
  }

  function member(spec) {
    return Object.assign({
      id: spec.id,
      name: spec.name,
      weapon: spec.weapon,
      line: spec.line,
      chair: !!spec.chair,
    }, cyclesFor(spec));
  }

  function rect(g, x, y, w, h, c) {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) put(g, x + i, y + j, c);
    }
  }

  function hline(g, x, y, w, c) {
    for (let i = 0; i < w; i++) put(g, x + i, y, c);
  }

  function vline(g, x, y, h, c) {
    for (let j = 0; j < h; j++) put(g, x, y + j, c);
  }

  function vehiclePose(mode, frame) {
    if (mode === "stand") {
      return {
        bob: 0,
        barrel: frame === 4 ? 1 : 0,
        hatch: frame === 2 ? 1 : 0,
        belt: frame === 5 ? 1 : 0,
        track: 0,
        wheel: 0,
      };
    }
    return {
      bob: frame % 4 === 2 ? 1 : 0,
      barrel: 0,
      hatch: 0,
      belt: frame % 2,
      track: frame,
      wheel: frame,
    };
  }

  function drawTank(g, spec, pose, faceRight) {
    const cloth = spec.coat;
    const dir = faceRight ? 1 : -1;
    const hullW = spec.hullW;
    const hullH = spec.hullH;
    const hullLeft = MID - Math.floor(hullW / 2);
    const bob = pose.bob || 0;
    const wheelR = 3;
    const hullBot = GROUND - 7 + bob;
    const hullTop = hullBot - hullH + 1;
    const tLeft = hullLeft - 2;
    const tW = hullW + 4;
    for (let i = 0; i < tW; i++) {
      const tooth = (i + (pose.track || 0)) % 2 === 0;
      put(g, tLeft + i, GROUND - 1 + bob, "k");
      put(g, tLeft + i, GROUND + bob, tooth ? "k" : "s");
    }
    const nWheels = spec.roadWheels || 6;
    const innerL = hullLeft + 5;
    const innerR = hullLeft + hullW - 6;
    const span = Math.max(1, innerR - innerL);
    for (let i = 0; i < nWheels; i++) {
      const wx = innerL + Math.round((span * i) / Math.max(1, nWheels - 1));
      drawWheel(g, wx, GROUND - wheelR + bob, wheelR, (pose.track || 0) + i);
    }
    const frontX = faceRight ? hullLeft + hullW : hullLeft - 1;
    const rearX = faceRight ? hullLeft - 1 : hullLeft + hullW;
    drawWheel(g, frontX, GROUND - wheelR - 1 + bob, wheelR + 1, pose.track || 0);
    drawWheel(g, rearX, GROUND - wheelR + bob, wheelR, pose.track || 0);
    for (let y = 0; y < hullH; y++) {
      const bowCut = spec.round ? (y < 5 ? 5 - y : 0) : (y < 2 ? 2 - y : 0);
      const rearCut = spec.round && y === 0 ? 1 : 0;
      const x0 = hullLeft + (faceRight ? rearCut : bowCut);
      const x1 = hullLeft + hullW - 1 - (faceRight ? bowCut : rearCut);
      for (let x = x0; x <= x1; x++) {
        put(g, x, hullTop + y, x === x1 ? "s" : cloth);
      }
    }
    hline(g, hullLeft + 3, hullTop + 2, hullW - 8, "s");
    const visor = faceRight ? hullLeft + hullW - 8 : hullLeft + 4;
    hline(g, visor, hullTop + 4, 3, "k");
    if (spec.skirts) {
      rect(g, hullLeft - 1, hullBot - 5, hullW + 2, 4, cloth);
      put(g, hullLeft + hullW, hullBot - 5, "s");
    }
    const markX = hullLeft + Math.floor(hullW / 2);
    const markY = hullTop + Math.floor(hullH / 2) - 1;
    if (spec.mark === "star") {
      put(g, markX, markY, "w");
      hline(g, markX - 1, markY + 1, 3, "w");
      hline(g, markX - 2, markY + 2, 5, "w");
      hline(g, markX - 1, markY + 3, 3, "w");
      put(g, markX, markY + 4, "w");
    } else if (spec.mark === "cross") {
      rect(g, markX - 2, markY, 5, 5, "w");
      hline(g, markX - 1, markY + 2, 3, "k");
      vline(g, markX, markY + 1, 3, "k");
    }
    const tw = spec.turretW;
    const th = spec.turretH;
    const turLeft = hullLeft + Math.floor(hullW / 2) - Math.floor(tw / 2) + dir * 4;
    const turTop = hullTop - th + 2;
    if (spec.round) {
      hline(g, turLeft + 2, turTop, tw - 4, cloth);
      hline(g, turLeft + 1, turTop + 1, tw - 2, cloth);
      rect(g, turLeft, turTop + 2, tw, th - 2, cloth);
    } else {
      rect(g, turLeft, turTop, tw, th, cloth);
    }
    for (let j = 0; j < th; j++) put(g, turLeft + tw - 1, turTop + j, "s");
    const hx = turLeft + Math.floor(tw / 2);
    rect(g, hx - 1, turTop + 1, 3, 2, pose.hatch ? "k" : "s");
    if (spec.cupola) {
      hline(g, hx - 2, turTop - 1, 5, cloth);
      put(g, hx, turTop - 2, pose.hatch ? "k" : "s");
      put(g, hx - 1, turTop - 2, cloth);
      put(g, hx + 1, turTop - 2, cloth);
    }
    const by = turTop + Math.floor(th / 2) - (pose.barrel || 0);
    const root = faceRight ? turLeft + tw : turLeft - 1;
    const bore = Math.min(spec.bore || 1, 2);
    rect(g, faceRight ? root - 1 : root, by, 2, bore, "k");
    for (let i = 1; i <= spec.barrel; i++) {
      const x = root + i * dir;
      put(g, x, by, "k");
      if (bore > 1) put(g, x, by + 1, "s");
    }
    if (spec.brake) {
      const mx = root + (spec.barrel + 1) * dir;
      put(g, mx, by, "k");
      put(g, mx, by - 1, "k");
      put(g, mx, by + 1, "k");
      put(g, mx + dir, by, "k");
    }
  }

  function drawWheel(g, cx, cy, r, spoke) {
    const rr = r * r;
    const inner = (r - 1) * (r - 1);
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        const d = x * x + y * y;
        if (d > rr) continue;
        put(g, cx + x, cy + y, d >= inner ? "k" : "s");
      }
    }
    put(g, cx, cy, "a");
    const step = ((spoke || 0) % 4) * 0.785;
    for (let i = 1; i < r - 1; i++) {
      put(g, cx + Math.round(Math.cos(step) * i), cy + Math.round(Math.sin(step) * i), "t");
      put(g, cx - Math.round(Math.cos(step) * i), cy - Math.round(Math.sin(step) * i), "t");
    }
  }

  function drawChair(g, spec, hipLeft, hipW, hipTop, roll) {
    const r = spec.wheelR || 8;
    const axleY = GROUND - r + 1;
    drawWheel(g, hipLeft - 1, axleY, r, roll);
    drawWheel(g, hipLeft + hipW, axleY, r, roll);
    hline(g, hipLeft - 1, hipTop + spec.hipH, hipW + 2, "k");
    vline(g, hipLeft - 1, hipTop - 1, spec.chestH + 2, "k");
    vline(g, hipLeft + hipW, hipTop - 1, spec.chestH + 2, "s");
    hline(g, hipLeft, GROUND - 1, hipW, "k");
    vline(g, hipLeft + 1, hipTop + spec.hipH, 3, "k");
    vline(g, hipLeft + hipW - 2, hipTop + spec.hipH, 3, "k");
  }

  function drawGun(g, spec, pose, faceRight) {
    const cloth = spec.coat;
    const dir = faceRight ? 1 : -1;
    const r = spec.wheelR || 6;
    const span = spec.wheelSpan || 28;
    const axle = GROUND - r;
    const leftX = MID - Math.floor(span / 2);
    const rightX = MID + Math.floor(span / 2);
    drawWheel(g, leftX, axle, r, pose.wheel || 0);
    drawWheel(g, rightX, axle, r, pose.wheel || 0);
    const beamLeft = leftX - 1;
    const beamRight = rightX + 1;
    const beamH = spec.carH || 6;
    const beamTop = axle - Math.floor(beamH / 2);
    rect(g, beamLeft, beamTop, beamRight - beamLeft + 1, beamH, cloth);
    put(g, beamRight, beamTop, "s");
    const rearHub = faceRight ? leftX : rightX;
    const trailLen = r + 6;
    for (let i = 0; i <= trailLen; i++) {
      const x = rearHub - dir * i;
      const y = axle + Math.round((i * (GROUND - axle)) / trailLen);
      put(g, x, y - 1, cloth);
      put(g, x, y, "k");
      put(g, x, y + 1, "s");
    }
    const spadeX = rearHub - dir * trailLen;
    hline(g, spadeX - 1, GROUND, 3, "k");
    const shW = spec.shieldW;
    const shH = spec.shieldH;
    const shX = MID - Math.floor(shW / 2);
    const shY = beamTop - shH + 2;
    rect(g, shX, shY, shW, shH, cloth);
    for (let j = 0; j < shH; j++) put(g, shX + shW - 1, shY + j, "s");
    hline(g, shX + 3, shY + 3, 4, "k");
    put(g, shX + 4, shY + 3, "s");
    hline(g, shX + 3, shY + Math.floor(shH / 2), 3, "s");
    const by = shY + Math.floor(shH / 2) - 1 - (pose.barrel || 0);
    const root = faceRight ? shX + shW : shX - 1;
    const bore = spec.bore || 1;
    for (let i = 0; i <= spec.barrel; i++) {
      const x = root + i * dir;
      for (let b = 0; b < bore; b++) put(g, x, by + b, b === 0 ? "k" : "s");
    }
    if (spec.brake) {
      const mx = root + (spec.barrel + 1) * dir;
      for (let b = -1; b <= bore; b++) put(g, mx, by + b, "k");
    }
    rect(g, beamLeft, beamTop, beamRight - beamLeft + 1, beamH, cloth);
    put(g, beamRight, beamTop, "s");
    hline(g, leftX, axle, rightX - leftX + 1, "k");
    put(g, leftX, axle, "a");
    put(g, rightX, axle, "a");
  }

  function drawMg(g, spec, pose, faceRight) {
    const cloth = spec.coat;
    const dir = faceRight ? 1 : -1;
    const tall = spec.tall || 16;
    const mount = GROUND - tall;
    const pivot = MID;
    const spread = spec.spread || Math.max(6, Math.round(tall * 0.7));
    if (spec.legs === 3) {
      linePix(pivot, mount, pivot - spread, GROUND).forEach(function (p) { put(g, p[0], p[1], "k"); });
      linePix(pivot, mount, pivot + spread, GROUND).forEach(function (p) { put(g, p[0], p[1], "k"); });
      linePix(pivot, mount, pivot - dir * Math.floor(spread * 0.7), GROUND).forEach(function (p) { put(g, p[0], p[1], "s"); });
    } else {
      const bip = pivot + dir * 3;
      linePix(bip, mount + 3, bip - spread, GROUND).forEach(function (p) { put(g, p[0], p[1], "k"); });
      linePix(bip, mount + 3, bip + spread, GROUND).forEach(function (p) { put(g, p[0], p[1], "k"); });
      linePix(pivot, mount, pivot - dir * (spread + 2), GROUND).forEach(function (p) { put(g, p[0], p[1], "s"); });
    }
    const recvW = spec.recvW || 6;
    const recvH = spec.recvH || 4;
    const rx = pivot - 1;
    const ry = mount - 2;
    rect(g, rx, ry, recvW, recvH, cloth);
    put(g, rx + recvW - 1, ry, "s");
    put(g, rx + 1, ry + 1, "s");
    const by = ry + recvH - 2 - (pose.barrel || 0);
    const root = faceRight ? rx + recvW : rx - 1;
    const bore = spec.bore || 1;
    for (let i = 0; i <= spec.barrel; i++) {
      const x = root + i * dir;
      if (spec.perf && i % 2 === 1) continue;
      for (let b = 0; b < bore; b++) put(g, x, by + b, b === 0 ? "k" : "s");
    }
    if (spec.brake) {
      const mx = root + (spec.barrel + 1) * dir;
      put(g, mx, by, "k");
      put(g, mx, by - 1, "s");
    }
    const bx = faceRight ? rx : rx + recvW - 1;
    const drop = pose.belt || 0;
    for (let i = 1; i <= 6; i++) {
      put(g, bx - dir * Math.ceil(i / 2), ry + 1 + i + drop, i % 2 ? "a" : "t");
    }
  }

  function vehicleTip(spec, pose, faceRight) {
    const dir = faceRight ? 1 : -1;
    const last = spec.barrel + (spec.brake ? 1 : 0);
    if (spec.vkind === "tank") {
      const hullLeft = MID - Math.floor(spec.hullW / 2);
      const bob = pose.bob || 0;
      const hullTop = GROUND - 7 + bob - spec.hullH + 1;
      const tw = spec.turretW;
      const th = spec.turretH;
      const turLeft = hullLeft + Math.floor(spec.hullW / 2) - Math.floor(tw / 2) + dir * 4;
      const turTop = hullTop - th + 2;
      const by = turTop + Math.floor(th / 2) - (pose.barrel || 0);
      const root = faceRight ? turLeft + tw : turLeft - 1;
      return { x: root + (last + 1) * dir, y: by };
    }
    if (spec.vkind === "gun") {
      const r = spec.wheelR || 6;
      const axle = GROUND - r;
      const beamTop = axle - Math.floor((spec.carH || 6) / 2);
      const shX = MID - Math.floor(spec.shieldW / 2);
      const shY = beamTop - spec.shieldH + 2;
      const by = shY + Math.floor(spec.shieldH / 2) - 1 - (pose.barrel || 0);
      const root = faceRight ? shX + spec.shieldW : shX - 1;
      return { x: root + (last + 1) * dir, y: by };
    }
    const mount = GROUND - (spec.tall || 16);
    const rx = MID - 1;
    const ry = mount - 2;
    const recvW = spec.recvW || 6;
    const recvH = spec.recvH || 4;
    const by = ry + recvH - 2 - (pose.barrel || 0);
    const root = faceRight ? rx + recvW : rx - 1;
    return { x: root + (last + 1) * dir, y: by };
  }

  function vehicleFrames(spec, mode, face) {
    const n = mode === "stand" ? 10 : WALK_N;
    const faceRight = face === "right";
    const muzzles = [];
    const frames = Array.from({ length: n }, function (_, frame) {
      const g = grid();
      const pose = vehiclePose(mode, frame);
      if (spec.vkind === "tank") drawTank(g, spec, pose, faceRight);
      else if (spec.vkind === "gun") drawGun(g, spec, pose, faceRight);
      else drawMg(g, spec, pose, faceRight);
      muzzles.push(vehicleTip(spec, pose, faceRight));
      return linesOf(g);
    });
    return { frames: frames, muzzles: muzzles };
  }

  function vehicle(spec) {
    const forward = vehicleFrames(spec, "forward", "left");
    const stand = vehicleFrames(spec, "stand", "left");
    const standRight = vehicleFrames(spec, "stand", "right");
    const right = vehicleFrames(spec, "right", "right");
    const left = vehicleFrames(spec, "left", "left");
    return {
      id: spec.id,
      name: spec.name,
      weapon: spec.weapon,
      line: spec.line,
      vkind: spec.vkind,
      hullW: spec.hullW || spec.wheelSpan || 20,
      frames: forward.frames,
      stand: stand.frames,
      standRight: standRight.frames,
      forward: forward.frames,
      right: right.frames,
      left: left.frames,
      muzzles: {
        stand: stand.muzzles,
        standRight: standRight.muzzles,
        forward: forward.muzzles,
        right: right.muzzles,
        left: left.muzzles,
      },
    };
  }

  const STILL = [
    { hip: 0, chest: 0, head: 0, arm: 0, weapon: 0, reach: 0, side: 0, look: 0 },
    { hip: 0, chest: 0, head: 0, arm: 0, weapon: 0, reach: 0, side: 0, look: -1 },
    { hip: 0, chest: 0, head: 0, arm: 0, weapon: 0, reach: 0, side: 0, look: 0 },
    { hip: 0, chest: 0, head: 0, arm: 1, weapon: 0, reach: 0, side: 0, look: 0 },
    { hip: 0, chest: 0, head: 0, arm: 0, weapon: 0, reach: 0, side: 0, look: 1 },
    { hip: 0, chest: 0, head: 0, arm: 0, weapon: 0, reach: 0, side: 1, look: 0 },
    { hip: 0, chest: 0, head: 0, arm: 0, weapon: 0, reach: 0, side: 0, look: 0 },
    { hip: 0, chest: 0, head: 0, arm: 0, weapon: 0, reach: 0, side: 0, look: 0 },
    { hip: 0, chest: 1, head: 0, arm: 0, weapon: 0, reach: 0, side: 0, look: 0 },
    { hip: 0, chest: 0, head: 0, arm: 0, weapon: 0, reach: 0, side: 0, look: 0 },
  ];

  const HEAVY_IDLE = [
    { hip: 0, chest: 0, head: 0, arm: 0, weapon: 0, reach: 0, side: 0, look: 0 },
    { hip: 0, chest: 0, head: 0, arm: 0, weapon: 0, reach: 0, side: 0, look: -1 },
    { hip: 0, chest: 1, head: 0, arm: 0, weapon: 0, reach: 0, side: 0, look: 0 },
    { hip: 0, chest: 0, head: 0, arm: 1, weapon: 0, reach: 0, side: 0, look: 0 },
    { hip: 0, chest: 0, head: 0, arm: 0, weapon: 0, reach: 0, side: 0, look: 1 },
    { hip: 0, chest: 1, head: 0, arm: 1, weapon: 0, reach: 0, side: 1, look: 0 },
    { hip: 0, chest: 0, head: 0, arm: 0, weapon: 1, reach: 0, side: 1, look: 0 },
    { hip: 0, chest: 0, head: 0, arm: 0, weapon: 0, reach: 0, side: 0, look: 0 },
    { hip: 0, chest: 1, head: 0, arm: 0, weapon: 0, reach: 0, side: 0, look: 0 },
    { hip: 0, chest: 0, head: 0, arm: 0, weapon: 0, reach: 0, side: 0, look: 0 },
  ];

  const crew = [
    member({
      id: "miller",
      name: "Marines",
      weapon: "M1 Garand",
      kind: "rifle",
      hat: "m1",
      coat: "o",
      pack: "pack",
      webbing: true,
      chevrons: 2,
      line: "Allies. US rifle. Olive drab, M1 helmet, haversack.",
      headW: 2, headH: 3,
      chestW: 9, chestH: 9, hipW: 8, hipH: 2,
      leg: 14, legW: 1, reach: 3, armT: 1,
      poses: withWalk({}),
    }),
    member({
      id: "bradley",
      name: "US General",
      weapon: "Baton",
      kind: "stick",
      hat: "peak",
      coat: "o",
      long: 1,
      pips: 3,
      line: "Allies. US general. Peaked cap, olive jacket, no gun.",
      headW: 3, headH: 3,
      chestW: 10, chestH: 10, hipW: 8, hipH: 2,
      leg: 12, legW: 1, reach: 3, armT: 1,
      poses: withWalk({
        chest: [0, 1, 1, 1, 1, 0],
        reach: [0, 0, 1, 1, 0, 0],
      }),
    }),
    member({
      id: "winston",
      name: "Churchill",
      weapon: "Cigar",
      kind: "none",
      hat: "homburg",
      coat: "n",
      long: 2,
      bow: true,
      cigar: true,
      jowl: true,
      idle: HEAVY_IDLE,
      line: "Allies. Churchill. Homburg, bow tie, cigar, short heavy legs.",
      headW: 3, headH: 3,
      chestW: 12, chestH: 9, hipW: 10, hipH: 3,
      leg: 9, legW: 2, reach: 2, armT: 1,
      poses: withWalk({
        chest: [0, 1, 1, 1, 1, 0],
        hip: [0, 0, 1, 1, 0, 0],
      }),
    }),
    member({
      id: "franklin",
      name: "Roosevelt",
      weapon: "Holder",
      kind: "none",
      hat: "fedora",
      coat: "n",
      long: 1,
      glasses: true,
      holder: true,
      chair: true,
      wheelR: 8,
      hang: 2,
      line: "Allies. Roosevelt. Fedora, glasses, cigarette holder, wheelchair. No gun.",
      headW: 3, headH: 3,
      chestW: 10, chestH: 7, hipW: 8, hipH: 2,
      leg: 8, legW: 1, reach: 2, armT: 1,
      poses: withWalk({
        chest: [0, 0, 1, 1, 0, 0],
      }),
    }),
    member({
      id: "iosif",
      name: "Stalin",
      weapon: "Pipe",
      kind: "none",
      hat: "marshal",
      coat: "b",
      long: 1,
      pips: 3,
      pipe: true,
      stache: "wide",
      idle: HEAVY_IDLE,
      line: "Allies. Stalin. Marshal cap, wide mustache, pipe, short heavy legs.",
      headW: 3, headH: 3,
      chestW: 13, chestH: 9, hipW: 11, hipH: 3,
      leg: 10, legW: 2, reach: 2, armT: 1,
      poses: withWalk({
        chest: [0, 1, 1, 1, 1, 0],
        hip: [0, 0, 1, 1, 0, 0],
      }),
    }),
    member({
      id: "hale",
      name: "British Army",
      weapon: "Lee-Enfield",
      kind: "rifle",
      hat: "brodie",
      coat: "t",
      pack: "pouch",
      webbing: true,
      chevrons: 2,
      line: "Allies. British rifle. Khaki battledress, Brodie helmet.",
      headW: 2, headH: 2,
      chestW: 8, chestH: 11, hipW: 7, hipH: 2,
      leg: 17, legW: 1, reach: 3, armT: 1,
      poses: withWalk({
        chest: [0, 1, 1, 1, 1, 0],
      }),
    }),
    member({
      id: "volkov",
      name: "Red Army",
      weapon: "PPSh-41",
      kind: "ppsh",
      hat: "ushanka",
      coat: "b",
      pack: "roll",
      webbing: true,
      long: 1,
      idle: HEAVY_IDLE,
      pips: 2,
      line: "Allies. Soviet SMG. Greatcoat, ushanka, PPSh.",
      headW: 3, headH: 3,
      chestW: 11, chestH: 9, hipW: 9, hipH: 2,
      leg: 11, legW: 2, reach: 3, armT: 1,
      poses: withWalk({
        hip: [0, 1, 1, 1, 1, 0],
        chest: [0, 1, 1, 1, 1, 0],
      }),
    }),
    member({
      id: "keller",
      name: "Wehrmacht",
      weapon: "Kar98k",
      kind: "rifle",
      hat: "stahl",
      coat: "g",
      pack: "pack",
      webbing: true,
      band: true,
      litzen: true,
      chevrons: 1,
      line: "Axis. German rifle. Feldgrau, Stahlhelm, bread bag.",
      headW: 2, headH: 3,
      chestW: 9, chestH: 9, hipW: 8, hipH: 2,
      leg: 14, legW: 1, reach: 3, armT: 1,
      poses: withWalk({}),
    }),
    member({
      id: "richter",
      name: "German General",
      weapon: "Baton",
      kind: "stick",
      hat: "schirm",
      coat: "g",
      long: 2,
      band: true,
      pips: 3,
      line: "Axis. German general. Greatcoat, peaked cap, no gun.",
      headW: 3, headH: 3,
      chestW: 11, chestH: 11, hipW: 9, hipH: 2,
      leg: 13, legW: 1, reach: 2, armT: 1,
      poses: withWalk({
        hip: [0, 0, 0, 0, 0, 0],
        chest: [0, 0, 0, 0, 0, 0],
        head: [0, 0, 0, 0, 0, 0],
        reach: [0, 0, 0, 0, 0, 0],
      }),
    }),
    member({
      id: "hitler",
      name: "Hitler",
      weapon: "",
      kind: "none",
      hat: "sidepart",
      coat: "b",
      band: true,
      stache: true,
      line: "Axis. Hitler. Side part, mustache, brown jacket, armband. No gun.",
      headW: 2, headH: 4,
      chestW: 8, chestH: 8, hipW: 7, hipH: 2,
      leg: 15, legW: 1, reach: 2, armT: 1,
      poses: withWalk({
        chest: [0, 0, 1, 1, 0, 0],
      }),
    }),
    member({
      id: "sato",
      name: "Japanese Army",
      weapon: "Arisaka",
      kind: "rifle",
      hat: "fieldcap",
      coat: "t",
      pack: "roll",
      webbing: true,
      hipsword: true,
      idle: STILL,
      pips: 1,
      line: "Axis. Japanese rifle. Field cap, bedroll, sword on the hip.",
      headW: 2, headH: 2,
      chestW: 7, chestH: 7, hipW: 6, hipH: 2,
      leg: 12, legW: 1, reach: 3, armT: 1,
      poses: withWalk({
        hip: [0, 0, 0, 0, 0, 0],
        chest: [0, 0, 0, 0, 0, 0],
        head: [0, 0, 0, 0, 0, 0],
      }),
    }),
    member({
      id: "weber",
      name: "German SMG",
      weapon: "MP 40",
      kind: "mp40",
      hat: "stahl",
      coat: "g",
      pack: "pouch",
      webbing: true,
      band: true,
      chevrons: 2,
      line: "Axis. German SMG. Feldgrau, Stahlhelm, MP 40.",
      headW: 2, headH: 2,
      chestW: 8, chestH: 7, hipW: 7, hipH: 2,
      leg: 10, legW: 1, reach: 3, armT: 1,
      poses: withWalk({
        arm: [1, 1, 1, 0, 0, 0],
      }),
    }),
    member({
      id: "medic",
      name: "Medic",
      weapon: "",
      kind: "none",
      hat: "medic",
      coat: "o",
      pack: "tank",
      medic: true,
      cross: true,
      line: "Allies. Medic. White helmet, red cross on the chest, kit bag. No gun.",
      headW: 2, headH: 3,
      chestW: 10, chestH: 8, hipW: 8, hipH: 2,
      leg: 12, legW: 1, reach: 2, armT: 1,
      poses: withWalk({}),
    }),
    member({
      id: "para",
      name: "Paratrooper",
      weapon: "Thompson",
      kind: "thompson",
      hat: "jump",
      coat: "o",
      chute: true,
      webbing: true,
      chevrons: 2,
      line: "Allies. US airborne. Jump helmet, reserve chute on the chest, Thompson.",
      headW: 2, headH: 2,
      chestW: 8, chestH: 7, hipW: 7, hipH: 2,
      leg: 16, legW: 1, reach: 3, armT: 1,
      poses: withWalk({
        chest: [0, 1, 1, 1, 1, 0],
      }),
    }),
    member({
      id: "pilot",
      name: "Pilot",
      weapon: "",
      kind: "none",
      hat: "flight",
      coat: "b",
      scarf: "w",
      pips: 2,
      line: "Allies. Pilot. Leather jacket, flight helmet, scarf. No gun.",
      headW: 3, headH: 2,
      chestW: 9, chestH: 8, hipW: 7, hipH: 2,
      leg: 15, legW: 1, reach: 2, armT: 1,
      poses: withWalk({
        reach: [0, 0, 1, 1, 0, 0],
      }),
    }),
    member({
      id: "sanitater",
      name: "German Medic",
      weapon: "",
      kind: "none",
      hat: "medic",
      coat: "g",
      pack: "tank",
      medic: true,
      cross: true,
      line: "Axis. Medic. White helmet, red cross on the chest, kit bag. No gun.",
      headW: 2, headH: 3,
      chestW: 10, chestH: 8, hipW: 8, hipH: 2,
      leg: 12, legW: 1, reach: 2, armT: 1,
      poses: withWalk({}),
    }),
    member({
      id: "fj",
      name: "Fallschirmjäger",
      weapon: "MP 40",
      kind: "mp40",
      hat: "fj",
      coat: "g",
      chute: true,
      webbing: true,
      chevrons: 1,
      line: "Axis. German airborne. Jump helmet, reserve chute, MP 40.",
      headW: 2, headH: 2,
      chestW: 8, chestH: 7, hipW: 7, hipH: 2,
      leg: 16, legW: 1, reach: 3, armT: 1,
      poses: withWalk({
        arm: [1, 1, 0, 0, 0, 1],
      }),
    }),
    member({
      id: "luft",
      name: "Luftwaffe",
      weapon: "Binoculars",
      kind: "binocs",
      hat: "luftcap",
      coat: "n",
      scarf: "w",
      pips: 2,
      line: "Axis. Luftwaffe. Blue-grey, side cap, scarf, binoculars. No gun.",
      headW: 2, headH: 4,
      chestW: 8, chestH: 9, hipW: 7, hipH: 2,
      leg: 13, legW: 1, reach: 2, armT: 1,
      poses: withWalk({
        reach: [0, 0, 1, 1, 0, 0],
      }),
    }),
    vehicle({
      id: "sherman",
      name: "Sherman",
      weapon: "75mm",
      vkind: "tank",
      coat: "o",
      hullW: 50,
      hullH: 18,
      turretW: 22,
      turretH: 12,
      barrel: 20,
      bore: 3,
      trackH: 7,
      roadWheels: 6,
      round: true,
      cupola: true,
      mark: "star",
      line: "Allies. M4 Sherman. About a man and a half tall, much wider.",
    }),
    vehicle({
      id: "pounder",
      name: "25-Pounder",
      weapon: "25-pdr",
      vkind: "gun",
      coat: "t",
      barrel: 22,
      bore: 3,
      shieldW: 18,
      shieldH: 24,
      wheelR: 11,
      wheelSpan: 38,
      carW: 12,
      carH: 7,
      brake: true,
      line: "Allies. British field gun. Wheels come up to a man's chest.",
    }),
    vehicle({
      id: "browning",
      name: "Browning",
      weapon: "M1919",
      vkind: "mg",
      coat: "o",
      legs: 3,
      tall: 16,
      spread: 12,
      barrel: 16,
      bore: 3,
      recvW: 6,
      recvH: 4,
      line: "Allies. Browning M1919. Tripod sits about waist high.",
    }),
    vehicle({
      id: "panzer",
      name: "Panzer IV",
      weapon: "75mm KwK",
      vkind: "tank",
      coat: "g",
      hullW: 54,
      hullH: 16,
      turretW: 20,
      turretH: 10,
      barrel: 28,
      bore: 2,
      trackH: 7,
      roadWheels: 7,
      brake: true,
      skirts: true,
      mark: "cross",
      line: "Axis. Panzer IV. Lower than the Sherman, longer gun.",
    }),
    vehicle({
      id: "pak",
      name: "Pak 40",
      weapon: "75mm",
      vkind: "gun",
      coat: "g",
      barrel: 32,
      bore: 2,
      shieldW: 22,
      shieldH: 14,
      wheelR: 8,
      wheelSpan: 34,
      carW: 12,
      carH: 6,
      brake: true,
      line: "Axis. Pak 40. Low shield, barrel longer than a man is tall.",
    }),
    vehicle({
      id: "mg42",
      name: "MG 42",
      weapon: "7.92mm",
      vkind: "mg",
      coat: "g",
      legs: 2,
      tall: 11,
      spread: 10,
      barrel: 20,
      bore: 1,
      perf: true,
      brake: true,
      recvW: 5,
      recvH: 3,
      line: "Axis. MG 42. Bipod, long perforated barrel.",
    }),
  ];

  window.PIXEL_CREW = {
    palette: palette,
    crew: crew,
    ground: GROUND,
    mid: MID,
    idle: {
      still: 0,
      fidget: [1, 2, 3, 4, 5, 6],
      glance: [1, 2, 4, 5],
      arms: [3, 6],
      breath: 8,
    },
  };
})();
