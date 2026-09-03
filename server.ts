import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import fetch from "node-fetch";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getStore, saveStore } from "./serverStore";

// Sync changes to Firestore's store/global document in the background
async function syncToFirestore(data: Record<string, any>) {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (!fs.existsSync(configPath)) return;
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const fbApp = getApps().length === 0 ? initializeApp(config) : getApp();
    const db = getFirestore(fbApp, config.firestoreDatabaseId || "(default)");
    await setDoc(doc(db, "store", "global"), data, { merge: true });
  } catch (err: any) {
    console.warn("Backend syncToFirestore notice:", err?.message || err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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

  app.post("/api/send-refund-notification", (req, res) => {
    try {
      const data = req.body;
      console.log(`[Refund Event] Refund processing initiated for Order #${data.orderId}`);
      console.log(`Customer: ${data.customerName} (${data.customerEmail}) | Amount: C$${data.amount} | Via Gmail: ${data.dispatchedViaGmail}`);
      
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

      res.json({ success: true, message: "Refund notification recorded" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Interac Screenshot Notification Endpoints
  app.post("/api/notify-admin-screenshot", (req, res) => {
    try {
      const data = req.body;
      console.log(`[Admin Alert] Interac e-Transfer confirmation screenshot received for Order #${data.orderId}`);
      console.log(`Recipient: order@vonnessentials.com | Customer: ${data.customerName} (${data.customerEmail}) | Amount: ${data.total}`);
      console.log(`Bank: ${data.etDetails?.senderBank} | Sender: ${data.etDetails?.senderName} | Email: ${data.etDetails?.senderEmail}`);

      const store = getStore() as any;
      if (!store.adminNotifications) {
        store.adminNotifications = [];
      }
      store.adminNotifications = [
        {
          id: `NOTIF-${Date.now()}`,
          type: "interac_screenshot",
          orderId: data.orderId,
          total: data.total,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          timestamp: new Date().toISOString(),
          details: data.etDetails,
          read: false
        },
        ...store.adminNotifications
      ].slice(0, 50);
      saveStore(store);

      res.json({ success: true, message: "Admin notification recorded" });
    } catch (e: any) {
      console.error("Error handling screenshot notification:", e);
      res.status(500).json({ error: e.message });
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
