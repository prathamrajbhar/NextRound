'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { mediaManager } from '@/lib/media/mediaManager';

const MEDIA_PERMITTED_PREFIXES = [
  '/interview/',
  '/candidate/mock/',
  '/candidate/resume-builder/',
  '/candidate/settings',
];

function isMediaPermittedRoute(pathname: string): boolean {
  if (pathname.endsWith('/feedback') || pathname.endsWith('/history')) {
    return false;
  }
  const hasPrefix = MEDIA_PERMITTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  return hasPrefix || pathname.includes('/assessment');
}

export function MediaRouteGuard() {
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    const prevPath = prevPathnameRef.current;
    prevPathnameRef.current = pathname;

    if (!isMediaPermittedRoute(pathname)) {
      mediaManager.stopAll();
    } else if (prevPath !== pathname && prevPath.split('/')[2] !== pathname.split('/')[2]) {
      mediaManager.stopAll();
    }
  }, [pathname]);

  return null;
}
