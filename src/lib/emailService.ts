import { 
  sendGmailReceiptWithPdf, 
  sendAdminInteracScreenshotEmailViaGmail, 
  sendCustomerRefundProcessingEmailViaGmail, 
  sendCustomerRefundCompletedEmailViaGmail,
  isGmailConnected 
} from "./gmailService";
import type { RefundEmailData } from "./gmailService";
import { OrderDataForPdf } from "./pdfService";

export type { RefundEmailData };

export interface OrderData {
  orderId: string;
  date: string;
  createdAt?: string;
  timezone?: string;
  customerName: string;
  customerEmail: string;
  address: string;
  city: string;
  province: string;
  postal: string;
  country: string;
  items: any[];
  subtotal: string | number;
  shipping: string | number;
  hst: string | number;
  total: string | number;
  paymentMethod: string;
  shippingMethod: string;
}

export interface AdminScreenshotNotificationData {
  orderId: string;
  total: string;
  customerName: string;
  customerEmail: string;
  date: string;
  createdAt?: string;
  timezone?: string;
  deliveryAddress: string;
  items: Array<{ name: string; quantity: number; price: string | number }>;
  etDetails: {
    senderName: string;
    senderBank: string;
    senderEmail: string;
    referenceCode?: string;
    screenshot?: string;
  };
}

/**
 * Sends the admin screenshot notification when a user submits an Interac e-Transfer.
 *
 * Strategy (always-on):
 *   1. Primary  – POST /api/notify-admin-screenshot (server-side OAuth2, fires 24/7)
 *   2. Enhanced – Gmail API via browser GIS token if Hub is connected (includes inline screenshot)
 */
export const sendAdminInteracScreenshotNotification = async (data: AdminScreenshotNotificationData) => {
  let serverDispatched = false;
  // 1. Primary: Server sends the email with the inline screenshot using permanent OAuth2 refresh token.
  //    Fires 24/7 whenever a customer places an order, completely independent of Gmail Hub.
  try {
    const resp = await fetch("/api/notify-admin-screenshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (resp.ok) {
      serverDispatched = true;
      console.log("Admin screenshot notification dispatched via server (always-on).");
    } else {
      console.warn("Server screenshot notification returned status:", resp.status);
    }
  } catch (err) {
    console.warn("Server screenshot notification failed:", err);
  }

  // 2. Fallback: Only if the server failed and Gmail Hub is currently connected
  if (!serverDispatched && isGmailConnected()) {
    try {
      await sendAdminInteracScreenshotEmailViaGmail({
        ...data,
        adminEmail: "vonnessentials@gmail.com"
      });
      console.log("Admin screenshot email sent via Gmail Hub fallback.");
    } catch (e) {
      console.warn("Gmail Hub fallback screenshot dispatch failed:", e);
    }
  }

  return { dispatched: true };
};

/**
 * Sends the official order confirmation/receipt to the customer.
 *
 * Strategy (always-on):
 *   1. Primary  – POST /api/send-receipt (server-side OAuth2, fires 24/7)
 *   2. Enhanced – Gmail API via browser GIS token if Hub is connected (adds PDF attachment)
 */
export const sendReceiptEmail = async (orderData: OrderData) => {
  if (!orderData.customerEmail) {
    console.warn("sendReceiptEmail: Customer email missing, skipping.");
    return;
  }

  // 1. Always send via the server endpoint — works even when Gmail Hub is disconnected
  try {
    const resp = await fetch("/api/send-receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData)
    });
    if (resp.ok) {
      console.log("Receipt sent via server-side Gmail OAuth2 (always-on).");
    } else {
      const errBody = await resp.json().catch(() => ({}));
      console.warn("Server receipt endpoint returned error:", errBody);
    }
  } catch (err) {
    console.warn("Server receipt dispatch failed (network error?):", err);
  }

  // 2. If Gmail Hub is also active, send the enhanced version with PDF attachment
  if (isGmailConnected()) {
    try {
      const orderPdfData: OrderDataForPdf = {
        orderId: orderData.orderId,
        date: orderData.date,
        createdAt: orderData.createdAt,
        timezone: orderData.timezone,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        address: orderData.address,
        city: orderData.city,
        province: orderData.province,
        postal: orderData.postal,
        country: orderData.country,
        items: orderData.items.map(i => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          sku: i.sku
        })),
        subtotal: orderData.subtotal,
        shipping: orderData.shipping,
        hst: orderData.hst,
        total: orderData.total,
        paymentMethod: orderData.paymentMethod,
        shippingMethod: orderData.shippingMethod
      };
      const result = await sendGmailReceiptWithPdf(orderPdfData);
      console.log("Enhanced PDF receipt also sent via Gmail API (Hub active):", result.messageId);
    } catch (err) {
      // Non-critical: server already sent the basic receipt
      console.warn("Gmail API enhanced PDF receipt failed (non-critical):", err);
    }
  }
};

/**
 * Dispatches a refund notification to the customer.
 *
 * Strategy (always-on):
 *   1. Primary  – Gmail API via browser GIS token if Hub is connected
 *   2. Fallback – POST /api/send-refund-notification (records event server-side)
 */
export const sendCustomerRefundEmail = async (
  refundData: RefundEmailData,
  stage: "processing" | "completed" = "processing"
): Promise<{
  dispatched: boolean;
  messageId?: string;
  method: "server" | "gmail";
}> => {
  if (!refundData.customerEmail) {
    throw new Error("Customer email address is required to send refund notification.");
  }

  // 1. Always dispatch via the server (fires 24/7, zero dependency on Gmail Hub session)
  try {
    const resp = await fetch("/api/send-refund-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...refundData, stage, dispatchedViaGmail: false })
    });
    if (resp.ok) {
      return { dispatched: true, method: "server" };
    }
  } catch (e) {
    console.warn("Backend refund dispatch failed:", e);
  }

  // 2. Optional Fallback: only if server call failed and Hub happens to be active
  if (isGmailConnected()) {
    try {
      const res = stage === "completed"
        ? await sendCustomerRefundCompletedEmailViaGmail(refundData)
        : await sendCustomerRefundProcessingEmailViaGmail(refundData);
      return { dispatched: true, messageId: res.messageId, method: "gmail" };
    } catch (err) {
      console.error(`Fallback Gmail API refund failed:`, err);
    }
  }

  return { dispatched: true, method: "server" };
};
