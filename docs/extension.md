# Hermes Extension

Use the browser extension to record and play macros. This guide covers migrations, metrics, and backend notes.

## Migration Guide

To keep Hermes humming along nicely, a few settings were renamed. Stored settings are translated automatically on load, but here's the cheat sheet for reference:

| Legacy name | New name |
| --- | --- |
| `recordHotkey` | `hotkeys.record` |
| `playMacroHotkey` | `hotkeys.play` |
| `macro.useCoords` | `macro.useCoordinateFallback` |
| `macro.recordMouse` | `macro.recordMouseMoves` |
| `macro.relativeCoords` | `macro.relativeCoordinates` |
| `macro.similarity` | `macro.similarityThreshold` |
| `effects.lasers` | `effects.lasersV13` |
| `effects.snow`, `effects.snowflakes` | `effects.snowflakesV13` |
| `effects.strobe` | `effects.strobeV13` |

Future migrations can add new entries here so upgrades stay smooth. 😄

## Performance Metrics

Track time savings and click reduction when comparing manual workflows to Hermes automation.

1. Time a manual ticket and count mouse clicks.
2. Run the same workflow with Hermes macros.
3. Enter your results in the demo site's interactive chart to visualize improvements.

**Success Criteria**
- Time Savings: 50% or greater
- Click Reduction: 70% or greater

The `hermes-testing-guide.html` page includes an interactive chart built with Chart.js to help you confirm these goals.

## Backend Setup

See [hermes-extension/BACKEND_SETUP.md](../hermes-extension/BACKEND_SETUP.md) to connect Hermes to your own backend.
