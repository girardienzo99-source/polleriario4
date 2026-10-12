'use client';

import React from 'react';
import { Header } from '@/components/landing/Header';
import { Hero } from '@/components/landing/Hero';
import { PromosBanner } from '@/components/landing/PromosBanner';
import { MenuSection } from '@/components/landing/MenuSection';
import { Footer } from '@/components/landing/Footer';
import { CartDrawer } from '@/components/landing/CartDrawer';
import { CheckoutModal } from '@/components/landing/CheckoutModal';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-charcoal-950 text-charcoal-100">
      <Header />
      <main className="flex-1">
        <Hero />
        <PromosBanner />
        <MenuSection />
      </main>
      <Footer />
      <CartDrawer />
      <CheckoutModal />
    </div>
  );
}
