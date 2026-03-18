'use client';

import { use } from 'react';
import { Header } from '@/components/layout/Header';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { CapsuleViewer } from '@/components/capsule/CapsuleViewer';

interface CapsulePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CapsulePage({ params }: CapsulePageProps) {
  const { id } = use(params);
  
  return (
    <ProtectedLayout>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <CapsuleViewer id={id} />
      </main>
    </ProtectedLayout>
  );
}
