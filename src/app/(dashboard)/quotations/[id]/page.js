'use client';

import { use } from 'react';
import QuotationBuilder from '@/components/QuotationBuilder';

export default function EditQuotationPage({ params }) {
  const { id } = use(params);
  return <QuotationBuilder quotationId={id} />;
}
