const DEFAULT_ATTRIBUTES = ['data-test-id', 'data-cy', 'data-qa', 'data-test', 'data-testid', 'data-hook', 'data-e2e'];

let currentLanguage = 'en';
let currentAttributes = [...DEFAULT_ATTRIBUTES];
let draggedIndex = null;

function t(key) {
    return translations[currentLanguage]?.[key] || translations['en'][key] || key;
}

function updateTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });
    
    const newAttrInput = document.getElementById('new-attribute');
    const addButton = document.getElementById('add-btn');
    if (newAttrInput) newAttrInput.placeholder = t('addPlaceholder');
    if (addButton) addButton.textContent = t('addButton');
}

function initLanguageSelect() {
    const select = document.getElementById('language-select');
    Object.keys(translations).forEach(code => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = translations[code].name;
        select.appendChild(option);
    });
    
    select.value = currentLanguage;
    
    select.addEventListener('change', (e) => {
        currentLanguage = e.target.value;
        chrome.storage.local.set({ language: currentLanguage });
        updateTranslations();
        notifyContentScript();
    });
}

function notifyContentScript() {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { 
                action: 'updateLanguage', 
                language: currentLanguage,
                translations: {
                    copyHint: t('copyHint'),
                    copied: t('copied')
                }
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('toggle-highlight');
    const attributesList = document.getElementById('attributes-list');
    const newAttributeInput = document.getElementById('new-attribute');
    const addBtn = document.getElementById('add-btn');
    const languageSelect = document.getElementById('language-select');
    
    function renderAttributes() {
        attributesList.innerHTML = '';
        currentAttributes.forEach((attr, index) => {
            const li = document.createElement('li');
            li.className = 'attribute-item';
            li.draggable = true;
            li.dataset.index = index;
            li.innerHTML = `
                <span class="drag-handle">⋮⋮</span>
                <span class="attr-name">${attr}</span>
                <button class="remove-btn" data-index="${index}">✕</button>
            `;
            attributesList.appendChild(li);
        });
        
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                currentAttributes.splice(index, 1);
                saveAndUpdate();
            });
        });
        
        // Drag and drop handlers
        document.querySelectorAll('.attribute-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                draggedIndex = parseInt(e.target.dataset.index);
                e.target.classList.add('dragging');
            });
            
            item.addEventListener('dragend', (e) => {
                e.target.classList.remove('dragging');
                document.querySelectorAll('.attribute-item').forEach(el => el.classList.remove('drag-over'));
                draggedIndex = null;
            });
            
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
            });
            
            item.addEventListener('dragenter', (e) => {
                e.preventDefault();
                e.target.closest('.attribute-item').classList.add('drag-over');
            });
            
            item.addEventListener('dragleave', (e) => {
                e.target.closest('.attribute-item').classList.remove('drag-over');
            });
            
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                const dropTarget = e.target.closest('.attribute-item');
                if (!dropTarget) return;
                
                const dropIndex = parseInt(dropTarget.dataset.index);
                
                if (draggedIndex !== null && draggedIndex !== dropIndex) {
                    const [removed] = currentAttributes.splice(draggedIndex, 1);
                    currentAttributes.splice(dropIndex, 0, removed);
                    saveAndUpdate();
                }
                
                dropTarget.classList.remove('drag-over');
            });
        });
    }
    
    function saveAndUpdate() {
        console.log('Saving attributes:', currentAttributes);
        // Сохраняем в storage
        chrome.storage.local.set({ customAttributes: currentAttributes }, () => {
            console.log('Attributes saved to storage');
            renderAttributes();
            
            // Уведомляем content script
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { 
                        action: 'updateAttributes', 
                        attributes: currentAttributes 
                    });
                }
            });
        });
    }
    
    function loadSettings() {
        // Показываем текущие атрибуты сразу (будут дефолтные при первом запуске)
        renderAttributes();
        
        chrome.storage.local.get(['enabled', 'customAttributes', 'language'], (data) => {
            console.log('Storage data loaded:', data);
            toggle.checked = data.enabled !== false;
            
            // Используем сохранённые атрибуты, если они есть (проверяем через Array.isArray)
            if (Array.isArray(data.customAttributes)) {
                console.log('Using saved attributes:', data.customAttributes);
                currentAttributes = data.customAttributes;
            } else {
                console.log('No saved attributes found, using defaults');
            }
            
            currentLanguage = data.language || detectBrowserLanguage();
            
            initLanguageSelect();
            updateTranslations();
            renderAttributes();
            notifyContentScript();
        });
    }
    
    loadSettings();
    
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync') {
            if (changes.enabled) {
                toggle.checked = changes.enabled.newValue;
            }
            if (changes.customAttributes) {
                currentAttributes = changes.customAttributes.newValue || DEFAULT_ATTRIBUTES;
                renderAttributes();
            }
            if (changes.language) {
                currentLanguage = changes.language.newValue;
                if (languageSelect) {
                    languageSelect.value = currentLanguage;
                }
                updateTranslations();
            }
        }
    });
    
    toggle.addEventListener('change', () => {
        const enabled = toggle.checked;
        
        // Сначала сохраняем
        chrome.storage.local.set({ enabled }, () => {
            // Затем отправляем сообщение с актуальными атрибутами
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { 
                        action: 'updateHighlight', 
                        enabled,
                        attributes: currentAttributes
                    });
                }
            });
        });
    });
    
    addBtn.addEventListener('click', () => {
        console.log('Add button clicked');
        const newAttr = newAttributeInput.value.trim();
        console.log('Input value:', newAttr);
        if (newAttr && !currentAttributes.includes(newAttr)) {
            currentAttributes.push(newAttr);
            newAttributeInput.value = '';
            saveAndUpdate();
        }
    });
    
    newAttributeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addBtn.click();
        }
    });
});