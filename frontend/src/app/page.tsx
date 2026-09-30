'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/ask');
  }, [router]);

  return (
    <div style={{ padding: '2rem 0', textAlign: 'center', color: '#94a3b8' }}>
      Redirecting to Q&A portal...
    </div>
  );
}
