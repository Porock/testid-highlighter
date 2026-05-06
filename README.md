# TestID Highlighter

Chrome browser extension (Manifest V3) that highlights elements on the page with test automation attributes.

## Features

- **Element highlighting** with popular test automation attributes:
  - `data-test-id`, `data-cy`, `data-qa`, `data-test`, `data-testid`, `data-hook`, `data-e2e`

- **Smart highlighting:**
  - Minimal highlight by default (thin inset outline)
  - Enhanced highlight on hover
  - Tooltip showing attribute and copy hint

- **Copy to clipboard:** press Ctrl+C while hovering over highlighted element

- **Drag & drop attributes:** reorder attributes in popup to change priority

- **Floating eye button:**
  - Appears when highlighting is enabled
  - Click to toggle highlight on/off
  - Drag to reposition (position saved)
  - Shows current state (👁️ enabled / 👁️‍🗨️ disabled)

- **Dynamic highlighting:** automatically updates when page changes (AJAX, dynamic content)

- **SPA support:** works with React, Vue, Angular and other SPA frameworks

- **i18n:** English, Russian, and Chinese with auto-detection of browser language

- **Sync:** settings sync across Chrome devices

## Installation

1. Open `chrome://extensions/` in Chrome browser
2. Enable "Developer mode" (toggle in top right corner)
3. Click "Load unpacked"
4. Select the `testid-highlighter` folder

## Usage

1. Click the extension icon in the browser toolbar
2. Enable the "Highlight elements" toggle
3. (Optional) Add custom attributes to search for
4. Elements with specified attributes will be highlighted

### Copy Attribute

1. Hover over highlighted element
2. Tooltip appears with attribute (e.g., `data-test-id="loginButton"`)
3. Press `Ctrl+C` to copy to clipboard

### Floating Eye Button

When highlighting is enabled, a floating eye button appears in the bottom-right corner:
- **Click** to toggle highlighting on/off
- **Drag** to reposition button anywhere on screen
- Position is saved and restored on page reload

### Change Language

1. Select language from dropdown in top right corner of popup
2. Interface and tooltip hints will update to selected language

## Project Structure

```
testid-highlighter/
├── manifest.json       # Extension configuration (Manifest V3)
├── popup.html          # Popup UI
├── popup.js            # Popup logic, i18n, drag & drop
├── content.js          # Content script for element highlighting
├── locales.js          # Translation dictionary (en, ru, zh)
├── water.css           # Base styles for popup
├── README.md           # English documentation
├── README.ru.md        # Russian documentation
└── icons/              # SVG extension icons
    ├── icon16.svg
    ├── icon32.svg
    ├── icon48.svg
    └── icon128.svg
```

## How It Works

### Content Script (content.js)
- Automatically loads on all pages at `document_idle`
- Reads settings from `chrome.storage.local`
- Applies `.testid-highlighter` CSS class for highlighting
- Tracks DOM changes via MutationObserver (debounce 1000ms)
- Intercepts SPA navigation (pushState, replaceState, popstate)
- Shows tooltip on hover with z-index 10000 (always on top of modals)
- Creates floating eye button for quick toggle

### Popup (popup.html + popup.js)
- Compact interface (320px width)
- Toggle to enable/disable highlighting
- Editable attribute list with add/remove/reorder (drag & drop)
- Language selector dropdown
- Auto-detects browser language on first run

### Storage
- `enabled` - highlight on/off
- `customAttributes` - array of attributes to search
- `language` - selected language (en/ru/zh)
- `eyePosition` - floating button position

## Highlight Styles

- **Default:** thin semi-transparent inset outline (1px)
- **Hover:** enhanced inset outline (2px) + glow effect
- **Tooltip:** dark background with white text, always on top

## Adding New Language

To add a new language:
1. Add key to `translations` object in `locales.js`
2. Reload extension in Chrome

Example:
```javascript
fr: {
    name: "Français",
    title: "TestID Highlighter",
    toggleLabel: "Mettre en évidence les éléments",
    // ... other fields
}
```

## License

MIT