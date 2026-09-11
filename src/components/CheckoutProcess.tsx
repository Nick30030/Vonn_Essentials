import React, { useState, useEffect, useRef } from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { useCart, SHIPPING_RATES_BY_PROVINCE, FREE_SHIPPING_THRESHOLDS } from "./CartContext";
import { useLanguage } from "./LanguageContext";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2, AlertCircle, Send, Info, Lock, ChevronDown, Check, ArrowLeft, Printer, Download, Camera, Upload, Eye, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { CITIES_BY_PROVINCE } from "../data/canadianCities";
import Receipt from "./Receipt";
import { sendReceiptEmail, sendAdminInteracScreenshotNotification } from "../lib/emailService";
import { downloadReceiptPdf, OrderDataForPdf } from "../lib/pdfService";
import { getUserTimezone, formatOrderDateTime } from "../lib/dateUtils";

const CANADIAN_BANKS = [
  "TD Canada Trust",
  "RBC Royal Bank",
  "Scotiabank",
  "CIBC",
  "BMO Bank of Montreal",
  "Simplii Financial",
  "Tangerine Bank",
  "EQ Bank",
  "Desjardins",
  "National Bank of Canada",
  "Other / Credit Union"
];

const ETransferInstructions = ({ 
  total, 
  onSuccess, 
  onBack,
  customerName,
  customerEmail
}: { 
  total: number; 
  onSuccess: (etDetails?: { 
    senderName: string; 
    senderBank: string; 
    senderEmail: string; 
    referenceCode?: string;
    screenshot?: string;
  }) => void; 
  onBack: () => void;
  customerName: string;
  customerEmail: string;
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [senderName, setSenderName] = useState(customerName || "");
  const [senderEmail, setSenderEmail] = useState(customerEmail || "");
  const [senderBank, setSenderBank] = useState(CANADIAN_BANKS[0]);
  const [referenceCode, setReferenceCode] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string>("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [showEnlargedPreview, setShowEnlargedPreview] = useState(false);
  const { language, t } = useLanguage();
  const paymentEmail = "order@vonnessentials.com";
  
  // Create a clean temporary memo ID
  const [memoId] = useState(() => "VONN-" + Math.floor(100000 + Math.random() * 900000));

  const handleCopy = (text: string, labelEn: string, labelFr: string) => {
    navigator.clipboard.writeText(text);
    toast.success(language === "en" ? `${labelEn} copied!` : `${labelFr} copié !`);
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(language === "en" ? "Please select an image file (PNG, JPG, WebP)" : "Veuillez sélectionner une image (PNG, JPG, WebP)");
      return;
    }

    setIsProcessingImage(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        const maxDim = 950;
        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
          setScreenshot(dataUrl);
          setScreenshotName(file.name);
          toast.success(language === "en" ? "Interac screenshot attached!" : "Capture d'écran Interac attachée !");
        }
        setIsProcessingImage(false);
      };
      img.onerror = () => {
        setIsProcessingImage(false);
        toast.error("Failed to read image");
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim()) {
      toast.error(language === "en" ? "Please enter the sender's full name" : "Veuillez entrer le nom complet de l'expéditeur");
      return;
    }
    if (!senderEmail.trim()) {
      toast.error(language === "en" ? "Please enter the sender's email" : "Veuillez entrer l'adresse courriel de l'expéditeur");
      return;
    }
    if (!screenshot) {
      toast.error(
        language === "en" 
          ? "Please upload a screenshot of the confirmation message Interac sent you" 
          : "Veuillez téléverser la capture d'écran du message envoyé par Interac"
      );
      return;
    }
    
    setIsConfirming(true);
    setTimeout(() => {
      onSuccess({
        senderName: senderName.trim(),
        senderBank: senderBank,
        senderEmail: senderEmail.trim(),
        referenceCode: referenceCode.trim() || undefined,
        screenshot: screenshot
      });
    }, 1200);
  };

  return (
    <div className="space-y-6 pt-2 animate-fadeIn font-serif">
      <div className="p-6 bg-[#f7fafc] rounded-2xl border border-gray-100 space-y-4">
        <div className="flex items-center gap-3 text-brand-accent">
          <Info size={18} />
          <p className="font-sans font-bold text-xs uppercase tracking-wider">
            {language === "en" ? "Interac e-Transfer Instructions" : "Instructions de Virement Interac"}
          </p>
        </div>
        
        <p className="text-xs text-gray-500 leading-relaxed">
          {language === "en" 
            ? "To complete your purchase, please send an Interac e-Transfer from your Canadian banking application using the exact details below. We support Auto-deposit so no security question is required."
            : "Pour finaliser votre achat, veuillez envoyer un virement Interac depuis votre application bancaire canadienne en utilisant les détails ci-dessous. Nous supportons le dépôt automatique."}
        </p>

        <div className="space-y-3.5 text-left font-sans">
          {/* Email Recipient */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">{language === "en" ? "Send to (Email)" : "Envoyer à (Courriel)"}</p>
              <p className="font-mono text-[#111] text-xs font-bold break-all select-all">{paymentEmail}</p>
            </div>
            <button 
              type="button"
              onClick={() => handleCopy(paymentEmail, "Email address", "Adresse courriel")}
              className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-gray-500 hover:text-[#111] hover:bg-gray-50 border border-gray-100 transition-all uppercase tracking-wider"
            >
              {language === "en" ? "Copy" : "Copier"}
            </button>
          </div>

          {/* Amount */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">{language === "en" ? "Exact Amount" : "Montant Exact"}</p>
              <p className="text-lg font-extrabold text-[#111] tabular-nums">C${total.toFixed(2)}</p>
            </div>
            <button 
              type="button"
              onClick={() => handleCopy(total.toFixed(2), "Amount", "Montant")}
              className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-gray-500 hover:text-[#111] hover:bg-gray-50 border border-gray-100 transition-all uppercase tracking-wider"
            >
              {language === "en" ? "Copy" : "Copier"}
            </button>
          </div>

          {/* Message / Memo */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">{language === "en" ? "Message / Memo (Recommended)" : "Message / Mémo (Recommandé)"}</p>
              <p className="font-mono text-brand-accent text-xs font-bold uppercase select-all">{memoId}</p>
              <span className="text-[9px] text-gray-400 block mt-0.5 font-serif leading-none">
                {language === "en" ? "Insert this in your bank memo to auto-link your order." : "Insérez ceci dans le mémo bancaire pour lier votre commande."}
              </span>
            </div>
            <button 
              type="button"
              onClick={() => handleCopy(memoId, "Memo ID", "Mémo")}
              className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-brand-accent hover:bg-brand-accent/5 border border-brand-accent/20 transition-all uppercase tracking-wider"
            >
              {language === "en" ? "Copy" : "Copier"}
            </button>
          </div>
        </div>
      </div>

      {/* E-Transfer Proof Fields */}
      <form onSubmit={handleConfirm} className="space-y-4 text-left font-sans border-t border-gray-100 pt-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 font-sans mb-1 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-brand-accent rounded-full"></span>
          {language === "en" ? "Confirm Your Payment & Upload Screenshot" : "Confirmez Votre Paiement & Joignez la Capture"}
        </h3>
        <p className="text-xs text-gray-400 font-serif leading-relaxed mb-4">
          {language === "en" 
            ? "Provide your bank transfer details and a screenshot of the message/receipt Interac sent you to verify your payment."
            : "Fournissez les détails de votre virement et la capture d'écran du message reçu d'Interac pour vérifier votre paiement."}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5">{language === "en" ? "Sender's Bank" : "Banque de l'Expéditeur"}</label>
            <select
              value={senderBank}
              onChange={(e) => setSenderBank(e.target.value)}
              className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-sans focus:outline-none focus:ring-1 focus:ring-[#111]"
            >
              {CANADIAN_BANKS.map((bank) => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5">{language === "en" ? "Sender's Full Name (on Bank Account)" : "Nom Complet (sur Compte Bancaire)"}</label>
            <input
              type="text"
              required
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-sans focus:outline-none focus:ring-1 focus:ring-[#111]"
            />
          </div>

          <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5">{language === "en" ? "Sender's Email Address" : "Courriel de l'Expéditeur"}</label>
            <input
              type="email"
              required
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="e.g. johndoe@gmail.com"
              className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-sans focus:outline-none focus:ring-1 focus:ring-[#111]"
            />
          </div>

          <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5">
              {language === "en" ? "Reference Code (Optional)" : "Code de Référence (Optionnel)"}
            </label>
            <input
              type="text"
              value={referenceCode}
              onChange={(e) => setReferenceCode(e.target.value)}
              placeholder="e.g. CA1A2B3C"
              className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-sans focus:outline-none focus:ring-1 focus:ring-[#111]"
            />
          </div>
        </div>

        {/* SCREENSHOT UPLOAD SECTION */}
        <div className="pt-3 border-t border-gray-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-gray-700 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Camera size={13} className="text-brand-accent" />
              {language === "en" ? "Screenshot of Interac Confirmation Message" : "Capture d'Écran du Message Envoyé par Interac"}
              <span className="text-red-500 font-bold">*</span>
            </label>
            {screenshot && (
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <Check size={12} /> {language === "en" ? "Screenshot Uploaded" : "Capture Téléversée"}
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 font-serif leading-relaxed">
            {language === "en"
              ? "Please attach a screenshot of the confirmation email, SMS, or screen that Interac sent you after sending the transfer to order@vonnessentials.com."
              : "Veuillez joindre une capture d'écran du courriel, SMS ou écran de confirmation qu'Interac vous a envoyé après le virement à order@vonnessentials.com."}
          </p>

          {!screenshot ? (
            <label className={`block border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${isProcessingImage ? "opacity-50 pointer-events-none" : "border-brand-accent/30 hover:border-brand-accent hover:bg-brand-accent/5 bg-gray-50/50"}`}>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isProcessingImage}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageFile(file);
                }}
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                  {isProcessingImage ? (
                    <div className="w-4 h-4 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload size={18} />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800 font-sans">
                    {language === "en" ? "Click to upload or drag & drop screenshot" : "Cliquez pour téléverser ou glissez la capture d'écran"}
                  </p>
                  <p className="text-[10px] text-gray-400 font-sans mt-0.5">
                    {language === "en" ? "PNG, JPG, JPEG, WebP from your bank or phone" : "PNG, JPG, JPEG, WebP depuis votre banque ou mobile"}
                  </p>
                </div>
              </div>
            </label>
          ) : (
            <div className="bg-white border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <div 
                  className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200 cursor-pointer hover:opacity-90 relative group"
                  onClick={() => setShowEnlargedPreview(true)}
                  title={language === "en" ? "Click to view full screenshot" : "Cliquer pour agrandir"}
                >
                  <img src={screenshot} alt="Interac screenshot" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                    <Eye size={14} />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-800 truncate font-sans">{screenshotName || "Interac_Confirmation.jpg"}</p>
                  <button
                    type="button"
                    onClick={() => setShowEnlargedPreview(true)}
                    className="text-[10px] text-brand-accent hover:underline font-bold font-sans flex items-center gap-1 mt-0.5"
                  >
                    <Eye size={11} /> {language === "en" ? "View full screenshot" : "Voir la capture complète"}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <label className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 cursor-pointer transition-colors uppercase tracking-wider">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageFile(file);
                    }}
                  />
                  {language === "en" ? "Change" : "Changer"}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setScreenshot(null);
                    setScreenshotName("");
                  }}
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  title={language === "en" ? "Remove screenshot" : "Supprimer"}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal preview of screenshot if clicked */}
        {showEnlargedPreview && screenshot && (
          <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera size={16} className="text-brand-accent" />
                  <h4 className="text-xs font-bold font-sans uppercase tracking-wider text-gray-900">
                    {language === "en" ? "Interac Confirmation Screenshot" : "Capture d'Écran de Confirmation Interac"}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEnlargedPreview(false)}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 overflow-auto flex items-center justify-center bg-gray-50 flex-1 min-h-[300px]">
                <img
                  src={screenshot}
                  alt="Full Interac Confirmation"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg border border-gray-200 shadow-sm"
                />
              </div>
              <div className="p-3 border-t border-gray-100 text-center bg-white">
                <button
                  type="button"
                  onClick={() => setShowEnlargedPreview(false)}
                  className="px-5 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl font-sans uppercase tracking-wider"
                >
                  {language === "en" ? "Close Preview" : "Fermer"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-4 border border-gray-200 text-gray-700 font-sans font-bold rounded-xl hover:bg-gray-50 transition-colors text-xs uppercase tracking-wider"
          >
            {t("checkout_back")}
          </button>  
          <button
            type="submit"
            disabled={isConfirming || !screenshot}
            className="flex-1 py-4 bg-[#111] text-white font-sans font-bold rounded-xl hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
          >
            {isConfirming ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check size={14} />
                {language === "en" ? "Submit Screenshot & Confirm" : "Envoyer la Capture & Confirmer"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default function CheckoutProcess({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { items, total, subtotal, shipping, hst, clearCart, province, setProvince, city, setCity, country, setCountry, shippingOption, setShippingOption, shippingRates, setShippingRates, selectedRate, setSelectedRate, addOrder } = useCart();
  const { language, t, getProducts } = useLanguage();
  const [step, setStep] = useState<"address" | "shipping" | "payment" | "success">("address");
  const [paymentMethod, setPaymentMethod] = useState<string>("paypal");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [orderComments, setOrderComments] = useState("");
  const [orderInfo, setOrderInfo] = useState<{ id: string, date: string, timezone?: string, createdAt?: string } | null>(null);
  const [completedOrderItems, setCompletedOrderItems] = useState<any[]>([]);
  const [completedOrderSummary, setCompletedOrderSummary] = useState<{
    subtotal: number;
    shipping: number;
    hst: number;
    total: number;
    discount: number;
    shippingDiscount: number;
    discountCode?: string;
    shippingMethod: string;
  } | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step]);

  // Promo Code States
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<any | null>(null);
  const [promoError, setPromoError] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    city: "",
    country: "CA",
    province: "ON",
    postal: ""
  });

  const handleApplyPromo = (e: React.MouseEvent) => {
    e.preventDefault();
    setPromoError("");
    const cleanInput = promoCodeInput.trim().toUpperCase();
    if (!cleanInput) return;

    const saved = localStorage.getItem("vonn_gift_codes");
    let codesList: any[] = [
      { code: "WELCOME25", discountType: "product_percentage", discountValue: 25, description: "25% discount on products" },
      { code: "SAVE50", discountType: "product_percentage", discountValue: 50, description: "50% discount on products" },
      { code: "FREESHIP", discountType: "shipping_free", discountValue: 100, description: "100% free shipping" },
      { code: "HALFSHIP", discountType: "shipping_percentage", discountValue: 50, description: "50% off shipping" }
    ];
    if (saved) {
      try {
        codesList = JSON.parse(saved);
      } catch (err) {
        // Fallback
      }
    }

    const matched = codesList.find((gc) => gc.code === cleanInput);
    if (matched) {
      setAppliedPromo(matched);
      toast.success(
        language === "en"
          ? `Promo code "${matched.code}" applied successfully!`
          : `Code promo "${matched.code}" appliqué avec succès !`
      );
    } else {
      setPromoError(
        language === "en"
          ? "Invalid promo/gift code"
          : "Code promo ou cadeau invalide"
      );
      toast.error(
        language === "en"
          ? "Invalid promo/gift code"
          : "Code promo ou cadeau invalide"
      );
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput("");
    setPromoError("");
    toast.success(
      language === "en" ? "Promo code removed" : "Code promo supprimé"
    );
  };

  // Promo calculations
  let promoDiscount = 0;
  let promoShippingDiscount = 0;

  if (appliedPromo) {
    if (appliedPromo.discountType === "product_percentage") {
      promoDiscount = subtotal * (appliedPromo.discountValue / 100);
    } else if (appliedPromo.discountType === "product_fixed") {
      promoDiscount = Math.min(subtotal, appliedPromo.discountValue);
    } else if (appliedPromo.discountType === "shipping_percentage") {
      promoShippingDiscount = shipping * (appliedPromo.discountValue / 100);
    } else if (appliedPromo.discountType === "shipping_free") {
      promoShippingDiscount = shipping;
    }
  }

  const finalSubtotal = subtotal - promoDiscount;
  const finalShipping = Math.max(0, shipping - promoShippingDiscount);

  const taxRates: Record<string, number> = {
    "AB": 0.05, "BC": 0.12, "MB": 0.12, "NB": 0.15, "NL": 0.15,
    "NT": 0.05, "NS": 0.15, "NU": 0.05, "ON": 0.13, "PE": 0.15,
    "QC": 0.14975, "SK": 0.11, "YT": 0.05,
  };
  const taxRate = (country === "US" || !formData.city || formData.city.trim() === "") ? 0 : (taxRates[province] || 0.13);
  const finalHst = (finalSubtotal + finalShipping) * taxRate;
  const finalTotal = finalSubtotal + finalShipping + finalHst;

  useEffect(() => {
    if (isOpen) {
      sessionStorage.setItem("active_order_amount", finalTotal.toFixed(2));
      // Only reset step to address if not already completed/success
      setStep(prev => prev === "success" ? "success" : "address");
    }
  }, [isOpen]);

  const handleSuccess = (etDetails?: { 
    senderName: string; 
    senderBank: string; 
    senderEmail: string; 
    referenceCode?: string; 
    screenshot?: string;
  }) => {
    const newOrderId = "VE" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const now = new Date();
    const userTz = getUserTimezone();
    const formattedObj = formatOrderDateTime(now, userTz, language);
    const dateStr = formattedObj.fullString;
    
    const orderItems = items.map(item => {
      const prod = getProducts().find(p => p.id === item.id) || item;
      return {
        id: prod.id,
        name: prod.name,
        price: prod.discountPrice || prod.price,
        quantity: item.quantity,
        image: prod.image
      };
    });

    const threshold = FREE_SHIPPING_THRESHOLDS[province];
    const isFreeThreshold = country === "CA" && threshold !== null && finalSubtotal >= threshold;
    const isFreePromo = appliedPromo?.discountType === "shipping_free" || promoShippingDiscount >= shipping;
    const isFree = isFreeThreshold || isFreePromo;
    const currentShippingMethod = country === "CA"
      ? (isFree ? (language === "en" ? "Free Standard Shipping" : "Livraison Standard Gratuite") : (language === "en" ? "Standard Shipping" : "Livraison Standard"))
      : (selectedRate 
          ? `${selectedRate.serviceName} (${selectedRate.serviceCode})`
          : t("checkout_shipping_standard"));

    // Save snapshot of ordered items & summary before cart is cleared
    setCompletedOrderItems(orderItems);
    setCompletedOrderSummary({
      subtotal: finalSubtotal,
      shipping: finalShipping,
      hst: finalHst,
      total: finalTotal,
      discount: promoDiscount,
      shippingDiscount: promoShippingDiscount,
      discountCode: appliedPromo?.code,
      shippingMethod: currentShippingMethod
    });

    const newOrder: any = {
      id: newOrderId,
      date: dateStr,
      createdAt: now.toISOString(),
      timestamp: now.getTime(),
      timezone: userTz,
      timezoneOffset: formattedObj.timezoneAbbr,
      customerName: `${formData.firstName} ${formData.lastName}`,
      customerEmail: formData.email,
      address: formData.address,
      city: formData.city,
      province: province,
      postal: formData.postal,
      country: country,
      items: orderItems,
      subtotal: finalSubtotal,
      shipping: finalShipping,
      hst: finalHst,
      total: finalTotal,
      paymentMethod: paymentMethod,
      paymentStatus: paymentMethod === "etransfer" ? "pending_etransfer" : "completed",
      shippingMethod: currentShippingMethod,
      orderComments: orderComments || "",
      ...(appliedPromo?.code ? { discountCode: appliedPromo.code } : {}),
      ...(promoDiscount ? { discountAmount: promoDiscount } : {}),
      ...(promoShippingDiscount ? { shippingDiscountAmount: promoShippingDiscount } : {}),
      ...(etDetails ? {
        etransferDetails: {
          senderName: etDetails.senderName || `${formData.firstName} ${formData.lastName}`,
          senderBank: etDetails.senderBank || "",
          senderEmail: etDetails.senderEmail || formData.email,
          referenceCode: etDetails.referenceCode || "",
          screenshot: etDetails.screenshot || "",
          submittedAt: now.toISOString()
        }
      } : {})
    };

    // Save in Cart Context LocalStorage synchronizer
    addOrder(newOrder);

    // Immediately clear cart so cart is emptied upon payment confirmation
    clearCart();

    // Send Receipt Email
    if (paymentMethod !== "etransfer") {
      // Instant payments (PayPal / Card) send receipt immediately
      sendReceiptEmail({
        orderId: newOrderId,
        date: dateStr,
        createdAt: now.toISOString(),
        timezone: userTz,
        customerName: `${formData.firstName} ${formData.lastName}`,
        customerEmail: formData.email,
        address: formData.address,
        city: formData.city,
        province: province,
        postal: formData.postal,
        country: country === "CA" ? "Canada" : "United States",
        items: orderItems,
        subtotal: `C$${finalSubtotal.toFixed(2)}`,
        shipping: `C$${finalShipping.toFixed(2)}`,
        hst: `C$${finalHst.toFixed(2)}`,
        total: `C$${finalTotal.toFixed(2)}`,
        paymentMethod: "PayPal / Card",
        shippingMethod: currentShippingMethod
      }).catch(err => console.warn("Email sending notice:", err?.message || err));
    } else {
      // For Interac e-Transfer:
      // DO NOT send customer receipt yet.
      // Send notification email to admin showing the screenshot!
      sendAdminInteracScreenshotNotification({
        orderId: newOrderId,
        total: `C$${finalTotal.toFixed(2)}`,
        customerName: `${formData.firstName} ${formData.lastName}`,
        customerEmail: formData.email,
        date: dateStr,
        deliveryAddress: `${formData.address}, ${formData.city}, ${province} ${formData.postal}, ${country === "CA" ? "Canada" : "United States"}`,
        items: orderItems.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
        etDetails: {
          senderName: etDetails?.senderName || `${formData.firstName} ${formData.lastName}`,
          senderBank: etDetails?.senderBank || "Canadian Bank",
          senderEmail: etDetails?.senderEmail || formData.email,
          referenceCode: etDetails?.referenceCode,
          screenshot: etDetails?.screenshot
        }
      }).catch(err => console.warn("Admin notification notice:", err));
    }

    setOrderInfo({ id: newOrderId, date: dateStr, timezone: userTz, createdAt: now.toISOString() });
    setStep("success");
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    toast.success(
      paymentMethod === "etransfer"
        ? (language === "en" ? "Interac screenshot submitted!" : "Capture d'écran Interac transmise !")
        : (language === "en" ? "Payment Successful! Order Confirmed." : "Paiement Réussi ! Commande Confirmée.")
    );
  };

  const handleFinish = () => {
    clearCart();
    onClose();
    setStep("address");
    setOrderInfo(null);
    setCompletedOrderItems([]);
    setCompletedOrderSummary(null);
    setShippingRates([]);
    setSelectedRate(null);
    sessionStorage.removeItem("active_order_amount");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      toast.error(t("checkout_agree_terms") === "I agree with Terms & Conditions, Privacy Policy" ? "Please agree to terms" : "Veuillez accepter les conditions");
      return;
    }
    
    if (country === "CA") {
      setShippingRates([]);
      setSelectedRate(null);
      setShippingOption("standard");
      setStep("shipping");
      return;
    }

    setLoadingRates(true);
    setStep("shipping"); // Switch step immediately to show the loading skeleton/indicator
    
    try {
      const response = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          postalCode: formData.postal,
          country: country,
          province: province,
          city: city,
          items: items
        })
      });

      if (!response.ok) {
        throw new Error("Failed to load shipping rates");
      }

      const rates = await response.json();
      setShippingRates(rates);
      
      if (rates && rates.length > 0) {
        setSelectedRate(rates[0]);
        setShippingOption(rates[0].serviceCode);
      } else {
        setSelectedRate(null);
      }
    } catch (err) {
      console.error("Canada Post Rates Retrieval Error:", err);
      toast.error(language === "en" ? "Failed to retrieve Canada Post rates. Using standard shipping." : "Échec de récupération des tarifs de Postes Canada. Utilisation de la livraison standard.");
      setShippingRates([]);
      setSelectedRate(null);
    } finally {
      setLoadingRates(false);
    }
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("payment");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto bg-gray-50/50 backdrop-blur-sm sm:p-4 md:p-8 flex items-start justify-center">
      <div className="relative w-full max-w-6xl bg-white shadow-2xl rounded-none sm:rounded-[2rem] overflow-hidden flex flex-col lg:flex-row min-h-[90vh] my-auto">
        <button 
          onClick={step === "success" ? handleFinish : onClose}
          className="absolute top-6 right-6 p-2 bg-white/80 backdrop-blur border border-gray-100 hover:bg-gray-100 rounded-full transition-colors z-20"
          title={step === "success" ? (language === "en" ? "Return to Home Store" : "Retour à la boutique") : (language === "en" ? "Close" : "Fermer")}
        >
          <X size={20} />
        </button>

        {/* LEFT COLUMN: Cart Summary */}
        <div className={`${step === "success" ? "hidden" : "lg:block"} w-full lg:w-[45%] bg-[#faf9f8] p-6 sm:p-10 lg:p-14 border-b lg:border-b-0 lg:border-r border-gray-100/50 font-serif overflow-y-auto`}>
          <div className="mb-6 lg:mb-10 flex justify-between items-center lg:block">
            <div>
              <h1 className="text-2xl md:text-3xl font-sans font-bold text-gray-900 tracking-tight">{t("checkout_page_title")}</h1>
              <p className="text-xs md:text-sm text-gray-500 mt-1 md:mt-2 hover:text-brand-accent cursor-pointer transition-colors" onClick={onClose}>
                {t("checkout_back_home")}
              </p>
            </div>
            
            {/* Mobile Summary Total Toggle-ish view */}
            <div className="lg:hidden text-right">
              <span className="text-lg font-sans font-bold text-gray-900 tabular-nums">C${finalTotal.toFixed(2)}</span>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-sans font-bold">{items.length} items</p>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="space-y-6 mb-8 border-b border-gray-200 pb-8">
              {items.map(item => {
                const translatedProd = getProducts().find(p => p.id === item.id) || item;
                return (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-white border border-gray-200 rounded-lg overflow-hidden flex-shrink-0 relative">
                      <img src={translatedProd.image} alt={translatedProd.name} className="w-full h-full object-contain p-1" />
                      <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full z-10">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 flex justify-between items-center text-sm font-serif">
                      <div className="pr-4">
                        <p className="text-gray-800 leading-tight">{translatedProd.name}</p>
                      </div>
                      <span className="text-gray-900 tabular-nums">C${(parseFloat((translatedProd.discountPrice || translatedProd.price).replace('C$', '').replace(',', '.')) * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3 text-sm text-gray-600 mb-6 border-b border-gray-200 pb-6">
              <div className="flex justify-between items-center">
                <span>{t("cart_subtotal")}</span>
                <span className="text-gray-900 tabular-nums">C${subtotal.toFixed(2)}</span>
              </div>
              {promoDiscount > 0 && (
                <div className="flex justify-between items-center text-[#A96827]">
                  <span className="flex items-center gap-1 font-medium">
                    {language === "en" ? "Discount" : "Rabais"} ({appliedPromo?.code})
                  </span>
                  <span className="font-bold tabular-nums">-C${promoDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span>
                  {country === "CA" ? (
                    finalSubtotal >= 35 ? t("checkout_shipping_free") :
                    (city.toLowerCase().trim() === "toronto" && province === "ON") ? t("checkout_shipping_local") :
                    t("checkout_shipping_standard")
                  ) : t("cart_shipping_or_delivery")}
                </span>
                <span className="text-gray-900 tabular-nums">{finalShipping === 0 ? (language === "en" ? "Free" : "Gratuit") : `C$${finalShipping.toFixed(2)}`}</span>
              </div>
              {promoShippingDiscount > 0 && (
                <div className="flex justify-between items-center text-[#A96827]">
                  <span className="flex items-center gap-1 font-medium">
                    {language === "en" ? "Shipping Discount" : "Rabais livraison"} ({appliedPromo?.code})
                  </span>
                  <span className="font-bold tabular-nums">-C${promoShippingDiscount.toFixed(2)}</span>
                </div>
              )}
              {city && city.trim() !== "" && (
                <div className="flex justify-between items-center">
                  <span>{t("cart_hst")}</span>
                  <span className="text-gray-900 tabular-nums">C${finalHst.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Promo Code Input Block */}
            <div className="mb-6 border-b border-gray-200 pb-6">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-sans font-bold mb-2">
                {language === "en" ? "Gift Code / Promo Code" : "Code Cadeau / Code Promo"}
              </p>
              {!appliedPromo ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCodeInput}
                    onChange={(e) => {
                      setPromoCodeInput(e.target.value);
                      setPromoError("");
                    }}
                    placeholder={language === "en" ? "e.g. WELCOME25" : "ex: WELCOME25"}
                    className="flex-1 p-2.5 border border-gray-300 rounded-xl text-xs uppercase font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="px-4 py-2.5 bg-[#162F1C] text-white rounded-xl text-xs font-sans font-bold hover:bg-[#162F1C]/90 transition-all uppercase tracking-wider"
                  >
                    {language === "en" ? "Apply" : "Appliquer"}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-[#162F1C]/5 border border-[#162F1C]/10 p-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#A96827] rounded-full animate-ping" />
                    <span className="font-sans font-bold text-xs text-[#162F1C]">{appliedPromo.code}</span>
                    <span className="text-[10px] text-gray-500 font-serif">
                      ({appliedPromo.discountType.includes("percentage") ? `${appliedPromo.discountValue}% Off` : "Free Shipping"})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    className="text-xs font-sans font-bold text-[#A96827] hover:underline"
                  >
                    {language === "en" ? "Remove" : "Retirer"}
                  </button>
                </div>
              )}
              {promoError && (
                <p className="text-xs text-red-500 font-serif mt-1">{promoError}</p>
              )}
            </div>

            <div className="flex justify-between items-center mb-8">
              <span className="font-sans font-bold text-gray-900 uppercase tracking-widest text-sm">TOTAL</span>
              <span className="text-2xl font-sans font-bold text-gray-900 tabular-nums">C${finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <details className="lg:hidden group">
            <summary className="list-none cursor-pointer flex items-center justify-between py-2 text-brand-accent font-sans font-bold uppercase tracking-widest text-[10px]">
              <span className="flex items-center gap-2">
                Show order summary / Voir le résumé
                <ChevronDown size={12} className="group-open:rotate-180 transition-transform" />
              </span>
            </summary>
            <div className="pt-4 space-y-4 animate-fadeIn">
               {items.map(item => {
                const translatedProd = getProducts().find(p => p.id === item.id) || item;
                return (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg overflow-hidden flex-shrink-0 relative">
                      <img src={translatedProd.image} alt={translatedProd.name} className="w-full h-full object-contain p-1" />
                      <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full z-10">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 flex justify-between items-center text-xs font-serif">
                      <p className="text-gray-800">{translatedProd.name}</p>
                      <span className="text-gray-900">C${(parseFloat((translatedProd.discountPrice || translatedProd.price).replace('C$', '').replace(',', '.')) * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
              <div className="pt-4 border-t border-gray-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>{t("cart_subtotal")}</span>
                  <span>C${subtotal.toFixed(2)}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-[#A96827] font-bold">
                    <span>{language === "en" ? "Discount" : "Rabais"} ({appliedPromo?.code})</span>
                    <span>-C${promoDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>
                    {country === "CA" ? (
                      finalSubtotal >= 35 ? t("checkout_shipping_free") :
                      (city.toLowerCase().trim() === "toronto" && province === "ON") ? t("checkout_shipping_local") :
                      t("checkout_shipping_standard")
                    ) : t("cart_shipping_or_delivery")}
                  </span>
                  <span>{finalShipping === 0 ? (language === "en" ? "Free" : "Gratuit") : `C$${finalShipping.toFixed(2)}`}</span>
                </div>
                {promoShippingDiscount > 0 && (
                  <div className="flex justify-between text-[#A96827] font-bold">
                    <span>{language === "en" ? "Shipping Discount" : "Rabais livraison"} ({appliedPromo?.code})</span>
                    <span>-C${promoShippingDiscount.toFixed(2)}</span>
                  </div>
                )}
                {city && city.trim() !== "" && (
                  <div className="flex justify-between">
                    <span>{t("cart_hst")}</span>
                    <span>C${finalHst.toFixed(2)}</span>
                  </div>
                )}

                {/* Promo Input on Mobile */}
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest font-sans font-bold mb-1.5">
                    {language === "en" ? "Gift Code / Promo Code" : "Code Cadeau / Code Promo"}
                  </p>
                  {!appliedPromo ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCodeInput}
                        onChange={(e) => {
                          setPromoCodeInput(e.target.value);
                          setPromoError("");
                        }}
                        placeholder={language === "en" ? "e.g. WELCOME25" : "ex: WELCOME25"}
                        className="flex-1 p-2 border border-gray-300 rounded-xl text-xs uppercase font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="px-3 py-2 bg-[#162F1C] text-white rounded-xl text-xs font-sans font-bold hover:bg-[#162F1C]/90 transition-all uppercase tracking-wider"
                      >
                        {language === "en" ? "Apply" : "Appliquer"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-[#162F1C]/5 border border-[#162F1C]/10 p-2.5 rounded-xl">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#A96827] rounded-full animate-ping" />
                        <span className="font-sans font-bold text-xs text-[#162F1C]">{appliedPromo.code}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="text-xs font-sans font-bold text-[#A96827] hover:underline"
                      >
                        {language === "en" ? "Remove" : "Retirer"}
                      </button>
                    </div>
                  )}
                  {promoError && (
                    <p className="text-[11px] text-red-500 font-serif mt-1">{promoError}</p>
                  )}
                </div>
              </div>
            </div>
          </details>
        </div>

        {/* RIGHT COLUMN: Checkout Steps */}
        <div ref={scrollContainerRef} className={`w-full ${step === "success" ? "lg:w-full" : "lg:w-[55%]"} bg-white p-8 sm:p-12 lg:p-16 relative overflow-y-auto`}>
          {step === "success" && orderInfo ? (
            (() => {
              const displaySubtotal = completedOrderSummary?.subtotal ?? finalSubtotal;
              const displayShipping = completedOrderSummary?.shipping ?? finalShipping;
              const displayHst = completedOrderSummary?.hst ?? finalHst;
              const displayTotal = completedOrderSummary?.total ?? finalTotal;
              const displayDiscount = completedOrderSummary?.discount ?? promoDiscount;
              const displayDiscountCode = completedOrderSummary?.discountCode ?? appliedPromo?.code;
              const displayShippingDiscount = completedOrderSummary?.shippingDiscount ?? promoShippingDiscount;
              const displayShippingMethod = completedOrderSummary?.shippingMethod ?? (
                country === "CA"
                  ? ((FREE_SHIPPING_THRESHOLDS[province] !== null && displaySubtotal >= (FREE_SHIPPING_THRESHOLDS[province] || 0))
                    ? (language === "en" ? "Free Standard Shipping" : "Livraison Standard Gratuite")
                    : (language === "en" ? "Standard Shipping" : "Livraison Standard"))
                  : (selectedRate 
                      ? `${selectedRate.serviceName} (${selectedRate.serviceCode})`
                      : t("checkout_shipping_standard"))
              );

              return (
                <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn pb-20">
                  <div className="flex flex-col items-center text-center space-y-4 no-print">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 12 }}
                      className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg ${
                        paymentMethod === "etransfer"
                          ? "bg-amber-50 text-amber-600 border border-amber-200"
                          : "bg-emerald-50 text-emerald-600 border-2 border-emerald-200"
                      }`}
                    >
                      <CheckCircle2 size={40} />
                    </motion.div>
                    
                    <div className="space-y-3 max-w-xl mx-auto">
                      <div className="inline-flex items-center gap-2">
                        {paymentMethod === "etransfer" ? (
                          <span className="inline-flex items-center gap-2 px-3.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-sans font-bold">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            {language === "en" ? "Deposit Verification In Progress (order@vonnessentials.com)" : "Vérification en cours (order@vonnessentials.com)"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-4 py-1 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-full text-xs uppercase tracking-wider font-extrabold shadow-xs">
                            <Check size={14} className="text-emerald-700 stroke-[3]" />
                            {language === "en" ? "✓ Paid with PayPal • Instant Confirmation" : "✓ Payé avec PayPal • Confirmation Instantanée"}
                          </span>
                        )}
                      </div>

                      <h2 className="text-3xl sm:text-4xl font-sans font-bold text-gray-900 tracking-tight">
                        {paymentMethod === "etransfer"
                          ? (language === "en" ? "Interac Screenshot Received!" : "Capture d'Écran Interac Reçue !")
                          : (language === "en" ? "Payment Successful & Order Confirmed!" : "Paiement Réussi & Commande Confirmée !")}
                      </h2>

                      <p className="text-gray-600 font-serif leading-relaxed text-sm sm:text-base">
                        {paymentMethod === "etransfer"
                          ? (language === "en"
                              ? `Thank you, ${formData.firstName}! We have received your payment screenshot for order@vonnessentials.com. Our team is verifying your deposit. Once confirmed, your official PDF receipt will be sent directly to ${formData.email}.`
                              : `Merci, ${formData.firstName} ! Nous avons bien reçu votre capture d'écran pour order@vonnessentials.com. Notre équipe vérifie votre virement. Dès confirmation, votre reçu officiel PDF vous sera envoyé à ${formData.email}.`)
                          : (language === "en"
                              ? `Thank you, ${formData.firstName}! Your PayPal payment of C$${displayTotal.toFixed(2)} has been successfully processed and verified. We have sent your official confirmation receipt to ${formData.email}.`
                              : `Merci, ${formData.firstName} ! Votre paiement PayPal de C$${displayTotal.toFixed(2)} a été traité et validé avec succès. Nous avons envoyé votre reçu de confirmation officiel à ${formData.email}.`)}
                      </p>

                      {/* Summary Highlight Box */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100 text-left font-sans text-xs mt-2">
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{language === "en" ? "Order Reference" : "Référence Commande"}</p>
                          <p className="font-mono font-bold text-gray-900 mt-0.5">{orderInfo.id}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{language === "en" ? "Amount Paid" : "Montant Payé"}</p>
                          <p className="font-bold text-emerald-700 mt-0.5">C${displayTotal.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{language === "en" ? "Receipt Destination" : "Envoi du Reçu"}</p>
                          <p className="font-semibold text-gray-800 truncate mt-0.5" title={formData.email}>{formData.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Receipt 
                    orderId={orderInfo.id}
                    date={orderInfo.date}
                    timezone={orderInfo.timezone}
                    customer={formData}
                    items={completedOrderItems.length > 0 ? completedOrderItems : items}
                    subtotal={displaySubtotal}
                    shipping={displayShipping}
                    hst={displayHst}
                    total={displayTotal}
                    discount={displayDiscount}
                    discountCode={displayDiscountCode}
                    shippingDiscount={displayShippingDiscount}
                    paymentMethod={paymentMethod}
                    shippingMethod={displayShippingMethod}
                  />

                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-8 no-print border-t border-gray-100">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!orderInfo) return;
                        try {
                          const activeItems = completedOrderItems.length > 0 ? completedOrderItems : items;
                          const pdfData: OrderDataForPdf = {
                            orderId: orderInfo.id,
                            date: orderInfo.date,
                            createdAt: orderInfo.createdAt,
                            timezone: orderInfo.timezone,
                            customerName: `${formData.firstName} ${formData.lastName}`,
                            customerEmail: formData.email,
                            address: formData.address,
                            city: formData.city,
                            province: province,
                            postal: formData.postal,
                            country: country === "CA" ? "Canada" : "United States",
                            items: activeItems.map(i => ({
                              id: i.id,
                              name: i.name,
                              price: i.price,
                              quantity: i.quantity,
                              sku: (i as any).sku
                            })),
                            subtotal: displaySubtotal,
                            shipping: displayShipping,
                            hst: displayHst,
                            total: displayTotal,
                            paymentMethod: paymentMethod === "etransfer" ? "Interac e-transfer" : "PayPal / Card",
                            shippingMethod: displayShippingMethod
                          };
                          await downloadReceiptPdf(pdfData);
                          toast.success(language === "en" ? "PDF Receipt Downloaded!" : "Reçu PDF téléchargé !");
                        } catch (e) {
                          console.error(e);
                          toast.error("Failed to generate PDF");
                        }
                      }}
                      className="flex items-center gap-2 px-6 py-4 border border-brand-accent text-brand-accent font-sans font-bold rounded-xl hover:bg-brand-accent/5 transition-all uppercase tracking-widest text-[10px]"
                    >
                      <Download size={14} />
                      Download PDF Receipt
                    </button>
                    <button 
                      type="button"
                      onClick={() => window.print()}
                      className="flex items-center gap-2 px-6 py-4 border border-gray-200 text-gray-700 font-sans font-bold rounded-xl hover:bg-gray-50 transition-all uppercase tracking-widest text-[10px]"
                    >
                      <Printer size={14} />
                      Print Receipt
                    </button>
                    <button 
                      type="button"
                      onClick={handleFinish}
                      className="px-10 py-4 bg-brand-accent text-white font-sans font-bold rounded-xl hover:shadow-xl hover:bg-brand-accent/90 transition-all uppercase tracking-widest text-[10px]"
                    >
                      {t("checkout_back_home")}
                    </button>
                  </div>
                </div>
              );
            })()
          ) : (
             <div className="space-y-10 max-w-xl mx-auto">
               
              {/* STEP 1: Address & Email */}
              <div className={`transition-opacity duration-300 ${step !== "address" ? "opacity-50" : "opacity-100"}`}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-sans font-bold tracking-tight text-gray-900">{t("checkout_step_address_title")}</h2>
                  {step !== "address" && (
                    <button onClick={() => setStep("address")} className="text-brand-accent text-sm font-sans underline">{t("checkout_change_address")}</button>
                  )}
                </div>
                
                {step === "address" ? (
                  <form onSubmit={handleAddressSubmit} className="space-y-5 animate-fadeIn">
                    <p className="text-gray-500 font-serif text-sm leaading-relaxed mb-6">{t("checkout_step_email_desc")}</p>
                    
                    <div className="space-y-4">
                      <input required type="email" placeholder={t("checkout_email")} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-colors font-sans text-sm" />
                      
                      <div className="flex items-center gap-3 pt-2">
                        <input 
                          type="checkbox" 
                          id="terms" 
                          required
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="w-4 h-4 text-brand-accent border-gray-300 rounded focus:ring-brand-accent"
                        />
                        <label htmlFor="terms" className="text-sm font-serif text-gray-600 block leading-tight">
                          {t("checkout_agree_terms")}
                        </label>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 mt-6 space-y-4">
                      <select
                        required
                        value={country}
                        onChange={e => {
                          setCountry(e.target.value);
                          setFormData({...formData, country: e.target.value});
                          // Reset province to valid default when switching country
                          if (e.target.value === "US") setProvince("NY");
                          else setProvince("ON");
                          // Also reset shipping option
                          if (e.target.value === "US") setShippingOption("cp_small_packet");
                          else setShippingOption("standard");
                        }}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-colors bg-white font-sans text-sm"
                      >
                        <option value="CA">Canada</option>
                        <option value="US">United States</option>
                      </select>

                      <div className="grid grid-cols-2 gap-4">
                        <input required type="text" placeholder={t("checkout_first_name")} value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-colors font-sans text-sm" />
                        <input required type="text" placeholder={t("checkout_last_name")} value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-colors font-sans text-sm" />
                      </div>
                      <input required type="text" placeholder={t("checkout_address")} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-colors font-sans text-sm" />
                      <div className="grid grid-cols-2 gap-4">
                        {country === "CA" ? (
                          <select 
                            required 
                            value={formData.city} 
                            onChange={e => {
                              setFormData({...formData, city: e.target.value});
                              setCity(e.target.value);
                            }} 
                            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-colors bg-white font-sans text-sm"
                          >
                            <option value="" disabled>{t("checkout_city")}</option>
                            {CITIES_BY_PROVINCE[province as keyof typeof CITIES_BY_PROVINCE]?.map(cityName => (
                              <option key={cityName} value={cityName}>{cityName}</option>
                            ))}
                          </select>
                        ) : (
                          <input required type="text" placeholder={t("checkout_city")} value={formData.city} onChange={e => {
                            setFormData({...formData, city: e.target.value});
                            setCity(e.target.value);
                          }} className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-colors font-sans text-sm" />
                        )}
                        {country === "CA" ? (
                          <select 
                            required 
                            value={province} 
                            onChange={e => {
                              const newProv = e.target.value;
                              setProvince(newProv);
                              setFormData({...formData, province: newProv, city: ""});
                              setCity("");
                            }}
                            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-colors bg-white font-sans text-sm"
                          >
                            <option value="AB">Alberta</option>
                            <option value="BC">British Columbia</option>
                            <option value="MB">Manitoba</option>
                            <option value="NB">New Brunswick</option>
                            <option value="NL">Newfoundland and Labrador</option>
                            <option value="NS">Nova Scotia</option>
                            <option value="NT">Northwest Territories</option>
                            <option value="NU">Nunavut</option>
                            <option value="ON">Ontario</option>
                            <option value="PE">Prince Edward Island</option>
                            <option value="QC">Quebec</option>
                            <option value="SK">Saskatchewan</option>
                            <option value="YT">Yukon</option>
                          </select>
                        ) : (
                          <input required type="text" placeholder={t("checkout_state")} value={province} onChange={e => {
                            setProvince(e.target.value);
                            setFormData({...formData, province: e.target.value});
                          }} className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-colors font-sans text-sm uppercase placeholder:normal-case" maxLength={2} />
                        )}
                      </div>
                      <input required type="text" placeholder={t("checkout_postal")} value={formData.postal} onChange={e => setFormData({...formData, postal: e.target.value})} className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-colors font-sans text-sm uppercase" />
                    </div>

                    <div className="pt-4">
                      <button type="submit" className="w-full py-4 bg-[#111] text-white font-sans font-bold rounded-lg hover:bg-black transition-all">
                        {t("checkout_btn_continue")}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="font-serif text-sm text-gray-600 leading-relaxed">
                    <p className="font-sans font-semibold text-gray-900">{formData.firstName} {formData.lastName}</p>
                    <p>{formData.email}</p>
                    <p>{formData.address}</p>
                    <p>{formData.city}, {province} {formData.postal}</p>
                  </div>
                )}
              </div>

              {/* STEP 2: Shipping Options */}
              {(country === "CA" || country === "US") && (
                <div className={`border-t border-gray-100 pt-8 transition-opacity duration-300 ${step === "address" ? "opacity-30 pointer-events-none" : (step === "payment" ? "opacity-50" : "opacity-100")}`}>
                  <h2 className="text-2xl font-sans font-bold tracking-tight text-gray-900">{t("checkout_shipping_methods_title")}</h2>
                  
                  {step === "shipping" ? (
                    <form onSubmit={handleShippingSubmit} className="mt-6 space-y-6 animate-fadeIn">
                      <p className="text-gray-500 font-serif text-sm">{t("checkout_shipping_methods_desc")}</p>
                      
                      <div className="space-y-4 font-sans">
                        {country === "CA" ? (
                          (() => {
                            const baseRate = SHIPPING_RATES_BY_PROVINCE[province] || 12.99;
                            const threshold = FREE_SHIPPING_THRESHOLDS[province];
                            const isFreeThreshold = threshold !== null && finalSubtotal >= threshold;
                            const isFreePromo = appliedPromo?.discountType === "shipping_free" || promoShippingDiscount >= baseRate;
                            const isFree = isFreeThreshold || isFreePromo;
                            const discountedShippingCost = isFree ? 0 : Math.max(0, baseRate - promoShippingDiscount);
                            const priceText = isFree || discountedShippingCost === 0 
                              ? (language === "en" ? "Free" : "Gratuit") 
                              : `C$${discountedShippingCost.toFixed(2)}`;
                            
                            return (
                              <div
                                className="flex flex-col p-5 border border-[#111] bg-[#fafafa] rounded-2xl shadow-sm"
                              >
                                <div className="flex items-start gap-4">
                                  <div className="pt-1">
                                    <input
                                      type="radio"
                                      name="shippingOption"
                                      value="standard"
                                      checked={true}
                                      readOnly
                                      className="w-4 h-4 text-brand-accent focus:ring-brand-accent"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex justify-between items-center text-sm font-bold text-gray-900">
                                      <span className="font-sans tracking-wide text-sm">
                                        {language === "en" ? "Standard Shipping" : "Livraison Standard"}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {promoShippingDiscount > 0 && !isFree && (
                                          <span className="line-through text-gray-400 font-sans text-xs">
                                            C${baseRate.toFixed(2)}
                                          </span>
                                        )}
                                        <span className="font-sans font-extrabold text-[#111]">{priceText}</span>
                                      </div>
                                    </div>
                                    <div className="mt-1 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 font-serif gap-1">
                                      <span>
                                        {language === "en" 
                                          ? `Delivery based on Canada Post schedules for ${province}` 
                                          : `Livraison selon les délais de Postes Canada pour ${province}`}
                                      </span>
                                    </div>
                                    
                                    {isFree ? (
                                      <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="mt-2 text-[10px] text-green-700 font-sans font-bold tracking-wider uppercase bg-green-50 p-2.5 rounded-lg border border-green-200 flex items-center gap-2 animate-fadeIn"
                                      >
                                        <span>🎉</span>
                                        <span>
                                          {isFreePromo
                                            ? (language === "en" ? `Free Shipping Promo Applied with code ${appliedPromo?.code}!` : `Code promo ${appliedPromo?.code} appliqué : Livraison gratuite !`)
                                            : (language === "en" 
                                                ? `Free Shipping Applied (Subtotal exceeds C$${threshold}!)` 
                                                : `Livraison gratuite appliquée (total supérieur à ${threshold} C$ !)`)}
                                        </span>
                                      </motion.div>
                                    ) : (
                                      threshold !== null && (
                                        <div className="mt-2 text-[10px] text-gray-500 font-sans">
                                          {language === "en" 
                                            ? `Tip: Get free shipping on orders of C$${threshold}+ (add C$${(threshold - finalSubtotal).toFixed(2)} more)` 
                                            : `Conseil : Bénéficiez de la livraison gratuite dès C$${threshold}+ (ajoutez C$${(threshold - finalSubtotal).toFixed(2)} de plus)`}
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })()
                        ) : loadingRates ? (
                          <div className="py-12 flex flex-col items-center justify-center space-y-4">
                            <div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-xs text-gray-500 font-serif animate-pulse">
                              {language === "en" ? "Calculating live shipping rates based on weight..." : "Calcul des tarifs de livraison en direct selon le poids..."}
                            </p>
                          </div>
                        ) : shippingRates && shippingRates.length > 0 ? (
                          shippingRates.map((rate) => {
                            const isSelected = selectedRate?.serviceCode === rate.serviceCode;
                            const priceToDisplay = `C$${rate.priceDetails.due.toFixed(2)}`;
                            const preTaxPrice = `C$${rate.priceDetails.base.toFixed(2)}`;
                            
                            const transitDays = rate.serviceStandard.expectedTransitTime;
                            const deliveryDate = new Date(rate.serviceStandard.expectedDeliveryDate).toLocaleDateString(
                               language === "en" ? "en-CA" : "fr-CA",
                               { weekday: "short", month: "short", day: "numeric" }
                             );
 
                             return (
                               <div
                                 key={rate.serviceCode}
                                 onClick={() => {
                                   setSelectedRate(rate);
                                   setShippingOption(rate.serviceCode);
                                 }}
                                 className={`flex flex-col p-5 border rounded-2xl cursor-pointer transition-all ${
                                   isSelected 
                                     ? "border-[#111] bg-[#fafafa] shadow-sm" 
                                     : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                                 }`}
                               >
                                 <div className="flex items-start gap-4">
                                   <div className="pt-1">
                                     <input
                                       type="radio"
                                       name="shippingOption"
                                       value={rate.serviceCode}
                                       checked={isSelected}
                                       onChange={() => {
                                         setSelectedRate(rate);
                                         setShippingOption(rate.serviceCode);
                                       }}
                                       className="w-4 h-4 text-brand-accent focus:ring-brand-accent"
                                     />
                                   </div>
                                   <div className="flex-1">
                                     <div className="flex justify-between items-center text-sm font-bold text-gray-900">
                                       <span className="font-sans tracking-wide text-sm">{rate.serviceName}</span>
                                       <span className="font-sans font-extrabold text-[#111]">{priceToDisplay}</span>
                                     </div>
                                     <div className="mt-1 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 font-serif gap-1">
                                       <span>
                                         {language === "en" 
                                           ? `Estimated delivery: ${deliveryDate} (${transitDays} ${transitDays === 1 ? 'day' : 'days'})` 
                                           : `Livraison estimée : ${deliveryDate} (${transitDays} ${transitDays === 1 ? 'jour' : 'jours'})`}
                                       </span>
                                       {rate.serviceStandard.guaranteedDelivery && (
                                         <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 text-[10px] font-sans font-bold uppercase tracking-wider border border-green-100">
                                           {language === "en" ? "Guaranteed" : "Garanti"}
                                         </span>
                                       )}
                                     </div>
                                     
                                     {/* Detailed breakdown card (displays when rate is selected) */}
                                     {isSelected && (
                                       <motion.div 
                                         initial={{ opacity: 0, height: 0 }}
                                         animate={{ opacity: 1, height: "auto" }}
                                         className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-400 font-sans space-y-1.5"
                                       >
                                         <div className="flex justify-between">
                                           <span>{language === "en" ? "Pre-Tax Base (with Fuel Surcharge):" : "Base hors taxes (avec surcharge carburant) :"}</span>
                                           <span className="font-bold text-gray-500">{preTaxPrice}</span>
                                         </div>
                                         {rate.priceDetails.adjustments?.map((adj: any) => (
                                           <div key={adj.adjustmentCode} className="flex justify-between pl-2 italic">
                                             <span>↳ {adj.adjustmentName}:</span>
                                             <span>+C${adj.adjustmentCost.toFixed(2)}</span>
                                           </div>
                                         ))}
                                         {rate.priceDetails.taxes.gst.amt > 0 && (
                                           <div className="flex justify-between pl-2">
                                             <span>↳ GST ({rate.priceDetails.taxes.gst.percent}%):</span>
                                             <span>+C${rate.priceDetails.taxes.gst.amt.toFixed(2)}</span>
                                           </div>
                                         )}
                                         {rate.priceDetails.taxes.pst.amt > 0 && (
                                           <div className="flex justify-between pl-2">
                                             <span>↳ PST ({rate.priceDetails.taxes.pst.percent}%):</span>
                                             <span>+C${rate.priceDetails.taxes.pst.amt.toFixed(2)}</span>
                                           </div>
                                         )}
                                         {rate.priceDetails.taxes.hst.amt > 0 && (
                                           <div className="flex justify-between pl-2">
                                             <span>↳ HST ({rate.priceDetails.taxes.hst.percent}%):</span>
                                             <span>+C${rate.priceDetails.taxes.hst.amt.toFixed(2)}</span>
                                           </div>
                                         )}
                                         <div className="flex justify-between border-t border-dashed border-gray-100 pt-1.5 font-bold text-gray-600">
                                           <span>{language === "en" ? "Total Rate (Tax Included):" : "Tarif total (taxes incluses) :"}</span>
                                           <span className="text-gray-900">{priceToDisplay}</span>
                                         </div>
                                       </motion.div>
                                     )}
                                   </div>
                                 </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="p-4 border border-red-100 bg-red-50 text-red-600 rounded-xl text-xs font-serif flex items-center gap-2">
                              <span>⚠️</span>
                              <span>
                                {language === "en" 
                                  ? "No shipping services found. Standard rates apply." 
                                  : "Aucun service de livraison trouvé. Les tarifs standard s'appliquent."}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Interactive Order Summary & Promo Card at Step 2 */}
                        <div className="p-4 bg-gray-50 border border-gray-200/80 rounded-2xl space-y-3 text-xs font-sans">
                          <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                            <span className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                              {language === "en" ? "Order Summary" : "Résumé de commande"}
                            </span>
                            {appliedPromo && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 rounded-full font-bold text-[10px]">
                                <span>🏷️</span>
                                <span>{appliedPromo.code}</span>
                              </span>
                            )}
                          </div>

                          <div className="space-y-1.5 text-gray-600">
                            <div className="flex justify-between items-center">
                              <span>{language === "en" ? "Items Subtotal" : "Sous-total articles"}</span>
                              <span className="font-semibold text-gray-900">C${subtotal.toFixed(2)}</span>
                            </div>

                            {appliedPromo && promoDiscount > 0 && (
                              <div className="flex justify-between items-center text-emerald-700 font-semibold">
                                <span className="flex items-center gap-1">
                                  <span>↳ {language === "en" ? "Gift / Promo Discount" : "Rabais Cadeau / Promo"} ({appliedPromo.code})</span>
                                </span>
                                <span>-C${promoDiscount.toFixed(2)}</span>
                              </div>
                            )}

                            <div className="flex justify-between items-center">
                              <span>{language === "en" ? "Shipping" : "Livraison"}</span>
                              <span className="font-semibold text-gray-900">
                                {finalShipping === 0 ? (language === "en" ? "Free" : "Gratuit") : `C$${finalShipping.toFixed(2)}`}
                              </span>
                            </div>

                            {appliedPromo && promoShippingDiscount > 0 && (
                              <div className="flex justify-between items-center text-emerald-700 font-semibold">
                                <span>↳ {language === "en" ? "Shipping Discount" : "Rabais livraison"}</span>
                                <span>-C${promoShippingDiscount.toFixed(2)}</span>
                              </div>
                            )}

                            <div className="flex justify-between items-center">
                              <span>{language === "en" ? `Taxes / HST (${(taxRate * 100).toFixed(0)}%)` : `Taxes / TVH (${(taxRate * 100).toFixed(0)}%)`}</span>
                              <span className="font-semibold text-gray-900">C${finalHst.toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="border-t border-gray-200 pt-2.5 flex justify-between items-center">
                            <span className="font-bold text-gray-900 text-sm">{language === "en" ? "Total with Discount" : "Total avec Rabais"}</span>
                            <span className="font-extrabold text-base text-[#111]">C${finalTotal.toFixed(2)}</span>
                          </div>
                        </div>
                       
                       <div className="pt-2">
                         <button type="submit" disabled={loadingRates || (country !== "CA" && !selectedRate)} className="w-full py-4 bg-[#111] text-white font-sans font-bold rounded-lg hover:bg-black transition-all disabled:opacity-50">
                           {t("checkout_btn_continue")}
                         </button>
                       </div>
                    </form>
                  ) : (
                    <p className="mt-2 text-gray-500 font-serif text-sm">
                      {step === "address" ? t("checkout_step_shipping_desc") : (
                        <>
                          <span className="font-sans font-bold text-gray-900">
                            {country === "CA" 
                              ? (language === "en" ? "Standard Shipping" : "Livraison Standard") 
                              : (selectedRate ? selectedRate.serviceName : t("checkout_shipping_standard"))}
                          </span>
                          {" - "}
                          {shipping === 0 ? "Free" : `C$${shipping.toFixed(2)}`}
                        </>
                      )}
                    </p>
                  )}
                </div>
              )}

              {/* STEP 3: Payment Information */}
              <div className={`border-t border-gray-100 pt-8 transition-opacity duration-300 ${step !== "payment" ? "opacity-30 pointer-events-none" : "opacity-100"}`}>
                <h2 className="text-2xl font-sans font-bold tracking-tight text-gray-900">{t("checkout_step_payment_title")}</h2>
                
                {step === "payment" ? (
                  <div className="mt-6 space-y-6 animate-fadeIn">
                    <p className="text-gray-500 font-serif text-sm">{t("checkout_step_payment_desc")}</p>
                    
                    <div className="space-y-3 font-sans">
                      {/* PayPal */}
                      <label className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === "paypal" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                        <div className="pt-1">
                           <input type="radio" name="paymentOption" value="paypal" checked={paymentMethod === "paypal"} onChange={() => setPaymentMethod("paypal")} className="w-4 h-4 text-brand-accent" />
                        </div>
                        <div className="flex-1 flex justify-between items-center text-sm font-bold text-gray-900">
                          <span>PayPal</span>
                          <div className="flex items-center">
                            <svg viewBox="0 0 100 32" className="h-6 w-auto" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12.9 2.1C11.5 2.1 10.1 3.2 9.9 4.6L6.1 28.5c-.1.7.4 1.3 1.1 1.3h4.6c.6 0 1.1-.4 1.2-1L14.7 18c.1-.6.6-1 1.2-1h2.2c5.4 0 9.1-2.6 10-8.2.5-3.3-1.1-6.7-5.2-6.7H12.9z" fill="#003087" />
                              <path d="M16.4 8.1c-.2 1.3-1.3 2.3-2.6 2.3h-2.1l1.1-7h2.1c1.3 0 2.1.8 1.9 2.1a2.02 2.02 0 0 1-1.9 1.9c-.1.1-.3.4-.6.7z" fill="#0079C1" />
                              <path d="M18.9 7.1c-.2 1.3-1.3 2.3-2.6 2.3h-2.1l1.1-7h2.1c1.3 0 2.1.8 1.9 2.1a2.02 2.02 0 0 1-1.9 1.9c-.1.1-.3.4-.6.7z" fill="#0079C1" opacity="0.85" />
                              <path d="M15.9 7.1C14.5 7.1 13.1 8.2 12.9 9.6l-3.2 20.2c-.1.7.4 1.3 1.1 1.3h4.6c.6 0 1.1-.4 1.2-1l1.7-10.8c.1-.6.6-1 1.2-1h2.2c5.4 0 9.1-2.6 10-8.2.5-3.3-1.1-6.7-5.2-6.7h-9.8z" fill="#0079C1" />
                              <text x="36" y="22" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="20" fill="#002C8A" letterSpacing="-0.5">Pay</text>
                              <text x="69" y="22" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="20" fill="#0079C1" letterSpacing="-0.5" fontStyle="italic">Pal</text>
                            </svg>
                          </div>
                        </div>
                      </label>
                      
                      {/* E-Transfer */}
                      <label className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === "etransfer" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                        <div className="pt-1">
                           <input type="radio" name="paymentOption" value="etransfer" checked={paymentMethod === "etransfer"} onChange={() => setPaymentMethod("etransfer")} className="w-4 h-4 text-brand-accent" />
                        </div>
                        <div className="flex-1 text-sm font-bold text-gray-900">
                          <span>e-transfer</span>
                        </div>
                      </label>
                    </div>

                    <div className="pt-6 font-serif">
                      <p className="text-gray-900 font-semibold mb-2 font-sans tracking-wide">{t("checkout_billing_same")}</p>
                      <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 border border-gray-100 font-serif">
                        <p>{formData.firstName} {formData.lastName}</p>
                        <p>{formData.address}, {formData.city}, {province} {formData.postal}, {country === "US" ? "United States" : "Canada"}</p>
                      </div>
                    </div>

                    <div className="pt-4 font-serif">
                      <p className="text-gray-900 font-semibold mb-2 font-sans tracking-wide">{t("checkout_order_comments")}</p>
                      <textarea
                        value={orderComments}
                        onChange={(e) => setOrderComments(e.target.value)}
                        placeholder={t("checkout_order_comments_placeholder")}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-colors min-h-[100px] text-sm font-serif resize-none"
                      />
                    </div>

                    {/* Live Order Summary at Step 3 */}
                    <div className="p-4 bg-gray-50 border border-gray-200/80 rounded-2xl space-y-3 text-xs font-sans">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                        <span className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                          {language === "en" ? "Order Summary" : "Résumé de commande"}
                        </span>
                        {appliedPromo && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 rounded-full font-bold text-[10px]">
                            <span>🏷️</span>
                            <span>{appliedPromo.code}</span>
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 text-gray-600">
                        <div className="flex justify-between items-center">
                          <span>{language === "en" ? "Items Subtotal" : "Sous-total articles"}</span>
                          <span className="font-semibold text-gray-900">C${subtotal.toFixed(2)}</span>
                        </div>

                        {appliedPromo && promoDiscount > 0 && (
                          <div className="flex justify-between items-center text-emerald-700 font-semibold">
                            <span>↳ {language === "en" ? "Gift / Promo Discount" : "Rabais Cadeau / Promo"} ({appliedPromo.code})</span>
                            <span>-C${promoDiscount.toFixed(2)}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <span>{language === "en" ? "Shipping" : "Livraison"}</span>
                          <span className="font-semibold text-gray-900">
                            {finalShipping === 0 ? (language === "en" ? "Free" : "Gratuit") : `C$${finalShipping.toFixed(2)}`}
                          </span>
                        </div>

                        {appliedPromo && promoShippingDiscount > 0 && (
                          <div className="flex justify-between items-center text-emerald-700 font-semibold">
                            <span>↳ {language === "en" ? "Shipping Discount" : "Rabais livraison"}</span>
                            <span>-C${promoShippingDiscount.toFixed(2)}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <span>{language === "en" ? `Taxes / HST (${(taxRate * 100).toFixed(0)}%)` : `Taxes / TVH (${(taxRate * 100).toFixed(0)}%)`}</span>
                          <span className="font-semibold text-gray-900">C${finalHst.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-2.5 flex justify-between items-center">
                        <span className="font-bold text-gray-900 text-sm">{language === "en" ? "Amount to Pay" : "Montant à Payer"}</span>
                        <span className="font-extrabold text-base text-brand-accent">C${finalTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      {paymentMethod === "etransfer" ? (
                        <ETransferInstructions 
                          total={finalTotal} 
                          onSuccess={handleSuccess} 
                          onBack={() => setStep(country === "CA" ? "address" : "shipping")}
                          customerName={`${formData.firstName} ${formData.lastName}`}
                          customerEmail={formData.email}
                        />
                      ) : (
                        <div className="space-y-4">
                          <div key={finalTotal} className="w-full relative z-10">
                            <PayPalButtons
                              style={{ 
                                layout: "vertical",
                                color: "gold",
                                shape: "rect",
                                label: "pay"
                              }}
                              createOrder={(data, actions) => {
                                  return actions.order.create({
                                    intent: "CAPTURE",
                                    purchase_units: [
                                      {
                                        amount: {
                                          currency_code: "CAD",
                                          value: finalTotal.toFixed(2)
                                        },
                                        description: "Vonn Essentials Order"
                                      }
                                    ]
                                  });
                              }}
                              onApprove={async (data, actions) => {
                                try {
                                  let devName = "";
                                  if (actions.order) {
                                    try {
                                      const details = await actions.order.capture();
                                      devName = details.payer?.name?.given_name || details.payer?.name?.full_name || "";
                                    } catch (capErr) {
                                      console.warn("PayPal Capture note:", capErr);
                                    }
                                  }
                                  const greeting = devName ? (language === "en" ? `Thank you, ${devName}! ` : `Merci, ${devName} ! `) : "";
                                  toast.success(
                                    language === "en" 
                                      ? `${greeting}Payment approved & order confirmed!` 
                                      : `${greeting}Paiement approuvé et commande confirmée !`
                                  );
                                  handleSuccess();
                                } catch (error) {
                                  console.error("PayPal onApprove error:", error);
                                  handleSuccess();
                                }
                              }}
                              onCancel={() => {
                                toast(language === "en" ? "Payment cancelled." : "Paiement annulé.", { icon: "ℹ️" });
                              }}
                              onError={(err: any) => {
                                const errStr = String(err?.message || err || "");
                                const isPopupClose = /popup close|detected popup close|window closed|closed|cancel/i.test(errStr);
                                if (isPopupClose) {
                                  // User closed the PayPal modal/popup window intentionally
                                  console.log("PayPal popup closed by user:", errStr);
                                  toast(language === "en" ? "PayPal window was closed." : "La fenêtre PayPal a été fermée.", { icon: "ℹ️" });
                                } else {
                                  console.warn("PayPal Button notice:", err);
                                  toast.error(language === "en" ? "Could not complete PayPal transaction. Please try again or use Interac e-Transfer." : "Impossible de finaliser la transaction PayPal. Veuillez réessayer ou utiliser le virement Interac.");
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-gray-500 font-serif text-sm">
                    {step === "address" || step === "shipping" ? t("checkout_step_payment_desc") : ""}
                  </p>
                )}
              </div>

               <div className="pt-8 flex items-center justify-center text-gray-400 gap-1 text-[11px] font-sans">
                 <Lock size={12} />
                 <span>All data is transmitted encrypted via a secure TLS connection</span>
               </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
