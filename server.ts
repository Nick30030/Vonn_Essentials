import dotenv from "dotenv";
dotenv.config();
import serverless from "serverless-http";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
// Use require for node-fetch to avoid TypeScript type declaration issues in this project
// (a proper fix would be to install @types/node-fetch or migrate to the global fetch in Node 18+)
const fetch = require('node-fetch');
import admin from "firebase-admin";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc as firestoreSetDoc } from "firebase/firestore";
import nodemailer from "nodemailer";
import { getStore, saveStore } from "./serverStore";

// Create express app at module scope so it can be exported for serverless bundling
const app = express();

// Sync changes to Firestore's store/global document in the background.
// Prefer using the Admin SDK when a service account is provided (recommended for production).
async function syncToFirestore(data: Record<string, any>) {
  try {
    // If a service account is provided via env, use firebase-admin for authoritative writes.
    const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    const hasGAC = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (svcJson || hasGAC) {
      try {
        if (!admin.apps || admin.apps.length === 0) {
          if (svcJson) {
            const svc = JSON.parse(svcJson as string);
            admin.initializeApp({ credential: admin.credential.cert(svc as any) });
          } else {
            // If GOOGLE_APPLICATION_CREDENTIALS points to a file, admin will pick it up automatically
            admin.initializeApp();
          }
        }
        const adb = admin.firestore();
        await adb.doc("store/global").set(data, { merge: true });
        return;
      } catch (adminErr: any) {
        console.warn("Admin SDK sync failed, falling back to client SDK:", adminErr?.message || adminErr);
        // fall through to client SDK fallback
      }
    }

    // Fallback: client SDK using firebase-applet-config.json (works for admin clients with proper apiKey)
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (!fs.existsSync(configPath)) return;
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const fbApp = getApps().length === 0 ? initializeApp(config as any) : getApp();
    const db = getFirestore(fbApp, config.firestoreDatabaseId || "(default)");
    await firestoreSetDoc(doc(db, "store", "global"), data, { merge: true });
  } catch (err: any) {
    console.warn("Backend syncToFirestore notice:", err?.message || err);
  }
}

async function startServer() {
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // ─── Email helper: sends via Gmail SMTP using an App Password ───────────────
  // This never expires. To set up:
  //   1. Enable 2-Step Verification on vonnessentials@gmail.com
  //   2. Go to myaccount.google.com/apppasswords
  //   3. Create an app password (select "Mail" + "Other")
  //   4. Add GMAIL_APP_PASSWORD=<16-char password> to Vercel env vars
  // ─────────────────────────────────────────────────────────────────────────────
  async function sendGmailMessage(opts: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    from?: string;
    attachments?: Array<{
      filename: string;
      content: Buffer;
      contentType: string;
      cid: string;
    }>;
  }) {
    const gmailUser = process.env.GMAIL_SENDER || 'vonnessentials@gmail.com';
    const appPassword = process.env.GMAIL_APP_PASSWORD;

    if (!appPassword) {
      throw new Error(
        'Email not configured: add GMAIL_APP_PASSWORD to your Vercel environment variables. ' +
        'Generate one at myaccount.google.com/apppasswords (requires 2-Step Verification on the Gmail account).'
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: appPassword,
      },
    });

    const from = opts.from || `Vonn Essentials <${gmailUser}>`;

    await transporter.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      attachments: opts.attachments,
    });
  }

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Email sending endpoint (server-side Gmail). Protect this with an admin secret in production.
  app.post('/api/send-email', async (req, res) => {
    try {
      const adminSecret = process.env.ADMIN_API_SECRET;
      const provided = req.headers['x-admin-secret'] || req.query.admin_secret || req.body.admin_secret;
      if (adminSecret && provided !== adminSecret) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { to, subject, html, text, from } = req.body;
      if (!to || !subject) return res.status(400).json({ error: 'Missing to or subject' });

      await sendGmailMessage({ to, subject, html, text, from });
      res.json({ success: true });
    } catch (e: any) {
      console.error('send-email error:', e?.message || e);
      res.status(500).json({ error: e?.message || String(e) });
    }
  });

  // Global Store Data Endpoint
  app.get("/api/store", (req, res) => {
    try {
      const store = getStore();
      res.json(store);
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to load store" });
    }
  });

  // Products Endpoints
  app.get("/api/products", (req, res) => {
    try {
      const store = getStore();
      res.json({ productsEn: store.productsEn, productsFr: store.productsFr });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/products", (req, res) => {
    try {
      const { productEn, productFr } = req.body;
      if (!productEn) {
        return res.status(400).json({ error: "Product specification is required." });
      }
      const store = getStore();
      const newId = productEn.id || Date.now();
      const finalEn = { ...productEn, id: newId };
      const finalFr = productFr ? { ...productFr, id: newId } : { ...productEn, id: newId };

      store.productsEn = [...store.productsEn.filter(p => p.id !== newId), finalEn];
      store.productsFr = [...store.productsFr.filter(p => p.id !== newId), finalFr];
      saveStore(store);
      syncToFirestore({ productsEn: store.productsEn, productsFr: store.productsFr });

      res.json({ success: true, productEn: finalEn, productFr: finalFr, productsEn: store.productsEn, productsFr: store.productsFr });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/products/:id", (req, res) => {
    try {
      const id = Number(req.params.id);
      const { productEn, productFr } = req.body;
      const store = getStore();

      store.productsEn = store.productsEn.map(p => p.id === id ? { ...p, ...productEn, id } : p);
      store.productsFr = store.productsFr.map(p => p.id === id ? { ...p, ...(productFr || productEn), id } : p);
      saveStore(store);
      syncToFirestore({ productsEn: store.productsEn, productsFr: store.productsFr });

      res.json({ success: true, productsEn: store.productsEn, productsFr: store.productsFr });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/products/:id", (req, res) => {
    try {
      const id = Number(req.params.id);
      const store = getStore();

      store.productsEn = store.productsEn.filter(p => p.id !== id);
      store.productsFr = store.productsFr.filter(p => p.id !== id);
      saveStore(store);
      syncToFirestore({ productsEn: store.productsEn, productsFr: store.productsFr });

      res.json({ success: true, productsEn: store.productsEn, productsFr: store.productsFr });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/products/sync", (req, res) => {
    try {
      const { productsEn, productsFr } = req.body;
      const store = getStore();
      if (Array.isArray(productsEn) && productsEn.length > 0) {
        store.productsEn = productsEn;

        if (Array.isArray(productsFr) && productsFr.length > 0) {
          store.productsFr = productsFr;
        } else {
          // Fallback French array
          store.productsFr = productsEn.map(pEn => {
            const existingFr = store.productsFr.find(p => p.id === pEn.id);
            return existingFr || { ...pEn };
          });
        }
        saveStore(store);
        syncToFirestore({ productsEn: store.productsEn, productsFr: store.productsFr });
      }
      res.json({ success: true, productsEn: store.productsEn, productsFr: store.productsFr });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Blogs Endpoints
  app.get("/api/blogs", (req, res) => {
    try {
      const store = getStore();
      res.json({ blogsEn: store.blogsEn, blogsFr: store.blogsFr });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/blogs", (req, res) => {
    try {
      const { postEn, postFr } = req.body;
      const store = getStore();
      store.blogsEn.unshift(postEn);
      store.blogsFr.unshift(postFr);
      saveStore(store);
      res.json({ success: true, blogsEn: store.blogsEn, blogsFr: store.blogsFr });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/blogs/:id", (req, res) => {
    try {
      const id = req.params.id;
      const { postEn, postFr } = req.body;
      const store = getStore();
      store.blogsEn = store.blogsEn.map(b => b.id === id ? { ...b, ...postEn } : b);
      store.blogsFr = store.blogsFr.map(b => b.id === id ? { ...b, ...postFr } : b);
      saveStore(store);
      res.json({ success: true, blogsEn: store.blogsEn, blogsFr: store.blogsFr });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/blogs/:id", (req, res) => {
    try {
      const id = req.params.id;
      const store = getStore();
      store.blogsEn = store.blogsEn.filter(b => b.id !== id);
      store.blogsFr = store.blogsFr.filter(b => b.id !== id);
      saveStore(store);
      res.json({ success: true, blogsEn: store.blogsEn, blogsFr: store.blogsFr });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Pages & Content Endpoints
  app.post("/api/content/pages", (req, res) => {
    try {
      const { shippingEn, shippingFr, aboutEn, aboutFr, shippingSection, aboutSection, heroContent } = req.body;
      const store = getStore();
      if (shippingEn) store.shippingEn = shippingEn;
      if (shippingFr) store.shippingFr = shippingFr;
      if (aboutEn) store.aboutEn = aboutEn;
      if (aboutFr) store.aboutFr = aboutFr;
      if (shippingSection) store.shippingSection = shippingSection;
      if (aboutSection) store.aboutSection = aboutSection;
      if (heroContent) store.heroContent = heroContent;
      saveStore(store);
      syncToFirestore({
        shippingEn: store.shippingEn,
        shippingFr: store.shippingFr,
        aboutEn: store.aboutEn,
        aboutFr: store.aboutFr,
        shippingSection: store.shippingSection,
        aboutSection: store.aboutSection,
        heroContent: store.heroContent
      });
      res.json({ success: true, store });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/content/hero", (req, res) => {
    try {
      const heroContent = req.body;
      const store = getStore();
      store.heroContent = heroContent;
      saveStore(store);
      syncToFirestore({ heroContent });
      res.json({ success: true, heroContent: store.heroContent });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Announcements
  app.get("/api/announcement", (req, res) => {
    try {
      const store = getStore();
      res.json(store.announcement);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/announcement", (req, res) => {
    try {
      const { textEn, textFr, isActive } = req.body;
      const store = getStore();
      store.announcement = { textEn, textFr, isActive: !!isActive };
      saveStore(store);
      res.json({ success: true, announcement: store.announcement });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Newsletters
  app.get("/api/newsletters", (req, res) => {
    try {
      const store = getStore();
      res.json(store.newsletters);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/newsletters", (req, res) => {
    try {
      const newsletter = req.body;
      const store = getStore();
      store.newsletters = [newsletter, ...store.newsletters];
      saveStore(store);
      res.json({ success: true, newsletters: store.newsletters });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Gift & Promo Codes
  app.get("/api/gift-codes", (req, res) => {
    try {
      const store = getStore();
      res.json(store.giftCodes);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/gift-codes", (req, res) => {
    try {
      const codeData = req.body;
      const store = getStore();
      const existingIdx = store.giftCodes.findIndex(g => g.code === codeData.code);
      if (existingIdx >= 0) {
        store.giftCodes[existingIdx] = codeData;
      } else {
        store.giftCodes = [codeData, ...store.giftCodes];
      }
      saveStore(store);
      res.json({ success: true, giftCodes: store.giftCodes });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/gift-codes/:code", (req, res) => {
    try {
      const code = req.params.code;
      const store = getStore();
      store.giftCodes = store.giftCodes.filter(g => g.code !== code);
      saveStore(store);
      res.json({ success: true, giftCodes: store.giftCodes });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Orders Endpoints
  app.get("/api/orders", (req, res) => {
    try {
      const store = getStore();
      res.json(store.orders);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/orders", (req, res) => {
    try {
      const order = req.body;
      const store = getStore();
      store.orders = [order, ...store.orders];
      saveStore(store);
      res.json({ success: true, order, orders: store.orders });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/orders/:id/status", (req, res) => {
    try {
      const id = req.params.id;
      const { paymentStatus } = req.body;
      const store = getStore();
      store.orders = store.orders.map(o => o.id === id ? { ...o, paymentStatus } : o);
      saveStore(store);
      res.json({ success: true, orders: store.orders });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/orders/:id/refund", (req, res) => {
    try {
      const id = req.params.id;
      const { status, refundDetails } = req.body;
      const store = getStore();
      store.orders = store.orders.map(o => 
        o.id === id 
          ? { 
              ...o, 
              paymentStatus: status || "refund_processing", 
              refundDetails: refundDetails || {
                requestedAt: new Date().toISOString(),
                amount: o.total,
                status: "processing"
              } 
            } 
          : o
      );
      saveStore(store);
      res.json({ success: true, orders: store.orders });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/send-refund-notification", async (req, res) => {
    try {
      const data = req.body;
      console.log(`[Refund Event] Refund processing initiated for Order #${data.orderId}`);
      console.log(`Customer: ${data.customerName} (${data.customerEmail}) | Amount: C$${data.amount}`);
      
      const store = getStore() as any;
      if (!store.adminNotifications) {
        store.adminNotifications = [];
      }
      store.adminNotifications = [
        {
          id: `REFUND-${Date.now()}`,
          type: "refund_processing",
          orderId: data.orderId,
          total: data.amount,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          timestamp: new Date().toISOString(),
          reason: data.reason,
          customNote: data.customNote,
          read: false
        },
        ...store.adminNotifications
      ].slice(0, 50);
      saveStore(store);

      // Dispatch refund email to customer server-side (always-on, 24/7)
      if (data.customerEmail && !data.dispatchedViaGmail) {
        const isCompleted = data.stage === "completed";
        const isFr = data.language === "fr";
        const subject = isCompleted
          ? (isFr ? `Remboursement Effectué : Commande #${data.orderId} - Vonn Essentials` : `Refund Completed: Order #${data.orderId} - Vonn Essentials`)
          : (isFr ? `Remboursement en cours : Commande #${data.orderId} - Vonn Essentials` : `Your Refund is Being Processed: Order #${data.orderId} - Vonn Essentials`);

        const formattedAmount = typeof data.amount === "number" ? `C$${data.amount.toFixed(2)}` : String(data.amount);
        const statusLabel = isCompleted ? (isFr ? "Effectué / Remboursé" : "Completed / Refunded") : (isFr ? "En cours de traitement" : "Processing");

        const refundHtml = `<!DOCTYPE html>
<html lang="${isFr ? 'fr' : 'en'}"><head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;font-family:Georgia,serif;background:#f4f8f5;">
<div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(22,47,28,0.10);">
  <div style="background:#162F1C;padding:32px;text-align:center;">
    <h1 style="margin:0;color:#e8d5a3;font-size:24px;letter-spacing:2px;font-weight:normal;">VONN ESSENTIALS</h1>
    <p style="margin:8px 0 0;color:#a8c5a0;font-size:13px;letter-spacing:1px;">${isCompleted ? (isFr ? "Confirmation de Remboursement" : "Refund Confirmation") : (isFr ? "Notification de Remboursement" : "Refund Notice")}</p>
  </div>
  <div style="padding:32px;">
    <p style="margin:0 0 16px;color:#162F1C;font-size:15px;">${isFr ? 'Bonjour' : 'Hello'} <strong>${data.customerName}</strong>,</p>
    <p style="margin:0 0 20px;color:#555;font-size:14px;">
      ${isCompleted 
        ? (isFr ? `Votre remboursement pour la commande <strong>#${data.orderId}</strong> a été effectué avec succès.` : `Your refund for <strong>Order #${data.orderId}</strong> has been successfully completed.`)
        : (isFr ? `Nous avons bien initié le remboursement pour votre commande <strong>#${data.orderId}</strong>.` : `We have initiated the refund process for your <strong>Order #${data.orderId}</strong>.`)}
    </p>

    <div style="background:#f9fdf9;border:1px solid #d1fae5;border-radius:8px;padding:18px;margin-bottom:20px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#666;">${isFr ? 'Montant' : 'Amount'}</td><td style="padding:6px 0;font-weight:bold;color:#162F1C;font-size:18px;text-align:right;">${formattedAmount}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">${isFr ? 'Statut' : 'Status'}</td><td style="padding:6px 0;font-weight:bold;color:#059669;text-align:right;">${statusLabel}</td></tr>
        ${data.reason ? `<tr><td style="padding:6px 0;color:#666;">${isFr ? 'Motif' : 'Reason'}</td><td style="padding:6px 0;color:#162F1C;text-align:right;">${data.reason}</td></tr>` : ''}
      </table>
      ${data.customNote ? `<div style="margin-top:12px;padding-top:12px;border-top:1px dashed #a7f3d0;"><p style="margin:0;font-size:12px;color:#065F46;font-weight:bold;">${isFr ? 'Note :' : 'Note:'}</p><p style="margin:4px 0 0;font-size:13px;color:#333;font-style:italic;">"${data.customNote}"</p></div>` : ''}
    </div>

    <p style="margin:24px 0 0;color:#666;font-size:13px;text-align:center;">${isFr ? 'Des questions ? Contactez-nous à' : 'Questions? Contact us at'} <a href="mailto:vonnessentials@gmail.com" style="color:#162F1C;">vonnessentials@gmail.com</a></p>
  </div>
  <div style="background:#162F1C;padding:16px 32px;text-align:center;">
    <p style="margin:0;color:#a8c5a0;font-size:12px;">© 2025 Vonn Essentials. All rights reserved.</p>
  </div>
</div>
</body></html>`;

        try {
          await sendGmailMessage({
            to: data.customerEmail,
            subject,
            html: refundHtml,
            from: `Vonn Essentials <${process.env.GMAIL_SENDER || "vonnessentials@gmail.com"}>`
          });
          console.log(`[Email] Customer refund email sent to ${data.customerEmail} for Order #${data.orderId}`);
        } catch (emailErr: any) {
          console.error(`[Email] Customer refund email failed:`, emailErr?.message || emailErr);
        }
      }

      res.json({ success: true, message: "Refund notification recorded and processed" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

function formatCurrency(val: any): string {
  if (val === undefined || val === null) return "C$0.00";
  if (typeof val === "number") {
    return isNaN(val) ? "C$0.00" : `C$${val.toFixed(2)}`;
  }
  const str = String(val).trim();
  if (!str) return "C$0.00";
  const clean = parseFloat(str.replace(/[^\d.-]/g, ""));
  if (isNaN(clean)) {
    return str && !str.includes("NaN") ? (str.startsWith("C$") ? str : `C$${str}`) : "C$0.00";
  }
  return `C$${clean.toFixed(2)}`;
}

  // Interac Screenshot Notification – stores the alert AND emails the admin server-side
  // This fires regardless of whether Gmail Hub is connected on the frontend.
  app.post("/api/notify-admin-screenshot", async (req, res) => {
    try {
      const data = req.body;
      console.log(`[Admin Alert] Interac e-Transfer screenshot received for Order #${data.orderId}`);
      console.log(`Customer: ${data.customerName} (${data.customerEmail}) | Amount: ${data.total}`);

      // 1. Persist notification in the store
      const store = getStore() as any;
      if (!store.adminNotifications) store.adminNotifications = [];
      store.adminNotifications = [
        {
          id: `NOTIF-${Date.now()}`,
          type: "interac_screenshot",
          orderId: data.orderId,
          total: formatCurrency(data.total),
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          timestamp: new Date().toISOString(),
          details: data.etDetails,
          read: false
        },
        ...store.adminNotifications
      ].slice(0, 50);
      saveStore(store);

      // 2. Email the admin via server-side Gmail OAuth2 (always online, no Hub required)
      const adminEmail = "vonnessentials@gmail.com";
      const hasScreenshot = !!(data.etDetails?.screenshot);

      // Parse the base64 data URL into a Buffer for CID attachment.
      // Gmail blocks inline base64 src="data:..." images, but renders CID attachments correctly.
      let screenshotAttachment: { filename: string; content: Buffer; contentType: string; cid: string } | null = null;
      if (hasScreenshot) {
        try {
          const dataUrl: string = data.etDetails.screenshot;
          const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            const mimeType = matches[1]; // e.g. "image/jpeg" or "image/png"
            const base64Data = matches[2];
            const ext = mimeType.split('/')[1] || 'jpg';
            screenshotAttachment = {
              filename: `interac-screenshot.${ext}`,
              content: Buffer.from(base64Data, 'base64'),
              contentType: mimeType,
              cid: 'interac-screenshot',
            };
          }
        } catch (parseErr) {
          console.warn('[Email] Could not parse screenshot data URL:', parseErr);
        }
      }

      // Use cid: reference if we have the attachment, otherwise show a warning
      const screenshotNote = screenshotAttachment
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
                src="cid:interac-screenshot"
                alt="Interac Payment Confirmation Screenshot"
                style="max-width: 100%; max-height: 600px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); display: inline-block;"
              />
            </div>
          </div>
        `
        : `<p style="margin:12px 0;color:#c0392b;"><strong>No screenshot uploaded.</strong> Contact the customer if needed.</p>`;

      const itemsHtml = Array.isArray(data.items)
        ? data.items.map((it: any) => `<tr>
            <td style="padding:6px 8px;border-bottom:1px solid #e8f0eb;">${it.name}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e8f0eb;text-align:center;">${it.quantity}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e8f0eb;text-align:right;">${formatCurrency(it.price)}</td>
          </tr>`).join("")
        : "<tr><td colspan='3' style='padding:6px 8px;'>No item details available.</td></tr>";

      const formattedTotal = formatCurrency(data.total);

      const alertHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Interac Screenshot Alert</title></head>
<body style="margin:0;padding:0;font-family:Georgia,serif;background:#f4f8f5;">
<div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(22,47,28,0.10);">
  <div style="background:#162F1C;padding:28px 32px;text-align:center;">
    <h1 style="margin:0;color:#e8d5a3;font-size:22px;letter-spacing:1px;">🔔 Interac e-Transfer Alert</h1>
    <p style="margin:6px 0 0;color:#a8c5a0;font-size:13px;">Vonn Essentials – Admin Notification</p>
  </div>
  <div style="padding:28px 32px;">
    <p style="margin:0 0 18px;color:#162F1C;font-size:15px;">A customer has submitted their Interac e-Transfer confirmation for the following order.</p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;background:#f9fdf9;border-radius:8px;overflow:hidden;">
      <tr><td style="padding:10px 14px;color:#555;font-size:13px;width:45%;">Order ID</td><td style="padding:10px 14px;font-weight:bold;color:#162F1C;">#${data.orderId}</td></tr>
      <tr style="background:#f0f7f2;"><td style="padding:10px 14px;color:#555;font-size:13px;">Customer</td><td style="padding:10px 14px;font-weight:bold;color:#162F1C;">${data.customerName}</td></tr>
      <tr><td style="padding:10px 14px;color:#555;font-size:13px;">Customer Email</td><td style="padding:10px 14px;color:#162F1C;">${data.customerEmail}</td></tr>
      <tr style="background:#f0f7f2;"><td style="padding:10px 14px;color:#555;font-size:13px;">Order Total</td><td style="padding:10px 14px;font-weight:bold;color:#162F1C;font-size:16px;">${formattedTotal}</td></tr>
      <tr><td style="padding:10px 14px;color:#555;font-size:13px;">Delivery Address</td><td style="padding:10px 14px;color:#162F1C;">${data.deliveryAddress || "—"}</td></tr>
    </table>

    <h3 style="margin:0 0 10px;color:#162F1C;font-size:15px;border-bottom:2px solid #e8f0eb;padding-bottom:8px;">💳 Transfer Details (Sender)</h3>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;background:#f9fdf9;border-radius:8px;overflow:hidden;">
      <tr><td style="padding:10px 14px;color:#555;font-size:13px;width:45%;">Sender Name</td><td style="padding:10px 14px;color:#162F1C;">${data.etDetails?.senderName || "—"}</td></tr>
      <tr style="background:#f0f7f2;"><td style="padding:10px 14px;color:#555;font-size:13px;">Sender Bank</td><td style="padding:10px 14px;color:#162F1C;">${data.etDetails?.senderBank || "—"}</td></tr>
      <tr><td style="padding:10px 14px;color:#555;font-size:13px;">Sender Email</td><td style="padding:10px 14px;color:#162F1C;">${data.etDetails?.senderEmail || "—"}</td></tr>
      <tr style="background:#f0f7f2;"><td style="padding:10px 14px;color:#555;font-size:13px;">Reference Code</td><td style="padding:10px 14px;color:#162F1C;font-weight:bold;">${data.etDetails?.referenceCode || "—"}</td></tr>
    </table>

    <h3 style="margin:0 0 10px;color:#162F1C;font-size:15px;border-bottom:2px solid #e8f0eb;padding-bottom:8px;">🛍️ Items Ordered</h3>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <thead><tr style="background:#162F1C;color:#e8d5a3;">
        <th style="padding:8px 10px;text-align:left;font-size:13px;">Product</th>
        <th style="padding:8px 10px;text-align:center;font-size:13px;">Qty</th>
        <th style="padding:8px 10px;text-align:right;font-size:13px;">Price</th>
      </tr></thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    ${screenshotNote}

    <div style="background:#fffbf0;border:1px solid #f0e0a0;border-radius:8px;padding:14px 18px;margin-top:20px;">
      <p style="margin:0;color:#7a5c00;font-size:13px;font-weight:bold;">⚡ Action Required</p>
      <p style="margin:6px 0 0;color:#7a5c00;font-size:13px;">Please verify your bank deposit for <strong>${formattedTotal}</strong>, then open the Admin Panel and confirm the order to trigger the official receipt email to the customer.</p>
    </div>
  </div>
  <div style="background:#162F1C;padding:16px 32px;text-align:center;">
    <p style="margin:0;color:#a8c5a0;font-size:12px;">Vonn Essentials — Automated Admin Alert • Do not reply to this message</p>
  </div>
</div>
</body></html>`;

      // Await email dispatch so serverless functions (e.g. Vercel) don't freeze before completion
      try {
        await sendGmailMessage({
          to: adminEmail,
          subject: `🔔 Interac Screenshot: Order #${data.orderId} – ${formattedTotal} from ${data.customerName}`,
          html: alertHtml,
          from: `Vonn Essentials Orders <${process.env.GMAIL_SENDER || "vonnessentials@gmail.com"}>`,
          attachments: screenshotAttachment ? [screenshotAttachment] : undefined,
        });
        console.log(`[Email] Admin screenshot alert sent to ${adminEmail} for Order #${data.orderId}`);
      } catch (emailErr: any) {
        console.error(`[Email] Admin alert email failed:`, emailErr?.message || emailErr);
      }

      res.json({ success: true, message: "Admin notification recorded and email dispatched" });
    } catch (e: any) {
      console.error("Error handling screenshot notification:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Server-side customer receipt email – fires regardless of Gmail Hub session
  app.post("/api/send-receipt", async (req, res) => {
    try {
      const data = req.body;
      const { orderId, customerName, customerEmail, date, items, subtotal, shipping, hst, total, paymentMethod, shippingMethod, address, city, province, postal, country } = data;

      if (!customerEmail || !orderId) {
        return res.status(400).json({ error: "Missing customerEmail or orderId" });
      }

      const isETransfer = String(paymentMethod).toLowerCase().includes("etransfer") || String(paymentMethod).toLowerCase().includes("interac");
      const paymentLabel = isETransfer ? "Interac e-Transfer" : "PayPal / Credit Card";
      const formattedTotal = formatCurrency(total);
      const paymentNote = isETransfer
        ? `<p style="background:#fffbf0;border:1px solid #f0e0a0;border-radius:8px;padding:14px 18px;margin:20px 0;color:#7a5c00;font-size:13px;">⏳ <strong>Payment Pending:</strong> Your order will be confirmed once your Interac e-Transfer of <strong>${formattedTotal}</strong> is received and verified. You will receive a second email when your order is confirmed.</p>`
        : `<p style="background:#f0f7f2;border:1px solid #c8e6c9;border-radius:8px;padding:14px 18px;margin:20px 0;color:#2e7d32;font-size:13px;">✅ <strong>Payment Confirmed:</strong> Your payment of <strong>${formattedTotal}</strong> via ${paymentLabel} has been received and confirmed.</p>`;

      const itemsHtml = Array.isArray(items)
        ? items.map((it: any) => `<tr>
            <td style="padding:8px 10px;border-bottom:1px solid #e8f0eb;color:#162F1C;">${it.name}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #e8f0eb;text-align:center;color:#555;">${it.quantity}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #e8f0eb;text-align:right;color:#162F1C;">${formatCurrency(it.price)}</td>
          </tr>`).join("")
        : "";

      const receiptHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Order Confirmation – Vonn Essentials</title></head>
<body style="margin:0;padding:0;font-family:Georgia,serif;background:#f4f8f5;">
<div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(22,47,28,0.10);">
  <div style="background:#162F1C;padding:32px;text-align:center;">
    <h1 style="margin:0;color:#e8d5a3;font-size:24px;letter-spacing:2px;font-weight:normal;">VONN ESSENTIALS</h1>
    <p style="margin:8px 0 0;color:#a8c5a0;font-size:13px;letter-spacing:1px;">Order Confirmation</p>
  </div>
  <div style="padding:32px;">
    <p style="margin:0 0 16px;color:#162F1C;font-size:15px;">Dear <strong>${customerName}</strong>,</p>
    <p style="margin:0 0 20px;color:#555;font-size:14px;">Thank you for your order! Here is your confirmation summary.</p>

    ${paymentNote}

    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;background:#f9fdf9;border-radius:8px;overflow:hidden;">
      <tr><td style="padding:10px 14px;color:#555;font-size:13px;width:45%;">Order ID</td><td style="padding:10px 14px;font-weight:bold;color:#162F1C;">#${orderId}</td></tr>
      <tr style="background:#f0f7f2;"><td style="padding:10px 14px;color:#555;font-size:13px;">Date</td><td style="padding:10px 14px;color:#162F1C;">${date}</td></tr>
      <tr><td style="padding:10px 14px;color:#555;font-size:13px;">Payment</td><td style="padding:10px 14px;color:#162F1C;">${paymentLabel}</td></tr>
      <tr style="background:#f0f7f2;"><td style="padding:10px 14px;color:#555;font-size:13px;">Shipping</td><td style="padding:10px 14px;color:#162F1C;">${shippingMethod || "Standard Shipping"}</td></tr>
      <tr><td style="padding:10px 14px;color:#555;font-size:13px;">Delivery To</td><td style="padding:10px 14px;color:#162F1C;">${address || ""}, ${city || ""}, ${province || ""} ${postal || ""}, ${country || "CA"}</td></tr>
    </table>

    <h3 style="margin:0 0 10px;color:#162F1C;font-size:15px;border-bottom:2px solid #e8f0eb;padding-bottom:8px;">🛍️ Items</h3>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <thead><tr style="background:#162F1C;color:#e8d5a3;">
        <th style="padding:8px 10px;text-align:left;font-size:13px;">Product</th>
        <th style="padding:8px 10px;text-align:center;font-size:13px;">Qty</th>
        <th style="padding:8px 10px;text-align:right;font-size:13px;">Price</th>
      </tr></thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <tr><td style="padding:6px 0;color:#555;font-size:13px;">Subtotal</td><td style="padding:6px 0;text-align:right;color:#162F1C;">${formatCurrency(subtotal)}</td></tr>
      <tr><td style="padding:6px 0;color:#555;font-size:13px;">Shipping</td><td style="padding:6px 0;text-align:right;color:#162F1C;">${formatCurrency(shipping)}</td></tr>
      <tr><td style="padding:6px 0;color:#555;font-size:13px;">HST / Tax</td><td style="padding:6px 0;text-align:right;color:#162F1C;">${formatCurrency(hst)}</td></tr>
      <tr style="border-top:2px solid #162F1C;"><td style="padding:10px 0;color:#162F1C;font-weight:bold;font-size:16px;">Total</td><td style="padding:10px 0;text-align:right;color:#162F1C;font-weight:bold;font-size:16px;">${formattedTotal}</td></tr>
    </table>

    <p style="margin:24px 0 0;color:#555;font-size:13px;text-align:center;">Questions? Contact us at <a href="mailto:vonnessentials@gmail.com" style="color:#162F1C;">vonnessentials@gmail.com</a></p>
  </div>
  <div style="background:#162F1C;padding:16px 32px;text-align:center;">
    <p style="margin:0;color:#a8c5a0;font-size:12px;">© 2025 Vonn Essentials. All rights reserved.</p>
  </div>
</div>
</body></html>`;

      await sendGmailMessage({
        to: customerEmail,
        subject: `Order Confirmation #${orderId} – Vonn Essentials`,
        html: receiptHtml,
        from: `Vonn Essentials <${process.env.GMAIL_SENDER || "vonnessentials@gmail.com"}>`
      });

      console.log(`[Email] Receipt sent to ${customerEmail} for Order #${orderId}`);
      res.json({ success: true, message: "Receipt email sent" });
    } catch (e: any) {
      console.error("send-receipt error:", e?.message || e);
      res.status(500).json({ error: e?.message || String(e) });
    }
  });

  app.get("/api/admin-notifications", (req, res) => {
    try {
      const store = getStore() as any;
      res.json(store.adminNotifications || []);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Image Proxy to bypass CORS issues for 3D textures
  app.get("/api/proxy", async (req, res) => {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).send("Missing URL");
    }

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Failed to fetch image");
      
      const contentType = response.headers.get("content-type");
      if (contentType) {
        res.setHeader("Content-Type", contentType);
      }
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=86400");
      
      const buffer = await response.buffer();
      res.send(buffer);
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).send("Proxy failed");
    }
  });

  // Canada Post OAuth2 & Rates Integration
  let oauthToken = "";
  let tokenExpiry = 0;

  async function getCanadaPostToken() {
    const clientId = process.env.CANADA_POST_CLIENT_ID;
    const clientSecret = process.env.CANADA_POST_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;

    if (oauthToken && Date.now() < tokenExpiry) {
      return oauthToken;
    }

    try {
      const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      const response = await fetch("https://api.canadapost-postescanada.ca/prod/devportal-portaildesdeveloppeurs/cpc-api-native-oauth-provider/oauth2/token", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "grant_type=client_credentials&scope=merchant"
      });

      if (!response.ok) {
        throw new Error(`Token fetch failed: ${response.statusText}`);
      }

      const data = await response.json() as any;
      oauthToken = data.access_token;
      tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
      return oauthToken;
    } catch (error) {
      console.error("Canada Post Auth Token Error:", error);
      return null;
    }
  }

  app.post("/api/shipping/rates", async (req, res) => {
    const { postalCode, country, province, city, items } = req.body;
    if (!postalCode || !country || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 1. Calculate weight
    let totalWeight = 0;
    for (const item of items) {
      const weightStr = item.weight || "";
      let itemWeight = 0.15; // default 150g
      const clean = weightStr.toLowerCase();
      
      const gMatch = clean.match(/(\d+(?:\.\d+)?)\s*g\b/);
      if (gMatch) {
        itemWeight = parseFloat(gMatch[1]) / 1000;
      } else {
        const mlMatch = clean.match(/(\d+(?:\.\d+)?)\s*ml\b/);
        if (mlMatch) {
          itemWeight = parseFloat(mlMatch[1]) / 1000;
        } else {
          const ozMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:fl\.\s*)?oz\b/);
          if (ozMatch) {
            itemWeight = (parseFloat(ozMatch[1]) * 28.35) / 1000;
          } else {
            const numMatch = clean.match(/(\d+(?:\.\d+)?)/);
            if (numMatch) {
              const val = parseFloat(numMatch[1]);
              if (val > 0) {
                itemWeight = val < 10 ? val : val / 1000;
              }
            }
          }
        }
      }
      totalWeight += itemWeight * (item.quantity || 1);
    }

    if (totalWeight <= 0) totalWeight = 0.2;

    const length = Math.max(12, 12 + Math.floor(totalWeight * 2));
    const width = Math.max(10, 10 + Math.floor(totalWeight * 1.5));
    const height = Math.max(8, 8 + Math.floor(totalWeight * 1.2));

    const clientId = process.env.CANADA_POST_CLIENT_ID;
    const clientSecret = process.env.CANADA_POST_CLIENT_SECRET;
    const customerNumber = process.env.CANADA_POST_CUSTOMER_NUMBER || "0007271592";
    const contractId = process.env.CANADA_POST_CONTRACT_ID || "0041596528";
    const platformId = process.env.CANADA_POST_PLATFORM_ID || "5725069954";

    if (clientId && clientSecret) {
      try {
        const token = await getCanadaPostToken();
        if (token) {
          const formattedPostal = postalCode.replace(/\s+/g, "").toUpperCase();
          const requestBody: any = {
            customerNumber,
            contractId,
            quoteType: "commercial",
            parcelCharacteristics: {
              weight: parseFloat(totalWeight.toFixed(3)),
              dimensions: { length, width, height },
              unpackaged: false,
              mailingTube: false,
              oversized: false
            },
            originPostalCode: "M5V2T6",
            destination: {}
          };

          if (country === "CA") {
            requestBody.destination.domestic = { postalCode: formattedPostal };
          } else if (country === "US") {
            requestBody.destination.unitedStates = { zipCode: postalCode.trim() };
          }

          const response = await fetch("https://api.canadapost-postescanada.ca/prod/devportal-portaildesdeveloppeurs/rating/v1/prices", {
            method: "POST",
            headers: {
              "Accept-Language": req.headers["accept-language"] as string || "en-CA",
              "Authorization": `Bearer ${token}`,
              "accept": "application/json",
              "content-type": "application/json",
              "platform-id": platformId
            },
            body: JSON.stringify(requestBody)
          });

          if (response.ok) {
            const data = await response.json();
            return res.json(data);
          } else {
            const errorText = await response.text();
            console.warn("Canada Post API returned non-200, falling back to simulator:", errorText);
          }
        }
      } catch (error) {
        console.error("Canada Post API call failed, falling back to simulator:", error);
      }
    }

    // Local High-Fidelity Simulation Fallback
    const isDomestic = country === "CA";
    const prov = (province || "ON").toUpperCase();
    const cityClean = (city || "").toLowerCase().trim();
    const isToronto = cityClean === "toronto" && prov === "ON";

    const rates = [];

    const taxRates: Record<string, { gst: number, hst: number, pst: number }> = {
      "AB": { gst: 0.05, hst: 0, pst: 0 },
      "BC": { gst: 0.05, hst: 0, pst: 0.07 },
      "MB": { gst: 0.05, hst: 0, pst: 0.07 },
      "NB": { gst: 0, hst: 0.15, pst: 0 },
      "NL": { gst: 0, hst: 0.15, pst: 0 },
      "NT": { gst: 0.05, hst: 0, pst: 0 },
      "NS": { gst: 0, hst: 0.15, pst: 0 },
      "NU": { gst: 0.05, hst: 0, pst: 0 },
      "ON": { gst: 0, hst: 0.13, pst: 0 },
      "PE": { gst: 0, hst: 0.15, pst: 0 },
      "QC": { gst: 0.05, hst: 0, pst: 0.09975 },
      "SK": { gst: 0.05, hst: 0, pst: 0.06 },
      "YT": { gst: 0.05, hst: 0, pst: 0 }
    };

    const taxInfo = taxRates[prov] || { gst: 0.05, hst: 0, pst: 0 };

    function calculateTaxes(basePrice: number) {
      const gstAmt = parseFloat((basePrice * taxInfo.gst).toFixed(2));
      const hstAmt = parseFloat((basePrice * taxInfo.hst).toFixed(2));
      const pstAmt = parseFloat((basePrice * taxInfo.pst).toFixed(2));
      return {
        gst: { amt: gstAmt, percent: taxInfo.gst * 100 },
        pst: { amt: pstAmt, percent: taxInfo.pst * 100 },
        hst: { amt: hstAmt, percent: taxInfo.hst * 100 }
      };
    }

    if (isDomestic) {
      // 1. Regular Parcel
      let baseRP = 11.50;
      let transitRP = 3;
      if (isToronto) {
        baseRP = 9.80;
        transitRP = 1;
      } else if (prov === "ON" || prov === "QC") {
        baseRP = 12.50;
        transitRP = 2;
      } else if (["MB", "SK", "NB", "NS", "PE"].includes(prov)) {
        baseRP = 17.50;
        transitRP = 4;
      } else if (["AB", "BC", "NL"].includes(prov)) {
        baseRP = 21.50;
        transitRP = 5;
      } else {
        baseRP = 27.50;
        transitRP = 7;
      }

      const weightCostRP = parseFloat((totalWeight * 1.15).toFixed(2));
      const baseSubRP = baseRP + weightCostRP;
      const fuelSurchargeRP = parseFloat((baseSubRP * 0.17).toFixed(2));
      const finalBaseRP = parseFloat((baseSubRP + fuelSurchargeRP).toFixed(2));
      const taxesRP = calculateTaxes(finalBaseRP);
      const totalTaxRP = parseFloat((taxesRP.gst.amt + taxesRP.pst.amt + taxesRP.hst.amt).toFixed(2));
      const dueRP = parseFloat((finalBaseRP + totalTaxRP).toFixed(2));

      rates.push({
        serviceCode: "DOM.RP",
        serviceName: "Regular Parcel",
        priceDetails: {
          base: finalBaseRP,
          taxes: taxesRP,
          due: dueRP,
          options: [],
          adjustments: [
            { adjustmentCode: "FUEL", adjustmentName: "Fuel Surcharge", adjustmentCost: fuelSurchargeRP }
          ]
        },
        weightDetails: { cubedWeight: parseFloat((totalWeight * 1.1).toFixed(2)) },
        serviceStandard: {
          amDelivery: false,
          guaranteedDelivery: false,
          expectedTransitTime: transitRP,
          expectedDeliveryDate: new Date(Date.now() + transitRP * 24 * 60 * 60 * 1000).toISOString()
        }
      });

      // 2. Expedited Parcel
      let baseEP = 13.80;
      let transitEP = 2;
      if (isToronto) {
        baseEP = 11.20;
        transitEP = 1;
      } else if (prov === "ON" || prov === "QC") {
        baseEP = 14.80;
        transitEP = 2;
      } else if (["MB", "SK", "NB", "NS", "PE"].includes(prov)) {
        baseEP = 19.20;
        transitEP = 3;
      } else if (["AB", "BC", "NL"].includes(prov)) {
        baseEP = 23.80;
        transitEP = 4;
      } else {
        baseEP = 29.80;
        transitEP = 6;
      }

      const weightCostEP = parseFloat((totalWeight * 1.45).toFixed(2));
      const baseSubEP = baseEP + weightCostEP;
      const fuelSurchargeEP = parseFloat((baseSubEP * 0.17).toFixed(2));
      const finalBaseEP = parseFloat((baseSubEP + fuelSurchargeEP).toFixed(2));
      const taxesEP = calculateTaxes(finalBaseEP);
      const totalTaxEP = parseFloat((taxesEP.gst.amt + taxesEP.pst.amt + taxesEP.hst.amt).toFixed(2));
      const dueEP = parseFloat((finalBaseEP + totalTaxEP).toFixed(2));

      rates.push({
        serviceCode: "DOM.EP",
        serviceName: "Expedited Parcel",
        priceDetails: {
          base: finalBaseEP,
          taxes: taxesEP,
          due: dueEP,
          options: [],
          adjustments: [
            { adjustmentCode: "FUEL", adjustmentName: "Fuel Surcharge", adjustmentCost: fuelSurchargeEP }
          ]
        },
        weightDetails: { cubedWeight: parseFloat((totalWeight * 1.1).toFixed(2)) },
        serviceStandard: {
          amDelivery: false,
          guaranteedDelivery: true,
          expectedTransitTime: transitEP,
          expectedDeliveryDate: new Date(Date.now() + transitEP * 24 * 60 * 60 * 1000).toISOString()
        }
      });

      // 3. Xpresspost
      let baseXP = 21.50;
      let transitXP = 1;
      if (isToronto) {
        baseXP = 16.50;
        transitXP = 1;
      } else if (prov === "ON" || prov === "QC") {
        baseXP = 23.50;
        transitXP = 1;
      } else if (["MB", "SK", "NB", "NS", "PE"].includes(prov)) {
        baseXP = 28.00;
        transitXP = 2;
      } else if (["AB", "BC", "NL"].includes(prov)) {
        baseXP = 32.50;
        transitXP = 2;
      } else {
        baseXP = 39.50;
        transitXP = 3;
      }

      const weightCostXP = parseFloat((totalWeight * 2.25).toFixed(2));
      const baseSubXP = baseXP + weightCostXP;
      const fuelSurchargeXP = parseFloat((baseSubXP * 0.17).toFixed(2));
      const finalBaseXP = parseFloat((baseSubXP + fuelSurchargeXP).toFixed(2));
      const taxesXP = calculateTaxes(finalBaseXP);
      const totalTaxXP = parseFloat((taxesXP.gst.amt + taxesXP.pst.amt + taxesXP.hst.amt).toFixed(2));
      const dueXP = parseFloat((finalBaseXP + totalTaxXP).toFixed(2));

      rates.push({
        serviceCode: "DOM.XP",
        serviceName: "Xpresspost",
        priceDetails: {
          base: finalBaseXP,
          taxes: taxesXP,
          due: dueXP,
          options: [],
          adjustments: [
            { adjustmentCode: "FUEL", adjustmentName: "Fuel Surcharge", adjustmentCost: fuelSurchargeXP }
          ]
        },
        weightDetails: { cubedWeight: parseFloat((totalWeight * 1.1).toFixed(2)) },
        serviceStandard: {
          amDelivery: false,
          guaranteedDelivery: true,
          expectedTransitTime: transitXP,
          expectedDeliveryDate: new Date(Date.now() + transitXP * 24 * 60 * 60 * 1000).toISOString()
        }
      });
    } else {
      // US Shipping
      // 1. Tracked Packet USA
      const baseTP = 15.80;
      const weightCostTP = parseFloat((totalWeight * 1.95).toFixed(2));
      const baseSubTP = baseTP + weightCostTP;
      const fuelSurchargeTP = parseFloat((baseSubTP * 0.15).toFixed(2));
      const finalBaseTP = parseFloat((baseSubTP + fuelSurchargeTP).toFixed(2));
      const taxesTP = { gst: { amt: 0, percent: 0 }, pst: { amt: 0, percent: 0 }, hst: { amt: 0, percent: 0 } };

      rates.push({
        serviceCode: "USA.TP",
        serviceName: "Tracked Packet – USA",
        priceDetails: {
          base: finalBaseTP,
          taxes: taxesTP,
          due: finalBaseTP,
          options: [],
          adjustments: [
            { adjustmentCode: "FUEL", adjustmentName: "Fuel Surcharge", adjustmentCost: fuelSurchargeTP }
          ]
        },
        weightDetails: { cubedWeight: parseFloat((totalWeight * 1.1).toFixed(2)) },
        serviceStandard: {
          amDelivery: false,
          guaranteedDelivery: false,
          expectedTransitTime: 6,
          expectedDeliveryDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString()
        }
      });

      // 2. Expedited Parcel USA
      const baseEP = 22.50;
      const weightCostEP = parseFloat((totalWeight * 2.45).toFixed(2));
      const baseSubEP = baseEP + weightCostEP;
      const fuelSurchargeEP = parseFloat((baseSubEP * 0.15).toFixed(2));
      const finalBaseEP = parseFloat((baseSubEP + fuelSurchargeEP).toFixed(2));

      rates.push({
        serviceCode: "USA.EP",
        serviceName: "Expedited Parcel USA",
        priceDetails: {
          base: finalBaseEP,
          taxes: taxesTP,
          due: finalBaseEP,
          options: [],
          adjustments: [
            { adjustmentCode: "FUEL", adjustmentName: "Fuel Surcharge", adjustmentCost: fuelSurchargeEP }
          ]
        },
        weightDetails: { cubedWeight: parseFloat((totalWeight * 1.1).toFixed(2)) },
        serviceStandard: {
          amDelivery: false,
          guaranteedDelivery: true,
          expectedTransitTime: 4,
          expectedDeliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
        }
      });

      // 3. Xpresspost USA
      const baseXP = 39.50;
      const weightCostXP = parseFloat((totalWeight * 3.80).toFixed(2));
      const baseSubXP = baseXP + weightCostXP;
      const fuelSurchargeXP = parseFloat((baseSubXP * 0.15).toFixed(2));
      const finalBaseXP = parseFloat((baseSubXP + fuelSurchargeXP).toFixed(2));

      rates.push({
        serviceCode: "USA.XP",
        serviceName: "Xpresspost USA",
        priceDetails: {
          base: finalBaseXP,
          taxes: taxesTP,
          due: finalBaseXP,
          options: [],
          adjustments: [
            { adjustmentCode: "FUEL", adjustmentName: "Fuel Surcharge", adjustmentCost: fuelSurchargeXP }
          ]
        },
        weightDetails: { cubedWeight: parseFloat((totalWeight * 1.1).toFixed(2)) },
        serviceStandard: {
          amDelivery: false,
          guaranteedDelivery: true,
          expectedTransitTime: 2,
          expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      });
    }

    return res.json(rates);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

}

startServer();

// Export for serverless environments and tests
export const handler = serverless(app);
export default app;
