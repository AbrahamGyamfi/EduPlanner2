import React from 'react';

const FormInput = ({ 
  label, 
  type = 'text', 
  id, 
  name, 
  value, 
  onChange, 
  placeholder = '', 
  required = false,
  error = null 
}) => {
  return (
    <div className="mb-4">
      <label 
        htmlFor={id} 
        className="block text-sm font-semibold text-gray-800 mb-2"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3 py-2.5 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent shadow-sm text-gray-900 font-medium`}
      />
      {error && <p className="mt-1 text-sm text-red-600 font-medium">{error}</p>}
    </div>
  );
};

export default FormInput;
