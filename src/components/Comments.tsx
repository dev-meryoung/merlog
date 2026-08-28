'use client';

import { useEffect, useRef } from 'react';

const GISCUS_ORIGIN = 'https://giscus.app';
const DARK_CLASS = 'dark';

const Comments = () => {
  const observerRef = useRef<MutationObserver | null>(null);
  const pendingThemeRef = useRef<'light' | 'transparent_dark' | null>(null);
  const getDomTheme = () =>
    document.documentElement.classList.contains(DARK_CLASS)
      ? 'transparent_dark'
      : 'light';

  useEffect(() => {
    const mountGiscus = () => {
      const giscusContainer = document.getElementById('giscus');

      if (!giscusContainer || document.querySelector('script#giscus-script')) {
        return;
      }

      const script = document.createElement('script');

      script.id = 'giscus-script';
      script.src = 'https://giscus.app/client.js';
      script.setAttribute('data-repo', 'dev-meryoung/merlog');
      script.setAttribute('data-repo-id', 'R_kgDON6ue9Q');
      script.setAttribute('data-category', 'Comments');
      script.setAttribute('data-category-id', 'DIC_kwDON6ue9c4CnYFV');
      script.setAttribute('data-mapping', 'pathname');
      script.setAttribute('data-strict', '0');
      script.setAttribute('data-reactions-enabled', '1');
      script.setAttribute('data-emit-metadata', '0');
      script.setAttribute('data-input-position', 'bottom');
      script.setAttribute('data-lang', 'ko');
      script.setAttribute('data-theme', getDomTheme());
      script.crossOrigin = 'anonymous';
      script.async = true;

      giscusContainer.innerHTML = '';
      giscusContainer.appendChild(script);
      pendingThemeRef.current = getDomTheme();
    };

    const postTheme = () => {
      const theme = getDomTheme();
      const iframe = document.querySelector<HTMLIFrameElement>(
        'iframe.giscus-frame'
      );

      if (!iframe?.contentWindow) {
        pendingThemeRef.current = theme;
        return false;
      }

      iframe.contentWindow.postMessage(
        {
          giscus: {
            setConfig: { theme },
          },
        },
        GISCUS_ORIGIN
      );

      pendingThemeRef.current = null;
      return true;
    };

    mountGiscus();

    observerRef.current = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          postTheme();
          break;
        }
      }
    });

    observerRef.current.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin !== GISCUS_ORIGIN ||
        !event.data?.giscus?.loaded ||
        !pendingThemeRef.current
      ) {
        return;
      }

      postTheme();
    };

    window.addEventListener('message', handleMessage);

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <div
      id='giscus'
      className='w-full mx-auto p-5 md:p-10 rounded-lg bg-white shadow-md dark:bg-darkActive mt-4'
    />
  );
};

export default Comments;
