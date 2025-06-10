import React from 'react';

const Card = ({ title, children, className = "" }) => {
  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden ${className}`}>
      {title && (
        <div className="bg-gray-50 py-3 px-5 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};

export default Card;
