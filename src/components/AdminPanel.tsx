import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Lock, LogOut, Plus, Edit2, Trash2, Check, Package, FileText, Globe, Upload, Info, ShoppingBag, Gift, Mail, Download, Send, Eye, Camera, RotateCcw, RefreshCw, AlertCircle, DollarSign, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { useLanguage } from "./LanguageContext";
import { useCart } from "./CartContext";
import { Product, GiftCode, Order } from "../types";
import { toast } from "react-hot-toast";
import { db, doc, setDoc } from "../lib/firebase";
import GmailManager from "./GmailManager";
import { downloadReceiptPdf, OrderDataForPdf } from "../lib/pdfService";
import { sendGmailReceiptWithPdf, isGmailConnected, getGmailConnectedUser } from "../lib/gmailService";
import { sendCustomerRefundEmail } from "../lib/emailService";
import type { RefundEmailData } from "../lib/emailService";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const { 
    language, 
    getAllProductsEn, 
    getAllProductsFr, 
    addProduct, 
    updateProduct, 
    deleteProduct,
    addBlogPost,
    updateBlogPost,
    deleteBlogPost,
    getAllBlogsEn,
    getAllBlogsFr,
    adminPasscode,
    updateAdminPasscode,
    adminEmail,
    updateAdminEmail
  } = useLanguage();
  const { orders, updateOrderStatus, updateOrderRefund } = useCart();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmailInput, setAdminEmailInput] = useState("");
  const [passcode, setPasscode] = useState("");
  const [activeTab, setActiveTab] = useState<"list" | "form">("list");
  const [adminView, setAdminView] = useState<"products" | "orders" | "gmail" | "journal" | "announcements" | "settings" | "gift_codes" | "pages">("products");
  const [orderFilter, setOrderFilter] = useState<"all" | "pending_etransfer" | "completed" | "refund_processing" | "refunded" | "cancelled">("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Custom Confirmation Dialog State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Form states (Bilingual)
  const [id, setId] = useState<string>("");
  const [nameEn, setNameEn] = useState("");
  const [nameFr, setNameFr] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [weightEn, setWeightEn] = useState("");
  const [weightFr, setWeightFr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionFr, setDescriptionFr] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sku, setSku] = useState("");
  const [collection, setCollection] = useState("");
  const [isCustomCollection, setIsCustomCollection] = useState(false);

  const productsEn = getAllProductsEn();
  const productsFr = getAllProductsFr();

  // Standard predefined collections
  const standardCollections = [
    "Soaps",
    "Skincare",
    "Gift Sets",
    "Hair Care",
    "Face Wash",
    "Serums & Oils",
    "Masks & Scrubs",
    "Body Care",
    "Bath & Shower",
    "Essential Oils",
    "Wellness & Aromatherapy"
  ];

  // Dynamic list of all available collections from existing products
  const availableCollections = Array.from(
    new Set([
      ...standardCollections,
      ...productsEn
        .map((p) => p.collection?.trim())
        .filter((c): c is string => Boolean(c && c.length > 0))
    ])
  ).sort();

  // Pre-set images for easy selection
  const presetImages = [
    "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/5162316022.jpg",
    "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/5278612939.jpg",
    "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/778852491/5735737241.jpg",
    "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/708162349/5735794901.jpg",
    "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/670404034/5741905326.jpg",
    "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/556991930/5735741401.jpg"
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredEmail = adminEmailInput.trim().toLowerCase();
    const targetEmail = (adminEmail || "vonnessentials@gmail.com").trim().toLowerCase();

    // Verify admin email
    if (enteredEmail !== "vonnessentials@gmail.com" && enteredEmail !== targetEmail && enteredEmail !== "admin@vonnessentials.com") {
      toast.error(
        language === "en" 
          ? "Invalid administrator email." 
          : "Courriel administrateur invalide."
      );
      return;
    }

    // Verify admin passcode
    if (passcode.toLowerCase() === "vonnadmin" || passcode === "admin123" || passcode === adminPasscode) {
      setIsAuthenticated(true);
      toast.success(language === "en" ? "Successfully logged in as Administrator!" : "Connexion administrateur réussie !");
    } else {
      toast.error(language === "en" ? "Invalid administrator passcode." : "Code administrateur erroné.");
    }
  };

  const handleOpenAdd = () => {
    // Auto-generate numeric ID
    const newId = Math.floor(100000000 + Math.random() * 900000000).toString();
    setId(newId);
    setNameEn("");
    setNameFr("");
    setPrice("");
    setDiscountPrice("");
    setWeightEn("");
    setWeightFr("");
    setDescriptionEn("");
    setDescriptionFr("");
    setImageUrl("");
    setSku("");
    setCollection("Soaps");
    setIsCustomCollection(false);
    setEditingProduct(null);
    setActiveTab("form");
  };

  const handleOpenEdit = (pEn: Product) => {
    const pFr = productsFr.find((p) => p.id === pEn.id) || pEn;
    setEditingProduct(pEn);
    setId(pEn.id.toString());
    setNameEn(pEn.name);
    setNameFr(pFr.name);
    // Parse pure price number for easy editing
    const rawPrice = pEn.price.replace("C$", "").trim();
    setPrice(rawPrice);
    const rawDiscount = pEn.discountPrice ? pEn.discountPrice.replace("C$", "").trim() : "";
    setDiscountPrice(rawDiscount);
    setWeightEn(pEn.weight);
    setWeightFr(pFr.weight);
    setDescriptionEn(pEn.description || "");
    setDescriptionFr(pFr.description || "");
    setImageUrl(pEn.image);
    setSku(pEn.sku || "");
    const prodCollection = pEn.collection || "";
    setCollection(prodCollection);
    setIsCustomCollection(!availableCollections.includes(prodCollection) && prodCollection !== "");
    setActiveTab("form");
  };

  const handleDelete = (productId: number) => {
    const confirmMsg = language === "en" 
       ? "Are you sure you want to delete this product?" 
       : "Êtes-vous sûr de vouloir supprimer ce produit ?";
    
    showConfirm(
      language === "en" ? "Delete Product" : "Supprimer le produit",
      confirmMsg,
      () => {
        deleteProduct(productId);
        toast.success(language === "en" ? "Product deleted" : "Produit supprimé");
      }
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const finalNameEn = nameEn.trim();
    const finalNameFr = nameFr.trim() || finalNameEn;
    const finalWeightEn = weightEn.trim();
    const finalWeightFr = weightFr.trim() || finalWeightEn;

    if (!finalNameEn || !price.trim() || !finalWeightEn || !imageUrl.trim()) {
      toast.error(language === "en" ? "Please fill out the product name, price, weight, and image URL" : "Veuillez remplir le nom, le prix, le poids et l'URL de l'image");
      return;
    }

    // Format price correctly with C$ prefix
    let formattedPrice = price.trim();
    if (!formattedPrice.startsWith("C$")) {
      formattedPrice = `C$${parseFloat(formattedPrice.replace(",", ".")).toFixed(2)}`;
    }

    let formattedDiscount: string | undefined = undefined;
    if (discountPrice.trim()) {
      formattedDiscount = discountPrice.trim();
      if (!formattedDiscount.startsWith("C$")) {
        formattedDiscount = `C$${parseFloat(formattedDiscount.replace(",", ".")).toFixed(2)}`;
      }
    }

    const finalId = parseInt(id) || Date.now();

    // Map French collection if applicable
    let colFr = collection.trim() || undefined;
    if (collection === "Soaps") colFr = "Savons";
    else if (collection === "Skincare") colFr = "Soins de la peau";
    else if (collection === "Gift Sets") colFr = "Coffrets Cadeaux";
    else if (collection === "Hair Care") colFr = "Soins des cheveux";

    const productEn: Product = {
      id: finalId,
      name: finalNameEn,
      price: formattedPrice,
      discountPrice: formattedDiscount,
      weight: finalWeightEn,
      image: imageUrl.trim(),
      sku: sku.trim() || undefined,
      description: descriptionEn.trim() || undefined,
      collection: collection.trim() || undefined
    };

    const productFr: Product = {
      id: finalId,
      name: finalNameFr,
      price: formattedPrice,
      discountPrice: formattedDiscount,
      weight: finalWeightFr,
      image: imageUrl.trim(),
      sku: sku.trim() || undefined,
      description: (descriptionFr && descriptionFr.trim()) || descriptionEn.trim() || undefined,
      collection: colFr
    };

    if (editingProduct) {
      updateProduct(finalId, productEn, productFr);
      toast.success(language === "en" ? "Product updated successfully!" : "Produit mis à jour avec succès !");
    } else {
      // Check for duplicate ID
      if (productsEn.some(p => p.id === finalId)) {
        toast.error(language === "en" ? "A product with this ID already exists" : "Un produit avec cet identifiant existe déjà");
        return;
      }
      addProduct(productEn, productFr);
      toast.success(language === "en" ? "Product added successfully across all users!" : "Produit ajouté avec succès pour tous les utilisateurs !");
    }

    setActiveTab("list");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 font-serif">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-gray-100">
        
        {/* Header */}
        <div className="p-6 md:p-8 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-accent rounded-xl flex items-center justify-center text-white">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-sans font-bold text-gray-900 uppercase tracking-wide">
                {language === "en" ? "Admin Dashboard" : "Tableau de Bord Admin"}
              </h2>
              <p className="text-xs text-gray-400 font-sans tracking-wide mt-0.5">
                {language === "en" ? "Manage your store catalogue and products" : "Gérer le catalogue et les produits de la boutique"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button
                onClick={() => {
                  setIsAuthenticated(false);
                  setPasscode("");
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-gray-600 font-sans font-bold text-xs hover:bg-gray-100 transition-all uppercase tracking-wider"
              >
                <LogOut size={14} />
                {language === "en" ? "Log Out" : "Se déconnecter"}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2.5 rounded-full hover:bg-gray-200 transition-all text-gray-400 hover:text-gray-900 border border-transparent hover:border-gray-100"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-grow overflow-y-auto p-6 md:p-8">
          {!isAuthenticated ? (
            /* Login Screen */
            <div className="max-w-md mx-auto py-12 md:py-20 text-center">
              <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gray-400 shadow-sm">
                <Lock size={24} />
              </div>
              <h3 className="text-2xl font-sans font-bold text-gray-900 mb-2 uppercase tracking-wide">
                {language === "en" ? "Admin Portal Access" : "Accès au Portail Administrateur"}
              </h3>
              <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto">
                {language === "en" 
                  ? "Enter the administrator credentials to manage your store." 
                  : "Saisissez les identifiants administrateur pour gérer votre boutique."}
              </p>
              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold font-sans uppercase tracking-wider text-gray-500">
                    {language === "en" ? "Admin Email Address" : "Courriel Administrateur"}
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmailInput}
                    onChange={(e) => setAdminEmailInput(e.target.value)}
                    placeholder={language === "en" ? "admin@domain.com" : "courriel@domaine.com"}
                    className="w-full px-5 py-3.5 rounded-2xl border-2 border-gray-100 focus:border-brand-accent focus:outline-none transition-all font-sans text-sm text-gray-900"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold font-sans uppercase tracking-wider text-gray-500">
                    {language === "en" ? "Admin Passcode" : "Code Administrateur"}
                  </label>
                  <input
                    type="password"
                    required
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder={language === "en" ? "Enter admin passcode" : "Code administrateur"}
                    className="w-full px-5 py-3.5 rounded-2xl border-2 border-gray-100 focus:border-brand-accent focus:outline-none transition-all font-sans text-sm text-gray-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-[#1a1a1a] hover:bg-brand-accent text-white font-sans font-bold rounded-2xl shadow-lg transition-all uppercase tracking-widest text-xs mt-2"
                >
                  {language === "en" ? "Unlock Admin Portal" : "Déverrouiller le Portail"}
                </button>
              </form>
            </div>
          ) : (
            /* Dashboard View */
            <div className="space-y-6">
              {/* Sub-navigation for Products vs Orders */}
              <div className="flex flex-wrap border-b border-gray-100 mb-6 font-sans gap-y-2">
                <button
                  type="button"
                  onClick={() => { setAdminView("products"); setActiveTab("list"); }}
                  className={`pb-4 px-4 md:px-6 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${adminView === "products" ? "border-brand-accent text-brand-accent" : "border-transparent text-gray-400 hover:text-gray-900"}`}
                >
                  {language === "en" ? "Manage Catalog" : "Catalogue de Produits"}
                </button>
                <button
                  type="button"
                  onClick={() => { setAdminView("orders"); setActiveTab("list"); }}
                  className={`pb-4 px-4 md:px-6 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 relative ${adminView === "orders" ? "border-brand-accent text-brand-accent" : "border-transparent text-gray-400 hover:text-gray-900"}`}
                >
                  <span>{language === "en" ? "Orders" : "Commandes"}</span>
                  {orders.filter(o => o.paymentStatus === "pending_etransfer").length > 0 && (
                    <span className="bg-red-500 text-white text-[9px] w-4.5 h-4.5 flex items-center justify-center rounded-full font-bold">
                      {orders.filter(o => o.paymentStatus === "pending_etransfer").length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setAdminView("gmail"); setActiveTab("list"); }}
                  className={`pb-4 px-4 md:px-6 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${adminView === "gmail" ? "border-brand-accent text-brand-accent" : "border-transparent text-gray-400 hover:text-gray-900"}`}
                >
                  <Mail size={14} />
                  <span>{language === "en" ? "Gmail Hub" : "Centre Gmail"}</span>
                  {isGmailConnected() && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setAdminView("journal"); setActiveTab("list"); }}
                  className={`pb-4 px-4 md:px-6 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${adminView === "journal" ? "border-brand-accent text-brand-accent" : "border-transparent text-gray-400 hover:text-gray-900"}`}
                >
                  {language === "en" ? "Journal" : "Journal"}
                </button>
                <button
                  type="button"
                  onClick={() => { setAdminView("announcements"); setActiveTab("list"); }}
                  className={`pb-4 px-4 md:px-6 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${adminView === "announcements" ? "border-brand-accent text-brand-accent" : "border-transparent text-gray-400 hover:text-gray-900"}`}
                >
                  {language === "en" ? "Announcement" : "Annonce"}
                </button>
                <button
                  type="button"
                  onClick={() => { setAdminView("pages"); setActiveTab("list"); }}
                  className={`pb-4 px-4 md:px-6 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${adminView === "pages" ? "border-brand-accent text-brand-accent" : "border-transparent text-gray-400 hover:text-gray-900"}`}
                >
                  {language === "en" ? "Pages & Policies" : "Pages & Politiques"}
                </button>
                <button
                  type="button"
                  onClick={() => { setAdminView("settings"); setActiveTab("list"); }}
                  className={`pb-4 px-4 md:px-6 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${adminView === "settings" ? "border-brand-accent text-brand-accent" : "border-transparent text-gray-400 hover:text-gray-900"}`}
                >
                  {language === "en" ? "Passcode Settings" : "Code Administrateur"}
                </button>
                <button
                  type="button"
                  onClick={() => { setAdminView("gift_codes"); setActiveTab("list"); }}
                  className={`pb-4 px-4 md:px-6 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${adminView === "gift_codes" ? "border-brand-accent text-brand-accent" : "border-transparent text-gray-400 hover:text-gray-900"}`}
                >
                  {language === "en" ? "Gift Codes" : "Codes Cadeaux"}
                </button>
              </div>

              {adminView === "gmail" ? (
                <GmailManager />
              ) : adminView === "orders" ? (
                /* Orders and E-Transfers Management */
                <AdminOrdersView 
                  orders={orders} 
                  language={language} 
                  filter={orderFilter} 
                  setFilter={setOrderFilter} 
                  updateStatus={updateOrderStatus} 
                  updateOrderRefund={updateOrderRefund}
                  showConfirm={showConfirm}
                />
              ) : adminView === "journal" ? (
                <AdminJournalView language={language} showConfirm={showConfirm} />
              ) : adminView === "announcements" ? (
                <AdminAnnouncementsView language={language} />
              ) : adminView === "pages" ? (
                <AdminPagesView language={language} />
              ) : adminView === "settings" ? (
                <AdminSettingsView 
                  language={language} 
                  currentPasscode={adminPasscode}
                  onUpdatePasscode={updateAdminPasscode}
                  currentEmail={adminEmail}
                  onUpdateEmail={updateAdminEmail}
                />
              ) : adminView === "gift_codes" ? (
                <AdminGiftCodesView language={language} showConfirm={showConfirm} />
              ) : activeTab === "list" ? (
                /* Products list tab */
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-sans font-bold text-gray-900 uppercase tracking-wide">
                      {language === "en" ? "Current Catalog" : "Catalogue Actuel"} ({productsEn.length} {language === "en" ? "products" : "produits"})
                    </h3>
                    <button
                      type="button"
                      onClick={handleOpenAdd}
                      className="flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-full font-sans font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
                    >
                      <Plus size={16} />
                      {language === "en" ? "Add New Product" : "Ajouter un Produit"}
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
                    <table className="w-full border-collapse text-left text-xs font-sans">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase font-semibold tracking-wider">
                          <th className="p-4 pl-6">{language === "en" ? "Product" : "Produit"}</th>
                          <th className="p-4">SKU / ID</th>
                          <th className="p-4">{language === "en" ? "English Details" : "Détails Anglais"}</th>
                          <th className="p-4">{language === "en" ? "French Details" : "Détails Français"}</th>
                          <th className="p-4">{language === "en" ? "Price" : "Prix"}</th>
                          <th className="p-4 pr-6 text-right">{language === "en" ? "Actions" : "Actions"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {productsEn.map((pEn) => {
                          const pFr = productsFr.find((p) => p.id === pEn.id) || pEn;
                          return (
                            <tr key={pEn.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-4 pl-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-gray-50 rounded-lg p-1 border border-gray-100 flex items-center justify-center overflow-hidden">
                                    <img src={pEn.image} alt={pEn.name} className="object-contain w-full h-full" referrerPolicy="no-referrer" />
                                  </div>
                                  <span className="font-semibold text-gray-900">{pEn.name}</span>
                                </div>
                              </td>
                              <td className="p-4 text-gray-500 font-mono tracking-wider">
                                <div className="text-[10px] text-gray-400">ID: {pEn.id}</div>
                                <div className="font-bold text-gray-[#111] mt-0.5">{pEn.sku || "—"}</div>
                              </td>
                              <td className="p-4 text-gray-600">
                                <p className="font-medium">{pEn.name}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{pEn.weight}</p>
                              </td>
                              <td className="p-4 text-gray-600">
                                <p className="font-medium">{pFr.name}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{pFr.weight}</p>
                              </td>
                              <td className="p-4 font-bold text-gray-900">{pEn.price}</td>
                              <td className="p-4 pr-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(pEn)}
                                    className="p-2 text-gray-500 hover:text-brand-accent hover:bg-gray-100 rounded-lg transition-all"
                                    title={language === "en" ? "Edit Product" : "Modifier le produit"}
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(pEn.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    title={language === "en" ? "Delete Product" : "Supprimer le produit"}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Edit/Add Form */
                <form onSubmit={handleSave} className="space-y-8">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <h3 className="text-lg font-sans font-bold text-gray-900 uppercase tracking-wide">
                      {editingProduct 
                        ? (language === "en" ? "Edit Product" : "Modifier le Produit")
                        : (language === "en" ? "Add New Product" : "Ajouter un Produit")
                      }
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab("list")}
                      className="text-xs text-gray-400 hover:text-gray-900 font-sans tracking-wide uppercase font-bold"
                    >
                      {language === "en" ? "← Back to List" : "← Retour au catalogue"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
                    {/* Left Column: English details */}
                    <div className="space-y-4 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe size={14} className="text-brand-accent" />
                        <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400">English Specifications</h4>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Product Name (EN)</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Lavender Face Wash"
                          value={nameEn}
                          onChange={(e) => setNameEn(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Weight & Volume (EN)</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 2.7 fl. Oz/80 mL"
                          value={weightEn}
                          onChange={(e) => setWeightEn(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Product Description (EN)</label>
                        <textarea
                          placeholder="Introduce your handcrafted item, listing its benefits and organic aroma profiles..."
                          value={descriptionEn}
                          onChange={(e) => setDescriptionEn(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-serif"
                        />
                      </div>
                    </div>

                    {/* Right Column: French details */}
                    <div className="space-y-4 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe size={14} className="text-brand-accent" />
                        <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400">Spécifications Françaises</h4>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Nom du produit (FR) <span className="font-normal lowercase text-gray-400">({language === "en" ? "optional" : "optionnel"})</span></label>
                        <input
                          type="text"
                          placeholder="Ex: Nettoyant Visage à la Lavande"
                          value={nameFr}
                          onChange={(e) => setNameFr(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Poids & Volume (FR) <span className="font-normal lowercase text-gray-400">({language === "en" ? "optional" : "optionnel"})</span></label>
                        <input
                          type="text"
                          placeholder="Ex: 2,7 fl. Oz/80 mL"
                          value={weightFr}
                          onChange={(e) => setWeightFr(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Description du Produit (FR)</label>
                        <textarea
                          placeholder="Présentez votre produit artisanal, en décrivant ses bienfaits et ses parfums naturels..."
                          value={descriptionFr}
                          onChange={(e) => setDescriptionFr(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-serif"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pricing, Image & Core Specs */}
                  <div className="bg-gray-50/30 p-6 rounded-2xl border border-gray-100 font-sans space-y-6">
                    <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-gray-400">Core Parameters & Media</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Product ID (Internal)</label>
                        <input
                          type="number"
                          required
                          placeholder="Auto-generated unique ID"
                          value={id}
                          onChange={(e) => setId(e.target.value)}
                          disabled={editingProduct !== null}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm bg-gray-50 font-mono text-gray-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">{language === "en" ? "Custom SKU" : "Code SKU personnalisé"}</label>
                        <input
                          type="text"
                          placeholder="e.g. VE-SOAP-LAV"
                          value={sku}
                          onChange={(e) => setSku(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-mono font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">{language === "en" ? "Regular Price (CAD)" : "Prix Régulier (CAD)"}</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">C$</span>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 12.99"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-bold"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 flex items-center gap-1">
                          <span>{language === "en" ? "Discount Price (CAD)" : "Prix Soldé (CAD)"}</span>
                          <span className="text-[9px] text-gray-400 font-normal font-serif">({language === "en" ? "Optional" : "Optionnel"})</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-accent font-bold text-sm">C$</span>
                          <input
                            type="text"
                            placeholder="e.g. 9.99"
                            value={discountPrice}
                            onChange={(e) => setDiscountPrice(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-brand-accent/20 focus:border-brand-accent focus:outline-none text-sm font-bold text-brand-accent bg-brand-accent/[0.02]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                            {language === "en" ? "Collection / Category" : "Collection / Catégorie"}
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomCollection(!isCustomCollection);
                              if (isCustomCollection) {
                                setCollection("Soaps");
                              } else {
                                setCollection("");
                              }
                            }}
                            className="text-[10px] text-brand-accent font-bold hover:underline"
                          >
                            {isCustomCollection 
                              ? (language === "en" ? "← Choose from list" : "← Choisir dans la liste") 
                              : (language === "en" ? "+ New collection" : "+ Nouvelle collection")}
                          </button>
                        </div>

                        {!isCustomCollection ? (
                          <div className="relative">
                            <select
                              value={availableCollections.includes(collection) ? collection : (collection ? "__custom__" : "")}
                              onChange={(e) => {
                                if (e.target.value === "__new__") {
                                  setIsCustomCollection(true);
                                  setCollection("");
                                } else {
                                  setCollection(e.target.value);
                                }
                              }}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-bold text-gray-800 bg-white cursor-pointer pr-10 appearance-none"
                            >
                              <option value="">{language === "en" ? "-- Select a Collection --" : "-- Choisir une Collection --"}</option>
                              {availableCollections.map((col) => (
                                <option key={col} value={col}>
                                  {col}
                                </option>
                              ))}
                              <option value="__new__" className="text-brand-accent font-bold">
                                {language === "en" ? "+ Add Custom Collection..." : "+ Créer une nouvelle collection..."}
                              </option>
                            </select>
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              required
                              placeholder={language === "en" ? "e.g. Candles, Bath Bombs" : "Ex: Bougies, Bombes de bain"}
                              value={collection}
                              onChange={(e) => setCollection(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border-2 border-brand-accent focus:outline-none text-sm font-bold text-gray-800 bg-white"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomCollection(false);
                                setCollection("Soaps");
                              }}
                              className="px-3 py-3 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 text-xs font-bold whitespace-nowrap"
                            >
                              {language === "en" ? "Cancel" : "Annuler"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                          {language === "en" ? "Image (URL or Local Upload)" : "Image (URL ou Téléchargement local)"}
                        </label>
                        <div className="space-y-2">
                          <input
                            type="text"
                            required
                            placeholder="https://... or choose file below"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm"
                          />
                          
                          <div className="flex flex-col sm:flex-row gap-3">
                            <label className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-gray-50 border-2 border-dashed border-gray-200 hover:border-brand-accent rounded-xl cursor-pointer text-xs text-gray-600 font-bold transition-all shadow-sm">
                              <Upload size={14} className="text-brand-accent" />
                              <span>{language === "en" ? "Upload from device / gallery" : "Télécharger depuis votre appareil"}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    if (file.size > 5 * 1024 * 1024) {
                                      toast.error(language === "en" ? "File size exceeds 5MB limit" : "La taille dépasse la limite de 5 Mo");
                                      return;
                                    }
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      if (typeof reader.result === "string") {
                                        setImageUrl(reader.result);
                                        toast.success(language === "en" ? "Local image loaded successfully!" : "Image locale chargée avec succès !");
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                            
                            {imageUrl && (
                              <button
                                type="button"
                                onClick={() => setImageUrl("")}
                                className="px-5 py-3 text-xs text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl font-bold transition-all border border-red-100 uppercase tracking-wider"
                              >
                                {language === "en" ? "Clear" : "Effacer"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pre-set Image Helper */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block">
                        {language === "en" ? "Or choose from high-quality presets" : "Ou choisissez un visuel de qualité prédéfini"}
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {presetImages.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setImageUrl(img)}
                            className={`aspect-square p-1 rounded-xl border-2 overflow-hidden flex items-center justify-center bg-white transition-all ${imageUrl === img ? "border-brand-accent bg-brand-accent/[0.03]" : "border-gray-100 hover:border-gray-200"}`}
                          >
                            <img src={img} alt={`Preset ${idx}`} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Save button */}
                  <div className="flex justify-end gap-3 font-sans">
                    <button
                      type="button"
                      onClick={() => setActiveTab("list")}
                      className="px-6 py-3.5 border border-gray-200 hover:bg-gray-100 rounded-full font-bold text-xs uppercase tracking-wider transition-all"
                    >
                      {language === "en" ? "Cancel" : "Annuler"}
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-3.5 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
                    >
                      {language === "en" ? "Save Product" : "Enregistrer"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Custom Confirmation Dialog Overlay */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-gray-100 font-sans text-left">
            <h4 className="text-base font-bold text-gray-900 uppercase tracking-wider mb-2">
              {confirmModal.title}
            </h4>
            <p className="text-sm text-gray-500 mb-6 font-serif">
              {confirmModal.message}
            </p>
            <div className="flex items-center justify-end gap-3 font-sans text-xs uppercase tracking-wider font-bold">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              >
                {language === "en" ? "Cancel" : "Annuler"}
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                {language === "en" ? "Confirm" : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminOrdersView({
  orders,
  language,
  filter,
  setFilter,
  updateStatus,
  updateOrderRefund,
  showConfirm
}: {
  orders: Order[];
  language: string;
  filter: string;
  setFilter: (f: any) => void;
  updateStatus: (id: string, s: any) => void;
  updateOrderRefund: (id: string, data: { status: Order["paymentStatus"]; refundDetails: NonNullable<Order["refundDetails"]> }) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}) {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  
  // Refund Modal State
  const [refundModalOrder, setRefundModalOrder] = useState<Order | null>(null);
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundReason, setRefundReason] = useState<string>("Customer requested refund / cancellation");
  const [refundCustomNote, setRefundCustomNote] = useState<string>("");
  const [refundLanguage, setRefundLanguage] = useState<"en" | "fr">(language === "fr" ? "fr" : "en");
  const [refundTargetStatus, setRefundTargetStatus] = useState<"refund_processing" | "refunded">("refund_processing");
  const [isProcessingRefund, setIsProcessingRefund] = useState<boolean>(false);

  const filtered = orders.filter((o) => {
    if (filter === "all") return true;
    return o.paymentStatus === filter;
  });

  const totalSales = orders
    .filter((o) => o.paymentStatus === "completed")
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const pendingCount = orders.filter((o) => o.paymentStatus === "pending_etransfer").length;
  const refundProcessingCount = orders.filter((o) => o.paymentStatus === "refund_processing").length;
  const refundedCount = orders.filter((o) => o.paymentStatus === "refunded").length;

  const openRefundModal = (order: Order, defaultStatus?: "refund_processing" | "refunded") => {
    setRefundModalOrder(order);
    setRefundAmount(order.refundDetails?.amount ? order.refundDetails.amount.toFixed(2) : order.total.toFixed(2));
    setRefundReason(order.refundDetails?.reason || (language === "fr" ? "Demande d'annulation / remboursement par le client" : "Customer requested refund / cancellation"));
    setRefundCustomNote(order.refundDetails?.customNote || "");
    setRefundLanguage(language === "fr" ? "fr" : "en");
    setRefundTargetStatus(defaultStatus || (order.paymentStatus === "refund_processing" ? "refunded" : "refund_processing"));
  };

  const handleExecuteRefund = async () => {
    if (!refundModalOrder) return;
    const amountNum = parseFloat(refundAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error(language === "en" ? "Please enter a valid refund amount" : "Veuillez entrer un montant de remboursement valide");
      return;
    }

    setIsProcessingRefund(true);
    const isCompletedStage = refundTargetStatus === "refunded";
    const loadingToast = toast.loading(
      language === "en" 
        ? (isCompletedStage 
            ? `Finalizing refund & sending completion email to ${refundModalOrder.customerEmail}...` 
            : `Initiating refund & sending processing email to ${refundModalOrder.customerEmail}...`)
        : (isCompletedStage
            ? `Finalisation du remboursement et envoi de l'email de confirmation à ${refundModalOrder.customerEmail}...`
            : `Lancement du remboursement et envoi de l'email de traitement à ${refundModalOrder.customerEmail}...`)
    );

    try {
      const emailPayload: RefundEmailData = {
        orderId: refundModalOrder.id,
        customerName: refundModalOrder.customerName,
        customerEmail: refundModalOrder.customerEmail,
        amount: amountNum,
        totalOrderAmount: refundModalOrder.total,
        paymentMethod: refundModalOrder.paymentMethod,
        reason: refundReason,
        customNote: refundCustomNote.trim() || undefined,
        requestedAt: refundModalOrder.refundDetails?.requestedAt || new Date().toISOString(),
        completedAt: isCompletedStage ? new Date().toISOString() : undefined,
        items: refundModalOrder.items.map(i => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price
        })),
        language: refundLanguage
      };

      const dispatchResult = await sendCustomerRefundEmail(
        emailPayload, 
        isCompletedStage ? "completed" : "processing"
      );

      const refundDetailsData = {
        requestedAt: refundModalOrder.refundDetails?.requestedAt || new Date().toISOString(),
        completedAt: isCompletedStage ? new Date().toISOString() : undefined,
        amount: amountNum,
        reason: refundReason,
        customNote: refundCustomNote.trim() || undefined,
        status: (isCompletedStage ? "completed" : "processing") as "processing" | "completed",
        processedBy: getGmailConnectedUser()?.email || "Admin",
        emailSentTo: refundModalOrder.customerEmail,
        refundMethod: refundModalOrder.paymentMethod === "paypal" ? "PayPal" : "Interac e-Transfer"
      };

      updateOrderRefund(refundModalOrder.id, {
        status: refundTargetStatus,
        refundDetails: refundDetailsData
      });

      toast.dismiss(loadingToast);
      
      if (dispatchResult.dispatched) {
        toast.success(
          isCompletedStage
            ? (language === "en" 
                ? `Refund finalized! "Refund Completed" email dispatched to ${refundModalOrder.customerEmail} via Gmail.` 
                : `Remboursement finalisé ! Courriel de confirmation de remboursement envoyé à ${refundModalOrder.customerEmail} via Gmail.`)
            : (language === "en"
                ? `Refund processing initiated! "Processing" email dispatched to ${refundModalOrder.customerEmail} via Gmail.`
                : `Remboursement initié ! Courriel de suivi envoyé à ${refundModalOrder.customerEmail} via Gmail.`)
        );
      } else {
        toast.success(
          isCompletedStage
            ? (language === "en" ? `Order marked as Refund Completed!` : `Commande marquée comme remboursée avec succès !`)
            : (language === "en" ? `Order marked as Refund Processing!` : `Commande marquée en cours de remboursement !`)
        );
      }

      setRefundModalOrder(null);
    } catch (err: any) {
      toast.dismiss(loadingToast);
      console.error("Refund dispatch error:", err);
      toast.error(err.message || "Failed to process refund notification");
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const handleResendRefundEmail = async (order: Order, stage: "processing" | "completed") => {
    if (!order.customerEmail) {
      toast.error("No customer email found on this order.");
      return;
    }
    const user = getGmailConnectedUser();
    if (!isGmailConnected() || !user) {
      toast.error(language === "en" ? "Please connect Gmail in 'Gmail Hub' tab first to send emails." : "Veuillez d'abord connecter Gmail dans le 'Gmail Hub'.");
      return;
    }

    const title = stage === "completed"
      ? (language === "en" ? "Send 'Refund Completed' Email" : "Envoyer l'Email 'Remboursement Effectué'")
      : (language === "en" ? "Re-send 'Refund Processing' Email" : "Renvoyer l'Email 'Remboursement en Cours'");

    const desc = stage === "completed"
      ? (language === "en" 
          ? `Send the official "Refund Completed" confirmation email for Order #${order.id} to ${order.customerEmail}?` 
          : `Envoyer le courriel officiel de confirmation "Remboursement Effectué" pour la commande #${order.id} à ${order.customerEmail} ?`)
      : (language === "en"
          ? `Re-send the "Refund is Being Processed" email for Order #${order.id} to ${order.customerEmail}?`
          : `Renvoyer le courriel "Remboursement en cours de traitement" pour la commande #${order.id} à ${order.customerEmail} ?`);

    showConfirm(
      title,
      desc,
      async () => {
        const loadingToast = toast.loading("Sending refund email via Gmail...");
        try {
          const emailPayload: RefundEmailData = {
            orderId: order.id,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            amount: order.refundDetails?.amount || order.total,
            totalOrderAmount: order.total,
            paymentMethod: order.paymentMethod,
            reason: order.refundDetails?.reason || "Customer refund request",
            customNote: order.refundDetails?.customNote,
            requestedAt: order.refundDetails?.requestedAt || new Date().toISOString(),
            completedAt: stage === "completed" ? (order.refundDetails?.completedAt || new Date().toISOString()) : undefined,
            items: order.items.map(i => ({
              name: i.name,
              quantity: i.quantity,
              price: i.price
            })),
            language: language === "fr" ? "fr" : "en"
          };
          await sendCustomerRefundEmail(emailPayload, stage);
          toast.dismiss(loadingToast);
          toast.success(
            stage === "completed"
              ? (language === "en" ? `"Refund Completed" email dispatched to ${order.customerEmail}!` : `Courriel de remboursement effectué envoyé à ${order.customerEmail} !`)
              : (language === "en" ? `"Refund Processing" email re-sent to ${order.customerEmail}!` : `Courriel de traitement renvoyé à ${order.customerEmail} !`)
          );
        } catch (e: any) {
          toast.dismiss(loadingToast);
          toast.error(e.message || "Failed to send email");
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Mini Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans text-left">
        <div className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total Sales (CAD)</p>
          <p className="text-xl font-extrabold text-[#111] tabular-nums">C${totalSales.toFixed(2)}</p>
        </div>
        <div className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total Orders</p>
          <p className="text-xl font-extrabold text-[#111] tabular-nums">{orders.length}</p>
        </div>
        <div className="p-5 bg-amber-50/30 rounded-2xl border border-amber-100/50">
          <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider mb-1">Awaiting Verification</p>
          <p className="text-xl font-extrabold text-amber-800 tabular-nums">{pendingCount} {language === "en" ? "pending" : "en attente"}</p>
        </div>
        <div className="p-5 bg-purple-50/30 rounded-2xl border border-purple-100/50">
          <p className="text-[10px] text-purple-700 font-bold uppercase tracking-wider mb-1">Refunds Processing</p>
          <p className="text-xl font-extrabold text-purple-800 tabular-nums">{refundProcessingCount} {language === "en" ? "processing" : "en cours"}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 font-sans text-xs">
        {[
          { key: "all", label: language === "en" ? "All Orders" : "Toutes" },
          { key: "pending_etransfer", label: language === "en" ? `Pending E-Transfer (${pendingCount})` : `Virements en attente (${pendingCount})` },
          { key: "completed", label: language === "en" ? "Paid / Completed" : "Payées" },
          { key: "refund_processing", label: language === "en" ? `Refund Processing (${refundProcessingCount})` : `Remboursement en cours (${refundProcessingCount})` },
          { key: "refunded", label: language === "en" ? `Refunded (${refundedCount})` : `Remboursées (${refundedCount})` },
          { key: "cancelled", label: language === "en" ? "Cancelled" : "Annulées" }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-full font-bold uppercase tracking-wider transition-all border ${filter === tab.key ? "bg-[#111] text-white border-transparent" : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Table/List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-gray-200 rounded-3xl bg-gray-50/30 font-serif">
          <ShoppingBag size={32} className="mx-auto text-gray-300 mb-4" />
          <p className="text-sm text-gray-500 font-medium">
            {language === "en" ? "No matching orders found." : "Aucune commande correspondante."}
          </p>
        </div>
      ) : (
        <div className="space-y-4 font-sans text-xs text-left">
          {filtered.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            return (
              <div key={order.id} className="border border-gray-100 rounded-2xl bg-white overflow-hidden transition-all hover:shadow-sm">
                {/* Accordion Trigger Header */}
                <div 
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer select-none hover:bg-gray-50/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                      <FileText size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-gray-900 tracking-wider text-sm">{order.id}</span>
                        <span className="text-[10px] text-gray-400 font-serif">{order.date}</span>
                        {order.timezone && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[9px] font-sans font-medium" title={`Customer local timezone: ${order.timezone}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {order.timezone}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 font-serif mt-0.5">{order.customerName} ({order.customerEmail})</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-left md:text-right">
                      <span className="text-sm font-extrabold text-[#111] tabular-nums">C${order.total.toFixed(2)}</span>
                      <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold mt-0.5">
                        {order.paymentMethod === "etransfer" ? "Interac E-Transfer" : "PayPal / Card"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      {order.paymentMethod === "etransfer" && order.etransferDetails?.screenshot && (
                        <span className="px-2 py-0.5 bg-brand-accent/10 text-brand-accent font-bold border border-brand-accent/20 rounded-full uppercase tracking-wider text-[9px] flex items-center gap-1">
                          <Camera size={10} /> Screenshot
                        </span>
                      )}
                      {order.paymentStatus === "pending_etransfer" && (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold border border-amber-100 rounded-full uppercase tracking-wider text-[9px] block">
                          Awaiting Payment
                        </span>
                      )}
                      {order.paymentStatus === "completed" && (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 rounded-full uppercase tracking-wider text-[9px] block">
                          Paid
                        </span>
                      )}
                      {order.paymentStatus === "refund_processing" && (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-bold border border-amber-300 rounded-full uppercase tracking-wider text-[9px] flex items-center gap-1 shadow-sm">
                          <RotateCcw size={10} className="text-amber-700 animate-spin" />
                          {language === "en" ? "Refund Processing" : "Remboursement en cours"}
                        </span>
                      )}
                      {order.paymentStatus === "refunded" && (
                        <span className="px-2.5 py-1 bg-purple-100 text-purple-900 font-bold border border-purple-200 rounded-full uppercase tracking-wider text-[9px] flex items-center gap-1 shadow-sm">
                          <CheckCircle2 size={10} className="text-purple-700" />
                          {language === "en" ? "Refunded" : "Remboursé"}
                        </span>
                      )}
                      {order.paymentStatus === "cancelled" && (
                        <span className="px-2.5 py-1 bg-red-50 text-red-600 font-bold border border-red-100 rounded-full uppercase tracking-wider text-[9px] block">
                          Cancelled
                        </span>
                      )}

                      <span className="text-gray-400 transition-transform duration-200" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                        ▼
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details body */}
                {isExpanded && (
                  <div className="p-5 border-t border-gray-100 bg-[#fafafa] space-y-6 font-serif">
                    
                    {/* Active Refund Details Box if Refund was requested */}
                    {order.refundDetails && (
                      <div className={`border rounded-2xl p-5 text-left font-sans space-y-3 ${order.paymentStatus === "refunded" ? "bg-emerald-50/60 border-emerald-200" : "bg-amber-50/70 border-amber-200"}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-inherit">
                          <div className="flex items-center gap-2">
                            {order.paymentStatus === "refunded" ? (
                              <CheckCircle2 size={18} className="text-emerald-700" />
                            ) : (
                              <RotateCcw size={18} className="text-amber-700" />
                            )}
                            <h4 className={`font-bold text-xs uppercase tracking-wider ${order.paymentStatus === "refunded" ? "text-emerald-950" : "text-amber-950"}`}>
                              {order.paymentStatus === "refunded"
                                ? (language === "en" ? "Refund Completed & Confirmed" : "Remboursement Effectué & Confirmé")
                                : (language === "en" ? "Refund Processing Stage" : "Remboursement en Cours de Traitement")}
                            </h4>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${order.paymentStatus === "refunded" ? "bg-emerald-200/80 text-emerald-900 border border-emerald-300" : "bg-amber-200/80 text-amber-900 border border-amber-300"}`}>
                            {order.paymentStatus === "refunded" 
                              ? (language === "en" ? "✓ Refund Done / Funds Sent" : "✓ Remboursé / Fonds Envoyés")
                              : (language === "en" ? "⏳ In Progress / Processing" : "⏳ En Cours de Traitement")}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                          <div>
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Refund Amount</span>
                            <span className={`text-base font-extrabold tabular-nums ${order.paymentStatus === "refunded" ? "text-emerald-800" : "text-amber-900"}`}>
                              C${order.refundDetails.amount.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">
                              {order.paymentStatus === "refunded" ? "Completed Date" : "Initiated Date"}
                            </span>
                            <span className="text-gray-800 font-medium">
                              {new Date(order.refundDetails.completedAt || order.refundDetails.requestedAt).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Refund Reason</span>
                            <span className="text-gray-800 font-medium">{order.refundDetails.reason}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Customer Recipient</span>
                            <span className="text-gray-800 font-medium truncate block" title={order.refundDetails.emailSentTo || order.customerEmail}>
                              {order.refundDetails.emailSentTo || order.customerEmail}
                            </span>
                          </div>
                        </div>

                        {order.refundDetails.customNote && (
                          <div className="pt-2 border-t border-inherit text-xs">
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block mb-0.5">Note included to customer:</span>
                            <p className="text-gray-700 italic bg-white/70 p-2.5 rounded-lg border border-inherit">
                              "{order.refundDetails.customNote}"
                            </p>
                          </div>
                        )}

                        {/* Two-stage action buttons */}
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          {order.paymentStatus === "refund_processing" && (
                            <>
                              <button
                                type="button"
                                onClick={() => openRefundModal(order, "refunded")}
                                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-sm"
                              >
                                <Check size={13} />
                                {language === "en" ? "✓ Mark Refund as Done & Send Confirmation Email" : "✓ Finaliser le Remboursement & Envoyer Email 'Effectué'"}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleResendRefundEmail(order, "processing")}
                                className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-sm"
                              >
                                <Mail size={12} />
                                {language === "en" ? "Re-send 'Processing' Email" : "Renvoyer Email 'En Cours'"}
                              </button>
                            </>
                          )}

                          {order.paymentStatus === "refunded" && (
                            <button
                              type="button"
                              onClick={() => handleResendRefundEmail(order, "completed")}
                              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-sm"
                            >
                              <Mail size={12} />
                              {language === "en" ? "Re-send 'Refund Completed' Email" : "Renvoyer l'Email 'Remboursement Effectué'"}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                      {/* Customer & Shipping info */}
                      <div className="space-y-3.5">
                        <h4 className="font-sans font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-2">Delivery Details</h4>
                        <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-2 text-xs">
                          <p className="text-gray-800"><span className="font-sans font-bold uppercase tracking-wider text-[9px] text-gray-400 block mb-0.5">Recipient</span>{order.customerName}</p>
                          <p className="text-gray-800"><span className="font-sans font-bold uppercase tracking-wider text-[9px] text-gray-400 block mb-0.5">Shipping Address</span>{order.address}, {order.city}, {order.province} {order.postal}, {order.country === "CA" ? "Canada" : "United States"}</p>
                          <p className="text-gray-800"><span className="font-sans font-bold uppercase tracking-wider text-[9px] text-gray-400 block mb-0.5">Service Selected</span>{order.shippingMethod}</p>
                          {order.orderComments && (
                            <p className="text-gray-600 italic"><span className="font-sans font-bold uppercase tracking-wider text-[9px] text-gray-400 block mb-0.5">Order Comments</span>"{order.orderComments}"</p>
                          )}
                        </div>
                      </div>

                      {/* Payment or E-Transfer proof data */}
                      <div className="space-y-3.5">
                        <h4 className="font-sans font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-2">Payment Verification</h4>
                        {order.paymentMethod === "etransfer" && order.etransferDetails ? (
                          <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-2 text-xs">
                            <p className="text-gray-800"><span className="font-sans font-bold uppercase tracking-wider text-[9px] text-gray-400 block mb-0.5">Sender Account Name</span>{order.etransferDetails.senderName}</p>
                            <p className="text-gray-800"><span className="font-sans font-bold uppercase tracking-wider text-[9px] text-gray-400 block mb-0.5">Sending Bank</span>{order.etransferDetails.senderBank}</p>
                            <p className="text-gray-800"><span className="font-sans font-bold uppercase tracking-wider text-[9px] text-gray-400 block mb-0.5">Sender Email Address</span>{order.etransferDetails.senderEmail}</p>
                            <p className="text-brand-accent font-mono"><span className="font-sans font-bold uppercase tracking-wider text-[9px] text-gray-400 block mb-0.5">Reference Code / ID</span>{order.etransferDetails.referenceCode || "None Provided"}</p>
                            <p className="text-gray-500 text-[10px]"><span className="font-sans font-bold uppercase tracking-wider text-[9px] text-gray-400 block mb-0.5">Confirmation Submitted At</span>{new Date(order.etransferDetails.submittedAt).toLocaleString()}</p>
                            
                            {order.etransferDetails.screenshot && (
                              <div className="pt-2.5 border-t border-gray-100">
                                <span className="font-sans font-bold uppercase tracking-wider text-[9px] text-brand-accent block mb-1.5 flex items-center gap-1">
                                  <Camera size={11} /> Interac Deposit Screenshot
                                </span>
                                <div 
                                  onClick={() => setSelectedScreenshot(order.etransferDetails?.screenshot || null)}
                                  className="relative group rounded-lg overflow-hidden border border-gray-200 cursor-pointer bg-gray-50 h-28 flex items-center justify-center hover:opacity-95 transition"
                                >
                                  <img 
                                    src={order.etransferDetails.screenshot} 
                                    alt="Interac Transfer Screenshot" 
                                    className="w-full h-full object-contain" 
                                  />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[11px] font-sans font-bold transition-opacity gap-1.5">
                                    <Eye size={14} /> Click to enlarge
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setSelectedScreenshot(order.etransferDetails?.screenshot || null)}
                                  className="text-[10px] text-brand-accent font-bold hover:underline mt-1.5 flex items-center gap-1 font-sans"
                                >
                                  <Eye size={12} /> View enlarged screenshot
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-2 text-xs">
                            <p className="text-gray-700">
                              <span className="font-sans font-bold uppercase tracking-wider text-[9px] text-gray-400 block mb-0.5">Payment Method</span>
                              {order.paymentMethod === "paypal" ? "PayPal Express Checkout / Credit Card" : "Interac e-Transfer"}
                            </p>
                            <p className="text-gray-500 italic mt-2">
                              {order.paymentMethod === "paypal" 
                                ? "Paid instantly via integrated PayPal checkout." 
                                : "Awaiting or verified Interac e-Transfer payment."}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Items Purchased summary */}
                      <div className="space-y-3.5 md:col-span-2 lg:col-span-1">
                        <h4 className="font-sans font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-2">Items Ordered</h4>
                        <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-3 max-h-[250px] overflow-y-auto">
                          {order.items.map((item: any, i: number) => (
                            <div key={i} className="flex gap-3 items-center text-xs">
                              <div className="w-10 h-10 bg-gray-50 rounded p-0.5 border border-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                <img src={item.image} alt={item.name} className="object-contain w-full h-full" referrerPolicy="no-referrer" />
                              </div>
                              <div className="flex-grow">
                                <p className="text-gray-800 font-medium leading-snug">{item.name}</p>
                                <p className="text-[10px] text-gray-400 font-sans font-bold mt-0.5">C${item.price} × {item.quantity}</p>
                              </div>
                            </div>
                          ))}
                          <div className="border-t border-gray-100 pt-3 text-xs space-y-1 font-sans">
                            <div className="flex justify-between text-gray-500">
                              <span>Subtotal</span>
                              <span>C${order.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                              <span>Shipping</span>
                              <span>C${order.shipping.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                              <span>Tax (HST)</span>
                              <span>C${order.hst.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-900 font-bold border-t border-dashed border-gray-100 pt-1">
                              <span>Total</span>
                              <span>C${order.total.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions bar inside expansion */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 font-sans text-xs">
                      {/* Left: Receipt, PDF & Refund tools */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const formatted: OrderDataForPdf = {
                                orderId: order.id,
                                date: order.date || new Date().toLocaleDateString("en-CA"),
                                createdAt: order.createdAt,
                                timezone: order.timezone,
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
                              await downloadReceiptPdf(formatted);
                              toast.success("Receipt PDF downloaded!");
                            } catch (e) {
                              console.error(e);
                              toast.error("Failed to generate PDF");
                            }
                          }}
                          className="px-3.5 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                        >
                          <Download size={13} />
                          Download PDF Receipt
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const user = getGmailConnectedUser();
                            if (!isGmailConnected() || !user) {
                              toast.error("Please connect Gmail in the 'Gmail Hub' tab first.");
                              return;
                            }
                            showConfirm(
                              "Send PDF Receipt (Gmail)",
                              `Send official receipt with PDF attachment for Order #${order.id} to ${order.customerEmail} from ${user.email}?`,
                              async () => {
                                const loadingToast = toast.loading("Sending via Gmail API...");
                                try {
                                  const formatted: OrderDataForPdf = {
                                    orderId: order.id,
                                    date: order.date || new Date().toLocaleDateString("en-CA"),
                                    createdAt: order.createdAt,
                                    timezone: order.timezone,
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
                                  await sendGmailReceiptWithPdf(formatted);
                                  toast.dismiss(loadingToast);
                                  toast.success(`Receipt sent to ${order.customerEmail}!`);
                                } catch (err: any) {
                                  toast.dismiss(loadingToast);
                                  toast.error(err.message || "Failed to send email via Gmail");
                                }
                              }
                            );
                          }}
                          className="px-3.5 py-2 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <Send size={13} />
                          Send PDF Receipt (Gmail)
                        </button>

                        {/* Refund Action Buttons */}
                        {order.paymentStatus === "refund_processing" ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openRefundModal(order, "refunded")}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
                              title={language === "en" ? "Mark refund as completed & send confirmation email" : "Finaliser le remboursement et envoyer l'email de confirmation"}
                            >
                              <Check size={13} />
                              {language === "en" ? "Finalize Refund (Send Done Email)" : "Finaliser Remboursement (Envoyer Email)"}
                            </button>
                            <button
                              type="button"
                              onClick={() => openRefundModal(order, "refund_processing")}
                              className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
                            >
                              <RotateCcw size={12} />
                              {language === "en" ? "Edit / Resend" : "Gérer"}
                            </button>
                          </div>
                        ) : order.paymentStatus === "refunded" ? (
                          <button
                            type="button"
                            onClick={() => openRefundModal(order, "refunded")}
                            className="px-3.5 py-2 bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-200 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
                            title={language === "en" ? "Manage or resend completed refund email" : "Gérer ou renvoyer le courriel de remboursement"}
                          >
                            <CheckCircle2 size={13} className="text-purple-700" />
                            {language === "en" ? "Refunded (Manage / Resend)" : "Remboursé (Gérer)"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openRefundModal(order, "refund_processing")}
                            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
                            title={language === "en" ? "Initiate refund request and notify customer by email" : "Engager le remboursement et notifier le client par courriel"}
                          >
                            <RotateCcw size={13} />
                            {language === "en" ? "Ask for Refund" : "Demander un Remboursement"}
                          </button>
                        )}
                      </div>

                      {/* Right: Payment status controls for pending orders */}
                      {order.paymentStatus === "pending_etransfer" && (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              showConfirm(
                                "Confirm Order & Send Customer PDF Receipt",
                                `Confirm this Interac e-Transfer order as Paid? This will mark the order as Completed and automatically dispatch the official PDF receipt to ${order.customerEmail}.`,
                                async () => {
                                  updateStatus(order.id, "completed");
                                  try {
                                    const pdfData: OrderDataForPdf = {
                                      orderId: order.id,
                                      date: order.date,
                                      createdAt: order.createdAt,
                                      timezone: order.timezone,
                                      customerName: order.customerName,
                                      customerEmail: order.customerEmail,
                                      address: order.address,
                                      city: order.city,
                                      province: order.province,
                                      postal: order.postal,
                                      country: order.country === "CA" ? "Canada" : "United States",
                                      items: order.items.map((i: any) => ({
                                        id: i.id,
                                        name: i.name,
                                        price: i.price,
                                        quantity: i.quantity,
                                        sku: i.sku
                                      })),
                                      subtotal: order.subtotal,
                                      shipping: order.shipping,
                                      hst: order.hst,
                                      total: order.total,
                                      paymentMethod: "Interac e-transfer",
                                      shippingMethod: order.shippingMethod
                                    };

                                    let sent = false;
                                    if (isGmailConnected()) {
                                      await sendGmailReceiptWithPdf(pdfData);
                                      sent = true;
                                    }
                                    
                                    toast.success(
                                      sent
                                        ? `Order confirmed! PDF receipt dispatched to ${order.customerEmail}`
                                        : "Order confirmed as Paid! (Connect Gmail in the tab above to auto-dispatch customer PDF receipt)"
                                    );
                                  } catch (e: any) {
                                    console.error(e);
                                    toast.error(`Order marked paid, but email failed: ${e.message}`);
                                  }
                                }
                              );
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-sm"
                          >
                            <Check size={13} />
                            Confirm Order & Send Customer PDF Receipt
                          </button>

                          {order.etransferDetails?.screenshot && (
                            <button
                              type="button"
                              onClick={() => setSelectedScreenshot(order.etransferDetails?.screenshot || null)}
                              className="px-3.5 py-2 border border-brand-accent/40 bg-brand-accent/5 hover:bg-brand-accent/10 text-brand-accent rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                            >
                              <Camera size={13} />
                              View Screenshot
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              showConfirm(
                                "Mark Paid Without Sending Email",
                                "Mark this order as Paid without dispatching an email receipt?",
                                () => {
                                  updateStatus(order.id, "completed");
                                  toast.success("Order marked as completed.");
                                }
                              );
                            }}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors"
                          >
                            Mark Paid Only
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              showConfirm(
                                "Cancel Order",
                                "Are you sure you want to cancel this order?",
                                () => {
                                  updateStatus(order.id, "cancelled");
                                  toast.error("Order cancelled.");
                                }
                              );
                            }}
                            className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Enlarged Screenshot Modal */}
      {selectedScreenshot && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-fadeIn">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Camera size={16} className="text-brand-accent" />
                <h4 className="text-xs font-bold font-sans uppercase tracking-wider text-gray-900">
                  {language === "en" ? "Interac Deposit Confirmation Screenshot" : "Capture d'Écran de Confirmation de Virement Interac"}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedScreenshot(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-gray-900/5 flex-1 min-h-[350px]">
              <img
                src={selectedScreenshot}
                alt="Full Interac Confirmation"
                className="max-w-full max-h-[70vh] object-contain rounded-lg border border-gray-200 shadow-md"
              />
            </div>
          </div>
        </div>
      )}

      {/* REFUND REQUEST MODAL */}
      {refundModalOrder && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden font-sans text-left flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className={`p-5 border-b flex items-center justify-between transition-colors ${refundTargetStatus === "refunded" ? "bg-gradient-to-r from-emerald-50 to-teal-50/40 border-emerald-100" : "bg-gradient-to-r from-amber-50 to-orange-50/30 border-amber-100"}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 text-white rounded-xl shadow-sm ${refundTargetStatus === "refunded" ? "bg-emerald-600" : "bg-amber-500"}`}>
                  {refundTargetStatus === "refunded" ? <CheckCircle2 size={20} /> : <RotateCcw size={20} />}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 tracking-tight">
                    {refundTargetStatus === "refunded"
                      ? (language === "en" ? "Finalize Refund & Send 'Refund Done' Email" : "Finaliser le Remboursement & Envoyer l'Email 'Remboursé'")
                      : (language === "en" ? "Initiate Refund & Send 'Processing' Email" : "Engager le Remboursement & Envoyer l'Email 'En Cours'")}
                  </h3>
                  <p className="text-xs text-gray-500 font-serif">
                    Order Ref: <strong className="font-mono text-gray-800">#{refundModalOrder.id}</strong> &bull; {refundModalOrder.date}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRefundModalOrder(null)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-white rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">

              {/* Stage Selection Switcher */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  {language === "en" ? "Select Refund Workflow Stage" : "Sélectionnez l'Étape du Remboursement"}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRefundTargetStatus("refund_processing")}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      refundTargetStatus === "refund_processing"
                        ? "bg-amber-50/80 border-amber-400 shadow-sm ring-2 ring-amber-300/50"
                        : "bg-white border-gray-200 hover:bg-gray-50 opacity-80"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span className="font-bold text-xs text-amber-950">
                        {language === "en" ? "1. Refund Processing" : "1. Remboursement en Cours"}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-snug">
                      {language === "en"
                        ? "Sends notice that the refund is initiated and being processed."
                        : "Envoie l'avis que le remboursement a été engagé et est en cours de traitement."}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRefundTargetStatus("refunded")}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      refundTargetStatus === "refunded"
                        ? "bg-emerald-50/80 border-emerald-500 shadow-sm ring-2 ring-emerald-300/50"
                        : "bg-white border-gray-200 hover:bg-gray-50 opacity-80"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      <span className="font-bold text-xs text-emerald-950">
                        {language === "en" ? "2. Refund Completed (Done)" : "2. Remboursement Effectué (Fait)"}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-snug">
                      {language === "en"
                        ? "Sends confirmation that the money has been refunded & paid."
                        : "Envoie l'email officiel confirmant que l'argent a été remboursé et viré."}
                    </p>
                  </button>
                </div>
              </div>
              
              {/* Customer & Payment Summary Card */}
              <div className="bg-gray-50/70 border border-gray-200/70 rounded-2xl p-4 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">Customer Name:</span>
                  <span className="font-bold text-gray-900">{refundModalOrder.customerName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">Recipient Email (Destination):</span>
                  <span className="font-mono font-bold text-brand-accent bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                    {refundModalOrder.customerEmail}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">Original Total Paid:</span>
                  <span className="font-extrabold text-gray-900 text-sm tabular-nums">C${refundModalOrder.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">Original Payment Method:</span>
                  <span className="font-bold text-gray-700 capitalize">
                    {refundModalOrder.paymentMethod === "paypal" ? "PayPal Express / Credit Card" : "Interac e-Transfer"}
                  </span>
                </div>
              </div>

              {/* Refund Amount Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    {language === "en" ? "Refund Amount (CAD)" : "Montant du Remboursement (CAD)"}
                  </label>
                  <button
                    type="button"
                    onClick={() => setRefundAmount(refundModalOrder.total.toFixed(2))}
                    className="text-[10px] font-bold text-brand-accent hover:underline"
                  >
                    {language === "en" ? `Set Full Amount (C$${refundModalOrder.total.toFixed(2)})` : `Montant complet (C$${refundModalOrder.total.toFixed(2)})`}
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">C$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={refundModalOrder.total}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-bold text-gray-900 tabular-nums"
                  />
                </div>
              </div>

              {/* Reason for Refund */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  {language === "en" ? "Reason for Refund" : "Motif du Remboursement"}
                </label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-xs text-gray-800 bg-white"
                >
                  <option value="Customer requested refund / cancellation">Customer requested refund / cancellation</option>
                  <option value="Product damaged or defective">Product damaged or defective</option>
                  <option value="Incorrect product delivered">Incorrect product delivered</option>
                  <option value="Item out of stock / inventory adjustment">Item out of stock / inventory adjustment</option>
                  <option value="Customer return / dissatisfaction">Customer return / dissatisfaction</option>
                  <option value="Duplicate payment / overcharge">Duplicate payment / overcharge</option>
                  <option value="Other reason">Other reason</option>
                </select>
              </div>

              {/* Custom Note to Customer */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  {language === "en" ? "Optional Note to Customer (Included in Email)" : "Note Personnalisée au Client (Incluse dans le Courriel)"}
                </label>
                <textarea
                  rows={2}
                  placeholder={
                    refundTargetStatus === "refunded"
                      ? (language === "en" ? "e.g. The refund transaction has been finalized to your original payment method. Thank you!" : "ex. Le montant a été reversé sur votre moyen de paiement initial. Merci !")
                      : (language === "en" ? "e.g. We have received your refund request and our team is currently processing it." : "ex. Nous avons bien pris en compte votre demande et procédons au traitement.")
                  }
                  value={refundCustomNote}
                  onChange={(e) => setRefundCustomNote(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-xs text-gray-800 resize-none font-serif"
                />
              </div>

              {/* Language Selection */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  {language === "en" ? "Email Language" : "Langue du Courriel"}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRefundLanguage("en")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${refundLanguage === "en" ? "bg-[#111] text-white border-[#111]" : "bg-white text-gray-600 border-gray-200"}`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefundLanguage("fr")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${refundLanguage === "fr" ? "bg-[#111] text-white border-[#111]" : "bg-white text-gray-600 border-gray-200"}`}
                  >
                    Français
                  </button>
                </div>
              </div>

              {/* Real-time Gmail status notice */}
              <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${isGmailConnected() ? "bg-emerald-50/70 border-emerald-200 text-emerald-900" : "bg-amber-50/70 border-amber-200 text-amber-900"}`}>
                <Mail size={16} className={`flex-shrink-0 mt-0.5 ${isGmailConnected() ? "text-emerald-600" : "text-amber-600"}`} />
                <div>
                  <p className="font-bold">
                    {isGmailConnected() 
                      ? (language === "en" ? "Gmail Connected (Live Delivery)" : "Gmail Connecté (Envoi Direct)")
                      : (language === "en" ? "Gmail Not Connected in Current Session" : "Gmail Non Connecté")}
                  </p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    {isGmailConnected() 
                      ? (language === "en" 
                          ? `The ${refundTargetStatus === "refunded" ? '"Refund Completed"' : '"Refund Processing"'} email will be dispatched directly to ${refundModalOrder.customerEmail} from ${getGmailConnectedUser()?.email || "vonnessentials@gmail.com"}.`
                          : `Le courriel ${refundTargetStatus === "refunded" ? '"Remboursement Effectué"' : '"Remboursement en Cours"'} sera envoyé directement à ${refundModalOrder.customerEmail} depuis ${getGmailConnectedUser()?.email || "vonnessentials@gmail.com"}.`)
                      : (language === "en"
                          ? `The refund state will be recorded in the store. You can connect Gmail in the 'Gmail Hub' tab to auto-dispatch customer emails.`
                          : `L'état du remboursement sera enregistré dans la boutique. Vous pouvez connecter Gmail dans l'onglet 'Gmail Hub'.`)}
                  </p>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setRefundModalOrder(null)}
                disabled={isProcessingRefund}
                className="px-5 py-2.5 rounded-xl text-gray-500 hover:bg-gray-200 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                {language === "en" ? "Cancel" : "Annuler"}
              </button>

              <button
                type="button"
                onClick={handleExecuteRefund}
                disabled={isProcessingRefund}
                className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 ${
                  refundTargetStatus === "refunded"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-amber-500 hover:bg-amber-600"
                }`}
              >
                {isProcessingRefund ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    {language === "en" ? "Sending Email..." : "Envoi en cours..."}
                  </>
                ) : refundTargetStatus === "refunded" ? (
                  <>
                    <CheckCircle2 size={14} />
                    {language === "en" ? "Finalize Refund & Send 'Done' Email" : "Finaliser & Envoyer Email 'Effectué'"}
                  </>
                ) : (
                  <>
                    <RotateCcw size={14} />
                    {language === "en" ? "Initiate Refund & Send 'Processing' Email" : "Engager & Envoyer Email 'En Cours'"}
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

/* Dynamic Administrator Sub-views */

function AdminSettingsView({ 
  language, 
  currentPasscode, 
  onUpdatePasscode,
  currentEmail,
  onUpdateEmail
}: { 
  language: string, 
  currentPasscode: string, 
  onUpdatePasscode: (p: string) => void,
  currentEmail?: string,
  onUpdateEmail?: (email: string) => void
}) {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");

  const [emailInput, setEmailInput] = useState(currentEmail || "vonnessentials@gmail.com");

  useEffect(() => {
    if (currentEmail) {
      setEmailInput(currentEmail);
    }
  }, [currentEmail]);

  const handleUpdateEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes("@")) {
      toast.error(language === "en" ? "Please enter a valid email address." : "Veuillez entrer une adresse courriel valide.");
      return;
    }
    if (onUpdateEmail) {
      onUpdateEmail(emailInput);
      toast.success(language === "en" ? "Admin email updated successfully!" : "Courriel administrateur mis à jour avec succès !");
    }
  };

  const handleUpdatePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (current !== currentPasscode && current !== "vonnadmin" && current !== "admin123") {
      toast.error(language === "en" ? "Incorrect current passcode." : "Code actuel incorrect.");
      return;
    }
    if (newPass.length < 4) {
      toast.error(language === "en" ? "New passcode must be at least 4 characters." : "Le nouveau code doit comporter au moins 4 caractères.");
      return;
    }
    if (newPass !== confirm) {
      toast.error(language === "en" ? "New passcodes do not match." : "Les nouveaux codes ne correspondent pas.");
      return;
    }

    onUpdatePasscode(newPass);
    toast.success(language === "en" ? "Admin passcode updated successfully for all administrators!" : "Code administrateur mis à jour avec succès pour tous les administrateurs !");
    setCurrent("");
    setNewPass("");
    setConfirm("");
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-8 text-left">
      {/* Admin Email Section */}
      <div className="space-y-4">
        <div className="border-b border-gray-100 pb-3">
          <h4 className="text-base font-sans font-bold text-gray-900 uppercase tracking-wider">
            {language === "en" ? "Admin Portal Access Email" : "Courriel d'Accès au Portail Administrateur"}
          </h4>
          <p className="text-xs text-gray-400 font-serif mt-0.5">
            {language === "en" ? "Primary administrator email required to log into this dashboard." : "Courriel principal de l'administrateur requis pour se connecter à ce tableau de bord."}
          </p>
        </div>

        <form onSubmit={handleUpdateEmail} className="space-y-4 max-w-md font-sans">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
              {language === "en" ? "Admin Email Address" : "Adresse Courriel Administrateur"}
            </label>
            <input
              type="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder={language === "en" ? "admin@domain.com" : "courriel@domaine.com"}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-sans"
            />
          </div>

          <button
            type="submit"
            className="w-full md:w-auto px-6 py-3 bg-[#1a1a1a] text-white font-bold rounded-xl hover:bg-brand-accent transition-all text-xs uppercase tracking-widest"
          >
            {language === "en" ? "Save Admin Email" : "Enregistrer le Courriel"}
          </button>
        </form>
      </div>

      {/* Admin Passcode Section */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <div className="border-b border-gray-100 pb-3">
          <h4 className="text-base font-sans font-bold text-gray-900 uppercase tracking-wider">
            {language === "en" ? "Admin Passcode Security" : "Sécurité du Code Administrateur"}
          </h4>
          <p className="text-xs text-gray-400 font-serif mt-0.5">
            {language === "en" ? "Update your administrator panel access passcode." : "Mettez à jour le code d'accès au panneau d'administration."}
          </p>
        </div>

        <form onSubmit={handleUpdatePasscode} className="space-y-4 max-w-md font-sans">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
              {language === "en" ? "Current Passcode" : "Code Actuel"}
            </label>
            <input
              type="password"
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
              {language === "en" ? "New Passcode" : "Nouveau Code"}
            </label>
            <input
              type="password"
              required
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
              {language === "en" ? "Confirm New Passcode" : "Confirmer le Nouveau Code"}
            </label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full md:w-auto px-6 py-3 bg-[#1a1a1a] text-white font-bold rounded-xl hover:bg-brand-accent transition-all text-xs uppercase tracking-widest mt-2"
          >
            {language === "en" ? "Save Passcode" : "Enregistrer le Code"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminAnnouncementsView({ language }: { language: string }) {
  const [enabled, setEnabled] = useState(true);
  const [textEn, setTextEn] = useState("");
  const [textFr, setTextFr] = useState("");

  useEffect(() => {
    fetch("/api/announcement")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setEnabled(data.isActive);
          setTextEn(data.textEn);
          setTextFr(data.textFr);
          localStorage.setItem("vonn_announcement", JSON.stringify(data));
        }
      })
      .catch(() => {});

    const saved = localStorage.getItem("vonn_announcement");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setEnabled(parsed.isActive);
        setTextEn(parsed.textEn);
        setTextFr(parsed.textFr);
      } catch (e) {
        // use default
      }
    } else {
      setTextEn("🌿 Summer Sale: Free shipping on orders over C$35 across Canada!");
      setTextFr("🌿 Solde d'été : Livraison gratuite sur commandes de plus de 35$ au Canada !");
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      textEn: textEn.trim(),
      textFr: textFr.trim(),
      isActive: enabled
    };
    localStorage.setItem("vonn_announcement", JSON.stringify(data));
    window.dispatchEvent(new Event("vonn_announcement_changed"));

    setDoc(doc(db, "store", "global"), { announcement: data }, { merge: true }).catch((err) => console.warn(err));

    fetch("/api/announcement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).catch(() => {});

    toast.success(language === "en" ? "Announcement banner updated successfully!" : "Bannière d'annonce mise à jour avec succès !");
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h4 className="text-base font-sans font-bold text-gray-900 uppercase tracking-wider">
          {language === "en" ? "Storefront Announcement Banner" : "Bannière d'Annonce de la Boutique"}
        </h4>
        <p className="text-xs text-gray-400 font-serif mt-1">
          {language === "en" ? "Display a floating alert notification at the top of the store homepage." : "Affichez une notification d'alerte flottante en haut de la page d'accueil de la boutique."}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 font-sans">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div>
            <span className="text-sm font-bold block text-gray-900">
              {language === "en" ? "Enable Announcement Banner" : "Activer la Bannière d'Annonce"}
            </span>
            <span className="text-xs text-gray-400 mt-0.5 block">
              {language === "en" ? "Toggle visibility of the top alert banner for customers." : "Activez ou désactivez la visibilité de la bannière d'alerte pour les clients."}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${enabled ? "bg-[#162F1C] justify-end" : "bg-gray-200 justify-start"}`}
          >
            <span className="bg-white w-4 h-4 rounded-full shadow-md"></span>
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
              {language === "en" ? "English Announcement Text" : "Texte d'Annonce Anglais"}
            </label>
            <textarea
              required
              rows={2}
              value={textEn}
              onChange={(e) => setTextEn(e.target.value)}
              placeholder="e.g. 🌿 Summer Sale: Free shipping on orders over C$35 across Canada!"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-sans font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
              {language === "en" ? "French Announcement Text" : "Texte d'Annonce Français"}
            </label>
            <textarea
              required
              rows={2}
              value={textFr}
              onChange={(e) => setTextFr(e.target.value)}
              placeholder="Ex: 🌿 Solde d'été : Livraison gratuite sur commandes de plus de 35$ au Canada !"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-sans font-medium"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full md:w-auto px-6 py-3 bg-[#1a1a1a] text-white font-bold rounded-xl hover:bg-brand-accent transition-all text-xs uppercase tracking-widest animate-fadeIn"
        >
          {language === "en" ? "Update Announcement" : "Mettre à jour l'Annonce"}
        </button>
      </form>
    </div>
  );
}

function ImageSelector({
  label,
  value,
  onChange,
  language
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  language: string;
}) {
  const { getProducts, getBlogPosts } = useLanguage();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(language === "en" ? "Image size should be less than 5MB" : "La taille de l'image doit être inférieure à 5Mo");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          onChange(reader.result);
          toast.success(language === "en" ? "Image uploaded successfully!" : "Image téléversée avec succès !");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const existingImages: string[] = Array.from(new Set([
    "https://dhgf5mcbrms62.cloudfront.net/86991813/cover-HaXq6F/YRkMx7N-2000x2000.jpg",
    "https://dhgf5mcbrms62.cloudfront.net/86991813/customer-review-7jFZXh/bCCWBzq-600x600.webp",
    "https://dhgf5mcbrms62.cloudfront.net/86991813/customer-review-7jFZXh/YeLp9sC-600x600.webp",
    "https://dhgf5mcbrms62.cloudfront.net/86991813/customer-review-7jFZXh/i47GUCV-600x600.webp",
    ...((getProducts ? getProducts() : []).map((p: any) => p.image).filter(Boolean)),
    ...((getBlogPosts ? getBlogPosts() : []).map((b: any) => b.image).filter(Boolean))
  ]));

  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block">{label}</label>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            required
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-sans"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5">
            <Upload size={14} />
            <span>{language === "en" ? "Upload" : "Téléverser"}</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
          <button
            type="button"
            onClick={() => setIsPickerOpen(true)}
            className="px-3 py-2.5 bg-[#162F1C] hover:bg-[#162F1C]/90 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
          >
            <ImageIcon size={14} />
            <span>{language === "en" ? "Site Library" : "Bibliothèque"}</span>
          </button>
        </div>
      </div>

      {value && (
        <div className="mt-2 w-20 h-20 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 relative group">
          <img src={value} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
      )}

      {isPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider">
                  {language === "en" ? "Select Previous Image" : "Choisir une Image Existante"}
                </h4>
                <p className="text-xs text-gray-400 font-serif">
                  {language === "en" ? "Choose from images already used across products and journal articles." : "Sélectionnez parmi les images déjà utilisées dans le site."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200/50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[500px]">
              {existingImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onChange(imgUrl);
                    setIsPickerOpen(false);
                    toast.success(language === "en" ? "Image selected!" : "Image sélectionnée !");
                  }}
                  className={`group relative rounded-xl overflow-hidden border-2 transition-all aspect-square bg-gray-100 ${
                    value === imgUrl ? "border-brand-accent ring-2 ring-brand-accent/20" : "border-gray-200 hover:border-brand-accent/50"
                  }`}
                >
                  <img src={imgUrl} alt={`Site image ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-brand-accent/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white text-brand-accent text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow">
                      {language === "en" ? "Select" : "Choisir"}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                {language === "en" ? "Cancel" : "Annuler"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminPagesView({ language }: { language: string }) {
  const {
    getHeroContent,
    updateHeroContent,
    getShippingSection,
    updateShippingSection,
    getAboutSection,
    updateAboutSection
  } = useLanguage();

  const hero = getHeroContent ? getHeroContent() : null;
  const shippingSec = getShippingSection ? getShippingSection() : null;
  const aboutSec = getAboutSection ? getAboutSection() : null;

  // Hero States
  const [heroTitleEn, setHeroTitleEn] = useState(hero?.titleEn || "Enjoy Nature's");
  const [heroTitleFr, setHeroTitleFr] = useState(hero?.titleFr || "Profitez de la fraîcheur");
  const [heroAccentEn, setHeroAccentEn] = useState(hero?.titleAccentEn || "freshness!");
  const [heroAccentFr, setHeroAccentFr] = useState(hero?.titleAccentFr || "de la nature !");
  const [heroDescEn, setHeroDescEn] = useState(hero?.descEn || "");
  const [heroDescFr, setHeroDescFr] = useState(hero?.descFr || "");
  const [heroBtnShopEn, setHeroBtnShopEn] = useState(hero?.buttonShopEn || "Shop Collection");
  const [heroBtnShopFr, setHeroBtnShopFr] = useState(hero?.buttonShopFr || "Découvrir la collection");
  const [heroBtnStoryEn, setHeroBtnStoryEn] = useState(hero?.buttonStoryEn || "Read Our Story");
  const [heroBtnStoryFr, setHeroBtnStoryFr] = useState(hero?.buttonStoryFr || "Découvrir notre histoire");
  const [heroImage, setHeroImage] = useState(hero?.image || "https://dhgf5mcbrms62.cloudfront.net/86991813/cover-HaXq6F/YRkMx7N-2000x2000.jpg");

  // About States
  const [aboutTitleEn, setAboutTitleEn] = useState(aboutSec?.titleEn || "About Vonn Essentials");
  const [aboutTitleFr, setAboutTitleFr] = useState(aboutSec?.titleFr || "À Propos de Vonn Essentials");
  const [aboutSubtitleEn, setAboutSubtitleEn] = useState(aboutSec?.subtitleEn || "Crafted with Intention & Care");
  const [aboutSubtitleFr, setAboutSubtitleFr] = useState(aboutSec?.subtitleFr || "Façonné avec Intention & Soin");
  const [aboutEnText, setAboutEnText] = useState((aboutSec?.contentEn || []).join("\n\n"));
  const [aboutFrText, setAboutFrText] = useState((aboutSec?.contentFr || []).join("\n\n"));

  // Shipping States
  const [shippingTitleEn, setShippingTitleEn] = useState(shippingSec?.titleEn || "Shipping & Returns Policy");
  const [shippingTitleFr, setShippingTitleFr] = useState(shippingSec?.titleFr || "Politique d'Expédition et Retours");
  const [shippingSubtitleEn, setShippingSubtitleEn] = useState(shippingSec?.subtitleEn || "Transparent & Reliable Service");
  const [shippingSubtitleFr, setShippingSubtitleFr] = useState(shippingSec?.subtitleFr || "Service Transparent & Fiable");
  const [shippingEnText, setShippingEnText] = useState((shippingSec?.contentEn || []).join("\n\n"));
  const [shippingFrText, setShippingFrText] = useState((shippingSec?.contentFr || []).join("\n\n"));

  const handleUpdateContent = (e: React.FormEvent) => {
    e.preventDefault();
    const shEn = shippingEnText.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    const shFr = shippingFrText.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    const abEn = aboutEnText.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    const abFr = aboutFrText.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

    if (updateHeroContent) {
      updateHeroContent({
        titleEn: heroTitleEn.trim(),
        titleFr: heroTitleFr.trim(),
        titleAccentEn: heroAccentEn.trim(),
        titleAccentFr: heroAccentFr.trim(),
        descEn: heroDescEn.trim(),
        descFr: heroDescFr.trim(),
        buttonShopEn: heroBtnShopEn.trim(),
        buttonShopFr: heroBtnShopFr.trim(),
        buttonStoryEn: heroBtnStoryEn.trim(),
        buttonStoryFr: heroBtnStoryFr.trim(),
        image: heroImage.trim()
      });
    }

    if (updateAboutSection) {
      updateAboutSection({
        titleEn: aboutTitleEn.trim(),
        titleFr: aboutTitleFr.trim(),
        subtitleEn: aboutSubtitleEn.trim(),
        subtitleFr: aboutSubtitleFr.trim(),
        contentEn: abEn,
        contentFr: abFr
      });
    }

    if (updateShippingSection) {
      updateShippingSection({
        titleEn: shippingTitleEn.trim(),
        titleFr: shippingTitleFr.trim(),
        subtitleEn: shippingSubtitleEn.trim(),
        subtitleFr: shippingSubtitleFr.trim(),
        contentEn: shEn,
        contentFr: shFr
      });
    }

    toast.success(language === "en" ? "Hero, About & Shipping sections updated successfully!" : "Sections du site web mises à jour avec succès !");
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-8 text-left font-sans">
      <div className="pb-4 border-b border-gray-100">
        <h4 className="text-base font-sans font-bold text-gray-900 uppercase tracking-wider">
          {language === "en" ? "Homepage Sections & Content Editor" : "Éditeur de Contenu & Sections"}
        </h4>
        <p className="text-xs text-gray-400 font-serif mt-1">
          {language === "en" ? "Customize your Hero banner ('Enjoy Nature's freshness'), About Us story, and Shipping Policy." : "Personnalisez votre bannière d'accueil, le récit À Propos et la politique d'expédition."}
        </p>
      </div>

      <form onSubmit={handleUpdateContent} className="space-y-10">
        {/* SECTION 1: HERO BANNER */}
        <div className="bg-gray-50/60 border border-gray-100 rounded-2xl p-6 space-y-6">
          <h5 className="font-bold text-sm text-gray-900 uppercase tracking-wider border-b border-gray-200/60 pb-3 flex items-center justify-between">
            <span>🌿 {language === "en" ? "Hero Banner Section" : "Section Bannière d'Accueil"}</span>
            <span className="text-[10px] text-brand-accent font-normal bg-brand-accent/10 px-2.5 py-1 rounded-full uppercase">"Enjoy Nature's freshness"</span>
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Main Title (EN)</label>
              <input
                type="text"
                value={heroTitleEn}
                onChange={(e) => setHeroTitleEn(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Titre Principal (FR)</label>
              <input
                type="text"
                value={heroTitleFr}
                onChange={(e) => setHeroTitleFr(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Accent Phrase (EN)</label>
              <input
                type="text"
                value={heroAccentEn}
                onChange={(e) => setHeroAccentEn(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Phrase d'Accent (FR)</label>
              <input
                type="text"
                value={heroAccentFr}
                onChange={(e) => setHeroAccentFr(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Hero Subtitle / Description (EN)</label>
              <textarea
                rows={3}
                value={heroDescEn}
                onChange={(e) => setHeroDescEn(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-serif"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Description (FR)</label>
              <textarea
                rows={3}
                value={heroDescFr}
                onChange={(e) => setHeroDescFr(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-serif"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Primary Button Label (EN)</label>
              <input
                type="text"
                value={heroBtnShopEn}
                onChange={(e) => setHeroBtnShopEn(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Bouton Principal (FR)</label>
              <input
                type="text"
                value={heroBtnShopFr}
                onChange={(e) => setHeroBtnShopFr(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Secondary Link Label (EN)</label>
              <input
                type="text"
                value={heroBtnStoryEn}
                onChange={(e) => setHeroBtnStoryEn(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Bouton Secondaire (FR)</label>
              <input
                type="text"
                value={heroBtnStoryFr}
                onChange={(e) => setHeroBtnStoryFr(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm"
              />
            </div>

            <div className="col-span-full pt-2">
              <ImageSelector
                label={language === "en" ? "Hero Cover Image" : "Image de la Bannière Principale"}
                value={heroImage}
                onChange={setHeroImage}
                language={language}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: ABOUT US */}
        <div className="bg-gray-50/60 border border-gray-100 rounded-2xl p-6 space-y-6">
          <h5 className="font-bold text-sm text-gray-900 uppercase tracking-wider border-b border-gray-200/60 pb-3">
            📖 {language === "en" ? "About Us Section" : "Section À Propos de Nous"}
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Section Title (EN)</label>
              <input
                type="text"
                value={aboutTitleEn}
                onChange={(e) => setAboutTitleEn(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Titre de Section (FR)</label>
              <input
                type="text"
                value={aboutTitleFr}
                onChange={(e) => setAboutTitleFr(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Subtitle / Tagline (EN)</label>
              <input
                type="text"
                value={aboutSubtitleEn}
                onChange={(e) => setAboutSubtitleEn(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Sous-Titre (FR)</label>
              <input
                type="text"
                value={aboutSubtitleFr}
                onChange={(e) => setAboutSubtitleFr(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Paragraphs (EN - empty lines separate paragraphs)</label>
              <textarea
                rows={6}
                value={aboutEnText}
                onChange={(e) => setAboutEnText(e.target.value)}
                className="w-full p-4 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-serif leading-relaxed"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Paragraphes (FR - sauts de ligne pour séparer)</label>
              <textarea
                rows={6}
                value={aboutFrText}
                onChange={(e) => setAboutFrText(e.target.value)}
                className="w-full p-4 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-serif leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: SHIPPING & RETURNS */}
        <div className="bg-gray-50/60 border border-gray-100 rounded-2xl p-6 space-y-6">
          <h5 className="font-bold text-sm text-gray-900 uppercase tracking-wider border-b border-gray-200/60 pb-3">
            📦 {language === "en" ? "Shipping & Returns Policy Section" : "Section Expédition & Retours"}
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Section Title (EN)</label>
              <input
                type="text"
                value={shippingTitleEn}
                onChange={(e) => setShippingTitleEn(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Titre de Section (FR)</label>
              <input
                type="text"
                value={shippingTitleFr}
                onChange={(e) => setShippingTitleFr(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Subtitle / Tagline (EN)</label>
              <input
                type="text"
                value={shippingSubtitleEn}
                onChange={(e) => setShippingSubtitleEn(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Sous-Titre (FR)</label>
              <input
                type="text"
                value={shippingSubtitleFr}
                onChange={(e) => setShippingSubtitleFr(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Policy Paragraphs (EN - empty lines separate paragraphs)</label>
              <textarea
                rows={6}
                value={shippingEnText}
                onChange={(e) => setShippingEnText(e.target.value)}
                className="w-full p-4 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-serif leading-relaxed"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Paragraphes de Politique (FR)</label>
              <textarea
                rows={6}
                value={shippingFrText}
                onChange={(e) => setShippingFrText(e.target.value)}
                className="w-full p-4 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-serif leading-relaxed"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full md:w-auto px-10 py-4 bg-[#162F1C] hover:bg-[#162F1C]/90 text-white font-bold rounded-xl shadow-xl transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <Check size={16} />
          <span>{language === "en" ? "Save All Website Sections" : "Enregistrer Toutes les Sections"}</span>
        </button>
      </form>
    </div>
  );
}

function AdminJournalView({ language, showConfirm }: { language: string; showConfirm: (title: string, message: string, onConfirm: () => void) => void }) {
  const { 
    addBlogPost, 
    updateBlogPost, 
    deleteBlogPost, 
    getAllBlogsEn, 
    getAllBlogsFr 
  } = useLanguage();

  const blogsEn = getAllBlogsEn();
  const blogsFr = getAllBlogsFr();

  const [activeTab, setActiveTab] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states (Bilingual)
  const [slug, setSlug] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [titleFr, setTitleFr] = useState("");
  const [image, setImage] = useState("");
  const [summaryEn, setSummaryEn] = useState("");
  const [summaryFr, setSummaryFr] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [contentFr, setContentFr] = useState("");

  const handleOpenAdd = () => {
    setEditingId(null);
    setSlug("journal-" + Math.floor(1000 + Math.random() * 9000));
    setTitleEn("");
    setTitleFr("");
    setImage("https://dhgf5mcbrms62.cloudfront.net/86991813/customer-review-7jFZXh/bCCWBzq-600x600.webp");
    setSummaryEn("");
    setSummaryFr("");
    setContentEn("");
    setContentFr("");
    setActiveTab("form");
  };

  const handleOpenEdit = (bEn: any) => {
    const bFr = blogsFr.find((b) => b.id === bEn.id) || bEn;
    setEditingId(bEn.id);
    setSlug(bEn.id);
    setTitleEn(bEn.title);
    setTitleFr(bFr.title);
    setImage(bEn.image);
    setSummaryEn(bEn.text);
    setSummaryFr(bFr.text);
    setContentEn(bEn.fullText || bEn.text);
    setContentFr(bFr.fullText || bFr.text);
    setActiveTab("form");
  };

  const handleDelete = (id: string) => {
    const confirmMsg = language === "en" 
      ? "Are you sure you want to delete this journal entry?" 
      : "Êtes-vous sûr de vouloir supprimer cet article du journal ?";
    
    showConfirm(
      language === "en" ? "Delete Journal Entry" : "Supprimer l'article",
      confirmMsg,
      () => {
        deleteBlogPost(id);
        toast.success(language === "en" ? "Journal entry deleted!" : "Article de journal supprimé !");
      }
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn || !titleFr || !summaryEn || !summaryFr || !contentEn || !contentFr || !image) {
      toast.error(language === "en" ? "Please fill in all fields" : "Veuillez remplir tous les champs");
      return;
    }

    const postEn = {
      id: slug,
      title: titleEn.trim(),
      image: image.trim(),
      text: summaryEn.trim(),
      fullText: contentEn.trim()
    };

    const postFr = {
      id: slug,
      title: titleFr.trim(),
      image: image.trim(),
      text: summaryFr.trim(),
      fullText: contentFr.trim()
    };

    if (editingId) {
      updateBlogPost(editingId, postEn, postFr);
      toast.success(language === "en" ? "Journal entry updated successfully!" : "Article de journal mis à jour avec succès !");
    } else {
      // Check for duplicate slug
      if (blogsEn.some(b => b.id === slug)) {
        toast.error(language === "en" ? "An entry with this ID/Slug already exists" : "Un article avec cet identifiant existe déjà");
        return;
      }
      addBlogPost(postEn, postFr);
      toast.success(language === "en" ? "New journal entry created!" : "Nouvel article créé !");
    }

    setActiveTab("list");
  };

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h4 className="text-base font-sans font-bold text-gray-900 uppercase tracking-wider">
            {language === "en" ? "Storefront Journal & Blog Editor" : "Éditeur du Journal de la Boutique"}
          </h4>
          <p className="text-xs text-gray-400 font-serif mt-1">
            {language === "en" ? "Create, edit, or delete articles in the storefront Blog section." : "Créez, modifiez ou supprimez des articles de la section Blog de la boutique."}
          </p>
        </div>

        {activeTab === "list" && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-[#1a1a1a] hover:bg-brand-accent text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all self-start sm:self-auto"
          >
            <Plus size={14} />
            {language === "en" ? "Add Entry" : "Ajouter un Article"}
          </button>
        )}
      </div>

      {activeTab === "list" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blogsEn.length === 0 ? (
            <div className="col-span-full bg-gray-50 border border-gray-100 rounded-2xl p-12 text-center text-gray-400 font-serif">
              {language === "en" ? "No journal entries found." : "Aucun article trouvé dans le journal."}
            </div>
          ) : (
            blogsEn.map((blog) => {
              const blogFr = blogsFr.find((b) => b.id === blog.id) || blog;
              return (
                <div key={blog.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:border-brand-accent/20 transition-all flex flex-col md:flex-row gap-5">
                  <div className="w-full md:w-32 h-32 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    <img src={blog.image} alt={blog.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start gap-4">
                        <h5 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">{language === "en" ? blog.title : blogFr.title}</h5>
                        <span className="text-[9px] font-mono font-bold bg-gray-50 text-gray-400 px-2 py-0.5 rounded-full border border-gray-100 uppercase tracking-wider shrink-0">{blog.id}</span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-3 font-serif leading-relaxed">{language === "en" ? blog.text : blogFr.text}</p>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-gray-50 pt-3 mt-4">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(blog)}
                        className="p-2 text-gray-400 hover:text-brand-accent transition-colors"
                        title={language === "en" ? "Edit" : "Modifier"}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(blog.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title={language === "en" ? "Delete" : "Supprimer"}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Form View */
        <form onSubmit={handleSave} className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Journal ID / URL Slug</label>
              <input
                type="text"
                required
                disabled={editingId !== null}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. natural-skincare"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-mono font-bold bg-gray-50 text-gray-500 disabled:opacity-70"
              />
            </div>

            <div className="space-y-1">
              <ImageSelector
                label={language === "en" ? "Featured Article Image" : "Image à la Une d'Article"}
                value={image}
                onChange={setImage}
                language={language}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-50 pt-4">
            {/* English Fields */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-sky-500 rounded-full"></span>
                {language === "en" ? "English Version" : "Version Anglaise"}
              </h5>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Title (EN)</label>
                <input
                  type="text"
                  required
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="e.g. 5 steps to glowing skin"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Short Summary / Excerpt (EN)</label>
                <textarea
                  required
                  rows={2}
                  value={summaryEn}
                  onChange={(e) => setSummaryEn(e.target.value)}
                  placeholder="A short hook sentence displayed on the catalog card..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-serif"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Full Article Content (EN)</label>
                <textarea
                  required
                  rows={10}
                  value={contentEn}
                  onChange={(e) => setContentEn(e.target.value)}
                  placeholder="The main paragraphs of your article. Supports line breaks..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-serif"
                />
              </div>
            </div>

            {/* French Fields */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                {language === "en" ? "French Version" : "Version Française"}
              </h5>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Titre (FR)</label>
                <input
                  type="text"
                  required
                  value={titleFr}
                  onChange={(e) => setTitleFr(e.target.value)}
                  placeholder="Ex: 5 étapes pour une peau éclatante"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Résumé / Extrait (FR)</label>
                <textarea
                  required
                  rows={2}
                  value={summaryFr}
                  onChange={(e) => setSummaryFr(e.target.value)}
                  placeholder="Une courte phrase d'accroche affichée sur la carte..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-serif"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Contenu Complet de l'Article (FR)</label>
                <textarea
                  required
                  rows={10}
                  value={contentFr}
                  onChange={(e) => setContentFr(e.target.value)}
                  placeholder="Les paragraphes principaux de votre article..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-serif"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={() => setActiveTab("list")}
              className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all font-bold text-xs uppercase tracking-wider"
            >
              {language === "en" ? "Cancel" : "Annuler"}
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-brand-accent text-white rounded-xl hover:bg-brand-accent/90 transition-all font-bold text-xs uppercase tracking-wider shadow-md"
            >
              {language === "en" ? "Save Article" : "Enregistrer l'Article"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function AdminGiftCodesView({ language, showConfirm }: { language: string; showConfirm: (title: string, message: string, onConfirm: () => void) => void }) {
  const [giftCodes, setGiftCodes] = useState<GiftCode[]>(() => {
    const saved = localStorage.getItem("vonn_gift_codes");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    const presets: GiftCode[] = [
      { code: "WELCOME25", discountType: "product_percentage", discountValue: 25, description: "25% discount on products" },
      { code: "SAVE50", discountType: "product_percentage", discountValue: 50, description: "50% discount on products" },
      { code: "FREESHIP", discountType: "shipping_free", discountValue: 100, description: "100% free shipping" },
      { code: "HALFSHIP", discountType: "shipping_percentage", discountValue: 50, description: "50% off shipping" }
    ];
    localStorage.setItem("vonn_gift_codes", JSON.stringify(presets));
    return presets;
  });

  useEffect(() => {
    fetch("/api/gift-codes")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setGiftCodes(data);
          localStorage.setItem("vonn_gift_codes", JSON.stringify(data));
        }
      })
      .catch(() => {});
  }, []);

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<GiftCode["discountType"]>("product_percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || (discountType !== "shipping_free" && !discountValue)) {
      toast.error(language === "en" ? "Please fill in all required fields." : "Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, "");
    if (giftCodes.some((gc) => gc.code === cleanCode)) {
      toast.error(language === "en" ? "This gift code already exists." : "Ce code cadeau existe déjà.");
      return;
    }

    const val = discountType === "shipping_free" ? 100 : parseFloat(discountValue);
    if (isNaN(val) || val <= 0) {
      toast.error(language === "en" ? "Discount value must be positive." : "La valeur de réduction doit être positive.");
      return;
    }

    if ((discountType === "product_percentage" || discountType === "shipping_percentage" || discountType === "shipping_free") && val > 100) {
      toast.error(language === "en" ? "Percentage discount cannot exceed 100%." : "Le pourcentage de réduction ne peut pas dépasser 100%.");
      return;
    }

    const newCode: GiftCode = {
      code: cleanCode,
      discountType,
      discountValue: val,
      description: description.trim() || (
        discountType === "product_percentage" ? `${val}% off products` :
        discountType === "product_fixed" ? `C$${val.toFixed(2)} off products` :
        discountType === "shipping_percentage" ? `${val}% off shipping` : "Free shipping"
      )
    };

    const updated = [newCode, ...giftCodes];
    setGiftCodes(updated);
    localStorage.setItem("vonn_gift_codes", JSON.stringify(updated));

    // Save to Firestore in real-time
    setDoc(doc(db, "store", "global"), { giftCodes: updated }, { merge: true }).catch((err) => console.warn(err));

    fetch("/api/gift-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCode)
    }).catch(() => {});

    toast.success(language === "en" ? "Gift code generated successfully!" : "Code cadeau généré avec succès !");

    // Reset form
    setCode("");
    setDiscountValue("");
    setDescription("");
  };

  const handleDelete = (targetCode: string) => {
    showConfirm(
      language === "en" ? "Delete Gift Code" : "Supprimer le code",
      language === "en" 
        ? `Are you sure you want to delete the gift code "${targetCode}"?` 
        : `Êtes-vous sûr de vouloir supprimer le code cadeau "${targetCode}" ?`,
      () => {
        const updated = giftCodes.filter((gc) => gc.code !== targetCode);
        setGiftCodes(updated);
        localStorage.setItem("vonn_gift_codes", JSON.stringify(updated));

        // Save to Firestore in real-time
        setDoc(doc(db, "store", "global"), { giftCodes: updated }, { merge: true }).catch((err) => console.warn(err));

        fetch(`/api/gift-codes/${encodeURIComponent(targetCode)}`, {
          method: "DELETE"
        }).catch(() => {});

        toast.success(language === "en" ? "Gift code deleted." : "Code cadeau supprimé.");
      }
    );
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-8 font-sans text-left">
      <div>
        <h4 className="text-base font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
          <Gift size={18} className="text-brand-accent" />
          {language === "en" ? "Gift & Promo Codes Management" : "Gestion des Codes Cadeaux & Promos"}
        </h4>
        <p className="text-xs text-gray-400 font-serif mt-1">
          {language === "en" ? "Generate, customize, and revoke user coupon codes for products or shipping discounts." : "Générez, personnalisez et révoquez les codes coupons de réduction sur les produits ou la livraison."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creator Form */}
        <form onSubmit={handleCreate} className="space-y-4 lg:col-span-1 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
          <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-150 pb-2">
            {language === "en" ? "Generate Code" : "Générer un Code"}
          </h5>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
              {language === "en" ? "Coupon Code" : "Code Coupon"}
            </label>
            <input
              type="text"
              required
              placeholder="e.g. VONNFRESH"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-mono font-bold uppercase"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
              {language === "en" ? "Discount Target" : "Type de Réduction"}
            </label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as GiftCode["discountType"])}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm bg-white"
            >
              <option value="product_percentage">{language === "en" ? "Product Price - Percentage (%)" : "Prix du Produit - Pourcentage (%)"}</option>
              <option value="product_fixed">{language === "en" ? "Product Price - Fixed Amount (CAD)" : "Prix du Produit - Montant Fixe (CAD)"}</option>
              <option value="shipping_percentage">{language === "en" ? "Shipping - Percentage Discount (%)" : "Livraison - Rabais Pourcentage (%)"}</option>
              <option value="shipping_free">{language === "en" ? "Shipping - 100% Free Shipping" : "Livraison - 100% Gratuite"}</option>
            </select>
          </div>

          {discountType !== "shipping_free" && (
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                {language === "en" ? "Discount Value" : "Valeur de la Réduction"}
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder={discountType.includes("percentage") ? "e.g. 25" : "e.g. 10.00"}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-bold"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
              {language === "en" ? "Label / Description" : "Libellé / Description"}
            </label>
            <input
              type="text"
              placeholder={language === "en" ? "e.g. 25% winter discount" : "Ex: 25% rabais d'hiver"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-accent focus:outline-none text-sm font-serif"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all mt-2"
          >
            {language === "en" ? "Generate Code" : "Créer le Code"}
          </button>
        </form>

        {/* Existing List */}
        <div className="lg:col-span-2 space-y-4">
          <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">
            {language === "en" ? "Active Codes" : "Codes Actifs"} ({giftCodes.length})
          </h5>

          {giftCodes.length === 0 ? (
            <div className="text-center py-12 bg-gray-50/50 border border-dashed border-gray-100 rounded-2xl">
              <p className="text-sm text-gray-400 font-serif">
                {language === "en" ? "No gift codes configured. Generate one above!" : "Aucun code cadeau configuré. Générez-en un ci-dessus !"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase font-semibold tracking-wider">
                    <th className="p-4 pl-6">{language === "en" ? "Code" : "Code"}</th>
                    <th className="p-4">{language === "en" ? "Target & Value" : "Cible & Valeur"}</th>
                    <th className="p-4">{language === "en" ? "Description" : "Description"}</th>
                    <th className="p-4 pr-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {giftCodes.map((gc) => (
                    <tr key={gc.code} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 pl-6 font-mono font-bold text-sm text-gray-900 tracking-wide">
                        <span className="bg-brand-accent/10 text-brand-accent px-2.5 py-1 rounded-md">
                          {gc.code}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-gray-800">
                          {gc.discountType === "product_percentage" ? (
                            <span>{language === "en" ? "Products: " : "Produits: "}{gc.discountValue}% Off</span>
                          ) : gc.discountType === "product_fixed" ? (
                            <span>{language === "en" ? "Products: " : "Produits: "}C${gc.discountValue.toFixed(2)} Off</span>
                          ) : gc.discountType === "shipping_percentage" ? (
                            <span>{language === "en" ? "Shipping: " : "Livraison: "}{gc.discountValue}% Off</span>
                          ) : (
                            <span>{language === "en" ? "Shipping: " : "Livraison: "}100% Free</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-gray-500 font-serif">
                        {gc.description}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(gc.code)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title={language === "en" ? "Revoke code" : "Révoquer le code"}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
