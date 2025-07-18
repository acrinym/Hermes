// Config Discovery System for Enterprise Platforms
// This system automatically discovers form patterns and creates configs for new websites

export interface FormField {
  selector: string;
  type: string;
  name: string;
  id: string;
  label: string;
  placeholder: string;
  required: boolean;
  validation: string[];
  commonValues: string[];
  confidence: number;
  isLargeText?: boolean;
  textAreaConfig?: TextAreaConfig;
}

export interface TextAreaConfig {
  maxLength?: number;
  rows?: number;
  cols?: number;
  autoResize?: boolean;
  placeholder?: string;
  defaultValue?: string;
  template?: string;
}

export interface FormPattern {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  submitButton: string;
  formSelector: string;
  confidence: number;
  usageCount: number;
  lastSeen: number;
}

export interface PlatformConfig {
  domain: string;
  platform: string; // 'servicenow', 'remedy', 'salesforce', etc.
  patterns: FormPattern[];
  macros: MacroTemplate[];
  settings: PlatformSettings;
  version: string;
  createdAt: number;
  updatedAt: number;
}

export interface MacroTemplate {
  name: string;
  description: string;
  events: MacroEvent[];
  triggers: string[];
  category: string;
}

export interface MacroEvent {
  type: 'click' | 'input' | 'select' | 'wait' | 'navigate';
  selector: string;
  value?: string;
  delay?: number;
  condition?: string;
}

export interface PlatformSettings {
  autoFill: boolean;
  fieldDetection: 'aggressive' | 'conservative' | 'manual';
  validation: boolean;
  logging: boolean;
  syncInterval: number;
  workNotes?: WorkNotesSettings;
  notes?: NotesSettings;
}

export interface WorkNotesSettings {
  enabled: boolean;
  autoTimestamp: boolean;
  includeUser: boolean;
  template: string;
  maxLength?: number;
  appendMode: boolean;
}

export interface NotesSettings {
  enabled: boolean;
  autoTimestamp: boolean;
  template: string;
  maxLength?: number;
  appendMode: boolean;
}

export interface DiscoverySession {
  id: string;
  domain: string;
  timestamp: number;
  patterns: FormPattern[];
  screenshots: string[];
  metadata: DiscoveryMetadata;
}

export interface DiscoveryMetadata {
  userAgent: string;
  viewport: { width: number; height: number };
  pageTitle: string;
  url: string;
  formsCount: number;
  fieldsCount: number;
  platformHints: string[];
}

// Common field patterns for enterprise platforms
const ENTERPRISE_FIELD_PATTERNS = {
  servicenow: {
    ticket: ['number', 'sys_id', 'short_description', 'description', 'category', 'subcategory'],
    user: ['caller_id', 'assigned_to', 'opened_by', 'closed_by'],
    priority: ['priority', 'urgency', 'impact'],
    status: ['state', 'status', 'work_notes'],
    dates: ['opened_at', 'closed_at', 'due_date', 'sla_due'],
    notes: ['work_notes', 'close_notes', 'resolution_notes', 'comments']
  },
  remedy: {
    ticket: ['Request_ID', 'Summary', 'Description', 'Category', 'Subcategory'],
    user: ['Submitter', 'Assignee', 'Owner', 'Requester'],
    priority: ['Priority', 'Urgency', 'Impact'],
    status: ['Status', 'State', 'Work_Log'],
    dates: ['Submit_Date', 'Due_Date', 'Resolution_Date'],
    notes: ['Work_Notes', 'Notes', 'Resolution_Notes', 'Comments', 'Work_Log', 'Journal_Updates']
  },
  salesforce: {
    contact: ['FirstName', 'LastName', 'Email', 'Phone', 'Title', 'Company'],
    account: ['Name', 'Type', 'Industry', 'BillingAddress', 'ShippingAddress'],
    opportunity: ['Name', 'Amount', 'StageName', 'CloseDate', 'Type'],
    lead: ['FirstName', 'LastName', 'Company', 'Email', 'Phone', 'Status'],
    notes: ['Description', 'Comments', 'Notes', 'Activity_History']
  },
  jira: {
    issue: ['summary', 'description', 'project', 'issuetype', 'priority'],
    user: ['reporter', 'assignee', 'watcher'],
    workflow: ['status', 'resolution', 'worklog'],
    custom: ['customfield_*'],
    notes: ['description', 'comment', 'worklog', 'activity']
  }
};

// Large text area patterns that need special handling
const LARGE_TEXT_PATTERNS = {
  work_notes: /work.?notes?|work.?log|journal|activity.?log/i,
  notes: /notes?|comments?|description|details|summary/i,
  resolution: /resolution|resolution.?notes?|close.?notes?|final.?notes?/i,
  history: /history|timeline|activity|audit.?trail/i,
  attachments: /attachment|file|document|upload/i
};

// Field type detection patterns
const FIELD_TYPE_PATTERNS = {
  email: /email|e-mail|mail/i,
  phone: /phone|tel|mobile|cell/i,
  name: /name|first|last|full/i,
  address: /address|street|city|state|zip|postal/i,
  date: /date|time|created|updated|due/i,
  number: /number|id|amount|quantity|count/i,
  priority: /priority|urgency|impact|severity/i,
  status: /status|state|condition|phase/i,
  description: /description|summary|details|notes|comment/i,
  work_notes: /work.?notes?|work.?log|journal|activity/i,
  notes: /notes?|comments?|description|details/i,
  resolution: /resolution|close.?notes?|final/i
};

export class ConfigDiscoveryService {
  private currentSession: DiscoverySession | null = null;
  private discoveredPatterns: FormPattern[] = [];
  private isDiscovering = false;

  constructor() {
    this.initializeDiscovery();
  }

  private initializeDiscovery() {
    // Listen for form changes
    this.observeFormChanges();
    
    // Auto-detect platform
    this.detectPlatform();
  }

  // Start a new discovery session
  async startDiscovery(domain: string): Promise<DiscoverySession> {
    this.isDiscovering = true;
    
    this.currentSession = {
      id: `discovery_${Date.now()}`,
      domain,
      timestamp: Date.now(),
      patterns: [],
      screenshots: [],
      metadata: await this.gatherMetadata()
    };

    console.log('🔍 Hermes: Started config discovery for', domain);
    
    // Analyze current page
    await this.analyzeCurrentPage();
    
    return this.currentSession;
  }

  // Stop discovery and save results
  async stopDiscovery(): Promise<PlatformConfig | null> {
    if (!this.currentSession) return null;

    this.isDiscovering = false;
    
    // Generate platform config
    const config = await this.generatePlatformConfig();
    
    // Save to storage
    await this.saveConfig(config);
    
    // Upload to server (if enabled)
    await this.uploadConfig(config);
    
    console.log('✅ Hermes: Discovery completed, config saved');
    
    return config;
  }

  // Analyze the current page for forms and patterns
  private async analyzeCurrentPage() {
    if (!this.isDiscovering) return;

    const forms = document.querySelectorAll('form');
    const patterns: FormPattern[] = [];

    forms.forEach((form, index) => {
      const pattern = this.analyzeForm(form, index);
      if (pattern) {
        patterns.push(pattern);
        this.discoveredPatterns.push(pattern);
      }
    });

    // Update session
    if (this.currentSession) {
      this.currentSession.patterns = patterns;
    }

    // Take screenshot for documentation
    await this.captureScreenshot();
  }

  // Analyze individual form
  private analyzeForm(form: HTMLFormElement, index: number): FormPattern | null {
    const fields = form.querySelectorAll('input, select, textarea');
    if (fields.length === 0) return null;

    const analyzedFields: FormField[] = [];
    
    fields.forEach(field => {
      const analyzedField = this.analyzeField(field as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement);
      if (analyzedField) {
        analyzedFields.push(analyzedField);
      }
    });

    if (analyzedFields.length === 0) return null;

    // Find submit button
    const submitButton = this.findSubmitButton(form);
    
    // Generate pattern name
    const patternName = this.generatePatternName(form, analyzedFields);

    return {
      id: `pattern_${index}_${Date.now()}`,
      name: patternName,
      description: `Auto-discovered form pattern for ${patternName}`,
      fields: analyzedFields,
      submitButton: submitButton?.selector || '',
      formSelector: this.generateSelector(form),
      confidence: this.calculateConfidence(analyzedFields),
      usageCount: 1,
      lastSeen: Date.now()
    };
  }

  // Analyze individual field
  private analyzeField(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): FormField | null {
    const selector = this.generateSelector(field);
    const label = this.getFieldLabel(field);
    const type = this.detectFieldType(field, label);
    const validation = this.detectValidation(field);
    const commonValues = this.detectCommonValues(field);
    const confidence = this.calculateFieldConfidence(field, label, type);
    const isLargeText = this.detectLargeTextArea(field, label);
    const textAreaConfig = this.getTextAreaConfig(field, label);

    return {
      selector,
      type: field.type || field.tagName.toLowerCase(),
      name: field.name || '',
      id: field.id || '',
      label: label,
      placeholder: (field as HTMLInputElement).placeholder || '',
      required: field.required,
      validation,
      commonValues,
      confidence,
      isLargeText,
      textAreaConfig
    };
  }

  // Detect field type based on patterns
  private detectFieldType(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, label: string): string {
    const fieldName = field.name.toLowerCase();
    const fieldId = field.id.toLowerCase();
    const labelText = label.toLowerCase();
    const placeholder = (field as HTMLInputElement).placeholder?.toLowerCase() || '';

    // Check explicit type
    if (field.type) {
      return field.type;
    }

    // Check patterns
    for (const [type, pattern] of Object.entries(FIELD_TYPE_PATTERNS)) {
      if (pattern.test(fieldName) || pattern.test(fieldId) || pattern.test(labelText) || pattern.test(placeholder)) {
        return type;
      }
    }

    // Check tag name
    return field.tagName.toLowerCase();
  }

  // Detect validation rules
  private detectValidation(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): string[] {
    const validations: string[] = [];

    if (field.required) validations.push('required');
    
    // Check input-specific properties
    if (field instanceof HTMLInputElement) {
      if (field.pattern) validations.push(`pattern:${field.pattern}`);
      if (field.minLength) validations.push(`minLength:${field.minLength}`);
      if (field.maxLength) validations.push(`maxLength:${field.maxLength}`);
      if (field.min) validations.push(`min:${field.min}`);
      if (field.max) validations.push(`max:${field.max}`);
    }
    
    // Check textarea-specific properties
    if (field instanceof HTMLTextAreaElement) {
      if (field.minLength) validations.push(`minLength:${field.minLength}`);
      if (field.maxLength) validations.push(`maxLength:${field.maxLength}`);
    }

    // Check for common validation patterns
    const fieldName = field.name.toLowerCase();
    if (fieldName.includes('email')) validations.push('email');
    if (fieldName.includes('phone')) validations.push('phone');
    if (fieldName.includes('zip') || fieldName.includes('postal')) validations.push('zipcode');

    return validations;
  }

  // Detect if field is a large text area that needs special handling
  private detectLargeTextArea(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, label: string): boolean {
    // Check if it's a textarea
    if (field.tagName === 'TEXTAREA') return true;
    
    // Check if it's a text input with large size
    if (field instanceof HTMLInputElement && field.type === 'text') {
      const size = field.size || 0;
      const maxLength = field.maxLength || 0;
      if (size > 50 || maxLength > 1000) return true;
    }
    
    // Check label patterns for large text areas
    const fieldName = field.name.toLowerCase();
    const labelText = label.toLowerCase();
    
    for (const [type, pattern] of Object.entries(LARGE_TEXT_PATTERNS)) {
      if (pattern.test(fieldName) || pattern.test(labelText)) {
        return true;
      }
    }
    
    return false;
  }

  // Get configuration for text areas
  private getTextAreaConfig(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, label: string): TextAreaConfig | undefined {
    if (!this.detectLargeTextArea(field, label)) return undefined;
    
    const config: TextAreaConfig = {};
    
    if (field instanceof HTMLTextAreaElement) {
      config.rows = field.rows;
      config.cols = field.cols;
      config.maxLength = field.maxLength || undefined;
    } else if (field instanceof HTMLInputElement) {
      config.maxLength = field.maxLength || undefined;
    }
    
    // Add placeholder if available
    if (field instanceof HTMLInputElement && field.placeholder) {
      config.placeholder = field.placeholder;
    }
    
    // Add template based on field type
    const fieldName = field.name.toLowerCase();
    const labelText = label.toLowerCase();
    
    if (LARGE_TEXT_PATTERNS.work_notes.test(fieldName) || LARGE_TEXT_PATTERNS.work_notes.test(labelText)) {
      config.template = 'work_notes';
      config.autoResize = true;
    } else if (LARGE_TEXT_PATTERNS.notes.test(fieldName) || LARGE_TEXT_PATTERNS.notes.test(labelText)) {
      config.template = 'notes';
      config.autoResize = true;
    } else if (LARGE_TEXT_PATTERNS.resolution.test(fieldName) || LARGE_TEXT_PATTERNS.resolution.test(labelText)) {
      config.template = 'resolution';
      config.autoResize = true;
    }
    
    return config;
  }

  // Detect common values for select fields
  private detectCommonValues(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): string[] {
    if (field.tagName === 'SELECT') {
      const select = field as HTMLSelectElement;
      return Array.from(select.options).map(option => option.value).filter(v => v);
    }
    return [];
  }

  // Calculate confidence score for field
  private calculateFieldConfidence(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, label: string, type: string): number {
    let confidence = 0.5; // Base confidence

    // Boost confidence for well-labeled fields
    if (label && label.length > 0) confidence += 0.2;
    if (field.name && field.name.length > 0) confidence += 0.1;
    if (field.id && field.id.length > 0) confidence += 0.1;

    // Boost for specific field types
    if (type === 'email' || type === 'phone' || type === 'name') confidence += 0.2;

    // Boost for required fields (usually important)
    if (field.required) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  // Calculate overall pattern confidence
  private calculateConfidence(fields: FormField[]): number {
    if (fields.length === 0) return 0;

    const totalConfidence = fields.reduce((sum, field) => sum + field.confidence, 0);
    return totalConfidence / fields.length;
  }

  // Generate robust selector for element
  private generateSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    
    const classes = Array.from(element.classList).filter(c => c.trim());
    if (classes.length > 0) {
      return `.${classes.join('.')}`;
    }

    // Fallback to nth-child
    const parent = element.parentElement;
    if (parent) {
      const index = Array.from(parent.children).indexOf(element) + 1;
      return `${element.tagName.toLowerCase()}:nth-child(${index})`;
    }

    return element.tagName.toLowerCase();
  }

  // Get field label
  private getFieldLabel(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): string {
    // Check for explicit label
    if (field.id) {
      const label = document.querySelector(`label[for="${field.id}"]`);
      if (label) return label.textContent?.trim() || '';
    }

    // Check parent label
    let parent = field.parentElement;
    while (parent && parent !== document.body) {
      const label = parent.querySelector('label');
      if (label) {
        if (!label.getAttribute('for') && label.contains(field)) {
          return label.textContent?.trim() || '';
        }
      }
      parent = parent.parentElement;
    }

    return '';
  }

  // Find submit button
  private findSubmitButton(form: HTMLFormElement): { element: Element; selector: string } | null {
    const submitButton = form.querySelector('input[type="submit"], button[type="submit"], button:not([type])');
    if (submitButton) {
      return {
        element: submitButton,
        selector: this.generateSelector(submitButton)
      };
    }
    return null;
  }

  // Generate pattern name
  private generatePatternName(form: HTMLFormElement, fields: FormField[]): string {
    // Try to find a meaningful name from form attributes
    if (form.id) return `${form.id} Form`;
    if (form.name) return `${form.name} Form`;
    if (form.action) {
      const action = form.action.split('/').pop()?.split('?')[0];
      if (action) return `${action} Form`;
    }

    // Generate name from field types
    const fieldTypes = fields.map(f => f.type).filter((v, i, a) => a.indexOf(v) === i);
    if (fieldTypes.length > 0) {
      return `${fieldTypes.slice(0, 3).join(' ')} Form`;
    }

    return `Form ${Date.now()}`;
  }

  // Detect platform based on page analysis
  private detectPlatform(): string {
    const url = window.location.href.toLowerCase();
    const title = document.title.toLowerCase();
    const bodyText = document.body.textContent?.toLowerCase() || '';

    if (url.includes('servicenow') || title.includes('service now')) return 'servicenow';
    if (url.includes('remedy') || title.includes('bmc remedy')) return 'remedy';
    if (url.includes('salesforce') || title.includes('salesforce')) return 'salesforce';
    if (url.includes('jira') || title.includes('jira')) return 'jira';
    if (url.includes('zendesk') || title.includes('zendesk')) return 'zendesk';
    if (url.includes('freshdesk') || title.includes('freshdesk')) return 'freshdesk';

    return 'unknown';
  }

  // Gather page metadata
  private async gatherMetadata(): Promise<DiscoveryMetadata> {
    return {
      userAgent: navigator.userAgent,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      pageTitle: document.title,
      url: window.location.href,
      formsCount: document.querySelectorAll('form').length,
      fieldsCount: document.querySelectorAll('input, select, textarea').length,
      platformHints: this.detectPlatformHints()
    };
  }

  // Detect platform hints
  private detectPlatformHints(): string[] {
    const hints: string[] = [];
    const bodyText = document.body.textContent?.toLowerCase() || '';

    // Check for common enterprise platform indicators
    if (bodyText.includes('ticket') || bodyText.includes('incident')) hints.push('ticketing');
    if (bodyText.includes('customer') || bodyText.includes('contact')) hints.push('crm');
    if (bodyText.includes('project') || bodyText.includes('task')) hints.push('project_management');
    if (bodyText.includes('support') || bodyText.includes('help')) hints.push('support');

    return hints;
  }

  // Capture screenshot for documentation
  private async captureScreenshot(): Promise<void> {
    if (!this.currentSession) return;

    try {
      // Use html2canvas or similar for screenshot
      // For now, we'll just store the URL
      this.currentSession.screenshots.push(window.location.href);
    } catch (error) {
      console.warn('Failed to capture screenshot:', error);
    }
  }

  // Generate platform config from discovered patterns
  private async generatePlatformConfig(): Promise<PlatformConfig> {
    const domain = window.location.hostname;
    const platform = this.detectPlatform();

    return {
      domain,
      platform,
      patterns: this.discoveredPatterns,
      macros: this.generateMacroTemplates(),
      settings: this.getDefaultSettings(),
      version: '1.0.0',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  // Generate macro templates from patterns
  private generateMacroTemplates(): MacroTemplate[] {
    const templates: MacroTemplate[] = [];

    this.discoveredPatterns.forEach(pattern => {
      // Generate fill form macro
      const events = pattern.fields.map(field => {
        const event: MacroEvent = {
          type: 'input' as const,
          selector: field.selector,
          value: this.generateFieldValue(field),
          delay: field.isLargeText ? 200 : 100 // Longer delay for large text areas
        };
        
        // Add special handling for large text areas
        if (field.isLargeText && field.textAreaConfig) {
          event.condition = `field.type === 'textarea' || field.size > 50`;
          event.value = this.generateTextAreaValue(field);
        }
        
        return event;
      });

      templates.push({
        name: `Fill ${pattern.name}`,
        description: `Automatically fill ${pattern.name} with profile data`,
        events,
        triggers: ['manual', 'hotkey'],
        category: 'form_filling'
      });

      // Generate submit macro
      if (pattern.submitButton) {
        templates.push({
          name: `Submit ${pattern.name}`,
          description: `Submit ${pattern.name}`,
          events: [{
            type: 'click' as const,
            selector: pattern.submitButton,
            delay: 500
          }],
          triggers: ['manual', 'hotkey'],
          category: 'form_submission'
        });
      }

      // Generate work notes specific macro for BMC Remedy
      const workNotesFields = pattern.fields.filter(f => 
        f.isLargeText && f.textAreaConfig?.template === 'work_notes'
      );
      
      if (workNotesFields.length > 0) {
        templates.push({
          name: `Add Work Notes to ${pattern.name}`,
          description: `Add work notes to ${pattern.name}`,
          events: workNotesFields.map(field => ({
            type: 'input' as const,
            selector: field.selector,
            value: this.generateWorkNotesTemplate(field),
            delay: 300
          })),
          triggers: ['manual', 'hotkey'],
          category: 'work_notes'
        });
      }
    });

    return templates;
  }

  // Generate appropriate value for field
  private generateFieldValue(field: FormField): string {
    if (field.isLargeText && field.textAreaConfig?.template) {
      return this.generateTextAreaValue(field);
    }
    
    // Standard field mapping
    const fieldName = field.name.toLowerCase();
    const label = field.label.toLowerCase();
    
    // Map common field types
    if (fieldName.includes('email') || label.includes('email')) return '{{email}}';
    if (fieldName.includes('phone') || label.includes('phone')) return '{{phone}}';
    if (fieldName.includes('name') || label.includes('name')) return '{{name}}';
    if (fieldName.includes('description') || label.includes('description')) return '{{description}}';
    
    return `{{${field.name || field.label.toLowerCase()}}}`;
  }

  // Generate value for text areas
  private generateTextAreaValue(field: FormField): string {
    if (!field.textAreaConfig?.template) {
      return `{{${field.name || field.label.toLowerCase()}}}`;
    }
    
    switch (field.textAreaConfig.template) {
      case 'work_notes':
        return this.generateWorkNotesTemplate(field);
      case 'notes':
        return this.generateNotesTemplate(field);
      case 'resolution':
        return this.generateResolutionTemplate(field);
      default:
        return `{{${field.name || field.label.toLowerCase()}}}`;
    }
  }

  // Generate work notes template for BMC Remedy
  private generateWorkNotesTemplate(field: FormField): string {
    return `[${new Date().toISOString()}] {{user_name}} - {{work_notes}}`;
  }

  // Generate notes template
  private generateNotesTemplate(field: FormField): string {
    return `{{notes}}`;
  }

  // Generate resolution template
  private generateResolutionTemplate(field: FormField): string {
    return `Resolution: {{resolution_notes}}`;
  }

  // Get default platform settings
  private getDefaultSettings(): PlatformSettings {
    const platform = this.detectPlatform();
    
    const baseSettings: PlatformSettings = {
      autoFill: true,
      fieldDetection: 'conservative',
      validation: true,
      logging: true,
      syncInterval: 300000 // 5 minutes
    };

    // Add platform-specific settings
    switch (platform) {
      case 'remedy':
        baseSettings.workNotes = {
          enabled: true,
          autoTimestamp: true,
          includeUser: true,
          template: '[{timestamp}] {user} - {notes}',
          maxLength: 32000, // BMC Remedy typical limit
          appendMode: true
        };
        baseSettings.notes = {
          enabled: true,
          autoTimestamp: false,
          template: '{notes}',
          maxLength: 32000,
          appendMode: false
        };
        break;
        
      case 'servicenow':
        baseSettings.workNotes = {
          enabled: true,
          autoTimestamp: true,
          includeUser: true,
          template: '[{timestamp}] {user}: {notes}',
          maxLength: 4000, // ServiceNow typical limit
          appendMode: true
        };
        baseSettings.notes = {
          enabled: true,
          autoTimestamp: false,
          template: '{notes}',
          maxLength: 4000,
          appendMode: false
        };
        break;
        
      case 'jira':
        baseSettings.workNotes = {
          enabled: true,
          autoTimestamp: true,
          includeUser: true,
          template: '*{timestamp}* {user}: {notes}',
          maxLength: 32767, // Jira limit
          appendMode: true
        };
        baseSettings.notes = {
          enabled: true,
          autoTimestamp: false,
          template: '{notes}',
          maxLength: 32767,
          appendMode: false
        };
        break;
    }

    return baseSettings;
  }

  // Observe form changes for dynamic discovery
  private observeFormChanges() {
    const observer = new MutationObserver((mutations) => {
      if (!this.isDiscovering) return;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && (node as Element).tagName === 'FORM') {
              this.analyzeCurrentPage();
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Save config to local storage
  private async saveConfig(config: PlatformConfig): Promise<void> {
    try {
      const configs = await this.getStoredConfigs();
      configs[config.domain] = config;
      
      await saveDataToBackground('hermes_platform_configs', configs);
      console.log('💾 Hermes: Platform config saved for', config.domain);
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  // Get stored configs
  private async getStoredConfigs(): Promise<Record<string, PlatformConfig>> {
    try {
      const data = await getInitialData();
      return data.platformConfigs || {};
    } catch (error) {
      return {};
    }
  }

  // Upload config to server (for enterprise features)
  private async uploadConfig(config: PlatformConfig): Promise<void> {
    // This would upload to your config repository
    // For now, we'll just log it
    console.log('📤 Hermes: Config ready for upload:', config);
    
    // TODO: Implement actual upload to config repository
    // await fetch('/api/configs', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(config)
    // });
  }

  // Get discovered patterns
  getDiscoveredPatterns(): FormPattern[] {
    return [...this.discoveredPatterns];
  }

  // Get current session
  getCurrentSession(): DiscoverySession | null {
    return this.currentSession;
  }

  // Check if discovery is active
  isDiscoveryActive(): boolean {
    return this.isDiscovering;
  }
}

// Global instance
export const configDiscovery = new ConfigDiscoveryService();

// Import the storage functions
import { saveDataToBackground, getInitialData } from './localCore'; 