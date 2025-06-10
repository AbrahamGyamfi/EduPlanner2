/**
 * File utility functions for handling uploads and processing
 */

/**
 * Processes a file upload and returns file information
 * @param {File} file - The file object from the input element
 * @returns {Promise<Object>} The processed file information
 */
export const processFileUpload = async (file) => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        resolve({
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
          content: event.target.result,
        });
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      if (file.type.includes('image')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Validates file type and size
 * @param {File} file - The file to validate
 * @param {Array<string>} allowedTypes - Array of allowed MIME types
 * @param {number} maxSizeInMB - Maximum file size in MB
 * @returns {boolean} Whether the file is valid
 */
export const validateFile = (file, allowedTypes = [], maxSizeInMB = 10) => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  
  if (file.size > maxSizeInBytes) {
    return {
      valid: false,
      error: `File size exceeds the maximum allowed size of ${maxSizeInMB}MB`
    };
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not supported. Allowed types: ${allowedTypes.join(', ')}`
    };
  }
  
  return { valid: true };
};

/**
 * Extracts content from a file based on its type
 * @param {File} file - The file to extract content from
 * @returns {Promise<string>} The extracted content as text
 */
export const extractFileContent = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        let content = event.target.result;
        
        // For text-based files, return the content directly
        if (file.type.includes('text') || 
            file.type.includes('application/pdf') || 
            file.type.includes('application/json') ||
            file.type.includes('application/xml') ||
            file.type.includes('application/javascript')) {
          resolve(content);
        } 
        // For binary files, return information about the file
        else {
          resolve(`File type: ${file.type}, Size: ${(file.size / 1024).toFixed(2)} KB`);
        }
      } catch (error) {
        reject(new Error(`Failed to process file content: ${error.message}`));
      }
    };
    
    reader.onerror = (error) => {
      reject(new Error(`Error reading file: ${error}`));
    };
    
    if (file.type.includes('text') || 
        file.type.includes('application/json') || 
        file.type.includes('application/xml') || 
        file.type.includes('application/javascript')) {
      reader.readAsText(file);
    } else if (file.type.includes('application/pdf')) {
      // For PDFs we just return the data URL
      reader.readAsDataURL(file);
    } else {
      // For other binary files
      reader.readAsArrayBuffer(file);
    }
  });
};
