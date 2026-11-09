import type { Metadata } from 'next';
import { Suspense } from 'react';
import CheckoutClient from './CheckoutClient';

export const metadata: Metadata = {
  title: 'Checkout | Doubtster',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <>
      {/* Resource hints for Dodo Payments to eliminate DNS and TLS handshake latency */}
      <link rel="preconnect" href="https://checkout.dodopayments.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://checkout.dodopayments.com" />
      <link rel="preconnect" href="https://sdk-v2.hs.dodopayments.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://sdk-v2.hs.dodopayments.com" />
      <link rel="preconnect" href="https://api.hs.dodopayments.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://api.hs.dodopayments.com" />
      <Suspense fallback={null}>
        <CheckoutClient />
      </Suspense>
    </>
  );
}
