'use client';

import React, { useEffect, useRef, useState } from 'react';

interface LottiePlayerProps {
  src: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
}

declare global {
  interface Window {
    lottie?: {
      loadAnimation: (params: {
        container: HTMLElement;
        renderer: 'svg' | 'canvas' | 'html';
        loop: boolean;
        autoplay: boolean;
        path?: string;
        animationData?: any;
      }) => {
        destroy: () => void;
        stop: () => void;
        play: () => void;
      };
    };
  }
}

export function LottiePlayer({ src, className = '', fallbackIcon }: LottiePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let animInstance: { destroy: () => void } | null = null;
    let isMounted = true;

    const initLottie = () => {
      if (!containerRef.current || !window.lottie) return;
      try {
        animInstance = window.lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: src,
        });
        if (isMounted) setLoaded(true);
      } catch (err) {
        console.warn('Lottie failed to initialize:', err);
      }
    };

    if (window.lottie) {
      initLottie();
    } else {
      const scriptId = 'lottie-web-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.0/lottie.min.js';
        script.async = true;
        document.head.appendChild(script);
      }

      const handleScriptLoad = () => {
        if (isMounted) initLottie();
      };

      script.addEventListener('load', handleScriptLoad);
      return () => {
        script?.removeEventListener('load', handleScriptLoad);
        if (animInstance) animInstance.destroy();
      };
    }

    return () => {
      isMounted = false;
      if (animInstance) animInstance.destroy();
    };
  }, [src]);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div ref={containerRef} className="w-full h-full" />
      {!loaded && fallbackIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {fallbackIcon}
        </div>
      )}
    </div>
  );
}
