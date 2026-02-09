# E2E Tests

End-to-end tests for Prompt Mixer using [WebdriverIO](https://webdriver.io/) + [tauri-driver](https://crates.io/crates/tauri-driver).

This is the official/standard approach for testing Tauri v2 desktop apps. It uses the WebDriver protocol (W3C standard) which on Linux connects through `WebKitWebDriver` to the WebKitGTK-based WebView.

## Prerequisites

### 1. WebKitWebDriver (Linux)

```bash
sudo apt install webkit2gtk-driver
```

Verify: `which WebKitWebDriver`

### 2. tauri-driver

```bash
cargo install tauri-driver --locked
```

Verify: `which tauri-driver`

## Running Tests

```bash
# Full run (builds app + runs tests):
npm run test:e2e

# With prerequisite checks:
npm run test:e2e:check
```

## How It Works

1. **Build**: `onPrepare` builds the Tauri app in debug mode (`tauri build --debug --no-bundle`)
2. **Driver**: `beforeSession` starts `tauri-driver` on port 4444, which:
   - Starts `WebKitWebDriver` as a subprocess
   - Sets `TAURI_WEBVIEW_AUTOMATION=true` to enable automation in the WebView
   - Launches the app binary specified in `tauri:options.application`
3. **Test**: WebdriverIO sends WebDriver commands to `tauri-driver`, which proxies them to `WebKitWebDriver`
4. **Cleanup**: `afterSession` kills `tauri-driver`

## Architecture

```
WebdriverIO  →  tauri-driver (:4444)  →  WebKitWebDriver  →  WebKitGTK WebView
(test code)      (intermediary)           (native driver)      (your Tauri app)
```

## Writing Tests

Tests use WebdriverIO's API with Mocha as the test framework:

```typescript
describe('Feature', () => {
  it('should do something', async () => {
    const element = await $('button.my-button');
    await element.click();
    await expect(element).toHaveText('Clicked');
  });
});
```

Key WebdriverIO commands:
- `$('selector')` — find element
- `$$('selector')` — find all elements
- `browser.getTitle()` — get page title
- `browser.getUrl()` — get current URL
- `element.click()` — click element
- `element.getText()` — get text content
- `element.setValue('text')` — type into input
- `expect(element).toBeExisting()` — assertion

See [WebdriverIO API docs](https://webdriver.io/docs/api) for the full API.

## Limitations

- **Linux + Windows only** — macOS doesn't have a WKWebView WebDriver
- **Requires a built binary** — can't test against `tauri dev` (live dev server)
- **tauri-driver is pre-alpha** — may have rough edges
- **Not true CDP** — uses WebDriver protocol, not Chrome DevTools Protocol (Tauri on Linux uses WebKitGTK, not Chromium)
