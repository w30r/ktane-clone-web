import { Suspense } from 'react';
import BombContent from './BombContent';
import { createBomb, Difficulty } from '@/lib/game';

interface Props {
  searchParams: Promise<{ timer?: string; difficulty?: string }>;
}

export default async function BombPage({ searchParams }: Props) {
  const params = await searchParams;
  const timerParam = params.timer;
  const difficultyParam = params.difficulty as Difficulty || 'easy';
  const timerMinutes = difficultyParam === 'devtest' ? 15 : (timerParam ? parseInt(timerParam, 10) : 5);
  
  const initialBomb = createBomb(timerMinutes, difficultyParam);
  
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-900 flex items-center justify-center"><div className="text-zinc-400">Loading...</div></div>}>
      <BombContent initialBomb={initialBomb} difficulty={difficultyParam} />
    </Suspense>
  );
}