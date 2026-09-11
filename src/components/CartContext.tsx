import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, Order } from '../types';
import { db, doc, onSnapshot, setDoc } from '../lib/firebase';
import { supabase } from '../lib/supabase';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
  subtotal: number;
  shipping: number;
  hst: number;
  province: string;
  setProvince: (province: string) => void;
  city: string;
  setCity: (city: string) => void;
  country: string;
  setCountry: (country: string) => void;
  shippingOption: string;
  setShippingOption: (option: string) => void;
  shippingRates: any[];
  setShippingRates: (rates: any[]) => void;
  selectedRate: any | null;
  setSelectedRate: (rate: any | null) => void;
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order["paymentStatus"]) => void;
  updateOrderRefund: (orderId: string, refundData: {
    status: Order["paymentStatus"];
    refundDetails: NonNullable<Order["refundDetails"]>;
  }) => void;
  refetchOrders: () => Promise<void>;
}

const taxRates: Record<string, number> = {
  "AB": 0.05,
  "BC": 0.12,
  "MB": 0.12,
  "NB": 0.15,
  "NL": 0.15,
  "NT": 0.05,
  "NS": 0.15,
  "NU": 0.05,
  "ON": 0.13,
  "PE": 0.15,
  "QC": 0.14975,
  "SK": 0.11,
  "YT": 0.05,
};

export const SHIPPING_RATES_BY_PROVINCE: Record<string, number> = {
  "ON": 9.99,
  "QC": 10.99,
  "MB": 12.99,
  "NB": 12.99,
  "NS": 12.99,
  "PE": 13.99,
  "SK": 13.99,
  "AB": 14.99,
  "BC": 15.99,
  "NL": 15.99,
  "YT": 19.99,
  "NT": 24.99,
  "NU": 29.99
};

export const FREE_SHIPPING_THRESHOLDS: Record<string, number | null> = {
  "ON": 100,
  "QC": 100,
  "MB": 125,
  "NB": 125,
  "NS": 125,
  "PE": 125,
  "SK": 150,
  "AB": 150,
  "BC": 150,
  "NL": 150,
  "YT": null,
  "NT": null,
  "NU": null,
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [province, setProvince] = useState<string>("ON");
  const [city, setCity] = useState<string>("");
  const [country, setCountry] = useState<string>("CA");
  const [shippingOption, setShippingOption] = useState<string>("standard");
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [selectedRate, setSelectedRate] = useState<any | null>(null);
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("vonn_cart");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem("vonn_orders");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [];
  });

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrders(data);
          localStorage.setItem("vonn_orders", JSON.stringify(data));
        }
      }
    } catch {
      // Suppressed
    }
  };

  const refetchOrders = async () => {
    await fetchOrders();
  };

  // Synchronize orders with Firestore / Supabase real-time database and server API
  useEffect(() => {
    let unsubscribe = () => {};

    if (supabase) {
      // Subscribe to Postgres changes on the `orders` table and refresh orders via the API
      const channel = supabase
        .channel('public:orders')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          async () => {
            await fetchOrders();
          }
        )
        .subscribe();

      unsubscribe = () => {
        try {
          channel.unsubscribe();
        } catch (e) {
          // ignore
        }
      };
    }

    void fetchOrders();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem("vonn_cart", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("vonn_orders", JSON.stringify(orders));
  }, [orders]);

  const addOrder = (order: Order) => {
    setOrders((prev) => {
      const updated = [order, ...prev];
      // Persist to Supabase asynchronously (best-effort)
      (async () => {
        if (supabase) {
          try {
            await supabase.from('orders').insert([order]);
          } catch (e) {
            console.warn('Supabase insert orders error (suppressed):', e);
          }
        }
      })();
      return updated;
    });
    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    }).catch(() => {});
  };

  const updateOrderStatus = (orderId: string, status: Order["paymentStatus"]) => {
    setOrders((prev) => {
      const updated = prev.map(o => o.id === orderId ? { ...o, paymentStatus: status } : o);
      // Persist change to Supabase (best-effort)
      (async () => {
        if (supabase) {
          try {
            await supabase.from('orders').update({ paymentStatus: status }).eq('id', orderId);
          } catch (e) {
            console.warn('Supabase update orders error (suppressed):', e);
          }
        }
      })();
      return updated;
    });
    fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: status })
    }).catch(() => {});
  };

  const updateOrderRefund = (
    orderId: string,
    refundData: {
      status: Order["paymentStatus"];
      refundDetails: NonNullable<Order["refundDetails"]>;
    }
  ) => {
    setOrders((prev) => {
      const updated = prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              paymentStatus: refundData.status,
              refundDetails: refundData.refundDetails,
            }
          : o
      );
      // Persist refund update to Supabase (best-effort)
      (async () => {
        if (supabase) {
          try {
            await supabase.from('orders').update({ paymentStatus: refundData.status, refundDetails: refundData.refundDetails }).eq('id', orderId);
          } catch (e) {
            console.warn('Supabase refund update error (suppressed):', e);
          }
        }
      })();
      return updated;
    });
    fetch(`/api/orders/${encodeURIComponent(orderId)}/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(refundData),
    }).catch(() => {});
  };

  const addToCart = (product: Product) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = items.reduce((sum, item) => {
    const activePrice = item.discountPrice || item.price;
    const priceNum = parseFloat(activePrice.replace('C$', '').replace(',', '.'));
    return sum + priceNum * item.quantity;
  }, 0);

  let shipping = 0;
  if (items.length > 0) {
    if (selectedRate) {
      const isFreeEligible = country === "CA" && subtotal >= 35;
      shipping = isFreeEligible ? 0 : selectedRate.priceDetails.base;
    } else if (country === "US") {
      if (shippingOption === "cp_expedited") shipping = 40.75;
      else if (shippingOption === "cp_small_packet") shipping = 12.41;
      else if (shippingOption === "cp_tracked") shipping = 16.71;
      else if (shippingOption === "cp_xpresspost") shipping = 63.91;
      else shipping = 12.41; // default US
    } else {
      // Custom Standard Shipping Rates for Canada based on Province
      const standardRate = SHIPPING_RATES_BY_PROVINCE[province] || 12.99;
      const threshold = FREE_SHIPPING_THRESHOLDS[province];
      const isFreeEligible = threshold !== null && subtotal >= threshold;
      shipping = isFreeEligible ? 0 : standardRate;
    }
  }

  const taxRate = (country === "US" || !city || city.trim() === "") ? 0 : (taxRates[province] || 0.13);
  const hst = (subtotal + shipping) * taxRate;
  const total = subtotal + shipping + hst;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        itemCount,
        total,
        subtotal,
        shipping,
        hst,
        province,
        setProvince,
        city,
        setCity,
        country,
        setCountry,
        shippingOption,
        setShippingOption,
        shippingRates,
        setShippingRates,
        selectedRate,
        setSelectedRate,
        orders,
        addOrder,
        updateOrderStatus,
        updateOrderRefund,
        refetchOrders
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
