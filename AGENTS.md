# AGENTS.md

## Project Overview

**TestID Highlighter** is a Chrome browser extension (Manifest V3) that highlights DOM elements with test automation attributes (data-test-id, data-cy, data-qa, etc.) on any webpage.

Single-package project: `testid-highlighter/` is the complete extension.

## Architecture

- **manifest.json**: Manifest V3 config. Content script runs on all URLs at `document_idle`.
- **content.js**: Injected on all pages. Reads settings from `chrome.storage.sync`, finds matching elements, applies `.testid-highlighter` CSS class.
- **popup.html + popup.js**: Extension popup UI. Compact list-based interface (320px width). Language selector dropdown, toggle to enable/disable, add/remove attributes via input field. Auto-saves to `chrome.storage.sync` and sends messages to content script.
- **locales.js**: Internationalization dictionary with translations for English, Russian, Chinese.
- **water.css**: Minimal CSS framework for popup styling.
- **icons/**: SVG icons (16, 32, 48, 128px). Scalable.

## Key Implementation Details

### Content Script (content.js)
- **Default attributes**: `['data-test-id', 'data-cy', 'data-qa', 'data-test', 'data-testid', 'data-hook', 'data-e2e']`
- Minimal highlight by default (1px outline), enhanced on hover (2px + background)
- Tooltip appears on hover showing attribute name and value
- Tooltip uses `position: fixed` with z-index 10000 - always on top, works correctly with modals/dropdowns
- **MutationObserver**: Debounced (1000ms) refresh on any DOM changes - works with dynamic content
- **SPA support**: Intercepts `pushState`, `replaceState`, `popstate` events, detects SPA root containers
- **Copy to clipboard**: Press Ctrl+C while hovering to copy attribute (e.g., `data-test-id="loginButton"`)
- Listens for messages: `updateHighlight`, `updateAttributes`, `updateLanguage`

### Popup (popup.js)
- Renders attributes as a list with delete buttons
- Single input field + "+" button to add new attributes
- Enter key triggers add
- Auto-saves on add/delete; no explicit "Save" button
- Language selector dropdown (English, Russian, Chinese)
- Auto-detects browser language on first run
- Syncs settings across all Chrome devices

### Storage
- Uses `chrome.storage.sync` (not local). Keys:
  - `enabled` (boolean)
  - `customAttributes` (array of strings)
  - `language` (string: 'en', 'ru', 'zh')
- Default: `enabled: false`, `customAttributes: DEFAULT_ATTRIBUTES`, `language: auto-detected`

## Installation & Testing

1. Open `chrome://extensions/`
2. Enable "Developer mode" (toggle, top right)
3. Click "Load unpacked"
4. Select `testid-highlighter/` folder

No build step required. All files are served directly.

## Common Tasks

### Modify popup UI
- Edit `popup.html` (structure) and inline `<style>` block
- Update `popup.js` for logic changes
- Popup width is fixed at 320px; keep compact

### Add/change default attributes
- Edit `DEFAULT_ATTRIBUTES` array in `content.js`
- Also update README.md features list

### Change highlight styling
- Edit `.testid-highlighter` CSS in `content.js` (injected as string)
- Minimal style (1px outline) and hover style (2px + background)

### Add new language
- Add new key to `translations` object in `locales.js`
- Dropdown auto-generates from `translations` keys

### Debug content script
- Open DevTools on any page → Sources → Content Scripts → testid-highlighter
- Check console for errors
- Use `chrome.storage.sync.get()` in console to inspect saved settings

### Debug popup
- Right-click extension icon → "Inspect popup"
- DevTools opens for popup context

## Gotchas

- **Manifest V3 only**: No background page. All state via `chrome.storage.sync` and messaging.
- **Content script messaging**: Must query active tab first; tabs without content script loaded will fail silently. Wrap in `if (tabs[0])` check.
- **SVG icons**: Manifest expects file paths, not data URIs. Icons are scalable; same SVG content works at all sizes.
- **Water.css**: Minimal framework; custom styles for list items and buttons are inlined in popup.html `<style>` tag.
- **Storage sync**: Settings sync across user's Chrome devices. Use `chrome.storage.local` if offline-only behavior needed.
- **CSS class injection**: `.testid-highlighter` class is added to matching elements; styles injected via `<style>` tag in document head. Avoid conflicts with page CSS by using `!important`.
- **Tooltip z-index**: Uses `position: fixed` with z-index 10000 to always appear on top of modals/dropdowns.
- **Dynamic content**: MutationObserver with debounce handles AJAX/dynamic content. SPA navigation is detected via history API interception.

## File Checklist

- `manifest.json` — Manifest V3, content_scripts, permissions, icons
- `popup.html` — Compact UI, language selector, inline styles, 320px width
- `popup.js` — List rendering, add/remove logic, i18n, messaging
- `content.js` — Highlighting, tooltip, SPA support, MutationObserver, clipboard
- `locales.js` — Translation dictionary for en, ru, zh
- `water.css` — Popup base styles
- `icons/` — 4 SVG files (16, 32, 48, 128px)
- `README.md` — User-facing docs

## Testing Checklist

- [ ] Toggle enable/disable works
- [ ] Add attribute via input + Enter or + button
- [ ] Delete attribute via ✕ button
- [ ] Highlighting appears on page with matching attributes
- [ ] Settings persist across page reloads
- [ ] Settings sync across multiple tabs
- [ ] Popup UI is compact and readable
- [ ] Dynamic content updates highlight (MutationObserver)
- [ ] SPA navigation maintains highlight
- [ ] Tooltip appears on hover with correct z-index (works with modals)
- [ ] Ctrl+C copies attribute to clipboard
- [ ] Language selector changes all UI text
- [ ] Language auto-detected from browser on first run
- [ ] Tooltip shows correct language for copy hint and "Copied!" message