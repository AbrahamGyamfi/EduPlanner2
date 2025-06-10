// Data Synchronization Service
class DataSyncService {
  constructor() {
    this.syncQueue = [];
    this.lastSync = Date.now();
    this.syncInterval = 5 * 60 * 1000; // 5 minutes
    this.maxQueueSize = 50;
    this.isSyncing = false;
  }

  queueData(data) {
    this.syncQueue.push({
      ...data,
      timestamp: Date.now(),
      deviceInfo: this.getDeviceInfo(),
      environmentInfo: this.getEnvironmentInfo()
    });

    if (this.syncQueue.length >= this.maxQueueSize) {
      this.sync();
    }
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

    this.isSyncing = true;
    try {
      const response = await fetch('/api/sync-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: this.syncQueue,
          timestamp: new Date().toISOString()
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