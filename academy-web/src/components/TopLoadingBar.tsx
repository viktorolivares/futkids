import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAcademy } from '../context/AcademyContext';

export interface TopLoadingBarProps {
  /** Optional custom color class for the progress bar. Defaults to emerald-to-sky gradient */
  className?: string;
}

/**
 * TopLoadingBar
 * Barra de progreso de carga superior ultra-fina (estilo YouTube / GitHub / Next.js).
 * Se activa automáticamente en cada cambio de ruta (/dashboard, /students, /classes, /cashier, /billing, /admin, /superadmin),
 * cuando AcademyContext reporta isLoading === true, y responde al evento global 'top-bar-loading'.
 */
export const TopLoadingBar: React.FC<TopLoadingBarProps> = ({ className }) => {
  const location = useLocation();
  const { isLoading } = useAcademy();

  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const finishTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousPathRef = useRef<string>(location.pathname + location.search);

  const clearAllTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
  };

  const startProgress = () => {
    clearAllTimers();
    setIsFinishing(false);
    setIsVisible(true);
    setProgress(15);

    // Increment progress incrementally in steps
    let current = 15;
    timerRef.current = setInterval(() => {
      if (current < 50) {
        current += Math.floor(Math.random() * 12) + 8;
      } else if (current < 80) {
        current += Math.floor(Math.random() * 8) + 4;
      } else if (current < 92) {
        current += 1.5;
      }
      setProgress(Math.min(current, 93));
    }, 120);
  };

  const completeProgress = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    setProgress(100);
    setIsFinishing(true);

    finishTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      hideTimeoutRef.current = setTimeout(() => {
        setProgress(0);
        setIsFinishing(false);
      }, 300);
    }, 200);
  };

  // 1. Detect route changes across all academy-web pages
  useEffect(() => {
    const currentPath = location.pathname + location.search;
    if (previousPathRef.current !== currentPath) {
      previousPathRef.current = currentPath;

      startProgress();

      // Quick smooth completion after page mount
      const autoFinish = setTimeout(() => {
        completeProgress();
      }, 320);

      return () => {
        clearTimeout(autoFinish);
      };
    }
  }, [location.pathname, location.search]);

  // 2. React to AcademyContext isLoading (e.g. data fetching or switching academy)
  useEffect(() => {
    if (isLoading) {
      startProgress();
    } else if (isVisible && !isFinishing) {
      completeProgress();
    }
  }, [isLoading]);

  // 3. Listen to manual custom events from internal views (e.g. tab switches, filters, async calls)
  useEffect(() => {
    const handleCustomStart = () => startProgress();
    const handleCustomComplete = () => completeProgress();

    window.addEventListener('top-loading-bar-start', handleCustomStart);
    window.addEventListener('top-loading-bar-complete', handleCustomComplete);

    return () => {
      window.removeEventListener('top-loading-bar-start', handleCustomStart);
      window.removeEventListener('top-loading-bar-complete', handleCustomComplete);
      clearAllTimers();
    };
  }, []);

  if (!isVisible && progress === 0) {
    return null;
  }

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      className={`fixed top-0 left-0 right-0 z-[99999] pointer-events-none transition-opacity duration-300 ${
        isFinishing ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ height: '3px' }}
    >
      {/* Ultra-fine progress track */}
      <div
        className={`h-full relative transition-all ease-out shadow-xs ${
          className || 'bg-gradient-to-r from-emerald-500 via-sky-500 to-blue-600'
        }`}
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? '180ms' : '220ms',
        }}
      >
        {/* Glowing Head / Destello luminoso en la punta */}
        <div
          className="absolute right-0 top-0 bottom-0 w-24 translate-x-3 pointer-events-none"
          style={{
            boxShadow: '0 0 14px 2px rgba(14, 165, 233, 0.85), 0 0 6px 1px rgba(16, 185, 129, 0.9)',
            borderRadius: '9999px',
          }}
        />
      </div>
    </div>
  );
};

/** Helper function to manually trigger the top loading bar from any component */
export const triggerTopLoading = (durationMs = 350) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('top-loading-bar-start'));
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('top-loading-bar-complete'));
    }, durationMs);
  }
};

export default TopLoadingBar;
