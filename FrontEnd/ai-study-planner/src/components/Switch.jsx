import React from 'react';

const Switch = ({ enabled, setEnabled }) => {
  return (
    <button
      type="button"
      className={`
        relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer 
        transition-colors ease-in-out duration-200 focus:outline-none
        ${enabled ? 'bg-indigo-600' : 'bg-gray-200'}
      `}
      role="switch"
      aria-checked={enabled}
      onClick={() => setEnabled(!enabled)}
    >
      <span className="sr-only">Toggle setting</span>
      <span
        aria-hidden="true"
        className={`
          pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform 
          ring-0 transition ease-in-out duration-200
          ${enabled ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
};

export default Switch;
