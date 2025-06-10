/**
 * Utilities for course-related functionality
 */

// Get an appropriate icon based on course title
const getCourseIcon = (title = '') => {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('math') || titleLower.includes('calculus') || titleLower.includes('algebra')) {
    return 'calculator';
  }
  else if (titleLower.includes('computer') || titleLower.includes('programming') || titleLower.includes('software')) {
    return 'laptop-code';
  }
  else if (titleLower.includes('chemistry') || titleLower.includes('bio') || titleLower.includes('physics')) {
    return 'flask';
  }
  else if (titleLower.includes('history') || titleLower.includes('world')) {
    return 'globe';
  }
  else if (titleLower.includes('english') || titleLower.includes('literature')) {
    return 'book-open';
  }
  else if (titleLower.includes('art') || titleLower.includes('design')) {
    return 'palette';
  }
  else if (titleLower.includes('music')) {
    return 'music';
  }
  else if (titleLower.includes('econ') || titleLower.includes('business') || titleLower.includes('finance')) {
    return 'chart-line';
  }
  else if (titleLower.includes('psych')) {
    return 'brain';
  }
  
  // Default icon
  return 'graduation-cap';
};

export { getCourseIcon };
