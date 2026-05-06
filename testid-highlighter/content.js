// Стандартные атрибуты автотестов
const DEFAULT_ATTRIBUTES = ['data-test-id', 'data-cy', 'data-qa', 'data-test', 'data-testid', 'data-hook', 'data-e2e'];

// Кэш состояния
let isEnabled = false;
let currentAttributes = [];
let currentTranslations = {
    copyHint: "Ctrl+C to copy",
    copied: "Copied!"
};

// Стиль для подсветки
const HIGHLIGHT_STYLE = `
    .testid-highlighter {
        outline: 1px solid rgba(255,0,0,0.4) !important;
        background-color: transparent !important;
    }
    .testid-highlighter:hover {
        outline: 2px solid #ff0000 !important;
        background-color: rgba(255,0,0,0.15) !important;
    }
    .testid-tooltip {
        position: fixed;
        z-index: 10000;
        background: #1a1a1a;
        color: #fff;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        pointer-events: none;
        white-space: nowrap;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .testid-tooltip .attr-name {
        color: #ff6b6b;
        font-weight: 500;
    }
    .testid-tooltip .attr-value {
        color: #fff;
    }
    .testid-tooltip .hint {
        color: #666;
        font-size: 10px;
        margin-left: 10px;
        border-left: 1px solid #444;
        padding-left: 10px;
    }
`;

// Вставляем стиль в документ
let styleElement = null;
function injectHighlightStyle() {
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.textContent = HIGHLIGHT_STYLE;
        document.head.appendChild(styleElement);
    }
}

function removeHighlightStyle() {
    if (styleElement) {
        styleElement.remove();
        styleElement = null;
    }
}

// Тултип
let tooltip = null;
let tooltipTarget = null;

function createTooltip() {
    if (tooltip) return;
    tooltip = document.createElement('div');
    tooltip.className = 'testid-tooltip';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);
}

function getAttributeInfo(element, attributes) {
    for (const attr of attributes) {
        const value = element.getAttribute(attr);
        if (value !== null) {
            return { name: attr, value: value };
        }
    }
    return null;
}

function showTooltip(element, x, y) {
    const attrInfo = getAttributeInfo(element, currentAttributes);
    if (!attrInfo) return;
    
    tooltip.innerHTML = `<span class="attr-name">${attrInfo.name}</span>=<span class="attr-value">"${attrInfo.value}"</span><span class="hint">${currentTranslations.copyHint}</span>`;
    tooltip.style.display = 'block';
    positionTooltip(x, y);
    tooltipTarget = element;
}

function hideTooltip() {
    tooltip.style.display = 'none';
    tooltipTarget = null;
}

function positionTooltip(x, y) {
    const padding = 15;
    const rect = tooltip.getBoundingClientRect();
    
    let posX = x + padding;
    let posY = y + padding;
    
    // Проверка правой границы
    if (posX + rect.width > window.innerWidth) {
        posX = x - rect.width - padding;
    }
    
    // Проверка нижней границы
    if (posY + rect.height > window.innerHeight) {
        posY = y - rect.height - padding;
    }
    
    // Проверка верхней границы
    if (posY < 0) {
        posY = padding;
    }
    
    // Проверка левой границы
    if (posX < 0) {
        posX = padding;
    }
    
    tooltip.style.left = posX + 'px';
    tooltip.style.top = posY + 'px';
}

// Debounce функция
function debounce(fn, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Подсветка элементов с указанными атрибутами
function highlightAttributes(attributes) {
    // Удаляем предыдущую подсветку
    document.querySelectorAll('.testid-highlighter').forEach(el => {
        el.classList.remove('testid-highlighter');
    });
    
    if (attributes.length === 0) return;
    
    injectHighlightStyle();
    
    // Находим элементы с любым из указанных атрибутов
    const selector = attributes.map(attr => `[${attr}]`).join(',');
    const elements = document.querySelectorAll(selector);
    
    elements.forEach(el => {
        el.classList.add('testid-highlighter');
    });
}

// Обновление подсветки с debounce 1000ms
const refreshHighlight = debounce(() => {
    if (isEnabled) {
        highlightAttributes(currentAttributes);
    }
}, 1000);

// Инициализация при загрузке страницы
function initialize() {
    chrome.storage.sync.get(['enabled', 'customAttributes'], (data) => {
        isEnabled = data.enabled || false;
        currentAttributes = data.customAttributes || DEFAULT_ATTRIBUTES;
        
        if (isEnabled) {
            highlightAttributes(currentAttributes);
        }
    });
}

// Обработчик сообщений от popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateHighlight') {
        isEnabled = request.enabled;
        if (isEnabled) {
            highlightAttributes(currentAttributes);
        } else {
            document.querySelectorAll('.testid-highlighter').forEach(el => {
                el.classList.remove('testid-highlighter');
            });
            removeHighlightStyle();
        }
    }
    
    if (request.action === 'updateAttributes') {
        currentAttributes = request.attributes;
        if (isEnabled) {
            highlightAttributes(currentAttributes);
        }
    }
    
    if (request.action === 'updateLanguage') {
        currentTranslations = request.translations;
    }
});

// MutationObserver для отслеживания изменений DOM
const observer = new MutationObserver(() => {
    refreshHighlight();
});

function startObserver() {
    observer.observe(document, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeOldValue: true
    });
}

// Обработка SPA навигации
function setupSPANavigation() {
    // Обработка popstate (кнопки назад/вперед)
    window.addEventListener('popstate', () => {
        setTimeout(refreshHighlight, 500);
    });
    
    // Перехват pushState
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
        originalPushState.apply(this, args);
        setTimeout(refreshHighlight, 500);
    };
    
    // Перехват replaceState
    const originalReplaceState = history.replaceState;
    history.replaceState = function(...args) {
        originalReplaceState.apply(this, args);
        setTimeout(refreshHighlight, 500);
    };
    
    // MutationObserver для SPA (отслеживание полной замены контента)
    const spaObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Проверяем, является ли это корневым контейнером приложения
                        if (node.id && (node.id.includes('app') || node.id.includes('root') || node.classList?.contains('app'))) {
                            setTimeout(refreshHighlight, 1000);
                        }
                    }
                });
            }
        });
    });
    
    // Также следим за удалением body - признак полной перезагрузки
    const bodyObserver = new MutationObserver(() => {
        if (document.body && document.body.childNodes.length === 0) {
            setTimeout(refreshHighlight, 1000);
        }
    });
    
    if (document.body) {
        bodyObserver.observe(document.body, { childList: true });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            bodyObserver.observe(document.body, { childList: true });
        });
    }
}

// Запускаем инициализацию
initialize();

// Создаём тултип
createTooltip();

// Обработчики событий для тултипа
document.addEventListener('mouseover', (e) => {
    if (!isEnabled) return;
    const target = e.target;
    if (target.classList.contains('testid-highlighter')) {
        showTooltip(target, e.clientX, e.clientY);
    }
});

document.addEventListener('mouseout', (e) => {
    const target = e.target;
    if (target.classList.contains('testid-highlighter')) {
        hideTooltip();
    }
});

document.addEventListener('mousemove', (e) => {
    if (tooltip && tooltip.style.display !== 'none' && tooltipTarget) {
        positionTooltip(e.clientX, e.clientY);
    }
});

// Копирование в буфер обмена
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'c' && tooltip && tooltip.style.display !== 'none') {
        const attrName = tooltip.querySelector('.attr-name');
        const attrValue = tooltip.querySelector('.attr-value');
        if (attrName && attrValue) {
            const textToCopy = attrName.textContent + '=' + attrValue.textContent;
            navigator.clipboard.writeText(textToCopy).then(() => {
                // Визуальная индикация копирования
                const hint = tooltip.querySelector('.hint');
                if (hint) {
                    hint.textContent = currentTranslations.copied;
                    hint.style.color = '#51cf66';
                    setTimeout(() => {
                        hint.textContent = currentTranslations.copyHint;
                        hint.style.color = '#666';
                    }, 1500);
                }
            });
        }
    }
});

// Запускаем observer и SPA обработку
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        startObserver();
        setupSPANavigation();
    });
} else {
    startObserver();
    setupSPANavigation();
}