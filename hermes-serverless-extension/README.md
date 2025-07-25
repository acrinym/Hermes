# Hermes Serverless Extension

This directory contains a lightweight version of the Hermes extension that runs entirely in the browser without a build step or server component. It uses plain JavaScript so it can be loaded on machines without Node.js.

## Usage

1. Open your browser's extension management page (`chrome://extensions` or `about:addons`).
2. Enable developer mode and load this folder as an unpacked extension.
3. Browse any page to see the Hermes overlay and tools. Data is stored in `localStorage`.

This version now supports keyboard hotkeys, profile import/export, a Cube 3D visual effect using Three.js loaded from a CDN, a scratch pad for notes, task list management, macro scheduling, a simple Pomodoro timer, a domain allowlist, and a dockable toolbar for quick top or bottom placement.

This variant is intended for demonstrations and offline use only.
