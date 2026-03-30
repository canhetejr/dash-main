import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: 'UniCV | Pesquisa de Satisfação',
  description: 'Dashboard analítico institucional de pesquisas de satisfação acadêmica — UniCV.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} antialiased`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-unicv-green focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:shadow-lg">
          Pular para o conteúdo
        </a>
        <div id="main-content" className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}
