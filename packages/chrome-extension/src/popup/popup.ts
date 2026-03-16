const HTTP_API_BASE = "http://localhost:9394";

const toggle = document.getElementById("enabled-toggle") as HTMLInputElement;
const modeButtons = document.querySelectorAll(".mode-btn");
const langSelect = document.getElementById("lang-select") as HTMLSelectElement;

interface PopupStrings {
  modeLabel: string;
  langLabel: string;
  gentleName: string;
  gentleDesc: string;
  classicName: string;
  classicDesc: string;
  momName: string;
  momDesc: string;
}

const POPUP_I18N: Record<string, PopupStrings> = {
  en: {
    modeLabel: "MODE", langLabel: "LANGUAGE",
    gentleName: "Gentle", gentleDesc: "All done, honey!",
    classicName: "Classic", classicDesc: "Dinner is ready!",
    momName: "Mom", momDesc: "STOP WATCHING! IT'S DONE!",
  },
  ja: {
    modeLabel: "モード", langLabel: "言語",
    gentleName: "やさしい", gentleDesc: "できたよ!",
    classicName: "ふつう", classicDesc: "ご飯できたよ！",
    momName: "おかん", momDesc: "終わったわよ！早く戻りなさい！",
  },
  zh: {
    modeLabel: "模式", langLabel: "语言",
    gentleName: "温柔", gentleDesc: "好了哦，亲爱的！",
    classicName: "经典", classicDesc: "饭做好了！",
    momName: "老妈", momDesc: "别看了！快回来！",
  },
  ko: {
    modeLabel: "모드", langLabel: "언어",
    gentleName: "부드러운", gentleDesc: "다 됐어, 얘야!",
    classicName: "기본", classicDesc: "밥 다 됐어!",
    momName: "엄마", momDesc: "그만 봐! 빨리 와!",
  },
  es: {
    modeLabel: "MODO", langLabel: "IDIOMA",
    gentleName: "Suave", gentleDesc: "Ya esta listo, cari!",
    classicName: "Clasico", classicDesc: "La cena esta lista!",
    momName: "Mama", momDesc: "DEJA DE VER ESO!",
  },
  fr: {
    modeLabel: "MODE", langLabel: "LANGUE",
    gentleName: "Doux", gentleDesc: "C'est pret, mon chou!",
    classicName: "Classique", classicDesc: "Le diner est pret!",
    momName: "Maman", momDesc: "ARRETE! C'EST FINI!",
  },
  de: {
    modeLabel: "MODUS", langLabel: "SPRACHE",
    gentleName: "Sanft", gentleDesc: "Fertig, Schatz!",
    classicName: "Klassisch", classicDesc: "Essen ist fertig!",
    momName: "Mutti", momDesc: "HOR AUF! ES IST FERTIG!",
  },
  pt: {
    modeLabel: "MODO", langLabel: "IDIOMA",
    gentleName: "Gentil", gentleDesc: "Pronto, querido!",
    classicName: "Classico", classicDesc: "O jantar esta pronto!",
    momName: "Mae", momDesc: "PARA DE ASSISTIR!",
  },
  hi: {
    modeLabel: "मोड", langLabel: "भाषा",
    gentleName: "नरम", gentleDesc: "हो गया, जान!",
    classicName: "साधारण", classicDesc: "खाना तैयार है!",
    momName: "माँ", momDesc: "देखना बंद करो! काम हो गया!",
  },
};

function applyI18n(locale: string): void {
  const s = POPUP_I18N[locale] ?? POPUP_I18N.en;
  document.getElementById("mode-label")!.textContent = s.modeLabel;
  document.getElementById("lang-label")!.textContent = s.langLabel;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = (el as HTMLElement).dataset.i18n as keyof PopupStrings | undefined;
    if (key && s[key]) el.textContent = s[key];
  });
}

// --- Load state ---

chrome.storage.local.get(["okanEnabled"], (result) => {
  toggle.checked = result.okanEnabled !== false;
});

interface StatusResponse {
  state: string;
  mode: string;
  locale: string;
  extensionConnected: boolean;
}

// Apply browser language immediately as fallback
const browserLang = (navigator.language || "en").split("-")[0];
const fallbackLocale = ["en","ja","zh","ko","es","fr","de","pt","hi"].includes(browserLang) ? browserLang : "en";
langSelect.value = fallbackLocale;
applyI18n(fallbackLocale);

(async () => {
  try {
    const res = await fetch(`${HTTP_API_BASE}/api/status`);
    if (res.ok) {
      const data = (await res.json()) as StatusResponse;
      setActiveMode(data.mode);
      langSelect.value = data.locale ?? fallbackLocale;
      applyI18n(data.locale ?? fallbackLocale);
    }
  } catch {
    setActiveMode("classic");
  }
})();

// --- Toggle ---

toggle.addEventListener("change", () => {
  const enabled = toggle.checked;
  chrome.storage.local.set({ okanEnabled: enabled });
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.id && tab.url?.match(/^https?:\/\//)) {
        chrome.tabs.sendMessage(tab.id, { type: "okan_toggle", enabled }).catch(() => {});
      }
    }
  });
});

// --- Mode ---

modeButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    const mode = (btn as HTMLElement).dataset.mode!;
    try {
      await fetch(`${HTTP_API_BASE}/api/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      setActiveMode(mode);
    } catch {}
  });
});

function setActiveMode(mode: string): void {
  modeButtons.forEach((btn) => {
    btn.classList.toggle("active", (btn as HTMLElement).dataset.mode === mode);
  });
}

// --- Language ---

langSelect.addEventListener("change", async () => {
  const locale = langSelect.value;
  try {
    await fetch(`${HTTP_API_BASE}/api/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale }),
    });
    applyI18n(locale);
  } catch {}
});

export {};
