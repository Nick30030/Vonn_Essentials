import React from "react";
import { useLanguage } from "./LanguageContext";
import { Check } from "lucide-react";
import logoNew from "../assets/images/vonn_logo.png";

interface ReceiptProps {
  orderId: string;
  date: string;
  timezone?: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    address: string;
    city: string;
    province: string;
    postal: string;
    country: string;
  };
  items: any[];
  subtotal: number;
  shipping: number;
  hst: number;
  total: number;
  discount?: number;
  discountCode?: string;
  shippingDiscount?: number;
  paymentMethod: string;
  shippingMethod: string;
}

export default function Receipt({
  orderId,
  date,
  timezone,
  customer,
  items,
  subtotal,
  shipping,
  hst,
  total,
  discount,
  discountCode,
  shippingDiscount,
  paymentMethod,
  shippingMethod
}: ReceiptProps) {
  const { language, t, getProducts } = useLanguage();

  return (
    <div className="bg-white p-8 md:p-12 max-w-4xl mx-auto shadow-sm border border-gray-100 rounded-xl font-sans text-gray-800" id="order-receipt">
      {/* Header / Logo */}
      <div className="flex flex-col items-center mb-10">
        <div className="relative w-24 h-24 group cursor-pointer overflow-hidden rounded-full flex items-center justify-center mb-4 shadow-inner">
          <img 
            src={logoNew} 
            alt="Vonn Essentials Logo" 
            className="absolute inset-0 w-full h-full object-contain rounded-full transition-all duration-700 ease-in-out opacity-100 group-hover:opacity-0 group-hover:scale-95"
            referrerPolicy="no-referrer"
          />
          <img 
            src={logoNew} 
            alt="Vonn Essentials Logo Hover" 
            className="absolute inset-0 w-full h-full object-contain rounded-full transition-all duration-700 ease-in-out opacity-0 group-hover:opacity-100 group-hover:scale-105 filter brightness-110 drop-shadow-[0_0_12px_rgba(197,154,67,0.85)]"
            referrerPolicy="no-referrer"
          />
        </div>
        <h1 className="text-xl font-bold uppercase tracking-[0.2em]">Vonn Essentials</h1>
        <p className="text-[10px] text-gray-500 tracking-widest mt-1">www.vonnessentials.com/products</p>
      </div>

      {/* Business Info & Customer Service */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[11px] mb-10">
        <div className="space-y-1">
          <p className="font-bold text-gray-900">Vonn Essentials</p>
          <p>1530 Weston Road</p>
          <p>Toronto, Ontario M9N 1T2</p>
          <p>Canada</p>
        </div>
        <div className="md:text-right space-y-1">
          <p className="font-bold text-gray-900">Customer service</p>
          <p>+1 647-497-2929</p>
          <p>customerservice@vonnessentials.com</p>
        </div>
      </div>

      <div className="border-t border-gray-900/10 pt-4 mb-8 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-bold text-gray-900">{date}</p>
        {timezone && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-gray-100 border border-gray-200 text-gray-700 rounded-full text-[10px] font-sans font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {language === "fr" ? `Fuseau horaire : ${timezone}` : `Timezone: ${timezone}`}
          </span>
        )}
      </div>

      {/* Customer & Delivery Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[11px] mb-12">
        <div className="space-y-1">
          <p className="font-bold uppercase tracking-wider text-gray-400 mb-2">Billing & Shipping</p>
          <p className="font-bold text-gray-900 text-sm uppercase">{customer.firstName} {customer.lastName}</p>
          <p>{customer.address}</p>
          <p>{customer.city}, {customer.province} {customer.postal}</p>
          <p>{customer.country === "CA" ? "Canada" : "United States"}</p>
          <p className="text-brand-accent mt-2">{customer.email}</p>
        </div>
        <div className="md:text-right space-y-4">
          <div>
            <p className="font-bold uppercase tracking-wider text-gray-400 mb-1">Delivery Method</p>
            <p className="text-gray-900 font-medium">
              {shippingMethod}
            </p>
          </div>
          <div>
            <p className="font-bold uppercase tracking-wider text-gray-400 mb-1">Payment Method & Status</p>
            <div className="flex flex-col md:items-end gap-1">
              <p className="text-gray-900 font-medium">
                {paymentMethod === "etransfer" ? "Interac e-transfer" : "PayPal / Card"}
              </p>
              {paymentMethod !== "etransfer" ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-[10px] font-bold uppercase tracking-wider">
                  <Check size={11} className="text-emerald-600" />
                  Paid In Full
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded text-[10px] font-bold uppercase tracking-wider">
                  Pending Verification
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Summary Table */}
      <div className="border-t border-b border-gray-900/10 py-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">Order #{orderId}</h2>
        </div>
        
        <div className="space-y-4">
          {items.map((item, idx) => {
            const product = getProducts().find(p => p.id === item.id) || item;
            return (
              <div key={idx} className="flex justify-between items-start text-xs">
                <div className="flex-1 pr-8">
                  <p className="font-bold text-gray-900">{product.name}</p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase">SKU : {product.sku || `VE-${String(product.id).slice(0, 3)}-${product.name.slice(0, 3)}`.toUpperCase()}</p>
                </div>
                <div className="w-12 text-center text-gray-600">
                  {item.quantity}
                </div>
                <div className="w-24 text-right font-bold text-gray-900">
                  C${(parseFloat(product.price.replace('C$', '').replace(',', '.')) * item.quantity).toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-12">
        <div className="w-full max-w-[240px] space-y-2 text-[11px]">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 uppercase tracking-wider">Items</span>
            <span className="font-bold text-gray-900">C${subtotal.toFixed(2)}</span>
          </div>
          {discount && discount > 0 ? (
            <div className="flex justify-between items-center text-[#A96827]">
              <span className="uppercase tracking-wider font-semibold">
                {language === "fr" ? "Rabais" : "Discount"} {discountCode ? `(${discountCode})` : ""}
              </span>
              <span className="font-bold">-C${discount.toFixed(2)}</span>
            </div>
          ) : null}
          <div className="flex justify-between items-center">
            <span className="text-gray-500 uppercase tracking-wider">Delivery</span>
            <span className="font-bold text-gray-900">{shipping === 0 ? (language === "fr" ? "Gratuit" : "Free") : `C$${shipping.toFixed(2)}`}</span>
          </div>
          {shippingDiscount && shippingDiscount > 0 ? (
            <div className="flex justify-between items-center text-[#A96827]">
              <span className="uppercase tracking-wider font-semibold">
                {language === "fr" ? "Rabais Livraison" : "Shipping Discount"}
              </span>
              <span className="font-bold">-C${shippingDiscount.toFixed(2)}</span>
            </div>
          ) : null}
          <div className="flex justify-between items-center">
            <span className="text-gray-500 uppercase tracking-wider">HST / Tax</span>
            <span className="font-bold text-gray-900">C${hst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
            <span className="text-sm font-bold text-gray-900 uppercase tracking-widest">Total</span>
            <span className="text-sm font-bold text-gray-900">C${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center space-y-6">
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-900">Thank you for your order!</p>
          <p className="text-[10px] text-gray-500">Thank you for shopping with us!</p>
        </div>
        
        {/* Simulated Barcode */}
        <div className="flex flex-col items-center gap-2 pt-4">
          <div className="flex h-12 w-48 gap-[2px]">
            {Array.from({ length: 40 }).map((_, i) => (
              <div 
                key={i} 
                className="h-full bg-gray-900" 
                style={{ width: `${Math.random() > 0.5 ? 1 : 2}px`, opacity: Math.random() > 0.2 ? 1 : 0.4 }} 
              />
            ))}
          </div>
          <p className="text-[8px] font-mono text-gray-400 uppercase tracking-[0.3em]">ORDER-{orderId}</p>
        </div>

        <div className="pt-8 no-print">
          <button 
            onClick={() => window.print()}
            className="text-[10px] uppercase tracking-widest font-bold text-brand-accent hover:underline flex items-center gap-2 mx-auto"
          >
            <Check size={12} />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
