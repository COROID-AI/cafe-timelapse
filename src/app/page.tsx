'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { CafeScene } from '@/components/CafeScene';
import { TimelineSlider } from '@/components/TimelineSlider';
import { Html } from '@react-three/drei';

function LoadingScreen() {
  return (
    <Html center>
      <div className="text-center">
        <div className="text-3xl mb-4">Loading Café Timelapse...</div>
        <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-primary-500 animate-pulse" style={{ width: '100%' }} />
        </div>
      </div>
    </Html>
  );
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate asset loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="relative min-h-screen bg-gray-900">
      <TimelineSlider />
      
      <Suspense fallback={<LoadingScreen />}>
        <CafeScene />
      </Suspense>
      
      {/* Instructions overlay */}
      <div className="fixed bottom-4 left-4 glass-morphism p-4 rounded-lg max-w-xs">
        <h3 className="font-bold mb-2">Navigation Controls</h3>
        <ul className="text-sm space-y-1 text-gray-300">
          <li>• Left click + drag: Rotate view</li>
          <li>• Scroll: Zoom in/out</li>
          <li>• Right click + drag: Pan</li>
        </ul>
      </div>
    </main>
  );
}