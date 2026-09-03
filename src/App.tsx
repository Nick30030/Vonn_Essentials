/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ProductGrid from "./components/ProductGrid";
import InfoSection from "./components/InfoSection";
import BlogCarousel from "./components/BlogCarousel";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import TermsModal from "./components/TermsModal";
import AdminPanel from "./components/AdminPanel";

import { Toaster, toast } from "react-hot-toast";
import { useState } from "react";
import { CartProvider, useCart } from "./components/CartContext";
import { LanguageProvider, useLanguage } from "./components/LanguageContext";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import CartDrawer from "./components/CartDrawer";
import CheckoutProcess from "./components/CheckoutProcess";

function AppContent() {
  const { addToCart, itemCount } = useCart();
  const { language, t, getShippingContent, getAboutContent, getShippingSection, getAboutSection } = useLanguage();
  const shippingSection = getShippingSection ? getShippingSection() : null;
  const aboutSection = getAboutSection ? getAboutSection() : null;

  const shipTitle = language === "fr" ? (shippingSection?.titleFr || t("shipping_title")) : (shippingSection?.titleEn || t("shipping_title"));
  const shipSubtitle = language === "fr" ? (shippingSection?.subtitleFr || t("shipping_subtitle")) : (shippingSection?.subtitleEn || t("shipping_subtitle"));

  const aboutTitle = language === "fr" ? (aboutSection?.titleFr || t("about_title")) : (aboutSection?.titleEn || t("about_title"));
  const aboutSubtitle = language === "fr" ? (aboutSection?.subtitleFr || t("about_subtitle")) : (aboutSection?.subtitleEn || t("about_subtitle"));

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<"terms" | "privacy">("terms");

  const handleAddToCart = (product: any) => {
    addToCart(product);
    toast.success(`${product.name}`, {
      style: {
        background: '#1a1a1a',
        color: '#fff',
        borderRadius: '100px',
        padding: '16px 24px',
        fontSize: '14px',
        fontWeight: 'bold',
      },
      iconTheme: {
        primary: '#162F1C',
        secondary: '#fff',
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col font-serif selection:bg-brand-accent selection:text-white">
      <Toaster position="bottom-right" />
      <Navbar 
        itemCount={itemCount} 
        onOpenCart={() => setIsCartOpen(true)} 
        onOpenTerms={(tab = "terms") => {
          setLegalTab(tab);
          setIsTermsOpen(true);
        }}
      />
      <main className="flex-grow">
        <Hero />
        <ProductGrid onAddToCart={handleAddToCart} />
        <InfoSection 
          id="shipping"
          title={shipTitle}
          subtitle={shipSubtitle}
          content={getShippingContent()}
        />
        <InfoSection 
          id="about"
          title={aboutTitle}
          subtitle={aboutSubtitle}
          content={getAboutContent()}
          isDark
        />
        <BlogCarousel />
        <Contact />
      </main>
      <Footer 
        onOpenTerms={(tab = "terms") => {
          setLegalTab(tab);
          setIsTermsOpen(true);
        }} 
        onOpenAdmin={() => setIsAdminOpen(true)}
      />
      
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }} 
      />
      
      <CheckoutProcess 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
      />

      <TermsModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        initialTab={legalTab}
      />

      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />
    </div>
  );
}

const initialPaypalOptions = {
  clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || "AVgocOgk5zzu-YqL1G5bIu8nMCOzE85JNuHsczJPkUCfSQAVK1Uf7Sa9kldtvIXF_5VCMFSSrQKO7Gk_",
  "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID || "AVgocOgk5zzu-YqL1G5bIu8nMCOzE85JNuHsczJPkUCfSQAVK1Uf7Sa9kldtvIXF_5VCMFSSrQKO7Gk_",
  currency: "CAD",
  intent: "capture"
};

export default function App() {
  return (
    <LanguageProvider>
      <CartProvider>
        <PayPalScriptProvider options={initialPaypalOptions}>
          <AppContent />
        </PayPalScriptProvider>
      </CartProvider>
    </LanguageProvider>
  );
}
