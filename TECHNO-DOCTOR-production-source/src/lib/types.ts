export interface ErrorCode {
  id: string;
  category: string;
  brand: string;
  code: string;
  description: string;
  cause: string | null;
  solution: string | null;
  created_at?: string;
}

export interface Firmware {
  id: string;
  category: string;
  brand: string;
  model: string;
  version: string;
  description: string | null;
  download_url: string | null;
  created_at?: string;
}

export interface ModelRecord {
  id: string;
  category: string;
  brand: string;
  model_name: string;
  year: number | null;
  specs: string | null;
  notes: string | null;
  created_at?: string;
}

export interface SparePart {
  id: string;
  category: string;
  part_number: string;
  name: string;
  price: number | null;
  stock: number | null;
  description: string | null;
  created_at?: string;
}

export interface CalculatorRate {
  id: string;
  category: string;
  service_type: string;
  base_price: number | null;
  complexity: string | null;
  created_at?: string;
}

export type FinanceType = 'доход' | 'расход' | 'долг' | 'вернул';

export interface FinanceEntry {
  id: string;
  type: FinanceType;
  amount: number;
  note: string | null;
  created_at?: string;
}
