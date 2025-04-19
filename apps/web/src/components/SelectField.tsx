'use client';

interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  error?: string;
  placeholder?: string;
  required?: boolean;
}

export default function SelectField({ 
  label, 
  name, 
  value, 
  onChange, 
  options, 
  error,
  placeholder = 'Select an option',
  required = false 
}: SelectFieldProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative rounded-md shadow-sm">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={`block w-full pl-3 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-700 ${
            error ? 'border-red-300' : 'border-gray-300'
          } ${!value ? 'text-gray-400' : ''}`}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
} 