(function() {
    'use strict';

    let currentLanguage = 'en';
    let allowedUrls = [];
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
                    copied: t('copied'),
                    eyeEnabled: t('eyeEnabled'),
                    eyeDisabled: t('eyeDisabled')
                }
            });
        }
    });
}

// URL functions - moved inside DOMContentLoaded
let cleanUrl, addUrl, removeUrl, saveUrls;

// Attribute functions - moved inside DOMContentLoaded
let getEnabledAttributes, toggleAttribute, addAttribute, removeAttribute, saveAttributes;

document.addEventListener('DOMContentLoaded', () => {
    const languageSelect = document.getElementById('language-select');
    const allowedUrlsList = document.getElementById('allowed-urls-list');
    const noUrlsMsg = document.getElementById('no-urls-msg');
    const addCurrentUrlBtn = document.getElementById('add-current-url');
    const manualUrlInput = document.getElementById('manual-url-input');
    const addManualUrlBtn = document.getElementById('add-manual-url');
    const attributesList = document.getElementById('attributes-list');
    const newAttributeInput = document.getElementById('new-attribute');
    const addAttrBtn = document.getElementById('add-btn');
    
    // URL functions - defined inside DOMContentLoaded
    cleanUrl = function(url) {
        if (url.startsWith('file://')) {
            return url;
        }
        return url.replace(/^https?:\/\//, '').split('/')[0];
    };
    
    addUrl = function(url) {
        const clean = cleanUrl(url);
        if (!clean || allowedUrls.includes(clean)) return false;
        allowedUrls.push(clean);
        saveUrls();
        return true;
    };
    
    removeUrl = function(index) {
        if (index >= 0 && index < allowedUrls.length) {
            allowedUrls.splice(index, 1);
            saveUrls();
        }
    };
    
    saveUrls = function() {
        chrome.storage.local.set({ allowedUrls });
        renderUrls();
        
        // Update button visibility
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0] && tabs[0].url) {
                const currentUrl = cleanUrl(tabs[0].url);
                const isAlreadyAdded = allowedUrls.some(url => url === currentUrl);
                addCurrentUrlBtn.style.display = isAlreadyAdded ? 'none' : 'inline-block';
            }
        });
        
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { 
                    action: 'updateAllowedUrls', 
                    allowedUrls 
                });
            }
        });
    };
    
    // Render URLs
    function renderUrls() {
        allowedUrlsList.innerHTML = '';
        
        if (allowedUrls.length === 0) {
            noUrlsMsg.style.display = 'block';
        } else {
            noUrlsMsg.style.display = 'none';
            allowedUrls.forEach((url, index) => {
                const li = document.createElement('li');
                li.className = 'url-item';
                li.innerHTML = `
                    <input type="text" class="url-input" value="${url}" data-index="${index}">
                    <button class="remove-url-btn" data-index="${index}">✕</button>
                `;
                allowedUrlsList.appendChild(li);
            });
            
            // Edit URL handler
            document.querySelectorAll('.url-input').forEach(input => {
                const handleUrlChange = (e, isBlur) => {
                    const index = parseInt(e.target.dataset.index);
                    const newUrl = e.target.value.trim();
                    
                    // Check for duplicates (excluding current index)
                    const isDuplicate = allowedUrls.some((url, i) => i !== index && url === newUrl);
                    if (isDuplicate) {
                        e.target.value = allowedUrls[index];
                        return;
                    }
                    
                    if (newUrl && newUrl !== allowedUrls[index]) {
                        allowedUrls[index] = newUrl;
                        saveUrls();
                    } else if (!newUrl) {
                        // Empty input - restore original
                        e.target.value = allowedUrls[index];
                    }
                };
                
                input.addEventListener('change', handleUrlChange);
                input.addEventListener('blur', (e) => handleUrlChange(e, true));
            });
            
            document.querySelectorAll('.remove-url-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    removeUrl(index);
                });
            });
        }
    }
    
    // Attribute functions - defined inside DOMContentLoaded
    getEnabledAttributes = function() {
        return currentAttributes.filter(attr => {
            return !attr.includes(':disabled');
        });
    };
    
    toggleAttribute = function(index) {
        const attr = currentAttributes[index];
        if (attr.includes(':disabled')) {
            currentAttributes[index] = attr.replace(':disabled', '');
        } else {
            currentAttributes[index] = attr + ':disabled';
        }
        saveAttributes();
    };
    
    addAttribute = function(attr) {
        const clean = attr.trim();
        if (!clean || currentAttributes.some(a => a === clean || a === clean + ':disabled')) return false;
        currentAttributes.push(clean);
        saveAttributes();
        return true;
    };
    
    removeAttribute = function(index) {
        if (index >= 0 && index < currentAttributes.length) {
            currentAttributes.splice(index, 1);
            saveAttributes();
        }
    };
    
    saveAttributes = function() {
        chrome.storage.local.set({ customAttributes: currentAttributes });
        renderAttributes();
        
        const enabledAttrs = getEnabledAttributes();
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { 
                    action: 'updateAttributes', 
                    attributes: enabledAttrs 
                });
            }
        });
    };
    
    // Render Attributes
    function renderAttributes() {
        attributesList.innerHTML = '';
        
        currentAttributes.forEach((attr, index) => {
            const isDisabled = attr.includes(':disabled');
            const displayName = isDisabled ? attr.replace(':disabled', '') : attr;
            
            const li = document.createElement('li');
            li.className = 'attribute-item' + (isDisabled ? ' disabled' : '');
            li.draggable = true;
            li.dataset.index = index;
            li.innerHTML = `
                <input type="checkbox" ${isDisabled ? '' : 'checked'} data-index="${index}">
                <span class="drag-handle">⋮⋮</span>
                <span class="attr-name">${displayName}</span>
                <button class="remove-attr-btn" data-index="${index}">✕</button>
            `;
            attributesList.appendChild(li);
        });
        
        // Toggle attribute
        document.querySelectorAll('.attribute-item input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                toggleAttribute(index);
            });
        });
        
        // Remove attribute
        document.querySelectorAll('.remove-attr-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                removeAttribute(index);
            });
        });
        
        // Drag and drop
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
                    saveAttributes();
                }
                
                dropTarget.classList.remove('drag-over');
            });
        });
    }
    
    function loadSettings() {
        renderUrls();
        renderAttributes();
        
        chrome.storage.local.get(['allowedUrls', 'customAttributes', 'language'], (data) => {
            if (Array.isArray(data.allowedUrls)) {
                allowedUrls = data.allowedUrls;
            }
            
            if (Array.isArray(data.customAttributes)) {
                currentAttributes = data.customAttributes;
            }
            
            currentLanguage = data.language || detectBrowserLanguage();
            
            initLanguageSelect();
            updateTranslations();
            renderUrls();
            renderAttributes();
            notifyContentScript();
        });
    }
    
    loadSettings();
    
    // Check if current page is already added and hide button
    function checkAndHideCurrentPageButton() {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0] && tabs[0].url) {
                const currentHost = cleanUrl(tabs[0].url);
                const isAlreadyAdded = allowedUrls.some(url => url === currentHost);
                addCurrentUrlBtn.style.display = isAlreadyAdded ? 'none' : 'inline-block';
            }
        });
    }
    
    // Check after settings loaded
    setTimeout(checkAndHideCurrentPageButton, 100);
    
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync' || areaName === 'local') {
            if (changes.allowedUrls) {
                allowedUrls = changes.allowedUrls.newValue || [];
                renderUrls();
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
    
    // Add current page button
    addCurrentUrlBtn.addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0] && tabs[0].url) {
                addUrl(tabs[0].url);
            }
        });
    });
    
    // Add manual URL
    addManualUrlBtn.addEventListener('click', () => {
        const url = manualUrlInput.value.trim();
        if (url) {
            addUrl(url);
            manualUrlInput.value = '';
        }
    });
    
    manualUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addManualUrlBtn.click();
        }
    });
    
    // Add attribute
    addAttrBtn.addEventListener('click', () => {
        const attr = newAttributeInput.value.trim();
        if (attr) {
            addAttribute(attr);
            newAttributeInput.value = '';
        }
    });
    
    newAttributeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addAttrBtn.click();
        }
    });
})();