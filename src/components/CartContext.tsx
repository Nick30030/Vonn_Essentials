import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, Order } from '../types';
import { db, doc, collection, onSnapshot, setDoc, updateDoc } from '../lib/firebase';
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
  addOrder: (order: Order) => Promise<{ success: boolean; order?: Order; error?: string }>;
  updateOrderStatus: (orderId: string, status: Order["paymentStatus"]) => Promise<void>;
  updateOrderRefund: (orderId: string, refundData: {
    status: Order["paymentStatus"];
    refundDetails: NonNullable<Order["refundDetails"]>;
  }) => Promise<void>;
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

const SUPABASE_ORDER_COLUMNS = new Set([
  "id", "created_at", "date", "customerName", "customerEmail",
  "address", "city", "province", "postal", "country", "items",
  "subtotal", "shipping", "hst", "total", "paymentMethod",
  "paymentStatus", "shippingMethod", "orderComments", "discountCode",
  "discountAmount", "shippingDiscountAmount", "etransferDetails", "refundDetails"
]);

export function normalizeOrderForSupabase(order: any): any {
  const row: Record<string, any> = {};
  for (const key of Object.keys(order)) {
    if (SUPABASE_ORDER_COLUMNS.has(key) && order[key] !== undefined) {
      row[key] = order[key];
    }
  }
  if (!row.created_at && (order.createdAt || order.date)) {
    try {
      row.created_at = new Date(order.createdAt || order.date).toISOString();
    } catch {
      row.created_at = new Date().toISOString();
    }
  }
  return row;
}

function mergeOrderLists(existing: Order[], incoming: Order[]): Order[] {
  const map = new Map<string, Order>();
  for (const o of existing || []) {
    if (o && o.id) map.set(o.id, o);
  }
  for (const o of incoming || []) {
    if (o && o.id) {
      const prev = map.get(o.id);
      map.set(o.id, prev ? { ...prev, ...o } : o);
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    const timeA = new Date((a as any).created_at || a.createdAt || a.date || 0).getTime();
    const timeB = new Date((b as any).created_at || b.createdAt || b.date || 0).getTime();
    return timeB - timeA;
  });
}

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
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // Fallback
      }
    }
    return [];
  });

  const fetchOrders = async () => {
    let fetchedList: Order[] = [];

    // 1. Fetch from Supabase directly
    if (supabase) {
      try {
        const { data, error } = await supabase.from('orders').select('*');
        if (!error && Array.isArray(data) && data.length > 0) {
          fetchedList = data as Order[];
        }
      } catch (sbErr) {
        console.warn("Direct Supabase fetch orders notice:", sbErr);
      }
    }

    // 2. Fetch from Server API
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          fetchedList = mergeOrderLists(fetchedList, data);
        }
      }
    } catch {
      // Suppressed
    }

    if (fetchedList.length > 0) {
      setOrders((prev) => {
        const merged = mergeOrderLists(prev, fetchedList);
        localStorage.setItem("vonn_orders", JSON.stringify(merged));
        return merged;
      });
    }
  };

  const refetchOrders = async () => {
    await fetchOrders();
  };

  // Synchronize orders with Firestore real-time database, Supabase, and server API
  useEffect(() => {
    let unsubscribeFirestore = () => {};

    try {
      if (db) {
        const ordersCol = collection(db, "orders");
        unsubscribeFirestore = onSnapshot(ordersCol, (snapshot) => {
          if (!snapshot.empty) {
            const liveOrders: Order[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              if (data && data.id) {
                liveOrders.push(data as Order);
              }
            });
            setOrders((prev) => {
              const merged = mergeOrderLists(prev, liveOrders);
              localStorage.setItem("vonn_orders", JSON.stringify(merged));
              return merged;
            });
          }
        }, (err) => {
          console.warn("Firestore live orders subscription notice:", err?.message || err);
        });
      }
    } catch (e) {
      console.warn("Firestore real-time listener init notice:", e);
    }

    let unsubscribeSupabase = () => {};
    if (supabase) {
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

      unsubscribeSupabase = () => {
        try {
          channel.unsubscribe();
        } catch (e) {
          // ignore
        }
      };
    }

    void fetchOrders();
    return () => {
      unsubscribeFirestore();
      unsubscribeSupabase();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("vonn_cart", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("vonn_orders", JSON.stringify(orders));
  }, [orders]);

  const addOrder = async (order: Order): Promise<{ success: boolean; order?: Order; error?: string }> => {
    // 1. Optimistically update local state & cache
    setOrders((prev) => {
      const updated = mergeOrderLists([order], prev);
      localStorage.setItem("vonn_orders", JSON.stringify(updated));
      return updated;
    });

    // 2. Direct Supabase write (using column whitelist)
    if (supabase) {
      try {
        const normalized = normalizeOrderForSupabase(order);
        const { error } = await supabase.from('orders').upsert([normalized]);
        if (error) {
          console.warn('Supabase upsert order notice:', error.message || error);
        } else {
          console.log(`[Order Confirmation] Direct Supabase persistence confirmed for Order #${order.id}`);
        }
      } catch (e: any) {
        console.warn('Supabase upsert orders exception:', e?.message || e);
      }
    }

    // 3. Direct client Firestore write (best-effort redundancy)
    try {
      if (db) {
        await setDoc(doc(db, "orders", order.id), order, { merge: true });
        console.log(`[Order Confirmation] Client Firestore write verified for Order #${order.id}`);
      }
    } catch (fsErr: any) {
      console.warn("Direct client Firestore write notice (will rely on server persistence):", fsErr?.message || fsErr);
    }

    // 4. Primary backend database write via API
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order)
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[Database Persistence Notice] Server responded with code ${res.status}:`, errText);
        return { success: true, order };
      }

      const data = await res.json();
      if (data.success) {
        console.log(`[Order Confirmation] Server successfully stored Order #${order.id}.`);
        if (Array.isArray(data.orders)) {
          setOrders((prev) => {
            const merged = mergeOrderLists(prev, data.orders);
            localStorage.setItem("vonn_orders", JSON.stringify(merged));
            return merged;
          });
        }
        return { success: true, order: data.order || order };
      }
    } catch (err: any) {
      console.warn("[Database Persistence Notice] Network error during backend order call:", err?.message || err);
    }

    return { success: true, order };
  };

  const updateOrderStatus = async (orderId: string, status: Order["paymentStatus"]) => {
    // 1. Optimistic state update
    setOrders((prev) => {
      const updated = prev.map(o => o.id === orderId ? { ...o, paymentStatus: status } : o);
      localStorage.setItem("vonn_orders", JSON.stringify(updated));
      return updated;
    });

    // 2. Supabase write if configured
    if (supabase) {
      try {
        await supabase.from('orders').update({ paymentStatus: status }).eq('id', orderId);
        console.log(`[Status Flow] Updated status for Order #${orderId} in Supabase to '${status}'`);
      } catch (e) {
        console.warn('Supabase update orders notice:', e);
      }
    }

    // 3. Direct client Firestore write
    try {
      if (db) {
        await updateDoc(doc(db, "orders", orderId), {
          paymentStatus: status,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn("Client Firestore status update notice:", e);
    }

    // 4. Server API update
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: status })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.orders) {
          setOrders((prev) => {
            const merged = mergeOrderLists(prev, data.orders);
            localStorage.setItem("vonn_orders", JSON.stringify(merged));
            return merged;
          });
        }
      }
    } catch (err) {
      console.warn("[Database Error] Network error during status update:", err);
    }
  };

  const updateOrderRefund = async (
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
      localStorage.setItem("vonn_orders", JSON.stringify(updated));
      return updated;
    });

    if (supabase) {
      try {
        await supabase.from('orders').update({ paymentStatus: refundData.status, refundDetails: refundData.refundDetails }).eq('id', orderId);
        console.log(`[Refund Flow] Updated refund status for Order #${orderId} in Supabase`);
      } catch (e) {
        console.warn('Supabase refund update error (suppressed):', e);
      }
    }

    // Direct Firestore update
    try {
      if (db) {
        await updateDoc(doc(db, "orders", orderId), {
          paymentStatus: refundData.status,
          refundDetails: refundData.refundDetails,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn("Client Firestore refund update notice:", e);
    }

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(refundData),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.orders) {
          setOrders((prev) => {
            const merged = mergeOrderLists(prev, data.orders);
            localStorage.setItem("vonn_orders", JSON.stringify(merged));
            return merged;
          });
        }
      }
    } catch (err) {
      console.warn("[Database Error] Network error during refund update:", err);
    }
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
