// startng.js PART 1 - core + connect frame (docs: https://start.ng/docs.md)
const START_NG = "https://start.ng";
const USER_KEY = "startng_logged_in_user";
const STYLE_KEY = "startng_central_style";
const DEFAULT_STYLE = { avatarColor: "#2962ff" };
const GUEST_FALLBACK = {
  name: "Guest",
  style: { primaryColor: "#9e9e9e", secondaryColor: "#424242", skinColor: "#ffe0bd", hair: "short", hairColor: "#333333", hat: "none", accessory: "none", body: "male" },
  face: null,
};
let framePromise = null;
let currentPlayer = null;
let isLiveUser = false;
let lastSig = "";
function connectFrame() {
  if (framePromise) return framePromise;
  framePromise = new Promise((resolve) => {
    try {
      const el = document.createElement("iframe");
      el.src = `${START_NG}/connect`;
      el.hidden = true;
      el.onload = () => resolve(el);
      el.onerror = () => resolve(null);
      document.body.append(el);
      setTimeout(() => resolve(null), 6000);
    } catch (e) { resolve(null); }
  });
  return framePromise;
}
async function askStartNg(message, replyType, timeoutMs = 5000) {
  try {
    const el = await connectFrame();
    if (!el || !el.contentWindow) return null;
    return await new Promise((resolve) => {
      const requestId = Math.random().toString(36).slice(2);
      const timer = setTimeout(() => { removeEventListener("message", onMsg); resolve(null); }, timeoutMs);
      function onMsg(e) {
        if (e.origin !== START_NG || e.source !== el.contentWindow) return;
        if (e.data?.type === replyType && e.data.requestId === requestId) {
          clearTimeout(timer); removeEventListener("message", onMsg); resolve(e.data);
        }
      }
      addEventListener("message", onMsg);
      el.contentWindow.postMessage({ ...message, requestId }, START_NG);
    });
  } catch { return null; }
}
function styleToAvatarColor(style) {
  if (!style) return DEFAULT_STYLE.avatarColor;
  return style.primaryColor || style.avatarColor || DEFAULT_STYLE.avatarColor;
}
export function getLoggedInUser() {
  if (!currentPlayer) return null;
  if (currentPlayer.name === "Guest") return null;
  return { username: currentPlayer.name, account: currentPlayer.account || "", id: currentPlayer.id ?? ("local-" + currentPlayer.name.toLowerCase()) };
}
export function getCentralStyle() {
  if (currentPlayer?.style) {
    const s = currentPlayer.style;
    return {
      avatarColor: styleToAvatarColor(s),
      primaryColor: s.primaryColor || s.avatarColor || DEFAULT_STYLE.avatarColor,
      secondaryColor: s.secondaryColor || "#222a44",
      skinColor: s.skinColor || "#ffe0bd",
      hairColor: s.hairColor || "#222222",
      hair: s.hair || "short",
      hat: s.hat || "none",
      accessory: s.accessory || "none",
      body: s.body || "male",
    };
  }
  try {
    const raw = localStorage.getItem(STYLE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      const c = p.avatarColor || DEFAULT_STYLE.avatarColor;
      return { avatarColor: c, primaryColor: c, secondaryColor: "#222a44", skinColor: "#ffe0bd", hairColor: "#222222", hair: "short", hat: "none", accessory: "none", body: "male" };
    }
  } catch {}
  return { avatarColor: DEFAULT_STYLE.avatarColor, primaryColor: DEFAULT_STYLE.avatarColor, secondaryColor: "#222a44", skinColor: "#ffe0bd", hairColor: "#222222", hair: "short", hat: "none", accessory: "none", body: "male" };
}
export function setCentralStyle(patch) {
  const cur = getCentralStyle();
  const next = { ...cur, ...patch };
  if (patch.avatarColor && !patch.primaryColor) next.primaryColor = patch.avatarColor;
  if (patch.primaryColor && !patch.avatarColor) next.avatarColor = patch.primaryColor;
  try { localStorage.setItem(STYLE_KEY, JSON.stringify({ avatarColor: next.avatarColor })); } catch {}
  if (currentPlayer?.style) currentPlayer.style = { ...currentPlayer.style, ...next };
  window.dispatchEvent(new CustomEvent("startng:styleChanged", { detail: next }));
  return next;
}
export function login(username) {
  const clean = (username || "").trim();
  if (!clean) return null;
  const style = getCentralStyle();
  currentPlayer = { name: clean, account: clean.toLowerCase(), style, face: null };
  lastSig = clean + "|" + JSON.stringify(style || {});
  isLiveUser = false;
  try { localStorage.setItem(USER_KEY, JSON.stringify({ username: clean })); } catch {}
  window.dispatchEvent(new CustomEvent("startng:userChanged", { detail: currentPlayer }));
  refreshHeader();
  return { username: clean };
}
export function logout() {
  currentPlayer = { ...GUEST_FALLBACK };
  lastSig = "Guest|" + JSON.stringify(currentPlayer.style || {});
  try { localStorage.removeItem(USER_KEY); } catch {}
  window.dispatchEvent(new CustomEvent("startng:userChanged", { detail: null }));
  refreshHeader();
}

export async function refreshStartNgUser() {
  const reply = await askStartNg({ type: "startng:whoami" }, "startng:user");
  if (reply && (reply.user || reply.guest)) {
    const p = reply.user ?? reply.guest;
    // Only rebuild if player actually changed (prevents avatar flicker/delete loop)
    const sig = (p.name || "") + "|" + JSON.stringify(p.style || {});
    if (sig !== lastSig) {
      lastSig = sig;
      currentPlayer = { name: p.name, account: p.account || "", id: p.id, style: p.style, face: p.face || null };
      isLiveUser = !!reply.user;
      window.dispatchEvent(new CustomEvent("startng:userChanged", { detail: currentPlayer }));
    }
    refreshHeader(); updateProfileCard();
    return currentPlayer;
  }
  // Local dev: iframe timeout returns null. DO NOT wipe saved login - keep it.
  if (currentPlayer && currentPlayer.name !== "Guest") {
    refreshHeader(); updateProfileCard();
    return currentPlayer;
  }
  const params = new URLSearchParams(location.search);
  if (params.has("guest")) { currentPlayer = { ...GUEST_FALLBACK }; }
  else {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        currentPlayer = { name: saved.username, account: saved.username.toLowerCase(), style: getCentralStyle(), face: null };
      } else { currentPlayer = { ...GUEST_FALLBACK }; }
    } catch { currentPlayer = { ...GUEST_FALLBACK }; }
  }
  lastSig = (currentPlayer.name || "") + "|" + JSON.stringify(currentPlayer.style || {});
  window.dispatchEvent(new CustomEvent("startng:userChanged", { detail: currentPlayer }));
  refreshHeader(); updateProfileCard();
  return currentPlayer;
}
export function getPlayerFace() { return currentPlayer?.face || null; }
export function signIn() {
  location.href = `https://start.ng/?return_to=${encodeURIComponent(location.origin + location.pathname)}`;
}
export async function saveScore(stats) {
  const r1 = await askStartNg({ type: "startng:score", stats }, "startng:scoreSaved");
  if (r1 && r1.ok) return r1.result;
  try {
    const session = sessionStorage.getItem("startng_session");
    const game = location.hostname.split(".")[0];
    if (session && game && game !== "localhost") {
      const res = await fetch(`https://api.start.ng/games/${game}/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session}` },
        body: JSON.stringify({ stats }),
      });
      if (res.ok) return await res.json();
    }
  } catch {}
  return null;
}
export async function loadLeaderboard(limit = 10) {
  const r1 = await askStartNg({ type: "startng:leaderboard", limit }, "startng:leaderboardData");
  if (r1 && r1.ok) return r1.entries || [];
  try {
    const game = location.hostname.split(".")[0];
    if (game && game !== "localhost" && game !== "127") {
      const res = await fetch(`https://api.start.ng/games/${game}/leaderboard?limit=${limit}`);
      if (res.ok) return await res.json();
    }
  } catch {}
  return [];
}
(function pickupSession() {
  try {
    const h = new URLSearchParams(location.hash.slice(1));
    if (h.get("startng_session")) {
      sessionStorage.setItem("startng_session", h.get("startng_session"));
      history.replaceState(null, "", location.pathname + location.search);
    }
  } catch {}
})();
function refreshHeader() {
  const loginView = document.getElementById("login-view");
  const loggedView = document.getElementById("logged-in-view");
  if (!loginView || !loggedView) return;
  const user = getLoggedInUser();
  const style = getCentralStyle();
  if (user) {
    loginView.classList.add("hidden");
    loggedView.classList.remove("hidden");
    document.getElementById("header-username").textContent = user.username;
  } else {
    loginView.classList.remove("hidden");
    loggedView.classList.add("hidden");
  }
  const dot = document.getElementById("header-avatar-dot");
  if (dot) dot.style.background = style.avatarColor;
  const hudC = document.getElementById("hud-color");
  if (hudC) hudC.textContent = style.avatarColor;
  const picker = document.getElementById("color-picker");
  if (picker) { try { if (picker.value.toLowerCase() !== style.avatarColor.toLowerCase()) picker.value = style.avatarColor; } catch {} }
}
function updateProfileCard() {
  const card = document.getElementById("player-card");
  if (!card) return;
  const face = document.getElementById("player-face");
  const nm = document.getElementById("player-name");
  const acc = document.getElementById("player-account");
  const btn = document.getElementById("player-sign-in");
  if (!currentPlayer) { card.hidden = true; return; }
  card.hidden = false;
  if (face) {
    if (currentPlayer.face) { face.src = currentPlayer.face; face.style.display = ""; }
    else { face.style.display = "none"; }
  }
  if (nm) nm.textContent = currentPlayer.name;
  if (acc) acc.textContent = currentPlayer.account ? `@${currentPlayer.account}` : "Guest - sign in on live site";
  if (btn) {
    btn.hidden = !!getLoggedInUser();
    btn.onclick = () => {
      if (location.hostname.endsWith("start.ng")) signIn();
      else document.getElementById("login-input")?.focus();
    };
  }
}
function initHeaderUI() {
  document.getElementById("login-btn")?.addEventListener("click", () => {
    const input = document.getElementById("login-input");
    login(input?.value || "Player1");
  });
  document.getElementById("logout-btn")?.addEventListener("click", logout);
  document.getElementById("login-input")?.addEventListener("keydown", (e) => { if (e.key === "Enter") document.getElementById("login-btn").click(); });
  document.getElementById("color-picker")?.addEventListener("input", (e) => setCentralStyle({ avatarColor: e.target.value }));
  document.querySelectorAll(".swatch").forEach((btn) => btn.addEventListener("click", () => setCentralStyle({ avatarColor: btn.dataset.color })));
  document.getElementById("signin-live-btn")?.addEventListener("click", signIn);
  window.addEventListener("startng:userChanged", () => { refreshHeader(); updateProfileCard(); });
  window.addEventListener("startng:styleChanged", refreshHeader);
  // Only re-check start.ng when LIVE (local iframe never answers -> would wipe local login)
  const isLive = location.hostname.endsWith("start.ng");
  if (isLive) {
    document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshStartNgUser(); });
    window.addEventListener("focus", () => refreshStartNgUser());
  }
  refreshStartNgUser();
}
initHeaderUI();
