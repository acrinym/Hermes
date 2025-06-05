# Hermes System Chrome Extension (v3.6.0)

**Hermes System** brings advanced form automation and macro capabilities directly to Chrome as a Manifest V3 extension. The extension works on any site and requires no userscript manager.

- 🔁 **Form filler** with intelligent field detection
- 📼 **Macro recorder** and playback engine
- 🧠 **Heuristic trainer** that learns from skipped fields
- 🎨 **Theming engine** with draggable and bunchable UI
- ✨ **Visual effects** like lasers, snowflakes and strobes
- 🧩 **Domain allowlist** with minimize-on-unlisted mode
- ❓ **Help panel** and detailed **settings editor**
- 📤 **Profile import/export** via JSON
- 🔍 **Debug toolkit** with logs and mutation detection

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

### 🧠 Heuristic Trainer
- Tracks skipped or unmapped fields
- Suggests mappings based on token similarity
- Integrates suggestions into your profile automatically

### 🐞 Debug & Help
- Built‑in log viewer for errors and DOM mutations
- Help panel summarizing all controls
- Auto‑reinjects the UI if removed from the page

### 🎛️ UI Control Panel
- Draggable floating window with resize handles
- Snap buttons to quickly align UI to edges or corners
- "Bunch" toggle for compact layout
- Displays status messages for actions

### ✨ Visual Effects
- Snowflake, Laser (classic & simple) and Strobe modes
- Canvas based rendering that can be toggled on/off
- Effect parameters editable in the settings panel

### 🎨 Theme Engine
- Light ☀️, Dark 🌙, Phoenix 🦅, Sea Green 🐢, Aurora Glow 🌠, Crimson Ember 🔥, Slate Storm ⛈️ and many more
- CSS variables make themes easily customizable
- Theme choice persists across sessions

### 🔒 Domain Allowlist
- Manage allowed domains from the GUI
- When visiting unlisted domains the UI collapses to a small emoji
- Add or remove domains without leaving the page

### ⚙️ Settings Panel
- JSON editor for advanced options such as border thickness or effect density
- Settings are merged with safe defaults and validated

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

## 💻 Installation

1. Clone this repository or download the source.
2. Open `chrome://extensions` in Chrome and enable **Developer mode**.
3. Click **Load unpacked** and select the `hermes-extension` folder.
4. The Hermes icon will appear in the toolbar. Navigate to any site and click the icon to toggle the panel.

---

## 📜 Developer Notes

- Built with vanilla JS and Manifest V3 APIs.
- UI styles are encapsulated in a Shadow DOM.
- Background service worker stores data in Chrome storage.
- Modular design—fork or extend as desired.

---

## 📬 Feedback / Contributions

PRs are welcome. For suggestions or issues, please use the Issues tab.

> **Author:** Justin

---

## 📚 License

MIT License — free to use, share, and modify with attribution.

---

## 🌐 Coming Soon

- Macro scheduling
- AI-assisted field mapping suggestions

For a full list of ideas and potential enhancements, see [TODO.md](TODO.md).

---

> "Hermes doesn't just fill forms—it learns them."

✨ *For questions, customization help, or collaboration: contact Justin directly.*
