import type { Metadata } from 'next';
import { Suspense } from 'react';
import CheckoutClient from './CheckoutClient';

export const metadata: Metadata = {
  title: 'Checkout | Doubtster',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CheckoutClient />
    </Suspense>
  );
}
