'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface SearchModalProps {
  isModalOpen: boolean;
  onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isModalOpen, onClose }) => {
  const [keyword, setKeyword] = useState('');
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isModalOpen) {
      router.prefetch('/search');
    }
  }, [isModalOpen, router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }

      if (e.key !== 'Tab') {
        return;
      }

      const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
        'button, input, [href], [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements?.[0];
      const lastElement = focusableElements?.[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        return;
      }

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
        return;
      }

      if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    if (isModalOpen) {
      previousActiveElementRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      document.body.classList.add('overflow-hidden');
      inputRef.current?.focus();
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.classList.remove('overflow-hidden');
      setKeyword('');
      window.removeEventListener('keydown', handleKeyDown);
      previousActiveElementRef.current?.focus();
      previousActiveElementRef.current = null;
    };
  }, [isModalOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!keyword.trim()) {
      return;
    }

    inputRef.current?.blur();
    router.push(`/search?keyword=${encodeURIComponent(keyword)}`);
    setKeyword('');
    onClose();
  };

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-hidden={!isModalOpen}
      aria-label='검색'
      ref={modalRef}
      className={`fixed flex justify-center inset-0 z-50 bg-background-light dark:bg-background-dark transition-opacity duration-300 ease-in-out ${
        isModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        className={`w-full max-w-3xl mx-auto transition-transform duration-300 ease-in-out ${
          isModalOpen ? 'transform-none' : '-translate-y-10'
        }`}
      >
        <div className='relative flex justify-center items-center h-16 select-none'>
          <Image
            src='/images/logo-light.svg'
            alt=''
            width={150}
            height={100}
            className='w-[150px] h-[50px] block dark:hidden'
            draggable={false}
            priority
          />
          <Image
            src='/images/logo-dark.svg'
            alt=''
            width={150}
            height={100}
            className='w-[150px] h-[50px] hidden dark:block'
            draggable={false}
            priority
          />
          <button
            type='button'
            className='absolute right-4 p-2 rounded-xl hover:bg-gray-200 dark:text-text-dark dark:bg-background-dark dark:hover:bg-darkActive'
            aria-label='닫기'
            onClick={onClose}
            tabIndex={isModalOpen ? 0 : -1}
          >
            <XMarkIcon className='h-5 w-5' strokeWidth={2.5} />
          </button>
        </div>
        <form
          className='flex relative justify-center items-center w-full h-12 mt-2 px-4'
          onSubmit={handleSearch}
        >
          <input
            ref={inputRef}
            type='text'
            className='w-full max-w-3xl h-full pl-4 pr-10 shadow-md bg-white rounded-lg dark:text-text-dark dark:bg-darkActive outline-none focus:outline-primary dark:focus:outline-background-light'
            placeholder='검색어를 입력해 주세요.'
            aria-label='검색어'
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            tabIndex={isModalOpen ? 0 : -1}
          />
          <button
            type='submit'
            className='absolute right-5 p-2 dark:text-text-dark'
            aria-label='검색'
            tabIndex={isModalOpen ? 0 : -1}
          >
            <MagnifyingGlassIcon className='h-5 w-5' strokeWidth={2.5} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default SearchModal;
