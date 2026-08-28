import { useEffect, useState } from 'react';

const ScrollProgressBar = () => {
  const [progress, setProgress] = useState(0);

  const updateProgress = () => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    const scrollableHeight = scrollHeight - clientHeight;
    const scrolled =
      scrollableHeight > 0 ? (scrollTop / scrollableHeight) * 100 : 0;

    setProgress(Math.min(100, Math.max(0, scrolled)));
  };

  useEffect(() => {
    let animationFrame: number | null = null;
    const scheduleProgressUpdate = () => {
      if (animationFrame !== null) {
        return;
      }

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = null;
        updateProgress();
      });
    };

    scheduleProgressUpdate();
    window.addEventListener('scroll', scheduleProgressUpdate, {
      passive: true,
    });

    return () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
      window.removeEventListener('scroll', scheduleProgressUpdate);
    };
  }, []);

  return (
    <div className='absolute top-0 left-0 w-full h-1 bg-gray-200'>
      <div
        className='h-full bg-accent dark:bg-accent-contrastSurface transition-none'
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default ScrollProgressBar;
