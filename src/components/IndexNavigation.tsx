'use client';

import { useCallback, useEffect, useState } from 'react';
import { buildHeadingTree, type HeadingNode } from '@/lib/headings';
import type { Heading } from '@/types/post';

interface IndexNavigationProps {
  headings: Heading[];
}

interface HeadingListProps {
  activeId: string | null;
  depth?: number;
  nodes: HeadingNode[];
  onSelect: (id: string) => void;
}

const HeadingList = ({
  activeId,
  depth = 0,
  nodes,
  onSelect,
}: HeadingListProps) => (
  <ul className={depth === 0 ? 'space-y-3' : 'mt-3 ml-2 space-y-3'}>
    {nodes.map((node) => (
      <li
        key={node.id}
        className={
          depth === 0
            ? undefined
            : 'relative pl-4 before:absolute before:left-0 before:-top-3 before:-bottom-3 before:border-l before:border-gray-300 last:before:bottom-auto last:before:h-[calc(1.375rem+1px)] last:before:w-3 last:before:border-b after:absolute after:left-0 after:top-2.5 after:w-3 after:border-t after:border-gray-300 last:after:hidden dark:before:border-gray-600 dark:after:border-gray-600'
        }
      >
        <button
          type='button'
          onClick={() => onSelect(node.id)}
          className={`block text-left w-full leading-5 ${
            activeId === node.id
              ? 'text-accent font-bold dark:text-accent-contrast'
              : 'text-gray-700 dark:text-text-dark'
          } hover:underline`}
          aria-current={activeId === node.id ? 'location' : undefined}
        >
          {node.text}
        </button>
        {node.children.length > 0 && (
          <HeadingList
            activeId={activeId}
            depth={depth + 1}
            nodes={node.children}
            onSelect={onSelect}
          />
        )}
      </li>
    ))}
  </ul>
);

const IndexNavigation = ({ headings }: IndexNavigationProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const HEADER_OFFSET = 74;

  const handleClick = (id: string) => {
    const element = document.getElementById(id);

    if (element) {
      const position =
        element.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      window.scrollTo({
        top: position,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    }
  };

  const handleScroll = useCallback(() => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      setActiveId(headings[headings.length - 1]?.id || null);

      return;
    }

    const scrollPosition = window.scrollY;
    let closestId: string | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);

      if (element) {
        const elementTop =
          element.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
        const distance = Math.abs(scrollPosition - elementTop);

        if (distance < closestDistance && elementTop < scrollPosition + 4) {
          closestDistance = distance;
          closestId = id;
        }
      }
    });

    setActiveId(closestId);
  }, [headings]);

  useEffect(() => {
    let animationFrame: number | null = null;
    const scheduleScrollUpdate = () => {
      if (animationFrame !== null) {
        return;
      }

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = null;
        handleScroll();
      });
    };

    scheduleScrollUpdate();
    window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });

    return () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
      window.removeEventListener('scroll', scheduleScrollUpdate);
    };
  }, [handleScroll]);

  if (headings.length === 0) {
    return null;
  }

  const headingTree = buildHeadingTree(headings);

  return (
    <nav
      className='hidden min-[1620px]:block absolute left-[968px] top-0 h-full'
      aria-label='목차'
    >
      <div className='sticky top-20 max-h-[calc(100vh-6rem)] min-w-[284px] overflow-y-auto p-4 bg-white dark:bg-darkActive shadow-md rounded-lg'>
        <HeadingList
          activeId={activeId}
          nodes={headingTree}
          onSelect={handleClick}
        />
      </div>
    </nav>
  );
};

export default IndexNavigation;
