// The home page's editorial layer (src/pages/index.astro → src/components/home/).
// Plain data so it can be edited without touching the components.
//
// NEWS — one "article" per interactive launch, newest first on the page (the
// component sorts by date, so the order here does not matter). Each entry:
//   slug   the evidence record (src/data/experiments/<slug>.json) — the card
//          links to its detail page and takes its thumbnail from it
//   date   ISO date. The pieces were released from March 2026 onwards; the
//          exact days are editorial placeholders chosen by the site, not
//          recorded launch dates — replace them with the real ones when known.
//   title  { en, jp } headline. Project names stay in English.
//   lead   { en, jp } 2–3 sentences, taken only from the record's summary /
//          challenge / solution and src/case-studies/<slug>.html. No metrics,
//          awards, events or collaborations that the records do not carry.
//   image  optional site-relative still that overrides the record's thumb.
//
// SHOWCASE — the hero slideshow order: the interactive pieces first, then the
// client work that has a real hero still. A slug with no media is skipped.

export const NEWS = [
  {
    slug: "werewolf",
    date: "2026-09-10",
    image: "assets/werewolf/hero-spread.jpg",
    title: {
      en: "Werewolf: a parlor game dealt from 25 etching-style cards",
      jp: "Werewolf — 版画調の 25 枚で配る、対面の人狼",
    },
    lead: {
      en: "Every player gets a role card on their own phone while the shared screen runs the table: lobby, the deal, nightfall, the council, the verdict. All 25 dark gothic roles are etching-style, layered in two planes, and tilt with the phone.",
      jp: "役職カードは一人一台のスマホに届き、進行は大画面が受け持つ。ロビー、配役、夜、議論、追放まで一続き。25 種の役職はすべて版画調のゴシックで、前景と背景の二層に分かれ、スマホを傾けると絵が動く。",
    },
  },
  {
    slug: "koe-baku",
    date: "2026-08-20",
    title: {
      en: "Koe Baku: shout, and your voice bursts into onomatopoeia",
      jp: "Koe Baku — 叫んだ声が、擬音になって弾ける",
    },
    lead: {
      en: "Join by QR and shout at the shared screen. Each phone scores its own peak volume and sends only the number — the audio never leaves the handset, so the game is read in the room, not in a settings panel.",
      jp: "QR で参加して、共有画面に向かって叫ぶ。ピーク音量は各自のスマホが測り、送るのは数値だけ。音声は端末から出ないので、勝負は設定画面ではなく部屋のなかで決まる。",
    },
  },
  {
    slug: "rakugaki-jam",
    date: "2026-07-23",
    title: {
      en: "Rakugaki Jam: doodle on your phone, fling it onto the wall",
      jp: "Rakugaki Jam — スマホの落書きを、壁へ投げる",
    },
    lead: {
      en: "A live, crowd-drawn VJ jam. You draw in private on your own phone, then flick the doodle onto a shared wall screen. Snap Pair connects the room in one scan, with no app to install and setup under a minute.",
      jp: "みんなで描くライブ VJ。描くのは手元のスマホで、フリックすると壁の共有画面へ飛んでいく。Snap Pair でその場の端末がワンスキャンでつながる。インストールは不要で、準備は 1 分以内。",
    },
  },
  {
    slug: "marubatsu",
    date: "2026-06-25",
    title: {
      en: "Marubatsu 2.0: tic-tac-toe with one rule changed",
      jp: "Marubatsu 2.0 — ルールを一つだけ変えた○×",
    },
    lead: {
      en: "A 4×4 board and two marks a turn — a rule worked out with my son over hundreds of rounds on paper. Play face-to-face on one phone, against a Gemini-powered AI at four levels, or online by pairing a second phone.",
      jp: "4×4 の盤に、1 手 2 個置き。ルールは息子と紙の上で何百局も指して決めた。1 台で向かい合っても、Gemini を使った 4 段階の AI 相手でも、2 台目をつないでオンラインでも遊べる。",
    },
  },
  {
    slug: "emoji-blast",
    date: "2026-06-04",
    title: {
      en: "Emoji Blast: two phones, one co-op arcade",
      jp: "Emoji Blast — スマホ 2 台で、1 台のアーケード",
    },
    lead: {
      en: "An emoji-only shooter for two, linked peer-to-peer over WebRTC with no server in the game loop. Lives are shared and a tether runs between the ships, so there is no player-one seat to fight over.",
      jp: "絵文字だけの 2 人協力シューティング。2 台は WebRTC で直接つながり、ゲーム中はサーバーを通らない。残機は共有で、2 機のあいだには糸が張られている。取り合う「1P の席」はない。",
    },
  },
  {
    slug: "kao-game",
    date: "2026-05-21",
    title: {
      en: "Kao Game: your face is the controller",
      jp: "Kao Game — 顔がコントローラーになる",
    },
    lead: {
      en: "Mini-games played with your mouth, cheeks and gaze — a facial workout you actually want to repeat. Detection runs on the device, so the video never leaves the phone, and the rules come from what moves on screen, not a tutorial.",
      jp: "口、頬、視線で遊ぶミニゲーム。続きにくい顔の運動を、続けたくなる形にした。表情の検出は端末の中で完結し、映像は外に出ない。ルールはチュートリアルではなく、画面で動くものが伝える。",
    },
  },
  {
    slug: "resona",
    date: "2026-04-16",
    title: {
      en: "Resona: meaning you feel before you read it",
      jp: "Resona — 読む前に、手応えで伝わる",
    },
    lead: {
      en: "A showcase of pseudo-haptics. The only input is a pointer and the only surface is flat glass, so weight, drag and resistance are simulated in motion. Intent lands in the body before any copy appears.",
      jp: "疑似触覚のショーケース。入力はポインタだけ、触れるのは平らなガラスだけ。だから重さも抵抗もモーションで作る。意味は文字より先に、手応えとして届く。",
    },
  },
  {
    slug: "typespace",
    date: "2026-03-12",
    title: {
      en: "Typespace: typed words become a constellation",
      jp: "Typespace — 打った言葉が、星座になる",
    },
    lead: {
      en: "Type, and your words gather into a 3D constellation, then slowly return to the cosmos. No generative AI: every cluster, orbit and sound cue is authored in Next.js, React Three Fiber, GLSL and Web Audio.",
      jp: "言葉を打つと三次元の星座になり、やがて宇宙へ還っていく。生成 AI は使っていない。星団も軌道も音も、Next.js / React Three Fiber / GLSL / Web Audio で一つずつ作っている。",
    },
  },
];

export const SHOWCASE = [
  "werewolf",
  "koe-baku",
  "rakugaki-jam",
  "marubatsu",
  "emoji-blast",
  "kao-game",
  "resona",
  "typespace",
  "verizon-ai-workflow",
  "amazon-firetv",
  "xq",
  "coca-cola",
  "carnegie",
];
