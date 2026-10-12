import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';

export const metadata: Metadata = {
  title: 'Pollería Los Campeones | El Mejor Pollo al Spiedo de Río Cuarto',
  description: 'Sistema de gestión gastronómica y pedidos online de pollos asados, comidas preparadas, guarniciones y promociones familiares en Río Cuarto, Córdoba. Desarrollado por Río Cuarto Web.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR" className="dark scroll-smooth">
      <body className="min-h-screen bg-charcoal-950 text-charcoal-100 antialiased selection:bg-fire-600 selection:text-white">
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
