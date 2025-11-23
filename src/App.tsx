
import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, DollarSign, Percent, Calendar, Sparkles, ChevronDown, CheckSquare, Square, CalendarDays, Banknote, Divide, Info, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { calculateAnnuityLoan, formatCurrency } from './utils/financial';
import InputSlider from './components/InputSlider';
import ResultCard from './components/ResultCard';
import AmortizationChart from './components/AmortizationChart';
import ScheduleTable from './components/ScheduleTable';
import { getFinancialAdvice } from './services/geminiService';

// Define available loan types
const LOAN_TYPES = [
    { id: 'pumb_installment', name: 'Розстрочка від Банку ПУМБ' },
    { id: 'pumb_credit_card', name: 'Кредитна картка (ПУМБ "всеМОЖУ")' },
    { id: 'monobank_installment', name: 'Розстрочка на картку (Monobank)' },
    { id: 'monobank_black', name: 'Чорна картка (Monobank)' },
];

const App: React.FC = () => {
    // State
    const [selectedLoanType, setSelectedLoanType] = useState<string>(LOAN_TYPES[0].id);

    // Updated default values
    const [amount, setAmount] = useState<number>(3000);
    const [rate, setRate] = useState<number>(1.99);
    const [months, setMonths] = useState<number>(3);
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]); // Default to today YYYY-MM-DD

    // Monobank Black / PUMB Credit Card Special State
    const [isGracePeriodViolation, setIsGracePeriodViolation] = useState<boolean>(false);
    const [isCashWithdrawal, setIsCashWithdrawal] = useState<boolean>(false);
    const [isFeeAmortized, setIsFeeAmortized] = useState<boolean>(false);

    // AI State
    const [aiAdvice, setAiAdvice] = useState<string>('');
    const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
    const [aiError, setAiError] = useState<boolean>(false);

    // Effect to update rate based on loan type and duration rules
    useEffect(() => {
        if (selectedLoanType === 'pumb_installment') {
            // PUMB Logic: 2.99% if >= 12 months, else 1.99%
            if (months >= 12) {
                setRate(2.99);
            } else {
                setRate(1.99);
            }
        } else if (selectedLoanType === 'pumb_credit_card') {
            // PUMB Credit Card Logic: 2.99% per month (35.88% per year)
            setRate(2.99);
        } else if (selectedLoanType === 'monobank_installment') {
            // Monobank Installment Logic: Fixed 1.90%
            setRate(1.90);
        } else if (selectedLoanType === 'monobank_black') {
            // Monobank Black Card Logic: 3.1% per month on balance
            setRate(3.10);
        }

        // Reset checkboxes when switching to types that don't support it
        if (!['monobank_black', 'pumb_credit_card'].includes(selectedLoanType)) {
            setIsGracePeriodViolation(false);
            setIsCashWithdrawal(false);
            setIsFeeAmortized(false);
        }
    }, [selectedLoanType, months]);

    // Reset fee amortization if cash withdrawal is unchecked
    useEffect(() => {
        if (!isCashWithdrawal) {
            setIsFeeAmortized(false);
        }
    }, [isCashWithdrawal]);

    // Calculated Results
    const result = useMemo(() => {
        return calculateAnnuityLoan(amount, rate, months, selectedLoanType, startDate, isGracePeriodViolation, isCashWithdrawal, isFeeAmortized);
    }, [amount, rate, months, selectedLoanType, startDate, isGracePeriodViolation, isCashWithdrawal, isFeeAmortized]);

    // Get current loan type name for display/AI
    const currentLoanTitle = LOAN_TYPES.find(t => t.id === selectedLoanType)?.name || 'Кредит';

    // Handlers
    const handleAiAdvice = async () => {
        setIsLoadingAi(true);
        setAiError(false);
        setAiAdvice('');

        try {
            const advice = await getFinancialAdvice(
                { amount, rate, months },
                result,
                currentLoanTitle,
                selectedLoanType,
                isGracePeriodViolation,
                isCashWithdrawal,
                isFeeAmortized
            );
            setAiAdvice(advice);
        } catch (e) {
            setAiError(true);
        } finally {
            setIsLoadingAi(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f3f4f6] py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <header className="mb-10 text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-2xl shadow-lg mb-4">
                        <Calculator className="text-white h-8 w-8" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                        Кредитний <span className="text-indigo-600">Калькулятор</span>
                    </h1>

                    {/* Loan Type Selector */}
                    <div className="mt-6 max-w-md mx-auto relative">
                        <label htmlFor="loanType" className="block text-sm font-medium text-gray-500 mb-2">
                            Оберіть тип кредитного продукту
                        </label>
                        <div className="relative">
                            <select
                                id="loanType"
                                value={selectedLoanType}
                                onChange={(e) => setSelectedLoanType(e.target.value)}
                                className="block w-full pl-4 pr-10 py-3 text-base border-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-xl shadow-sm appearance-none bg-white cursor-pointer font-medium text-gray-800"
                            >
                                {LOAN_TYPES.map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.name}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                <ChevronDown size={16} />
                            </div>
                        </div>
                    </div>

                    <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                        Розрахуйте платежі для <span className="font-semibold text-indigo-700">{currentLoanTitle}</span>, оцініть витрати та отримайте пораду ШІ.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Inputs */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 sticky top-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <span className="w-1 h-6 bg-indigo-600 rounded-full"></span>
                                Параметри кредиту
                            </h2>

                            <InputSlider
                                label="Сума кредита"
                                value={amount}
                                onChange={setAmount}
                                min={1000}
                                max={50000}
                                step={0.01}
                                unit="₴"
                                icon={<DollarSign size={16} className="text-indigo-500" />}
                            />

                            <InputSlider
                                label={['monobank_black', 'pumb_credit_card'].includes(selectedLoanType) ? "Відсоткова ставка" : "Щомісячна комісія"}
                                value={rate}
                                onChange={setRate}
                                min={0.01}
                                max={12}
                                step={0.01}
                                unit="%/міс"
                                icon={<Percent size={16} className="text-indigo-500" />}
                            />

                            <InputSlider
                                label="Термін кредиту"
                                value={months}
                                onChange={setMonths}
                                min={1}
                                max={36}
                                step={1}
                                unit="міс."
                                icon={<Calendar size={16} className="text-indigo-500" />}
                            />

                            {/* Start Date Input */}
                            <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                                    <CalendarDays size={16} className="text-indigo-500" />
                                    Дата оформлення
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Special Checkboxes for Credit Cards */}
                            {['monobank_black', 'pumb_credit_card'].includes(selectedLoanType) && (
                                <div className="space-y-4">
                                    {/* Cash Withdrawal Checkbox */}
                                    <label className="flex items-start gap-3 p-3 rounded-lg border border-amber-100 bg-amber-50/50 cursor-pointer hover:bg-amber-50 transition-colors">
                                        <div className="relative flex items-center h-5">
                                            <input
                                                type="checkbox"
                                                checked={isCashWithdrawal}
                                                onChange={(e) => setIsCashWithdrawal(e.target.checked)}
                                                className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 shadow-sm checked:border-amber-500 checked:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1"
                                            />
                                            <CheckSquare className="pointer-events-none absolute h-5 w-5 text-white opacity-0 peer-checked:opacity-100" size={16} />
                                            <Square className="pointer-events-none absolute h-5 w-5 text-gray-300 peer-checked:opacity-0" size={16} />
                                        </div>
                                        <div className="text-sm">
                      <span className="font-medium text-gray-900 block flex items-center gap-2">
                         <Banknote size={14} /> Це зняття готівки або переказ
                      </span>
                                            <span className="text-gray-500 text-xs">
                         Додається разова комісія (4% Моно, 3.99% ПУМБ).
                                                {selectedLoanType === 'monobank_black' ? ' У Моно пільговий період скасовується!' : ' У ПУМБ пільговий період діє.'}
                      </span>
                                        </div>
                                    </label>

                                    {/* Fee Amortization Checkbox - Nested */}
                                    {isCashWithdrawal && (
                                        <label className="flex items-start gap-3 p-3 ml-6 rounded-lg border border-gray-200 bg-white cursor-pointer hover:bg-gray-50 transition-colors animate-in slide-in-from-top-2">
                                            <div className="relative flex items-center h-5">
                                                <input
                                                    type="checkbox"
                                                    checked={isFeeAmortized}
                                                    onChange={(e) => setIsFeeAmortized(e.target.checked)}
                                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 shadow-sm checked:border-gray-600 checked:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
                                                />
                                                <CheckSquare className="pointer-events-none absolute h-5 w-5 text-white opacity-0 peer-checked:opacity-100" size={16} />
                                                <Square className="pointer-events-none absolute h-5 w-5 text-gray-300 peer-checked:opacity-0" size={16} />
                                            </div>
                                            <div className="text-sm">
                        <span className="font-medium text-gray-900 block flex items-center gap-2">
                            <Divide size={14} /> Розбити комісію на весь термін
                        </span>
                                                <span className="text-gray-500 text-xs">
                            Комісія не сплачується відразу, а ділиться рівними частинами на {months} міс.
                        </span>
                                            </div>
                                        </label>
                                    )}

                                    {/* Penalty Checkbox */}
                                    <label className="flex items-start gap-3 p-3 rounded-lg border border-indigo-100 bg-indigo-50/50 cursor-pointer hover:bg-indigo-50 transition-colors">
                                        <div className="relative flex items-center h-5">
                                            <input
                                                type="checkbox"
                                                checked={isGracePeriodViolation}
                                                onChange={(e) => setIsGracePeriodViolation(e.target.checked)}
                                                className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 shadow-sm checked:border-indigo-600 checked:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                                            />
                                            <CheckSquare className="pointer-events-none absolute h-5 w-5 text-white opacity-0 peer-checked:opacity-100" size={16} />
                                            <Square className="pointer-events-none absolute h-5 w-5 text-gray-300 peer-checked:opacity-0" size={16} />
                                        </div>
                                        <div className="text-sm">
                                            <span className="font-medium text-gray-900 block">Розрахувати виліт з пільгового періоду</span>
                                            <span className="text-gray-500 text-xs">
                        {selectedLoanType === 'pumb_credit_card'
                            ? "Якщо не погасили до 30-го числа наст. місяця. Штрафні % за фактичні дні."
                            : "Якщо не погасили до 62 днів. Штрафні % за минулі 2 місяці."
                        }
                      </span>
                                        </div>
                                    </label>
                                </div>
                            )}

                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <div className="bg-indigo-50 p-4 rounded-xl flex items-start gap-3">
                                    <Info className="text-indigo-600 shrink-0 mt-0.5" size={20} />
                                    <div className="text-sm text-indigo-900 leading-relaxed">
                                        <p className="font-bold text-indigo-800 mb-2 border-b border-indigo-100 pb-1">Умови та особливості:</p>
                                        <ul className="list-disc pl-4 space-y-2">
                                            {selectedLoanType === 'pumb_installment' && (
                                                <>
                                                    <li>
                                                        <b>Тип нарахування:</b> Комісія на <span className="text-rose-600 font-bold">ПОЧАТКОВУ</span> суму кредиту.
                                                        <br/><span className="text-xs text-gray-500">Це означає, що навіть коли ви виплатите 90% боргу, комісія нараховується на всі 100% суми.</span>
                                                    </li>
                                                    <li><b>Ставка:</b> 1.99% (до 12 міс), 2.99% (від 12 міс).</li>
                                                    <li><b>Реальна вартість:</b> Ефективна ставка значно вища за номінальну (~40-60% річних).</li>
                                                </>
                                            )}
                                            {selectedLoanType === 'pumb_credit_card' && (
                                                <>
                                                    <li><b>Тип нарахування:</b> Класичний (на залишок боргу).</li>
                                                    <li>
                                                        <b>Зняття готівки/Переказ:</b> Разова комісія <span className="font-bold text-rose-600">3.99%</span>.
                                                        <br/><span className="text-emerald-700 font-semibold text-xs">✓ Пільговий період ЗБЕРІГАЄТЬСЯ (до 62 днів).</span>
                                                    </li>
                                                    <li>
                                                        <b><span className="text-rose-600">Небезпечно!</span> Дата погашення:</b>
                                                        Завжди <span className="font-bold underline">30-те число</span> наступного місяця. Це може бути менше ніж 62 дні (наприклад, якщо купили 29-го).
                                                    </li>
                                                </>
                                            )}
                                            {selectedLoanType === 'monobank_installment' && (
                                                <>
                                                    <li>
                                                        <b>Тип нарахування:</b> Комісія на <span className="text-rose-600 font-bold">ПОЧАТКОВУ</span> суму кредиту.
                                                    </li>
                                                    <li><b>Ставка:</b> 1.90% фіксована на місяць.</li>
                                                    <li><b>Особливість:</b> Зазвичай списується в день покупки.</li>
                                                </>
                                            )}
                                            {selectedLoanType === 'monobank_black' && (
                                                <>
                                                    <li><b>Тип нарахування:</b> Класичний (на залишок боргу).</li>
                                                    <li><b>Ставка:</b> 3.1% на місяць (реальна ставка ~44% річних).</li>
                                                    <li>
                                                        <b>Зняття готівки:</b> Разова комісія <span className="font-bold text-rose-600">4%</span>.
                                                        <br/><span className="text-rose-600 font-bold text-xs">⚠ Пільговий період ЗНИКАЄ миттєво!</span> Відсотки (3.1%) починають капати з першого ж дня.
                                                    </li>
                                                </>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Results & Charts */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <ResultCard
                                title={(isGracePeriodViolation || (isCashWithdrawal && !isFeeAmortized)) ? "Перший платіж (пік)" : "Щомісячний платіж"}
                                value={(isGracePeriodViolation || (isCashWithdrawal && !isFeeAmortized)) ? formatCurrency(result.schedule[0]?.payment || 0) : formatCurrency(result.monthlyPayment)}
                                subValue={(isGracePeriodViolation || (isCashWithdrawal && !isFeeAmortized)) ? `Базовий: ${formatCurrency(result.monthlyPayment)}` : undefined}
                                color="indigo"
                            />
                            <ResultCard
                                title={['monobank_black', 'pumb_credit_card'].includes(selectedLoanType) ? "Всього відсотків/комісій" : "Комісія (переплата)"}
                                value={formatCurrency(result.totalInterest)}
                                subValue={`${((result.totalInterest / result.totalPayment) * 100).toFixed(1)}% від заг. суми`}
                                color="red"
                            />
                            <ResultCard
                                title="Загальна виплата"
                                value={formatCurrency(result.totalPayment)}
                                color="green"
                            />
                        </div>

                        {/* Charts */}
                        <AmortizationChart data={result} loanAmount={amount} />

                        {/* AI Advisor Section */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-900 rounded-2xl shadow-xl overflow-hidden text-white">
                            <div className="p-6 sm:p-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <Sparkles className="text-yellow-400" />
                                    <h3 className="text-xl font-bold">Фінансовий Радник ШІ</h3>
                                </div>

                                {!aiAdvice && !isLoadingAi && !aiError && (
                                    <div>
                                        <p className="text-indigo-100 mb-6 text-sm sm:text-base">
                                            Використовуйте штучний інтелект Gemini для аналізу вашого кредитного навантаження ({currentLoanTitle}).
                                            Ми оцінимо реальну вартість та надамо рекомендації.
                                        </p>
                                        <button
                                            onClick={handleAiAdvice}
                                            className="px-6 py-3 bg-white text-indigo-900 font-bold rounded-lg hover:bg-indigo-50 transition-colors shadow-lg flex items-center gap-2"
                                        >
                                            <Sparkles size={18} />
                                            Проаналізувати кредит
                                        </button>
                                    </div>
                                )}

                                {isLoadingAi && (
                                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                        <div className="w-10 h-10 border-4 border-indigo-300 border-t-white rounded-full animate-spin"></div>
                                        <p className="text-indigo-200 animate-pulse">Аналізуємо умови договору...</p>
                                    </div>
                                )}

                                {/* Error State */}
                                {aiError && !isLoadingAi && (
                                    <div className="bg-red-500/20 p-4 rounded-xl border border-red-500/50 mb-4">
                                        <div className="flex items-center gap-2 text-red-200 mb-2">
                                            <AlertTriangle size={18} />
                                            <span className="font-bold">Помилка</span>
                                        </div>
                                        <p className="text-sm text-red-100 mb-3">Не вдалося отримати пораду від ШІ. Перевірте API ключ або спробуйте пізніше.</p>
                                        <button
                                            onClick={handleAiAdvice}
                                            className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            Спробувати знову
                                        </button>
                                    </div>
                                )}

                                {aiAdvice && (
                                    <div className="prose prose-invert prose-sm max-w-none bg-white/10 p-4 rounded-xl">
                                        <ReactMarkdown>{aiAdvice}</ReactMarkdown>
                                        <button
                                            onClick={() => setAiAdvice('')}
                                            className="mt-4 text-xs text-indigo-300 hover:text-white underline"
                                        >
                                            Скинути
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Table */}
                        <ScheduleTable schedule={result.schedule} />

                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
