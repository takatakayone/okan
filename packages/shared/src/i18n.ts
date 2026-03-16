export type Locale = "en" | "ja" | "zh" | "ko" | "es" | "fr" | "de" | "pt" | "hi";

export interface OkanStrings {
  working: string;
  back: string;
  permissionTitle: string;
  permWrite: string;
  permEdit: string;
  permBash: string;
  permRead: string;
  permDefault: string;
  doneGentle: string;
  doneClassic: string;
  doneMom: string;
  aftercareGentle: string;
  aftercareClassic: string;
  aftercareMom: string;
  aftercareWorkedFor: string;
  aftercareUnderOneMin: string;
  aftercareMinutes: string;
}

const en: OkanStrings = {
  working: "working...",
  back: "Back",
  permissionTitle: "Claude is asking",
  permWrite: "Create file",
  permEdit: "Edit file",
  permBash: "Run command",
  permRead: "Read file",
  permDefault: "Use tool",
  doneGentle: "All done, honey!",
  doneClassic: "Dinner is ready!",
  doneMom: "STOP WATCHING! IT'S DONE!",
  aftercareGentle: "Welcome back, dear!",
  aftercareClassic: "Welcome back!",
  aftercareMom: "Finally! You're back!",
  aftercareWorkedFor: "Claude worked for",
  aftercareUnderOneMin: "under 1 min",
  aftercareMinutes: "min",
};

const ja: OkanStrings = {
  working: "作業中...",
  back: "戻る",
  permissionTitle: "Claude が聞いてるよ",
  permWrite: "ファイルを作成",
  permEdit: "ファイルを編集",
  permBash: "コマンド実行",
  permRead: "ファイルを読む",
  permDefault: "ツール使用",
  doneGentle: "できたよ!",
  doneClassic: "ご飯できたよ！",
  doneMom: "終わったわよ！早く戻りなさい！",
  aftercareGentle: "おかえり!",
  aftercareClassic: "おかえり！",
  aftercareMom: "やっと戻ってきたわね！",
  aftercareWorkedFor: "Claudeの作業時間:",
  aftercareUnderOneMin: "1分未満",
  aftercareMinutes: "分",
};

const zh: OkanStrings = {
  working: "工作中...",
  back: "返回",
  permissionTitle: "Claude 在问你",
  permWrite: "创建文件",
  permEdit: "编辑文件",
  permBash: "执行命令",
  permRead: "读取文件",
  permDefault: "使用工具",
  doneGentle: "好了哦，亲爱的！",
  doneClassic: "饭做好了！",
  doneMom: "别看了！活干完了！快回来！",
  aftercareGentle: "欢迎回来！",
  aftercareClassic: "欢迎回来！",
  aftercareMom: "终于回来了！",
  aftercareWorkedFor: "Claude 工作了",
  aftercareUnderOneMin: "不到1分钟",
  aftercareMinutes: "分钟",
};

const ko: OkanStrings = {
  working: "작업 중...",
  back: "돌아가기",
  permissionTitle: "Claude가 물어보고 있어",
  permWrite: "파일 생성",
  permEdit: "파일 수정",
  permBash: "명령 실행",
  permRead: "파일 읽기",
  permDefault: "도구 사용",
  doneGentle: "다 됐어, 얘야!",
  doneClassic: "밥 다 됐어!",
  doneMom: "그만 봐! 다 끝났어! 빨리 와!",
  aftercareGentle: "다녀왔어!",
  aftercareClassic: "다녀왔어!",
  aftercareMom: "드디어 왔구나!",
  aftercareWorkedFor: "Claude 작업 시간:",
  aftercareUnderOneMin: "1분 미만",
  aftercareMinutes: "분",
};

const es: OkanStrings = {
  working: "trabajando...",
  back: "Volver",
  permissionTitle: "Claude te pregunta",
  permWrite: "Crear archivo",
  permEdit: "Editar archivo",
  permBash: "Ejecutar comando",
  permRead: "Leer archivo",
  permDefault: "Usar herramienta",
  doneGentle: "Ya esta listo, cari!",
  doneClassic: "La cena esta lista!",
  doneMom: "DEJA DE VER ESO! YA TERMINO!",
  aftercareGentle: "Bienvenido de vuelta!",
  aftercareClassic: "Bienvenido!",
  aftercareMom: "Por fin volviste!",
  aftercareWorkedFor: "Claude trabajo por",
  aftercareUnderOneMin: "menos de 1 min",
  aftercareMinutes: "min",
};

const fr: OkanStrings = {
  working: "en cours...",
  back: "Retour",
  permissionTitle: "Claude te demande",
  permWrite: "Creer un fichier",
  permEdit: "Modifier un fichier",
  permBash: "Executer une commande",
  permRead: "Lire un fichier",
  permDefault: "Utiliser un outil",
  doneGentle: "C'est pret, mon chou!",
  doneClassic: "Le diner est pret!",
  doneMom: "ARRETE DE REGARDER! C'EST FINI!",
  aftercareGentle: "Bon retour!",
  aftercareClassic: "Bon retour!",
  aftercareMom: "Enfin te voila!",
  aftercareWorkedFor: "Claude a travaille pendant",
  aftercareUnderOneMin: "moins d'1 min",
  aftercareMinutes: "min",
};

const de: OkanStrings = {
  working: "arbeitet...",
  back: "Zuruck",
  permissionTitle: "Claude fragt dich",
  permWrite: "Datei erstellen",
  permEdit: "Datei bearbeiten",
  permBash: "Befehl ausfuhren",
  permRead: "Datei lesen",
  permDefault: "Tool verwenden",
  doneGentle: "Fertig, Schatz!",
  doneClassic: "Essen ist fertig!",
  doneMom: "HOR AUF! ES IST FERTIG!",
  aftercareGentle: "Willkommen zuruck!",
  aftercareClassic: "Willkommen zuruck!",
  aftercareMom: "Endlich bist du zuruck!",
  aftercareWorkedFor: "Claude hat gearbeitet fur",
  aftercareUnderOneMin: "unter 1 Min",
  aftercareMinutes: "Min",
};

const pt: OkanStrings = {
  working: "trabalhando...",
  back: "Voltar",
  permissionTitle: "Claude esta perguntando",
  permWrite: "Criar arquivo",
  permEdit: "Editar arquivo",
  permBash: "Executar comando",
  permRead: "Ler arquivo",
  permDefault: "Usar ferramenta",
  doneGentle: "Pronto, querido!",
  doneClassic: "O jantar esta pronto!",
  doneMom: "PARA DE ASSISTIR! ESTA PRONTO!",
  aftercareGentle: "Bem-vindo de volta!",
  aftercareClassic: "Bem-vindo!",
  aftercareMom: "Finalmente voltou!",
  aftercareWorkedFor: "Claude trabalhou por",
  aftercareUnderOneMin: "menos de 1 min",
  aftercareMinutes: "min",
};

const hi: OkanStrings = {
  working: "काम चल रहा है...",
  back: "वापस",
  permissionTitle: "Claude पूछ रहा है",
  permWrite: "फ़ाइल बनाएँ",
  permEdit: "फ़ाइल संपादित करें",
  permBash: "कमांड चलाएँ",
  permRead: "फ़ाइल पढ़ें",
  permDefault: "टूल का उपयोग करें",
  doneGentle: "हो गया, जान!",
  doneClassic: "खाना तैयार है!",
  doneMom: "देखना बंद करो! काम हो गया! जल्दी आओ!",
  aftercareGentle: "वापसी पर स्वागत है!",
  aftercareClassic: "वापसी पर स्वागत है!",
  aftercareMom: "आखिरकार आ गए!",
  aftercareWorkedFor: "Claude ने काम किया",
  aftercareUnderOneMin: "1 मिनट से कम",
  aftercareMinutes: "मिनट",
};

const LOCALES: Record<Locale, OkanStrings> = { en, ja, zh, ko, es, fr, de, pt, hi };

export function getStrings(locale: Locale): OkanStrings {
  return LOCALES[locale] ?? LOCALES.en;
}

export const SUPPORTED_LOCALES: Locale[] = ["en", "ja", "zh", "ko", "es", "fr", "de", "pt", "hi"];
