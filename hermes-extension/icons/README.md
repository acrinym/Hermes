# Hermes Extension Icons

This directory contains all the visual assets for the Hermes System Extension v4.0.0.

## Main Extension Icons

### `icon.svg` - Main Extension Icon (128x128)
- **Design**: Hermes caduceus with wings and serpents
- **Colors**: Purple gradient background (#667eea to #764ba2)
- **Features**: 
  - White staff with wings
  - Green and orange serpents
  - Version indicator "4.0"
  - Drop shadow for depth

### `icon16.png` - Toolbar Icon (16x16)
- **Use**: Browser toolbar display
- **Design**: Simplified caduceus
- **Features**: Clean, recognizable at small size

### `icon32.png` - Medium Resolution (32x32)
- **Use**: Extension management, medium displays
- **Design**: Detailed caduceus with serpents
- **Features**: Good balance of detail and clarity

### `icon48.png` - High Resolution (48x48)
- **Use**: Extension store, high-DPI displays
- **Design**: Full caduceus with enhanced detail
- **Features**: Subtle shadow effects

### `icon128.png` - App Store (128x128)
- **Use**: Chrome Web Store, app stores
- **Design**: Full detail caduceus
- **Features**: Maximum detail, version indicator

## Feature Icons

### `schedule.svg` - Macro Scheduling
- **Design**: Calendar with clock overlay
- **Colors**: Green gradient (#10b981 to #059669)
- **Features**: Calendar grid with clock hands

### `notes.svg` - Quick Notes
- **Design**: Sticky note with pen
- **Colors**: Orange gradient (#f59e0b to #d97706)
- **Features**: Paper fold effect, text lines, pen

### `tasks.svg` - Task Management
- **Design**: Checklist with checkmarks
- **Colors**: Blue gradient (#3b82f6 to #2563eb)
- **Features**: Checkboxes, checkmarks, plus sign

### `timer.svg` - Pomodoro Timer
- **Design**: Clock face with hands
- **Colors**: Red gradient (#ef4444 to #dc2626)
- **Features**: Clock numbers, hands, center dot

## Promotional Assets

### `banner.svg` - Promotional Banner (800x200)
- **Design**: Full-width banner with Hermes staff
- **Features**: 
  - Large caduceus illustration
  - "HERMES SYSTEM" title
  - "Enterprise Extension v4.0.0" subtitle
  - Feature icons with labels
  - Tagline

## Icon Specifications

### Color Palette
- **Primary**: Purple gradient (#667eea to #764ba2)
- **Success**: Green (#10b981)
- **Warning**: Orange (#f59e0b)
- **Info**: Blue (#3b82f6)
- **Error**: Red (#ef4444)

### Design Principles
- **Scalable**: All icons work at multiple sizes
- **Consistent**: Unified design language
- **Accessible**: High contrast, clear shapes
- **Modern**: Gradient backgrounds, subtle shadows

### File Formats
- **SVG**: Vector format for scalability
- **PNG**: Raster format for browser compatibility
- **All sizes**: 16x16, 32x32, 48x48, 128x128

## Usage

### Browser Extension
The icons are referenced in `manifest.json`:
```json
{
  "icons": {
    "16": "icon16.png",
    "32": "icon32.png",
    "48": "icon48.png",
    "128": "icon128.png"
  },
  "action": {
    "default_icon": {
      "16": "icon16.png",
      "32": "icon32.png",
      "48": "icon48.png",
      "128": "icon128.png"
    }
  }
}
```

### Feature Icons
Feature icons can be used in the UI for:
- Button icons
- Panel headers
- Menu items
- Status indicators

### Promotional Use
The banner can be used for:
- GitHub repository header
- Documentation pages
- Marketing materials
- Social media posts

## Conversion Notes

To convert SVG to PNG for browser compatibility:
```bash
# Using ImageMagick
convert icon.svg icon.png

# Using Inkscape
inkscape icon.svg --export-png=icon.png
```

## Version History

- **v4.0.0**: Enterprise release with new feature icons
- **v3.x**: Original caduceus design
- **v2.x**: Previous icon iterations 