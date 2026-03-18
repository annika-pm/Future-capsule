'use client';

import { Header } from '../../components/layout/Header';
import { ProtectedLayout } from '../../components/layout/ProtectedLayout';
import { CapsuleForm } from '../../components/capsule/CapsuleForm';

export default function CreatePage() {
  return (
    <ProtectedLayout>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <CapsuleForm />
      </main>
    </ProtectedLayout>
  );
}
