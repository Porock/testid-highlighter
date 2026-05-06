const translations = {
  en: {
    name: "English",
    title: "TestID Highlighter",
    toggleLabel: "Highlight elements",
    addPlaceholder: "Add attribute...",
    addButton: "+",
    copied: "Copied!",
    copyHint: "Ctrl+C to copy"
  },
  ru: {
    name: "Русский",
    title: "Подсветка TestID",
    toggleLabel: "Подсвечивать элементы",
    addPlaceholder: "Добавить атрибут...",
    addButton: "+",
    copied: "Скопировано!",
    copyHint: "Ctrl+C скопировать"
  },
  zh: {
    name: "中文",
    title: "TestID 高亮器",
    toggleLabel: "高亮元素",
    addPlaceholder: "添加属性...",
    addButton: "+",
    copied: "已复制!",
    copyHint: "Ctrl+C 复制"
  }
};

function detectBrowserLanguage() {
  const lang = navigator.language || navigator.userLanguage;
  const code = lang.split('-')[0];
  return translations[code] ? code : 'en';
}