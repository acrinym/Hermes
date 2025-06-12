# Hermes System Userscript (v3.2.0)

**Hermes System** is a powerful, extensible Tampermonkey userscript that serves as:

- 🔁 A **form filler** with intelligent field matching  
- 📼 A **macro recorder and playback engine**  
- 🧠 A **heuristic trainer** to learn from skipped fields  
- 🎨 A **custom theming engine** with draggable UI  
- 🧩 A **domain whitelist manager**  
- 🔍 A **debug toolkit** with mutation detection and visual overlays  

## 🤔 Why Use Hermes?
Hermes speeds up repetitive data entry and automates complex page interactions. It is particularly useful on sites like **BMC Helix/Remedy** where IDs change constantly. Hermes stores DOM paths and fallback coordinates to make recorded macros reliable.

Use Hermes to:

- Save time by filling forms instantly.
- Record macros that walk through complicated workflows for you.
- Style and tweak the UI using themes and a deep settings panel.
- Debug your mappings and macros through the built-in log viewer and overlays.


> Designed to work on *any* website, Hermes enhances browser interactivity without needing extra software or browser extensions.

---

## 🌟 Features Overview

### ✏️ Form Filler
- Autodetects fields across any form using label-text heuristic scoring
- Uses JSON-based profile data
- Supports custom mappings per domain and field ID/name
- Optional visual overlays (border highlight) to indicate filled fields
- Import or export profiles from the settings panel

### 📽️ Macro Recorder + Player
- Record user interactions (clicks, inputs, changes)
- Save named macros with timestamps
- Replay macros with built-in delays
- Supports deletion and selection from dropdown
- Captures network requests for accurate replay
- Open macros in an editor to tweak individual steps
- Import or export macros as JSON for sharing or backups
- Schedule recorded macros for later execution

### 🧠 Heuristic Trainer
- Tracks skipped or unmapped fields  
- Generates suggested mappings using token similarity scoring  
- Integrates suggestions into the profile mapping automatically  

### 🐞 Debug Panel
- Built-in debug log viewer  
- Tracks DOM mutations, errors, and macro interactions  
- Exports diagnostic logs per session  
- Auto reinjection of the UI if it gets removed from the DOM  

### 🎛️ UI Control Panel
- Draggable, resizable floating UI window  
- All functionality accessible via intuitive button panel  
- Displays status messages like fill success or macro state  

### 🎨 Theme Engine
- Switch between multiple themes:  
  - Light ☀️  
  - Dark 🌙  
  - Phoenix 🦅  
  - Sea Green 🐢  
  - Aurora Glow 🌠  
  - Crimson Ember 🔥  
  - Slate Storm ⛈️  
- Persistent between sessions via GM storage  

### 🔒 Domain Whitelist
- Manage whitelisted domains from the GUI
- Hermes minimizes to emoji mode when not on an approved domain
- Add/remove domains dynamically
- Automatically saves new site configs to your GitHub repo

### ⚙️ Settings Panel
- Click the **⚙️ Settings** button to open the editor.
- Modify JSON options or toggle features like hotkeys and auto sync.
- Use **Save & Apply** to persist or **Load Defaults** to reset.

---

## 🔧 Storage Keys Used

Hermes uses the following persistent keys in GM storage:

- `hermes_profile`  
- `hermes_macros`  
- `hermes_mappings`  
- `hermes_overlay_state`  
- `hermes_learning_state`  
- `hermes_debug_mode`  
- `hermes_position`  
- `hermes_theme`  
- `hermes_whitelist`  

---

## 💻 Installation

1. Install [Tampermonkey](https://tampermonkey.net/) in your browser.  
2. Click [**this link**](#) to install the script (or paste it manually).  
3. Click the Hermes panel on any website to start filling forms, recording macros, or customizing settings.

---

## ✏️ Macro Editor & Import/Export

1. Open the **Macro** dropdown from the Hermes toolbar.
2. Click the **✏️** icon next to a macro to open the editor and adjust individual steps.
3. Use **Import Macros** to load a JSON file or **Export Macros** to save your collection.
4. The same menu lets you schedule a macro using the **Schedule** button.

---

## 📜 Developer Notes

- Built entirely in vanilla JS.  
- Shadow DOM used to encapsulate UI styles.  
- Each section (debugging, macros, trainer, overlays) is modular.  
- Designed to be extensible — feel free to fork and adapt.  

---

## 📬 Feedback / Contributions

PRs welcome. For suggestions or issues, please use the Issues tab.

> **Author:** Justin (adapt/expand from `YourName` in script header)

---

## 📚 License

Proprietary License — all rights reserved. Contact the author for permissions.

---

## 🌐 Coming Soon

- AI-assisted field mapping suggestions

---

## 📎 Links & Resources

- [Tampermonkey](https://tampermonkey.net/)  
- [MDN Web Docs](https://developer.mozilla.org/en-US/)  
- [Userscript.org Archive](https://greasyfork.org/)  

---

> "Hermes doesn't just fill forms—it learns them."

✨ *For questions, customization help, or collaboration: contact Justin directly.*
