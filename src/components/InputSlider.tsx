import React from 'react';

interface InputSliderProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
  icon?: React.ReactNode;
}

const InputSlider: React.FC<InputSliderProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  icon
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange(0);
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onChange(num);
    }
  };

  const handleBlur = () => {
    let newValue = value;
    if (value < min) newValue = min;
    // Removed max check to allow manual entry > max slider value
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  return (
    <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          {icon}
          {label}
        </label>
        <div className="flex items-center bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <input
            type="number"
            min={min}
            step={step}
            value={value.toString()}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className="w-24 text-right font-bold text-indigo-600 text-lg bg-transparent outline-none [-moz-appearance:_textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-sm text-gray-500 font-normal ml-1 select-none">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 transition-all hover:accent-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      />
      <div className="flex justify-between mt-2 text-xs text-gray-400">
        <span>{min.toLocaleString('uk-UA')} {unit}</span>
        <span>{max.toLocaleString('uk-UA')}+ {unit}</span>
      </div>
    </div>
  );
};

export default InputSlider;