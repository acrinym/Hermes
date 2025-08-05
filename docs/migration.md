# Migration Guide

To keep Hermes humming along nicely, a few settings were renamed.
Stored settings are translated automatically on load, but here's the cheat sheet
for reference:

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
