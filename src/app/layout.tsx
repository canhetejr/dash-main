import type { Metadata } from 'next';
import { Kumbh_Sans, Open_Sans } from 'next/font/google';
import './globals.css';

const kumbhSans = Kumbh_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-kumbh',
  display: 'swap',
});

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-opensans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Unicive | Dashboard Analítico',
  description: 'Acompanhe resultados, percepção acadêmica e indicadores consolidados da Pesquisa da Disciplina — Unicive.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${kumbhSans.variable} ${openSans.variable}`}>
      <body className={`${openSans.className} antialiased`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-unicive-green focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:shadow-lg">
          Pular para o conteúdo
        </a>
        <div id="main-content" className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}
