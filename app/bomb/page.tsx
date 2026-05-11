import { Suspense } from 'react';
import BombContent from './BombContent';

export default function BombPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-900 flex items-center justify-center"><div className="text-zinc-400">Loading...</div></div>}>
      <BombContent />
    </Suspense>
  );
}