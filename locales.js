const translations = {
  en: {
    name: "English",
    title: "TestID Highlighter",
    toggleLabel: "Highlight elements",
    addPlaceholder: "Add attribute...",
    addButton: "+",
    copied: "Copied!",
    copyHint: "Ctrl+C to copy",
    eyeEnabled: "Highlight enabled (click to disable)",
    eyeDisabled: "Highlight disabled (click to enable)",
    allowedPages: "Allowed pages",
    addCurrentPage: "Add current page",
    noAllowedPages: "No allowed pages",
    addManualPlaceholder: "*.example.com",
    urlAdded: "Page added",
    urlRemoved: "Page removed",
    attributesTitle: "Attributes"
  },
  ru: {
    name: "Русский",
    title: "Подсветка TestID",
    toggleLabel: "Подсвечивать элементы",
    addPlaceholder: "Добавить атрибут...",
    addButton: "+",
    copied: "Скопировано!",
    copyHint: "Ctrl+C скопировать",
    eyeEnabled: "Подсветка включена (клик для выключения)",
    eyeDisabled: "Подсветка выключена (клик для включения)",
    allowedPages: "Разрешённые страницы",
    addCurrentPage: "Добавить текущую",
    noAllowedPages: "Нет разрешённых страниц",
    addManualPlaceholder: "*.example.com",
    urlAdded: "Страница добавлена",
    urlRemoved: "Страница удалена",
    attributesTitle: "Атрибуты"
  },
  zh: {
    name: "中文",
    title: "TestID 高亮器",
    toggleLabel: "高亮元素",
    addPlaceholder: "添加属性...",
    addButton: "+",
    copied: "已复制!",
    copyHint: "Ctrl+C 复制",
    eyeEnabled: "高亮已启用 (点击禁用)",
    eyeDisabled: "高亮已禁用 (点击启用)",
    allowedPages: "允许的页面",
    addCurrentPage: "添加当前页面",
    noAllowedPages: "没有允许的页面",
    addManualPlaceholder: "*.example.com",
    urlAdded: "页面已添加",
    urlRemoved: "页面已删除",
    attributesTitle: "属性"
  }
};

function detectBrowserLanguage() {
  const lang = navigator.language || navigator.userLanguage;
  const code = lang.split('-')[0];
  return translations[code] ? code : 'en';
}