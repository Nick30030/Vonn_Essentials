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
 * Sends notification to the admin (vonnessentials@gmail.com)
 * when a user completes their Interac payment and uploads a screenshot.
 * Displays the screenshot directly in the email so the owner can review the transfer.
 */
export const sendAdminInteracScreenshotNotification = async (data: AdminScreenshotNotificationData) => {
  const adminEmail = "vonnessentials@gmail.com";
  let emailDispatched = false;

  // 1. If Gmail is currently authenticated in session, send rich HTML with screenshot directly via Gmail REST API
  if (isGmailConnected()) {
    try {
      await sendAdminInteracScreenshotEmailViaGmail({
        ...data,
        adminEmail
      });
      console.log("Admin screenshot notification sent via Gmail API");
      emailDispatched = true;
    } catch (e) {
      console.warn("Gmail API dispatch failed:", e);
    }
  }

  // 2. Client-side EmailJS dispatch fallback
  const emailJsServiceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const emailJsTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const emailJsPublicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (emailJsServiceId && emailJsTemplateId && emailJsPublicKey) {
    try {
      const resp = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: emailJsServiceId,
          template_id: emailJsTemplateId,
          user_id: emailJsPublicKey,
          template_params: {
            to_email: adminEmail,
            from_name: "Vonn Essentials Interac System",
            to_name: "Vonn Essentials Owner",
            subject: `🔔 Interac e-Transfer Screenshot: Order #${data.orderId} (${data.total})`,
            order_id: data.orderId,
            customer_name: data.customerName,
            customer_email: data.customerEmail,
            total_amount: data.total,
            sender_name: data.etDetails.senderName,
            sender_bank: data.etDetails.senderBank,
            sender_email: data.etDetails.senderEmail,
            reference_code: data.etDetails.referenceCode || "None",
            message: `Customer ${data.customerName} (${data.customerEmail}) submitted an Interac e-Transfer confirmation screenshot for Order #${data.orderId} (Total: ${data.total}). Expected recipient: order@vonnessentials.com. Bank: ${data.etDetails.senderBank}, Sender Name: ${data.etDetails.senderName}. Please verify your bank deposit and confirm the order in Admin Panel to dispatch the official receipt.`
          }
        })
      });
      if (resp.ok) {
        console.log("Admin screenshot alert delivered via EmailJS");
        emailDispatched = true;
      }
    } catch (err) {
      console.warn("EmailJS notification error:", err);
    }
  }

  // 3. Inform Server Backend API to register notification
  try {
    await fetch("/api/notify-admin-screenshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  } catch (err) {
    console.warn("Failed to notify server of screenshot:", err);
  }

  return { dispatched: emailDispatched };
};

/**
 * Sends the official receipt directly through Google Workspace Gmail REST API
 * with the vector PDF attached.
 */
export const sendReceiptEmail = async (orderData: OrderData) => {
  if (!orderData.customerEmail) {
    console.warn("sendReceiptEmail: Customer email missing, skipping.");
    return;
  }

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

  if (isGmailConnected()) {
    try {
      const result = await sendGmailReceiptWithPdf(orderPdfData);
      console.log("Receipt sent via Gmail API:", result.messageId);
      return result;
    } catch (err) {
      console.error("Failed to send receipt via Gmail API:", err);
      // Let caller know
      throw err;
    }
  } else {
    console.warn(
      "Gmail is not connected yet in this session. Order saved in store; administrator can dispatch receipt with PDF from Admin Panel -> Gmail Hub."
    );
  }
};

/**
 * Dispatches a refund notification to the customer who paid (either 'processing' or 'completed').
 * - If Gmail is connected, delivers via Google Workspace Gmail REST API directly to the customer's email.
 * - Logs and stores the notification event on the server backend.
 */
export const sendCustomerRefundEmail = async (
  refundData: RefundEmailData,
  stage: "processing" | "completed" = "processing"
): Promise<{
  dispatched: boolean;
  messageId?: string;
  method: "gmail" | "server_recorded";
}> => {
  if (!refundData.customerEmail) {
    throw new Error("Customer email address is required to send refund notification.");
  }

  // 1. If Gmail is connected, deliver directly
  if (isGmailConnected()) {
    try {
      const res = stage === "completed"
        ? await sendCustomerRefundCompletedEmailViaGmail(refundData)
        : await sendCustomerRefundProcessingEmailViaGmail(refundData);
      
      // Also register event on server
      fetch("/api/send-refund-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...refundData, stage, dispatchedViaGmail: true, messageId: res.messageId })
      }).catch(() => {});

      return { dispatched: true, messageId: res.messageId, method: "gmail" };
    } catch (err) {
      console.error(`Failed to dispatch refund ${stage} email via Gmail API:`, err);
      throw err;
    }
  }

  // 2. Fallback: notify server to record refund dispatch event
  try {
    await fetch("/api/send-refund-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...refundData, stage, dispatchedViaGmail: false })
    });
  } catch (e) {
    console.warn("Backend refund record failed:", e);
  }

  return { dispatched: false, method: "server_recorded" };
};

