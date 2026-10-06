const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "db.json");
const ONE_HOUR_MS = 60 * 60 * 1000;

function hashPassword(password) {
  return crypto.createHash("sha256").update(String(password)).digest("hex");
}

function nowIso() {
  return new Date().toISOString();
}

function uid(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function makeQuestions(prefix, rows) {
  return rows.map((row, index) => ({
    id: `${prefix}_${index + 1}`,
    question: row[0],
    options: row.slice(1, 5),
    answer: row[5]
  }));
}

const HTML_CSS_QUESTIONS = makeQuestions("hc", [
  ["HTML nimaning qisqartmasi?", "Hyper Text Markup Language", "High Text Machine Language", "Home Tool Markup Language", "Hyperlink Text Main Language", 0],
  ["HTML fayl kengaytmasi qaysi?", ".css", ".html", ".js", ".png", 1],
  ["Saytning ko'rinadigan qismi qaysi teg ichida yoziladi?", "<head>", "<body>", "<title>", "<meta>", 1],
  ["Sayt nomi brauzer yuqorisida qaysi teg orqali chiqadi?", "<title>", "<h1>", "<p>", "<main>", 0],
  ["Eng katta sarlavha tegi qaysi?", "<h1>", "<h6>", "<p>", "<span>", 0],
  ["Paragraf yozish uchun qaysi teg ishlatiladi?", "<p>", "<br>", "<hr>", "<a>", 0],
  ["Link yaratish uchun qaysi teg ishlatiladi?", "<link>", "<a>", "<url>", "<href>", 1],
  ["Link manzili qaysi atributga yoziladi?", "src", "href", "alt", "class", 1],
  ["Rasm chiqarish uchun qaysi teg ishlatiladi?", "<image>", "<img>", "<pic>", "<src>", 1],
  ["Rasm manzili qaysi atributga yoziladi?", "href", "src", "title", "id", 1],
  ["Rasm chiqmasa ko'rinadigan izoh qaysi atributga yoziladi?", "alt", "src", "href", "class", 0],
  ["Tugma yaratish uchun qaysi teg ishlatiladi?", "<button>", "<click>", "<btn>", "<submit>", 0],
  ["Matn kiritish maydoni qaysi teg bilan yaratiladi?", "<input>", "<text>", "<write>", "<field>", 0],
  ["Forma yaratish uchun qaysi teg ishlatiladi?", "<form>", "<input>", "<label>", "<button>", 0],
  ["Saytning yuqori qismi odatda nima deb ataladi?", "Header", "Footer", "Sidebar", "Card", 0],
  ["Saytning pastki qismi odatda nima deb ataladi?", "Header", "Footer", "Navbar", "Main", 1],
  ["Saytda menyu joylashgan qism nima deyiladi?", "Navbar", "Footer", "Article", "Aside", 0],
  ["Saytning asosiy kontenti qaysi teg ichida yozilishi mumkin?", "<main>", "<meta>", "<title>", "<link>", 0],
  ["Saytda alohida bo'lim yaratish uchun qaysi teg ishlatiladi?", "<section>", "<script>", "<style>", "<br>", 0],
  ["Saytda maqola yoki yangilik bloki uchun qaysi teg mos?", "<article>", "<title>", "<head>", "<meta>", 0],
  ["CSS nima uchun ishlatiladi?", "Sayt dizayni uchun", "Server yaratish uchun", "Ma'lumotlar bazasi uchun", "Video montaj uchun", 0],
  ["CSS fayl kengaytmasi qaysi?", ".html", ".css", ".js", ".docx", 1],
  ["HTMLga tashqi CSS ulash uchun qaysi teg ishlatiladi?", "<link>", "<script>", "<css>", "<style src=\"\">", 0],
  ["CSSda class selector qanday yoziladi?", ".box", "#box", "box", "*box", 0],
  ["CSSda id selector qanday yoziladi?", ".menu", "#menu", "menu", "$menu", 1],
  ["Matn rangini o'zgartirish xossasi qaysi?", "color", "font-color", "text-color", "paint", 0],
  ["Orqa fon rangini o'zgartirish xossasi qaysi?", "background-color", "color", "font-color", "bg-color", 0],
  ["Matn hajmini o'zgartirish xossasi qaysi?", "font-size", "text-size", "size", "font-width", 0],
  ["Matnni qalin qilish uchun qaysi xossa ishlatiladi?", "font-weight", "font-bold", "text-bold", "bold", 0],
  ["Ichki bo'shliq qaysi xossa bilan beriladi?", "padding", "margin", "border", "gap", 0],
  ["Tashqi bo'shliq qaysi xossa bilan beriladi?", "margin", "padding", "border", "outline", 0],
  ["Elementga chegara berish qaysi xossa bilan qilinadi?", "border", "line", "stroke", "outline-color", 0],
  ["Element burchagini yumaloqlash qaysi xossa bilan qilinadi?", "border-radius", "border-round", "radius-border", "round", 0],
  ["Element enini belgilash xossasi qaysi?", "width", "height", "size", "length", 0],
  ["Element balandligini belgilash xossasi qaysi?", "height", "width", "top", "bottom", 0],
  ["box-sizing: border-box; nima qiladi?", "Element biz bergan width/height masofasidan chiqib ketmaydi", "Elementni yashiradi", "Matnni markazga qo'yadi", "Fon rangini o'zgartiradi", 0],
  ["Elementlarni yonma-yon joylash uchun qaysi CSS qulay?", "Flexbox", "Alert", "Prompt", "Console", 0],
  ["Flexbox yoqish uchun qaysi kod yoziladi?", "display: flex;", "display: block;", "position: flex;", "flex: display;", 0],
  ["Grid layout yoqish uchun qaysi kod yoziladi?", "display: grid;", "grid: true;", "layout: grid;", "position: grid;", 0],
  ["Flexda elementlarni gorizontal markazlash qaysi xossa?", "justify-content", "align-items", "text-align", "font-align", 0],
  ["Flexda elementlarni vertikal markazlash qaysi xossa?", "align-items", "justify-content", "text-align", "place-text", 0],
  ["Matnni markazga joylash uchun qaysi CSS yoziladi?", "text-align: center;", "align: center;", "font-center: true;", "center: text;", 0],
  ["Elementni yashirish uchun qaysi kod ishlatiladi?", "display: none;", "show: false;", "hidden: yes;", "opacity: full;", 0],
  ["position: absolute; nima uchun ishlatiladi?", "Elementni aniq joyga qo'yish uchun", "Matn rangini o'zgartirish uchun", "Rasm qo'shish uchun", "Font tanlash uchun", 0],
  ["z-index nima uchun ishlatiladi?", "Elementlarning ustma-ust tartibini belgilash", "Rang berish", "Matn kattalashtirish", "Link yaratish", 0],
  [":hover nima?", "Sichqoncha element ustiga borgandagi holat", "Sahifa ochilgandagi holat", "Forma yuborilgandagi holat", "Rasm yuklangandagi holat", 0],
  ["Responsive dizayn nima?", "Sayt ekran o'lchamiga moslashishi", "Faqat kompyuterda ishlashi", "Faqat rasmli sayt", "Faqat oq-qora dizayn", 0],
  ["Media query qaysi kod bilan yoziladi?", "@media", "@screen", "@mobile", "@responsive", 0],
  ["Saytda kartochka dizayni qilish uchun ko'p ishlatiladigan teg qaysi?", "<div>", "<title>", "<meta>", "<html>", 0],
  ["Bir xil dizaynni ko'p elementga berish uchun nima qulay?", "Class", "ID faqat bitta", "<br>", "<hr>", 0]
]);

const WORD_EXCEL_QUESTIONS = makeQuestions("we", [
  ["Microsoft Word nima uchun ishlatiladi?", "Matnli hujjat yaratish", "Video montaj", "Kod yozish", "Antivirus", 0],
  ["Microsoft Excel nima uchun ishlatiladi?", "Jadval va hisob-kitob", "Rasm chizish", "Audio yozish", "Brauzer", 0],
  ["Word fayl kengaytmasi odatda qaysi?", ".docx", ".xlsx", ".pptx", ".mp4", 0],
  ["Excel fayl kengaytmasi odatda qaysi?", ".docx", ".xlsx", ".jpg", ".html", 1],
  ["Wordda yangi hujjat ochish kombinatsiyasi qaysi?", "Ctrl+N", "Ctrl+S", "Ctrl+P", "Ctrl+Z", 0],
  ["Wordda hujjatni saqlash kombinatsiyasi qaysi?", "Ctrl+A", "Ctrl+S", "Ctrl+F", "Ctrl+X", 1],
  ["Wordda chop etish oynasini ochish qaysi?", "Ctrl+P", "Ctrl+C", "Ctrl+B", "Ctrl+I", 0],
  ["Wordda barcha matnni belgilash qaysi?", "Ctrl+A", "Ctrl+V", "Ctrl+Y", "Ctrl+H", 0],
  ["Wordda nusxa olish qaysi kombinatsiya?", "Ctrl+C", "Ctrl+X", "Ctrl+Z", "Ctrl+P", 0],
  ["Wordda joylashtirish qaysi kombinatsiya?", "Ctrl+V", "Ctrl+B", "Ctrl+F", "Ctrl+L", 0],
  ["Wordda matnni qalin qilish tugmasi qaysi?", "B", "I", "U", "S", 0],
  ["Wordda matnni qiya qilish tugmasi qaysi?", "B", "I", "U", "A", 1],
  ["Wordda matn tagiga chiziq qo'yish tugmasi qaysi?", "B", "I", "U", "X", 2],
  ["Wordda matnni markazga joylash qaysi buyruq?", "Align Left", "Center", "Justify", "Sort", 1],
  ["Wordda matnni chapga tekislash qaysi?", "Align Left", "Align Right", "Center", "Bold", 0],
  ["Wordda matnni o'ngga tekislash qaysi?", "Align Left", "Center", "Align Right", "Underline", 2],
  ["Wordda satrlar oralig'i qaysi buyruq bilan o'zgartiriladi?", "Line Spacing", "Font Color", "Page Color", "Insert Table", 0],
  ["Wordda shrift o'lchami qaysi bo'limdan o'zgartiriladi?", "Font Size", "Paragraph", "Styles", "View", 0],
  ["Wordda matn rangini o'zgartirish buyrug'i qaysi?", "Font Color", "Page Layout", "Review", "Zoom", 0],
  ["Wordda jadval qo'shish qaysi menyudan bajariladi?", "Insert", "Review", "View", "File", 0],
  ["Wordda rasm qo'shish uchun qaysi menyu ishlatiladi?", "Insert", "Home", "View", "References", 0],
  ["Wordda sahifa yo'nalishini o'zgartirish qaysi bo'limda?", "Layout", "Review", "Mailings", "Insert", 0],
  ["Wordda sahifa chetlarini sozlash nima deyiladi?", "Margins", "Columns", "Header", "Footer", 0],
  ["Wordda yuqori qismga yozuv qo'yish nima deyiladi?", "Header", "Footer", "Footnote", "Caption", 0],
  ["Wordda pastki qismga yozuv qo'yish nima deyiladi?", "Header", "Footer", "Title", "Table", 1],
  ["Excelda katak nima deyiladi?", "Cell", "Slide", "Page", "Paragraph", 0],
  ["Excelda qatorlar nima bilan belgilanadi?", "Raqamlar", "Harflar", "Ranglar", "Belgilar", 0],
  ["Excelda ustunlar nima bilan belgilanadi?", "Raqamlar", "Harflar", "Nuqtalar", "Formulalar", 1],
  ["Excelda A1 nimani bildiradi?", "Katak manzili", "Fayl nomi", "Formula nomi", "Sahifa nomi", 0],
  ["Excelda formula qaysi belgi bilan boshlanadi?", "=", "+", "#", "@", 0],
  ["Excelda yig'indi hisoblash funksiyasi qaysi?", "SUM", "AVERAGE", "MIN", "COUNT", 0],
  ["Excelda o'rtacha qiymat funksiyasi qaysi?", "SUM", "AVERAGE", "MAX", "IF", 1],
  ["Excelda eng katta qiymatni topish funksiyasi qaysi?", "MAX", "MIN", "SUM", "ROUND", 0],
  ["Excelda eng kichik qiymatni topish funksiyasi qaysi?", "MAX", "MIN", "COUNT", "IF", 1],
  ["Excelda sonlar sonini sanash funksiyasi qaysi?", "COUNT", "SUM", "LEFT", "LEN", 0],
  ["Excelda shart tekshirish funksiyasi qaysi?", "IF", "SUM", "MAX", "MIN", 0],
  ["Excelda =SUM(A1:A5) nimani hisoblaydi?", "A1 dan A5 gacha yig'indi", "Faqat A1", "Faqat A5", "Matn uzunligi", 0],
  ["Excelda =AVERAGE(B1:B10) nimani hisoblaydi?", "O'rtacha qiymat", "Eng katta qiymat", "Eng kichik qiymat", "Katak rangi", 0],
  ["Excelda =MAX(C1:C7) nimani topadi?", "Eng katta qiymat", "Eng kichik qiymat", "Yig'indi", "Matn", 0],
  ["Excelda =MIN(D1:D8) nimani topadi?", "Eng kichik qiymat", "Eng katta qiymat", "O'rtacha", "Foiz", 0],
  ["Excelda jadvalni tartiblash buyrug'i nima?", "Sort", "Filter", "Bold", "Merge", 0],
  ["Excelda ma'lumotlarni ajratib ko'rsatish uchun qaysi buyruq ishlatiladi?", "Filter", "Header", "Footer", "Design", 0],
  ["Excelda bir nechta katakni birlashtirish buyrug'i qaysi?", "Merge Cells", "Split Cells", "Delete Sheet", "Print", 0],
  ["Excelda ish varag'i nima deyiladi?", "Worksheet", "Document", "Slide", "Paragraph", 0],
  ["Excelda yangi varaq qo'shish uchun odatda qaysi belgi bosiladi?", "+", "-", "=", "#", 0],
  ["Excelda ustun enini o'zgartirish uchun nima qilinadi?", "Ustun chegarasi tortiladi", "Fayl o'chiriladi", "Formula yoziladi", "Rang tanlanadi", 0],
  ["Excelda diagramma qo'shish qaysi menyuda?", "Insert", "Home", "Review", "View", 0],
  ["Excelda katak ichidagi matnni yangi qatorga o'tkazish buyrug'i qaysi?", "Wrap Text", "Merge Cells", "Sort", "Filter", 0],
  ["Excelda Ctrl + Z nima qiladi?", "Oxirgi amalni bekor qiladi", "Faylni saqlaydi", "Chop etadi", "Formula yozadi", 0],
  ["Excelda Ctrl + S nima qiladi?", "Faylni saqlaydi", "Jadvalni o'chiradi", "Katakni bo'yaydi", "Diagramma qo'shadi", 0]
]);

const WORD_EXCEL_POWERPOINT_QUESTIONS = makeQuestions("wep", [
  ["Microsoft Office paketiga qaysi dasturlar kiradi?", "Word, Excel, PowerPoint", "Chrome, Paint, Telegram", "Photoshop, Premiere, After Effects", "Windows, Android, iOS", 0],
  ["Word dasturi asosan nima uchun ishlatiladi?", "Matnli hujjat yaratish", "Jadval hisoblash", "Slayd tayyorlash", "Video montaj", 0],
  ["Excel dasturi asosan nima uchun ishlatiladi?", "Jadval va hisob-kitob qilish", "Matn tahrirlash", "Taqdimot ko'rsatish", "Audio yozish", 0],
  ["PowerPoint dasturi nima uchun ishlatiladi?", "Taqdimot va slayd yaratish", "Kod yozish", "Antivirus o'rnatish", "Brauzer ochish", 0],
  ["Word fayl kengaytmasi qaysi?", ".docx", ".xlsx", ".pptx", ".jpg", 0],
  ["Excel fayl kengaytmasi qaysi?", ".xlsx", ".docx", ".pptx", ".mp3", 0],
  ["PowerPoint fayl kengaytmasi qaysi?", ".pptx", ".docx", ".xlsx", ".png", 0],
  ["Wordda hujjatni saqlash kombinatsiyasi qaysi?", "Ctrl+S", "Ctrl+P", "Ctrl+C", "Ctrl+V", 0],
  ["Wordda hujjatni chop etish kombinatsiyasi qaysi?", "Ctrl+P", "Ctrl+S", "Ctrl+Z", "Ctrl+A", 0],
  ["Wordda barcha matnni belgilash qaysi?", "Ctrl+A", "Ctrl+N", "Ctrl+F", "Ctrl+H", 0],
  ["Wordda matnni qalin qilish tugmasi qaysi?", "Bold", "Italic", "Underline", "Center", 0],
  ["Wordda matnni qiya qilish tugmasi qaysi?", "Italic", "Bold", "Underline", "Save", 0],
  ["Wordda matn tagiga chiziq qo'yish tugmasi qaysi?", "Underline", "Bold", "Italic", "Sort", 0],
  ["Wordda jadval qo'shish qaysi menyudan bajariladi?", "Insert", "Review", "View", "File", 0],
  ["Wordda sahifa chetlarini sozlash nima deyiladi?", "Margins", "Slides", "Cells", "Themes", 0],
  ["Wordda yuqori qismga yozuv qo'yish nima deyiladi?", "Header", "Footer", "Formula", "Chart", 0],
  ["Wordda pastki qismga yozuv qo'yish nima deyiladi?", "Footer", "Header", "Slide", "Cell", 0],
  ["Excelda katak nima deyiladi?", "Cell", "Slide", "Page", "Paragraph", 0],
  ["Excelda qatorlar nima bilan belgilanadi?", "Raqamlar", "Harflar", "Ranglar", "Belgilar", 0],
  ["Excelda ustunlar nima bilan belgilanadi?", "Harflar", "Raqamlar", "Nuqtalar", "Belgilar", 0],
  ["Excelda A1 nimani bildiradi?", "Katak manzili", "Fayl nomi", "Sahifa rangi", "Slayd raqami", 0],
  ["Excelda formula qaysi belgi bilan boshlanadi?", "=", "+", "#", "@", 0],
  ["Excelda yig'indi hisoblash funksiyasi qaysi?", "SUM", "AVERAGE", "MAX", "MIN", 0],
  ["Excelda o'rtacha qiymat funksiyasi qaysi?", "AVERAGE", "SUM", "COUNT", "IF", 0],
  ["Excelda eng katta qiymatni topish funksiyasi qaysi?", "MAX", "MIN", "SUM", "LEFT", 0],
  ["Excelda eng kichik qiymatni topish funksiyasi qaysi?", "MIN", "MAX", "COUNT", "RIGHT", 0],
  ["Excelda shart tekshirish funksiyasi qaysi?", "IF", "SUM", "MAX", "MIN", 0],
  ["Excelda =SUM(A1:A5) nimani hisoblaydi?", "A1 dan A5 gacha yig'indi", "Faqat A1 ni", "Faqat A5 ni", "Matn rangini", 0],
  ["Excelda jadvalni tartiblash buyrug'i nima?", "Sort", "Filter", "Merge", "Wrap", 0],
  ["Excelda ma'lumotlarni tanlab ko'rsatish buyrug'i qaysi?", "Filter", "Sort", "Header", "Footer", 0],
  ["Excelda bir nechta katakni birlashtirish buyrug'i qaysi?", "Merge Cells", "Split Text", "Delete File", "Print", 0],
  ["Excelda diagramma qo'shish qaysi menyuda?", "Insert", "Home", "Review", "View", 0],
  ["Excelda katak ichidagi matnni qatorga moslash buyrug'i qaysi?", "Wrap Text", "Merge Cells", "Sort", "Filter", 0],
  ["PowerPointda bitta sahifa nima deb ataladi?", "Slide", "Sheet", "Cell", "Paragraph", 0],
  ["PowerPointda yangi slayd qo'shish buyrug'i qaysi?", "New Slide", "New Cell", "New Sheet", "New Formula", 0],
  ["PowerPointda taqdimotni boshlash uchun ko'p ishlatiladigan tugma qaysi?", "F5", "F2", "F7", "F12", 0],
  ["PowerPointda slayd dizaynini tez o'zgartirish uchun nima ishlatiladi?", "Themes", "Formulas", "Margins", "Cells", 0],
  ["PowerPointda slayddan slaydga o'tish effekti nima deyiladi?", "Transition", "Formula", "Header", "Filter", 0],
  ["PowerPointda obyektga harakat effekti berish nima deyiladi?", "Animation", "Merge", "Sort", "Wrap", 0],
  ["PowerPointda rasm qo'shish qaysi menyudan bajariladi?", "Insert", "Review", "File", "View", 0],
  ["PowerPointda matn yozish maydoni nima deyiladi?", "Text Box", "Cell", "Formula Bar", "Worksheet", 0],
  ["PowerPointda slayd tartibini o'zgartirish qaysi panelda qulay?", "Chapdagi slaydlar panelida", "Formula barida", "Status barda", "Name boxda", 0],
  ["PowerPointda tayyor slayd ko'rinishlari nima deyiladi?", "Layout", "Cell", "Range", "Table", 0],
  ["Word, Excel va PowerPointda fayl ochish kombinatsiyasi qaysi?", "Ctrl+O", "Ctrl+S", "Ctrl+P", "Ctrl+B", 0],
  ["Word, Excel va PowerPointda bekor qilish kombinatsiyasi qaysi?", "Ctrl+Z", "Ctrl+Y", "Ctrl+F", "Ctrl+L", 0],
  ["Word, Excel va PowerPointda qayta bajarish kombinatsiyasi qaysi?", "Ctrl+Y", "Ctrl+Z", "Ctrl+A", "Ctrl+X", 0],
  ["Word, Excel va PowerPointda nusxa olish kombinatsiyasi qaysi?", "Ctrl+C", "Ctrl+V", "Ctrl+X", "Ctrl+P", 0],
  ["Word, Excel va PowerPointda joylashtirish kombinatsiyasi qaysi?", "Ctrl+V", "Ctrl+C", "Ctrl+Z", "Ctrl+S", 0],
  ["Word, Excel va PowerPointda qidirish kombinatsiyasi qaysi?", "Ctrl+F", "Ctrl+P", "Ctrl+B", "Ctrl+I", 0],
  ["Word, Excel va PowerPointda yangi fayl yaratish kombinatsiyasi qaysi?", "Ctrl+N", "Ctrl+S", "Ctrl+O", "Ctrl+H", 0]
]);

function normalizeTests(db) {
  let changed = false;
  const updates = {
    "html-css": HTML_CSS_QUESTIONS,
    "word-excel": WORD_EXCEL_QUESTIONS,
    "word-excel-powerpoint": WORD_EXCEL_POWERPOINT_QUESTIONS
  };
  for (const test of db.tests || []) {
    const fixedQuestions = updates[test.id];
    if (fixedQuestions && JSON.stringify(test.questions || []) !== JSON.stringify(fixedQuestions)) {
      test.questions = fixedQuestions;
      changed = true;
    }
  }
  return changed;
}

function seedDatabase() {
  const database = {
    students: [
      {
        id: "stu_001",
        fullName: "Ali Valiyev",
        group: "HTML-01",
        login: "ali",
        passwordHash: hashPassword("123456"),
        createdAt: nowIso()
      },
      {
        id: "stu_002",
        fullName: "Madina Karimova",
        group: "Office-01",
        login: "madina",
        passwordHash: hashPassword("123456"),
        createdAt: nowIso()
      },
      {
        id: "stu_003",
        fullName: "Jasur Sobirov",
        group: "IT-02",
        login: "jasur",
        passwordHash: hashPassword("123456"),
        createdAt: nowIso()
      }
    ],
    tests: [
      {
        id: "html-css",
        title: "HTML CSS",
        durationMinutes: 60,
        description: "HTML teglari, CSS selectorlari, box model va layout bo'yicha test.",
        questions: [
          {
            id: "hc_1",
            question: "HTML hujjatidagi eng asosiy sarlavha qaysi teg bilan yoziladi?",
            options: ["<h1>", "<head>", "<title>", "<main>"],
            answer: 0
          },
          {
            id: "hc_2",
            question: "CSS da elementning ichki bo'shligini qaysi xossa belgilaydi?",
            options: ["margin", "padding", "border", "display"],
            answer: 1
          },
          {
            id: "hc_3",
            question: "Flexbox yoqish uchun qaysi qiymat ishlatiladi?",
            options: ["display: grid", "display: block", "display: flex", "position: flex"],
            answer: 2
          },
          {
            id: "hc_4",
            question: "HTML da link yaratish tegi qaysi?",
            options: ["<img>", "<a>", "<link>", "<url>"],
            answer: 1
          },
          {
            id: "hc_5",
            question: "CSS class selector qanday yoziladi?",
            options: ["#menu", ".menu", "menu", "*menu"],
            answer: 1
          },
          {
            id: "hc_6",
            question: "Rasm chiqarish uchun qaysi teg ishlatiladi?",
            options: ["<image>", "<pic>", "<img>", "<src>"],
            answer: 2
          },
          {
            id: "hc_7",
            question: "CSS da matn rangini qaysi xossa o'zgartiradi?",
            options: ["font-color", "text-style", "color", "background"],
            answer: 2
          },
          {
            id: "hc_8",
            question: "Formadagi matn kiritish maydoni qaysi teg orqali yaratiladi?",
            options: ["<input>", "<form-text>", "<textarea-only>", "<write>"],
            answer: 0
          },
          {
            id: "hc_9",
            question: "CSS Grid yoqish uchun qaysi qiymat to'g'ri?",
            options: ["display: grid", "grid: true", "layout: grid", "position: grid"],
            answer: 0
          },
          {
            id: "hc_10",
            question: "HTML da tartiblangan ro'yxat qaysi teg bilan yoziladi?",
            options: ["<ul>", "<ol>", "<li>", "<list>"],
            answer: 1
          }
        ]
      },
      {
        id: "word-excel",
        title: "Word Excel",
        durationMinutes: 60,
        description: "Microsoft Word va Excel asoslari bo'yicha test.",
        questions: [
          {
            id: "we_1",
            question: "Word dasturida matnni qalin qilish uchun qaysi tugma ishlatiladi?",
            options: ["Italic", "Bold", "Underline", "Align"],
            answer: 1
          },
          {
            id: "we_2",
            question: "Excelda formula qaysi belgi bilan boshlanadi?",
            options: ["+", "=", "#", "$"],
            answer: 1
          },
          {
            id: "we_3",
            question: "Excelda yig'indini hisoblash funksiyasi qaysi?",
            options: ["SUM", "AVG", "COUNT", "IF"],
            answer: 0
          },
          {
            id: "we_4",
            question: "Word hujjatini saqlash uchun odatda qaysi kombinatsiya ishlatiladi?",
            options: ["Ctrl + S", "Ctrl + P", "Ctrl + C", "Ctrl + Z"],
            answer: 0
          },
          {
            id: "we_5",
            question: "Excelda katak manzili qaysi ko'rinishda bo'ladi?",
            options: ["1A", "A1", "A-1", "1-A"],
            answer: 1
          },
          {
            id: "we_6",
            question: "Wordda sahifa yo'nalishini o'zgartirish bo'limi qaysi?",
            options: ["Layout", "Review", "View", "Mailings"],
            answer: 0
          },
          {
            id: "we_7",
            question: "Excelda o'rtacha qiymat funksiyasi qaysi?",
            options: ["SUM", "AVERAGE", "MAX", "MIN"],
            answer: 1
          },
          {
            id: "we_8",
            question: "Wordda jadval qo'shish uchun qaysi menyu ishlatiladi?",
            options: ["Insert", "Design", "References", "View"],
            answer: 0
          },
          {
            id: "we_9",
            question: "Excelda eng katta qiymatni topish funksiyasi qaysi?",
            options: ["MIN", "MAX", "COUNT", "LEN"],
            answer: 1
          },
          {
            id: "we_10",
            question: "Wordda chop etish oynasini ochish kombinatsiyasi qaysi?",
            options: ["Ctrl + P", "Ctrl + B", "Ctrl + X", "Ctrl + F"],
            answer: 0
          }
        ]
      },
      {
        id: "word-excel-powerpoint",
        title: "Word Excel PowerPoint",
        durationMinutes: 60,
        description: "Office dasturlari: Word, Excel va PowerPoint bo'yicha test.",
        questions: [
          {
            id: "wep_1",
            question: "PowerPoint dasturida bitta sahifa nima deb ataladi?",
            options: ["Sheet", "Slide", "Page", "Cell"],
            answer: 1
          },
          {
            id: "wep_2",
            question: "Excelda kataklar to'plami nima deb ataladi?",
            options: ["Range", "Slide", "Paragraph", "Theme"],
            answer: 0
          },
          {
            id: "wep_3",
            question: "Wordda matn ostiga chiziq qo'yish buyrug'i qaysi?",
            options: ["Bold", "Italic", "Underline", "Strike"],
            answer: 2
          },
          {
            id: "wep_4",
            question: "PowerPointda slayd dizaynini tez o'zgartirish uchun nima ishlatiladi?",
            options: ["Themes", "Formulas", "Margins", "Cells"],
            answer: 0
          },
          {
            id: "wep_5",
            question: "Excelda shart tekshirish funksiyasi qaysi?",
            options: ["IF", "SUM", "PRINT", "SAVE"],
            answer: 0
          },
          {
            id: "wep_6",
            question: "Wordda matnni markazga joylash buyrug'i qaysi?",
            options: ["Align Left", "Center", "Justify", "Sort"],
            answer: 1
          },
          {
            id: "wep_7",
            question: "PowerPoint taqdimotni boshlash uchun qaysi tugma ko'p ishlatiladi?",
            options: ["F5", "F2", "F7", "F12"],
            answer: 0
          },
          {
            id: "wep_8",
            question: "Excelda sonlarni tartiblash buyrug'i nima?",
            options: ["Sort", "Slide", "Bold", "Crop"],
            answer: 0
          },
          {
            id: "wep_9",
            question: "Word, Excel, PowerPoint qaysi paketga kiradi?",
            options: ["Microsoft Office", "Adobe Cloud", "Windows Paint", "Telegram"],
            answer: 0
          },
          {
            id: "wep_10",
            question: "PowerPointda slayddan slaydga o'tish effekti nima deyiladi?",
            options: ["Transition", "Formula", "Header", "Cell style"],
            answer: 0
          }
        ]
      }
    ],
    attempts: []
  };
  normalizeTests(database);
  return database;
}

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(seedDatabase(), null, 2), "utf8");
  } else {
    const db = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    if (normalizeTests(db)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
    }
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeDb(db) {
  ensureDb();
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
}

function publicTest(test) {
  return {
    id: test.id,
    title: test.title,
    durationMinutes: test.durationMinutes,
    description: test.description,
    questionCount: test.questions.length
  };
}

function publicQuestion(question) {
  return {
    id: question.id,
    question: question.question,
    options: question.options
  };
}

function scoreAttempt(test, answers) {
  let correct = 0;
  const detail = test.questions.map((question) => {
    const selected = answers[question.id];
    const isCorrect = Number(selected) === question.answer;
    if (isCorrect) correct += 1;
    return {
      questionId: question.id,
      selected: selected === undefined ? null : Number(selected),
      correctAnswer: question.answer,
      isCorrect
    };
  });

  return {
    correct,
    wrong: test.questions.length - correct,
    percent: Math.round((correct / test.questions.length) * 10000) / 100,
    detail
  };
}

function getAttemptStatus(attempt) {
  if (!attempt) return "not_started";
  if (attempt.status === "finished") return "finished";
  const expiresAt = new Date(attempt.expiresAt).getTime();
  if (Date.now() > expiresAt) return "expired";
  return "in_progress";
}

function finishExpiredAttempts(db) {
  let changed = false;
  for (const attempt of db.attempts) {
    if (attempt.status !== "finished" && Date.now() > new Date(attempt.expiresAt).getTime()) {
      const test = db.tests.find((item) => item.id === attempt.testId);
      const result = scoreAttempt(test, attempt.answers || {});
      attempt.status = "finished";
      attempt.finishedAt = attempt.expiresAt;
      attempt.correct = result.correct;
      attempt.wrong = result.wrong;
      attempt.percent = result.percent;
      attempt.detail = result.detail;
      attempt.autoFinished = true;
      changed = true;
    }
  }
  if (changed) writeDb(db);
}

module.exports = {
  ONE_HOUR_MS,
  DATA_FILE,
  hashPassword,
  nowIso,
  uid,
  readDb,
  writeDb,
  publicTest,
  publicQuestion,
  scoreAttempt,
  getAttemptStatus,
  finishExpiredAttempts
};
