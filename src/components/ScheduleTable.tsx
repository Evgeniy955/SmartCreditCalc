
import React, { useState } from 'react';
import { AmortizationPayment } from '../types';
import { formatCurrency } from '../utils/financial';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

interface ScheduleTableProps {
  schedule: AmortizationPayment[];
}

const ScheduleTable: React.FC<ScheduleTableProps> = ({ schedule }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(12);

  const toggleOpen = () => setIsOpen(!isOpen);
  const showMore = () => setDisplayCount(prev => Math.min(prev + 24, schedule.length));

  if (!isOpen) {
    return (
        <button 
            onClick={toggleOpen}
            className="w-full flex items-center justify-center gap-2 p-4 mt-6 bg-white rounded-xl shadow-sm border border-gray-200 text-indigo-600 font-medium hover:bg-gray-50 transition-colors"
        >
            Показати графік платежів <ChevronDown size={20} />
        </button>
    );
  }

  return (
    <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
        <h3 className="text-lg font-bold text-gray-800">Графік платежів</h3>
        <button onClick={toggleOpen} className="text-gray-500 hover:text-gray-700">
            <ChevronUp size={20} />
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium">
            <tr>
              <th className="px-6 py-3">Дата платежу</th>
              <th className="px-6 py-3">Платіж</th>
              <th className="px-6 py-3 text-indigo-600">Тіло кредиту</th>
              <th className="px-6 py-3 text-rose-600">Комісія</th>
              <th className="px-6 py-3">Залишок</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {schedule.slice(0, displayCount).map((row) => (
              <tr 
                key={row.month} 
                className={`transition-colors ${row.isPenaltyMonth ? 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500' : 'hover:bg-gray-50'}`}
              >
                <td className="px-6 py-3 font-medium text-gray-900 capitalize flex items-center gap-2">
                    {row.paymentDate}
                    {row.isPenaltyMonth && (
                        <span title="В цьому місяці нараховано штраф за вихід з пільгового періоду">
                            <AlertTriangle size={16} className="text-red-500" />
                        </span>
                    )}
                </td>
                <td className={`px-6 py-3 ${row.isPenaltyMonth ? 'font-bold text-red-700' : ''}`}>
                    {formatCurrency(row.payment)}
                </td>
                <td className="px-6 py-3 text-gray-600">{formatCurrency(row.principal)}</td>
                <td className={`px-6 py-3 ${row.isPenaltyMonth ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                    {formatCurrency(row.interest)}
                </td>
                <td className="px-6 py-3 font-medium text-gray-900">{formatCurrency(row.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {displayCount < schedule.length && (
        <div className="p-4 border-t border-gray-100 text-center">
          <button 
            onClick={showMore}
            className="text-indigo-600 font-medium text-sm hover:text-indigo-800"
          >
            Завантажити ще...
          </button>
        </div>
      )}
    </div>
  );
};

export default ScheduleTable;
