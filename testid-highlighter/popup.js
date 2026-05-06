const DEFAULT_ATTRIBUTES = ['data-test-id', 'data-cy', 'data-qa', 'data-test', 'data-testid', 'data-hook', 'data-e2e'];

let currentLanguage = 'en';
let currentAttributes = [];

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
    
    newAttributeInput.placeholder = t('addPlaceholder');
    addBtn.textContent = t('addButton');
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
        chrome.storage.sync.set({ language: currentLanguage });
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
            li.innerHTML = `
                <span>${attr}</span>
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
    }
    
    function saveAndUpdate() {
        chrome.storage.sync.set({ customAttributes: currentAttributes });
        renderAttributes();
        
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { 
                    action: 'updateAttributes', 
                    attributes: currentAttributes 
                });
            }
        });
    }
    
    function loadSettings() {
        chrome.storage.sync.get(['enabled', 'customAttributes', 'language'], (data) => {
            toggle.checked = data.enabled !== false;
            currentAttributes = data.customAttributes || DEFAULT_ATTRIBUTES;
            
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
                languageSelect.value = currentLanguage;
                updateTranslations();
            }
        }
    });
    
    toggle.addEventListener('change', () => {
        const enabled = toggle.checked;
        chrome.storage.sync.set({ enabled });
        
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { 
                    action: 'updateHighlight', 
                    enabled 
                });
            }
        });
    });
    
    addBtn.addEventListener('click', () => {
        const newAttr = newAttributeInput.value.trim();
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