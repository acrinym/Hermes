
# Hermes System Chrome Extension (v3.8.0)


**Hermes System** brings advanced form automation and macro capabilities directly to Chrome as a Manifest V3 extension. The extension works on any site and requires no userscript manager.

- 🔁 **Form filler** with intelligent field detection
- 📼 **Macro recorder** and playback engine
- 🧠 **Heuristic trainer** that learns from skipped fields
- 🎨 **Theming engine** with draggable UI that stacks vertically when dragged to page edges
- ✨ **Visual effects** including lasers, snowflakes, strobes and confetti
- 🧩 **Domain allowlist** with minimize-on-unlisted mode
- ❓ **Help panel** and detailed **settings editor**
- 📤 **Profile import/export** via JSON
- 🔍 **Debug toolkit** with logs and mutation detection
- ⏰ **Macro scheduling UI**
- 🗒️ **Task list panel** for quick to-dos
- ⏲️ **Pomodoro timer** to stay focused
- 📝 **Scratch pad** for notes and Drive backups
- ⌨️ **Configurable hotkeys for recording and playback**
- 🔎 **Macro search/filter**
- 🕒 **Wait steps for reliable playback**
- ☁️ **Optional cloud sync**
- 🖥 **System theme detection**
- 🌐 **Localization support**
- 📋 **First-run onboarding overlay**
- 🛰 **Network request capture**
- 📁 **Auto-generated domain configs**

---

## 🌟 Features Overview

### ✏️ Form Filler
- Autodetects fields using label and text heuristics
- Uses JSON profile data
- Import or export profiles directly from the UI
- Supports custom mappings per domain and field ID/name
- Optional visual overlays to highlight filled fields

### 📽️ Macro Recorder + Player
- Record clicks, inputs and other events
- Save named macros with timestamps
- Replay macros with adjustable delays
- Delete or select macros from a dropdown
- Edit recorded steps in a dedicated macro editor
- Import or export macros as JSON files
- Capture and replay network requests
- Add wait-for-element or network-idle steps
- Search macros by name
- Trigger recording or playback via hotkeys
- Schedule macros from the built-in UI

### 🧠 Heuristic Trainer
- Tracks skipped or unmapped fields
- Suggests mappings based on token similarity
- Integrates suggestions into your profile automatically

### 🐞 Debug & Help
- Built‑in log viewer for errors and DOM mutations
- Help panel summarizing all controls
- Auto‑reinjects the UI if removed from the page
- Optional onboarding overlay for first‑time users

### 🎛️ UI Control Panel
- Draggable floating window with resize handles
- Snap buttons to quickly align UI to edges or corners
- Dock to the top or bottom of the page without covering content
- "Bunch" toggle for compact layout
- Displays status messages for actions

### ✨ Visual Effects
- Snowflake, Laser (classic & simple), Strobe, Confetti and new **Cube 3D** modes
- Canvas or WebGL based rendering that can be toggled on/off
- Effect parameters editable in the settings panel

### 🎨 Theme Engine
- Light ☀️, Dark 🌙, Phoenix 🦅, Sea Green 🐢, Aurora Glow 🌠, Crimson Ember 🔥, Slate Storm ⛈️ and many more including new Sunset 🌇, Forest 🌳 and Neon 💡 themes
- CSS variables make themes easily customizable
- Theme choice persists across sessions
- Optionally follow the system dark/light preference
- Themes can be exported or imported via the Options page

### 🔒 Domain Allowlist
- Manage allowed domains from the GUI
- When visiting unlisted domains the UI collapses to a small emoji
- Add or remove domains without leaving the page
- Right-click to temporarily disable or re-enable Hermes on the current site

### ⚙️ Settings Panel
- JSON editor for advanced options such as border thickness or effect density
- Settings are merged with safe defaults and validated
- Dedicated Options page available from Chrome's extension settings
- Manual or periodic cloud sync of profiles and macros
- Interface localized based on browser language

---

## 🔧 Storage Keys Used

Hermes stores its data in `chrome.storage.local` using these keys:
- `hermes_profile_ext`
- `hermes_macros_ext`
- `hermes_mappings_ext`
- `hermes_overlay_state_ext`
- `hermes_learning_state_ext`
- `hermes_debug_mode_ext`
- `hermes_position_ext`
- `hermes_theme_ext`
- `hermes_whitelist_ext`
- `hermes_settings_v1_ext`

---

## 📁 Configs Folder

Site-specific selectors can be placed under `hermes-extension/configs/`.  Each
file is named after the domain it applies to (e.g.
`example.com.json`).  Hermes loads these JSON configs to reliably locate buttons
and fields on pages where the default heuristics struggle.

Example config:

```json
{
  "loginButton": "#login",
  "usernameField": "input[name='username']",
  "passwordField": "input[name='password']"
}
```

When visiting a page Hermes first looks for a config matching the full
hostname.  If none exists it falls back to a file for the base domain.  For
`sub.example.com` the extension checks `sub.example.com.json` then
`example.com.json`.

If no config is found Hermes automatically scans the page.  The scan gathers
editable field selectors, clickable buttons, current scroll positions, maximum
scroll sizes and the viewport dimensions.  A scaffolded JSON file is then saved
to the `_Configs` folder of this repository via the GitHub API so you can refine
it later.

### GitHub Settings

The extension expects the URLs for the remote config repository to be provided
via Chrome storage or build-time environment variables.

- **`github_raw_base`** – Base URL for raw config files
- **`github_api_base`** – API endpoint for creating/updating configs
- **`github_token`** – Personal token for write access (optional)

You can set these at runtime with:

```javascript
chrome.storage.local.set({
  github_raw_base: 'https://raw.githubusercontent.com/USER/REPO/main/_Configs/',
  github_api_base: 'https://api.github.com/repos/USER/REPO/contents/_Configs/',
  github_token: 'ghp_xxx' // optional
});
```

Alternatively, define the environment variables `GITHUB_RAW_BASE`,
`GITHUB_API_BASE`, and `GITHUB_TOKEN` when running `npm run build` to embed them
in the bundle.

---

## 💻 Installation

1. Clone this repository or download the source.
2. Open your browser's extensions page and enable **Developer mode**:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Firefox (109+): `about:debugging#/runtime/this-firefox`
   - Opera: `opera://extensions`
3. Click **Load unpacked** (or **Load Temporary Add‑on** in Firefox) and select the `hermes-extension` folder.
4. The Hermes icon will appear in the toolbar. Navigate to any site and click the icon to toggle the panel.

## 🌐 Browser Compatibility

Hermes works in any Chromium-based browser and Firefox 109+. The same build can be loaded in Chrome, Edge, Opera, or Vivaldi. Firefox users must use the **Load Temporary Add-on** option or package the extension with `web-ext`.

---

## 📜 Developer Notes

- Source files live under `hermes-extension/src` and are written in TypeScript.
- Bundled with Webpack to a Manifest V3 extension.
- UI built with React and effects powered by Three.js.
- All panels and menus render inside a single Shadow DOM host for complete cross-site isolation.
- Background service worker stores data in Chrome storage.
- Modular design—fork or extend as desired.

---
## 📡 API Usage

Start the server in the `server/` directory with:

```bash
cd server && npm install && node index.js
```

### `POST /api/macros/run`
Trigger execution of a stored macro by name or ID.

```bash
curl -X POST http://localhost:3000/api/macros/run \
  -H "Content-Type: application/json" \
  -d '{"name":"Example Macro"}'
```

### `GET /api/macros`
Fetch metadata for all saved macros.

```bash
curl http://localhost:3000/api/macros
```

### `POST /api/fill`
Begin a form fill operation using a profile object.

```bash
curl -X POST http://localhost:3000/api/fill \
  -H "Content-Type: application/json" \
  -d '{"profile":{"first":"John","last":"Doe"}}'
```

### `GET /api/status/:id`
Check the status of a macro or fill operation returned by the above calls.

```bash
curl http://localhost:3000/api/status/<id>
```


## ⏰ Macro Scheduling

Hermes lets you trigger macros at a future date or on a repeating schedule.
Start the server and visit [http://localhost:3000/schedule](http://localhost:3000/schedule) to use the visual scheduler.
The page lists available macros with checkboxes and provides date and time pickers alongside simple recurrence options.

1. **Select macros** – tick the checkboxes for any macros you want to run.
2. **Choose a date** – pick the starting day from the calendar widget.
3. **Set a time** – specify the exact time the macro should start.
4. **Repeat** – run once or choose Daily, Weekly or Monthly.

Press **Schedule Macro** to save. Scheduled jobs can be viewed or cancelled via the `/api/schedule` endpoints.

## 🤖 Automation & Scheduler UI

In addition to manual playback, Hermes exposes a local automation API under `/api`.  Macros and form fills can be triggered remotely or chained from other tools.  When the extension scans a new site it automatically saves a configuration file back to your GitHub repository so later automation runs consistently.  The web UI at `/schedule` provides a simple calendar view for creating one‑off or recurring jobs using those saved macros.

---

## 🚀 Development Setup & Testing

Install dependencies for both the server and extension with the included script
before running tests:

```bash
./setup.sh
```

This runs `npm install` inside the `server/` and `hermes-extension/` folders.
Afterwards you can execute the test suites individually:

```bash
cd server && npm test
cd ../hermes-extension && npm test
```

---

## 📬 Feedback / Contributions

PRs are welcome. For suggestions or issues, please use the Issues tab.

### Building the extension

1. `cd hermes-extension`
2. (optional) Run `npm install` to install dev dependencies. The build script will install them automatically if missing.
3. From inside `hermes-extension/`, run `npm run build` to bundle `src/` into a `dist/` folder. This `dist/` directory is excluded from version control via `.gitignore`.
4. Load the `hermes-extension` directory in Chrome as an unpacked extension.

> **Author:** Justin

---

## 📚 License

Proprietary License — all rights reserved. Contact the author for permissions.

---

## 🌐 Coming Soon

- AI-assisted field mapping suggestions

See also the [ROADMAP](ROADMAP.md) for planned milestones.

For a full list of ideas and potential enhancements, see [TODO.md](TODO.md).

---

> "Hermes doesn't just fill forms—it learns them."

✨ *For questions, customization help, or collaboration: contact Justin directly.*
