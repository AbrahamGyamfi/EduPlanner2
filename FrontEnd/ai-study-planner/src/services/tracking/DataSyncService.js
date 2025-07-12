// Data Synchronization Service - System Only Mode
import SystemDataValidator from '../security/SystemDataValidator';

class DataSyncService {
  constructor() {
    this.syncQueue = [];
    this.lastSync = Date.now();
    this.syncInterval = 5 * 60 * 1000; // 5 minutes
    this.maxQueueSize = 50;
    this.isSyncing = false;
    this.validator = new SystemDataValidator();
  }

  queueData(data) {
    // Validate that data comes from system source only
    if (!this.validator.validateSystemSource(data, data.source || 'unknown')) {
      console.warn('Rejected non-system data in queue:', data);
      return false;
    }

    // Sanitize the data
    const sanitizedData = this.validator.sanitizeSystemData(data);
    
    this.syncQueue.push({
      ...sanitizedData,
      timestamp: Date.now(),
      deviceInfo: this.getDeviceInfo(),
      environmentInfo: this.getEnvironmentInfo(),
      systemValidated: true
    });

    if (this.syncQueue.length >= this.maxQueueSize) {
      this.sync();
    }
    
    return true;
  }

  getDeviceInfo() {
    return {
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      userAgent: navigator.userAgent,
      platform: navigator.platform
    };
  }

  getEnvironmentInfo() {
    return {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      timestamp: new Date().toISOString()
    };
  }

  async sync() {
    if (this.isSyncing || this.syncQueue.length === 0) return;

    // Filter out any non-system data that might have slipped through
    const systemOnlyData = this.syncQueue.filter(item => 
      item.systemValidated && 
      item.source === 'system'
    );

    if (systemOnlyData.length === 0) {
      console.warn('No valid system data to sync');
      this.syncQueue = [];
      return false;
    }

    this.isSyncing = true;
    try {
      const response = await fetch('/api/sync-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-System-Auth': this.validator.systemSignature,
          'X-Data-Source': 'system-only'
        },
        body: JSON.stringify({
          data: systemOnlyData,
          timestamp: new Date().toISOString(),
          systemSignature: this.validator.systemSignature,
          dataSource: 'system'
        })
      });

      if (response.ok) {
        this.syncQueue = [];
        this.lastSync = Date.now();
        return true;
      } else {
        console.error('Sync failed:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('Sync error:', error);
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  startAutoSync() {
    setInterval(() => {
      this.sync();
    }, this.syncInterval);
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }

  getSyncStatus() {
    return {
      queueSize: this.syncQueue.length,
      lastSync: this.lastSync,
      isSyncing: this.isSyncing
    };
  }

  async forceSyncNow() {
    return await this.sync();
  }
}

export default DataSyncService; 