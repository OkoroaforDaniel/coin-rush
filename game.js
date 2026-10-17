// game.js - three.js Collect The Coins (Start.ng ready)
import * as THREE from "./three.module.js";
import { getLoggedInUser, getCentralStyle, saveScore, loadLeaderboard, getPlayerFace } from "./startng.js";

const container = document.getElementById("game-container");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1020);
scene.fog = new THREE.Fog(0x0b1020, 18, 40);

const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 100);
camera.position.set(0, 7, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const sun = new THREE.DirectionalLight(0xffffff, 1.1);
sun.position.set(5, 10, 4);
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(22, 22),
  new THREE.MeshStandardMaterial({ color: 0x16213e })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);
scene.add(new THREE.GridHelper(22, 22, 0x2962ff, 0x1a2340));

// Player - HUMAN built from Start.ng style (docs character rule)
// style: primaryColor=shirt, secondaryColor=pants, skinColor, hairColor, hair, hat
function makePlayer(style) {
  const group = new THREE.Group();
  const primary = style.primaryColor || style.avatarColor || "#2962ff";
  const secondary = style.secondaryColor || "#222a44";
  const skin = style.skinColor || "#ffe0bd";
  const hairC = style.hairColor || "#222222";
  const shirtMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(primary), roughness: 0.5 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(secondary), roughness: 0.7 });
  const skinMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(skin), roughness: 0.6 });
  const hairMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(hairC), roughness: 0.8 });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.35), shirtMat);
  torso.position.y = 1.05;
  group.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 20), skinMat);
  head.position.y = 1.7;
  group.add(head);
  // hair styles
  const hairStyle = (style.hair || "short").toLowerCase();
  if (hairStyle !== "bald") {
    if (hairStyle === "afro") {
      const afro = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 16), hairMat);
      afro.position.y = 1.85; afro.scale.set(1.1, 0.9, 1.1); group.add(afro);
    } else if (hairStyle === "bun") {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.29, 16, 16, 0, Math.PI * 2, 0, 1.4), hairMat);
      cap.position.y = 1.72; group.add(cap);
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), hairMat);
      bun.position.set(0, 2.02, -0.15); group.add(bun);
    } else {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.29, 16, 16, 0, Math.PI * 2, 0, 1.5), hairMat);
      cap.position.y = 1.73; group.add(cap);
      if (hairStyle === "braids" || hairStyle === "dreads" || hairStyle === "ponytail") {
        for (const sx of [-1, 1]) {
          const tail = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.45, 0.09), hairMat);
          tail.position.set(sx * 0.2, 1.45, -0.22); group.add(tail);
        }
      }
    }
  }
  // hat styles
  const hat = (style.hat || "none").toLowerCase();
  if (hat === "cap") {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 16), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    brim.position.y = 1.95; group.add(brim);
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12, 0, Math.PI * 2, 0, 1.4), new THREE.MeshStandardMaterial({ color: 0x2962ff }));
    top.position.y = 1.97; group.add(top);
  } else if (hat === "beanie") {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 14, 0, Math.PI * 2, 0, 1.3), new THREE.MeshStandardMaterial({ color: 0xd32f2f }));
    b.position.y = 1.78; group.add(b);
  } else if (hat === "tophat" || hat === "crown") {
    const col = hat === "crown" ? 0xffc107 : 0x111111;
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.28, 14), new THREE.MeshStandardMaterial({ color: col }));
    t.position.y = 2.05; group.add(t);
    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.04, 14), new THREE.MeshStandardMaterial({ color: col }));
    br.position.y = 1.92; group.add(br);
  }
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), eyeMat);
  e1.position.set(-0.1, 1.73, 0.24); group.add(e1);
  const e2 = e1.clone(); e2.position.x = 0.1; group.add(e2);
  if ((style.accessory || "none").toLowerCase() === "glasses") {
    for (const sx of [-0.1, 0.1]) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 8, 16), new THREE.MeshBasicMaterial({ color: 0x111111 }));
      rim.position.set(sx, 1.73, 0.26); group.add(rim);
    }
  }
  if ((style.accessory || "none").toLowerCase() === "beard") {
    const beard = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), hairMat);
    beard.position.set(0, 1.55, 0.15); beard.scale.set(1, 0.7, 0.7); group.add(beard);
  }
  if ((style.accessory || "none").toLowerCase() === "scarf") {
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.07, 10, 18), new THREE.MeshStandardMaterial({ color: 0xd32f2f }));
    scarf.position.y = 1.42; scarf.rotation.x = Math.PI / 2; group.add(scarf);
  }
  if ((style.accessory || "none").toLowerCase() === "backpack") {
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.2), new THREE.MeshStandardMaterial({ color: 0x795548 }));
    pack.position.set(0, 1.1, -0.3); group.add(pack);
  }
  if ((style.accessory || "none").toLowerCase() === "earrings") {
    for (const sx of [-0.28, 0.28]) {
      const er = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffc107 }));
      er.position.set(sx, 1.65, 0.05); group.add(er);
    }
  }
  // arms - pivot at shoulder so they can swing
  function makeArm(side) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.38, 1.32, 0);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.6, 0.16), shirtMat);
    arm.position.y = -0.3;
    pivot.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), skinMat);
    hand.position.y = -0.62;
    pivot.add(hand);
    group.add(pivot);
    return pivot;
  }
  // legs - pivot at hip so they can swing
  function makeLeg(side) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.16, 0.7, 0);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.65, 0.2), pantsMat);
    leg.position.y = -0.33;
    pivot.add(leg);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.3), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    shoe.position.set(0, -0.66, 0.05);
    pivot.add(shoe);
    group.add(pivot);
    return pivot;
  }
  const armL = makeArm(-1), armR = makeArm(1);
  const legL = makeLeg(-1), legR = makeLeg(1);
  group.userData.bodyMat = shirtMat;
  group.userData.armL = armL; group.userData.armR = armR;
  group.userData.legL = legL; group.userData.legR = legR;
  group.userData.torso = torso;
  return group;
}

let centralStyle = getCentralStyle();
let player = makePlayer(centralStyle);
scene.add(player);

function makeLabel(text) {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 64;
  const g = c.getContext("2d");
  g.fillStyle = "rgba(0,0,0,0.55)";
  g.fillRect(0, 8, 256, 48);
  g.fillStyle = "#fff"; g.font = "bold 26px Arial"; g.textAlign = "center";
  g.fillText((text || "Guest").slice(0, 14), 128, 42);
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true }));
  spr.scale.set(2.4, 0.6, 1);
  spr.position.y = 2.4;
  return spr;
}

let nameSprite = makeLabel(getLoggedInUser()?.username || "Guest");
player.add(nameSprite);

function refreshName() {
  const u = getLoggedInUser();
  player.remove(nameSprite);
  nameSprite = makeLabel(u?.username || "Guest");
  player.add(nameSprite);
  document.getElementById("hud-username").textContent = u?.username || "Guest";
  document.getElementById("win-user").textContent = u?.username || "Player";
}
// Rebuild full character when user or style changes (hair/hat/skin/etc)
function rebuildPlayer() {
  const pos = player.position.clone();
  const rot = player.rotation.y;
  scene.remove(player);
  centralStyle = getCentralStyle();
  player = makePlayer(centralStyle);
  player.position.copy(pos); player.rotation.y = rot; player.visible = true;
  scene.add(player);
  if (flashTimer) { clearInterval(flashTimer); flashTimer = null; }
  nameSprite = makeLabel(getLoggedInUser()?.username || "Guest");
  player.add(nameSprite);
  refreshName();
}
window.addEventListener("startng:userChanged", () => { rebuildPlayer(); });
window.addEventListener("startng:styleChanged", (e) => {
  centralStyle = e.detail;
  // fast path: just recolor if only color changed, else rebuild
  try { player.userData.bodyMat.color.set(centralStyle.avatarColor || centralStyle.primaryColor); } catch {}
  document.getElementById("hud-color").textContent = centralStyle.avatarColor || centralStyle.primaryColor;
  rebuildPlayer();
});

// ---- Barriers (walls) ---- MUST be before coins/enemies use them
const walls = [];
const coins = [];
const coinGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 24);
function randomFreeSpot(minDistFromPlayer = 3) {
  for (let tries = 0; tries < 40; tries++) {
    const x = (Math.random() - 0.5) * 16;
    const z = (Math.random() - 0.5) * 16;
    if (Math.hypot(x - player.position.x, z - player.position.z) < minDistFromPlayer) continue;
    let insideWall = false;
    for (const w of walls) {
      if (Math.abs(x - w.position.x) < w.userData.halfW + 0.6 && Math.abs(z - w.position.z) < w.userData.halfD + 0.6) { insideWall = true; break; }
    }
    if (!insideWall) return { x, z };
  }
  return { x: 8, z: -8 };
}
function spawnCoins(n = 5) {
  coins.forEach(c => scene.remove(c));
  coins.length = 0;
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(coinGeo,
      new THREE.MeshStandardMaterial({ color: 0xffc107, metalness: 0.7, roughness: 0.2 }));
    m.rotation.x = Math.PI / 2;
    const s = randomFreeSpot();
    m.position.set(s.x, 0.6, s.z);
    scene.add(m); coins.push(m);
  }
  document.getElementById("hud-total").textContent = n;
}
let score = 0;
let lives = 3;
let deaths = 0;
let gameOver = false;
let gameWon = false;
let invincibleUntil = 0;
let flashTimer = null;
function updateHUD() {
  document.getElementById("hud-score").textContent = score;
  const hearts = "❤️".repeat(Math.max(lives, 0)) + "🤍".repeat(Math.max(3 - lives, 0));
  document.getElementById("hud-lives").textContent = hearts;
  if (score >= 5 && !gameOver && !gameWon) {
    gameWon = true;
    document.getElementById("win-banner").classList.remove("hidden");
    refreshName();
    onGameEnd(true);
  }
}
async function onGameEnd(won) {
  const msg = document.getElementById("save-msg");
  if (msg) msg.textContent = getLoggedInUser() ? "Saving score..." : "Sign in on live site to save score";
  if (!getLoggedInUser()) { refreshBoard(); return; }
  try {
    const r = await saveScore({ coins: score, deaths });
    if (msg) msg.textContent = r ? `Saved! Best: ${r.best} (rank #${r.rank})` : "Could not save (play live to save)";
  } catch { if (msg) msg.textContent = "Could not save"; }
  refreshBoard();
}
async function refreshBoard() {
  const ol = document.getElementById("board");
  if (!ol) return;
  ol.innerHTML = "<li>Loading...</li>";
  const rows = await loadLeaderboard(10);
  if (!rows || !rows.length) { ol.innerHTML = "<li>No scores yet - be the first!</li>"; return; }
  ol.innerHTML = "";
  const me = getLoggedInUser();
  for (const r of rows) {
    const li = document.createElement("li");
    const st = r.stats || {};
    li.textContent = `#${r.rank} ${r.name}: ${st.coins ?? r.score ?? 0} coins, ${st.deaths ?? 0} deaths`;
    if (me && (r.player_id === me.id || r.name === me.username)) li.style.fontWeight = "800";
    ol.appendChild(li);
  }
}
function loseLife() {
  const now = performance.now();
  if (now < invincibleUntil || gameOver || gameWon) return;
  lives--; deaths++;
  invincibleUntil = now + 1500;
  updateHUD();
  flashPlayer();
  if (lives <= 0) {
    gameOver = true;
    document.getElementById("lose-banner").classList.remove("hidden");
    onGameEnd(false);
  }
}
function flashPlayer() {
  // Cancel any old blink first so timers never fight + never leave player hidden
  if (flashTimer) { clearInterval(flashTimer); flashTimer = null; }
  try { player.visible = true; } catch {}
  let count = 0;
  flashTimer = setInterval(() => {
    try { player.visible = !player.visible; } catch {}
    if (++count > 6) { clearInterval(flashTimer); flashTimer = null; try { player.visible = true; } catch {} }
  }, 120);
}
function resetGame() {
  score = 0; lives = 3; deaths = 0; gameOver = false; gameWon = false;
  updateHUD();
  document.getElementById("win-banner").classList.add("hidden");
  document.getElementById("lose-banner").classList.add("hidden");
  const sm = document.getElementById("save-msg");
  if (sm) sm.textContent = "";
  spawnCoins(5); spawnEnemies(); player.position.set(0, 0, 0);
}
window.addEventListener("startng:userChanged", () => { refreshBoard(); });

// ---- Walls content (walls array already declared above) ----
function makeWall(x, z, w, d) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, 1.4, d),
    new THREE.MeshStandardMaterial({ color: 0x546e7a, roughness: 0.8 })
  );
  m.position.set(x, 0.7, z);
  m.userData.halfW = w / 2; m.userData.halfD = d / 2;
  scene.add(m); walls.push(m);
}
makeWall(-3, -2, 6, 0.7);
makeWall(4, 3, 0.7, 6);
makeWall(-5, 5, 5, 0.7);
function hitsWall(nx, nz) {
  for (const w of walls) {
    if (Math.abs(nx - w.position.x) < w.userData.halfW + 0.4 && Math.abs(nz - w.position.z) < w.userData.halfD + 0.4) return true;
  }
  return false;
}

// ---- Enemies ----
const enemies = [];
function makeEnemy(colorHex) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(colorHex), roughness: 0.4 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 18, 18), mat);
  body.position.y = 0.65; g.add(body);
  const spikeMat = new THREE.MeshStandardMaterial({ color: 0x220000 });
  for (let i = 0; i < 6; i++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.4, 8), spikeMat);
    const a = (i / 6) * Math.PI * 2;
    spike.position.set(Math.cos(a) * 0.55, 0.65, Math.sin(a) * 0.55);
    spike.rotation.z = -Math.cos(a) * 1.2;
    spike.rotation.x = Math.sin(a) * 1.2;
    g.add(spike);
  }
  const eyeW = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  eyeW.position.set(0, 0.85, 0.4); g.add(eyeW);
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  pupil.position.set(0, 0.85, 0.54); g.add(pupil);
  g.userData.pupil = pupil;
  return g;
}
function spawnEnemies() {
  enemies.forEach(e => scene.remove(e));
  enemies.length = 0;
  const defs = [
    { x: -7, z: -7, axis: "x", range: 5, speed: 2.2 },
    { x: 7, z: 6, axis: "z", range: 5, speed: 2.8 },
    { x: 0, z: -6, chase: true, speed: 1.9 },
  ];
  for (const d of defs) {
    const m = makeEnemy(0xe53935);
    m.position.set(d.x, 0, d.z);
    m.userData = { ...m.userData, ...d, baseX: d.x, baseZ: d.z, phase: Math.random() * 6 };
    scene.add(m); enemies.push(m);
  }
}
spawnCoins(5);
spawnEnemies();
updateHUD();

// ---- Movement ----
const keys = {};
// Touch joystick state (mobile)
const touchMove = { x: 0, z: 0, active: false };
(function initTouch() {
  const joy = document.getElementById("joystick");
  const stick = document.getElementById("stick");
  if (!joy || !stick) return;
  let pid = null;
  function setStick(dx, dy) {
    stick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }
  function handle(e) {
    const r = joy.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = e.clientX - cx, dy = e.clientY - cy;
    const max = r.width / 2 - 10;
    const d = Math.hypot(dx, dy);
    if (d > max) { dx = dx / d * max; dy = dy / d * max; }
    setStick(dx, dy);
    // deadzone
    if (Math.hypot(dx, dy) < 8) { touchMove.x = 0; touchMove.z = 0; touchMove.active = false; return; }
    touchMove.x = dx / max; touchMove.z = dy / max; touchMove.active = true;
  }
  joy.addEventListener("pointerdown", (e) => { pid = e.pointerId; joy.setPointerCapture(pid); handle(e); });
  joy.addEventListener("pointermove", (e) => { if (e.pointerId === pid) handle(e); });
  const end = (e) => { if (e.pointerId === pid) { pid = null; setStick(0, 0); touchMove.x = 0; touchMove.z = 0; touchMove.active = false; } };
  joy.addEventListener("pointerup", end);
  joy.addEventListener("pointercancel", end);
  document.getElementById("restart-touch")?.addEventListener("click", () => resetGame());
})();
window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === "r") resetGame();
});
window.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

const clock = new THREE.Clock();
let walkPhase = 0;
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  // Player movement with wall blocking (no pass-through)
  if (!gameOver && !gameWon) {
    const speed = 6 * dt;
    let x = 0, z = 0;
    if (keys["w"] || keys["arrowup"]) z -= speed;
    if (keys["s"] || keys["arrowdown"]) z += speed;
    if (keys["a"] || keys["arrowleft"]) x -= speed;
    if (keys["d"] || keys["arrowright"]) x += speed;
    if (touchMove.active) { x += touchMove.x * speed; z += touchMove.z * speed; }
    const nx = THREE.MathUtils.clamp(player.position.x + x, -10, 10);
    const nz = THREE.MathUtils.clamp(player.position.z + z, -10, 10);
    if (!hitsWall(nx, player.position.z)) player.position.x = nx;
    if (!hitsWall(player.position.x, nz)) player.position.z = nz;
    if (x || z) player.rotation.y = Math.atan2(x, z);
    const moving = (x !== 0 || z !== 0);
    walkPhase += moving ? dt * 10 : dt * 2;
    const swing = moving ? Math.sin(walkPhase) * 0.7 : Math.sin(walkPhase) * 0.05;
    player.userData.armL.rotation.x = swing;
    player.userData.armR.rotation.x = -swing;
    player.userData.legL.rotation.x = -swing;
    player.userData.legR.rotation.x = swing;
    player.userData.torso.position.y = 1.05 + (moving ? Math.abs(Math.sin(walkPhase)) * 0.06 : 0);
  }
  camera.position.x += (player.position.x - camera.position.x) * 0.06;
  camera.position.z += ((player.position.z + 10) - camera.position.z) * 0.06;
  camera.lookAt(player.position.x, 0.5, player.position.z);
  // Coins spin + pickup
  if (!gameOver && !gameWon) {
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      c.rotation.z = t * 2 + i;
      c.position.y = 0.6 + Math.sin(t * 3 + i) * 0.12;
      const dx = c.position.x - player.position.x;
      const dz = c.position.z - player.position.z;
      if (Math.sqrt(dx*dx + dz*dz) < 0.9) {
        scene.remove(c); coins.splice(i, 1);
        score++; updateHUD();
      }
    }
  }
  // Enemies move + hit player
  if (!gameOver && !gameWon) {
    for (const e of enemies) {
      const u = e.userData;
      if (u.chase) {
        const dx = player.position.x - e.position.x;
        const dz = player.position.z - e.position.z;
        const d = Math.hypot(dx, dz) || 1;
        e.position.x += (dx / d) * u.speed * dt;
        e.position.z += (dz / d) * u.speed * dt;
        e.rotation.y = Math.atan2(dx, dz);
      } else if (u.axis === "x") {
        e.position.x = u.baseX + Math.sin(t * u.speed * 0.5 + u.phase) * u.range * 0.6;
      } else {
        e.position.z = u.baseZ + Math.sin(t * u.speed * 0.5 + u.phase) * u.range * 0.6;
      }
      e.position.y = Math.abs(Math.sin(t * 4 + u.phase)) * 0.15;
      const edx = e.position.x - player.position.x;
      const edz = e.position.z - player.position.z;
      if (Math.sqrt(edx*edx + edz*edz) < 1.0) loseLife();
    }
  }
  renderer.render(scene, camera);
}
animate();
window.addEventListener("resize", () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});
refreshName();

