import type { Metadata } from 'next';
import '@/styles/globals.css';
import localFont from 'next/font/local';
import { ThemeProvider } from 'next-themes';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { defaultMetadata } from '@/lib/metadata';

const wantedSans = localFont({
  src: '../../public/fonts/WantedSansVariable.woff2',
  variable: '--font-wanted-sans',
  weight: '400 1000',
});

const recipekorea = localFont({
  src: '../../public/fonts/Recipekorea.ttf',
  variable: '--font-recipekorea',
  preload: false,
});

export const generateMetadata = async (): Promise<Metadata> =>
  defaultMetadata({});

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <html
    lang='ko'
    className={`${wantedSans.variable} ${recipekorea.variable}`}
    suppressHydrationWarning={true}
  >
    <head>
      <meta
        name='google-site-verification'
        content='2HAw1C-cpAskXgHSDXNzfvo_ZcGuEyEC4DAqCATGaUw'
      />
    </head>
    <body className='dark:bg-background-dark'>
      <ThemeProvider
        attribute='class'
        defaultTheme='system'
        enableSystem={true}
        enableColorScheme={true}
      >
        <Header />
        <main className='container flex-1 mx-auto p-4 mt-16'>{children}</main>
        <Footer />
      </ThemeProvider>
    </body>
  </html>
);

export default RootLayout;
