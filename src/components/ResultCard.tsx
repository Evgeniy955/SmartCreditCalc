import React from 'react';

interface ResultCardProps {
  title: string;
  value: string;
  subValue?: string;
  color?: 'indigo' | 'red' | 'green';
}

const ResultCard: React.FC<ResultCardProps> = ({ title, value, subValue, color = 'indigo' }) => {
  const colorClasses = {
    indigo: 'text-indigo-600 bg-indigo-50',
    red: 'text-rose-600 bg-rose-50',
    green: 'text-emerald-600 bg-emerald-50',
  };

  return (
    <div className={`p-5 rounded-xl border border-opacity-50 ${colorClasses[color].replace('text-', 'border-')}`}>
      <h3 className="text-sm text-gray-500 font-medium mb-1">{title}</h3>
      <p className={`text-2xl font-bold ${color === 'indigo' ? 'text-gray-900' : colorClasses[color].split(' ')[0]}`}>
        {value}
      </p>
      {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
    </div>
  );
};

export default ResultCard;