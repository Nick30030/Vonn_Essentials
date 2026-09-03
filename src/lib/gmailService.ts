import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { generateReceiptPdf, OrderDataForPdf, getLogoBase64 } from "./pdfService";
import { formatOrderDateTime } from "./dateUtils";

// Gmail Scopes required by the app - Least privilege: sending order receipts and emails
export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
];

// In-memory token cache (persists during active SPA navigation)
let cachedAccessToken: string | null = null;
let cachedGoogleUser: {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  uid: string;
} | null = null;

// Listeners for auth state changes
type AuthListener = (user: typeof cachedGoogleUser, token: string | null) => void;
const listeners: Set<AuthListener> = new Set();

export const subscribeToGmailAuth = (callback: AuthListener) => {
  listeners.add(callback);
  callback(cachedGoogleUser, cachedAccessToken);
  return () => {
    listeners.delete(callback);
  };
};

const notifyListeners = () => {
  listeners.forEach((cb) => cb(cachedGoogleUser, cachedAccessToken));
};

// Listen for Firebase auth changes
onAuthStateChanged(auth, (user) => {
  if (!user) {
    cachedAccessToken = null;
    cachedGoogleUser = null;
    notifyListeners();
  }
});

export const getGmailAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const getGmailConnectedUser = () => {
  return cachedGoogleUser;
};

export const isGmailConnected = (): boolean => {
  return !!cachedAccessToken;
};

export interface ConnectGmailResult {
  user: typeof cachedGoogleUser | null;
  accessToken: string | null;
  cancelled?: boolean;
}

/**
 * Initiates the Google Sign-In popup requesting Gmail scopes
 */
export const connectGmailAccount = async (targetEmailHint?: string): Promise<ConnectGmailResult> => {
  const provider = new GoogleAuthProvider();
  GMAIL_SCOPES.forEach((scope) => provider.addScope(scope));

  // Custom parameters: select account prompt allows picking any Google account cleanly
  const customParams: Record<string, string> = {
    prompt: "select_account",
  };
  if (targetEmailHint) {
    customParams.login_hint = targetEmailHint;
  }
  provider.setCustomParameters(customParams);

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;

    if (!token) {
      throw new Error("Could not retrieve Google OAuth access token. Please grant permissions.");
    }

    cachedAccessToken = token;
    cachedGoogleUser = {
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
      uid: result.user.uid,
    };

    notifyListeners();
    return { user: cachedGoogleUser, accessToken: token, cancelled: false };
  } catch (error: any) {
    const code = error?.code || "";

    // User closed popup or dismissed the window - not a system error
    if (
      code === "auth/popup-closed-by-user" ||
      code === "auth/cancelled-popup-request" ||
      code === "auth/user-cancelled"
    ) {
      return { user: null, accessToken: null, cancelled: true };
    }

    // Popup was blocked by browser or iframe policy
    if (code === "auth/popup-blocked") {
      const blockedErr = new Error(
        "Popup blocked by your browser. Please allow popups or open this app in a new tab."
      );
      (blockedErr as any).code = "auth/popup-blocked";
      throw blockedErr;
    }

    // Domain unauthorized in Firebase configuration
    if (code === "auth/unauthorized-domain") {
      const domainErr = new Error(
        "This domain is not authorized for OAuth in the Firebase Console."
      );
      (domainErr as any).code = "auth/unauthorized-domain";
      throw domainErr;
    }

    console.warn("Gmail connection notice:", error?.message || error);
    throw error;
  }
};

/**
 * Disconnects the Gmail session
 */
export const disconnectGmailAccount = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    // Gracefully handle sign-out errors
  }
  cachedAccessToken = null;
  cachedGoogleUser = null;
  notifyListeners();
};

// UTF-8 to Base64 safe encoder
function utf8ToBase64(str: string): string {
  try {
    return window.btoa(unescape(encodeURIComponent(str)));
  } catch {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

// ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Builds the brand-aligned Thank-You HTML email template
 * with upper circular logo and visual identity matching Vonn Essentials
 */
export const buildThankYouEmailHtml = (order: OrderDataForPdf, logoBase64: string): string => {
  const isETransfer =
    String(order.paymentMethod).toLowerCase().includes("etransfer") ||
    String(order.paymentMethod).toLowerCase().includes("interac");

  const cleanTotal = typeof order.total === "number"
    ? `C$${order.total.toFixed(2)}`
    : String(order.total);

  const cleanSubtotal = typeof order.subtotal === "number"
    ? `C$${order.subtotal.toFixed(2)}`
    : String(order.subtotal);

  const cleanShipping = typeof order.shipping === "number"
    ? `C$${order.shipping.toFixed(2)}`
    : String(order.shipping);

  const cleanHst = typeof order.hst === "number"
    ? `C$${order.hst.toFixed(2)}`
    : String(order.hst);

  const itemsListHtml = order.items
    .map((item) => {
      const priceVal = typeof item.price === "number"
        ? item.price
        : parseFloat(String(item.price).replace(/[^\d.-]/g, "")) || 0;
      const rowTotal = (priceVal * item.quantity).toFixed(2);
      const skuCode = item.sku || `VE-${String(item.id || "001").slice(0, 3)}-${item.name.slice(0, 3)}`.toUpperCase();

      return `
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 12px 0; vertical-align: top;">
            <strong style="color: #1A2433; font-size: 13px; display: block; font-family: 'Montserrat', -apple-system, sans-serif;">${item.name}</strong>
            <span style="color: #8F9CA9; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-family: monospace;">SKU: ${skuCode}</span>
          </td>
          <td style="padding: 12px 10px; text-align: center; vertical-align: top; color: #4A5568; font-size: 13px; font-family: 'Montserrat', sans-serif;">
            ${item.quantity}
          </td>
          <td style="padding: 12px 0; text-align: right; vertical-align: top; color: #1A2433; font-weight: 600; font-size: 13px; font-family: 'Montserrat', sans-serif;">
            C$${rowTotal}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Order Confirmation - Vonn Essentials</title>
</head>
<body style="margin: 0; padding: 30px 10px; background-color: #F6F0E4; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #EADFC7; box-shadow: 0 4px 20px rgba(22, 47, 28, 0.04);">
    
    <!-- BRAND HEADER & UPPER CIRCULAR LOGO -->
    <div style="padding: 36px 30px 20px 30px; text-align: center; background-color: #FFFFFF; border-bottom: 1px solid #F1ECE3;">
      ${
        logoBase64
          ? `<img src="${logoBase64}" alt="Vonn Essentials Logo" style="width: 72px; height: 72px; border-radius: 50%; object-fit: contain; margin: 0 auto 14px auto; display: block;" />`
          : `<div style="width: 72px; height: 72px; border-radius: 50%; background-color: #162F1C; margin: 0 auto 14px auto; color: #C59A43; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold;">VE</div>`
      }
      <h1 style="margin: 0; font-size: 17px; font-weight: 800; text-transform: uppercase; letter-spacing: 4px; color: #162F1C;">V O N N &nbsp; E S S E N T I A L S</h1>
      <p style="margin: 6px 0 0 0; font-size: 10px; color: #8F9CA9; text-transform: uppercase; letter-spacing: 2px;">www.vonnessentials.com/products</p>
    </div>

    <!-- MAIN GREETING & THANKS -->
    <div style="padding: 30px 32px 10px 32px; text-align: left;">
      <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #162F1C;">
        Thank you for your order, ${order.customerName || "Valued Customer"}!
      </h2>
      <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #4A5568;">
        We have received your order <strong>#${order.orderId}</strong> and are carefully preparing your handcrafted skincare items infused with organic essential oils.
      </p>

      <!-- ATTACHED PDF NOTICE CALLOUT -->
      <div style="background-color: #F8FAF8; border: 1px solid #E2ECE4; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 18px;">📎</span>
          <div style="font-size: 12px; color: #162F1C; line-height: 1.5;">
            <strong>Official PDF Receipt Attached:</strong> Your full itemized, tax-compliant receipt (<code>Receipt-${order.orderId}.pdf</code>) is attached directly to this email for your records.
          </div>
        </div>
      </div>

      <!-- HIGHLIGHT SUMMARY BOX -->
      <div style="background-color: #FAFAFA; border: 1px solid #EDEDED; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <tr>
            <td style="padding: 4px 0; color: #8F9CA9; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; width: 45%;">Order Number</td>
            <td style="padding: 4px 0; color: #162F1C; font-weight: bold; text-align: right;">#${order.orderId}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #8F9CA9; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Date & Time</td>
            <td style="padding: 4px 0; color: #162F1C; text-align: right;">
              ${order.date}
              ${order.timezone ? `<div style="font-size: 10px; color: #059669; font-weight: 600; margin-top: 2px;">Local Time (${order.timezone})</div>` : ""}
            </td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #8F9CA9; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Delivery Method</td>
            <td style="padding: 4px 0; color: #162F1C; text-align: right;">${order.shippingMethod || "Standard Delivery"}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #8F9CA9; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Payment Method</td>
            <td style="padding: 4px 0; color: #162F1C; text-align: right;">${isETransfer ? "Interac e-transfer" : "PayPal / Card"}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0 0 0; border-top: 1px solid #E2E8F0; color: #162F1C; font-weight: 800; font-size: 14px; text-transform: uppercase;">Total (CAD)</td>
            <td style="padding: 10px 0 0 0; border-top: 1px solid #E2E8F0; color: #162F1C; font-weight: 800; font-size: 15px; text-align: right;">${cleanTotal}</td>
          </tr>
        </table>
      </div>

      <!-- PAYMENT STATUS (Confirmed Receipt) -->
      <div style="background-color: #F5FAF6; border: 1px solid #C2E2CB; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px;">
        <h4 style="margin: 0 0 4px 0; color: #162F1C; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
          ${isETransfer ? "Payment Confirmed (Interac e-Transfer)" : "Payment Confirmed"}
        </h4>
        <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #2B4E33;">
          ${isETransfer 
            ? "Your Interac e-Transfer payment was verified and approved. We are now preparing your order for dispatch." 
            : "Your payment was processed successfully. We are now packing your order for dispatch."}
        </p>
      </div>

      <!-- ORDER ITEMS SUMMARY TABLE -->
      <h3 style="margin: 20px 0 10px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #8F9CA9;">
        Ordered Items
      </h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="border-bottom: 2px solid #162F1C;">
            <th style="padding: 8px 0; text-align: left; font-size: 11px; text-transform: uppercase; color: #162F1C; font-weight: 700;">Item</th>
            <th style="padding: 8px 10px; text-align: center; font-size: 11px; text-transform: uppercase; color: #162F1C; font-weight: 700;">Qty</th>
            <th style="padding: 8px 0; text-align: right; font-size: 11px; text-transform: uppercase; color: #162F1C; font-weight: 700;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsListHtml}
        </tbody>
      </table>

      <!-- SHIPPING ADDRESS -->
      <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; margin-bottom: 24px;">
        <h4 style="margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #8F9CA9; font-weight: 700;">
          Shipping Address
        </h4>
        <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #1A2433;">
          ${order.customerName}<br/>
          ${order.address}<br/>
          ${order.city}, ${order.province} ${order.postal}<br/>
          ${order.country === "US" ? "United States" : "Canada"}
        </p>
      </div>

    </div>

    <!-- STORE FOOTER SIGNATURE -->
    <div style="background-color: #F8FAF8; padding: 24px 30px; text-align: center; border-top: 1px solid #EADFC7; font-size: 11px; color: #718096; line-height: 1.6;">
      <p style="margin: 0 0 4px 0; font-weight: 700; color: #162F1C; font-size: 12px;">Thank you for your order! Thank you for shopping with us!</p>
      <p style="margin: 0 0 10px 0;">Vonn Essentials &bull; 1530 Weston Road, Toronto, Ontario M9N 1T2 Canada</p>
      <p style="margin: 0;">Customer Service: +1 647-497-2929 &bull; <a href="mailto:customerservice@vonnessentials.com" style="color: #162F1C; text-decoration: none; font-weight: 600;">customerservice@vonnessentials.com</a></p>
    </div>

  </div>
</body>
</html>
  `;
};

/**
 * Sends an official order receipt with attached PDF directly through the authenticated user's Gmail
 */
export const sendGmailReceiptWithPdf = async (order: OrderDataForPdf): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> => {
  const token = cachedAccessToken;
  if (!token) {
    throw new Error("Gmail is not connected. Please connect via Admin Dashboard → Gmail Hub first.");
  }

  const userEmail = cachedGoogleUser?.email || "vonnessentials@gmail.com";
  const recipientEmail = order.customerEmail;
  if (!recipientEmail) {
    throw new Error("Order has no valid customer email address.");
  }

  // 1. Generate the vector PDF
  const pdfDoc = await generateReceiptPdf(order);
  const pdfArrayBuffer = pdfDoc.output("arraybuffer");
  const pdfBase64 = arrayBufferToBase64(pdfArrayBuffer);

  // 2. Get Logo for HTML email
  const logoBase64 = await getLogoBase64();

  // 3. Build HTML body
  const htmlBody = buildThankYouEmailHtml(order, logoBase64);

  // 4. Construct RFC 2822 / MIME Multipart message
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  const subject = `Order Confirmation #${order.orderId} - Vonn Essentials`;

  const mimeMessage = [
    `From: "Vonn Essentials" <${userEmail}>`,
    `To: ${recipientEmail}`,
    `Subject: =?UTF-8?B?${utf8ToBase64(subject)}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: base64`,
    "",
    utf8ToBase64(htmlBody),
    "",
    `--${boundary}`,
    `Content-Type: application/pdf; name="Receipt-${order.orderId}.pdf"`,
    `Content-Disposition: attachment; filename="Receipt-${order.orderId}.pdf"`,
    `Content-Transfer-Encoding: base64`,
    "",
    pdfBase64,
    "",
    `--${boundary}--`,
  ].join("\r\n");

  // Convert MIME message to base64url
  const rawBase64 = utf8ToBase64(mimeMessage)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // 5. Send via Gmail REST API
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: rawBase64 }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errMsg = errorData.error?.message || `Gmail API responded with HTTP ${response.status}`;
    console.error("Gmail API Send Error:", errorData);
    throw new Error(errMsg);
  }

  const result = await response.json();
  return { success: true, messageId: result.id };
};

/**
 * Sends a custom test or admin email to any destination address
 */
export const sendDirectGmailMessage = async (
  toEmail: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; messageId?: string }> => {
  const token = cachedAccessToken;
  if (!token) {
    throw new Error("Gmail is not connected. Please sign in with Google first.");
  }

  const userEmail = cachedGoogleUser?.email || "vonnessentials@gmail.com";

  const rawMime = [
    `From: "Vonn Essentials" <${userEmail}>`,
    `To: ${toEmail}`,
    `Subject: =?UTF-8?B?${utf8ToBase64(subject)}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: base64`,
    "",
    utf8ToBase64(htmlContent),
  ].join("\r\n");

  const rawBase64 = utf8ToBase64(rawMime)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: rawBase64 }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${response.status}`);
  }

  const result = await response.json();
  return { success: true, messageId: result.id };
};

/**
 * Sends a notification email to the administrator (vonnessentials@gmail.com)
 * when a customer submits an Interac e-Transfer confirmation screenshot.
 * Shows the screenshot directly in the email body!
 */
export const sendAdminInteracScreenshotEmailViaGmail = async (data: {
  orderId: string;
  total: string;
  customerName: string;
  customerEmail: string;
  date: string;
  deliveryAddress: string;
  items: Array<{ name: string; quantity: number; price: string | number }>;
  etDetails: {
    senderName: string;
    senderBank: string;
    senderEmail: string;
    referenceCode?: string;
    screenshot?: string;
  };
  adminEmail?: string;
}): Promise<{ success: boolean; messageId?: string }> => {
  const token = cachedAccessToken;
  if (!token) {
    throw new Error("Gmail is not connected in current session.");
  }

  const targetAdmin = data.adminEmail || "vonnessentials@gmail.com";
  const subject = `🔔 Interac e-Transfer Screenshot Received: Order #${data.orderId} (${data.total})`;

  const itemsHtml = data.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #edf2f7;">
        <td style="padding: 8px 0; font-size: 12px; color: #2d3748;"><strong>${item.name}</strong></td>
        <td style="padding: 8px 8px; font-size: 12px; text-align: center; color: #4a5568;">${item.quantity}</td>
        <td style="padding: 8px 0; font-size: 12px; text-align: right; color: #2d3748;">${typeof item.price === "number" ? `C$${item.price.toFixed(2)}` : item.price}</td>
      </tr>
    `
    )
    .join("");

  const screenshotHtml = data.etDetails.screenshot
    ? `
      <div style="margin: 20px 0; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
        <h4 style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #1a365d; font-weight: 700;">
          📸 Customer's Interac Confirmation Screenshot
        </h4>
        <p style="margin: 0 0 12px 0; font-size: 12px; color: #718096;">
          The customer uploaded this screenshot of the confirmation message/receipt Interac sent them:
        </p>
        <div style="text-align: center; background-color: #f7fafc; padding: 12px; border-radius: 8px; border: 1px dashed #cbd5e0;">
          <img 
            src="${data.etDetails.screenshot}" 
            alt="Interac Payment Confirmation Screenshot" 
            style="max-width: 100%; max-height: 600px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); display: inline-block;" 
          />
        </div>
      </div>
    `
    : `<p style="color: #e53e3e; font-size: 12px;">No screenshot provided.</p>`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 24px; color: #1a202c;">
  <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    
    <!-- Top Alert Banner -->
    <div style="background-color: #162F1C; padding: 24px 30px; text-align: left; color: #ffffff;">
      <span style="display: inline-block; background-color: #C59A43; color: #162F1C; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px; border-radius: 20px; margin-bottom: 8px;">
        Action Required &bull; Interac Verification
      </span>
      <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff;">
        New Interac Payment Screenshot Submitted
      </h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #d1fae5;">
        Order <strong>#${data.orderId}</strong> &bull; Total: <strong>${data.total}</strong>
      </p>
    </div>

    <div style="padding: 24px 30px;">
      
      <!-- Key Transfer Details -->
      <div style="background-color: #F8FAF8; border: 1px solid #E2ECE4; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 12px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #162F1C;">
          Bank Transfer Information
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <tr>
            <td style="padding: 4px 0; color: #718096; width: 40%;">Recipient Email:</td>
            <td style="padding: 4px 0; color: #162F1C; font-weight: bold;">order@vonnessentials.com</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #718096;">Sender Full Name:</td>
            <td style="padding: 4px 0; color: #162F1C; font-weight: bold;">${data.etDetails.senderName}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #718096;">Sender Bank:</td>
            <td style="padding: 4px 0; color: #162F1C; font-weight: bold;">${data.etDetails.senderBank}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #718096;">Sender Email:</td>
            <td style="padding: 4px 0; color: #162F1C; font-weight: bold;">${data.etDetails.senderEmail}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #718096;">Reference Code / Memo:</td>
            <td style="padding: 4px 0; color: #C59A43; font-weight: bold; font-family: monospace;">${data.etDetails.referenceCode || "None"}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #718096;">Order Total:</td>
            <td style="padding: 4px 0; color: #162F1C; font-weight: 800; font-size: 14px;">${data.total}</td>
          </tr>
        </table>
      </div>

      <!-- THE SCREENSHOT DISPLAYED IN THE EMAIL -->
      ${screenshotHtml}

      <!-- Next Steps Callout -->
      <div style="background-color: #FFFDF5; border: 1px solid #F3E2B8; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <h4 style="margin: 0 0 6px 0; color: #A96827; font-size: 12px; font-weight: 700; text-transform: uppercase;">
          Next Steps to Confirm Order
        </h4>
        <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #784E1A;">
          1. Check your bank account associated with <strong>order@vonnessentials.com</strong> to verify the deposit.<br/>
          2. Log in to the <strong>Vonn Essentials Admin Panel</strong> &rarr; <strong>Orders</strong>.<br/>
          3. Click <strong>"Confirm Order & Send Customer PDF Receipt"</strong> to update the status to Paid and automatically dispatch the official PDF receipt to <strong>${data.customerEmail}</strong>.
        </p>
      </div>

      <!-- Customer & Shipping -->
      <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; margin-bottom: 20px;">
        <h4 style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; color: #718096; font-weight: 700;">Customer & Shipping Address</h4>
        <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #2d3748;">
          <strong>${data.customerName}</strong> (${data.customerEmail})<br/>
          ${data.deliveryAddress}
        </p>
      </div>

      <!-- Items Summary -->
      <h4 style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; color: #718096; font-weight: 700;">Ordered Items</h4>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <thead>
          <tr style="border-bottom: 1px solid #cbd5e0;">
            <th style="padding: 6px 0; text-align: left; font-size: 10px; text-transform: uppercase; color: #718096;">Item</th>
            <th style="padding: 6px 8px; text-align: center; font-size: 10px; text-transform: uppercase; color: #718096;">Qty</th>
            <th style="padding: 6px 0; text-align: right; font-size: 10px; text-transform: uppercase; color: #718096;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

    </div>

    <div style="background-color: #F8FAF8; padding: 16px 30px; text-align: center; border-top: 1px solid #EADFC7; font-size: 11px; color: #718096;">
      Vonn Essentials Administration Notification System &bull; order@vonnessentials.com
    </div>
  </div>
</body>
</html>
  `;

  return sendDirectGmailMessage(targetAdmin, subject, htmlContent);
};

export interface RefundEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  totalOrderAmount?: number;
  paymentMethod: "paypal" | "etransfer" | string;
  reason?: string;
  customNote?: string;
  requestedAt?: string;
  completedAt?: string;
  items?: Array<{ name: string; quantity: number; price: string | number }>;
  language?: "en" | "fr";
}

/**
 * Builds a modern, customer-facing HTML email notifying them that their refund is being processed.
 */
export const buildRefundProcessingEmailHtml = (data: RefundEmailData, logoBase64: string): string => {
  const isFr = data.language === "fr";
  const formattedAmount = `C$${data.amount.toFixed(2)}`;
  const methodLabel = data.paymentMethod === "paypal" 
    ? (isFr ? "PayPal / Carte bancaire" : "PayPal / Credit Card") 
    : (isFr ? "Virement Interac e-Transfer" : "Interac e-Transfer");

  const timelineNotice = data.paymentMethod === "paypal"
    ? (isFr 
        ? "Votre remboursement sera recrédité sur votre compte PayPal ou votre carte sous 3 à 5 jours ouvrables."
        : "Your funds will be credited back to your original PayPal account or card within 3 to 5 business days.")
    : (isFr
        ? `Votre virement de remboursement sera envoyé par virement Interac à votre adresse courriel (${data.customerEmail}) sous 24 à 48 heures ouvrables.`
        : `Your refund will be sent via Interac e-Transfer directly to your registered email (${data.customerEmail}) within 1 to 2 business days.`);

  const itemsListHtml = data.items && data.items.length > 0 ? `
    <div style="margin: 20px 0; border-top: 1px solid #EADFC7; padding-top: 16px;">
      <h4 style="margin: 0 0 10px 0; font-size: 11px; text-transform: uppercase; color: #8F9CA9; font-weight: 700; letter-spacing: 0.5px;">
        ${isFr ? "Articles Concernés" : "Associated Order Items"}
      </h4>
      <table style="width: 100%; border-collapse: collapse;">
        ${data.items.map(item => `
          <tr style="border-bottom: 1px solid #F3EDE2;">
            <td style="padding: 6px 0; font-size: 13px; color: #2C3E50;"><strong>${item.name}</strong></td>
            <td style="padding: 6px 8px; font-size: 13px; text-align: center; color: #8F9CA9;">x${item.quantity}</td>
            <td style="padding: 6px 0; font-size: 13px; text-align: right; color: #162F1C; font-weight: 600;">
              ${typeof item.price === "number" ? `C$${item.price.toFixed(2)}` : item.price}
            </td>
          </tr>
        `).join("")}
      </table>
    </div>
  ` : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isFr ? "Remboursement en cours de traitement" : "Refund Processing"} - Vonn Essentials</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F7F5F0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #2C3E50;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #EADFC7;">
    
    <!-- Top Header & Logo -->
    <div style="background-color: #162F1C; padding: 36px 40px; text-align: center; border-bottom: 3px solid #C59A43;">
      ${logoBase64 ? `
        <img src="${logoBase64}" alt="Vonn Essentials" style="height: 52px; width: auto; max-width: 200px; margin: 0 auto; display: block;" />
      ` : `
        <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; letter-spacing: 2px; text-transform: uppercase; font-weight: 700;">VONN ESSENTIALS</h1>
      `}
      <p style="margin: 10px 0 0 0; color: #EADFC7; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;">
        ${isFr ? "Soins Naturels & Botaniques" : "Natural Botanical Skincare & Haircare"}
      </p>
    </div>

    <!-- Main Content Body -->
    <div style="padding: 36px 36px 28px 36px;">
      
      <!-- Processing Banner -->
      <div style="background-color: #FBF7EE; border: 1px solid #E5D5B8; border-radius: 12px; padding: 18px 20px; text-align: center; margin-bottom: 26px;">
        <span style="display: inline-block; background-color: #C59A43; color: #FFFFFF; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 12px; border-radius: 20px; margin-bottom: 10px;">
          ${isFr ? "Mise à Jour de Commande" : "Order Update"}
        </span>
        <h2 style="margin: 0 0 6px 0; color: #162F1C; font-size: 20px; font-weight: 700;">
          ${isFr ? "Votre Remboursement est en Cours de Traitement" : "Your Refund is Being Processed"}
        </h2>
        <p style="margin: 0; color: #8F9CA9; font-size: 13px;">
          ${isFr ? `Référence de commande : ` : `Order Reference: `}<strong style="color: #162F1C; font-family: monospace;">#${data.orderId}</strong>
        </p>
      </div>

      <!-- Greeting & Intro -->
      <p style="font-size: 15px; line-height: 1.6; color: #2C3E50; margin-bottom: 18px;">
        ${isFr 
          ? `Bonjour <strong>${data.customerName}</strong>,` 
          : `Hello <strong>${data.customerName}</strong>,`}
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #4A5568; margin-bottom: 24px;">
        ${isFr
          ? `Nous vous confirmons que votre demande de remboursement pour la commande <strong>#${data.orderId}</strong> a été enregistrée et est actuellement en cours de traitement par notre équipe.`
          : `We are writing to confirm that your refund request for <strong>Order #${data.orderId}</strong> has been received and is currently being processed by our team.`}
      </p>

      <!-- Refund Details Table -->
      <div style="background-color: #F8FAF8; border: 1px solid #E2EBE2; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #8F9CA9; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; width: 45%;">
              ${isFr ? "Montant Remboursé" : "Refund Amount"}
            </td>
            <td style="padding: 6px 0; font-size: 18px; font-weight: 800; color: #162F1C;">
              ${formattedAmount}
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #8F9CA9; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
              ${isFr ? "Méthode de Paiement" : "Payment Method"}
            </td>
            <td style="padding: 6px 0; font-weight: 600; color: #2C3E50;">
              ${methodLabel}
            </td>
          </tr>
          ${data.reason ? `
            <tr>
              <td style="padding: 6px 0; color: #8F9CA9; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                ${isFr ? "Motif" : "Reason"}
              </td>
              <td style="padding: 6px 0; color: #4A5568;">
                ${data.reason}
              </td>
            </tr>
          ` : ""}
          <tr>
            <td style="padding: 6px 0; color: #8F9CA9; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
              ${isFr ? "Statut" : "Status"}
            </td>
            <td style="padding: 6px 0;">
              <span style="display: inline-block; background-color: #FEF3C7; color: #92400E; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px;">
                ${isFr ? "En cours de traitement" : "Processing"}
              </span>
            </td>
          </tr>
        </table>

        ${data.customNote ? `
          <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed #D0DDD0;">
            <p style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; color: #8F9CA9; font-weight: 700;">
              ${isFr ? "Note de notre équipe :" : "Note from our team:"}
            </p>
            <p style="margin: 0; font-size: 13px; color: #2C3E50; font-style: italic;">
              "${data.customNote}"
            </p>
          </div>
        ` : ""}
      </div>

      <!-- Timeline & What to Expect -->
      <div style="background-color: #F9FAFB; border-left: 3px solid #162F1C; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
        <h4 style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #162F1C; font-weight: 700;">
          ${isFr ? "Délai de Remboursement" : "Timeline & What to Expect"}
        </h4>
        <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #4A5568;">
          ${timelineNotice}
        </p>
      </div>

      ${itemsListHtml}

      <!-- Questions / Support Section -->
      <div style="border-top: 1px solid #EADFC7; padding-top: 20px; text-align: center;">
        <p style="font-size: 13px; line-height: 1.5; color: #8F9CA9; margin: 0 0 12px 0;">
          ${isFr 
            ? "Si vous avez des questions concernant ce remboursement, n'hésitez pas à répondre directement à ce courriel ou à nous contacter à :"
            : "If you have any questions regarding this refund, simply reply directly to this email or reach us at:"}
        </p>
        <a href="mailto:order@vonnessentials.com" style="color: #162F1C; font-weight: 700; font-size: 14px; text-decoration: none; border-bottom: 1px dotted #162F1C;">
          order@vonnessentials.com
        </a>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: #F7F5F0; padding: 24px 36px; text-align: center; border-top: 1px solid #EADFC7; font-size: 12px; color: #8F9CA9;">
      <p style="margin: 0 0 6px 0; font-weight: 600; color: #162F1C;">
        Vonn Essentials
      </p>
      <p style="margin: 0; font-size: 11px;">
        Handcrafted Natural Wellness &bull; Ottawa & Montreal, Canada
      </p>
    </div>

  </div>
</body>
</html>
  `;
};

/**
 * Builds a modern, customer-facing HTML email notifying them that their refund is COMPLETED / DONE.
 */
export const buildRefundCompletedEmailHtml = (data: RefundEmailData, logoBase64: string): string => {
  const isFr = data.language === "fr";
  const formattedAmount = `C$${data.amount.toFixed(2)}`;
  const methodLabel = data.paymentMethod === "paypal" 
    ? (isFr ? "PayPal / Carte bancaire" : "PayPal / Credit Card") 
    : (isFr ? "Virement Interac e-Transfer" : "Interac e-Transfer");

  const completionNotice = data.paymentMethod === "paypal"
    ? (isFr 
        ? "Les fonds ont été recrédités sur votre compte PayPal ou votre carte de paiement. Selon votre institution financière, l'affichage sur votre relevé bancaire peut prendre entre 1 et 3 jours ouvrables."
        : "The funds have been credited back to your original PayPal account or payment card. Depending on your financial institution, it may take 1 to 3 business days to reflect on your statement.")
    : (isFr
        ? `Le virement de remboursement a été envoyé avec succès par virement Interac à votre adresse courriel (${data.customerEmail}). Veuillez vérifier votre boîte de réception ou de messages pour déposer les fonds.`
        : `The refund has been successfully sent via Interac e-Transfer directly to your email (${data.customerEmail}). Please check your inbox or mobile alerts to accept the deposit.`);

  const itemsListHtml = data.items && data.items.length > 0 ? `
    <div style="margin: 20px 0; border-top: 1px solid #EADFC7; padding-top: 16px;">
      <h4 style="margin: 0 0 10px 0; font-size: 11px; text-transform: uppercase; color: #8F9CA9; font-weight: 700; letter-spacing: 0.5px;">
        ${isFr ? "Articles Concernés" : "Associated Order Items"}
      </h4>
      <table style="width: 100%; border-collapse: collapse;">
        ${data.items.map(item => `
          <tr style="border-bottom: 1px solid #F3EDE2;">
            <td style="padding: 6px 0; font-size: 13px; color: #2C3E50;"><strong>${item.name}</strong></td>
            <td style="padding: 6px 8px; font-size: 13px; text-align: center; color: #8F9CA9;">x${item.quantity}</td>
            <td style="padding: 6px 0; font-size: 13px; text-align: right; color: #162F1C; font-weight: 600;">
              ${typeof item.price === "number" ? `C$${item.price.toFixed(2)}` : item.price}
            </td>
          </tr>
        `).join("")}
      </table>
    </div>
  ` : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isFr ? "Remboursement Effectué" : "Refund Completed"} - Vonn Essentials</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F7F5F0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #2C3E50;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #EADFC7;">
    
    <!-- Top Header & Logo -->
    <div style="background-color: #162F1C; padding: 36px 40px; text-align: center; border-bottom: 3px solid #10B981;">
      ${logoBase64 ? `
        <img src="${logoBase64}" alt="Vonn Essentials" style="height: 52px; width: auto; max-width: 200px; margin: 0 auto; display: block;" />
      ` : `
        <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; letter-spacing: 2px; text-transform: uppercase; font-weight: 700;">VONN ESSENTIALS</h1>
      `}
      <p style="margin: 10px 0 0 0; color: #EADFC7; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;">
        ${isFr ? "Soins Naturels & Botaniques" : "Natural Botanical Skincare & Haircare"}
      </p>
    </div>

    <!-- Main Content Body -->
    <div style="padding: 36px 36px 28px 36px;">
      
      <!-- Completed Banner -->
      <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 26px;">
        <span style="display: inline-block; background-color: #059669; color: #FFFFFF; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 12px; border-radius: 20px; margin-bottom: 10px;">
          ✓ ${isFr ? "Remboursement Effectué" : "Refund Completed"}
        </span>
        <h2 style="margin: 0 0 6px 0; color: #065F46; font-size: 22px; font-weight: 700;">
          ${isFr ? "Votre Remboursement a été Effectué !" : "Your Refund Has Been Processed & Sent!"}
        </h2>
        <p style="margin: 0; color: #047857; font-size: 13px;">
          ${isFr ? `Commande confirmée : ` : `Order Reference: `}<strong style="color: #065F46; font-family: monospace;">#${data.orderId}</strong>
        </p>
      </div>

      <!-- Greeting & Intro -->
      <p style="font-size: 15px; line-height: 1.6; color: #2C3E50; margin-bottom: 18px;">
        ${isFr 
          ? `Bonjour <strong>${data.customerName}</strong>,` 
          : `Hello <strong>${data.customerName}</strong>,`}
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #4A5568; margin-bottom: 24px;">
        ${isFr
          ? `Nous vous confirmons que le remboursement pour votre commande <strong>#${data.orderId}</strong> d'un montant de <strong style="color: #059669;">${formattedAmount}</strong> a été effectué avec succès par notre équipe.`
          : `We are pleased to inform you that the refund for your <strong>Order #${data.orderId}</strong> in the amount of <strong style="color: #059669;">${formattedAmount}</strong> has been successfully completed and sent.`}
      </p>

      <!-- Refund Details Table -->
      <div style="background-color: #F8FAF8; border: 1px solid #D1FAE5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #8F9CA9; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; width: 45%;">
              ${isFr ? "Montant Remboursé" : "Refund Amount"}
            </td>
            <td style="padding: 6px 0; font-size: 20px; font-weight: 800; color: #059669;">
              ${formattedAmount}
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #8F9CA9; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
              ${isFr ? "Méthode de Remboursement" : "Refund Method"}
            </td>
            <td style="padding: 6px 0; font-weight: 600; color: #2C3E50;">
              ${methodLabel}
            </td>
          </tr>
          ${data.reason ? `
            <tr>
              <td style="padding: 6px 0; color: #8F9CA9; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                ${isFr ? "Motif" : "Reason"}
              </td>
              <td style="padding: 6px 0; color: #4A5568;">
                ${data.reason}
              </td>
            </tr>
          ` : ""}
          <tr>
            <td style="padding: 6px 0; color: #8F9CA9; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
              ${isFr ? "Statut" : "Status"}
            </td>
            <td style="padding: 6px 0;">
              <span style="display: inline-block; background-color: #D1FAE5; color: #065F46; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 6px;">
                ✓ ${isFr ? "Terminé / Remboursé" : "Completed / Refunded"}
              </span>
            </td>
          </tr>
        </table>

        ${data.customNote ? `
          <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed #A7F3D0;">
            <p style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; color: #065F46; font-weight: 700;">
              ${isFr ? "Note de notre équipe :" : "Note from our team:"}
            </p>
            <p style="margin: 0; font-size: 13px; color: #2C3E50; font-style: italic;">
              "${data.customNote}"
            </p>
          </div>
        ` : ""}
      </div>

      <!-- Confirmation Notice Box -->
      <div style="background-color: #F0FDF4; border-left: 4px solid #059669; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
        <h4 style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #065F46; font-weight: 700;">
          ${isFr ? "Informations sur le Paiement" : "Payment Confirmation"}
        </h4>
        <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #047857;">
          ${completionNotice}
        </p>
      </div>

      ${itemsListHtml}

      <!-- Questions / Support Section -->
      <div style="border-top: 1px solid #EADFC7; padding-top: 20px; text-align: center;">
        <p style="font-size: 13px; line-height: 1.5; color: #8F9CA9; margin: 0 0 12px 0;">
          ${isFr 
            ? "Pour toute question supplémentaire ou pour de futurs achats, n'hésitez pas à nous contacter à :"
            : "If you have any further questions or need assistance, feel free to reply directly or contact us at:"}
        </p>
        <a href="mailto:order@vonnessentials.com" style="color: #162F1C; font-weight: 700; font-size: 14px; text-decoration: none; border-bottom: 1px dotted #162F1C;">
          order@vonnessentials.com
        </a>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: #F7F5F0; padding: 24px 36px; text-align: center; border-top: 1px solid #EADFC7; font-size: 12px; color: #8F9CA9;">
      <p style="margin: 0 0 6px 0; font-weight: 600; color: #162F1C;">
        Vonn Essentials
      </p>
      <p style="margin: 0; font-size: 11px;">
        Handcrafted Natural Wellness &bull; Ottawa & Montreal, Canada
      </p>
    </div>

  </div>
</body>
</html>
  `;
};

/**
 * Sends customer refund processing email directly via Gmail REST API
 */
export const sendCustomerRefundProcessingEmailViaGmail = async (
  data: RefundEmailData
): Promise<{ success: boolean; messageId?: string }> => {
  const token = cachedAccessToken;
  if (!token) {
    throw new Error("Gmail is not connected. Please connect via Admin Dashboard → Gmail Hub first.");
  }

  if (!data.customerEmail) {
    throw new Error("Order has no valid customer email address.");
  }

  const userEmail = cachedGoogleUser?.email || "vonnessentials@gmail.com";
  const logoBase64 = await getLogoBase64();
  const htmlBody = buildRefundProcessingEmailHtml(data, logoBase64);

  const subject = data.language === "fr"
    ? `Remboursement en cours : Commande #${data.orderId} - Vonn Essentials`
    : `Your Refund is Being Processed: Order #${data.orderId} - Vonn Essentials`;

  const rawMime = [
    `From: "Vonn Essentials" <${userEmail}>`,
    `To: ${data.customerEmail}`,
    `Subject: =?UTF-8?B?${utf8ToBase64(subject)}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: base64`,
    "",
    utf8ToBase64(htmlBody),
  ].join("\r\n");

  const rawBase64 = utf8ToBase64(rawMime)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: rawBase64 }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${response.status}`);
  }

  const result = await response.json();
  return { success: true, messageId: result.id };
};

/**
 * Sends customer refund COMPLETED email directly via Gmail REST API
 */
export const sendCustomerRefundCompletedEmailViaGmail = async (
  data: RefundEmailData
): Promise<{ success: boolean; messageId?: string }> => {
  const token = cachedAccessToken;
  if (!token) {
    throw new Error("Gmail is not connected. Please connect via Admin Dashboard → Gmail Hub first.");
  }

  if (!data.customerEmail) {
    throw new Error("Order has no valid customer email address.");
  }

  const userEmail = cachedGoogleUser?.email || "vonnessentials@gmail.com";
  const logoBase64 = await getLogoBase64();
  const htmlBody = buildRefundCompletedEmailHtml(data, logoBase64);

  const subject = data.language === "fr"
    ? `Remboursement Effectué : Commande #${data.orderId} - Vonn Essentials`
    : `Refund Completed: Order #${data.orderId} - Vonn Essentials`;

  const rawMime = [
    `From: "Vonn Essentials" <${userEmail}>`,
    `To: ${data.customerEmail}`,
    `Subject: =?UTF-8?B?${utf8ToBase64(subject)}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: base64`,
    "",
    utf8ToBase64(htmlBody),
  ].join("\r\n");

  const rawBase64 = utf8ToBase64(rawMime)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: rawBase64 }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${response.status}`);
  }

  const result = await response.json();
  return { success: true, messageId: result.id };
};

