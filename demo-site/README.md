# Hermes Call Center Test Site

This directory contains a comprehensive test environment designed to verify Hermes functionality before production deployment in call center environments.

## 🚀 Quick Start

1. **Open the main demo page**: `index.html`
2. **Launch the call center test**: Click "🚀 Launch Call Center Test Site"
3. **Follow the testing guide**: View the comprehensive testing checklist

## 📁 Files Overview

### Main Test Site
- **`call-center-test.html`** - Complete call center simulation with:
  - Ticket creation and management system
  - Customer lookup functionality
  - Voice input and accessibility features
  - Keyboard shortcuts for efficiency
  - Realistic call center workflows

### Testing Documentation
- **`hermes-testing-guide.html`** - Step-by-step production readiness checklist
- **`index.html`** - Updated main demo page with navigation
- **`accessibility.html`** - Existing accessibility demo
- **`corporate.html`** - Corporate form demo
- **`widget.html`** - Embedded widget demo

## 🎯 Key Features for Call Center Testing

### Accessibility & Ergonomics
- **High Contrast Mode** - Reduces eye strain during long shifts
- **Voice Input** - Minimizes repetitive typing (Chrome/Edge only)
- **Keyboard Shortcuts** - Reduces mouse dependency
  - `Ctrl+N` - New ticket
  - `Ctrl+F` - Search customers
  - `Ctrl+S` - Save/submit
  - `Ctrl+D` - Fill demo data

### Ticket Management
- **Auto-generated ticket IDs** - Ensures unique tracking
- **Priority and category selection** - Matches real workflow
- **Customer lookup** - Simulates CRM integration
- **Form validation** - Prevents data entry errors
- **Quick actions** - Streamlined common tasks

### Hermes Integration Testing
- **Macro recording scenarios** - Test automation capture
- **Form filling profiles** - Verify auto-population
- **Repetitive task automation** - Measure efficiency gains
- **Error handling** - Test robustness

## 🧪 Testing Scenarios

### Basic Functionality
1. Manual ticket creation
2. Demo data auto-fill
3. Customer search and selection
4. Form validation and submission

### Accessibility Testing
1. High contrast mode toggle
2. Voice command recognition
3. Keyboard navigation
4. Screen reader compatibility

### Hermes Extension Testing
1. Record macros for common workflows
2. Test macro playback reliability
3. Create and use form profiles
4. Measure time and motion savings

### Performance Testing
1. Rapid ticket creation (10+ tickets)
2. Error scenario handling
3. Browser compatibility verification
4. Responsive design validation

## 📊 Success Metrics

The test environment helps verify:
- **50%+ time savings** in ticket creation
- **70%+ reduction** in mouse clicks
- **Zero data entry errors** with validation
- **Seamless accessibility** for users with different needs
- **Reliable macro playback** across sessions

## 🛠️ Local Testing

To run the test site locally:

```bash
cd demo-site
python3 -m http.server 8080
# Open http://localhost:8080 in your browser
```

## 📋 Production Readiness Checklist

Use `hermes-testing-guide.html` for a complete testing checklist that includes:
- Environment setup verification
- Accessibility feature testing  
- Ticket system functionality
- Hermes extension integration
- Performance and efficiency testing
- Error handling and edge cases
- Browser compatibility checks

## 🎉 Ready for Production

When all tests pass, Hermes is ready for deployment to call center agents. The testing guide generates a downloadable report to document verification completion.

## 💡 Tips for Call Center Managers

1. **Start with pilot group** - Deploy to 3-5 agents first
2. **Monitor macro performance** - Track real-world efficiency gains
3. **Collect feedback** - Especially on accessibility features
4. **Schedule maintenance** - Regular macro updates as systems change
5. **Document workflows** - Create macro libraries for common tasks

---

For technical support or questions about Hermes deployment, refer to the main project documentation.