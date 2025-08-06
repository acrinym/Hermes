# Changelog

## v4.0.0 - Enterprise Release (2025-01-06)

### 🏢 **Enterprise Features**
- **📅 Macro Scheduling** - Schedule macros to run at specific times with recurrence (once/daily/weekly/monthly)
- **📝 Quick Notes Panel** - Persistent notes for call center agents and customer interactions
- **✅ Task Management** - Simple task list with checkboxes for workflow management
- **⏰ Pomodoro Timer** - Productivity timer with customizable work/break intervals
- **🔄 Automated Execution** - Background scheduler service for reliable macro execution
- **🌐 Cross-Browser Compatibility** - Unified browser API wrapper for Chrome/Firefox/Edge

### 🎯 **Enhanced UI**
- **React-Powered Interface** - Modern, responsive UI with drag-and-drop functionality
- **Emoji Quick Access** - Intuitive buttons (📅 📝 ✅ ⏰) for enterprise features
- **Modal Panels** - Focused interaction windows for each feature
- **Persistent Storage** - Local storage for notes, tasks, and settings
- **Theme Integration** - All new features follow existing theme system

### 🔧 **Technical Improvements**
- **TypeScript Strict Mode** - Enhanced type safety and error handling
- **Debug Logging** - Centralized debug utility with configurable levels
- **Constants Management** - Replaced magic numbers with named constants
- **Error Boundaries** - Robust error handling for async operations
- **Import Standardization** - Absolute paths and proper module structure

### 🚀 **Core Enhancements**
- Unified UI across extension components
- Improved accessibility features
- Voice input for hands-free commands
- Enterprise connector support
- Refreshed demo site
- Enhanced macro editor with import/export
- Improved form sniffer with robust selectors
- Better error handling for Three.js loading failures

### 📦 **New Storage Keys**
- `hermes_schedule_settings_ext` - Macro scheduling settings
- `hermes_scheduled_macros` - Scheduled macro data
- `hermes_notes` - Quick notes data
- `hermes_tasks` - Task list data
- `hermes_pomodoro_settings` - Timer settings

### 🐛 **Bug Fixes**
- Fixed TypeScript build errors for enterprise features
- Resolved MacroPanel export/import issues
- Fixed SettingsPanel property access paths
- Corrected debug import in sniffer.ts
- Fixed boolean comparisons for default values
- Enhanced error handling for async operations

### 🔄 **Breaking Changes**
- Updated settings structure with nested macro properties
- Enhanced browser API wrapper for cross-browser compatibility
- Improved debug logging system with configurable levels

---

## v3.2.0
- Added macro editor and import/export functionality
- Enhanced theme system with new color schemes
- Improved form detection algorithms
- Added visual effects (snowflakes, lasers, strobes)
- Implemented domain allowlist functionality

## v3.1.0
- Initial Manifest V3 migration
- React-based UI components
- TypeScript implementation
- Enhanced macro recording capabilities
- Improved form filling accuracy

## v3.0.0
- Complete rewrite for modern browsers
- Manifest V2 to V3 migration
- Enhanced security features
- Improved performance and reliability
