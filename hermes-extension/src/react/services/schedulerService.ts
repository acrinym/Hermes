// src/react/services/schedulerService.ts

interface ScheduledMacro {
  name: string;
  scheduledTime: string;
  recurrence: 'once' | 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
}

class SchedulerService {
  private checkInterval: NodeJS.Timeout | null = null;
  private scheduledMacros: ScheduledMacro[] = [];

  constructor() {
    this.loadScheduledMacros();
    this.startScheduler();
  }

  private loadScheduledMacros() {
    try {
      const saved = localStorage.getItem('hermes_scheduled_macros');
      if (saved) {
        this.scheduledMacros = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load scheduled macros:', error);
    }
  }

  private saveScheduledMacros() {
    try {
      localStorage.setItem('hermes_scheduled_macros', JSON.stringify(this.scheduledMacros));
    } catch (error) {
      console.error('Failed to save scheduled macros:', error);
    }
  }

  private startScheduler() {
    // Check every minute for scheduled macros
    this.checkInterval = setInterval(() => {
      this.checkScheduledMacros();
    }, 60000); // Check every minute

    // Also check immediately on startup
    this.checkScheduledMacros();
  }

  private checkScheduledMacros() {
    const now = new Date();
    
    this.scheduledMacros.forEach((macro, index) => {
      if (!macro.enabled) return;

      const scheduledTime = new Date(macro.scheduledTime);
      
      if (scheduledTime <= now) {
        // Execute the macro
        this.executeScheduledMacro(macro);
        
        // Update the next scheduled time based on recurrence
        this.updateNextScheduledTime(macro, index);
      }
    });
  }

  private executeScheduledMacro(macro: ScheduledMacro) {
    try {
      // Load macros from storage
      const savedMacros = localStorage.getItem('hermes_macros_ext');
      if (savedMacros) {
        const macros = JSON.parse(savedMacros);
        const macroData = macros[macro.name];
        
        if (macroData) {
          // Execute the macro using the macro engine
          // This would need to be integrated with the actual macro execution system
          console.log(`Executing scheduled macro: ${macro.name}`);
          
          // For now, we'll just log it. In a real implementation,
          // you'd want to integrate with the macro engine
          alert(`Scheduled macro "${macro.name}" executed at ${new Date().toLocaleString()}`);
        }
      }
    } catch (error) {
      console.error(`Failed to execute scheduled macro ${macro.name}:`, error);
    }
  }

  private updateNextScheduledTime(macro: ScheduledMacro, index: number) {
    const now = new Date();
    let nextTime = new Date(macro.scheduledTime);

    switch (macro.recurrence) {
      case 'once':
        // Disable one-time macros after execution
        this.scheduledMacros[index].enabled = false;
        break;
      case 'daily':
        nextTime.setDate(nextTime.getDate() + 1);
        break;
      case 'weekly':
        nextTime.setDate(nextTime.getDate() + 7);
        break;
      case 'monthly':
        nextTime.setMonth(nextTime.getMonth() + 1);
        break;
    }

    if (macro.recurrence !== 'once') {
      this.scheduledMacros[index].scheduledTime = nextTime.toISOString();
      this.saveScheduledMacros();
    }
  }

  public addScheduledMacro(macro: ScheduledMacro) {
    this.scheduledMacros.push(macro);
    this.saveScheduledMacros();
  }

  public removeScheduledMacro(macroName: string) {
    this.scheduledMacros = this.scheduledMacros.filter(m => m.name !== macroName);
    this.saveScheduledMacros();
  }

  public getScheduledMacros(): ScheduledMacro[] {
    return [...this.scheduledMacros];
  }

  public stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// Create a singleton instance
export const schedulerService = new SchedulerService(); 