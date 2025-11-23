
import { LoanResult, AmortizationPayment } from '../types';

export const calculateAnnuityLoan = (
  amount: number, 
  rate: number, 
  months: number, 
  loanType: string,
  startDate: string, // YYYY-MM-DD string
  isGracePeriodViolation: boolean = false,
  isCashWithdrawal: boolean = false,
  isFeeAmortized: boolean = false
): LoanResult => {
  // Handle zero cases
  if (amount <= 0 || months <= 0) {
    return {
      monthlyPayment: 0,
      totalPayment: 0,
      totalInterest: 0,
      schedule: [],
    };
  }

  // Helper: Get formatted date string
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Helper: Standard +1 month logic
  const getStandardPaymentDate = (start: string, monthOffset: number): Date => {
    const date = new Date(start);
    date.setMonth(date.getMonth() + monthOffset);
    return date;
  };

  // Helper: PUMB Logic (30th of the next month)
  // If month has < 30 days (Feb), set to last day.
  const getPumbPaymentDate = (start: string, monthOffset: number): Date => {
    const purchaseDate = new Date(start);
    // Go to the specific month (Purchase + Offset)
    // Offset 1 means "Next Month".
    // However, PUMB logic is: First payment is 30th of NEXT month. Subsequent are 30th of following months.
    const targetDate = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth() + monthOffset, 1);
    
    // Set to 30th
    const lastDayOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
    targetDate.setDate(Math.min(30, lastDayOfMonth));
    
    return targetDate;
  };

  // LOGIC 1: Classic Credit Card / Standard Annuity (Monobank Black Card OR PUMB Credit Card)
  if (loanType === 'monobank_black' || loanType === 'pumb_credit_card') {
    const monthlyRateDecimal = rate / 100;
    
    const numerator = amount * monthlyRateDecimal * Math.pow(1 + monthlyRateDecimal, months);
    const denominator = Math.pow(1 + monthlyRateDecimal, months) - 1;
    
    let baseMonthlyPayment = numerator / denominator;
    baseMonthlyPayment = Math.round(baseMonthlyPayment * 100) / 100;

    const schedule: AmortizationPayment[] = [];
    let remainingBalance = amount;
    let totalInterest = 0;

    // Cash Withdrawal Fee Calculation
    let cashWithdrawalFee = 0;
    if (isCashWithdrawal) {
        if (loanType === 'pumb_credit_card') {
            cashWithdrawalFee = Math.round((amount * 0.0399) * 100) / 100; // 3.99% for PUMB
        } else if (loanType === 'monobank_black') {
            cashWithdrawalFee = Math.round((amount * 0.04) * 100) / 100; // 4% for Mono
        }
    }

    let penaltyInterest = 0;
    let firstPaymentDateObj: Date;
    let penaltyMonthIndex = 0;

    // Determine the first payment date and penalty based on loan type
    if (loanType === 'pumb_credit_card') {
      // PUMB: Always 30th of next month
      firstPaymentDateObj = getPumbPaymentDate(startDate, 1);
      
      // PUMB Penalty Month is the 1st month (next month 30th)
      penaltyMonthIndex = 1;

      if (isGracePeriodViolation) {
         // Calculate exact days between Purchase and Due Date
         const startObj = new Date(startDate);
         const diffTime = Math.abs(firstPaymentDateObj.getTime() - startObj.getTime());
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
         
         // Daily rate approx (Rate / 30 days)
         const dailyRate = monthlyRateDecimal / 30;
         penaltyInterest = Math.round((amount * dailyRate * diffDays) * 100) / 100;
      }

    } else {
      // Monobank: Standard +1 month
      firstPaymentDateObj = getStandardPaymentDate(startDate, 1);
      
      // Monobank Penalty usually hits on Month 2 (after 62 days)
      // If loan term is only 1 month, it hits on Month 1.
      penaltyMonthIndex = months > 1 ? 2 : 1;

      if (isGracePeriodViolation) {
        // Monobank fixed ~2 months (62 days) penalty simulation
        penaltyInterest = Math.round((amount * monthlyRateDecimal * 2) * 100) / 100;
      }
    }

    for (let i = 1; i <= months; i++) {
      let interestPart = Math.round((remainingBalance * monthlyRateDecimal) * 100) / 100;
      let currentMonthlyPayment = baseMonthlyPayment;
      let isPenaltyMonth = false;

      // Add penalty to the interest part of the SPECIFIC penalty month
      if (isGracePeriodViolation && i === penaltyMonthIndex && penaltyInterest > 0) {
        interestPart += penaltyInterest;
        currentMonthlyPayment += penaltyInterest;
        isPenaltyMonth = true;
      }

      // Add Cash Withdrawal Fee
      if (isCashWithdrawal && cashWithdrawalFee > 0) {
        if (isFeeAmortized) {
          // Spread across all months
          const feePart = Math.round((cashWithdrawalFee / months) * 100) / 100;
          interestPart += feePart;
          currentMonthlyPayment += feePart;
          // Note: The sum of rounded parts might slightly differ from total fee, 
          // but for UI estimation it's acceptable.
        } else if (i === 1) {
          // Lump sum in first month
          interestPart += cashWithdrawalFee;
          currentMonthlyPayment += cashWithdrawalFee;
        }
      }

      let principalPart = currentMonthlyPayment - interestPart;
      
      // Adjust last month to close balance
      if (i === months) {
        principalPart = remainingBalance;
        currentMonthlyPayment = principalPart + interestPart;
      }

      // Prevent negative amortization if penalty is huge (interest > payment)
      // User must pay at least interest
      if (principalPart < 0) {
          currentMonthlyPayment = interestPart; // Pay full interest
          principalPart = 0; // Balance doesn't decrease
      }

      remainingBalance -= principalPart;
      if (remainingBalance < 0.01) remainingBalance = 0;
      
      totalInterest += interestPart;

      // Calculate date for current row
      let paymentDateStr = "";
      if (loanType === 'pumb_credit_card') {
        // Subsequent months are just next months from the first determined PUMB date
        const nextPumbDate = new Date(firstPaymentDateObj);
        nextPumbDate.setMonth(nextPumbDate.getMonth() + (i - 1));
        // Re-clamp to 30th (handle Feb leap years if needed in sequence)
        const lastDay = new Date(nextPumbDate.getFullYear(), nextPumbDate.getMonth() + 1, 0).getDate();
        nextPumbDate.setDate(Math.min(30, lastDay));
        paymentDateStr = formatDate(nextPumbDate);
      } else {
        paymentDateStr = formatDate(getStandardPaymentDate(startDate, i));
      }

      schedule.push({
        month: i,
        paymentDate: paymentDateStr,
        payment: Math.round(currentMonthlyPayment * 100) / 100,
        interest: Math.round(interestPart * 100) / 100,
        principal: Math.round(principalPart * 100) / 100,
        balance: Math.round(remainingBalance * 100) / 100,
        isPenaltyMonth
      });
    }
    
    totalInterest = Math.round(totalInterest * 100) / 100;
    const totalPayment = amount + totalInterest;
    
    // If we only have 1 month payment and it's Monobank, the base payment isn't representative of future installments
    // But calculateAnnuityLoan usually returns the "Standard" payment.
    // If penalty applied, the specific month payment is higher.
    
    return {
      monthlyPayment: baseMonthlyPayment,
      totalPayment,
      totalInterest,
      schedule,
    };
  }

  // LOGIC 2: Installment on Card (PUMB/Monobank Installment)
  else {
    const monthlyRateDecimal = rate / 100;
    
    const rawTotalCommission = amount * monthlyRateDecimal * months;
    const totalCommission = Math.round(rawTotalCommission * 100) / 100;
    
    const totalPayment = amount + totalCommission;
    const monthlyPayment = Math.round((totalPayment / months) * 100) / 100;

    const schedule: AmortizationPayment[] = [];
    let remainingBalance = amount;
    let accumulatedPrincipal = 0;

    for (let i = 1; i <= months; i++) {
      let principalPart: number;
      let commissionPart: number;
      let currentPayment = monthlyPayment;

      if (i === months) {
        principalPart = amount - accumulatedPrincipal;
        commissionPart = monthlyPayment - principalPart;
      } else {
        commissionPart = totalCommission / months; 
        principalPart = monthlyPayment - commissionPart;
      }

      accumulatedPrincipal += principalPart;
      remainingBalance -= principalPart;

      if (remainingBalance < 0.01) remainingBalance = 0;

      schedule.push({
        month: i,
        paymentDate: formatDate(getStandardPaymentDate(startDate, i)),
        payment: currentPayment,
        interest: commissionPart,
        principal: principalPart,
        balance: remainingBalance,
      });
    }

    return {
      monthlyPayment,
      totalPayment, 
      totalInterest: totalCommission, 
      schedule,
    };
  }
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};
