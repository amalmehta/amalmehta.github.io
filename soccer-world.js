// Research & work, Hybrid Robotics Lab: a live 3D world for the robot soccer project, opened in place by soccer.js.
// A four-legged robot dog on a small grass pitch walks to the ball, lines up and kicks it at a hoop hung in the
// goal, the same three stages as the trained policy (reach, kick, wait). Or drive it yourself.
//   The world: a striped pitch with its markings, swaying grass, goals with nets, boards, light towers, trees,
//     a low golden sun with soft shadows.
//   The robot: a trotting gait from a central pattern generator (diagonal legs in step), two-link leg IK, body
//     pitch and roll from its own accelerations, and a kick that winds up and strikes with one front leg.
//   The ball: gravity, air drag with wind, rolling resistance on the grass, bounces, spin, posts, crossbar, nets.
//   Sim-to-real: the policy was tuned for a 430 g ball on medium grass with no wind and clean sensing. Change the
//     ball, the grass, the wind or the sensor noise and watch it miss; tick "Trained with randomization" and it
//     copes, the way domain randomization helps a policy survive the real world.
// Defines window.SoccerWorld(THREE, host) → { dispose }. Plain script (no import), so it loads like the others.
window.SoccerWorld = (THREE, host) => {
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const lerp = (a, b, t) => a + (b - a) * t;
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  const smooth = t => t * t * (3 - 2 * t);
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };
  const touch = matchMedia("(pointer: coarse)").matches;

  // ---------------------------------------------------------------- the world's measurements (metres)
  const HL = 6, HW = 4;                      // half length and half width of the pitch
  const GW = 1.0, GH = 0.9, GD = 0.7;        // goal half width, height, depth
  const BX = 7.0, BZ = 4.6;                  // the boards
  const R = 0.11, G = 9.81;                  // ball radius, gravity
  const HOOP = { x: HL + 0.04, y: 0.42, z: 0, r: 0.27 };
  const NOMINAL = { mass: 0.43, roll: 0.06, wind: 0, noise: 0 };
  const P = { ...NOMINAL, robust: false };   // the world as it is now

  // ---------------------------------------------------------------- DOM: stage, overlay and controls
  const el = (tag, cls, parent, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; if (parent) parent.appendChild(n); return n; };
  const box = el("div", "sim-box", host);
  const stage = el("div", "sim-stage", box);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  const canvas = renderer.domElement;
  canvas.className = "sim-canvas";
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "A 3D simulation: a four-legged robot dog walks to a soccer ball and kicks it at a hoop in the goal");
  stage.appendChild(canvas);
  const eye = el("div", "sim-eye", stage);
  el("span", "sim-eye-tag", eye, "HEAD CAM · 30 FPS");
  const cams = el("div", "sim-cams", stage);
  cams.setAttribute("role", "group"); cams.setAttribute("aria-label", "Camera");
  const camButtons = {};
  for (const [k, label] of [["broadcast", "Broadcast"], ["follow", "Follow"], ["eye", "Robot’s eye"]]) {
    const b = el("button", "sim-btn", cams, label); b.type = "button"; b.dataset.cam = k; camButtons[k] = b;
  }
  const hud = el("div", "sim-hud", stage);
  const chip = el("span", "sim-chip", hud, "Reach");
  const score = el("span", "sim-score", hud, "");
  const toast = el("div", "sim-toast", stage);
  toast.setAttribute("aria-live", "polite");
  const kickBtn = el("button", "sim-btn sim-kick", stage, "Kick");
  kickBtn.type = "button"; kickBtn.hidden = true;

  const panel = el("div", "sim-panel", box);
  const row = el("div", "sim-row", panel);
  const modes = el("div", "sim-seg", row);
  modes.setAttribute("role", "group"); modes.setAttribute("aria-label", "Who controls the robot");
  const modePolicy = el("button", "sim-btn", modes, "Policy plays"); modePolicy.type = "button";
  const modeDrive = el("button", "sim-btn", modes, "You drive"); modeDrive.type = "button";
  const pauseBtn = el("button", "sim-btn", row, "Pause"); pauseBtn.type = "button";
  const resetBtn = el("button", "sim-btn", row, "New ball"); resetBtn.type = "button";
  const nominalBtn = el("button", "sim-btn", row, "Back to training conditions"); nominalBtn.type = "button";
  const sliders = el("div", "sim-sliders", panel);
  const fields = {};
  const slider = (key, label, min, max, step, fmt) => {
    const wrapEl = el("label", "sim-slider", sliders);
    const top = el("span", "sim-slider-top", wrapEl);
    el("span", "", top, label);
    const out = el("output", "", top);
    const input = el("input", "", wrapEl);
    Object.assign(input, { type: "range", min, max, step, value: P[key] });
    const show = () => { out.textContent = fmt(+input.value); };
    input.addEventListener("input", () => { P[key] = +input.value; show(); });
    show();
    fields[key] = { input, show };
  };
  slider("mass", "Ball mass", 0.2, 0.8, 0.01, v => `${Math.round(v * 1000)} g`);
  slider("roll", "Grass drag", 0.02, 0.16, 0.005, v => (v < 0.045 ? "fast, short grass" : v < 0.08 ? "medium" : v < 0.12 ? "long grass" : "wet, heavy"));
  slider("wind", "Crosswind", 0, 9, 0.5, v => `${v.toFixed(1)} m/s`);
  slider("noise", "Sensor noise", 0, 0.12, 0.005, v => `±${Math.round(v * 100)} cm`);
  const robustLabel = el("label", "sim-check", sliders);
  const robust = el("input", "", robustLabel); robust.type = "checkbox";
  el("span", "", robustLabel, "Trained with randomization");
  robust.addEventListener("change", () => { P.robust = robust.checked; });
  const hint = el("p", "sim-hint", panel, "");

  // ---------------------------------------------------------------- renderer, scene, camera
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const HORIZON = new THREE.Color("#f3d9b4"), ZENITH = new THREE.Color("#5d8fd0");
  scene.fog = new THREE.Fog(HORIZON, 28, 120);
  const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.03, 600);
  const disposables = [];
  const keep = x => { disposables.push(x); return x; };

  // Sky: a gradient dome with a glowing low sun
  const SUN = new THREE.Vector3(-0.62, 0.32, 0.72).normalize();
  const sky = new THREE.Mesh(keep(new THREE.SphereGeometry(400, 32, 16)), keep(new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uSun: { value: SUN }, uHor: { value: HORIZON }, uZen: { value: ZENITH } },
    vertexShader: "varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.); gl_Position = p.xyww; }",
    fragmentShader: `varying vec3 vDir; uniform vec3 uSun, uHor, uZen;
      void main(){ vec3 d = normalize(vDir); float h = max(d.y, 0.);
        vec3 c = mix(uHor, uZen, pow(h, 0.45));
        float s = max(dot(d, uSun), 0.);
        c += vec3(1.0, 0.78, 0.45) * (pow(s, 6.) * 0.28 + pow(s, 64.) * 0.6) + vec3(1.0, 0.95, 0.85) * pow(s, 900.) * 4.;
        c = mix(c, uHor * 0.92, smoothstep(0.0, -0.08, d.y));
        gl_FragColor = vec4(c, 1.); }`,
  })));
  sky.renderOrder = -1;
  scene.add(sky);

  // Light: warm low sun with soft shadows, a sky/ground fill
  scene.add(new THREE.HemisphereLight("#cfe0ff", "#4a6234", 1.1));
  const sun = new THREE.DirectionalLight("#ffe9c9", 3.2);
  sun.position.copy(SUN).multiplyScalar(20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -9.5, right: 9.5, top: 7, bottom: -7, near: 1, far: 45 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);

  // ---------------------------------------------------------------- the pitch
  const tex = (w, h, draw) => {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = keep(new THREE.CanvasTexture(c));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  };
  const FL = HL * 2 + 1.6, FW = HW * 2 + 1.6;   // the textured area, with a margin round the lines
  const pitchTex = tex(2048, Math.round(2048 * FW / FL), (g, w, h) => {
    const X = x => (x / FL + 0.5) * w, Z = z => (z / FW + 0.5) * h, M = m => m / FL * w;
    for (let k = 0; k < 14; k++) { g.fillStyle = k % 2 ? "#3f7a34" : "#478a3a"; g.fillRect(X(-HL - 0.8 + k), 0, M(1) + 1, h); }
    for (let k = 0; k < 26000; k++) {   // speckle: blades, clover, worn patches
      const a = Math.random();
      g.fillStyle = a < 0.5 ? `rgba(20,50,15,${0.12 + Math.random() * 0.12})` : a < 0.95 ? `rgba(140,190,90,${0.06 + Math.random() * 0.08})` : "rgba(120,100,60,0.12)";
      g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2.5, 1 + Math.random() * 2.5);
    }
    const worn = (x, z, rx, rz) => { const gr = g.createRadialGradient(X(x), Z(z), 0, X(x), Z(z), M(rx)); gr.addColorStop(0, "rgba(130,110,60,0.28)"); gr.addColorStop(1, "rgba(130,110,60,0)"); g.fillStyle = gr; g.beginPath(); g.ellipse(X(x), Z(z), M(rx), M(rz), 0, 0, TAU); g.fill(); };
    worn(HL - 0.4, 0, 0.9, 1.3); worn(-HL + 0.4, 0, 0.9, 1.3); worn(0, 0, 1.2, 1.2);
    g.strokeStyle = "rgba(245,245,238,0.92)"; g.lineWidth = M(0.06);
    g.strokeRect(X(-HL), Z(-HW), M(HL * 2), M(HW * 2));
    g.beginPath(); g.moveTo(X(0), Z(-HW)); g.lineTo(X(0), Z(HW)); g.stroke();
    g.beginPath(); g.arc(X(0), Z(0), M(1.0), 0, TAU); g.stroke();
    for (const s of [-1, 1]) {
      g.strokeRect(Math.min(X(s * HL), X(s * (HL - 1.6))), Z(-2.0), M(1.6), M(4.0));
      g.strokeRect(Math.min(X(s * HL), X(s * (HL - 0.6))), Z(-1.3), M(0.6), M(2.6));
      g.beginPath(); g.arc(X(s * (HL - 1.6)), Z(0), M(0.7), s > 0 ? Math.PI * 0.62 : -Math.PI * 0.38, s > 0 ? Math.PI * 1.38 : Math.PI * 0.38); g.stroke();
      g.fillStyle = "rgba(245,245,238,0.92)"; g.beginPath(); g.arc(X(s * (HL - 1.1)), Z(0), M(0.05), 0, TAU); g.fill();
    }
    g.beginPath(); g.arc(X(0), Z(0), M(0.06), 0, TAU); g.fill();
  });
  const pitch = new THREE.Mesh(keep(new THREE.PlaneGeometry(FL, FW)), keep(new THREE.MeshStandardMaterial({ map: pitchTex, roughness: 0.95 })));
  pitch.rotation.x = -Math.PI / 2; pitch.receiveShadow = true;
  scene.add(pitch);
  const outerTex = tex(256, 256, (g, w, h) => {
    g.fillStyle = "#3d6b2f"; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 4000; k++) { g.fillStyle = Math.random() < 0.5 ? "rgba(20,45,15,0.18)" : "rgba(150,190,100,0.1)"; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  });
  outerTex.wrapS = outerTex.wrapT = THREE.RepeatWrapping; outerTex.repeat.set(60, 60);
  const outer = new THREE.Mesh(keep(new THREE.PlaneGeometry(300, 300)), keep(new THREE.MeshStandardMaterial({ map: outerTex, roughness: 1 })));
  outer.rotation.x = -Math.PI / 2; outer.position.y = -0.01; outer.receiveShadow = true;
  scene.add(outer);

  // Grass: thousands of blades that sway with the wind
  const windU = { value: 0.3 }, timeU = { value: 0 };
  const bladeGeo = keep(new THREE.BufferGeometry());
  bladeGeo.setAttribute("position", new THREE.Float32BufferAttribute([-0.006, 0, 0, 0.006, 0, 0, 0, 1, 0], 3));
  bladeGeo.setAttribute("normal", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  const bladeMat = keep(new THREE.MeshLambertMaterial({ side: THREE.DoubleSide }));
  bladeMat.onBeforeCompile = sh => {
    sh.uniforms.uTime = timeU; sh.uniforms.uWind = windU;
    sh.vertexShader = "uniform float uTime; uniform float uWind;\n" + sh.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
      vec4 ip = instanceMatrix * vec4(0., 0., 0., 1.);
      float sway = sin(uTime * 1.9 + ip.x * 1.7 + ip.z * 0.6) * 0.6 + sin(uTime * 4.3 + ip.x * 3.1 - ip.z * 2.2) * 0.25;
      transformed.x += sway * position.y * position.y * 0.35 * uWind;
      transformed.z += sway * position.y * position.y * 0.18 * uWind;`);
  };
  const NB = touch ? 14000 : 32000;
  const blades = new THREE.InstancedMesh(bladeGeo, bladeMat, NB);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3(), col = new THREE.Color(), up = new THREE.Vector3(0, 1, 0);
  for (let k = 0; k < NB; k++) {
    const x = (Math.random() - 0.5) * (FL - 0.2), z = (Math.random() - 0.5) * (FW - 0.2);
    q.setFromAxisAngle(up, Math.random() * TAU);
    const hgt = 0.035 + Math.random() * 0.045;
    m4.compose(v3.set(x, 0, z), q, s3.set(1, hgt, 1));
    blades.setMatrixAt(k, m4);
    const stripe = Math.floor(x + HL + 0.8) % 2;
    col.setHSL(0.27 + Math.random() * 0.04, 0.45 + Math.random() * 0.15, (stripe ? 0.25 : 0.29) + Math.random() * 0.08);
    blades.setColorAt(k, col);
  }
  blades.receiveShadow = true;
  scene.add(blades);

  // Boards round the pitch, and light towers and trees beyond them
  const boardTex = tex(1024, 64, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, "#14233f"); gr.addColorStop(0.5, "#1d3a66"); gr.addColorStop(1, "#14233f");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.font = "bold 34px sans-serif"; g.textBaseline = "middle";
    const words = ["SIM-TO-REAL", "REACH · KICK · WAIT", "PPO", "AMALMEHTA.COM"];
    let x = 18;
    for (let k = 0; x < w; k++) { const t = words[k % words.length]; g.fillStyle = k % 2 ? "#ffd23f" : "#f3ede1"; g.fillText(t, x, h / 2 + 2); x += g.measureText(t).width + 48; }
  });
  boardTex.wrapS = THREE.RepeatWrapping;
  const boardMat = keep(new THREE.MeshStandardMaterial({ map: boardTex, emissive: "#ffffff", emissiveMap: boardTex, emissiveIntensity: 0.35, roughness: 0.6 }));
  const board = (len, x, z, rot) => {
    const g = keep(new THREE.BoxGeometry(len, 0.32, 0.05));
    const m = new THREE.Mesh(g, boardMat); m.position.set(x, 0.16, z); m.rotation.y = rot; m.castShadow = m.receiveShadow = true;
    boardTex.repeat.set(1, 1); scene.add(m);
  };
  board(BX * 2, 0, -BZ, 0); board(BX * 2, 0, BZ, Math.PI); board(BZ * 2, -BX, 0, Math.PI / 2); board(BZ * 2, BX, 0, -Math.PI / 2);
  const metal = keep(new THREE.MeshStandardMaterial({ color: "#9aa3ad", metalness: 0.8, roughness: 0.35 }));
  const lampMat = keep(new THREE.MeshStandardMaterial({ color: "#fffbe8", emissive: "#fff6d8", emissiveIntensity: 2.2 }));
  for (const [x, z] of [[-9, -7], [9, -7], [-9, 7], [9, 7]]) {
    const pole = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.07, 0.12, 7, 12)), metal); pole.position.set(x, 3.5, z); pole.castShadow = true;
    const head = new THREE.Mesh(keep(new THREE.BoxGeometry(1.3, 0.7, 0.18)), metal); head.position.set(x, 7.1, z); head.lookAt(0, 0, 0);
    const face = new THREE.Mesh(keep(new THREE.PlaneGeometry(1.15, 0.55)), lampMat); face.position.set(0, 0, 0.1); head.add(face);
    scene.add(pole, head);
  }
  const trees = new THREE.InstancedMesh(keep(new THREE.ConeGeometry(1, 1, 7)), keep(new THREE.MeshStandardMaterial({ color: "#2f4f2a", roughness: 1, flatShading: true })), 110);
  for (let k = 0; k < 110; k++) {
    const a = Math.random() * TAU, d = 20 + Math.random() * 26, h = 4 + Math.random() * 6;
    m4.compose(v3.set(Math.cos(a) * d * 1.25, h / 2, Math.sin(a) * d), q.identity(), s3.set(1.2 + Math.random(), h, 1.2 + Math.random()));
    trees.setMatrixAt(k, m4);
    trees.setColorAt(k, col.setHSL(0.28 + Math.random() * 0.06, 0.35, 0.18 + Math.random() * 0.1));
  }
  trees.castShadow = true;
  scene.add(trees);

  // Goals: posts, crossbar, a net, and at the far end the hoop to shoot through
  const white = keep(new THREE.MeshStandardMaterial({ color: "#f7f7f2", roughness: 0.35, metalness: 0.1 }));
  const netMat = keep(new THREE.LineBasicMaterial({ color: "#f4f4ee", transparent: true, opacity: 0.55 }));
  const goal = s => {
    const g = new THREE.Group();
    const post = keep(new THREE.CylinderGeometry(0.035, 0.035, GH, 16));
    for (const z of [-GW, GW]) { const p = new THREE.Mesh(post, white); p.position.set(s * HL, GH / 2, z); p.castShadow = true; g.add(p); }
    const bar = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.035, 0.035, GW * 2 + 0.07, 16)), white);
    bar.rotation.x = Math.PI / 2; bar.position.set(s * HL, GH, 0); bar.castShadow = true; g.add(bar);
    const pts = [], X0 = s * HL, X1 = s * (HL + GD), step = 0.1;
    for (let z = -GW; z <= GW + 1e-6; z += step) { pts.push(X1, 0, z, X1, GH * 0.75, z, X1, GH * 0.75, z, X0, GH, z); }
    for (let y = 0; y <= GH * 0.75 + 1e-6; y += step) pts.push(X1, y, -GW, X1, y, GW);
    for (let t = 0; t <= 1 + 1e-6; t += step / GD) { const x = lerp(X0, X1, t), y = lerp(GH, GH * 0.75, t); pts.push(x, y, -GW, x, y, GW); }
    for (const z of [-GW, GW]) {
      for (let t = 0; t <= 1 + 1e-6; t += step / GD) { const x = lerp(X0, X1, t); pts.push(x, 0, z, x, lerp(GH, GH * 0.75, t), z); }
      for (let y = 0; y <= GH + 1e-6; y += step) { const t = clamp((GH - y) / (GH * 0.25), 0, 1); pts.push(X0, y, z, lerp(X0, X1, y > GH * 0.75 ? 1 - (y - GH * 0.75) / (GH * 0.25) : 1), y, z); }
    }
    const ng = keep(new THREE.BufferGeometry()); ng.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    g.add(new THREE.LineSegments(ng, netMat));
    scene.add(g);
  };
  goal(1); goal(-1);
  const hoopMat = keep(new THREE.MeshStandardMaterial({ color: "#ff5a3c", emissive: "#ff3a1c", emissiveIntensity: 0.35, roughness: 0.4 }));
  const hoop = new THREE.Mesh(keep(new THREE.TorusGeometry(HOOP.r, 0.018, 12, 48)), hoopMat);
  hoop.position.set(HOOP.x, HOOP.y, HOOP.z); hoop.rotation.y = Math.PI / 2; hoop.castShadow = true;
  scene.add(hoop);
  const strings = keep(new THREE.BufferGeometry());
  strings.setAttribute("position", new THREE.Float32BufferAttribute([HOOP.x, HOOP.y + HOOP.r * 0.7, -HOOP.r * 0.7, HOOP.x, GH, -0.35, HOOP.x, HOOP.y + HOOP.r * 0.7, HOOP.r * 0.7, HOOP.x, GH, 0.35], 3));
  scene.add(new THREE.LineSegments(strings, keep(new THREE.LineBasicMaterial({ color: "#dddddd" }))));

  // ---------------------------------------------------------------- the ball: twelve dark pentagons on white
  const ballGeo = keep(new THREE.IcosahedronGeometry(R, 10));
  {
    const phi = (1 + Math.sqrt(5)) / 2, dirs = [];
    for (const a of [-1, 1]) for (const b of [-1, 1]) dirs.push([0, a, b * phi], [a, b * phi, 0], [b * phi, 0, a]);
    const dn = dirs.map(d => { const n = Math.hypot(...d); return d.map(c => c / n); });
    const pos = ballGeo.attributes.position, cols = [];
    for (let i = 0; i < pos.count; i += 3) {
      let cx = 0, cy = 0, cz = 0;
      for (let k = 0; k < 3; k++) { cx += pos.getX(i + k); cy += pos.getY(i + k); cz += pos.getZ(i + k); }
      const n = Math.hypot(cx, cy, cz); cx /= n; cy /= n; cz /= n;
      const best = Math.max(...dn.map(d => d[0] * cx + d[1] * cy + d[2] * cz));
      const c = best > 0.935 ? [0.06, 0.06, 0.07] : best > 0.925 ? [0.5, 0.5, 0.5] : [0.95, 0.95, 0.93];
      for (let k = 0; k < 3; k++) cols.push(...c);
    }
    ballGeo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  }
  const ballMesh = new THREE.Mesh(ballGeo, keep(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45 })));
  ballMesh.castShadow = true;
  scene.add(ballMesh);
  const ball = { p: new THREE.Vector3(1.5, R, 0.6), v: new THREE.Vector3(), w: new THREE.Vector3(), inGoal: 0, rest: 0 };

  // A fading trail behind a kicked ball, and a puff of grass at each kick
  const TRAIL = 70;
  const trailGeo = keep(new THREE.BufferGeometry());
  const trailPos = new Float32Array(TRAIL * 3), trailCol = new Float32Array(TRAIL * 3);
  trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
  trailGeo.setAttribute("color", new THREE.BufferAttribute(trailCol, 3));
  const trail = new THREE.Line(trailGeo, keep(new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85 })));
  trail.frustumCulled = false;
  scene.add(trail);
  let trailOn = 0;
  const resetTrail = () => { for (let k = 0; k < TRAIL; k++) trailPos.set([ball.p.x, ball.p.y, ball.p.z], k * 3); trailCol.fill(0); trailOn = 0; };
  const NP = 40, puffPos = new Float32Array(NP * 3), puffVel = new Float32Array(NP * 3);
  const puffGeo = keep(new THREE.BufferGeometry()); puffGeo.setAttribute("position", new THREE.BufferAttribute(puffPos, 3));
  const puffMat = keep(new THREE.PointsMaterial({ color: "#6f9a46", size: 0.025, transparent: true, opacity: 0 }));
  const puff = new THREE.Points(puffGeo, puffMat); puff.frustumCulled = false; scene.add(puff);
  let puffT = 0;
  const burst = at => { for (let k = 0; k < NP; k++) { puffPos.set([at.x, 0.02, at.z], k * 3); puffVel.set([gauss() * 0.5, 0.6 + Math.random() * 1.2, gauss() * 0.5], k * 3); } puffT = 1; };

  // ---------------------------------------------------------------- the robot dog
  const dark = keep(new THREE.MeshStandardMaterial({ color: "#2b2f36", metalness: 0.55, roughness: 0.38 }));
  const shell = keep(new THREE.MeshStandardMaterial({ color: "#c9ced6", metalness: 0.35, roughness: 0.32 }));
  const accent = keep(new THREE.MeshStandardMaterial({ color: "#ff8a3d", metalness: 0.3, roughness: 0.4 }));
  const rubber = keep(new THREE.MeshStandardMaterial({ color: "#141414", roughness: 0.9 }));
  const glass = keep(new THREE.MeshStandardMaterial({ color: "#0a0c10", metalness: 0.9, roughness: 0.08 }));
  const led = keep(new THREE.MeshStandardMaterial({ color: "#7fe9ff", emissive: "#46d7ff", emissiveIntensity: 2.4 }));
  const shadowed = m => { m.castShadow = true; m.receiveShadow = true; return m; };
  const robot = new THREE.Group(); scene.add(robot);
  const body = new THREE.Group(); robot.add(body);
  body.add(shadowed(new THREE.Mesh(keep(new THREE.BoxGeometry(0.42, 0.1, 0.18)), dark)));
  const cover = shadowed(new THREE.Mesh(keep(new THREE.CapsuleGeometry(0.075, 0.28, 6, 16)), shell)); cover.rotation.z = Math.PI / 2; cover.scale.set(1, 1, 1.1); cover.position.y = 0.035; body.add(cover);
  const face = shadowed(new THREE.Mesh(keep(new THREE.BoxGeometry(0.05, 0.085, 0.15)), dark)); face.position.set(0.225, 0.005, 0); body.add(face);
  const visor = new THREE.Mesh(keep(new THREE.BoxGeometry(0.012, 0.045, 0.12)), glass); visor.position.set(0.252, 0.012, 0); body.add(visor);
  for (const z of [-0.035, 0.035]) { const e = new THREE.Mesh(keep(new THREE.CircleGeometry(0.011, 16)), led); e.position.set(0.259, 0.014, z); e.rotation.y = Math.PI / 2; body.add(e); }
  const stripe = new THREE.Mesh(keep(new THREE.BoxGeometry(0.3, 0.012, 0.186)), accent); stripe.position.y = -0.01; body.add(stripe);
  const handle = shadowed(new THREE.Mesh(keep(new THREE.TorusGeometry(0.04, 0.008, 8, 20, Math.PI)), dark)); handle.position.set(-0.08, 0.1, 0); body.add(handle);
  const L1 = 0.2, L2 = 0.2;
  const HIPS = [[0.19, 0.105], [0.19, -0.105], [-0.19, 0.105], [-0.19, -0.105]];  // FR, FL, RR, RL (x forward, z right)
  const OFFSET = [0.5, 0, 0, 0.5];  // trot: FL with RR, FR with RL
  const thighGeo = keep(new THREE.CapsuleGeometry(0.024, L1 - 0.03, 4, 10)), calfGeo = keep(new THREE.CapsuleGeometry(0.014, L2 - 0.02, 4, 10));
  const motorGeo = keep(new THREE.CylinderGeometry(0.042, 0.042, 0.05, 20)), kneeGeo = keep(new THREE.SphereGeometry(0.024, 14, 10)), footGeo = keep(new THREE.SphereGeometry(0.021, 14, 10));
  const legs = HIPS.map(([hx, hz]) => {
    const hip = new THREE.Group(); hip.position.set(hx, -0.02, hz); body.add(hip);
    const motor = shadowed(new THREE.Mesh(motorGeo, dark)); motor.rotation.x = Math.PI / 2; motor.position.z = Math.sign(hz) * 0.01; hip.add(motor);
    const cap = new THREE.Mesh(keep(new THREE.CircleGeometry(0.03, 20)), accent); cap.position.z = Math.sign(hz) * 0.036; cap.rotation.y = hz > 0 ? 0 : Math.PI; hip.add(cap);
    const thigh = new THREE.Group(); thigh.position.z = Math.sign(hz) * 0.03; hip.add(thigh);
    const tm = shadowed(new THREE.Mesh(thighGeo, shell)); tm.position.y = -L1 / 2; thigh.add(tm);
    const knee = new THREE.Group(); knee.position.y = -L1; thigh.add(knee);
    knee.add(shadowed(new THREE.Mesh(kneeGeo, dark)));
    const cm = shadowed(new THREE.Mesh(calfGeo, dark)); cm.position.y = -L2 / 2; knee.add(cm);
    const foot = shadowed(new THREE.Mesh(footGeo, rubber)); foot.position.y = -L2; knee.add(foot);
    return { hip, thigh, knee, foot, hx, hz: hz + Math.sign(hz) * 0.03 };
  });
  const ik = (leg, fx, fy) => {   // foot target (fx, fy) relative to the hip, in the leg's plane (x forward, y up)
    const d = clamp(Math.hypot(fx, fy), 0.05, L1 + L2 - 0.002);
    const a = Math.atan2(fx, -fy), b = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const c = Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
    leg.thigh.rotation.z = a - b;
    leg.knee.rotation.z = Math.PI - c;
  };
  const H0 = 0.27;
  const dog = { x: -1.5, z: -0.6, yaw: 0.25, u: 0, s: 0, w: 0, phase: 0, au: 0, as: 0, kick: -1, kickLeg: 0, struck: false, act: 0 };

  // ---------------------------------------------------------------- ball physics
  const posts = []; for (const s of [-1, 1]) for (const z of [-GW, GW]) posts.push({ a: new THREE.Vector3(s * HL, 0, z), b: new THREE.Vector3(s * HL, GH, z) });
  for (const s of [-1, 1]) posts.push({ a: new THREE.Vector3(s * HL, GH, -GW), b: new THREE.Vector3(s * HL, GH, GW) });
  const seg = new THREE.Vector3(), cp = new THREE.Vector3(), nrm = new THREE.Vector3();
  let gust = 0, gustT = 0;
  const onEvent = { post: () => {}, goal: () => {}, hoop: () => {} };
  const stepBall = dt => {
    const b = ball, m = P.mass, wind = P.wind * (1 + 0.35 * gust);
    const rx = b.v.x, ry = b.v.y, rz = b.v.z - wind, sp = Math.hypot(rx, ry, rz);
    const k = 0.5 * 1.2 * 0.25 * Math.PI * R * R / m;
    b.v.x -= k * sp * rx * dt; b.v.y -= k * sp * ry * dt; b.v.z -= k * sp * rz * dt;
    const mg = 0.5 * 1.2 * Math.PI * R ** 3 * 0.9 / m;   // Magnus: a curling ball
    b.v.x += mg * (b.w.y * b.v.z - b.w.z * b.v.y) * dt; b.v.y += mg * (b.w.z * b.v.x - b.w.x * b.v.z) * dt; b.v.z += mg * (b.w.x * b.v.y - b.w.y * b.v.x) * dt;
    b.v.y -= G * dt;
    const prevX = b.p.x, prevY = b.p.y, prevZ = b.p.z;
    b.p.addScaledVector(b.v, dt);
    // the ground: bounce, then roll
    if (b.p.y < R) {
      b.p.y = R;
      if (b.v.y < -0.35) { b.v.y = -b.v.y * 0.55; b.v.x *= 0.92; b.v.z *= 0.92; }
      else b.v.y = 0;
    }
    if (b.p.y <= R + 0.002) {
      const hs = Math.hypot(b.v.x, b.v.z), dec = (P.roll * G + 0.02) * dt;
      if (hs <= dec) { b.v.x = 0; b.v.z = 0; } else { b.v.x *= (hs - dec) / hs; b.v.z *= (hs - dec) / hs; }
      b.w.set(b.v.z / R, b.w.y * (1 - 2 * dt), -b.v.x / R);
    } else b.w.multiplyScalar(1 - 0.2 * dt);
    // the boards
    if (Math.abs(b.p.z) > BZ - 0.03 - R) { b.p.z = Math.sign(b.p.z) * (BZ - 0.03 - R); b.v.z *= -0.5; }
    if (Math.abs(b.p.x) > BX - 0.03 - R) { b.p.x = Math.sign(b.p.x) * (BX - 0.03 - R); b.v.x *= -0.5; }
    // posts and crossbars
    for (const s of posts) {
      seg.subVectors(s.b, s.a);
      const t = clamp(cp.subVectors(b.p, s.a).dot(seg) / seg.lengthSq(), 0, 1);
      cp.copy(s.a).addScaledVector(seg, t);
      nrm.subVectors(b.p, cp); const d = nrm.length();
      if (d < R + 0.035 && d > 1e-6) {
        nrm.divideScalar(d); b.p.copy(cp).addScaledVector(nrm, R + 0.035);
        const vn = b.v.dot(nrm);
        if (vn < 0) { b.v.addScaledVector(nrm, -1.7 * vn); if (-vn > 1.2) onEvent.post(); }
      }
    }
    // crossing a goal line: through the mouth means into the net; and through the hoop?
    for (const s of [-1, 1]) {
      const line = s * HL;
      if ((prevX - line) * (b.p.x - line) <= 0 && prevX !== b.p.x && !b.inGoal) {
        const t = (line - prevX) / (b.p.x - prevX), cz = lerp(prevZ, b.p.z, t), cy = lerp(prevY, b.p.y, t);
        if (Math.abs(cz) < GW - 0.02 && cy < GH - 0.02 && Math.sign(b.p.x - prevX) === s) {
          b.inGoal = s;
          if (s > 0) {
            const hoopHit = Math.hypot(cy - HOOP.y, cz - HOOP.z) < HOOP.r - R * 0.6;
            onEvent.goal(hoopHit);
          }
        }
      }
    }
    // inside a net: soft walls; outside a goal: keep out of the frame
    const s = Math.sign(b.p.x), ax = Math.abs(b.p.x);
    if (b.inGoal && b.inGoal === s) {
      const backX = HL + GD - R;
      if (ax > backX) { b.p.x = s * backX; b.v.x *= -0.15; b.v.z *= 0.7; b.v.y *= 0.7; }
      if (Math.abs(b.p.z) > GW - R) { b.p.z = Math.sign(b.p.z) * (GW - R); b.v.z *= -0.2; b.v.x *= 0.8; }
      const roof = lerp(GH, GH * 0.75, clamp((ax - HL) / GD, 0, 1)) - R;
      if (b.p.y > roof) { b.p.y = roof; b.v.y *= -0.2; }
    } else if (ax > HL && ax < HL + GD + R && Math.abs(b.p.z) < GW + R && b.p.y < GH + R) {
      const pen = [{ d: HL + GD + R - ax, f: () => { b.p.x = s * (HL + GD + R); b.v.x = Math.abs(b.v.x) * s * 0.2; } },
        { d: GW + R - Math.abs(b.p.z), f: () => { b.p.z = Math.sign(b.p.z) * (GW + R); b.v.z = Math.abs(b.v.z) * Math.sign(b.p.z) * 0.2; } },
        { d: GH + R - b.p.y, f: () => { b.p.y = GH + R; b.v.y = Math.abs(b.v.y) * 0.2; } }].sort((a, c) => a.d - c.d);
      pen[0].f();
    }
  };

  // The robot's body pushes the ball (a dribble), and a front foot strikes it during a kick
  const heading = () => [Math.cos(dog.yaw), -Math.sin(dog.yaw)];
  const rightOf = () => [Math.sin(dog.yaw), Math.cos(dog.yaw)];
  const pushBall = () => {
    if (ball.p.y > 0.36) return;
    const [hx, hz] = heading();
    for (const [off, rad] of [[0, 0.2], [0.18, 0.13], [-0.18, 0.13]]) {
      const cx = dog.x + hx * off, cz = dog.z + hz * off;
      const dx = ball.p.x - cx, dz = ball.p.z - cz, d = Math.hypot(dx, dz), min = rad + R;
      if (d < min && d > 1e-6) {
        const nx = dx / d, nz = dz / d;
        ball.p.x = cx + nx * min; ball.p.z = cz + nz * min;
        const [vx, vz] = worldVel();
        const rel = (ball.v.x - vx) * nx + (ball.v.z - vz) * nz;
        if (rel < 0) { ball.v.x -= 1.25 * rel * nx; ball.v.z -= 1.25 * rel * nz; }
      }
    }
  };
  const worldVel = () => { const [hx, hz] = heading(), [rx, rz] = rightOf(); return [hx * dog.u + rx * dog.s, hz * dog.u + rz * dog.s]; };
  const footW = new THREE.Vector3();
  let plannedJ = 2.4;
  const strike = () => {
    const leg = legs[dog.kickLeg];
    leg.foot.getWorldPosition(footW);
    if (footW.distanceTo(ball.p) > R + 0.07) return false;
    const [hx, hz] = heading();
    let dx = ball.p.x - footW.x, dz = ball.p.z - footW.z; const n = Math.hypot(dx, dz) || 1; dx /= n; dz /= n;
    let ax = hx * 0.75 + dx * 0.25, az = hz * 0.75 + dz * 0.25; const an = Math.hypot(ax, az); ax /= an; az /= an;
    const err = gauss() * 0.035, c = Math.cos(err), s = Math.sin(err);
    [ax, az] = [ax * c - az * s, ax * s + az * c];
    const v = plannedJ / P.mass * (0.94 + Math.random() * 0.1);
    const loft = 0.12 + Math.random() * 0.22;
    ball.v.set(ax * v, v * loft, az * v);
    ball.w.set(gauss() * 4, gauss() * 6, gauss() * 4);
    ball.inGoal = 0; resetTrail(); trailOn = 1; burst(ball.p);
    return true;
  };

  // ---------------------------------------------------------------- the policy: reach, kick, wait
  const seen = { x: ball.p.x, z: ball.p.z, t: 0 };
  let stage_ = "Reach", mode = "policy", episodeT = 0, waitT = 0, kicked = false, outcome = null;
  const stats = { kicks: 0, goals: 0, hoops: 0 };
  const sense = dt => {   // the head camera's ball estimate: noisy samples at 30 Hz, filtered
    seen.t += dt;
    if (seen.t < 1 / 30) return;
    seen.t = 0;
    const a = P.robust ? 0.22 : 0.6;
    seen.x = lerp(seen.x, ball.p.x + gauss() * P.noise, a);
    seen.z = lerp(seen.z, ball.p.z + gauss() * P.noise, a);
  };
  const policy = () => {
    const tx = HL + 0.2, tz = HOOP.z;
    const bx = seen.x, bz = seen.z;
    let dx = tx - bx, dz = tz - bz; const dist = Math.hypot(dx, dz); dx /= dist; dz /= dist;
    // a policy trained with randomization has learned to read the conditions; a nominal one assumes training's
    const est = P.robust ? { mass: P.mass * (1 + gauss() * 0.04), roll: P.roll * (1 + gauss() * 0.05), wind: P.wind } : NOMINAL;
    if (est.wind) { const aimZ = tz - est.wind * dist * 0.045 * (0.43 / est.mass); dz = (aimZ - bz); dx = tx - bx; const n = Math.hypot(dx, dz); dx /= n; dz /= n; }
    const STAND = 0.43;
    const px = bx - dx * STAND, pz = bz - dz * STAND;
    let gx = px, gz = pz;
    const behind = (dog.x - bx) * dx + (dog.z - bz) * dz;
    if (behind > -0.15) {   // on the wrong side of the ball: walk round it
      const side = Math.sign((dog.x - bx) * -dz + (dog.z - bz) * dx) || 1;
      gx = bx - dx * 0.55 - dz * side * 0.6; gz = bz - dz * 0.55 + dx * side * 0.6;
    }
    const ex = gx - dog.x, ez = gz - dog.z, ed = Math.hypot(ex, ez);
    const faceYaw = Math.atan2(-dz, dx), travelYaw = Math.atan2(-ez, ex);
    const want = ed > 0.7 && behind <= -0.15 ? travelYaw : ed > 0.9 ? travelYaw : faceYaw;
    const yawErr = wrap(want - dog.yaw);
    const sp = Math.min(1.5, ed * 2.4) * (Math.abs(yawErr) > 1.2 ? 0.4 : 1);
    const [hx, hz] = heading(), [rx, rz] = rightOf();
    const vx = ed > 1e-3 ? ex / ed * sp : 0, vz = ed > 1e-3 ? ez / ed * sp : 0;
    const cmd = { u: vx * hx + vz * hz, s: vx * rx + vz * rz, w: clamp(yawErr * 3.2, -2.6, 2.6), kick: false };
    const aligned = Math.abs(wrap(faceYaw - dog.yaw)) < 0.09;
    const ballSlow = Math.hypot(ball.v.x, ball.v.z) < 0.25;
    if (behind <= -0.15 && Math.hypot(px - dog.x, pz - dog.z) < 0.06 && aligned && ballSlow && Math.hypot(dog.u, dog.s) < 0.35) {
      cmd.kick = true;
      const need = Math.sqrt(1.4 ** 2 + 2 * (est.roll * G + 0.02) * dist) * 1.08;
      plannedJ = clamp(est.mass * need, 0.8, 6);
    }
    stage_ = ed < 0.25 ? "Kick" : "Reach";
    return cmd;
  };

  // Keyboard and touch driving
  const keys = new Set();
  const driveKeys = { KeyW: 1, KeyS: 1, KeyA: 1, KeyD: 1, KeyQ: 1, KeyE: 1, ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1, Space: 1 };
  let wantKick = false, focused = false;
  const onKey = e => {
    if (mode !== "drive" || !focused || !driveKeys[e.code]) return;
    e.preventDefault();
    if (e.type === "keydown") { keys.add(e.code); if (e.code === "Space") wantKick = true; } else keys.delete(e.code);
  };
  addEventListener("keydown", onKey); addEventListener("keyup", onKey);
  box.addEventListener("focusin", () => { focused = true; });
  box.addEventListener("focusout", e => { if (!box.contains(e.relatedTarget)) { focused = false; keys.clear(); } });
  box.addEventListener("pointerdown", () => { focused = true; });
  const stick = { on: false, id: -1, x0: 0, y0: 0, x: 0, y: 0 };
  const drive = () => {
    let u = 0, s = 0, w = 0;
    if (keys.has("KeyW") || keys.has("ArrowUp")) u += 1.4;
    if (keys.has("KeyS") || keys.has("ArrowDown")) u -= 0.7;
    if (keys.has("KeyA") || keys.has("ArrowLeft")) w += 2.2;
    if (keys.has("KeyD") || keys.has("ArrowRight")) w -= 2.2;
    if (keys.has("KeyQ")) s -= 0.7;
    if (keys.has("KeyE")) s += 0.7;
    if (stick.on) { u += clamp(-(stick.y - stick.y0) / 60, -0.6, 1) * 1.4; w += clamp(-(stick.x - stick.x0) / 60, -1, 1) * 2.2; }
    const k = wantKick; wantKick = false;
    if (k) plannedJ = 2.4;   // your kick: the same leg strength whatever the ball
    stage_ = "You’re driving";
    return { u, s, w, kick: k };
  };

  // ---------------------------------------------------------------- the robot's motion: commands to gait
  const walk = (cmd, dt) => {
    const acc = 3.2, yacc = 9;
    const pu = dog.u, ps = dog.s;
    if (dog.kick >= 0) { cmd.u = 0; cmd.s = 0; cmd.w = 0; }
    dog.u += clamp(cmd.u - dog.u, -acc * dt, acc * dt);
    dog.s += clamp(cmd.s - dog.s, -acc * dt, acc * dt);
    dog.w += clamp(cmd.w - dog.w, -yacc * dt, yacc * dt);
    dog.au = lerp(dog.au, (dog.u - pu) / dt, 0.1); dog.as = lerp(dog.as, (dog.s - ps) / dt, 0.1);
    dog.yaw = wrap(dog.yaw + dog.w * dt);
    const [vx, vz] = worldVel();
    dog.x = clamp(dog.x + vx * dt, -BX + 0.35, BX - 0.35);
    dog.z = clamp(dog.z + vz * dt, -BZ + 0.35, BZ - 0.35);
    if (Math.abs(dog.x) > HL - 0.3 && Math.abs(dog.z) < GW + 0.3) dog.x = Math.sign(dog.x) * (HL - 0.3);   // goals are solid
    if (cmd.kick && dog.kick < 0) {
      dog.kick = 0; dog.struck = false;
      const [rx, rz] = rightOf();
      dog.kickLeg = (ball.p.x - dog.x) * rx + (ball.p.z - dog.z) * rz >= 0 ? 0 : 1;
    }
  };
  const KICK = 0.42;
  const pose = dt => {
    const speed = Math.hypot(dog.u, dog.s) + Math.abs(dog.w) * 0.2;
    dog.act = lerp(dog.act, clamp(speed / 0.12, 0, 1), 1 - Math.exp(-dt * 8));
    const f = 1.7 + 1.3 * Math.min(speed, 1.5);
    dog.phase = (dog.phase + f * dt * dog.act) % 1;
    const Tst = 0.5 / f;
    let kickRoll = 0, kickPitch = 0;
    if (dog.kick >= 0) {
      const t = dog.kick / KICK;
      kickRoll = Math.sin(Math.PI * Math.min(t * 1.4, 1)) * 0.07 * (dog.kickLeg === 0 ? -1 : 1);
      kickPitch = Math.sin(Math.PI * t) * 0.06;
    }
    body.position.y = H0 - 0.01 * Math.abs(Math.sin(TAU * dog.phase)) * dog.act;
    body.rotation.z = clamp(-dog.au * 0.018, -0.08, 0.08) + kickPitch;
    body.rotation.x = clamp(dog.as * 0.02 + dog.w * dog.u * 0.03, -0.1, 0.1) + kickRoll;
    legs.forEach((leg, i) => {
      let ox = 0, oz = 0, lift = 0;
      if (dog.kick >= 0 && i === dog.kickLeg) {
        const t = dog.kick, inward = -leg.hz * 0.75;
        if (t < 0.15) { const k = smooth(t / 0.15); ox = -0.13 * k; lift = 0.11 * k; oz = inward * k; }
        else if (t < 0.24) { const k = smooth((t - 0.15) / 0.09); ox = lerp(-0.13, 0.27, k); lift = lerp(0.11, 0.075, k); oz = inward; }
        else { const k = smooth(Math.min((t - 0.24) / 0.18, 1)); ox = lerp(0.27, 0, k); lift = lerp(0.075, 0, k) + Math.sin(Math.PI * k) * 0.03; oz = inward * (1 - k); }
      } else {
        const p = (dog.phase + OFFSET[i]) % 1;
        const fu = dog.u + dog.w * leg.hz, fs = dog.s - dog.w * leg.hx;
        const Sx = fu * Tst, Sz = fs * Tst;
        if (p < 0.5) { const k = 0.5 - 2 * p; ox = Sx * k; oz = Sz * k; }
        else { const k = smooth((p - 0.5) * 2); ox = Sx * (k - 0.5); oz = Sz * (k - 0.5); lift = 0.06 * Math.sin(Math.PI * (p - 0.5) * 2) * dog.act; }
      }
      const footY = -body.position.y + 0.021 + lift;
      ik(leg, ox + 0.01, footY - leg.hip.position.y);
      leg.hip.rotation.x = clamp(-oz * 1.2 + body.rotation.x * -0.6, -0.35, 0.35);
    });
    robot.position.set(dog.x, 0, dog.z);
    robot.rotation.y = dog.yaw;
  };

  // ---------------------------------------------------------------- episodes and the scoreboard
  const say = (text, kind) => {
    toast.textContent = text;
    toast.className = `sim-toast show ${kind || ""}`;
    clearTimeout(say.t); say.t = setTimeout(() => { toast.className = "sim-toast"; }, 1500);
  };
  const showScore = () => {
    const acc = stats.kicks ? `${Math.round(stats.goals / stats.kicks * 100)}%` : "–";
    score.textContent = `Kicks ${stats.kicks} · Goals ${stats.goals} · Through the hoop ${stats.hoops} · On target ${acc}`;
  };
  onEvent.goal = hoopHit => { if (!kicked) return; stats.goals++; if (hoopHit) stats.hoops++; outcome = hoopHit ? "hoop" : "goal"; say(hoopHit ? "Through the hoop" : "Goal", "good"); showScore(); };
  onEvent.post = () => { if (kicked && !outcome) say("Off the post", ""); };
  const newBall = () => {
    for (let k = 0; k < 20; k++) {
      ball.p.set(-3 + Math.random() * 6.5, 0.55, (Math.random() - 0.5) * 5.6);
      if (Math.hypot(ball.p.x - dog.x, ball.p.z - dog.z) > 0.9) break;
    }
    ball.v.set(0, 0, 0); ball.w.set(0, 0, 0); ball.inGoal = 0; ball.rest = 0;
    seen.x = ball.p.x; seen.z = ball.p.z;
    kicked = false; outcome = null; episodeT = 0; waitT = 0; trailOn = 0; trailCol.fill(0);
  };
  const episode = dt => {
    episodeT += dt;
    const moving = Math.hypot(ball.v.x, ball.v.y, ball.v.z) > 0.06;
    ball.rest = moving ? 0 : ball.rest + dt;
    if (kicked) {
      stage_ = mode === "policy" ? "Wait" : stage_;
      waitT += dt;
      if ((ball.rest > 0.8 || ball.inGoal) && !outcome) {
        outcome = "miss";
        const short = ball.p.x < HL - 0.2 && Math.abs(ball.p.z) < GW + 0.6;
        say(short ? "Short" : "Wide", "bad");
      }
      if ((outcome && (ball.rest > 0.7 || waitT > 2.2) && waitT > 1.3) || waitT > 7) { if (mode === "policy" || outcome !== "miss" || ball.inGoal) newBall(); else { kicked = false; outcome = null; waitT = 0; } }
    } else if (mode === "policy" && episodeT > 16) newBall();
    if (mode === "drive" && ball.inGoal && !kicked) { waitT += dt; if (waitT > 1.5) newBall(); }
  };

  // ---------------------------------------------------------------- cameras
  let camMode = "broadcast", az = 2.05, el_ = 0.36, dist = 6.5;
  const look = new THREE.Vector3(1, 0.3, 0), camPos = new THREE.Vector3(), wantLook = new THREE.Vector3(), wantPos = new THREE.Vector3();
  const setCam = k => {
    camMode = k;
    for (const [n, b] of Object.entries(camButtons)) b.setAttribute("aria-pressed", String(n === k));
    box.classList.toggle("eye-on", k === "eye");
    camera.fov = k === "eye" ? 78 : 42; camera.updateProjectionMatrix();
    snapCam = true;
  };
  let snapCam = true;
  const placeCam = dt => {
    const [hx, hz] = heading();
    if (camMode === "broadcast") {
      const sep = Math.hypot(dog.x - ball.p.x, dog.z - ball.p.z);
      const d = dist * clamp(0.45 + sep * 0.18, 0.5, 1.1);
      wantLook.set(lerp(dog.x, ball.p.x, 0.5), 0.2, lerp(dog.z, ball.p.z, 0.5));
      wantPos.set(wantLook.x + Math.cos(az) * Math.cos(el_) * d, Math.sin(el_) * d + 0.15, wantLook.z + Math.sin(az) * Math.cos(el_) * d);
    } else if (camMode === "follow") {
      wantLook.set(dog.x + hx * 0.9, 0.22, dog.z + hz * 0.9);
      wantPos.set(dog.x - hx * 1.35, 0.75, dog.z - hz * 1.35);
    } else {
      body.updateMatrixWorld(); visor.getWorldPosition(wantPos); wantPos.y += 0.02;
      wantLook.set(wantPos.x + hx, wantPos.y - 0.18 - body.rotation.z, wantPos.z + hz);
    }
    const k = snapCam || camMode === "eye" ? 1 : 1 - Math.exp(-dt * (camMode === "follow" ? 5 : 2.5));
    look.lerp(wantLook, k); camPos.lerp(wantPos, k); snapCam = false;
    camera.position.copy(camPos); camera.lookAt(look);
  };
  const drag = { on: false, x: 0, y: 0 };
  canvas.addEventListener("pointerdown", e => {
    canvas.focus({ preventScroll: true });
    if (mode === "drive" && e.pointerType !== "mouse") { Object.assign(stick, { on: true, id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY }); canvas.setPointerCapture(e.pointerId); return; }
    if (camMode !== "broadcast") return;
    Object.assign(drag, { on: true, x: e.clientX, y: e.clientY }); canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", e => {
    if (stick.on && e.pointerId === stick.id) { stick.x = e.clientX; stick.y = e.clientY; return; }
    if (!drag.on) return;
    az += (e.clientX - drag.x) * 0.006; el_ = clamp(el_ + (e.clientY - drag.y) * 0.004, 0.12, 1.25);
    drag.x = e.clientX; drag.y = e.clientY;
  });
  const endDrag = e => { if (e.pointerId === stick.id) stick.on = false; drag.on = false; };
  canvas.addEventListener("pointerup", endDrag); canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("wheel", e => { if (camMode !== "broadcast" || !focused) return; e.preventDefault(); dist = clamp(dist * Math.exp(e.deltaY * 0.001), 2.5, 14); }, { passive: false });

  // ---------------------------------------------------------------- controls
  const setMode = m => {
    mode = m;
    modePolicy.setAttribute("aria-pressed", String(m === "policy"));
    modeDrive.setAttribute("aria-pressed", String(m === "drive"));
    kickBtn.hidden = m !== "drive" || !touch;
    hint.textContent = m === "drive"
      ? (touch ? "Drag on the pitch to walk and turn; tap Kick when the ball is at its front feet." : "W and S walk, A and D turn, Q and E step sideways, Space kicks. Click the pitch first.")
      : "The policy walks to the ball, lines up and kicks at the hoop. It was tuned for a 430 g ball on medium grass, with no wind and clean sensing; change those and see what happens.";
    if (m === "drive") { canvas.focus({ preventScroll: true }); focused = true; if (camMode === "broadcast") setCam("follow"); }
    keys.clear();
  };
  modePolicy.addEventListener("click", () => setMode("policy"));
  modeDrive.addEventListener("click", () => setMode("drive"));
  kickBtn.addEventListener("click", () => { wantKick = true; });
  for (const b of Object.values(camButtons)) b.addEventListener("click", () => setCam(b.dataset.cam));
  let paused = false;
  pauseBtn.addEventListener("click", () => { paused = !paused; pauseBtn.textContent = paused ? "Play" : "Pause"; pauseBtn.setAttribute("aria-pressed", String(paused)); });
  resetBtn.addEventListener("click", newBall);
  nominalBtn.addEventListener("click", () => { for (const k of Object.keys(NOMINAL)) { P[k] = NOMINAL[k]; fields[k].input.value = NOMINAL[k]; fields[k].show(); } });

  // ---------------------------------------------------------------- the loop
  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize); ro.observe(stage);
  let visible = true;
  const io = new IntersectionObserver(es => { visible = es.some(e => e.isIntersecting); if (visible && !raf) raf = requestAnimationFrame(frame); }, { threshold: 0 });
  io.observe(stage);
  let raf = 0, last = performance.now(), acc = 0, clock = 0;
  const STEP = 1 / 240;
  const frame = now => {
    raf = 0;
    if (!visible) return;
    const dt = Math.min((now - last) / 1000, 1 / 20); last = now;
    if (!paused && dt > 1e-4) {
      clock += dt; timeU.value = clock;
      gustT -= dt; if (gustT <= 0) { gust = gauss() * 0.6; gustT = 0.5 + Math.random() * 1.5; }
      windU.value = lerp(windU.value, 0.35 + P.wind / 5 * (1 + gust * 0.4), 0.05);
      sense(dt);
      const cmd = mode === "policy" ? policy() : drive();
      walk(cmd, dt);
      if (dog.kick >= 0) {
        dog.kick += dt;
        if (dog.kick > 0.15 && dog.kick < 0.27 && !dog.struck) { body.updateMatrixWorld(true); if (strike()) { dog.struck = true; kicked = true; stats.kicks++; showScore(); } }
        if (dog.kick > KICK) dog.kick = -1;
      }
      acc += dt;
      while (acc >= STEP) { stepBall(STEP); pushBall(); acc -= STEP; }
      episode(dt);
      pose(dt);
      ballMesh.position.copy(ball.p);
      const wl = ball.w.length();
      if (wl > 1e-4) { q.setFromAxisAngle(v3.copy(ball.w).divideScalar(wl), wl * dt); ballMesh.quaternion.premultiply(q); }
      if (trailOn) {
        trailPos.copyWithin(3, 0, (TRAIL - 1) * 3); trailPos.set([ball.p.x, ball.p.y, ball.p.z], 0);
        for (let k = 0; k < TRAIL; k++) { const f = (1 - k / TRAIL) * trailOn; trailCol.set([1 * f, 0.82 * f, 0.25 * f], k * 3); }
        trailGeo.attributes.position.needsUpdate = trailGeo.attributes.color.needsUpdate = true;
        if (!kicked) trailOn = Math.max(0, trailOn - dt);
      }
      if (puffT > 0) {
        puffT -= dt * 1.4;
        for (let k = 0; k < NP; k++) { puffVel[k * 3 + 1] -= G * 0.5 * dt; for (let a = 0; a < 3; a++) puffPos[k * 3 + a] += puffVel[k * 3 + a] * dt; if (puffPos[k * 3 + 1] < 0) puffPos[k * 3 + 1] = 0; }
        puffGeo.attributes.position.needsUpdate = true; puffMat.opacity = Math.max(puffT, 0);
      }
      hoopMat.emissiveIntensity = lerp(hoopMat.emissiveIntensity, outcome === "hoop" ? 2.5 : 0.35, 0.08);
      chip.textContent = stage_;
    }
    placeCam(dt);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };

  setMode("policy"); setCam("broadcast"); showScore(); resetTrail(); pose(0.016);
  resize();
  raf = requestAnimationFrame(t => { last = t; frame(t); });

  return {
    dispose() {
      cancelAnimationFrame(raf); raf = 0; visible = false;
      ro.disconnect(); io.disconnect();
      removeEventListener("keydown", onKey); removeEventListener("keyup", onKey);
      clearTimeout(say.t);
      blades.dispose(); trees.dispose();
      for (const d of disposables) d.dispose();
      renderer.dispose();
      box.remove();
    },
  };
};
