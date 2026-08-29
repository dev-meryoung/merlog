'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import IconButton from '@/components/IconButton';
import ScrollProgressBar from '@/components/ScrollProgressBar';
import SearchModal from '@/components/SearchModal';
import ThemeToggleButton from '@/components/ThemeToggleButton';
import { SITE_CONFIG } from '@/constants';

const Header = () => {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showProgressBar = pathname.startsWith('/post/');

  return (
    <>
      <header className='fixed top-0 w-full h-16 px-4 flex items-center justify-center border-b border-gray-200 bg-background-light z-50 select-none overflow-hidden dark:bg-background-dark dark:border-darkActive'>
        {showProgressBar && <ScrollProgressBar />}
        <div className='container flex justify-between items-center'>
          <Link href='/' aria-label='merlog 홈으로 이동'>
            <Image
              src='/images/logo-light.svg'
              alt=''
              width={150}
              height={100}
              className='w-[150px] h-[100px] block dark:hidden'
            />
            <Image
              src='/images/logo-dark.svg'
              alt=''
              width={150}
              height={100}
              className='w-[150px] h-[100px] hidden dark:block'
            />
          </Link>
          <div className='flex space-x-2'>
            <a
              href={SITE_CONFIG.author.github}
              target='_blank'
              rel='noopener noreferrer'
              aria-label='GitHub에서 merlog 열기'
              className='p-2 rounded-xl hover:bg-gray-200 dark:text-text-dark dark:bg-background-dark hover:dark:bg-darkActive'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-5 w-5'
                viewBox='0 0 98 96'
                fill='currentColor'
                aria-hidden='true'
              >
                <path
                  fillRule='evenodd'
                  clipRule='evenodd'
                  d='M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z'
                />
              </svg>
            </a>
            <ThemeToggleButton />
            <IconButton
              icon={
                <MagnifyingGlassIcon className='h-5 w-5' strokeWidth={2.5} />
              }
              onClick={() => setIsModalOpen(true)}
              aria-label='검색'
            />
          </div>
        </div>
      </header>
      <SearchModal
        isModalOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default Header;
