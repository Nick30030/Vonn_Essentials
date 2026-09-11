export interface Product {
  id: number;
  name: string;
  price: string;
  weight: string;
  image: string;
  sku?: string;
  discountPrice?: string;
  description?: string;
  collection?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  date: string;
  createdAt?: string;
  timestamp?: number;
  timezone?: string;
  timezoneOffset?: string;
  customerName: string;
  customerEmail: string;
  address: string;
  city: string;
  province: string;
  postal: string;
  country: string;
  items: Array<{ id: number; name: string; price: string; quantity: number; image: string; sku?: string }>;
  subtotal: number;
  shipping: number;
  hst: number;
  total: number;
  paymentMethod: "paypal" | "etransfer";
  paymentStatus: "pending_etransfer" | "completed" | "cancelled" | "refund_processing" | "refunded";
  shippingMethod: string;
  orderComments?: string;
  discountCode?: string;
  discountAmount?: number;
  shippingDiscountAmount?: number;
  etransferDetails?: {
    senderName: string;
    senderBank: string;
    senderEmail: string;
    referenceCode?: string;
    submittedAt: string;
    screenshot?: string;
  };
  refundDetails?: {
    requestedAt: string;
    completedAt?: string;
    amount: number;
    reason: string;
    customNote?: string;
    status: "processing" | "completed";
    processedBy?: string;
    emailSentTo?: string;
    refundMethod?: string;
  };
}

export interface GiftCode {
  code: string;
  discountType: "product_percentage" | "product_fixed" | "shipping_percentage" | "shipping_free";
  discountValue: number;
  description: string;
}

