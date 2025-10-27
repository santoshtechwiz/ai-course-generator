'use client';
import React from 'react';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlassDoorLockProps {
  isLocked: boolean;
  reason?: string;
  children: React.ReactNode;
  className?: string;
  previewRatio?: number; // visible fraction (0–1)
  blurIntensity?: 'light' | 'medium' | 'heavy';
  actionLabel?: string;
  onAction?: () => void;
}

export default function GlassDoorLock({
  isLocked,
  reason = 'Upgrade your plan to unlock this content',
  children,
  className = '',
  previewRatio = 0.2, // show 20% preview by default
  blurIntensity = 'medium',
  actionLabel = 'Unlock Now',
  onAction,
}: GlassDoorLockProps) {
  const blurClass =
    blurIntensity === 'light'
      ? 'backdrop-blur-sm'
      : blurIntensity === 'heavy'
      ? 'backdrop-blur-2xl'
      : 'backdrop-blur-md';

  if (!isLocked) return <>{children}</>;

  return (
    <div className={cn('relative w-full rounded-xl overflow-hidden', className)}>
      {/* Content container */}
      <div className="relative">
        {/* ✅ Visible preview (top 20%) */}
        <div
          className="overflow-hidden"
          style={{
            height: `${previewRatio * 100}%`,
            maskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
          }}
        >
          {children}
        </div>

        {/* 🔒 Frosted blur overlay for the rest */}
        <div
          className={cn(
            'absolute inset-x-0 flex flex-col items-center justify-center text-center p-6',
            blurClass,
            'bg-white/60 dark:bg-black/60',
            'rounded-b-xl border-t border-white/20 backdrop-saturate-150',
          )}
          style={{ top: `${previewRatio * 100}%`, bottom: 0 }}
        >
          <div
            className={cn(
              'max-w-lg w-full flex flex-col md:flex-row items-center gap-4',
              'bg-white/30 dark:bg-white/10 border border-white/20 backdrop-blur-xl',
              'rounded-2xl p-6 text-center md:text-left shadow-lg'
            )}
          >
            <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-full bg-white/20 border border-white/10">
              <Lock className="h-6 w-6 text-white/90" />
            </div>

            <div className="flex-1 space-y-1">
              <h3 className="text-base md:text-lg font-semibold text-foreground">
                {reason}
              </h3>
              <p className="text-sm text-muted-foreground">
                Sign in or upgrade your plan to access full content, quizzes, and personalized recommendations.
              </p>
            </div>

            {onAction && (
              <button
                onClick={onAction}
                className="px-5 py-2.5 rounded-none bg-primary text-primary-foreground text-sm font-semibold shadow-md hover:brightness-95 transition"
              >
                {actionLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
