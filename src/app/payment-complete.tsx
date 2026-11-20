import { useEffect } from 'react';

import { goBackOr } from '@/components/ScreenHeader';

/** Paystack's return link (nimo://payment-complete). Checkout confirms the payment itself. */
export default function PaymentComplete() {
  useEffect(() => {
    goBackOr('/profile');
  }, []);
  return null;
}
