import type {
  AmortizationRow,
  LoanPayment,
  LoanStatus,
} from "@/lib/finance/amortization";
import type { Minor } from "@/lib/finance/money";

export interface Loan {
  id: string;
  name: string;
  principal: Minor;
  rate: number;
  termMonths: number;
  startDate: string;
  payments: LoanPayment[];
}

export interface LoanWithStatus extends Loan {
  status: LoanStatus;
}

export interface LoanDetail extends LoanWithStatus {
  schedule: AmortizationRow[];
}
