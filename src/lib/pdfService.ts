import { jsPDF } from "jspdf";
import logoUrl from "../assets/images/vonn_logo.png";
import { formatOrderDateTime } from "./dateUtils";

export interface OrderDataForPdf {
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
  items: Array<{
    id?: string | number;
    name: string;
    price: string | number;
    quantity: number;
    sku?: string;
  }>;
  subtotal: string | number;
  shipping: string | number;
  hst: string | number;
  total: string | number;
  paymentMethod: string;
  shippingMethod: string;
}

// Memoized logo base64
let cachedLogoBase64: string | null = null;

export const getLogoBase64 = async (): Promise<string> => {
  if (cachedLogoBase64) return cachedLogoBase64;
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || 200;
          canvas.height = img.naturalHeight || 200;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL("image/png");
            cachedLogoBase64 = dataUrl;
            resolve(dataUrl);
            return;
          }
        } catch (e) {
          console.warn("Could not draw logo on canvas:", e);
        }
        resolve("");
      };
      img.onerror = () => {
        console.warn("Could not load logo image for PDF");
        resolve("");
      };
      img.src = logoUrl;
    } catch {
      resolve("");
    }
  });
};

const formatCurrency = (val: string | number): string => {
  if (typeof val === "number") return `C$${val.toFixed(2)}`;
  const clean = parseFloat(String(val).replace(/[^\d.-]/g, ""));
  return isNaN(clean) ? String(val) : `C$${clean.toFixed(2)}`;
};

/**
 * Generates an official vector PDF receipt exactly matching the visual identity
 * of receipt.JPG, receipt1.JPG, receipt2.JPG, with the upper circular logo and Montserrat/clean typography.
 */
export const generateReceiptPdf = async (order: OrderDataForPdf): Promise<jsPDF> => {
  // Create A4 portrait document (210mm x 297mm)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const leftMargin = 20;
  const rightMargin = 190;
  const contentWidth = rightMargin - leftMargin;

  let y = 16;

  // 1. UPPER CIRCULAR LOGO (vonn_logo.png)
  const logoBase64 = await getLogoBase64();
  const logoDiameter = 22; // 22mm diameter
  const logoX = (pageWidth - logoDiameter) / 2;

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", logoX, y, logoDiameter, logoDiameter, undefined, "FAST");
    } catch (e) {
      console.warn("jsPDF addImage failed:", e);
    }
  }

  y += logoDiameter + 5;

  // 2. BRAND NAME & WEB URL (Centered)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(22, 47, 28); // Brand forest #162F1C
  // Spaced title: V O N N   E S S E N T I A L S
  doc.text("V O N N   E S S E N T I A L S", pageWidth / 2, y, { align: "center" });

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(130, 140, 150);
  doc.text("www.vonnessentials.com/products", pageWidth / 2, y, { align: "center" });

  y += 12;

  // 3. TWO-COLUMN BUSINESS INFO & CUSTOMER SERVICE
  doc.setFontSize(8.5);
  doc.setTextColor(40, 45, 50);

  // Left Column: Business Address
  doc.setFont("helvetica", "bold");
  doc.text("Vonn Essentials", leftMargin, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 95, 100);
  doc.text("1530 Weston Road", leftMargin, y + 4.2);
  doc.text("Toronto, Ontario M9N 1T2", leftMargin, y + 8.4);
  doc.text("Canada", leftMargin, y + 12.6);

  // Right Column: Customer Service
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 45, 50);
  doc.text("Customer service", rightMargin, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 95, 100);
  doc.text("+1 647-497-2929", rightMargin, y + 4.2, { align: "right" });
  doc.text("customerservice@vonnessentials.com", rightMargin, y + 8.4, { align: "right" });

  y += 18;

  // Horizontal Divider above date
  doc.setDrawColor(225, 230, 235);
  doc.setLineWidth(0.3);
  doc.line(leftMargin, y, rightMargin, y);

  y += 5;

  // Date line
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 35, 40);
  
  // Format with customer local timezone if available
  let displayDate = order.date;
  if (order.timezone || order.createdAt) {
    const formatted = formatOrderDateTime(order.createdAt || order.date, order.timezone, "en");
    displayDate = formatted.fullString;
  }
  doc.text(displayDate, leftMargin, y);

  y += 8;

  // 4. TWO-COLUMN: BILLING & SHIPPING vs DELIVERY / PAYMENT METHOD
  // Left Column: Customer details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(150, 155, 165);
  doc.text("BILLING & SHIPPING", leftMargin, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(20, 25, 30);
  const custName = (order.customerName || "Customer").toUpperCase();
  doc.text(custName, leftMargin, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(80, 85, 95);
  doc.text(order.address || "", leftMargin, y + 10);
  const cityLine = `${order.city || ""}${order.province ? `, ${order.province}` : ""} ${order.postal || ""}`.trim();
  doc.text(cityLine, leftMargin, y + 14.2);
  const countryLine = order.country === "US" ? "United States" : "Canada";
  doc.text(countryLine, leftMargin, y + 18.4);

  // Customer Email highlighted
  doc.setFont("helvetica", "bold");
  doc.setTextColor(22, 47, 28); // Brand accent
  doc.text(order.customerEmail || "", leftMargin, y + 23);

  // Right Column: Delivery Method & Payment Method
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(150, 155, 165);
  doc.text("DELIVERY METHOD", rightMargin, y, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(40, 45, 50);
  doc.text(order.shippingMethod || "Standard Delivery", rightMargin, y + 4.5, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(150, 155, 165);
  doc.text("PAYMENT METHOD", rightMargin, y + 12.5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(40, 45, 50);
  const isETransfer = String(order.paymentMethod).toLowerCase().includes("etransfer") || String(order.paymentMethod).toLowerCase().includes("interac");
  const paymentLabel = isETransfer ? "Interac e-transfer" : "PayPal / Card";
  doc.text(paymentLabel, rightMargin, y + 17, { align: "right" });

  y += 29;

  // 5. ORDER ITEMS TABLE
  doc.setDrawColor(220, 225, 230);
  doc.setLineWidth(0.4);
  doc.line(leftMargin, y, rightMargin, y);

  y += 6;

  // Table header: Order #
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(20, 25, 30);
  doc.text(`ORDER #${order.orderId}`, leftMargin, y);

  y += 7;

  // Items List
  order.items.forEach((item) => {
    // Product Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 35, 40);
    doc.text(item.name, leftMargin, y);

    // Quantity (Centered column at x=135)
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 85, 95);
    doc.text(String(item.quantity), 135, y, { align: "center" });

    // Item Total (Right aligned)
    const cleanItemPrice = typeof item.price === "number"
      ? item.price
      : parseFloat(String(item.price).replace(/[^\d.-]/g, "")) || 0;
    const itemTotalStr = `C$${(cleanItemPrice * item.quantity).toFixed(2)}`;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 35, 40);
    doc.text(itemTotalStr, rightMargin, y, { align: "right" });

    y += 4;

    // SKU
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(150, 155, 165);
    const skuCode = item.sku || `VE-${String(item.id || "001").slice(0, 3)}-${item.name.slice(0, 3)}`.toUpperCase();
    doc.text(`SKU : ${skuCode}`, leftMargin, y);

    y += 6.5;
  });

  y += 2;

  // Table bottom border
  doc.setDrawColor(220, 225, 230);
  doc.setLineWidth(0.4);
  doc.line(leftMargin, y, rightMargin, y);

  y += 8;

  // 6. TOTALS BLOCK (Right Aligned)
  const totalsBlockWidth = 70;
  const totalsLabelX = rightMargin - totalsBlockWidth;

  doc.setFontSize(8.5);

  // Items
  doc.setFont("helvetica", "normal");
  doc.setTextColor(130, 135, 145);
  doc.text("ITEMS", totalsLabelX, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 35, 40);
  doc.text(formatCurrency(order.subtotal), rightMargin, y, { align: "right" });

  y += 5.5;

  // Delivery
  doc.setFont("helvetica", "normal");
  doc.setTextColor(130, 135, 145);
  doc.text("DELIVERY", totalsLabelX, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 35, 40);
  doc.text(formatCurrency(order.shipping), rightMargin, y, { align: "right" });

  y += 5.5;

  // HST
  doc.setFont("helvetica", "normal");
  doc.setTextColor(130, 135, 145);
  doc.text("HST", totalsLabelX, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 35, 40);
  doc.text(formatCurrency(order.hst), rightMargin, y, { align: "right" });

  y += 5;

  // Divider line inside totals
  doc.setDrawColor(230, 235, 240);
  doc.setLineWidth(0.2);
  doc.line(totalsLabelX, y, rightMargin, y);

  y += 5.5;

  // TOTAL
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(20, 25, 30);
  doc.text("TOTAL", totalsLabelX, y);
  doc.text(formatCurrency(order.total), rightMargin, y, { align: "right" });

  y += 18;

  // 7. FOOTER & BARCODE
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 35, 40);
  doc.text("Thank you for your order!", pageWidth / 2, y, { align: "center" });

  y += 4.5;
  doc.setFontSize(8);
  doc.setTextColor(120, 125, 135);
  doc.text("Thank you for shopping with us!", pageWidth / 2, y, { align: "center" });

  y += 8;

  // Vector Barcode Lines
  const barcodeWidth = 70;
  const barcodeHeight = 11;
  const barcodeX = (pageWidth - barcodeWidth) / 2;
  const barcodeLines = 50;

  doc.setDrawColor(25, 30, 35);
  const stepX = barcodeWidth / barcodeLines;

  // Deterministic pattern based on orderId
  let seed = 0;
  for (let i = 0; i < order.orderId.length; i++) {
    seed += order.orderId.charCodeAt(i);
  }

  for (let i = 0; i < barcodeLines; i++) {
    const pseudoRand = Math.sin(seed + i * 997) * 10000;
    const isThick = Math.abs(pseudoRand - Math.floor(pseudoRand)) > 0.55;
    const isSkip = Math.abs(pseudoRand * 2 - Math.floor(pseudoRand * 2)) < 0.12;

    if (!isSkip) {
      doc.setLineWidth(isThick ? 0.6 : 0.25);
      const lineX = barcodeX + i * stepX;
      doc.line(lineX, y, lineX, y + barcodeHeight);
    }
  }

  y += barcodeHeight + 4.5;

  // Barcode text: ORDER - [orderId]
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(130, 135, 145);
  doc.text(`ORDER - ${order.orderId}`, pageWidth / 2, y, { align: "center" });

  return doc;
};

/**
 * Convenience helper to download the generated PDF in the browser
 */
export const downloadReceiptPdf = async (order: OrderDataForPdf) => {
  const doc = await generateReceiptPdf(order);
  doc.save(`Receipt-${order.orderId}.pdf`);
};
