# TestID Highlighter

Chrome browser extension (Manifest V3) that highlights elements on the page with test automation attributes.

## Features

- **Element highlighting** with popular test automation attributes:
  - `data-test-id`, `data-cy`, `data-qa`, `data-test`, `data-testid`, `data-hook`, `data-e2e`

- **Smart highlighting:**
  - Minimal highlight by default (thin inset outline)
  - Enhanced highlight on hover
  - Tooltip showing attribute and copy hint (uses Popover API - always on top)

- **URL-based activation:** Add pages to allowed list - highlighting works automatically on those domains

- **Wildcard support:** Use `*.example.com` to match subdomains

- **Attribute management:**
  - Add/remove custom attributes
  - Drag & drop to reorder priority
  - Toggle attributes on/off without deleting (checkbox)

- **Copy to clipboard:** press Ctrl+C while hovering over highlighted element

- **Floating eye button:**
  - Appears automatically on allowed pages
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
2. Add current page to allowed list using "Add current page" button (or manually enter URLs like `*.example.com`)
3. Elements on allowed pages with test attributes will be highlighted automatically
4. (Optional) Customize attributes list - add, remove, reorder, toggle on/off

### Copy Attribute

1. Hover over highlighted element
2. Tooltip appears with attribute (e.g., `data-test-id="loginButton"`)
3. Press `Ctrl+C` to copy to clipboard

### URL Management

- **Add current page:** Adds current domain to allowed list
- **Manual add:** Enter URLs manually (supports wildcards like `*.example.com`)
- **Edit:** Click on URL in list to edit
- **Delete:** Click ✕ to remove from list
- **Auto-hide:** "Add current page" button hides when current page is already in list

### Attribute Management

- **Add:** Enter attribute name and click +
- **Remove:** Click ✕ to delete
- **Toggle:** Use checkbox to enable/disable attribute without deleting
- **Reorder:** Drag & drop to change priority (top = highest priority)

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
- Checks if current domain is in allowed URLs list
- Applies `.testid-highlighter` CSS class for highlighting
- Tracks DOM changes via MutationObserver (debounce 1000ms)
- Intercepts SPA navigation (pushState, replaceState, popstate)
- Shows tooltip on hover using Popover API (always on top)
- Creates floating eye button for quick toggle

### Popup (popup.html + popup.js)
- Compact interface (320px width)
- URL management with wildcard support
- Attribute list with toggle, add, remove, drag & drop reorder
- Language selector dropdown
- Auto-detects browser language on first run

### Storage
- `allowedUrls` - array of allowed domains/patterns
- `customAttributes` - array of attributes (with :disabled suffix for toggled off)
- `language` - selected language (en/ru/zh)
- `eyePosition` - floating button position

## Highlight Styles

- **Default:** thin semi-transparent inset outline (1px)
- **Hover:** enhanced inset outline (2px) + glow effect
- **Tooltip:** dark background with white text, uses Popover API for top layer

## Adding New Language

To add a new language:
1. Add key to `translations` object in `locales.js`
2. Reload extension in Chrome

Example:
```javascript
fr: {
    name: "Français",
    title: "TestID Highlighter",
    // ... add other fields
}
```

## License

MIT