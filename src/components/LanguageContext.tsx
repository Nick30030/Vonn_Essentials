import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { Product } from "../types";
import { db, doc, onSnapshot, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from "../lib/firebase";
import supporting from "../assets/images/supporting.webp";
import handsBehindProductsImage from "../assets/images/hands_behind_products_user_1781368715040.jpg";
import meet from "../assets/images/Meet.jpg";
import DIY from "../assets/images/DIY.webp";
import skincare from "../assets/images/skincare.webp";
export type Language = "en" | "fr";

export interface HeroContent {
  titleEn: string;
  titleAccentEn: string;
  descEn: string;
  buttonShopEn: string;
  buttonStoryEn: string;
  titleFr: string;
  titleAccentFr: string;
  descFr: string;
  buttonShopFr: string;
  buttonStoryFr: string;
  image: string;
}

export interface SectionContentData {
  titleEn: string;
  titleFr: string;
  subtitleEn: string;
  subtitleFr: string;
  contentEn: string[];
  contentFr: string[];
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
  getProducts: () => Product[];
  getShippingContent: () => string[];
  getAboutContent: () => string[];
  getHeroContent: () => HeroContent;
  updateHeroContent: (hero: Partial<HeroContent>) => void;
  getShippingSection: () => SectionContentData;
  updateShippingSection: (section: Partial<SectionContentData>) => void;
  getAboutSection: () => SectionContentData;
  updateAboutSection: (section: Partial<SectionContentData>) => void;
  getBlogPosts: () => any[];
  addBlogPost: (postEn: any, postFr: any) => void;
  updateBlogPost: (id: string, postEn: any, postFr: any) => void;
  deleteBlogPost: (id: string) => void;
  getAllBlogsEn: () => any[];
  getAllBlogsFr: () => any[];
  addProduct: (productEn: Product, productFr: Product) => void;
  updateProduct: (id: number, productEn: Product, productFr: Product) => void;
  deleteProduct: (id: number) => void;
  getAllProductsEn: () => Product[];
  getAllProductsFr: () => Product[];
  updateShippingContent: (en: string[], fr: string[]) => void;
  updateAboutContent: (en: string[], fr: string[]) => void;
  getRawShippingEn: () => string[];
  getRawShippingFr: () => string[];
  getRawAboutEn: () => string[];
  getRawAboutFr: () => string[];
  adminPasscode: string;
  updateAdminPasscode: (newPass: string) => void;
  adminEmail: string;
  updateAdminEmail: (newEmail: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const TRANSLATIONS = {
  en: {
    // Navbar
    nav_store: "Store",
    nav_shipping: "Shipping",
    nav_contact: "Contact",
    nav_search: "Search...",
    
    // Hero
    hero_tag: "Artisanal Wellness",
    hero_title: "Enjoy Nature's",
    hero_title_accent: "freshness!",
    hero_desc_1: "Whether you’re in need of homemade products for your skincare routine or looking for the perfect gift, you’re in the right place!",
    hero_shop: "Shop Collection",
    hero_story: "Our Story",
    
    // Product Gallery
    gallery_tag: "Curated Care",
    gallery_title: "Our Products",
    gallery_view3d: "Quick View",
    gallery_quickadd: "Quick Add",
    gallery_explore: "Explore Full Collection",
    
    // Quick View Modal
    modal_details: "Product Details",
    modal_interactive3d: "Interactive 3D View",
    modal_origin_tag: "Handcrafted in Canada",
    modal_instructions3d: "Click and drag to rotate • Scroll to zoom",
    modal_addtocart: "Add to Cart",
    modal_standard: "Standard",
    modal_standard_val: "Fair Trade",
    modal_origin: "Origin",
    modal_origin_val: "Canada",
    modal_desc_placeholder: "Experience the pure essence of nature with our {name}. Handcrafted in small batches using only the finest essential oils and natural ingredients. No synthetic fragrances or parabens.",

    // Cart Drawer
    cart_title: "Your Cart",
    cart_items: "Items",
    cart_empty: "Your cart is empty",
    cart_empty_sub: "Add some essentials to get started",
    cart_continue: "Continue Shopping",
    cart_subtotal: "Subtotal",
    cart_shipping_or_delivery: "Shipping or delivery",
    cart_hst: "HST",
    cart_shipping: "Shipping",
    cart_shipping_val: "Calculated at checkout",
    cart_total: "Total",
    cart_checkout: "Proceed to Checkout",
    cart_secure: "Secure Checkout with Stripe & PayPal",
    
    // Shipping Section
    shipping_title: "Shipping & Return Info",
    shipping_subtitle: "Fair, transparent, and hassle-free policies",
    shipping_tag: "Essential Detail",
    
    // About Section
    about_title: "About Us",
    about_subtitle: "Where Science Meets Self-Care",
    about_tag: "Essential Detail",
    
    // Blog Carousel
    blog_tag: "Discovery",
    blog_title: "The Journal",
    blog_readmore: "Read Article",
    
    // Contact Section
    contact_tag: "Get in touch",
    contact_title: "Contact Us",
    contact_desc: "Whether you're looking for customer support or potential partnerships, our doors are always open. We value every message.",
    contact_workshop_tag: "Workshop Location",
    contact_workshop_val: "Handcrafted in Canada",
    contact_phone: "Call Us",
    contact_email: "Email Us",
    contact_follow: "Follow Us",
    
    // Checkout Modal
    checkout_title: "Checkout",
    checkout_address_title: "Shipping Address",
    checkout_address_subtitle: "Where should we send your order?",
    checkout_first_name: "First Name",
    checkout_last_name: "Last Name",
    checkout_email: "Email",
    checkout_country: "Country",
    checkout_state: "State",
    checkout_address: "Address",
    checkout_city: "City",
    checkout_province: "Province/Territory",
    checkout_postal: "Postal Code",
    checkout_continue_to_payment: "Continue to Payment",
    checkout_subtitle: "Select your preferred payment method",
    checkout_etransfer: "Interac E-transfer",
    checkout_etransfer_desc: "Direct from your bank",
    checkout_total: "Order Total",
    checkout_instructions_title: "Instructions",
    checkout_email_addr: "Email Address",
    checkout_amount_send: "Amount to send",
    checkout_etransfer_msg: "Please include your name in the message field. Your order will be processed once the transfer is received.",
    checkout_btn_confirm: "I've sent the E-transfer",
    checkout_back: "← Back",
    checkout_success_title: "Payment Successful & Order Confirmed!",
    checkout_success_msg: "Thank you for your order! Your payment has been received and verified. We have sent your official confirmation receipt to your email, and our team is preparing your package for shipment.",
    checkout_redirect_msg: "Closing checkout soon...",
    checkout_test_mode_title: "PayPal Test Sandbox Active",
    checkout_test_mode_desc: "Since this is a test store environment, real PayPal accounts and real credit/debit cards cannot be used on sandbox.paypal.com. Using real information causes a login loop or guest bank card redirects (as shown on your screenshot). To complete a test payment, you must use a PayPal Sandbox developer buyer account or try Interac E-transfer!",
    checkout_page_title: "Shopping cart",
    checkout_back_home: "Home / Store / Shopping cart",
    checkout_step_address_title: "Checkout",
    checkout_step_email_desc: "Enter your email address. This address will be used to send you order status updates.",
    checkout_step_shipping_title: "Delivery options",
    checkout_step_shipping_desc: "Select how you'll be receiving your order.",
    checkout_step_payment_title: "Payment information",
    checkout_step_payment_desc: "Choose a payment method and enter your payment details.",
    checkout_step_confirm_title: "Order confirmation",
    checkout_step_confirm_desc: "Place your order and receive a confirmation email.",
    checkout_agree_terms: "I agree with Terms & Conditions, Privacy Policy",
    checkout_shipping_methods_title: "Shipping and delivery methods",
    checkout_shipping_methods_desc: "Please choose a shipping method:",
    checkout_shipping_local: "Local delivery - Toronto",
    checkout_shipping_standard: "Standard",
    checkout_shipping_standard_desc: "Estimated arrival: 3-5 days. Please note: Delivery times may be affected by holidays, severe weather, or carrier delays beyond our control.",
    checkout_shipping_free: "Free Shipping",
    checkout_shipping_free_desc: "Available for orders from C$35.00",
    checkout_shipping_cp_expedited: "Canada Post Expedited Parcel USA",
    checkout_shipping_cp_small_packet: "Canada Post Small Packet USA Air",
    checkout_shipping_cp_tracked: "Canada Post Tracked Packet - USA",
    checkout_shipping_cp_xpresspost: "Canada Post Xpresspost USA",
    checkout_billing_same: "Billing address is the same as shipping",
    checkout_change_address: "Change address",
    checkout_order_comments: "Order comments",
    checkout_order_comments_placeholder: "Leave us a note about your order",
    checkout_btn_continue: "Continue",
    checkout_pay_paypal: "PayPal Payer"
  },
  fr: {
    // Navbar
    nav_store: "Boutique",
    nav_shipping: "Livraison",
    nav_contact: "Contact",
    nav_search: "Rechercher...",
    
    // Hero
    hero_tag: "Bien-être artisanal",
    hero_title: "Profitez de la fraîcheur",
    hero_title_accent: "de la nature!",
    hero_desc_1: "Que vous ayez besoin de produits artisanaux pour votre routine de soin corporel ou que vous cherchiez le cadeau idéal, vous êtes au bon endroit !",
    hero_shop: "Acheter la collection",
    hero_story: "Notre histoire",
    
    // Product Gallery
    gallery_tag: "Soins d'exception",
    gallery_title: "Nos Produits",
    gallery_view3d: "Aperçu",
    gallery_quickadd: "Ajouter",
    gallery_explore: "Découvrir la collection complète",
    
    // Quick View Modal
    modal_details: "Détails du Produit",
    modal_interactive3d: "Vue 3D Interactive",
    modal_origin_tag: "Fabriqué à la main au Canada",
    modal_instructions3d: "Cliquez et glissez pour tourner • Défilez pour zoomer",
    modal_addtocart: "Ajouter au panier",
    modal_standard: "Norme",
    modal_standard_val: "Commerce équitable",
    modal_origin: "Origine",
    modal_origin_val: "Canada",
    modal_desc_placeholder: "Découvrez la pureté absolue de la nature avec notre {name}. Conçu à la main en petites quantités en utilisant uniquement les meilleures huiles essentielles et des ingrédients naturels. Sans parfums synthétiques ni parabènes.",

    // Cart Drawer
    cart_title: "Votre Panier",
    cart_items: "Articles",
    cart_empty: "Votre panier est vide",
    cart_empty_sub: "Ajoutez quelques essentiels pour commencer",
    cart_continue: "Continuer vos achats",
    cart_subtotal: "Sous-total",
    cart_shipping_or_delivery: "Livraison",
    cart_hst: "TVH (HST)",
    cart_shipping: "Livraison",
    cart_shipping_val: "Calculé à l'étape finale",
    cart_total: "Total",
    cart_checkout: "Passer à la caisse",
    cart_secure: "Paiement sécurisé par Stripe & PayPal",
    
    // Shipping Section
    shipping_title: "Livraisons & Retours",
    shipping_subtitle: "Règlements équitables, transparents et sans tracas",
    shipping_tag: "Détail essentiel",
    
    // About Section
    about_title: "À propos de nous",
    about_subtitle: "Là où la science rencontre le bien-être",
    about_tag: "Détail essentiel",
    
    // Blog Carousel
    blog_tag: "Découverte",
    blog_title: "Le Journal",
    blog_readmore: "Lire l'article",
    
    // Contact Section
    contact_tag: "Contactez-nous",
    contact_title: "Contacter l'équipe",
    contact_desc: "Que vous recherchiez une assistance clientèle ou des partenariats potentiels, nos portes sont toujours ouvertes. Chaque message nous est précieux.",
    contact_workshop_tag: "Emplacement de l'atelier",
    contact_workshop_val: "Fabriqué à la main au Canada",
    contact_phone: "Appelez-nous",
    contact_email: "Écrivez-nous",
    contact_follow: "Suivez-nous",
    
    // Checkout Modal
    checkout_title: "Caisse",
    checkout_address_title: "Adresse d'expédition",
    checkout_address_subtitle: "Où devons-nous envoyer votre commande ?",
    checkout_first_name: "Prénom",
    checkout_last_name: "Nom",
    checkout_email: "Courriel",
    checkout_country: "Pays",
    checkout_state: "État",
    checkout_address: "Adresse",
    checkout_city: "Ville",
    checkout_province: "Province/Territoire",
    checkout_postal: "Code Postal",
    checkout_continue_to_payment: "Continuer vers le paiement",
    checkout_subtitle: "Choisissez votre mode de paiement",
    checkout_etransfer: "Virement de fonds Interac",
    checkout_etransfer_desc: "Virement direct depuis votre banque",
    checkout_total: "Total de la commande",
    checkout_instructions_title: "Instructions",
    checkout_email_addr: "Adresse courriel",
    checkout_amount_send: "Montant à envoyer",
    checkout_etransfer_msg: "Veuillez inclure votre nom dans le champ message. Votre commande sera traitée dès réception du virement.",
    checkout_btn_confirm: "J'ai envoyé le virement",
    checkout_back: "← Retour",
    checkout_success_title: "Paiement Réussi & Commande Confirmée !",
    checkout_success_msg: "Merci pour votre commande ! Votre paiement a été reçu et validé. Votre reçu de confirmation officiel a été envoyé à votre adresse courriel, et notre équipe prépare déjà votre colis.",
    checkout_redirect_msg: "Fermeture de la caisse bientôt...",
    checkout_test_mode_title: "Mode de Test PayPal Actif (Sandbox)",
    checkout_test_mode_desc: "Puisque cette boutique est en cours d'évaluation de test, les comptes PayPal réels et les cartes bancaires réelles ne sont pas acceptés sur sandbox.paypal.com. Saisir des informations de compte réelles entraîne une boucle de connexion infinie ou un encart de carte bancaire (comme sur votre capture d'écran). Pour simuler un paiement d'essai avec succès, veuillez utiliser un compte acquéreur PayPal Sandbox (développeur), ou complétez via Virement Interac!",
    checkout_page_title: "Panier d'achats",
    checkout_back_home: "Accueil / Boutique / Panier",
    checkout_step_address_title: "Facturation",
    checkout_step_email_desc: "Entrez votre adresse courriel. Cette adresse sera utilisée pour vous envoyer des mises à jour sur l'état de la commande.",
    checkout_step_shipping_title: "Options de livraison",
    checkout_step_shipping_desc: "Sélectionnez la façon dont vous recevrez votre commande.",
    checkout_step_payment_title: "Informations de paiement",
    checkout_step_payment_desc: "Choisissez un mode de paiement et entrez vos détails de paiement.",
    checkout_step_confirm_title: "Confirmation de commande",
    checkout_step_confirm_desc: "Passez votre commande et recevez un e-mail de confirmation.",
    checkout_agree_terms: "J'accepte les conditions générales et la politique de confidentialité",
    checkout_shipping_methods_title: "Méthodes d'expédition et de livraison",
    checkout_shipping_methods_desc: "Veuillez choisir un mode d'expédition :",
    checkout_shipping_local: "Livraison locale - Toronto",
    checkout_shipping_standard: "Standard",
    checkout_shipping_standard_desc: "Date d'arrivée estimée : 3-5 jours. Veuillez noter : Les délais de livraison peuvent être affectés par les jours fériés, les intempéries ou les retards des transporteurs indépendants de notre volonté.",
    checkout_shipping_free: "Livraison Gratuite",
    checkout_shipping_free_desc: "Disponible pour les commandes à partir de C$35.00",
    checkout_shipping_cp_expedited: "Postes Canada Colis Accélérés É.-U.",
    checkout_shipping_cp_small_packet: "Postes Canada Petit Paquet É.-U. Avion",
    checkout_shipping_cp_tracked: "Postes Canada Paquet Repérable - É.-U.",
    checkout_shipping_cp_xpresspost: "Postes Canada Xpresspost É.-U.",
    checkout_billing_same: "L'adresse de facturation est la même que l'adresse d'expédition",
    checkout_change_address: "Modifier l'adresse",
    checkout_order_comments: "Commentaires de la commande",
    checkout_order_comments_placeholder: "Laissez-nous une note concernant votre commande",
    checkout_btn_continue: "Continuer",
    checkout_pay_paypal: "Payer avec PayPal"
  }
};

const PRODUCTS_EN: Product[] = [
  {
    id: 552557185,
    name: "Activated Charcoal & Lavender Bar Soap",
    price: "C$5.00",
    weight: "142.0 g",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/5162316022.jpg",
    sku: "VE-SOAP-CHAR",
    collection: "Soaps"
  },
  {
    id: 715314856,
    name: "Activated Charcoal Mask",
    price: "C$10.55",
    weight: "2 Oz/60 g",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/5278612939.jpg",
    sku: "VE-MASK-CHAR",
    collection: "Skincare"
  },
  {
    id: 778852491,
    name: "Cucumber Face Wash",
    price: "C$8.00",
    weight: "2.7 fl. Oz/80 mL",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/778852491/5735737241.jpg",
    sku: "VE-WASH-CUCUMBER",
    collection: "Skincare"
  },
  {
    id: 790734919,
    name: "Facial Care Gift Set",
    price: "C$34.99",
    weight: "Complete Set",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/790734919/5735691901.jpg",
    sku: "VE-GIFT-FACIAL",
    collection: "Gift Sets"
  },
  {
    id: 708162349,
    name: "Lavender Facial Serum",
    price: "C$12.99",
    weight: "1 fl. Oz/30 mL",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/708162349/5735794901.jpg",
    sku: "VE-SERUM-LAV",
    collection: "Skincare"
  },
  {
    id: 670404034,
    name: "Lavender Facial Spray",
    price: "C$10.90",
    weight: "2 fl. Oz/60 mL",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/670404034/5741905326.jpg",
    sku: "VE-SPRAY-LAV",
    collection: "Skincare"
  },
  {
    id: 556991930,
    name: "Orange Blossom Face Wash",
    price: "C$8.00",
    weight: "2.7 fl. Oz/80 mL",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/556991930/5735741401.jpg",
    sku: "VE-WASH-ORANGE",
    collection: "Skincare"
  },
  {
    id: 636311177,
    name: "Orange Blossom Facial Serum",
    price: "C$12.99",
    weight: "1 fl. Oz/30 mL",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/636311177/5735794843.jpg",
    sku: "VE-SERUM-ORANGE",
    collection: "Skincare"
  }
];

const PRODUCTS_FR: Product[] = [
  {
    id: 552557185,
    name: "Savon au charbon actif et à la lavande",
    price: "C$5.00",
    weight: "142,0 g",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/5162316022.jpg",
    sku: "VE-SOAP-CHAR",
    collection: "Savons"
  },
  {
    id: 715314856,
    name: "Masque purifiant au charbon actif",
    price: "C$10.55",
    weight: "2 Oz/60 g",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/5278612939.jpg",
    sku: "VE-MASK-CHAR",
    collection: "Soins de la peau"
  },
  {
    id: 778852491,
    name: "Nettoyant pour le visage au concombre",
    price: "C$8.00",
    weight: "2,7 fl. Oz/80 mL",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/778852491/5735737241.jpg",
    sku: "VE-WASH-CUCUMBER",
    collection: "Soins de la peau"
  },
  {
    id: 790734919,
    name: "Coffret de soins du visage complet",
    price: "C$34.99",
    weight: "Ensemble complet",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/790734919/5735691901.jpg",
    sku: "VE-GIFT-FACIAL",
    collection: "Coffrets Cadeaux"
  },
  {
    id: 708162349,
    name: "Sérum visage apaisant à la lavande",
    price: "C$12.99",
    weight: "1 fl. Oz/30 mL",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/708162349/5735794901.jpg",
    sku: "VE-SERUM-LAV",
    collection: "Soins de la peau"
  },
  {
    id: 670404034,
    name: "Brume faciale rafraîchissante lavande",
    price: "C$10.90",
    weight: "2 fl. Oz/60 mL",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/670404034/5741905326.jpg",
    sku: "VE-SPRAY-LAV",
    collection: "Soins de la peau"
  },
  {
    id: 556991930,
    name: "Nettoyant visage fleur d'oranger",
    price: "C$8.00",
    weight: "2.7 fl. Oz/80 mL",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/556991930/5735741401.jpg",
    sku: "VE-WASH-ORANGE",
    collection: "Soins de la peau"
  },
  {
    id: 636311177,
    name: "Sérum visage fleur d'oranger",
    price: "C$12.99",
    weight: "1 fl. Oz/30 mL",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/636311177/5735794843.jpg",
    sku: "VE-SERUM-ORANGE",
    collection: "Soins de la peau"
  }
];

const SHIPPING_EN = [
  "The team at Vonn Essentials is committed to ensuring that your shopping experience online is just as positive as visiting a physical store. That’s why we crafted our policies to be fair, transparent, and hassle-free.",
  "Order processing is 5 to 7 business days. Shipping is approximately 3 to 5 business days within Canada and more than 7 days internationally.",
  "Once your product has been shipped, the order cannot be canceled. Any product to be returned within 14 days of the purchase, MUST be kept in an UNOPEN condition and will be at the expense of the customer."
];

const SHIPPING_FR = [
  "L'équipe de Vonn Essentials s'engage à faire en sorte que votre expérience d'achat en ligne soit aussi positive qu'une visite dans un magasin physique. C'est pourquoi nous avons conçu nos règlements de manière à ce qu'ils soient équitables, transparents et sans tracas.",
  "Le délai de traitement des commandes est de 5 à 7 jours ouvrables. Le délai de livraison est d'environ 3 à 5 jours ouvrables au Canada et de plus de 7 jours à l'étranger.",
  "Une fois que votre produit a été expédié, la commande ne peut pas être annulée. Tout produit devant être retourné dans les 14 jours suivant l'achat DOIT être conservé en parfait état NON OUVERT, au frais de l'acheteur-consommateur."
];

const DEFAULT_HERO: HeroContent = {
  titleEn: "Enjoy Nature's",
  titleAccentEn: "freshness!",
  descEn: "Pure, handcrafted skincare thoughtfully formulated with rich botanical ingredients. Organic soaps, face sprays, and nourishing serums crafted with love in Canada.",
  buttonShopEn: "Shop Collection",
  buttonStoryEn: "Read Our Story",
  titleFr: "Profitez de la fraîcheur",
  titleAccentFr: "de la nature !",
  descFr: "Des soins de la peau purs et artisanaux, formulés avec soin à partir de riches ingrédients botaniques. Savons biologiques, brumes et sérums nourrissants faits à la main au Canada.",
  buttonShopFr: "Découvrir la collection",
  buttonStoryFr: "Découvrir notre histoire",
  image: "https://dhgf5mcbrms62.cloudfront.net/86991813/cover-HaXq6F/YRkMx7N-2000x2000.jpg"
};

const DEFAULT_SHIPPING_SECTION: SectionContentData = {
  titleEn: "Shipping & Returns",
  titleFr: "Livraison & Retours",
  subtitleEn: "Fast, Reliable & Thoughtfully Packaged",
  subtitleFr: "Rapide, Fiable & Emballé avec Soin",
  contentEn: SHIPPING_EN,
  contentFr: SHIPPING_FR
};

const ABOUT_EN = [
  "Vonn Essentials was born from a simple question: What if your daily rituals could be both effective and indulgent? With a background in chemistry and a passion for natural wellness, I spent years experimenting, blending, testing, and perfecting formulations that actually work.",
  "We believe self-care shouldn't require compromise. Our products combine the precision of science with the soul of handcrafted care. Every bar of soap, every blend of oil, every product we create is formulated with intention and in small batches to ensure quality you can feel."
];

const ABOUT_FR = [
  "Vonn Essentials est née d’une question simple : Et si vos rituels quotidiens pouvaient être à la fois efficaces et raffinés ? Ayant une formation en chimie et une passion pour le bien-être naturel, j'ai passé des années à expérimenter, composer, tester et perfectionner des formules qui fonctionnent réellement.",
  "Nous croyons que prendre soin de soi ne devrait pas nécessiter de compromis. Nos produits allient la précision de la science à l'âme des soins artisanaux. Chaque savon, chaque mélange d'huiles, chaque produit que nous créons est formulé avec soin et en petites quantités afin de garantir une qualité que vous pouvez ressentir."
];

const DEFAULT_ABOUT_SECTION: SectionContentData = {
  titleEn: "About Vonn Essentials",
  titleFr: "À propos de Vonn Essentials",
  subtitleEn: "Pure Ingredients & Handcrafted Precision",
  subtitleFr: "Ingrédients Purs & Précision Artisanale",
  contentEn: ABOUT_EN,
  contentFr: ABOUT_FR
};

const BLOG_EN = [
  {
    id: "essential-oils",
    title: "What are Essential Oils?",
    image: "https://dhgf5mcbrms62.cloudfront.net/86991813/customer-review-7jFZXh/bCCWBzq-600x600.webp",
    text: "Essential oils are plant extracts with natural healing properties, promoting relaxation, stress relief, and improved sleep quality. They also have antimicrobial and anti-inflammatory properties...",
    fullText: "Essential oils are plant extracts with natural healing properties, promoting relaxation, stress relief, and improved sleep quality. They also have antimicrobial and anti-inflammatory properties, supporting the skin and immune system. These aromatic wonders can enhance mood, boost energy, and provide natural solutions for various ailments, making them a versatile and holistic approach to overall health and wellness.\n\nEssential oils in soaps enhance daily cleansing routines by providing a sensory experience with delightful scents. The therapeutic synergy of these natural extracts in our soaps nurtures both body and mind, providing a pampering experience."
  },
  {
    id: "handmade-industrial",
    title: "Handmade products & Industrialized products",
    image: "https://dhgf5mcbrms62.cloudfront.net/86991813/customer-review-7jFZXh/YeLp9sC-600x600.webp",
    text: "Handmade and mass-produced, industrialized products represent two distinct approaches to manufacturing, each with its own set of characteristics...",
    fullText: "Handmade and mass-produced, industrialized products represent two distinct approaches to manufacturing, each with its own set of characteristics. Handmade products are crafted with individual attention and care, resulting in unique, one-of-a-kind items that showcase craftsmanship and personalized details. In contrast, mass-produced, industrialized products are typically manufactured on a large scale using automated processes, ensuring efficiency and cost-effectiveness but sacrificing the personal touch found in handmade creations.\n\nIn the realm of skincare, the handcrafted ones stand out for their artisanal quality and natural ingredients, providing a personalized and eco-friendly alternative to their commercially manufactured counterparts."
  },
  {
    id: "forget-foaming",
    title: "Forget about foaming!",
    image: "https://dhgf5mcbrms62.cloudfront.net/86991813/customer-review-7jFZXh/i47GUCV-600x600.webp",
    text: "The common association between bubbles and effective cleaning in soaps is deeply ingrained in consumer perception. However, the efficacy of a soap doesn't solely depend on its ability to foam...",
    fullText: "The common association between bubbles and effective cleaning in soaps is deeply ingrained in consumer perception, often leading people to believe that a product is working only if it produces a substantial lather. However, the efficacy of a soap doesn't solely depend on its ability to foam. The active components in soaps, called surfactants, function by binding to both water and oil, facilitating the removal of dirt and grease.\n\nWhile foaming agents can enhance the cleaning process, handmade soaps, whether they produce copious bubbles or not, are often considered superior. Handmade soaps typically use natural ingredients and avoid harsh chemicals, offering a gentler and more nourishing cleansing experience. Their formulations are often tailored to suit different skin types, and the absence of synthetic additives can be particularly beneficial for individuals with sensitive skin. Moreover, the craftsmanship and attention to detail in handmade soaps contribute to a unique and personalized skincare experience, making them a preferred choice for those seeking a more wholesome and individualized cleansing routine.",
    sourceUrl: "https://medium.com/@isabella.meibauer/why-do-we-think-soap-only-works-when-it-lathers-and-foams-e5587976e97e",
    sourceTitle: "Medium - Why do we think soap only works when it lathers and foams?"
  },
  {
    id: "you-can-diy",
    title: "You Can DIY It, But Let’s Do It for You",
    image: DIY,
    text: "DIY skincare can be fun and creative—it's a great way to tailor products to your preferences. However, it comes with challenges such as research depth and minimum-quantity ingredient sourcing...",
    fullText: "DIY skincare can be fun and creative—it’s a great way to tailor products to your preferences. However, it comes with challenges. First, the research required to create safe and effective recipes can be overwhelming, demanding hours of dedication to understand skin types, ingredient interactions, and proper formulations.\n\nSecond, sourcing high-quality ingredients often means buying larger quantities than needed, leading to unnecessary expenses and waste. At Vonn Essentials, we take the guesswork out of skincare by combining passion and expertise to craft recipes with the best ingredients and precise formulations. So while you can DIY it, why not let us do the hard work for you and deliver professional-grade results?"
  },
  {
    id: "natural-skincare-routine",
    title: "How to build a natural skincare routine",
    image: skincare,
    text: "Building a simple yet effective skincare routine starts with understanding your skin type and choosing products with gentle, skin-friendly ingredients that meet your needs seamlessly...",
    fullText: "Building a simple yet effective skincare routine starts with understanding your skin type and choosing products with gentle, skin-friendly ingredients that meet your needs. Start with a basic regimen of cleansing, toning, and moisturising using plant-based cleansers.\n\nFor example, after a long and busy day, your nighttime facial routine will start with a Vonn Essentials face wash, followed by one of our alcohol-free facial sprays, such as Orange Blossom Face Spray. Finish with a hydrating serum enriched with botanical oils like Orange Blossom Facial Serum or Lavender Facial Serum. Incorporate weekly treatments such as detoxification with natural and rejuvenating masks that have ingredients such as clay to maintain skin vitality. Always patch test new products to ensure compatibility, and remember to protect your skin with a mineral-based sunscreen. With consistent use of products like these from Vonn Essentials and a commitment to natural care, your skin will thank you with a healthy, radiant glow."
  },
  {
    id: "why-small-brands",
    title: "Why supporting small cosmetic brands matters",
    image: supporting,
    text: "Running a small cosmetic business is a rewarding but often challenging journey. Unlike established brands, smaller businesses must work harder to gain trust and recognition...",
    fullText: "Running a small cosmetic business is a rewarding but often challenging journey. Unlike established brands, smaller businesses must work harder to gain trust and recognition. Potential customers might hesitate to try products simply because they are unfamiliar, not realizing the level of care, quality, and personal dedication that goes into crafting these offerings. This hesitation can be discouraging, especially for passionate entrepreneurs who invest significant time and resources to create products that genuinely benefit their users.\n\nSupporting small businesses not only helps their owners achieve their dreams but also empowers communities by encouraging diversity and innovation in the beauty industry. By choosing to shop from brands like Vonn Essentials, you are fostering growth and contributing to the success of individuals who pour their hearts into every product they create.",
    sourceUrl: "https://www.theupsstore.com/small-business-services/small-business-blog/small-business-blog/2024/10/what-is-brand-awareness",
    sourceTitle: "The UPS Store - What is Brand Awareness?"
  },
  {
    id: "hands-behind-products",
    title: "Meet the hands behind the products",
    image: meet,
    text: "At Vonn Essentials, every product tells a story - a story of passion, perseverance and love for natural beauty. Founded in 2018, the small business was built with dedication...",
    fullText: "At Vonn Essentials, every product tells a story - a story of passion, perseverance and love for natural beauty. Founded in 2018, the small business was built with dedication and an unwavering belief in creating luxurious skincare at an affordable price, that truly works.\n\nBehind every soap, every bottle and every jar are hands carefully crafting, innovating and overcoming challenges to bring you the best. By supporting Vonn Essentials, you're not just buying skincare; you're becoming part of a journey fuelled by hope, resilience and a commitment to enhancing your natural radiance."
  }
];

const BLOG_FR = [
  {
    id: "essential-oils",
    title: "Que sont les huiles essentielles ?",
    image: "https://dhgf5mcbrms62.cloudfront.net/86991813/customer-review-7jFZXh/bCCWBzq-600x600.webp",
    text: "Les huiles essentielles sont des extraits de plantes aux propriétés curatives naturelles, favorisant la relaxation, le soulagement du stress et l'amélioration de la qualité du sommeil...",
    fullText: "Les huiles essentielles sont des extraits de plantes aux propriétés curatives naturelles, favorisant la relaxation, le soulagement du stress et l'amélioration de la qualité du sommeil. Elles ont également des propriétés antimicrobiennes et anti-inflammatoires et soutiennent la peau et le système immunitaire. Ces petites merveilles arômatiques peuvent améliorer l'humeur, stimuler l'énergie et apporter des solutions naturelles à divers maux, ce qui en fait une approche polyvalente et holistique de la santé et du bien-être en général.\n\nLes huiles essentielles contenues dans les savons améliorent les routines de nettoyage quotidiennes en offrant une expérience sensorielle aux parfums délicieux. La synergie thérapeutique de ces extraits naturels dans nos savons nourrit à la fois le corps et l'esprit, offrant une expérience de chouchoutage."
  },
  {
    id: "handmade-industrial",
    title: "Produits artisanaux & Produits industriels",
    image: "https://dhgf5mcbrms62.cloudfront.net/86991813/customer-review-7jFZXh/YeLp9sC-600x600.webp",
    text: "Les produits artisanaux et les produits industriels fabriqués en masse représentent deux approches distinctes de la fabrication, chacune...",
    fullText: "Les produits artisanaux et les produits industriels fabriqués en masse représentent deux approches distinctes de la fabrication, chacune ayant ses propres caractéristiques. Les produits artisanaux sont fabriqués avec une attention et un soin particuliers, ce qui permet d'obtenir des articles uniques qui mettent en valeur le savoir-faire et les détails personnalisés. En revanche, les produits industriels sont généralement fabriqués à grande échelle à l'aide de processus automatisés, dans le but de garantir l'efficacité et la rentabilité, mais au détriment de la touche personnelle que l'on retrouve dans les créations artisanales.\n\nEn ce qui concerne des soins de la peau, ceux faits à la main se distinguent par leur qualité artisanale et leurs ingrédients naturels, offrant une alternative personnalisée et respectueuse de l'environnement à leurs équivalents fabriqués commercialement."
  },
  {
    id: "forget-foaming",
    title: "Oubliez le moussage !",
    image: "https://dhgf5mcbrms62.cloudfront.net/86991813/customer-review-7jFZXh/i47GUCV-600x600.webp",
    text: "L'association courante entre les bulles et le nettoyage efficace des savons est profondément ancrée dans la perception des consommateurs, ammenant à penser qu'un savon sans bulles ne lave pas...",
    fullText: "L'association courante entre les bulles et le nettoyage efficace des savons est profondément ancrée dans la perception des consommateurs, ce qui les amène souvent à penser qu'un produit n'est efficace que s'il produit une mousse substantielle. Cependant, l'efficacité d'un savon ne dépend pas uniquement de sa capacité à mousser. Les composants actifs des savons, appelés surfactants, se lient à la fois à l'eau et à l'huile, facilitant ainsi l'élimination de la saleté et de la graisse.\n\nMême si les agents moussants peuvent améliorer le processus de nettoyage, les savons artisanaux, qu'ils produisent d'abondantes bulles ou non, sont souvent considérés comme supérieurs. Les savons artisanaux utilisent généralement des ingrédients naturels et évitent les produits chimiques agressifs, offrant ainsi une expérience de nettoyage plus douce et plus nourrissante. Leurs formules sont souvent adaptées aux différents types de peau, et l'absence d'additifs synthétiques peut s'avérer particulièrement bénéfique pour les personnes à la peau sensible. En outre, le savoir-faire et le souci du détail des savons artisanaux contribuent à une expérience de soin unique et personnalisée, ce qui en fait un choix de prédilection pour les personnes à la recherche d'une routine de nettoyage saine et individualisée.",
    sourceUrl: "https://medium.com/@isabella.meibauer/why-do-we-think-soap-only-works-when-it-lathers-and-foams-e5587976e97e",
    sourceTitle: "Medium - Why do we think soap only works when it lathers and foams?"
  },
  {
    id: "you-can-diy",
    title: "Vous pouvez le faire vous-même, mais laissez-nous le faire pour vous",
    image: DIY,
    text: "Créer vos propres soins de la peau peut être amusant et créatif — une belle manière de personnaliser vos produits selon vos goûts. Cependant, cela comporte des défis majeurs...",
    fullText: "Créer vos propres soins de la peau peut être amusant et créatif — une belle manière de personnaliser vos produits selon vos goûts. Cependant, cela comporte des défis. Premièrement, la recherche nécessaire pour développer des recettes sûres et efficaces peut être accablante, exigeant des heures pour comprendre les types de peau, les interactions des ingrédients, et les formulations adéquates.\n\nDeuxièmement, trouver des ingrédients de qualité implique souvent d'acheter des quantités plus importantes que nécessaire, ce qui entraînes des dépenses inutiles et du gaspillage. Chez Vonn Essentials, nous enlevons cette charge de vos épaules en combinant passion et expertise pour créer des recettes avec les meilleurs ingrédients et des formulations précises. Alors, même si vous pouvez le faire vous-même, pourquoi ne pas nous laisser le soin de vous offrir des résultats professionnels ?"
  },
  {
    id: "natural-skincare-routine",
    title: "Comment élaborer un programme de soins naturels",
    image: skincare,
    text: "Pour mettre en place un programme de soins simple mais efficace, il faut d'abord comprendre le type de peau et choisir des produits contenant des ingrédients extrêmement doux...",
    fullText: "Pour mettre en place un programme de soins simple mais efficace, il faut d'abord comprendre le type de peau et choisir des produits contenant des ingrédients doux et respectueux de la peau, qui répondent à ses besoins. Commencez par un régime de base de nettoyage, de tonification et d'hydratation à l'aide de nettoyants à base de plantes.\n\nPar exemple, après une longue journée bien remplie, votre routine de soin du visage du soir commencera par un nettoyant Vonn Essentials, suivi de l'un de nos sprays pour le visage sans alcool, comme le spray à la fleur d'oranger. Terminez par un sérum hydratant enrichi en huiles végétales, comme le sérum à la fleur d'oranger ou le sérum à la lavande. Incorporez également des traitements hebdomadaires tels que la désintoxication avec des masques naturels et rajeunissants contenant des ingrédients tels que l'argile, afin de maintenir la vitalité de la peau. Testez toujours les nouveaux produits pour vous assurer de leur compatibilité et n'oubliez pas de protéger votre peau avec un écran solaire minéral. En utilisant régulièrement des produits comme ceux de Vonn Essentials et en vous engageant à prodiguer des soins naturels, votre peau vous remerciera en affichant un éclat sain et radieux."
  },
  {
    id: "why-small-brands",
    title: "Pourquoi soutenir les petites marques cosmétiques est important",
    image: supporting,
    text: "Gérer une petite entreprise cosmétique est une aventure enrichissante mais souvent semée d'embûches. Contrairement aux grandes marques, les petites entreprises redoublent d'efforts...",
    fullText: "Gérer une petite entreprise cosmétique est une aventure enrichissante mais souvent semée d'embûches. Contrairement aux grandes marques établies, les petites entreprises doivent redoubler d'efforts pour gagner la confiance et se faire connaître. Les clients potentiels hésitent parfois à essayer des produits simplement parce qu'ils ne leur sont pas familiers, sans se rendre compte du soin, de la qualité et de la dévotion personnelle investis dans la création de ces produits. Cette hésitation peut être décourageante, surtout pour des entrepreneurs passionnés qui consacrent tant de temps et de ressources à offrir des produits réellement bénéfiques.\n\nSoutenir les petites entreprises ne permet pas seulement aux propriétaires de réaliser leurs rêves, mais cela renforce également les communautés en encourageant la diversité et l'innovation dans l'industrie de la beauté. En choisissant de soutenir des marques comme Vonn Essentials, vous contribuez à la croissance et au succès d’individus qui mettent tout leur cœur dans chaque produit qu'ils créent.",
    sourceUrl: "https://www.theupsstore.com/small-business-services/small-business-blog/small-business-blog/2024/10/what-is-brand-awareness",
    sourceTitle: "The UPS Store - Qu'est-ce que la notoriété de marque ?"
  },
  {
    id: "hands-behind-products",
    title: "Meet les mains derrière les produits",
    image: meet,
    text: "Chez Vonn Essentials, chaque produit raconte une histoire de passion, de persévérance et d'amour pour la beauté naturelle. Fondée en 2018, cette petite entreprise...",
    fullText: "Chez Vonn Essentials, chaque produit raconte une histoire de passion, de persévérance et d'amour pour la beauté naturelle. Fondée en 2018, cette petite entreprise a été construite avec dévouement et une croyance inébranlable dans la création de soins de luxe efficaces à prix abordable.\n\nDerrière chaque savon, chaque bouteille et chaque pot se trouvent des mains qui fabriquent avec soin, innovent et surmontent les défis pour vous offrir le meilleur. En soutenant Vonn Essentials, vous n'achetez pas seulement des soins de la peau ; vous participez à un voyage porté par l'espoir, la résilience et l'engagement à embellir votre éclat naturel."
  }
];

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("vonn_lang");
    if (saved === "en" || saved === "fr") return saved;
    return "en";
  });

  const [productsEn, setProductsEn] = useState<Product[]>(() => {
    const saved = localStorage.getItem("vonn_products_en");
    if (!saved) return PRODUCTS_EN;
    try {
      const parsed = JSON.parse(saved);
      const migrated = parsed.map((p: Product) => {
        if (p.collection && p.collection.trim()) {
          if (p.collection === "Soap" || p.collection === "Face Wash" || p.collection === "Cleansers") {
            return { ...p, collection: "Soaps" };
          }
          return p;
        }
        const nameLower = p.name ? p.name.toLowerCase() : "";
        if (nameLower.includes("soap")) return { ...p, collection: "Soaps" };
        if (nameLower.includes("gift")) return { ...p, collection: "Gift Sets" };
        return { ...p, collection: "Skincare" };
      });
      localStorage.setItem("vonn_products_en", JSON.stringify(migrated));
      return migrated;
    } catch (e) {
      return PRODUCTS_EN;
    }
  });

  const [productsFr, setProductsFr] = useState<Product[]>(() => {
    const saved = localStorage.getItem("vonn_products_fr");
    if (!saved) return PRODUCTS_FR;
    try {
      const parsed = JSON.parse(saved);
      const migrated = parsed.map((p: Product) => {
        if (p.collection && p.collection.trim()) {
          if (p.collection === "Soap" || p.collection === "Face Wash" || p.collection === "Cleansers" || p.collection === "Nettoyants") {
            return { ...p, collection: "Savons" };
          }
          return p;
        }
        const nameLower = p.name ? p.name.toLowerCase() : "";
        if (nameLower.includes("savon")) return { ...p, collection: "Savons" };
        if (nameLower.includes("coffret")) return { ...p, collection: "Coffrets Cadeaux" };
        return { ...p, collection: "Soins de la peau" };
      });
      localStorage.setItem("vonn_products_fr", JSON.stringify(migrated));
      return migrated;
    } catch (e) {
      return PRODUCTS_FR;
    }
  });

  const productsEnRef = useRef<Product[]>(productsEn);
  const productsFrRef = useRef<Product[]>(productsFr);

  useEffect(() => {
    productsEnRef.current = productsEn;
  }, [productsEn]);

  useEffect(() => {
    productsFrRef.current = productsFr;
  }, [productsFr]);

  const [blogsEn, setBlogsEn] = useState<any[]>(() => {
    const saved = localStorage.getItem("vonn_blogs_en");
    return saved ? JSON.parse(saved) : BLOG_EN;
  });

  const [blogsFr, setBlogsFr] = useState<any[]>(() => {
    const saved = localStorage.getItem("vonn_blogs_fr");
    return saved ? JSON.parse(saved) : BLOG_FR;
  });

  const [shippingContentEn, setShippingContentEn] = useState<string[]>(() => {
    const saved = localStorage.getItem("vonn_shipping_content_en");
    return saved ? JSON.parse(saved) : SHIPPING_EN;
  });

  const [shippingContentFr, setShippingContentFr] = useState<string[]>(() => {
    const saved = localStorage.getItem("vonn_shipping_content_fr");
    return saved ? JSON.parse(saved) : SHIPPING_FR;
  });

  const [aboutContentEn, setAboutContentEn] = useState<string[]>(() => {
    const saved = localStorage.getItem("vonn_about_content_en");
    return saved ? JSON.parse(saved) : ABOUT_EN;
  });

  const [aboutContentFr, setAboutContentFr] = useState<string[]>(() => {
    const saved = localStorage.getItem("vonn_about_content_fr");
    return saved ? JSON.parse(saved) : ABOUT_FR;
  });

  const [heroContent, setHeroContentState] = useState<HeroContent>(() => {
    const saved = localStorage.getItem("vonn_hero_content");
    return saved ? JSON.parse(saved) : DEFAULT_HERO;
  });

  const [shippingSection, setShippingSectionState] = useState<SectionContentData>(() => {
    const saved = localStorage.getItem("vonn_shipping_section");
    if (saved) return JSON.parse(saved);
    return DEFAULT_SHIPPING_SECTION;
  });

  const [aboutSection, setAboutSectionState] = useState<SectionContentData>(() => {
    const saved = localStorage.getItem("vonn_about_section");
    if (saved) return JSON.parse(saved);
    return DEFAULT_ABOUT_SECTION;
  });

  const [adminPasscode, setAdminPasscode] = useState<string>(() => {
    return localStorage.getItem("vonn_admin_passcode") || "admin123";
  });

  const [adminEmail, setAdminEmail] = useState<string>(() => {
    return localStorage.getItem("vonn_admin_email") || "vonnessentials@gmail.com";
  });

  // Synchronize with Firestore real-time database and server API
  useEffect(() => {
    let isMounted = true;

    // 1. Real-time Firestore subscription
    const storeDocRef = doc(db, "store", "global");
    const unsubscribe = onSnapshot(
      storeDocRef,
      (snapshot) => {
        if (!isMounted) return;
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (Array.isArray(data.productsEn) && data.productsEn.length > 0) {
            productsEnRef.current = data.productsEn;
            setProductsEn(data.productsEn);
            localStorage.setItem("vonn_products_en", JSON.stringify(data.productsEn));
          }
          if (Array.isArray(data.productsFr) && data.productsFr.length > 0) {
            productsFrRef.current = data.productsFr;
            setProductsFr(data.productsFr);
            localStorage.setItem("vonn_products_fr", JSON.stringify(data.productsFr));
          }
          if (Array.isArray(data.blogsEn) && data.blogsEn.length > 0) {
            setBlogsEn(data.blogsEn);
            localStorage.setItem("vonn_blogs_en", JSON.stringify(data.blogsEn));
          }
          if (Array.isArray(data.blogsFr) && data.blogsFr.length > 0) {
            setBlogsFr(data.blogsFr);
            localStorage.setItem("vonn_blogs_fr", JSON.stringify(data.blogsFr));
          }
          if (Array.isArray(data.shippingEn) && data.shippingEn.length > 0) {
            setShippingContentEn(data.shippingEn);
            localStorage.setItem("vonn_shipping_content_en", JSON.stringify(data.shippingEn));
          }
          if (Array.isArray(data.shippingFr) && data.shippingFr.length > 0) {
            setShippingContentFr(data.shippingFr);
            localStorage.setItem("vonn_shipping_content_fr", JSON.stringify(data.shippingFr));
          }
          if (Array.isArray(data.aboutEn) && data.aboutEn.length > 0) {
            setAboutContentEn(data.aboutEn);
            localStorage.setItem("vonn_about_content_en", JSON.stringify(data.aboutEn));
          }
          if (Array.isArray(data.aboutFr) && data.aboutFr.length > 0) {
            setAboutContentFr(data.aboutFr);
            localStorage.setItem("vonn_about_content_fr", JSON.stringify(data.aboutFr));
          }
          if (data.heroContent) {
            setHeroContentState(data.heroContent);
            localStorage.setItem("vonn_hero_content", JSON.stringify(data.heroContent));
          }
          if (data.shippingSection) {
            setShippingSectionState(data.shippingSection);
            localStorage.setItem("vonn_shipping_section", JSON.stringify(data.shippingSection));
          }
          if (data.aboutSection) {
            setAboutSectionState(data.aboutSection);
            localStorage.setItem("vonn_about_section", JSON.stringify(data.aboutSection));
          }
          if (data.announcement) {
            localStorage.setItem("vonn_announcement", JSON.stringify(data.announcement));
            window.dispatchEvent(new Event("vonn_announcement_changed"));
          }
          if (Array.isArray(data.giftCodes)) {
            localStorage.setItem("vonn_gift_codes", JSON.stringify(data.giftCodes));
          }
          if (data.adminPasscode) {
            setAdminPasscode(data.adminPasscode);
            localStorage.setItem("vonn_admin_passcode", data.adminPasscode);
          }
          if (data.adminEmail) {
            setAdminEmail(data.adminEmail);
            localStorage.setItem("vonn_admin_email", data.adminEmail);
          }
        } else {
          // Document doesn't exist yet, seed with current server store rather than static defaults
          fetch("/api/store")
            .then(res => res.json())
            .then(serverStore => {
              if (serverStore && Array.isArray(serverStore.productsEn) && serverStore.productsEn.length > 0) {
                setDoc(storeDocRef, serverStore, { merge: true }).catch(e => console.warn("Firestore seed warning:", e));
              }
            })
            .catch(() => {
              setDoc(storeDocRef, {
                productsEn: PRODUCTS_EN,
                productsFr: PRODUCTS_FR,
                blogsEn: BLOG_EN,
                blogsFr: BLOG_FR,
                shippingEn: SHIPPING_EN,
                shippingFr: SHIPPING_FR,
                aboutEn: ABOUT_EN,
                aboutFr: ABOUT_FR,
                announcement: {
                  textEn: "🌿 Summer Sale: Free shipping on orders over C$35 across Canada!",
                  textFr: "🌿 Solde d'été : Livraison gratuite sur commandes de plus de 35$ au Canada !",
                  isActive: true,
                },
                giftCodes: [
                  { code: "WELCOME25", discountType: "product_percentage", discountValue: 25, description: "25% discount on products" },
                  { code: "SAVE50", discountType: "product_percentage", discountValue: 50, description: "50% discount on products" },
                  { code: "FREESHIP", discountType: "shipping_free", discountValue: 100, description: "100% free shipping" },
                  { code: "HALFSHIP", discountType: "shipping_percentage", discountValue: 50, description: "50% off shipping" },
                ],
                adminPasscode: "admin123",
                adminEmail: "vonnessentials@gmail.com",
              }, { merge: true }).catch((err) => console.warn("Seed Firestore error:", err));
            });
        }
      },
      (err) => {
        console.warn("Firestore onSnapshot error:", err);
      }
    );

    // 2. Fetch server API fallback (ensure fresh data is loaded for any client immediately)
    const fetchServerStore = async () => {
      try {
        const res = await fetch("/api/store");
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;

        if (Array.isArray(data.productsEn) && data.productsEn.length > 0) {
          productsEnRef.current = data.productsEn;
          setProductsEn(data.productsEn);
          localStorage.setItem("vonn_products_en", JSON.stringify(data.productsEn));
        }
        if (Array.isArray(data.productsFr) && data.productsFr.length > 0) {
          productsFrRef.current = data.productsFr;
          setProductsFr(data.productsFr);
          localStorage.setItem("vonn_products_fr", JSON.stringify(data.productsFr));
        }
        if (Array.isArray(data.blogsEn) && data.blogsEn.length > 0) {
          setBlogsEn(data.blogsEn);
          localStorage.setItem("vonn_blogs_en", JSON.stringify(data.blogsEn));
        }
        if (Array.isArray(data.blogsFr) && data.blogsFr.length > 0) {
          setBlogsFr(data.blogsFr);
          localStorage.setItem("vonn_blogs_fr", JSON.stringify(data.blogsFr));
        }
        if (Array.isArray(data.shippingEn) && data.shippingEn.length > 0) {
          setShippingContentEn(data.shippingEn);
          localStorage.setItem("vonn_shipping_content_en", JSON.stringify(data.shippingEn));
        }
        if (Array.isArray(data.shippingFr) && data.shippingFr.length > 0) {
          setShippingContentFr(data.shippingFr);
          localStorage.setItem("vonn_shipping_content_fr", JSON.stringify(data.shippingFr));
        }
        if (Array.isArray(data.aboutEn) && data.aboutEn.length > 0) {
          setAboutContentEn(data.aboutEn);
          localStorage.setItem("vonn_about_content_en", JSON.stringify(data.aboutEn));
        }
        if (Array.isArray(data.aboutFr) && data.aboutFr.length > 0) {
          setAboutContentFr(data.aboutFr);
          localStorage.setItem("vonn_about_content_fr", JSON.stringify(data.aboutFr));
        }
        if (data.heroContent) {
          setHeroContentState(data.heroContent);
          localStorage.setItem("vonn_hero_content", JSON.stringify(data.heroContent));
        }
        if (data.shippingSection) {
          setShippingSectionState(data.shippingSection);
          localStorage.setItem("vonn_shipping_section", JSON.stringify(data.shippingSection));
        }
        if (data.aboutSection) {
          setAboutSectionState(data.aboutSection);
          localStorage.setItem("vonn_about_section", JSON.stringify(data.aboutSection));
        }
        if (data.announcement) {
          localStorage.setItem("vonn_announcement", JSON.stringify(data.announcement));
          window.dispatchEvent(new Event("vonn_announcement_changed"));
        }
        if (Array.isArray(data.giftCodes)) {
          localStorage.setItem("vonn_gift_codes", JSON.stringify(data.giftCodes));
        }
        if (data.adminPasscode) {
          setAdminPasscode(data.adminPasscode);
          localStorage.setItem("vonn_admin_passcode", data.adminPasscode);
        }
        if (data.adminEmail) {
          setAdminEmail(data.adminEmail);
          localStorage.setItem("vonn_admin_email", data.adminEmail);
        }
      } catch {
        // Ignored
      }
    };

    fetchServerStore();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const updateShippingContent = (en: string[], fr: string[]) => {
    setShippingContentEn(en);
    setShippingContentFr(fr);
    localStorage.setItem("vonn_shipping_content_en", JSON.stringify(en));
    localStorage.setItem("vonn_shipping_content_fr", JSON.stringify(fr));

    // Update Firestore in real-time
    setDoc(doc(db, "store", "global"), { shippingEn: en, shippingFr: fr }, { merge: true }).catch((e) => console.warn(e));

    fetch("/api/content/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shippingEn: en, shippingFr: fr })
    }).catch(() => {});
  };

  const updateAboutContent = (en: string[], fr: string[]) => {
    setAboutContentEn(en);
    setAboutContentFr(fr);
    localStorage.setItem("vonn_about_content_en", JSON.stringify(en));
    localStorage.setItem("vonn_about_content_fr", JSON.stringify(fr));

    // Update Firestore in real-time
    setDoc(doc(db, "store", "global"), { aboutEn: en, aboutFr: fr }, { merge: true }).catch((e) => console.warn(e));

    fetch("/api/content/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aboutEn: en, aboutFr: fr })
    }).catch(() => {});
  };

  const getHeroContent = () => heroContent;

  const updateHeroContent = (data: Partial<HeroContent>) => {
    const updated = { ...heroContent, ...data };
    setHeroContentState(updated);
    localStorage.setItem("vonn_hero_content", JSON.stringify(updated));
    setDoc(doc(db, "store", "global"), { heroContent: updated }, { merge: true }).catch((e) => console.warn(e));
    fetch("/api/content/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ heroContent: updated })
    }).catch(() => {});
  };

  const getShippingSection = () => shippingSection;

  const updateShippingSection = (data: Partial<SectionContentData>) => {
    const updated = { ...shippingSection, ...data };
    setShippingSectionState(updated);
    if (data.contentEn) setShippingContentEn(data.contentEn);
    if (data.contentFr) setShippingContentFr(data.contentFr);
    localStorage.setItem("vonn_shipping_section", JSON.stringify(updated));
    setDoc(doc(db, "store", "global"), { shippingSection: updated, shippingEn: updated.contentEn || shippingContentEn, shippingFr: updated.contentFr || shippingContentFr }, { merge: true }).catch((e) => console.warn(e));
    fetch("/api/content/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shippingSection: updated, shippingEn: updated.contentEn || shippingContentEn, shippingFr: updated.contentFr || shippingContentFr })
    }).catch(() => {});
  };

  const getAboutSection = () => aboutSection;

  const updateAboutSection = (data: Partial<SectionContentData>) => {
    const updated = { ...aboutSection, ...data };
    setAboutSectionState(updated);
    if (data.contentEn) setAboutContentEn(data.contentEn);
    if (data.contentFr) setAboutContentFr(data.contentFr);
    localStorage.setItem("vonn_about_section", JSON.stringify(updated));
    setDoc(doc(db, "store", "global"), { aboutSection: updated, aboutEn: updated.contentEn || aboutContentEn, aboutFr: updated.contentFr || aboutContentFr }, { merge: true }).catch((e) => console.warn(e));
    fetch("/api/content/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aboutSection: updated, aboutEn: updated.contentEn || aboutContentEn, aboutFr: updated.contentFr || aboutContentFr })
    }).catch(() => {});
  };

  const getRawShippingEn = () => shippingContentEn;
  const getRawShippingFr = () => shippingContentFr;
  const getRawAboutEn = () => aboutContentEn;
  const getRawAboutFr = () => aboutContentFr;

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("vonn_lang", lang);
    document.documentElement.lang = lang;
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "fr" : "en");
  };

  const t = (key: string): string => {
    const translations = TRANSLATIONS[language];
    return (translations as any)[key] || key;
  };

  const getProducts = () => {
    return language === "en" ? productsEn : productsFr;
  };

  const getShippingContent = () => {
    return language === "en" ? shippingContentEn : shippingContentFr;
  };

  const getAboutContent = () => {
    return language === "en" ? aboutContentEn : aboutContentFr;
  };

  const getBlogPosts = () => {
    return language === "en" ? blogsEn : blogsFr;
  };

  const addBlogPost = (postEn: any, postFr: any) => {
    const newEn = [postEn, ...blogsEn];
    const newFr = [postFr, ...blogsFr];
    setBlogsEn(newEn);
    setBlogsFr(newFr);
    localStorage.setItem("vonn_blogs_en", JSON.stringify(newEn));
    localStorage.setItem("vonn_blogs_fr", JSON.stringify(newFr));

    // Update Firestore in real-time
    setDoc(doc(db, "store", "global"), { blogsEn: newEn, blogsFr: newFr }, { merge: true }).catch((e) => console.warn(e));

    fetch("/api/blogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postEn, postFr })
    }).catch(e => console.error("Error syncing blog addition:", e));
  };

  const updateBlogPost = (id: string, postEn: any, postFr: any) => {
    const newEn = blogsEn.map((b) => (b.id === id ? postEn : b));
    const newFr = blogsFr.map((b) => (b.id === id ? postFr : b));
    setBlogsEn(newEn);
    setBlogsFr(newFr);
    localStorage.setItem("vonn_blogs_en", JSON.stringify(newEn));
    localStorage.setItem("vonn_blogs_fr", JSON.stringify(newFr));

    // Update Firestore in real-time
    setDoc(doc(db, "store", "global"), { blogsEn: newEn, blogsFr: newFr }, { merge: true }).catch((e) => console.warn(e));

    fetch(`/api/blogs/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postEn, postFr })
    }).catch(() => {});
  };

  const deleteBlogPost = (id: string) => {
    const newEn = blogsEn.filter((b) => b.id !== id);
    const newFr = blogsFr.filter((b) => b.id !== id);
    setBlogsEn(newEn);
    setBlogsFr(newFr);
    localStorage.setItem("vonn_blogs_en", JSON.stringify(newEn));
    localStorage.setItem("vonn_blogs_fr", JSON.stringify(newFr));

    // Update Firestore in real-time
    setDoc(doc(db, "store", "global"), { blogsEn: newEn, blogsFr: newFr }, { merge: true }).catch((e) => console.warn(e));

    fetch(`/api/blogs/${encodeURIComponent(id)}`, {
      method: "DELETE"
    }).catch(() => {});
  };

  const getAllBlogsEn = () => blogsEn;
  const getAllBlogsFr = () => blogsFr;

  const updateAdminPasscode = (newPass: string) => {
    setAdminPasscode(newPass);
    localStorage.setItem("vonn_admin_passcode", newPass);
    updateDoc(doc(db, "store", "global"), { adminPasscode: newPass }).catch(e => console.warn(e));
  };

  const updateAdminEmail = (newEmail: string) => {
    const trimmed = newEmail.trim().toLowerCase();
    setAdminEmail(trimmed);
    localStorage.setItem("vonn_admin_email", trimmed);
    updateDoc(doc(db, "store", "global"), { adminEmail: trimmed }).catch(e => console.warn(e));
  };

  const addProduct = (productEn: Product, productFr: Product) => {
    const currentEn = productsEnRef.current && productsEnRef.current.length > 0 ? productsEnRef.current : productsEn;
    const currentFr = productsFrRef.current && productsFrRef.current.length > 0 ? productsFrRef.current : productsFr;

    const sanitizedFr: Product = {
      ...productEn,
      ...productFr,
      name: productFr.name?.trim() || productEn.name,
      price: productFr.price?.trim() || productEn.price,
      discountPrice: productFr.discountPrice || productEn.discountPrice,
      weight: productFr.weight?.trim() || productEn.weight,
      image: productFr.image?.trim() || productEn.image,
      description: productFr.description?.trim() || productEn.description,
      collection: productFr.collection || (productEn.collection === "Soaps" ? "Savons" : productEn.collection === "Gift Sets" ? "Coffrets Cadeaux" : productEn.collection === "Hair Care" ? "Soins des cheveux" : "Soins de la peau")
    };

    const updatedEn = [...currentEn.filter(p => p.id !== productEn.id), productEn];
    const updatedFr = [...currentFr.filter(p => p.id !== productEn.id), sanitizedFr];

    productsEnRef.current = updatedEn;
    productsFrRef.current = updatedFr;

    setProductsEn(updatedEn);
    setProductsFr(updatedFr);
    localStorage.setItem("vonn_products_en", JSON.stringify(updatedEn));
    localStorage.setItem("vonn_products_fr", JSON.stringify(updatedFr));

    // 1. Instantly persist to Firestore
    setDoc(doc(db, "store", "global"), {
      productsEn: updatedEn,
      productsFr: updatedFr
    }, { merge: true }).catch((e) => console.warn("Firestore addProduct error:", e));

    // 2. Persist to server backend store
    fetch("/api/products/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productsEn: updatedEn, productsFr: updatedFr })
    }).catch((e) => console.warn("Server sync error:", e));
  };

  const updateProduct = (id: number, productEn: Product, productFr: Product) => {
    const currentEn = productsEnRef.current && productsEnRef.current.length > 0 ? productsEnRef.current : productsEn;
    const currentFr = productsFrRef.current && productsFrRef.current.length > 0 ? productsFrRef.current : productsFr;

    const sanitizedFr: Product = {
      ...productEn,
      ...productFr,
      name: productFr.name?.trim() || productEn.name,
      price: productFr.price?.trim() || productEn.price,
      discountPrice: productFr.discountPrice || productEn.discountPrice,
      weight: productFr.weight?.trim() || productEn.weight,
      image: productFr.image?.trim() || productEn.image,
      description: productFr.description?.trim() || productEn.description,
      collection: productFr.collection || (productEn.collection === "Soaps" ? "Savons" : productEn.collection === "Gift Sets" ? "Coffrets Cadeaux" : productEn.collection === "Hair Care" ? "Soins des cheveux" : "Soins de la peau")
    };

    const updatedEn = currentEn.map((p) => (p.id === id ? productEn : p));
    const updatedFr = currentFr.map((p) => (p.id === id ? sanitizedFr : p));

    productsEnRef.current = updatedEn;
    productsFrRef.current = updatedFr;

    setProductsEn(updatedEn);
    setProductsFr(updatedFr);
    localStorage.setItem("vonn_products_en", JSON.stringify(updatedEn));
    localStorage.setItem("vonn_products_fr", JSON.stringify(updatedFr));

    // Sync to Firestore
    setDoc(doc(db, "store", "global"), {
      productsEn: updatedEn,
      productsFr: updatedFr
    }, { merge: true }).catch((e) => console.warn("Firestore updateProduct error:", e));

    // Sync to Server
    fetch("/api/products/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productsEn: updatedEn, productsFr: updatedFr })
    }).catch((e) => console.warn("Server sync error:", e));
  };

  const deleteProduct = (id: number) => {
    const currentEn = productsEnRef.current && productsEnRef.current.length > 0 ? productsEnRef.current : productsEn;
    const currentFr = productsFrRef.current && productsFrRef.current.length > 0 ? productsFrRef.current : productsFr;

    const updatedEn = currentEn.filter((p) => p.id !== id);
    const updatedFr = currentFr.filter((p) => p.id !== id);

    productsEnRef.current = updatedEn;
    productsFrRef.current = updatedFr;

    setProductsEn(updatedEn);
    setProductsFr(updatedFr);
    localStorage.setItem("vonn_products_en", JSON.stringify(updatedEn));
    localStorage.setItem("vonn_products_fr", JSON.stringify(updatedFr));

    // Sync to Firestore
    setDoc(doc(db, "store", "global"), {
      productsEn: updatedEn,
      productsFr: updatedFr
    }, { merge: true }).catch((e) => console.warn("Firestore deleteProduct error:", e));

    // Sync to Server
    fetch("/api/products/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productsEn: updatedEn, productsFr: updatedFr })
    }).catch((e) => console.warn("Server sync error:", e));
  };

  const getAllProductsEn = () => (productsEnRef.current && productsEnRef.current.length > 0 ? productsEnRef.current : productsEn);
  const getAllProductsFr = () => (productsFrRef.current && productsFrRef.current.length > 0 ? productsFrRef.current : productsFr);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        getProducts,
        getShippingContent,
        getAboutContent,
        getBlogPosts,
        addBlogPost,
        updateBlogPost,
        deleteBlogPost,
        getAllBlogsEn,
        getAllBlogsFr,
        addProduct,
        updateProduct,
        deleteProduct,
        getAllProductsEn,
        getAllProductsFr,
        updateShippingContent,
        updateAboutContent,
        getRawShippingEn,
        getRawShippingFr,
        getRawAboutEn,
        getRawAboutFr,
        getHeroContent,
        updateHeroContent,
        getShippingSection,
        updateShippingSection,
        getAboutSection,
        updateAboutSection,
        adminPasscode,
        updateAdminPasscode,
        adminEmail,
        updateAdminEmail
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
