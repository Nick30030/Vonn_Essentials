import { motion, AnimatePresence } from "motion/react";
import { X, ShoppingCart, AlertCircle } from "lucide-react";
import React from "react";
import { Product } from "../types";
import { useLanguage } from "./LanguageContext";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
          <AlertCircle size={48} className="text-gray-300" />
          <div>
            <h3 className="text-lg font-sans font-bold text-gray-800">3D Preview Unavailable</h3>
            <p className="text-gray-400 text-sm font-serif">This product's 3D model could not be loaded at this time.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export default function QuickViewModal({ product, isOpen, onClose, onAddToCart }: QuickViewModalProps) {
  const { t, language } = useLanguage();
  if (!product) return null;

  const isBottle = product.name.toLowerCase().includes("wash") || product.name.toLowerCase().includes("serum") || product.name.toLowerCase().includes("spray");

  const getProductDescription = (name: string, lang: string) => {
    if (product.description) {
      return product.description;
    }
    if (lang === "fr") {
      return `Découvrez la pureté absolue de la nature avec notre ${name.toLowerCase()}. Formulé avec passion à la main au Québec en petites quantités, nous n'utilisons que des ingrédients végétaux riches et des extraits de plantes de premier choix. Sans aucun produit synthétique ni parabènes.`;
    }
    return `Experience the pure essence of nature with our ${name.toLowerCase()}. Handcrafted with care in Canada in small batches using only premium plant-rich ingredients and botanical essences. No synthetic foaming agents or harsh parabens.`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#1a1a1af5] backdrop-blur-sm"
          />
          
          <motion.div
            layoutId={`product-${product.id}`}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-5xl bg-white rounded-3xl md:rounded-[2.5rem] shadow-2xl flex flex-col lg:flex-row max-h-[90vh] lg:h-[620px] overflow-y-auto custom-scrollbar font-serif"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 md:top-6 md:right-6 z-50 p-2.5 bg-white/90 hover:bg-brand-accent hover:text-white text-gray-700 rounded-full shadow-md transition-all duration-200 backdrop-blur-md border border-gray-100"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* Original Product Image Section */}
            <div className="lg:w-3/5 bg-[#fbf9f5] relative flex flex-col border-b lg:border-b-0 lg:border-r border-gray-100 p-8 items-center justify-center min-h-[320px] md:min-h-[420px] lg:min-h-full flex-shrink-0">
              <div className="absolute top-6 left-6 md:top-8 md:left-8 z-10 space-y-1 pointer-events-none text-left">
                  <div className="flex items-center gap-2 text-brand-accent font-sans font-bold uppercase tracking-[0.25em] text-[8px] md:text-[10px]">
                     {t("modal_origin_val")}
                  </div>
                  <p className="text-gray-400 text-[8px] md:text-[10px] font-sans uppercase tracking-widest opacity-80">{t("modal_origin_tag")}</p>
              </div>

              <div className="flex-1 flex items-center justify-center w-full max-w-sm h-full p-4">
                <motion.img 
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  src={product.image} 
                  alt={product.name} 
                  className="max-h-[260px] md:max-h-[340px] object-contain drop-shadow-md hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Details Section with Custom Scrollbar */}
            <div className="lg:w-2/5 p-6 md:p-8 lg:p-10 flex flex-col justify-between gap-6 bg-white text-left font-serif overflow-y-auto custom-scrollbar">
              <div className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <span className="text-brand-accent font-sans font-bold uppercase tracking-[0.3em] text-[10px] mb-2 block">{t("modal_details")}</span>
                  <h2 className="text-2xl lg:text-3xl font-sans font-bold text-gray-900 leading-snug mb-1">
                    {product.name}
                  </h2>
                  <p className="text-gray-400 font-serif text-sm">{product.weight}</p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="text-gray-600 leading-relaxed font-serif text-sm space-y-3"
                >
                  <p>{getProductDescription(product.name, language)}</p>
                  
                  {/* Botanical Highlights */}
                  <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-2 text-[11px] font-sans">
                    <span className="px-2.5 py-1 bg-[#F6F0E4] text-[#162F1C] font-semibold rounded-full">
                      🌱 {language === "fr" ? "100% Végétal" : "100% Plant-Based"}
                    </span>
                    <span className="px-2.5 py-1 bg-[#F6F0E4] text-[#162F1C] font-semibold rounded-full">
                      ✨ {language === "fr" ? "Fait Main au Canada" : "Handmade in Canada"}
                    </span>
                    <span className="px-2.5 py-1 bg-[#F6F0E4] text-[#162F1C] font-semibold rounded-full">
                      🐰 {language === "fr" ? "Sans Cruauté" : "Cruelty-Free"}
                    </span>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="text-2xl lg:text-3xl font-sans font-bold text-brand-accent flex items-baseline gap-3 pt-2"
                >
                  {product.discountPrice ? (
                    <>
                      <span>{product.discountPrice}</span>
                      <span className="text-base text-gray-400 line-through font-normal">{product.price}</span>
                    </>
                  ) : (
                    <span>{product.price}</span>
                  )}
                </motion.div>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="space-y-3 pt-4 border-t border-gray-100"
              >
                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onAddToCart(product)}
                  className="w-full py-4 bg-[#162F1C] text-white font-sans font-bold rounded-2xl hover:bg-[#A96827] transition-all shadow-md flex items-center justify-center gap-3 active:scale-95 text-xs uppercase tracking-widest cursor-pointer"
                >
                  <ShoppingCart size={16} />
                  {t("modal_addtocart")}
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
