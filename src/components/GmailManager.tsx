import React, { useState, useEffect } from "react";
import {
  Mail,
  CheckCircle,
  AlertTriangle,
  Send,
  Download,
  LogOut,
  RefreshCw,
  FileText,
  ShieldCheck,
  Check,
  User as UserIcon,
  ExternalLink
} from "lucide-react";
import {
  connectGmailAccount,
  disconnectGmailAccount,
  subscribeToGmailAuth,
  sendGmailReceiptWithPdf,
  sendDirectGmailMessage,
  isGmailConnected
} from "../lib/gmailService";
import { downloadReceiptPdf, OrderDataForPdf } from "../lib/pdfService";
import { useCart } from "./CartContext";
import { useLanguage } from "./LanguageContext";
import { toast } from "react-hot-toast";

export default function GmailManager() {
  const { orders } = useCart();
  const { language } = useLanguage();

  const [connectedUser, setConnectedUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [targetHint, setTargetHint] = useState<string>("vonnessentials@gmail.com");
  const [isInIframe, setIsInIframe] = useState(false);

  // Dispatch state
  const [sendingOrderId, setSendingOrderId] = useState<string | null>(null);

  // Custom Direct Message State
  const [testRecipient, setTestRecipient] = useState<string>("gregnickyatch@gmail.com");
  const [testSubject, setTestSubject] = useState<string>("Vonn Essentials - Test Message from Authenticated Gmail");
  const [testMessage, setTestMessage] = useState<string>("This is a verification test to confirm your Gmail API integration is fully active and delivering emails directly from your enterprise account.");
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Confirmation Modal state for Workspace API safety
  const [pendingAction, setPendingAction] = useState<{
    type: "send_receipt" | "send_test";
    title: string;
    description: string;
    recipient: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToGmailAuth((user, token) => {
      setConnectedUser(user);
      setAccessToken(token);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleConnect = async (hintToUse?: string) => {
    setIsAuthenticating(true);
    try {
      const emailHint = hintToUse || targetHint;
      const res = await connectGmailAccount(emailHint);
      if (res?.cancelled) {
        toast(
          language === "en"
            ? "Sign-in cancelled (popup was closed)"
            : "Connexion annulée (la fenêtre a été fermée)",
          { icon: "ℹ️" }
        );
        return;
      }
      if (res?.user) {
        toast.success(
          language === "en"
            ? `Connected to Gmail as ${res.user.email}!`
            : `Connecté à Gmail en tant que ${res.user.email} !`
        );
      }
    } catch (err: any) {
      if (err?.code === "auth/popup-blocked") {
        toast.error(
          language === "en"
            ? "Popup blocked by browser. Please enable popups or open in a new tab."
            : "Pop-up bloqué par le navigateur. Veuillez autoriser les pop-ups ou ouvrir dans un nouvel onglet."
        );
      } else {
        toast.error(
          err?.message ||
            (language === "en" ? "Failed to connect to Gmail" : "Échec de connexion à Gmail")
        );
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnectGmailAccount();
    toast.success(
      language === "en" ? "Gmail disconnected" : "Gmail déconnecté"
    );
  };

  const requestSendReceipt = (order: any) => {
    const formattedOrder: OrderDataForPdf = {
      orderId: order.id,
      date: order.date || new Date().toLocaleDateString("en-CA"),
      customerName: order.customerName || "Customer",
      customerEmail: order.customerEmail || "",
      address: order.address || "",
      city: order.city || "",
      province: order.province || "ON",
      postal: order.postal || "",
      country: order.country || "CA",
      items: (order.items || []).map((i: any) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        sku: i.sku
      })),
      subtotal: order.subtotal || 0,
      shipping: order.shipping || 0,
      hst: order.hst || 0,
      total: order.total || 0,
      paymentMethod: order.paymentMethod || "etransfer",
      shippingMethod: order.shippingMethod || "Standard Delivery"
    };

    setPendingAction({
      type: "send_receipt",
      title: language === "en" ? "Confirm Gmail Receipt Dispatch" : "Confirmer l'envoi du reçu par Gmail",
      description: language === "en"
        ? `Are you sure you want to send the official PDF receipt for Order #${order.id} to customer ${order.customerEmail} using your authenticated Google account (${connectedUser?.email})?`
        : `Êtes-vous sûr de vouloir envoyer le reçu PDF officiel pour la commande #${order.id} à ${order.customerEmail} via votre compte Google authentifié (${connectedUser?.email}) ?`,
      recipient: order.customerEmail,
      onConfirm: async () => {
        setSendingOrderId(order.id);
        try {
          await sendGmailReceiptWithPdf(formattedOrder);
          toast.success(
            language === "en"
              ? `Receipt with PDF sent to ${order.customerEmail}!`
              : `Reçu avec PDF envoyé à ${order.customerEmail} !`
          );
        } catch (err: any) {
          console.warn("Gmail receipt dispatch failed:", err);
          toast.error(err?.message || "Failed to dispatch Gmail receipt");
        } finally {
          setSendingOrderId(null);
        }
      }
    });
  };

  const requestSendTestEmail = () => {
    if (!testRecipient.trim()) {
      toast.error(language === "en" ? "Please specify a recipient email" : "Veuillez indiquer une adresse courriel");
      return;
    }

    const html = `
      <div style="font-family: 'Montserrat', -apple-system, sans-serif; max-width: 540px; margin: 0 auto; background: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #EADFC7;">
        <h2 style="color: #162F1C; margin-top: 0;">Vonn Essentials - Gmail Integration Active</h2>
        <p style="color: #4A5568; line-height: 1.6; font-size: 14px;">${testMessage}</p>
        <div style="margin-top: 20px; padding-top: 14px; border-top: 1px solid #E2E8F0; font-size: 12px; color: #8F9CA9;">
          Sent from authenticated Gmail: <strong>${connectedUser?.email}</strong><br/>
          Timestamp: ${new Date().toISOString()}
        </div>
      </div>
    `;

    setPendingAction({
      type: "send_test",
      title: language === "en" ? "Confirm Direct Test Email Dispatch" : "Confirmer l'envoi du courriel de test",
      description: language === "en"
        ? `This will send a real test email to ${testRecipient} from ${connectedUser?.email}. Do you want to proceed?`
        : `Ceci enverra un courriel de test réel à ${testRecipient} depuis ${connectedUser?.email}. Souhaitez-vous continuer ?`,
      recipient: testRecipient,
      onConfirm: async () => {
        setIsSendingTest(true);
        try {
          await sendDirectGmailMessage(testRecipient, testSubject, html);
          toast.success(
            language === "en"
              ? `Test email sent successfully to ${testRecipient}!`
              : `Courriel de test envoyé avec succès à ${testRecipient} !`
          );
        } catch (err: any) {
          console.warn("Direct test email failed:", err);
          toast.error(err?.message || "Failed to send test email");
        } finally {
          setIsSendingTest(false);
        }
      }
    });
  };

  const handleDownloadPdfLocally = async (order: any) => {
    try {
      const formattedOrder: OrderDataForPdf = {
        orderId: order.id,
        date: order.date || new Date().toLocaleDateString("en-CA"),
        customerName: order.customerName || "Customer",
        customerEmail: order.customerEmail || "",
        address: order.address || "",
        city: order.city || "",
        province: order.province || "ON",
        postal: order.postal || "",
        country: order.country || "CA",
        items: (order.items || []).map((i: any) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          sku: i.sku
        })),
        subtotal: order.subtotal || 0,
        shipping: order.shipping || 0,
        hst: order.hst || 0,
        total: order.total || 0,
        paymentMethod: order.paymentMethod || "etransfer",
        shippingMethod: order.shippingMethod || "Standard Delivery"
      };
      await downloadReceiptPdf(formattedOrder);
      toast.success(language === "en" ? "PDF downloaded!" : "PDF téléchargé !");
    } catch (err) {
      console.warn("Local PDF download warning:", err);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* 1. TOP STATUS CARD */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${connectedUser ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-500"}`}>
              <Mail size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900">
                  {language === "en" ? "Google Workspace / Gmail Integration" : "Intégration Google Workspace / Gmail"}
                </h3>
                {connectedUser ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                    <Check size={10} />
                    {language === "en" ? "Connected" : "Connecté"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider">
                    <AlertTriangle size={10} />
                    {language === "en" ? "Not Connected" : "Non Connecté"}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {connectedUser
                  ? `Authenticated as ${connectedUser.email} (Direct Gmail REST API dispatch enabled)`
                  : language === "en"
                    ? "Connect your enterprise Google account to send real vector PDF receipts to customers automatically."
                    : "Connectez votre compte Google d'entreprise pour envoyer automatiquement de vrais reçus PDF vectoriels."}
              </p>
            </div>
          </div>

          {connectedUser && (
            <button
              onClick={handleDisconnect}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors self-start sm:self-center"
            >
              <LogOut size={14} />
              {language === "en" ? "Disconnect Account" : "Déconnecter le Compte"}
            </button>
          )}
        </div>

        {/* AUTHENTICATION ACTION BAR */}
        {!connectedUser ? (
          <div className="pt-6 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                {language === "en" ? "Pre-fill Target:" : "Cible par défaut :"}
              </span>
              <button
                type="button"
                onClick={() => setTargetHint("vonnessentials@gmail.com")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${targetHint === "vonnessentials@gmail.com" ? "bg-brand-accent text-white border-brand-accent font-bold" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}
              >
                vonnessentials@gmail.com (Enterprise)
              </button>
              <button
                type="button"
                onClick={() => setTargetHint("gregnickyatch@gmail.com")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${targetHint === "gregnickyatch@gmail.com" ? "bg-brand-accent text-white border-brand-accent font-bold" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}
              >
                gregnickyatch@gmail.com (Test Account)
              </button>
            </div>

            {/* Official Google Sign-In Button */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleConnect(targetHint)}
                disabled={isAuthenticating}
                className="inline-flex items-center gap-3 px-6 py-3.5 bg-white hover:bg-gray-50 text-gray-800 font-sans font-semibold text-sm rounded-xl border border-gray-300 shadow-sm transition-all hover:shadow hover:border-gray-400 disabled:opacity-50 cursor-pointer"
              >
                {/* Official Google SVG Icon */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
                <span>
                  {isAuthenticating
                    ? language === "en" ? "Connecting to Google..." : "Connexion à Google..."
                    : language === "en" ? `Sign in with Google (${targetHint})` : `Se connecter avec Google (${targetHint})`}
                </span>
              </button>

              {isInIframe && (
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-sans font-medium text-xs rounded-xl border border-gray-200 transition-all shadow-xs"
                  title="Open in new tab to authenticate if your browser restricts iframe popups"
                >
                  <ExternalLink size={14} className="text-gray-500" />
                  <span>{language === "en" ? "Open in New Tab" : "Ouvrir dans un nouvel onglet"}</span>
                </a>
              )}
            </div>

            {isInIframe && (
              <p className="text-[11px] text-gray-500">
                {language === "en"
                  ? "Tip: If your browser restricts popups inside the preview iframe, open the app in a new tab to authenticate."
                  : "Astuce : Si votre navigateur bloque les pop-ups dans l'iframe d'aperçu, ouvrez l'application dans un nouvel onglet."}
              </p>
            )}
          </div>
        ) : (
          <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>
                <strong>{language === "en" ? "Granted Scopes:" : "Autorisations :"}</strong> Gmail Send, Compose, Modify
              </span>
            </div>
            <div className="flex items-center gap-2">
              <UserIcon size={16} className="text-gray-400" />
              <span>
                <strong>{language === "en" ? "Account:" : "Compte :"}</strong> {connectedUser.displayName || "Google Admin"} ({connectedUser.email})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. ORDER RECEIPTS DISPATCH SECTION */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {language === "en" ? "Order Receipts & Vector PDF Dispatch" : "Reçus de Commande et Envoi PDF"}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {language === "en"
                ? "Send official Vonn Essentials receipts with the vector Receipt-VE[ID].pdf attached."
                : "Envoyez les reçus officiels Vonn Essentials avec le PDF vectoriel Receipt-VE[ID].pdf en pièce jointe."}
            </p>
          </div>
          <div className="text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
            {orders.length} {language === "en" ? "Total Orders" : "Commandes"}
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400 text-xs">
            {language === "en" ? "No customer orders placed yet." : "Aucune commande enregistrée pour l'instant."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => {
                  const isSending = sendingOrderId === order.id;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                        #{order.id}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">
                        {order.date}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{order.customerName}</div>
                        <div className="text-gray-400 font-mono text-[11px]">{order.customerEmail}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        C${typeof order.total === "number" ? order.total.toFixed(2) : order.total}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${order.paymentStatus === "pending_etransfer" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                          {order.paymentStatus === "pending_etransfer" ? "Pending e-Transfer" : "Paid"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {/* Download PDF locally */}
                        <button
                          type="button"
                          onClick={() => handleDownloadPdfLocally(order)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 font-medium text-[11px] transition-colors"
                          title="Download Vector PDF"
                        >
                          <Download size={12} />
                          <span>PDF</span>
                        </button>

                        {/* Send Gmail Receipt */}
                        <button
                          type="button"
                          onClick={() => requestSendReceipt(order)}
                          disabled={!connectedUser || isSending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-accent hover:bg-brand-accent/90 text-white font-bold text-[11px] transition-all disabled:opacity-40 disabled:hover:bg-brand-accent shadow-sm"
                        >
                          {isSending ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : (
                            <Send size={12} />
                          )}
                          <span>
                            {isSending
                              ? language === "en" ? "Sending..." : "Envoi..."
                              : language === "en" ? "Send Gmail Receipt & PDF" : "Envoyer Reçu Gmail & PDF"}
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. DIRECT TEST EMAIL COMPOSER */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-bold text-gray-900">
            {language === "en" ? "Direct Customer Message & Test Dispatch" : "Message Client Direct & Test d'Envoi"}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {language === "en"
              ? "Send a custom message directly from your authenticated Gmail address to any customer inbox."
              : "Envoyez un message personnalisé directement depuis votre adresse Gmail authentifiée à n'importe quel client."}
          </p>
        </div>

        <div className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              {language === "en" ? "Recipient Email" : "Courriel du destinataire"}
            </label>
            <input
              type="email"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              placeholder="e.g. gregnickyatch@gmail.com"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              {language === "en" ? "Subject" : "Sujet"}
            </label>
            <input
              type="text"
              value={testSubject}
              onChange={(e) => setTestSubject(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              {language === "en" ? "Message Content" : "Contenu du message"}
            </label>
            <textarea
              rows={3}
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-xs"
            />
          </div>

          <button
            type="button"
            onClick={requestSendTestEmail}
            disabled={!connectedUser || isSendingTest}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-brand-accent text-white font-bold text-xs rounded-xl transition-all shadow-sm disabled:opacity-40"
          >
            {isSendingTest ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            <span>{language === "en" ? "Send Test Message via Gmail" : "Envoyer le Message de Test via Gmail"}</span>
          </button>
        </div>
      </div>

      {/* 4. EXPLICIT CONFIRMATION MODAL (Mandatory Workspace Skill Compliance) */}
      {pendingAction && (
        <div className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3 text-brand-accent">
              <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center">
                <Mail size={20} />
              </div>
              <h4 className="text-base font-bold text-gray-900">{pendingAction.title}</h4>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              {pendingAction.description}
            </p>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-[11px] text-gray-500 space-y-1">
              <div><strong>Sender:</strong> {connectedUser?.email}</div>
              <div><strong>Recipient:</strong> {pendingAction.recipient}</div>
              <div><strong>Service:</strong> Google Workspace Gmail REST API</div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {language === "en" ? "Cancel" : "Annuler"}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const action = pendingAction.onConfirm;
                  setPendingAction(null);
                  await action();
                }}
                className="px-5 py-2 rounded-xl bg-brand-accent text-white text-xs font-bold hover:bg-brand-accent/90 transition-all shadow-md"
              >
                {language === "en" ? "Confirm & Send" : "Confirmer & Envoyer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
