import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "./CartContext";
import { useLanguage } from "./LanguageContext";

export default function CartDrawer({ isOpen, onClose, onCheckout }: { isOpen: boolean, onClose: () => void, onCheckout: () => void }) {
  const { items, removeFromCart, updateQuantity, subtotal, shipping, hst, total, itemCount, country, city, province } = useCart();
  const { language, t, getProducts } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[120] flex flex-col"
          >
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingBag className="text-brand-accent" size={24} />
                <div>
                  <h2 className="text-xl font-sans font-bold text-gray-900 leading-none">{t("cart_title")}</h2>
                  <p className="text-xs text-gray-400 font-sans uppercase tracking-widest mt-1">{itemCount} {t("cart_items")}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                    <ShoppingBag size={32} className="text-gray-200" />
                  </div>
                  <div>
                    <p className="text-gray-900 font-sans font-bold">{t("cart_empty")}</p>
                    <p className="text-gray-400 font-serif text-sm">{t("cart_empty_sub")}</p>
                  </div>
                  <button 
                    onClick={onClose}
                    className="text-brand-accent font-sans font-bold text-xs uppercase tracking-widest hover:underline"
                  >
                    {t("cart_continue")}
                  </button>
                </div>
              ) : (
                items.map((item) => {
                  const translatedProd = getProducts().find(p => p.id === item.id) || item;
                  return (
                    <div key={item.id} className="flex gap-4 group font-serif">
                      <div className="w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100 group-hover:shadow-md transition-shadow">
                        <img src={translatedProd.image} alt={translatedProd.name} className="w-full h-full object-contain p-2" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="font-sans font-bold text-gray-900 leading-tight pr-4">{translatedProd.name}</h3>
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <p className="text-xs text-gray-400 font-serif mt-1">{translatedProd.weight}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3 bg-gray-50 rounded-full p-1 border border-gray-100">
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white transition-colors"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white transition-colors"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          {translatedProd.discountPrice ? (
                            <div className="flex flex-col items-end">
                              <span className="font-sans font-bold text-brand-accent">{translatedProd.discountPrice}</span>
                              <span className="font-sans text-[10px] text-gray-400 line-through">{translatedProd.price}</span>
                            </div>
                          ) : (
                            <span className="font-sans font-bold text-gray-900">{translatedProd.price}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {items.length > 0 && (
              <div className="p-8 bg-gray-50 border-t border-gray-100 space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{t("cart_subtotal")}</span>
                    <span className="text-gray-900 font-bold">C${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">
                      {country === "CA" ? (
                        subtotal >= 35 ? t("checkout_shipping_free") :
                        (city.toLowerCase().trim() === "toronto" && province === "ON") ? t("checkout_shipping_local") :
                        t("checkout_shipping_standard")
                      ) : t("cart_shipping_or_delivery")}
                    </span>
                    <span className="text-gray-900 font-bold">{shipping === 0 ? (language === "en" ? "Free" : "Gratuit") : `C$${shipping.toFixed(2)}`}</span>
                  </div>
                  {city && city.trim() !== "" && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">{t("cart_hst")}</span>
                      <span className="text-gray-900 font-bold">C${hst.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                    <span className="font-sans font-bold text-gray-900">{t("cart_total")}</span>
                    <span className="text-2xl font-sans font-bold text-gray-900">C${total.toFixed(2)}</span>
                  </div>
                </div>
                
                <button 
                  onClick={onCheckout}
                  className="w-full py-5 bg-[#1a1a1a] text-white font-sans font-bold rounded-full hover:bg-brand-accent transition-all flex items-center justify-center gap-3 group shadow-xl"
                >
                  {t("cart_checkout")}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                
                <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest font-bold">
                  {t("cart_secure")}
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
