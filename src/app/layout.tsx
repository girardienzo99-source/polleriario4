import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  style: ['normal', 'italic'],
});

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Pollería Los Campeones | Pollo al spiedo y a la leña en Río Cuarto',
  description:
    'Pollos al spiedo marinados 12 horas, pollo a la parrilla con leña de quebracho, milanesas, empanadas y guarniciones caseras. Pedí online para retirar o con envío en Río Cuarto, Córdoba. Desarrollado por Río Cuarto Web.',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'Pollería Los Campeones — Río Cuarto',
    description: 'Pollo al spiedo y a la leña. Pedí online para retirar o con envío.',
    images: ['/images/hero-spiedo.jpg'],
    locale: 'es_AR',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0c0c0e',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR" className={`dark scroll-smooth ${display.variable} ${sans.variable}`}>
      <body className="min-h-screen bg-charcoal-950 font-sans text-charcoal-100 antialiased selection:bg-fire-600 selection:text-white">
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
