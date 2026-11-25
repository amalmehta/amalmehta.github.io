// Research & work, PhysicsAI: a live fighter-jet flight simulation, opened in place by jet.js.
// An island of mountains and valleys in a hazy sea, clouds, and a course of glowing gates. Fly the jet yourself,
// or hand the stick to the autopilot, which flies the gates.
//   Flight: thrust that thins with altitude, lift from angle of attack with a stall, induced drag, sideslip,
//     gravity, turbulence; a fly-by-wire layer turns the stick into roll, pitch and yaw rates, with a 9 g limit.
//   The jet can change under you: a damaged wing (less roll authority and a roll to the left), a heavy payload
//     (a slower nose), a weaker engine, turbulence. "New jet" draws a new one at random, like a new task.
//   The autopilot adapts the way a meta-learned agent does: from a few seconds of flying it infers what this jet
//     is like (its roll and pitch authority and its trim, a small learned summary of the task) and flies
//     with that. The panel shows its guess against the truth. Turn adaptation off and watch it struggle.
// Defines window.JetWorld(THREE, host) → { dispose }. Plain script (no import), so it loads like the others.
window.JetWorld = (THREE, host) => {
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const lerp = (a, b, t) => a + (b - a) * t;
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };
  const touch = matchMedia("(pointer: coarse)").matches;
  const G = 9.81;

  // ---------------------------------------------------------------- terrain: an island from layered noise
  const hash = (i, j) => { let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967295; };
  const noise = (x, z) => {
    const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi;
    const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
    const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
    return lerp(lerp(a, b, u), lerp(c, d, u), v);
  };
  const fbm = (x, z, oct) => { let s = 0, a = 0.5, f = 1; for (let k = 0; k < oct; k++) { s += a * noise(x * f + k * 17.3, z * f - k * 9.1); a *= 0.5; f *= 2.03; } return s; };
  const ridged = (x, z) => { let s = 0, a = 0.5, f = 1; for (let k = 0; k < 4; k++) { const n = 1 - Math.abs(2 * noise(x * f + 40, z * f - 70) - 1); s += a * n * n; a *= 0.5; f *= 2.1; } return s; };
  const height = (x, z) => {
    const r = Math.hypot(x * 0.9, z) / 7200;
    const mask = 1 - sstep(0.42, 1.0, r);
    const base = fbm(x / 2600, z / 2600, 5), ridge = ridged(x / 1900, z / 1900);
    return ((base - 0.32) * 1100 + ridge * 1500 * sstep(0.2, 0.75, base)) * mask - 160 * (1 - mask) - 25;
  };

  // ---------------------------------------------------------------- DOM: stage, HUD and controls
  const el = (tag, cls, parent, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; if (parent) parent.appendChild(n); return n; };
  const box = el("div", "sim-box jet-box", host);
  const stage = el("div", "sim-stage", box);
  const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true, powerPreference: "high-performance" });
  const canvas = renderer.domElement;
  canvas.className = "sim-canvas";
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "A 3D flight simulation: a fighter jet flies over a mountainous island through a course of gates");
  stage.appendChild(canvas);
  const hudCanvas = el("canvas", "jet-hud", stage);
  const hud = hudCanvas.getContext("2d");
  const cams = el("div", "sim-cams", stage);
  cams.setAttribute("role", "group"); cams.setAttribute("aria-label", "Camera");
  const camButtons = {};
  for (const [k, label] of [["chase", "Chase"], ["cockpit", "Cockpit"], ["orbit", "Orbit"]]) {
    const b = el("button", "sim-btn", cams, label); b.type = "button"; b.dataset.cam = k; camButtons[k] = b;
  }
  const toast = el("div", "sim-toast", stage);
  toast.setAttribute("aria-live", "polite");

  const panel = el("div", "sim-panel", box);
  const row = el("div", "sim-row", panel);
  const modes = el("div", "sim-seg", row);
  modes.setAttribute("role", "group"); modes.setAttribute("aria-label", "Who flies");
  const modeAuto = el("button", "sim-btn", modes, "Autopilot"); modeAuto.type = "button";
  const modeYou = el("button", "sim-btn", modes, "You fly"); modeYou.type = "button";
  const pauseBtn = el("button", "sim-btn", row, "Pause"); pauseBtn.type = "button";
  const restartBtn = el("button", "sim-btn", row, "Restart"); restartBtn.type = "button";
  const newJetBtn = el("button", "sim-btn", row, "New jet"); newJetBtn.type = "button";
  const healBtn = el("button", "sim-btn", row, "Undamaged jet"); healBtn.type = "button";

  const J = { damage: 0, payload: 0, engine: 1, turb: 0.15, adapt: true };
  const sliders = el("div", "sim-sliders", panel);
  const fields = {};
  const slider = (key, label, min, max, step, fmt) => {
    const w = el("label", "sim-slider", sliders);
    const top = el("span", "sim-slider-top", w);
    el("span", "", top, label);
    const out = el("output", "", top);
    const input = el("input", "", w);
    Object.assign(input, { type: "range", min, max, step, value: J[key] });
    const show = () => { out.textContent = fmt(+input.value); };
    input.addEventListener("input", () => { J[key] = +input.value; show(); });
    show();
    fields[key] = { input, show, set: v => { J[key] = v; input.value = v; show(); } };
  };
  slider("damage", "Left wing damage", 0, 0.8, 0.01, v => `${Math.round(v * 100)}%`);
  slider("payload", "Payload", 0, 6000, 100, v => `${(v / 1000).toFixed(1)} t`);
  slider("engine", "Engine power", 0.45, 1, 0.01, v => `${Math.round(v * 100)}%`);
  slider("turb", "Turbulence", 0, 1, 0.01, v => (v < 0.2 ? "calm" : v < 0.5 ? "light" : v < 0.8 ? "moderate" : "severe"));
  const adaptLabel = el("label", "sim-check", sliders);
  const adapt = el("input", "", adaptLabel); adapt.type = "checkbox"; adapt.checked = true;
  el("span", "", adaptLabel, "Autopilot adapts to this jet");
  adapt.addEventListener("change", () => { J.adapt = adapt.checked; if (!J.adapt) resetEstimates(); });

  const est = el("div", "jet-est", panel);
  el("p", "jet-est-title", est, "What the autopilot has worked out about this jet");
  const bars = {};
  for (const [k, label] of [["rollEff", "Roll authority"], ["rollTrim", "Roll trim"], ["pitchEff", "Pitch authority"]]) {
    const r = el("div", "jet-bar", est);
    el("span", "jet-bar-label", r, label);
    const track = el("span", "jet-bar-track", r);
    const truth = el("span", "jet-bar-truth", track);
    const guess = el("span", "jet-bar-guess", track);
    const val = el("span", "jet-bar-val", r);
    bars[k] = { truth, guess, val };
  }
  el("p", "jet-est-key", est, "Bar: its guess. Tick: the truth.");
  const hint = el("p", "sim-hint", panel, "");

  // ---------------------------------------------------------------- renderer, scene, sky
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const HAZE = new THREE.Color("#c9d8e6"), ZENITH = new THREE.Color("#3f74c4");
  scene.fog = new THREE.FogExp2(HAZE, 0.000085);
  const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.3, 90000);
  const disposables = [];
  const keep = x => { disposables.push(x); return x; };
  const SUN = new THREE.Vector3(0.45, 0.55, -0.7).normalize();
  const sky = new THREE.Mesh(keep(new THREE.SphereGeometry(50000, 32, 16)), keep(new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    uniforms: { uSun: { value: SUN }, uHor: { value: HAZE }, uZen: { value: ZENITH } },
    vertexShader: "varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }",
    fragmentShader: `varying vec3 vDir; uniform vec3 uSun, uHor, uZen;
      void main(){ vec3 d = normalize(vDir); float h = max(d.y, 0.);
        vec3 c = mix(uHor, uZen, pow(h, 0.5));
        float s = max(dot(d, uSun), 0.);
        c += vec3(1.0, 0.92, 0.75) * (pow(s, 8.) * 0.22 + pow(s, 90.) * 0.5) + vec3(1.0) * pow(s, 1800.) * 6.;
        c = mix(c, uHor * 0.85, smoothstep(0.0, -0.12, d.y));
        gl_FragColor = vec4(c, 1.); }`,
  })));
  sky.renderOrder = -10; sky.frustumCulled = false;
  scene.add(sky);
  scene.add(new THREE.HemisphereLight("#d6e6ff", "#56604a", 1.15));
  const sun = new THREE.DirectionalLight("#fff3dd", 3.0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 400 });
  sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.05;
  scene.add(sun, sun.target);

  // Terrain mesh, coloured by height and slope
  const SIZE = 19000, N = touch ? 220 : 320;
  const tGeo = keep(new THREE.PlaneGeometry(SIZE, SIZE, N, N));
  tGeo.rotateX(-Math.PI / 2);
  const tp = tGeo.attributes.position;
  for (let i = 0; i < tp.count; i++) tp.setY(i, height(tp.getX(i), tp.getZ(i)));
  tGeo.computeVertexNormals();
  const tn = tGeo.attributes.normal, colors = new Float32Array(tp.count * 3);
  const C = { deep: new THREE.Color("#8a7d5c"), sand: new THREE.Color("#d9c99a"), grass: new THREE.Color("#6b9445"), meadow: new THREE.Color("#7fa452"), forest: new THREE.Color("#3c6230"), rock: new THREE.Color("#7c756c"), dark: new THREE.Color("#5a554f"), snow: new THREE.Color("#f4f6f9") };
  const tc = new THREE.Color();
  for (let i = 0; i < tp.count; i++) {
    const h = tp.getY(i), ny = tn.getY(i), x = tp.getX(i), z = tp.getZ(i);
    const n = noise(x / 300, z / 300);
    if (h < 0) tc.copy(C.deep);
    else if (h < 14) tc.copy(C.sand);
    else if (h < 280) tc.copy(C.grass).lerp(C.meadow, n);
    else if (h < 700) tc.copy(C.grass).lerp(C.forest, sstep(280, 420, h)).lerp(C.meadow, n * 0.25);
    else tc.copy(C.forest).lerp(C.rock, sstep(700, 900, h));
    if (ny < 0.8 && h > 14) tc.lerp(n > 0.5 ? C.rock : C.dark, sstep(0.8, 0.62, ny));
    if (h > 1050 + n * 160 && ny > 0.62) tc.lerp(C.snow, sstep(1050 + n * 160, 1200 + n * 160, h));
    tc.multiplyScalar(0.92 + noise(x / 60, z / 60) * 0.16);
    colors.set([tc.r, tc.g, tc.b], i * 3);
  }
  tGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const terrain = new THREE.Mesh(tGeo, keep(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0 })));
  terrain.receiveShadow = true;
  scene.add(terrain);
  const sea = new THREE.Mesh(keep(new THREE.PlaneGeometry(160000, 160000)), keep(new THREE.MeshStandardMaterial({ color: "#245f86", roughness: 0.18, metalness: 0.25 })));
  sea.rotation.x = -Math.PI / 2;
  scene.add(sea);

  // Clouds: soft billboards in loose banks
  const cloudTex = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const g = c.getContext("2d");
    for (let k = 0; k < 26; k++) {
      const x = 128 + gauss() * 38, y = 140 + gauss() * 22, r = 30 + Math.random() * 50;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      const shade = 235 + Math.random() * 20;
      gr.addColorStop(0, `rgba(${shade},${shade},${shade + 2},0.55)`); gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    }
    const t = keep(new THREE.CanvasTexture(c)); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const cloudMat = keep(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, fog: true }));
  for (let b = 0; b < 26; b++) {
    const cx = (Math.random() - 0.5) * 24000, cz = (Math.random() - 0.5) * 24000, cy = 1700 + Math.random() * 1300;
    for (let k = 0; k < 7; k++) {
      const s = new THREE.Sprite(cloudMat);
      const sc = 500 + Math.random() * 900;
      s.scale.set(sc * 1.6, sc, 1);
      s.position.set(cx + gauss() * 450, cy + gauss() * 60, cz + gauss() * 450);
      scene.add(s);
    }
  }

  // ---------------------------------------------------------------- the gates
  const GATES = 10, GATE_R = 60;
  const gates = [];
  const gateMat = keep(new THREE.MeshStandardMaterial({ color: "#ffb43c", emissive: "#ff8a1c", emissiveIntensity: 1.2, roughness: 0.4 }));
  const nextMat = keep(new THREE.MeshStandardMaterial({ color: "#7dffb0", emissive: "#38ff8a", emissiveIntensity: 2.2, roughness: 0.4 }));
  const ringGeo = keep(new THREE.TorusGeometry(GATE_R, 3.2, 12, 64));
  {
    const pts = [];
    for (let i = 0; i < GATES; i++) {
      const a = i / GATES * TAU, r = 3500 + Math.sin(i * 2.3) * 900;
      const x = Math.cos(a) * r * 1.1, z = Math.sin(a) * r;
      let top = 0;
      for (let k = 0; k < 9; k++) top = Math.max(top, height(x + (k % 3 - 1) * 250, z + (Math.floor(k / 3) - 1) * 250));
      pts.push(new THREE.Vector3(x, Math.max(top, 0) + 230 + (i % 3) * 90, z));
    }
    for (let pass = 0; pass < 12; pass++) {   // raise gates until every leg and run-in clears the ground and no leg is steep
      for (let i = 0; i < GATES; i++) {
        const A = pts[i], B = pts[(i + 1) % GATES];
        let worst = Infinity;
        for (let k = 0; k <= 40; k++) { const t = k / 40; worst = Math.min(worst, lerp(A.y, B.y, t) - Math.max(height(lerp(A.x, B.x, t), lerp(A.z, B.z, t)), 0)); }
        if (worst < 200) { A.y += 200 - worst; B.y += 200 - worst; }
        // the run-in: 3 km back along the leg must clear the ground too
        const back = A.clone().sub(B).setY(0).normalize();
        let run = Infinity;
        for (let k = 0; k <= 30; k++) run = Math.min(run, B.y - Math.max(height(B.x + back.x * k * 100, B.z + back.z * k * 100), 0));
        if (run < 220) B.y += 220 - run;
        // and no leg climbs or dives steeper than about 8°
        const len = Math.hypot(B.x - A.x, B.z - A.z), dy = B.y - A.y, cap = len * 0.14;
        if (dy > cap) A.y += dy - cap; else if (dy < -cap) B.y += -cap - dy;
      }
    }
    pts.forEach((p, i) => {
      const next = pts[(i + 1) % GATES], prev = pts[(i + GATES - 1) % GATES];
      const n = next.clone().sub(prev).normalize();
      const ring = new THREE.Mesh(ringGeo, gateMat);
      ring.position.copy(p); ring.lookAt(p.clone().add(n));
      scene.add(ring);
      gates.push({ p, n, ring });
    });
  }

  // ---------------------------------------------------------------- the jet (nose toward −z, right wing +x)
  const jet = new THREE.Group(); scene.add(jet);
  const paint = keep(new THREE.MeshStandardMaterial({ color: "#8c96a1", metalness: 0.45, roughness: 0.48 }));
  const paintDark = keep(new THREE.MeshStandardMaterial({ color: "#5f6873", metalness: 0.45, roughness: 0.5 }));
  const metalM = keep(new THREE.MeshStandardMaterial({ color: "#3a3d42", metalness: 0.9, roughness: 0.3 }));
  const glassM = keep(new THREE.MeshStandardMaterial({ color: "#2a3a4a", metalness: 0.95, roughness: 0.06, transparent: true, opacity: 0.85 }));
  const cast = m => { m.castShadow = true; m.receiveShadow = true; return m; };
  const prof = [[0.02, 7.6], [0.3, 6.6], [0.55, 5.2], [0.82, 3.0], [0.96, 0], [0.98, -2.5], [0.86, -5.2], [0.74, -6.6], [0.62, -7.3]].map(([r, y]) => new THREE.Vector2(r, y)).reverse();
  const fuse = cast(new THREE.Mesh(keep(new THREE.LatheGeometry(prof, 36)), paint));
  fuse.rotation.x = -Math.PI / 2; fuse.scale.set(1, 1, 0.82); jet.add(fuse);
  const radome = cast(new THREE.Mesh(keep(new THREE.ConeGeometry(0.31, 1.0, 24)), paintDark)); radome.rotation.x = -Math.PI / 2; radome.position.z = -7.1; jet.add(radome);
  const canopy = new THREE.Mesh(keep(new THREE.SphereGeometry(1, 28, 16)), glassM); canopy.scale.set(0.52, 0.5, 1.9); canopy.position.set(0, 0.62, -3.4); jet.add(canopy);
  const flat = (pts, depth, mat) => {
    const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) s.lineTo(p[0], p[1]);
    return cast(new THREE.Mesh(keep(new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 1 })), mat));
  };
  const wing = side => {   // a cropped delta, lying flat; shape drawn in (x, z)
    const m = flat([[0.6, -2.6], [5.4, 2.0], [5.4, 3.0], [0.6, 3.6]], 0.1, paint);
    m.rotation.x = Math.PI / 2; m.position.y = -0.05; if (side < 0) m.scale.x = -1;
    jet.add(m);
    const ail = cast(new THREE.Mesh(keep(new THREE.BoxGeometry(2.0, 0.08, 0.55)), paintDark));
    const pivot = new THREE.Group(); pivot.position.set(side * 4.1, -0.03, 3.05); pivot.add(ail); ail.position.z = 0.27;
    jet.add(pivot);
    const tipLight = new THREE.Mesh(keep(new THREE.SphereGeometry(0.09, 10, 8)), keep(new THREE.MeshStandardMaterial({ color: side > 0 ? "#3dff7a" : "#ff3d3d", emissive: side > 0 ? "#3dff7a" : "#ff3d3d", emissiveIntensity: 3 })));
    tipLight.position.set(side * 5.45, 0, 2.5); jet.add(tipLight);
    return pivot;
  };
  const ailR = wing(1), ailL = wing(-1);
  const stab = side => {
    const pivot = new THREE.Group(); pivot.position.set(side * 1.0, 0, 6.0);
    const m = flat([[0, -1.0], [2.5, 0.6], [2.5, 1.2], [0, 1.4]], 0.08, paint);
    m.rotation.x = Math.PI / 2; if (side < 0) m.scale.x = -1;
    pivot.add(m); jet.add(pivot); return pivot;
  };
  const stabR = stab(1), stabL = stab(-1);
  const tailTex = (() => {
    const c = document.createElement("canvas"); c.width = 256; c.height = 256;
    const g = c.getContext("2d"); g.fillStyle = "#8c96a1"; g.fillRect(0, 0, 256, 256);
    g.fillStyle = "#ffb43c"; g.fillRect(0, 150, 256, 18);
    g.fillStyle = "#2d333b"; g.font = "bold 64px sans-serif"; g.fillText("AM", 60, 120);
    const t = keep(new THREE.CanvasTexture(c)); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const tailMat = keep(new THREE.MeshStandardMaterial({ map: tailTex, metalness: 0.45, roughness: 0.48 }));
  const rudders = [];
  for (const side of [-1, 1]) {
    const fin = flat([[0, 0], [1.6, 2.6], [2.5, 2.6], [2.4, 0]], 0.08, tailMat);   // drawn in (z, y)
    fin.rotation.y = -Math.PI / 2; fin.position.set(side * 1.05, 0.35, 4.4);
    const cant = new THREE.Group(); cant.rotation.z = -side * 0.26; cant.add(fin); jet.add(cant);
    const rud = cast(new THREE.Mesh(keep(new THREE.BoxGeometry(0.07, 1.6, 0.5)), paintDark));
    const rp = new THREE.Group(); rp.position.set(side * 1.05 + side * 0.55, 1.6, 6.95); rp.rotation.z = -side * 0.26; rp.add(rud); rud.position.z = 0.25; jet.add(rp);
    rudders.push(rp);
  }
  for (const side of [-1, 1]) { const intake = cast(new THREE.Mesh(keep(new THREE.BoxGeometry(0.75, 0.85, 3.2)), paintDark)); intake.position.set(side * 1.0, -0.25, -0.6); jet.add(intake); }
  const nozzle = cast(new THREE.Mesh(keep(new THREE.CylinderGeometry(0.55, 0.62, 1.1, 24, 1, true)), metalM)); nozzle.rotation.x = Math.PI / 2; nozzle.position.z = 7.6; jet.add(nozzle);
  const glowMat = keep(new THREE.MeshBasicMaterial({ color: "#ffb070", transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  const coreDisk = new THREE.Mesh(keep(new THREE.CircleGeometry(0.5, 24)), glowMat); coreDisk.position.z = 7.7; jet.add(coreDisk);
  const flameMat = keep(new THREE.MeshBasicMaterial({ color: "#ff9a4a", transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false }));
  const flameBlue = keep(new THREE.MeshBasicMaterial({ color: "#7fb6ff", transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false }));
  const flame = new THREE.Mesh(keep(new THREE.ConeGeometry(0.5, 4.5, 20, 1, true)), flameMat); flame.rotation.x = -Math.PI / 2; flame.position.z = 10.3; jet.add(flame);
  const flameIn = new THREE.Mesh(keep(new THREE.ConeGeometry(0.32, 2.2, 16, 1, true)), flameBlue); flameIn.rotation.x = -Math.PI / 2; flameIn.position.z = 9.0; jet.add(flameIn);
  const strobe = new THREE.Mesh(keep(new THREE.SphereGeometry(0.08, 8, 6)), keep(new THREE.MeshBasicMaterial({ color: "#ffffff" }))); strobe.position.set(0, -0.8, 1); jet.add(strobe);

  // Wingtip vortices when pulling hard, and an explosion for crashes
  const TR = 90;
  const vortex = side => {
    const geo = keep(new THREE.BufferGeometry());
    const pos = new Float32Array(TR * 3), col = new Float32Array(TR * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const line = new THREE.Line(geo, keep(new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false })));
    line.frustumCulled = false; scene.add(line);
    return { geo, pos, col, local: new THREE.Vector3(side * 5.45, 0, 2.6) };
  };
  const vortices = [vortex(1), vortex(-1)];
  const NB = 160, boomPos = new Float32Array(NB * 3), boomVel = new Float32Array(NB * 3);
  const boomGeo = keep(new THREE.BufferGeometry()); boomGeo.setAttribute("position", new THREE.BufferAttribute(boomPos, 3));
  const puffTex = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,200,120,0.7)"); gr.addColorStop(1, "rgba(255,120,40,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const t = keep(new THREE.CanvasTexture(c)); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const boomMat = keep(new THREE.PointsMaterial({ color: "#ffb060", map: puffTex, size: 9, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  const boom = new THREE.Points(boomGeo, boomMat); boom.frustumCulled = false; scene.add(boom);

  // ---------------------------------------------------------------- flight physics
  const S = 38, MASS = 13000, TDRY = 82000, TAB = 58000, PMAX = 4.0, RMAX = 0.45;
  const st = { p: new THREE.Vector3(), v: new THREE.Vector3(), q: new THREE.Quaternion(), P: 0, Q: 0, R: 0, Pd: 0, Qd: 0, thr: 0.7, alive: true, gload: 1, alpha: 0, beta: 0, mach: 0, deadT: 0 };
  const stick = { x: 0, y: 0, yaw: 0 };
  const truth = () => ({ rollEff: 1 - 0.55 * J.damage, rollTrim: -1.1 * J.damage, pitchEff: 1 / (1 + J.payload / 7000) });
  const fwd = new THREE.Vector3(), upB = new THREE.Vector3(), rightB = new THREE.Vector3(), va = new THREE.Vector3(), tmp = new THREE.Vector3(), lift = new THREE.Vector3();
  const qInv = new THREE.Quaternion(), dq = new THREE.Quaternion(), wv = new THREE.Vector3(), gust = new THREE.Vector3(), gustT = { t: 0 };
  const axes = () => { fwd.set(0, 0, -1).applyQuaternion(st.q); upB.set(0, 1, 0).applyQuaternion(st.q); rightB.set(1, 0, 0).applyQuaternion(st.q); };
  const qbar = () => 0.5 * 1.225 * Math.exp(-Math.max(st.p.y, 0) / 8500) * st.v.lengthSq();
  const QREF = 0.5 * 1.225 * 200 * 200;
  const pitchMax = () => Math.min(0.6, 9.2 * G / Math.max(st.v.length(), 60));
  const qfac = () => clamp(qbar() / QREF, 0.2, 1.25);

  // Surfaces: δ in [−1, 1] for roll, pitch, yaw. The plant responds with this jet's true authority and trim.
  const step = (dt, d) => {
    const T = truth();
    const turb = J.turb;
    st.P += ((T.rollEff * d.a * PMAX + T.rollTrim - st.P) / 0.22 + turb * gauss() * 2.2) * dt;
    let qc = T.pitchEff * d.e * pitchMax() * qfac();
    const qw = qc;
    qc = clamp(qc, (-0.16 - st.alpha) * 3 - 0.05, (0.27 - st.alpha) * 3 + 0.05);   // the fly-by-wire's angle-of-attack limiter
    st.limited = qc !== qw;
    st.Q += ((qc - st.Q) / 0.32 + turb * gauss() * 0.35) * dt;
    axes();
    qInv.copy(st.q).invert();
    tmp.copy(st.v).sub(gust).applyQuaternion(qInv);   // air velocity in the body frame
    const u = Math.max(-tmp.z, 1);
    st.alpha = Math.atan2(-tmp.y, u); st.beta = Math.atan2(tmp.x, u);
    st.R += ((d.r * RMAX - st.R + st.beta * 3.2) / 0.5) * dt;   // the fins weathervane the nose into the airflow
    const AS = 0.33;   // the stall, either way, and the airframe's own pull back toward its flight path
    if (st.alpha > AS) st.Q -= (st.alpha - AS) * 3 * dt;
    if (st.alpha < -0.22) st.Q += (-0.22 - st.alpha) * 3 * dt;
    st.Q -= st.alpha * 0.9 * qfac() * dt;
    // rotate by the body rates (pitch about +x, yaw about +y, roll about −z)
    const Rs = st.R + st.P * Math.tan(clamp(st.alpha, -0.5, 0.5));   // fly-by-wire rolls about the flight path, not the fuselage
    wv.set(st.Q, -Rs, -st.P);
    const w = wv.length();
    if (w > 1e-6) { dq.setFromAxisAngle(wv.divideScalar(w), w * dt); st.q.multiply(dq).normalize(); }
    axes();
    // forces
    va.copy(st.v).sub(gust);
    const V = Math.max(va.length(), 1), rho = 1.225 * Math.exp(-Math.max(st.p.y, 0) / 8500), qb = 0.5 * rho * V * V;
    const a = st.alpha;
    const CL = Math.abs(a) < AS ? 4.6 * a : Math.sign(a) * 4.6 * AS * Math.max(0.35, 1 - (Math.abs(a) - AS) * 2.5);
    const CD = 0.021 + 0.11 * CL * CL + (J.damage * 0.02) + J.payload / 6000 * 0.012;
    tmp.copy(va).divideScalar(V);
    lift.copy(upB).addScaledVector(tmp, -upB.dot(tmp)).normalize().multiplyScalar(qb * S * CL);
    const mass = MASS + J.payload;
    const ab = Math.max(0, (st.thr - 0.85) / 0.15);
    const thrust = (TDRY * Math.min(st.thr / 0.85, 1) + TAB * ab) * J.engine * Math.pow(rho / 1.225, 0.7);
    const acc = tmp.clone().multiplyScalar(-qb * S * CD)   // drag
      .add(lift)
      .addScaledVector(rightB, -qb * S * 1.1 * st.beta)   // sideslip
      .addScaledVector(fwd, thrust)
      .divideScalar(mass);
    acc.y -= G;
    st.gload = lerp(st.gload, (acc.clone().setY(acc.y + G)).dot(upB) / G, 0.1);
    st.v.addScaledVector(acc, dt);
    st.p.addScaledVector(st.v, dt);
    st.mach = V / (340 - 0.004 * Math.max(st.p.y, 0));
  };

  // ---------------------------------------------------------------- the adaptive autopilot
  // Per axis it fits rate + τ·rate′ = authority·(δ·max) + trim by recursive least squares with forgetting, so a
  // few seconds of flying are enough to know the jet. Then it inverts that model to get the rates it wants.
  const rls = () => ({ th: [1, 0], P: [[4, 0], [0, 4]] });
  let roll = rls(), pitch = rls();
  const resetEstimates = () => { roll = rls(); pitch = rls(); };
  const fit = (m, x, y, lambda) => {
    const P = m.P, phi = [x, 1];
    const Pphi = [P[0][0] * phi[0] + P[0][1] * phi[1], P[1][0] * phi[0] + P[1][1] * phi[1]];
    const den = lambda + phi[0] * Pphi[0] + phi[1] * Pphi[1];
    const k = [Pphi[0] / den, Pphi[1] / den];
    const err = y - (m.th[0] * phi[0] + m.th[1] * phi[1]);
    m.th[0] = clamp(m.th[0] + k[0] * err, 0.15, 1.6); m.th[1] = clamp(m.th[1] + k[1] * err, -3, 3);
    const phiP = [phi[0] * P[0][0] + phi[1] * P[1][0], phi[0] * P[0][1] + phi[1] * P[1][1]];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) P[i][j] = (P[i][j] - k[i] * phiP[j]) / lambda;
    for (let i = 0; i < 2; i++) P[i][i] = Math.min(P[i][i], 50);
  };
  const last = { P: 0, Q: 0, a: 0, e: 0, qm: 0, qf: 1, alpha: 0 };
  const learn = dt => {   // exact one-step model: rate₊ = rate + dt/τ·(authority·δ·max + trim − rate) + known airframe terms
    if (!J.adapt) return;
    fit(roll, last.a * PMAX, last.P + (st.P - last.P) * 0.22 / dt, 0.996);
    const qm = last.qm, a = last.alpha;
    const known = -a * 0.9 * last.qf - (a > 0.33 ? (a - 0.33) * 3 : 0) + (a < -0.22 ? (-0.22 - a) * 3 : 0);
    if (qm > 0.05 && Math.abs(a) < 0.14 && !st.limited && J.turb < 0.6) { fit(pitch, last.e * qm, last.Q + ((st.Q - last.Q) / dt - known) * 0.32, 0.996); pitch.th[1] = clamp(pitch.th[1], -0.1, 0.1); pitch.th[0] = clamp(pitch.th[0], 0.35, 1.5); }
  };
  let gateIx = 0, lapT = 0, bestLap = 0, gatesHit = 0;
  const prevSide = { v: -1 };
  let reapproach = false;
  const bank = () => Math.atan2(-rightB.y, upB.y);
  const autopilot = () => {
    const g = gates[gateIx];
    const V = st.v.length();
    // pursue the gate's centre; if it's slipped behind (a miss), fly straight on until there's room to turn back
    const toGate = st.p.distanceTo(g.p);
    if (!reapproach && toGate < 900 && tmp.copy(g.p).sub(st.p).dot(st.v) < 0) reapproach = true;
    if (reapproach && toGate > 2600) reapproach = false;
    const aim = reapproach ? tmp.copy(st.v).setY(0).normalize().multiplyScalar(1000) : tmp.copy(g.p).sub(st.p);
    const dist = aim.length(); aim.divideScalar(dist);
    const hv = Math.hypot(st.v.x, st.v.z) || 1;
    const hdg = Math.atan2(st.v.x / hv, -st.v.z / hv), want = Math.atan2(aim.x, -aim.z);
    const herr = Math.atan2(Math.sin(want - hdg), Math.cos(want - hdg));
    const gam = Math.asin(clamp(st.v.y / Math.max(V, 1), -1, 1));
    const dy = g.p.y - st.p.y, dh = Math.max(Math.hypot(g.p.x - st.p.x, g.p.z - st.p.z), 200);
    let gamDes = clamp(Math.atan2(dy, dh) * 1.3, -0.4, 0.4);
    let turn = clamp(herr * 0.7, -0.3, 0.3);   // the heading rate it wants (rad/s)
    // look ahead for ground
    let clear = Infinity;
    for (const t of [1, 2, 3, 4.5, 6]) { const px = st.p.x + st.v.x * t, pz = st.p.z + st.v.z * t; clear = Math.min(clear, st.p.y + st.v.y * Math.min(t, 2) - Math.max(height(px, pz), 0)); }
    if (clear < 110) { gamDes = Math.max(gamDes, 0.2 + (110 - clear) / 300); turn *= clear < 60 ? 0 : 0.5; }
    // the load it wants, as one vector: sideways to turn, up to hold the climb against gravity
    const Vc = Math.max(V, 60);
    const nh = Vc * turn / G, nv = Math.max(Math.cos(gam) + clamp((gamDes - gam) * Vc / G * 0.9, -1.2, 3), 0.2);   // never asks for negative g
    const phiDes = clamp(Math.atan2(nh, nv), -1.4, 1.4);
    const nTot = Math.min(nv / Math.cos(phiDes), 9);   // with the bank capped, keep the vertical part what it asked for
    const phi = bank();
    const perr = Math.atan2(Math.sin(phiDes - phi), Math.cos(phiDes - phi));   // roll the short way round
    const Pdes = clamp(perr * 2.6, -2.2, 2.2);
    // pull to that load once the lift points the right way; the velocity turns at g·(n − cos γ cos φ)/V
    const Qdes = clamp(G * (Math.max(nTot * Math.cos(perr), 0) - Math.cos(gam) * Math.cos(phi)) / Vc, -0.2, pitchMax());
    const ar = roll.th, pr = pitch.th;
    const a = clamp((Pdes - (J.adapt ? ar[1] : 0)) / ((J.adapt ? ar[0] : 1) * PMAX), -1, 1);
    const qm = pitchMax() * qfac();
    const e = clamp((Qdes - (J.adapt ? pr[1] : 0)) / ((J.adapt ? pr[0] : 1) * qm), -1, 1);
    st.thr = clamp(lerp(st.thr, 0.62 + (235 - V) * 0.012, 0.02), 0.2, 1);
    return { a, e, r: clamp(st.beta * 2, -1, 1) };
  };
  const manual = () => {   // fly-by-wire for you: the stick asks for rates, assuming an undamaged jet
    const qm = pitchMax() * qfac();
    return { a: clamp(stick.x, -1, 1), e: clamp((stick.y * pitchMax()) / Math.max(qm, 0.05), -1, 1), r: clamp(stick.yaw + st.beta * 1.5, -1, 1) };
  };

  // ---------------------------------------------------------------- gates, laps, crashes
  const say = (text, kind) => {
    toast.textContent = text; toast.className = `sim-toast show ${kind || ""}`;
    clearTimeout(say.t); say.t = setTimeout(() => { toast.className = "sim-toast"; }, 1600);
  };
  const markGates = () => gates.forEach((g, i) => { g.ring.material = i === gateIx ? nextMat : gateMat; });
  const spawn = () => {
    const g = gates[gateIx = 0];
    const dir = g.n.clone(); dir.y = 0; dir.normalize();
    st.p.copy(g.p).addScaledVector(dir, -1800);
    let top = 0; for (let k = 0; k <= 20; k++) top = Math.max(top, height(lerp(st.p.x, g.p.x, k / 20), lerp(st.p.z, g.p.z, k / 20)));
    st.p.y = Math.max(g.p.y, top + 250);
    st.v.copy(dir).multiplyScalar(220);
    const m = new THREE.Matrix4().lookAt(st.p, st.p.clone().add(dir), new THREE.Vector3(0, 1, 0));
    st.q.setFromRotationMatrix(m);
    Object.assign(st, { P: 0, Q: 0, R: 0, Pd: 0, Qd: 0, thr: 0.7, alive: true, gload: 1, deadT: 0 });
    jet.visible = true; lapT = 0; gatesHit = 0;
    for (const v of vortices) { for (let k = 0; k < TR; k++) v.pos.set([st.p.x, st.p.y, st.p.z], k * 3); v.col.fill(0); }
    prevSide.v = -1; reapproach = false; markGates(); snap = true;
  };
  const crash = () => {
    st.alive = false; st.deadT = 0; jet.visible = false;
    for (let k = 0; k < NB; k++) { boomPos.set([st.p.x, st.p.y, st.p.z], k * 3); boomVel.set([gauss() * 60 + st.v.x * 0.2, Math.random() * 70, gauss() * 60 + st.v.z * 0.2], k * 3); }
    boomMat.opacity = 1;
    say("Crashed", "bad");
  };
  const checkGate = () => {
    const g = gates[gateIx];
    const side = tmp.copy(st.p).sub(g.p).dot(g.n);
    if (prevSide.v * side <= 0 && prevSide.v !== side) {
      const lateral = tmp.copy(st.p).sub(g.p).addScaledVector(g.n, -side).length();
      if (lateral < GATE_R * 1.25) {
        gatesHit++; reapproach = false;
        gateIx = (gateIx + 1) % GATES;
        if (gateIx === 0) { if (!bestLap || lapT < bestLap) bestLap = lapT; say(`Lap ${lapT.toFixed(1)} s`, "good"); lapT = 0; }
        else say(`Gate ${gateIx} of ${GATES}`, "good");
        markGates();
      }
    }
    prevSide.v = tmp.copy(st.p).sub(gates[gateIx].p).dot(gates[gateIx].n);
  };

  // ---------------------------------------------------------------- input
  const keys = new Set();
  const flightKeys = { KeyW: 1, KeyS: 1, KeyA: 1, KeyD: 1, KeyQ: 1, KeyE: 1, ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1, ShiftLeft: 1, ShiftRight: 1, ControlLeft: 1, KeyR: 1, KeyF: 1 };
  let focused = false, mode = "auto";
  const onKey = e => {
    if (!focused || !flightKeys[e.code]) return;
    e.preventDefault();
    if (e.type === "keydown") { keys.add(e.code); if (mode !== "you" && !/Shift|Control|KeyR|KeyF/.test(e.code)) setMode("you"); } else keys.delete(e.code);
  };
  addEventListener("keydown", onKey); addEventListener("keyup", onKey);
  box.addEventListener("focusin", () => { focused = true; });
  box.addEventListener("focusout", e => { if (!box.contains(e.relatedTarget)) { focused = false; keys.clear(); } });
  box.addEventListener("pointerdown", () => { focused = true; });
  const pad = { on: false, id: -1, x0: 0, y0: 0, x: 0, y: 0 };
  const readStick = dt => {
    const k = 1 - Math.exp(-dt * 7);
    let x = 0, y = 0, yaw = 0;
    if (keys.has("KeyA") || keys.has("ArrowLeft")) x -= 1;
    if (keys.has("KeyD") || keys.has("ArrowRight")) x += 1;
    if (keys.has("KeyS") || keys.has("ArrowDown")) y += 1;     // pull back: nose up
    if (keys.has("KeyW") || keys.has("ArrowUp")) y -= 0.6;
    if (keys.has("KeyQ")) yaw -= 1;
    if (keys.has("KeyE")) yaw += 1;
    if (pad.on) { x += clamp((pad.x - pad.x0) / 70, -1, 1); y += clamp((pad.y - pad.y0) / 70, -1, 1); }
    stick.x = lerp(stick.x, x, k); stick.y = lerp(stick.y, y, k); stick.yaw = lerp(stick.yaw, yaw, k);
    if (keys.has("ShiftLeft") || keys.has("ShiftRight") || keys.has("KeyR")) st.thr = Math.min(1, st.thr + dt * 0.5);
    if (keys.has("ControlLeft") || keys.has("KeyF")) st.thr = Math.max(0, st.thr - dt * 0.5);
  };

  // ---------------------------------------------------------------- cameras
  let camMode = "chase", snap = true, orbitAz = 0.6, orbitEl = 0.2;
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), camUp = new THREE.Vector3(0, 1, 0), wantPos = new THREE.Vector3(), wantLook = new THREE.Vector3();
  const setCam = k => {
    camMode = k;
    for (const [n, b] of Object.entries(camButtons)) b.setAttribute("aria-pressed", String(n === k));
    camera.fov = k === "cockpit" ? 72 : 60; camera.updateProjectionMatrix();
    canopy.visible = k !== "cockpit";
    snap = true;
  };
  const shake = new THREE.Vector3();
  const placeCam = dt => {
    axes();
    const k = snap ? 1 : 1 - Math.exp(-dt * 6);
    if (camMode === "cockpit") {
      camera.position.copy(tmp.set(0, 0.95, -3.2).applyQuaternion(st.q).add(st.p));
      camera.quaternion.copy(st.q);
      camera.rotateX(-0.06);
      const s = Math.min(st.v.length() / 340, 1) * 0.02 + J.turb * 0.03;
      camera.rotation.z += gauss() * s * 0.1;
      snap = false;
      return;
    }
    if (camMode === "chase") {
      wantPos.copy(st.p).addScaledVector(fwd, -32).addScaledVector(upB, 7.5);
      wantLook.copy(st.p).addScaledVector(fwd, 22).addScaledVector(upB, 2);
      camUp.lerp(tmp.set(0, 1, 0).lerp(upB, 0.45).normalize(), k);
    } else {
      wantLook.copy(st.p);
      wantPos.set(st.p.x + Math.cos(orbitAz) * Math.cos(orbitEl) * 42, st.p.y + Math.sin(orbitEl) * 42, st.p.z + Math.sin(orbitAz) * Math.cos(orbitEl) * 42);
      camUp.set(0, 1, 0);
    }
    camPos.lerp(wantPos, camMode === "orbit" || snap ? 1 : k); camLook.lerp(wantLook, snap ? 1 : 1 - Math.exp(-dt * 12));
    shake.set(gauss(), gauss(), gauss()).multiplyScalar(Math.max(st.gload - 4, 0) * 0.03 + J.turb * 0.06);
    camera.position.copy(camPos).add(shake);
    camera.up.copy(camUp);
    camera.lookAt(camLook);
    snap = false;
  };
  const drag = { on: false, x: 0, y: 0 };
  canvas.addEventListener("pointerdown", e => {
    canvas.focus({ preventScroll: true });
    if (e.pointerType !== "mouse" && mode === "you") { Object.assign(pad, { on: true, id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY }); canvas.setPointerCapture(e.pointerId); return; }
    if (camMode !== "orbit") return;
    Object.assign(drag, { on: true, x: e.clientX, y: e.clientY }); canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", e => {
    if (pad.on && e.pointerId === pad.id) { pad.x = e.clientX; pad.y = e.clientY; return; }
    if (!drag.on) return;
    orbitAz += (e.clientX - drag.x) * 0.006; orbitEl = clamp(orbitEl + (e.clientY - drag.y) * 0.004, -0.6, 1.3);
    drag.x = e.clientX; drag.y = e.clientY;
  });
  const endDrag = e => { if (e.pointerId === pad.id) pad.on = false; drag.on = false; };
  canvas.addEventListener("pointerup", endDrag); canvas.addEventListener("pointercancel", endDrag);

  // ---------------------------------------------------------------- the HUD: drawn on a 2D canvas over the world
  const HUDC = "#7dffb0";
  const proj = new THREE.Vector3();
  const drawHud = () => {
    const w = hudCanvas.width, h = hudCanvas.height, dpr = w / Math.max(hudCanvas.clientWidth, 1);
    hud.clearRect(0, 0, w, h);
    hud.save(); hud.scale(dpr, dpr);
    const W = w / dpr, H = h / dpr, cx = W / 2, cy = H / 2;
    const V = st.v.length();
    hud.strokeStyle = HUDC; hud.fillStyle = HUDC; hud.lineWidth = 1.4;
    hud.shadowColor = "rgba(0,0,0,0.6)"; hud.shadowBlur = 3;
    hud.font = "600 12px ui-monospace, Menlo, monospace";
    const big = camMode === "cockpit";
    // next gate: a bracket on it, or an arrow at the edge pointing to it
    if (st.alive) {
      proj.copy(gates[gateIx].p).project(camera);
      const gx = (proj.x * 0.5 + 0.5) * W, gy = (-proj.y * 0.5 + 0.5) * H, dist = st.p.distanceTo(gates[gateIx].p);
      if (proj.z < 1 && gx > 10 && gx < W - 10 && gy > 10 && gy < H - 10) {
        const s = clamp(4000 / dist, 8, 36);
        hud.beginPath();
        for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { hud.moveTo(gx + sx * s, gy + sy * s * 0.6); hud.lineTo(gx + sx * s, gy + sy * s); hud.lineTo(gx + sx * s * 0.6, gy + sy * s); }
        hud.stroke();
        hud.fillText(`${(dist / 1000).toFixed(1)} km`, gx + s + 6, gy + 4);
      } else {
        let ax = proj.x, ay = -proj.y; if (proj.z > 1) { ax = -ax; ay = -ay; }
        const ang = Math.atan2(ay, ax), r = Math.min(W, H) * 0.42;
        const px = cx + Math.cos(ang) * r, py = cy + Math.sin(ang) * r;
        hud.save(); hud.translate(px, py); hud.rotate(ang);
        hud.beginPath(); hud.moveTo(10, 0); hud.lineTo(-6, -7); hud.lineTo(-6, 7); hud.closePath(); hud.fill();
        hud.restore();
      }
    }
    if (big && st.alive) {
      // pitch ladder about the horizon, rolled with the jet
      const phi = Math.atan2(-rightB.y, upB.y), theta = Math.asin(clamp(fwd.y, -1, 1));
      const ppd = H / (camera.fov) ;   // pixels per degree
      hud.save(); hud.translate(cx, cy); hud.rotate(-phi);
      for (let deg = -60; deg <= 60; deg += 10) {
        const y = (theta * 180 / Math.PI - deg) * ppd;
        if (Math.abs(y) > H * 0.42) continue;
        hud.beginPath();
        if (deg === 0) { hud.moveTo(-W * 0.3, y); hud.lineTo(-40, y); hud.moveTo(40, y); hud.lineTo(W * 0.3, y); }
        else { hud.setLineDash(deg < 0 ? [6, 5] : []); hud.moveTo(-90, y); hud.lineTo(-38, y); hud.lineTo(-38, y + (deg > 0 ? 8 : -8)); hud.moveTo(90, y); hud.lineTo(38, y); hud.lineTo(38, y + (deg > 0 ? 8 : -8)); }
        hud.stroke(); hud.setLineDash([]);
        if (deg) { hud.fillText(String(Math.abs(deg)), 96, y + 4); hud.fillText(String(Math.abs(deg)), -114, y + 4); }
      }
      hud.restore();
      // flight path marker: where the jet is actually going
      proj.copy(st.p).addScaledVector(st.v, 3).project(camera);
      const fx = (proj.x * 0.5 + 0.5) * W, fy = (-proj.y * 0.5 + 0.5) * H;
      hud.beginPath(); hud.arc(fx, fy, 7, 0, TAU); hud.moveTo(fx - 18, fy); hud.lineTo(fx - 7, fy); hud.moveTo(fx + 7, fy); hud.lineTo(fx + 18, fy); hud.moveTo(fx, fy - 7); hud.lineTo(fx, fy - 14); hud.stroke();
      // boresight
      hud.beginPath(); hud.moveTo(cx - 10, cy); hud.lineTo(cx - 4, cy + 5); hud.lineTo(cx, cy); hud.lineTo(cx + 4, cy + 5); hud.lineTo(cx + 10, cy); hud.stroke();
      // heading tape
      const hdg = (Math.atan2(fwd.x, -fwd.z) * 180 / Math.PI + 360) % 360;
      hud.save(); hud.beginPath(); hud.rect(cx - 150, 34, 300, 30); hud.clip();
      for (let d = Math.floor(hdg / 5) * 5 - 40; d <= hdg + 40; d += 5) {
        const x = cx + (d - hdg) * 3.6;
        hud.beginPath(); hud.moveTo(x, 50); hud.lineTo(x, d % 10 ? 55 : 58); hud.stroke();
        if (d % 10 === 0) { const t = String(((d % 360) + 360) % 360 / 10 | 0).padStart(2, "0"); hud.fillText(t, x - 7, 46); }
      }
      hud.restore();
      hud.beginPath(); hud.moveTo(cx, 60); hud.lineTo(cx - 5, 67); hud.lineTo(cx + 5, 67); hud.closePath(); hud.fill();
    }
    // speed and altitude boxes, g, throttle
    const sx = big ? cx - Math.min(W * 0.32, 230) : 14, ay = big ? cy : H - 58;
    const kt = Math.round(V * 1.944), ft = Math.round(st.p.y * 3.281);
    hud.font = `700 ${big ? 16 : 13}px ui-monospace, Menlo, monospace`;
    if (big) {
      hud.strokeRect(sx - 34, ay - 12, 68, 24); hud.fillText(String(kt).padStart(4, " "), sx - 24, ay + 6);
      const axx = cx + Math.min(W * 0.32, 230);
      hud.strokeRect(axx - 40, ay - 12, 80, 24); hud.fillText(String(ft).padStart(5, " "), axx - 32, ay + 6);
      hud.font = "600 12px ui-monospace, Menlo, monospace";
      hud.fillText("KT", sx - 10, ay + 28); hud.fillText("FT", axx - 6, ay + 28);
      hud.fillText(`G ${st.gload.toFixed(1)}`, sx - 34, ay + 56);
      hud.fillText(`M ${st.mach.toFixed(2)}`, sx - 34, ay + 72);
      hud.fillText(`α ${(st.alpha * 180 / Math.PI).toFixed(0)}°`, sx - 34, ay + 88);
      hud.fillText(`THR ${Math.round(st.thr * 100)}%${st.thr > 0.85 ? " AB" : ""}`, axx - 40, ay + 56);
    } else {
      hud.fillText(`${kt} KT   ${ft} FT   ${st.gload.toFixed(1)} G   M${st.mach.toFixed(2)}`, sx, ay + 6);
      hud.font = "600 12px ui-monospace, Menlo, monospace";
      hud.fillText(`THR ${Math.round(st.thr * 100)}%${st.thr > 0.85 ? " AFTERBURNER" : ""}`, sx, ay + 24);
    }
    hud.font = "600 12px ui-monospace, Menlo, monospace";
    const status = `${mode === "auto" ? "AUTOPILOT" + (J.adapt ? " · ADAPTING" : " · FIXED") : "MANUAL"}   GATE ${gateIx + 1}/${GATES}   LAP ${lapT.toFixed(1)}s${bestLap ? `   BEST ${bestLap.toFixed(1)}s` : ""}`;
    hud.fillText(status, big ? cx - hud.measureText(status).width / 2 : 14, big ? H - 22 : H - 18);
    if (st.alive && st.alpha > 0.33) { hud.fillStyle = "#ff6a5a"; hud.font = "800 18px ui-monospace, Menlo, monospace"; hud.fillText("STALL", cx - 26, cy + 70); }
    if (st.alive && st.p.y - Math.max(height(st.p.x, st.p.z), 0) < 120 && st.v.y < -5) { hud.fillStyle = "#ff6a5a"; hud.font = "800 16px ui-monospace, Menlo, monospace"; hud.fillText("PULL UP", cx - 34, cy + 92); }
    hud.restore();
  };

  // ---------------------------------------------------------------- controls
  const setMode = m => {
    mode = m;
    modeAuto.setAttribute("aria-pressed", String(m === "auto"));
    modeYou.setAttribute("aria-pressed", String(m === "you"));
    hint.textContent = m === "you"
      ? (touch ? "Drag on the sky to fly: sideways rolls, down pulls the nose up. Autopilot takes it back." : "S or ↓ pulls up, W or ↑ pushes down, A and D roll, Q and E yaw, Shift or R adds throttle, Ctrl or F cuts it. Fly through the green gate.")
      : "The autopilot flies the gates. Damage the wing, load it up or weaken the engine, and watch it work out the new jet in a few seconds. Press a flight key to take the stick.";
    if (m === "you") { canvas.focus({ preventScroll: true }); focused = true; }
  };
  modeAuto.addEventListener("click", () => setMode("auto"));
  modeYou.addEventListener("click", () => setMode("you"));
  for (const b of Object.values(camButtons)) b.addEventListener("click", () => setCam(b.dataset.cam));
  let paused = false;
  pauseBtn.addEventListener("click", () => { paused = !paused; pauseBtn.textContent = paused ? "Play" : "Pause"; pauseBtn.setAttribute("aria-pressed", String(paused)); });
  restartBtn.addEventListener("click", () => { spawn(); bestLap = 0; });
  newJetBtn.addEventListener("click", () => {
    fields.damage.set(+(Math.random() * 0.75).toFixed(2));
    fields.payload.set(Math.round(Math.random() * 60) * 100);
    fields.engine.set(+(0.55 + Math.random() * 0.45).toFixed(2));
    say("New jet", "");
  });
  healBtn.addEventListener("click", () => { fields.damage.set(0); fields.payload.set(0); fields.engine.set(1); fields.turb.set(0.15); });

  // ---------------------------------------------------------------- the loop
  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    hudCanvas.width = Math.round(w * dpr); hudCanvas.height = Math.round(h * dpr);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize); ro.observe(stage);
  let visible = true, raf = 0, lastT = performance.now(), acc = 0, strobeT = 0;
  const io = new IntersectionObserver(es => { visible = es.some(e => e.isIntersecting); if (visible && !raf) { lastT = performance.now(); raf = requestAnimationFrame(frame); } }, { threshold: 0 });
  io.observe(stage);
  const STEP = 1 / 120;
  const wTip = new THREE.Vector3();
  const frame = now => {
    raf = 0;
    if (!visible) return;
    const dt = Math.min((now - lastT) / 1000, 1 / 20); lastT = now;
    if (!paused && dt > 1e-4) {
      readStick(dt);
      gustT.t -= dt;
      if (gustT.t <= 0) { gust.set(gauss(), gauss() * 0.5, gauss()).multiplyScalar(J.turb * 9); gustT.t = 0.4 + Math.random(); }
      if (st.alive) {
        acc += dt;
        while (acc >= STEP) {
          const d = mode === "auto" ? autopilot() : manual();
          last.P = st.P; last.Q = st.Q; last.qm = pitchMax() * qfac(); last.qf = qfac(); last.alpha = st.alpha;
          step(STEP, d);
          last.a = d.a; last.e = d.e;
          learn(STEP);
          acc -= STEP;
          ailR.rotation.x = -d.a * 0.35; ailL.rotation.x = d.a * 0.35;
          stabR.rotation.x = stabL.rotation.x = -d.e * 0.25;
          rudders.forEach(r => { r.rotation.y = -d.r * 0.35; });
        }
        lapT += dt;
        checkGate();
        const ground = Math.max(height(st.p.x, st.p.z), 0);
        if (st.p.y < ground + 1.5) crash();
      } else {
        st.deadT += dt;
        if (st.deadT > 2.6) spawn();
      }
      jet.position.copy(st.p); jet.quaternion.copy(st.q);
      // afterburner, nozzle glow, strobe
      const ab = Math.max(0, (st.thr - 0.85) / 0.15);
      flameMat.opacity = ab * (0.55 + Math.random() * 0.2); flameBlue.opacity = ab * 0.6 + st.thr * 0.15;
      flame.scale.set(1, 0.6 + ab * 0.6 + Math.random() * 0.1, 1); flameIn.scale.y = 0.7 + ab * 0.5;
      glowMat.opacity = 0.35 + st.thr * 0.6;
      strobeT += dt; strobe.visible = strobeT % 1.2 < 0.06;
      // wingtip vortices in hard turns
      const vis = clamp((st.gload - 3.5) / 3, 0, 1) * (st.alive ? 1 : 0);
      for (const v of vortices) {
        v.pos.copyWithin(3, 0, (TR - 1) * 3);
        wTip.copy(v.local).applyQuaternion(st.q).add(st.p);
        v.pos.set([wTip.x, wTip.y, wTip.z], 0);
        v.col.copyWithin(3, 0, (TR - 1) * 3);
        v.col.set([0.9 * vis, 0.95 * vis, 1 * vis], 0);
        for (let k = 0; k < TR; k++) for (let c = 0; c < 3; c++) v.col[k * 3 + c] *= 0.985;
        v.geo.attributes.position.needsUpdate = v.geo.attributes.color.needsUpdate = true;
      }
      if (boomMat.opacity > 0) {
        boomMat.opacity = Math.max(0, boomMat.opacity - dt * 0.45);
        for (let k = 0; k < NB; k++) { boomVel[k * 3 + 1] -= G * 0.6 * dt; for (let c = 0; c < 3; c++) { boomPos[k * 3 + c] += boomVel[k * 3 + c] * dt; boomVel[k * 3 + c] *= 0.985; } }
        boomGeo.attributes.position.needsUpdate = true;
      }
      // the panel's bars: guess against truth
      const T = truth(), guess = { rollEff: J.adapt ? roll.th[0] : 1, rollTrim: J.adapt ? roll.th[1] : 0, pitchEff: J.adapt ? pitch.th[0] : 1 };
      for (const [k, b] of Object.entries(bars)) {
        const frac = k === "rollTrim" ? v => clamp(0.5 + v / 2.4, 0, 1) : v => clamp(v / 1.2, 0, 1);
        b.guess.style.width = `${(frac(guess[k]) * 100).toFixed(1)}%`;
        b.truth.style.left = `${(frac(T[k]) * 100).toFixed(1)}%`;
        b.val.textContent = k === "rollTrim" ? `${guess[k] >= 0 ? "+" : ""}${guess[k].toFixed(2)}` : `${Math.round(guess[k] * 100)}%`;
      }
    }
    // the sun's shadow box follows the jet
    sun.position.copy(st.p).addScaledVector(SUN, 200); sun.target.position.copy(st.p); sun.target.updateMatrixWorld();
    placeCam(dt);
    sky.position.copy(camera.position);
    renderer.render(scene, camera);
    drawHud();
    raf = requestAnimationFrame(frame);
  };

  setMode("auto"); setCam("chase"); spawn(); resize();
  raf = requestAnimationFrame(t => { lastT = t; frame(t); });

  return {
    dispose() {
      cancelAnimationFrame(raf); raf = 0; visible = false;
      ro.disconnect(); io.disconnect();
      removeEventListener("keydown", onKey); removeEventListener("keyup", onKey);
      clearTimeout(say.t);
      for (const d of disposables) d.dispose();
      renderer.dispose();
      box.remove();
    },
  };
};
