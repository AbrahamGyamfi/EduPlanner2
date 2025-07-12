// System Data Validator - Ensures only system-generated data is processed
class SystemDataValidator {
  constructor() {
    this.systemSecret = process.env.REACT_APP_SYSTEM_SECRET || 'default-system-secret';
    this.allowedSources = ['system', 'automated', 'internal'];
    this.systemSignature = this.generateSystemSignature();
  }

  generateSystemSignature() {
    const timestamp = Date.now();
    const systemId = 'edu-master-system';
    return btoa(`${systemId}:${timestamp}:${this.systemSecret}`);
  }

  // Validate that data comes from system sources only
  validateSystemSource(data, source = 'unknown') {
    if (!this.allowedSources.includes(source)) {
      console.warn(`Rejected data from unauthorized source: ${source}`);
      return false;
    }

    // Check for system signature
    if (!data.systemSignature || data.systemSignature !== this.systemSignature) {
      console.warn('Data missing valid system signature');
      return false;
    }

    return true;
  }

  // Sanitize and validate system data
  sanitizeSystemData(data) {
    const sanitized = {};
    
    // Only allow specific system-generated fields
    const allowedFields = [
      'studentId', 'courseId', 'assignmentId', 'sessionId',
      'timestamp', 'systemMetrics', 'behaviorData', 'analyticsData',
      'systemSignature', 'source'
    ];

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
        sanitized[key] = this.sanitizeValue(value);
      }
    }

    return sanitized;
  }

  sanitizeValue(value) {
    if (typeof value === 'string') {
      // Remove any potential injection attempts
      return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                  .replace(/javascript:/gi, '')
                  .replace(/on\w+\s*=/gi, '');
    }
    
    if (typeof value === 'object' && value !== null) {
      return this.sanitizeSystemData(value);
    }

    return value;
  }

  // Generate system-only data with proper signature
  generateSystemData(dataType, payload = {}) {
    return {
      ...payload,
      systemSignature: this.systemSignature,
      source: 'system',
      timestamp: new Date().toISOString(),
      dataType,
      systemId: 'edu-master-system'
    };
  }

  // Block user input and redirect to system data collection
  blockUserInput(inputElement) {
    if (inputElement) {
      inputElement.disabled = true;
      inputElement.readOnly = true;
      inputElement.style.backgroundColor = '#f3f4f6';
      inputElement.style.cursor = 'not-allowed';
      inputElement.title = 'Input disabled - System uses automated data collection';
    }
  }

  // Validate API requests to ensure they're system-generated
  validateApiRequest(requestData) {
    if (!requestData.headers || !requestData.headers['X-System-Auth']) {
      return false;
    }

    const systemAuth = requestData.headers['X-System-Auth'];
    return systemAuth === this.systemSignature;
  }
}

export default SystemDataValidator;
