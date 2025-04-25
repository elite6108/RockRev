import { supabase } from '../lib/supabase';

interface BankDetails {
  bank_name: string;
  account_number: string;
  sort_code: string;
}

export async function getBankDetails(): Promise<BankDetails | null> {
  try {
    const { data, error } = await supabase
      .from('payment_terms')
      .select('bank_name, account_number, sort_code')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching bank details:', error);
    return null;
  }
}

export async function getPaymentTerms() {
  try {
    const { data, error } = await supabase
      .from('payment_terms')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching payment terms:', error);
    return null;
  }
}