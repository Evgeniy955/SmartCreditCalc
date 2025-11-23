
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { LoanResult } from '../types';

interface ChartProps {
    data: LoanResult;
    loanAmount: number;
}

const AmortizationChart: React.FC<ChartProps> = ({ data, loanAmount }) => {
    const pieData = [
        { name: 'Тіло кредиту', value: loanAmount },
        { name: 'Комісія', value: data.totalInterest },
    ];

    const COLORS = ['#4f46e5', '#f43f5e']; // Indigo-600, Rose-500

    // Downsample schedule for area chart if too many points
    const chartData = data.schedule.filter((_, index) => index % Math.ceil(data.schedule.length / 20) === 0 || index === data.schedule.length - 1 || _.isPenaltyMonth);

    // Helper to shorten date for X-Axis (e.g., "20 листоп 2025" -> "лис 2025")
    const formatXAxisDate = (dateStr: string) => {
        const parts = dateStr.split(' ');
        if (parts.length >= 3) {
            // return Month (short) + Year. Assuming format "20 листопада 2025"
            // Simple substring of month
            return `${parts[1].substring(0, 3)} ${parts[2].substring(2)}`;
        }
        return dateStr;
    };

    // Custom Dot for Area Chart to highlight penalty
    const CustomizedDot = (props: any) => {
        const { cx, cy, payload } = props;
        if (payload.isPenaltyMonth) {
            return (
                <svg x={cx - 10} y={cy - 10} width={20} height={20} fill="red" viewBox="0 0 1024 1024">
                    <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z" opacity="0.4" />
                    <path d="M464 688a48 48 0 1 0 96 0 48 48 0 1 0-96 0zM488 576h48c4.4 0 8-3.6 8-8V296c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8z" fill="#f43f5e" />
                </svg>
            );
        }
        return null;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 h-80 flex flex-col items-center justify-center">
                <h3 className="text-gray-700 font-semibold mb-4 self-start w-full text-center md:text-left">Структура виплат</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {pieData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number) => new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(value)}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Area Chart */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 h-80">
                <h3 className="text-gray-700 font-semibold mb-4">Графік залишку боргу</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                            dataKey="paymentDate"
                            tickFormatter={formatXAxisDate}
                            tick={{fontSize: 12, fill: '#94a3b8'}}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} tick={{fontSize: 12, fill: '#94a3b8'}} tickLine={false} axisLine={false} />
                        <Tooltip
                            formatter={(value: number) => new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(value)}
                            labelFormatter={(label) => `${label}`}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="balance"
                            stroke="#4f46e5"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorBalance)"
                            dot={<CustomizedDot />}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AmortizationChart;
