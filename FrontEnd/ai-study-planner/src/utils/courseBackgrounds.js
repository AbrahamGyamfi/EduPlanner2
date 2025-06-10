/**
 * A collection of gradient backgrounds for course cards
 * Each background is a CSS gradient string
 */

const courseBackgrounds = [
  {
    id: 'blue-gradient',
    gradient: 'linear-gradient(135deg, #2980b9 0%, #6dd5fa 100%)',
    textColor: 'white'
  },
  {
    id: 'purple-gradient',
    gradient: 'linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)',
    textColor: 'white'
  },
  {
    id: 'green-gradient',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    textColor: 'white'
  },
  {
    id: 'orange-gradient',
    gradient: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',
    textColor: 'white'
  },
  {
    id: 'red-gradient',
    gradient: 'linear-gradient(135deg, #d31027 0%, #ea384d 100%)',
    textColor: 'white'
  },
  {
    id: 'pink-gradient',
    gradient: 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)',
    textColor: 'white'
  },
  {
    id: 'teal-gradient',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    textColor: 'white'
  },
  {
    id: 'indigo-gradient',
    gradient: 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)', 
    textColor: 'white'
  },
  {
    id: 'cyan-gradient',
    gradient: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
    textColor: 'white'
  },
  {
    id: 'dark-blue-gradient',
    gradient: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    textColor: 'white'
  },
];

// Function to get a background by index or randomly
const getBackground = (index = null) => {
  if (index !== null && index >= 0 && index < courseBackgrounds.length) {
    return courseBackgrounds[index];
  }
  
  // Return a random background
  const randomIndex = Math.floor(Math.random() * courseBackgrounds.length);
  return courseBackgrounds[randomIndex];
};

export { courseBackgrounds, getBackground };
