
export interface AmortizationPayment {
  month: number;
  paymentDate: string; // Formatted date string (e.g., "20 листопада 2025")
  payment: number;
  interest: number;
  principal: number;
  balance: number;
  isPenaltyMonth?: boolean;
}

export interface LoanResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  schedule: AmortizationPayment[];
}

export interface LoanParams {
  amount: number;
  rate: number;
  months: number;
}
