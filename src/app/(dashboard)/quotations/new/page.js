'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import QuotationBuilder from '@/components/QuotationBuilder';

function NewQuotationInner() {
  const searchParams = useSearchParams();
  const clientId     = searchParams.get('clientId');
  const router       = useRouter();

  if (!clientId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <p className="text-[var(--color-np-text)] font-semibold">No client selected.</p>
        <button onClick={() => router.push('/clients')}
          className="px-4 py-2 bg-[var(--color-np-red)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--color-np-red-dark)] transition-colors">
          Go to Clients
        </button>
      </div>
    );
  }

  return <QuotationBuilder clientId={clientId} />;
}

export default function NewQuotationPage() {
  return (
    <Suspense>
      <NewQuotationInner />
    </Suspense>
  );
}
