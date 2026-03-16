/**
 * Okan Badge - Single component that changes based on state.
 * Wrapped in IIFE with guard to prevent duplicate injection.
 */
(() => {
  if (document.getElementById("okan-host")) return;

  type BadgeState = "idle" | "working" | "waiting_permission" | "done";

  interface PermissionData { id: string; question: string; tool: string; }
  interface DoneData { summary: string; mode: string; locale: string; }

  const UI: Record<string, { working: string; permTitle: string; back: string }> = {
    en: { working: "working...", permTitle: "Claude is asking", back: "Back" },
    ja: { working: "作業中...", permTitle: "Claude が聞いてるよ", back: "戻る" },
    zh: { working: "工作中...", permTitle: "Claude 在问你", back: "返回" },
    ko: { working: "작업 중...", permTitle: "Claude가 물어보고 있어", back: "돌아가기" },
    es: { working: "trabajando...", permTitle: "Claude te pregunta", back: "Volver" },
    fr: { working: "en cours...", permTitle: "Claude te demande", back: "Retour" },
    de: { working: "arbeitet...", permTitle: "Claude fragt dich", back: "Zuruck" },
    pt: { working: "trabalhando...", permTitle: "Claude esta perguntando", back: "Voltar" },
    hi: { working: "काम चल रहा है...", permTitle: "Claude पूछ रहा है", back: "वापस" },
  };
  function t(locale: string) { return UI[locale] ?? UI.en; }
  let locale = "en";

  // --- Styles (declared early so DOM setup can use it) ---
  const STYLES = `
    .okan-badge {
      position: fixed;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      transition: all 0.3s ease;
      user-select: none;
    }
    .okan-badge--idle { display: none; }
    .okan-badge--working {
      bottom: 20px; right: 20px;
      background: rgba(30,30,30,0.85); color: #fff;
      padding: 8px 14px; border-radius: 20px;
      display: flex; align-items: center; gap: 8px;
      backdrop-filter: blur(8px);
      box-shadow: 0 2px 12px rgba(0,0,0,0.3);
      cursor: default; opacity: 0.7;
    }
    .okan-badge--working:hover { opacity: 1; }
    .okan-badge--waiting_permission, .okan-badge--done {
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      cursor: move;
    }
    .okan-card {
      background: rgba(30,30,30,0.92); color: #fff;
      border-radius: 16px; padding: 20px 24px;
      min-width: 280px; max-width: 400px;
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    }
    .okan-card--done { animation: okan-pulse 2s ease-in-out infinite; }
    .okan-card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .okan-card-title { font-size: 16px; font-weight: 600; }
    .okan-icon { font-size: 20px; }
    .okan-card-question { color: #ccc; margin-bottom: 16px; font-size: 14px; word-break: break-word; }
    .okan-card-actions { display: flex; gap: 10px; justify-content: flex-end; }
    .okan-btn {
      border: none; border-radius: 8px; padding: 8px 20px;
      font-size: 14px; font-weight: 500; cursor: pointer;
      transition: background 0.2s;
    }
    .okan-btn--ok { background: #4CAF50; color: #fff; }
    .okan-btn--ok:hover { background: #43A047; }
    .okan-btn--no { background: #555; color: #fff; }
    .okan-btn--no:hover { background: #666; }
    .okan-btn--back { background: #2196F3; color: #fff; }
    .okan-btn--back:hover { background: #1E88E5; }
    @keyframes okan-pulse {
      0%, 100% { box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
      50% { box-shadow: 0 8px 32px rgba(33,150,243,0.6); }
    }
    @keyframes okan-shake {
      0%, 100% { transform: translate(-50%,-50%) rotate(0deg); }
      25% { transform: translate(-50%,-50%) rotate(-2deg); }
      75% { transform: translate(-50%,-50%) rotate(2deg); }
    }
  `;

  // --- DOM Setup ---
  const host = document.createElement("div");
  host.id = "okan-host";
  const shadow = host.attachShadow({ mode: "closed" });

  const styleEl = document.createElement("style");
  styleEl.textContent = STYLES;
  shadow.appendChild(styleEl);

  const badge = document.createElement("div");
  badge.id = "okan-badge";
  badge.className = "okan-badge okan-badge--idle";
  shadow.appendChild(badge);
  document.documentElement.appendChild(host);

  // --- State ---
  let permissionData: PermissionData | null = null;
  let savedPosition: { x: number; y: number } | null = null;
  let okanEnabled = true;
  let escalateTimer: ReturnType<typeof setTimeout> | null = null;

  chrome.storage.local.get(["okanBadgePosition", "okanEnabled"], (result) => {
    if (result.okanBadgePosition) savedPosition = result.okanBadgePosition;
    if (result.okanEnabled === false) { okanEnabled = false; setState("idle"); }
  });

  // --- Message Handler ---
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "okan_toggle") {
      okanEnabled = msg.enabled;
      if (!okanEnabled) setState("idle");
      return;
    }
    if (!okanEnabled) return;

    switch (msg.type) {
      case "state_change":
        if (msg.state === "idle") setState("idle");
        else if (msg.state === "working") setState("working");
        break;
      case "permission_request":
        permissionData = { id: msg.id, question: msg.question, tool: msg.tool };
        setState("waiting_permission");
        break;
      case "task_done":
        setState("done", msg);
        break;
    }
  });

  // --- Render ---
  function setState(state: BadgeState, data?: DoneData): void {
    badge.className = `okan-badge okan-badge--${state}`;
    badge.style.cssText = "";
    if (escalateTimer) { clearTimeout(escalateTimer); escalateTimer = null; }

    switch (state) {
      case "idle":
        badge.innerHTML = "";
        break;
      case "working":
        badge.innerHTML = `<span class="okan-icon">🍱</span><span class="okan-text">${t(locale).working}</span>`;
        break;
      case "waiting_permission":
        renderPermission();
        applyPosition();
        makeDraggable();
        break;
      case "done":
        renderDone(data);
        applyPosition();
        makeDraggable();
        break;
    }
  }

  function renderPermission(): void {
    if (!permissionData) return;
    badge.innerHTML = `
      <div class="okan-card">
        <div class="okan-card-header">
          <span class="okan-icon">🍱</span>
          <span class="okan-card-title">${esc(t(locale).permTitle)}</span>
        </div>
        <div class="okan-card-question">${esc(permissionData.question)}</div>
        <div class="okan-card-actions">
          <button class="okan-btn okan-btn--ok">OK</button>
          <button class="okan-btn okan-btn--no">No</button>
        </div>
      </div>`;
    badge.querySelector(".okan-btn--ok")?.addEventListener("click", () => respondPermission("allow"));
    badge.querySelector(".okan-btn--no")?.addEventListener("click", () => respondPermission("deny"));
  }

  function renderDone(data?: DoneData): void {
    if (data?.locale) locale = data.locale;
    const text = data?.summary ?? "Done!";
    const mode = data?.mode ?? "classic";

    badge.innerHTML = `
      <div class="okan-card okan-card--done">
        <div class="okan-card-header">
          <span class="okan-icon">🍱</span>
          <span class="okan-card-title">${esc(text)}</span>
        </div>
        <div class="okan-card-actions">
          <button class="okan-btn okan-btn--back">${esc(t(locale).back)}</button>
        </div>
      </div>`;
    badge.querySelector(".okan-btn--back")?.addEventListener("click", () => {
      if (escalateTimer) clearTimeout(escalateTimer);
      chrome.runtime.sendMessage({ type: "back_to_reality" });
      setState("idle");
    });

    if (mode === "mom") {
      escalateTimer = setTimeout(() => {
        const card = badge.querySelector(".okan-card") as HTMLElement | null;
        if (card) {
          card.style.animation = "okan-shake 0.3s ease-in-out infinite";
          card.style.boxShadow = "0 0 40px rgba(244, 67, 54, 0.8)";
        }
      }, 5_000);
    }

    try {
      const url = chrome.runtime.getURL(`assets/sounds/${mode}.mp3`);
      const audio = new Audio(url);
      audio.volume = 0.8;
      audio.play().catch(() => {});
    } catch {}
  }

  function respondPermission(decision: "allow" | "deny"): void {
    if (!permissionData) return;
    chrome.runtime.sendMessage({ type: "permission_response", id: permissionData.id, decision });
    permissionData = null;
    setState("working");
  }

  // --- Drag ---
  let dragCleanup: (() => void) | null = null;

  function makeDraggable(): void {
    // Clean up previous drag listeners
    if (dragCleanup) { dragCleanup(); dragCleanup = null; }

    let pressing = false;
    let dragging = false;
    let sx = 0, sy = 0, ox = 0, oy = 0;
    const THRESHOLD = 5; // pixels before drag starts

    const down = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      pressing = true;
      dragging = false;
      sx = e.clientX; sy = e.clientY;
      // Remove CSS centering transform so position is absolute
      badge.style.transform = "none";
      const r = badge.getBoundingClientRect();
      ox = r.left; oy = r.top;
      // Set position explicitly to where badge currently is
      badge.style.left = `${ox}px`;
      badge.style.top = `${oy}px`;
      badge.style.right = "auto";
      badge.style.bottom = "auto";
      e.preventDefault();
    };

    const move = (e: MouseEvent) => {
      if (!pressing) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (!dragging && Math.abs(dx) + Math.abs(dy) < THRESHOLD) return;
      dragging = true;
      badge.style.left = `${ox + dx}px`;
      badge.style.top = `${oy + dy}px`;
    };

    const up = () => {
      if (!pressing) return;
      pressing = false;
      if (dragging) {
        dragging = false;
        const r = badge.getBoundingClientRect();
        savedPosition = { x: r.left, y: r.top };
        chrome.storage.local.set({ okanBadgePosition: savedPosition });
      }
    };

    badge.addEventListener("mousedown", down);
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);

    dragCleanup = () => {
      badge.removeEventListener("mousedown", down);
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
  }

  function applyPosition(): void {
    if (savedPosition) {
      badge.style.transform = "none";
      badge.style.left = `${savedPosition.x}px`;
      badge.style.top = `${savedPosition.y}px`;
      badge.style.right = "auto";
      badge.style.bottom = "auto";
    }
  }

  function esc(s: string): string {
    const d = document.createElement("div"); d.textContent = s; return d.innerHTML;
  }

})();
