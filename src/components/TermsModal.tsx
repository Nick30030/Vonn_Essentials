import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useRef } from "react";
import { X, Scale, ShieldAlert, FileText, Printer, Shield } from "lucide-react";
import { useLanguage } from "./LanguageContext";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "terms" | "privacy";
}

export default function TermsModal({ isOpen, onClose, initialTab = "terms" }: TermsModalProps) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">(initialTab);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync activeTab whenever the modal receives a new initialTab prop
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  // Scroll to top of content when tab changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    if (activeTab === "terms") {
      printWindow.document.write(`
        <html>
          <head>
            <title>Vonn Essentials - Terms & Conditions</title>
            <style>
              body { font-family: 'Times New Roman', Times, serif; padding: 40px; color: #111; line-height: 1.6; }
              h1 { text-align: center; margin-bottom: 30px; font-size: 24px; text-transform: uppercase; }
              h2 { margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; font-size: 18px; }
              h3 { font-size: 14px; margin-top: 20px; }
              p { font-size: 12px; margin-bottom: 15px; text-align: justify; }
              ul { font-size: 12px; }
              .meta { text-align: center; margin-bottom: 40px; }
            </style>
          </head>
          <body>
            <h1>Vonn Essentials - Terms & Conditions</h1>
            <div class="meta">Dated: 06/28/2023 | All prices are in Canadian Dollars (CAD)</div>
            
            <h2>1. INTRODUCTION</h2>
            <h3>1.1 Acceptance of Terms and Conditions of Use</h3>
            <p>IMPORTANT! YOUR ACCESS TO THIS WEBSITE IS SUBJECT TO THESE GENERAL TERMS AND CONDITIONS OF USE. CAREFULLY READ ALL OF THE FOLLOWING TERMS AND CONDITIONS OF USE BEFORE PROCEEDING. ACCESSING THIS WEBSITE IS THE EQUIVALENT OF YOUR SIGNATURE AND INDICATES YOUR ACCEPTANCE OF THESE TERMS AND CONDITIONS AND THAT YOU INTEND TO BE LEGALLY BOUND BY THEM.</p>
            <p>These general terms and conditions of use (the "Terms of Use") constitute a legal agreement between you and Vonn Essentials (the "Company").</p>
            <h3>1.2 Amendment of Terms of Use</h3>
            <p>These Terms of Use are dated 06/28/2023. The Company reserves the right in its sole discretion to amend these Terms of Use at any time.</p>

            <h2>2. YOUR USE OF AND CONDUCT ON THE WEBSITE</h2>
            <h3>2.1 Nature of Use</h3>
            <p>The Website is for Your personal and non-commercial use only. You agree that You will only access or use the Website for lawful purposes.</p>
            <h3>2.2 User Generated Content</h3>
            <p>You are entirely responsible for all User Generated Content You submit, post, publish, display, or otherwise transmit on or through the Website.</p>
            <h3>2.3 Ordering and Purchases</h3>
            <p>All prices quoted on the Website, including the prices for products and shipping, are in Canadian dollars (CAD) unless otherwise explicitly stated.</p>

            <h2>3. INTELLECTUAL PROPERTY RIGHTS AND OWNERSHIP</h2>
            <p>The Website and all the content of the Website are owned by the Company, its licensors, or other providers and are protected in all forms by intellectual property laws.</p>

            <h2>4. ENFORCEMENT, SUSPENSION, AND TERMINATION</h2>
            <p>The Company may in its sole discretion for any or no reason, with or without notice, and at any time terminate these Terms of Use.</p>

            <h2>5. INDEMNITY</h2>
            <p>You agree to indemnify, defend, and hold harmless the Company, its agents, affiliates, and partners from any claims, actions, damages, losses, or fees.</p>

            <h2>6. LIMITATIONS ON LIABILITY AND DISCLAIMER</h2>
            <h3>6.1 Limitations on Liability</h3>
            <p>LIABILITY IS LIMITED TO THE GREATER OF: THE TOTAL FEES MADE TO THE COMPANY IN THE 12 MONTHS PRIOR, OR $150 CAD.</p>
            <h3>6.2 Availability, Completeness, and Quality</h3>
            <p>The Website is provided on an "as is" and "as available" basis, without any warranties of any kind.</p>

            <h2>7. RELEASE</h2>
            <p>If You have a dispute with one or more other users of the Website, You release the Company, its affiliates, and licensors.</p>

            <h2>8. PRIVACY</h2>
            <p>The use by the Company of Your personal information is governed by the Company's privacy policy.</p>

            <h2>9. GENERAL</h2>
            <p>These Terms of Use shall be governed by and construed in accordance with the laws of the Province of Ontario and the federal laws of Canada applicable therein.</p>
          </body>
        </html>
      `);
    } else {
      printWindow.document.write(`
        <html>
          <head>
            <title>Vonn Essentials - Privacy Policy</title>
            <style>
              body { font-family: 'Times New Roman', Times, serif; padding: 40px; color: #111; line-height: 1.6; }
              h1 { text-align: center; margin-bottom: 30px; font-size: 24px; text-transform: uppercase; }
              h2 { margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; font-size: 18px; }
              p { font-size: 12px; margin-bottom: 15px; text-align: justify; }
              ul { font-size: 12px; }
              .meta { text-align: center; margin-bottom: 40px; }
            </style>
          </head>
          <body>
            <h1>Vonn Essentials - Privacy Policy</h1>
            <div class="meta">Last Amended: 06/28/2023 | Protecting Personal Information</div>
            
            <h2>1. INTRODUCTION</h2>
            <p>Vonn Essentials respects your privacy. This Privacy Policy describes how the Company collects, uses, maintains, discloses, and protects Personal Information, as well as the rights and choices You have regarding Your Personal Information.</p>

            <h2>2. TYPES OF PERSONAL INFORMATION COLLECTED</h2>
            <p>Information collected may include name, contact info, billing/delivery details, device/IP details, and browsing patterns.</p>

            <h2>3. METHODS FOR COLLECTING PERSONAL INFORMATION</h2>
            <p>Directly provided by You through forms/feedback, or collected automatically using technological means such as cookies.</p>

            <h2>4. USING AND DISCLOSING PERSONAL INFORMATION</h2>
            <p>Used to provide, customize, measure, and improve services, deliver promotions, and protect site security. Aggregated info does not sell.</p>

            <h2>5. ACCESS AND CORRECTION</h2>
            <p>You have the right to access Your Personal Information and request correction to ensure accuracy.</p>

            <h2>6. DATA SECURITY</h2>
            <p>The Company maintains physical, organizational, and technological safeguards to protect Your private information.</p>

            <h2>7. CHANGES TO THE PRIVACY POLICY</h2>
            <p>The Company reserves the right to amend this Privacy Policy. Continued use indicates acceptance.</p>

            <h2>8. CONTACT INFORMATION & COMPLIANCE</h2>
            <p>Privacy officer email address: customerservice@vonnessentials.com</p>
          </body>
        </html>
      `);
    }
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 md:p-10">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-5xl h-[88vh] bg-white rounded-[32px] shadow-2xl flex flex-col overflow-hidden border border-gray-100 z-10"
          >
            {/* Header */}
            <div className="px-6 sm:px-8 py-5 border-b border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between bg-gray-50/50 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-accent/10 rounded-2xl text-brand-accent">
                  {activeTab === "terms" ? (
                    <Scale size={22} className="stroke-[1.75]" />
                  ) : (
                    <Shield size={22} className="stroke-[1.75]" />
                  )}
                </div>
                <div className="text-left">
                  <h2 className="font-sans font-bold text-gray-900 tracking-tight text-lg uppercase">
                    {activeTab === "terms" 
                      ? (language === "en" ? "Terms & Conditions" : "Conditions Générales")
                      : (language === "en" ? "Privacy Policy" : "Politique de Confidentialité")}
                  </h2>
                  <p className="font-sans font-semibold text-[11px] uppercase tracking-widest text-brand-accent/80">
                    Vonn Essentials · {activeTab === "terms" 
                      ? (language === "en" ? "Official Store Rules" : "Règles Officielles de la Boutique")
                      : (language === "en" ? "Data Protection Rules" : "Protection des Données Personnelles")}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                {/* Elegant Tab Toggles inside Header */}
                <div className="flex p-0.5 bg-gray-200/60 rounded-full font-sans text-xs font-bold gap-0.5">
                  <button
                    onClick={() => setActiveTab("terms")}
                    className={`px-4 sm:px-5 py-2 rounded-full transition-all duration-300 uppercase tracking-wider text-[9px] ${
                      activeTab === "terms" 
                        ? "bg-white text-gray-900 shadow-sm" 
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {language === "en" ? "Terms" : "Conditions"}
                  </button>
                  <button
                    onClick={() => setActiveTab("privacy")}
                    className={`px-4 sm:px-5 py-2 rounded-full transition-all duration-300 uppercase tracking-wider text-[9px] ${
                      activeTab === "privacy" 
                        ? "bg-white text-gray-900 shadow-sm" 
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {language === "en" ? "Privacy" : "Vie Privée"}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Print button */}
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 font-sans font-bold text-[10px] uppercase tracking-widest rounded-full transition-all duration-300 shadow-sm"
                    title={language === "en" ? "Print Details" : "Imprimer le document"}
                  >
                    <Printer size={12} />
                    <span className="hidden sm:inline">{language === "en" ? "Print" : "Imprimer"}</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-300"
                  >
                    <X size={20} className="stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>

            {/* Split Panel Body */}
            <div className="flex-grow flex overflow-hidden">
              {/* Sidebar Quick Navigation */}
              <div className="hidden md:block w-72 bg-gray-50/70 border-r border-gray-100 p-8 overflow-y-auto font-sans">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">
                  {language === "en" ? "Sections navigation" : "Navigation des sections"}
                </p>
                
                {activeTab === "terms" ? (
                  <nav className="space-y-1.5 text-left text-xs font-semibold">
                    <a href="#id-intro" className="block p-2.5 text-gray-600 hover:text-brand-accent hover:bg-brand-accent/5 rounded-xl transition-all">
                      1. Introduction
                    </a>
                    <a href="#id-conduct" className="block p-2.5 text-gray-600 hover:text-brand-accent hover:bg-brand-accent/5 rounded-xl transition-all">
                      2. Conduct & Purchases
                    </a>
                    <a href="#id-ip" className="block p-2.5 text-gray-600 hover:text-brand-accent hover:bg-brand-accent/5 rounded-xl transition-all">
                      3. Intellectual Property
                    </a>
                    <a href="#id-termination" className="block p-2.5 text-gray-600 hover:text-brand-accent hover:bg-brand-accent/5 rounded-xl transition-all">
                      4. Termination Clause
                    </a>
                    <a href="#id-indemnity" className="block p-2.5 text-gray-600 hover:text-brand-accent hover:bg-brand-accent/5 rounded-xl transition-all">
                      5. Indemnification
                    </a>
                    <a href="#id-liability" className="block p-2.5 text-gray-600 hover:text-brand-accent hover:bg-brand-accent/5 rounded-xl transition-all">
                      6. Liability & Disclaimer
                    </a>
                    <a href="#id-release" className="block p-2.5 text-gray-600 hover:text-brand-accent hover:bg-brand-accent/5 rounded-xl transition-all">
                      7. User Disputes Release
                    </a>
                    <a href="#id-privacy-ref" className="block p-2.5 text-gray-600 hover:text-brand-accent hover:bg-brand-accent/5 rounded-xl transition-all">
                      8. Privacy Policy Statement
                    </a>
                    <a href="#id-general" className="block p-2.5 text-gray-600 hover:text-brand-accent hover:bg-brand-accent/5 rounded-xl transition-all">
                      9. General Provisions
                    </a>
                  </nav>
                ) : (
                  <nav className="space-y-1.5 text-left text-xs font-semibold">
                    <a href="#id-priv-intro" className="block p-2.5 text-gray-600 hover:text-brand-accent hover:bg-brand-accent/5 rounded-xl transition-all">
                      1. Introduction
                    </a>
                    <a href="#id-priv-types" className="block p-2.5 text-gray-600 hover:text-brand-accent hover:bg-brand-accent/5 rounded-xl transition-all">
                      2. Types of Info Collected
                    </a>
                    <a href="#id-priv-methods" className="block p-2.5 text-gray-600 hover:text-brand-accent hover:bg-brand-accent/5 rounded-xl transition-all">
                      3. Methods of Collection
                    </a>
                    <a href="#id-priv-usage" className="block p-2.5 text-gray-600 hover:text-brand-accent hover:bg-brand-accent/5 rounded-xl transition-all">
                      4. Usage & Disclosure
                    </a>
                    <a href="#id-priv-access" className="block p-2.5 text-gray-600 hover:text-brand-accent hover:bg-brand-accent/5 rounded-xl transition-all">
                      5. Access & Corrections
                    </a>
                    <a href="#id-priv-security" className="block p-2.5 text-gray-600 hover:text-brand-accent hover:bg-brand-accent/5 rounded-xl transition-all">
                      6. Data Safeguards
                    </a>
                    <a href="#id-priv-changes" className="block p-2.5 text-gray-600 hover:text-brand-accent hover:bg-brand-accent/5 rounded-xl transition-all">
                      7. Policy Updates
                    </a>
                    <a href="#id-priv-officer" className="block p-2.5 text-gray-600 hover:text-brand-accent hover:bg-brand-accent/5 rounded-xl transition-all">
                      8. Privacy Officer
                    </a>
                  </nav>
                )}

                <div className="mt-8 pt-6 border-t border-gray-100 p-2.5 bg-brand-accent/[0.02] border border-brand-accent/5 rounded-2xl">
                  <div className="flex items-center gap-1.5 text-brand-accent font-bold text-[9px] uppercase tracking-widest mb-1">
                    <ShieldAlert size={12} />
                    <span>{language === "en" ? "Official Notice" : "Mentions légales"}</span>
                  </div>
                  <p className="text-gray-400 font-serif leading-relaxed text-[10px] text-justify">
                    {activeTab === "terms" ? (
                      language === "en" 
                        ? "These terms constitute a legally binding agreement governing your transactions and use of our online products."
                        : "Ces conditions forment un accord juridiquement contraignant encadrant vos achats et votre navigation sur la boutique."
                    ) : (
                      language === "en"
                        ? "We respect your personal privacy boundaries. None of your skin preferences or checkout logs are sold to advertisers."
                        : "Nous protégeons scrupuleusement votre confidentialité. Les données nominatives ne font l'objet d'aucune vente commerciale."
                    )}
                  </p>
                </div>
              </div>

              {/* Scrollable Document Area */}
              <div 
                ref={containerRef}
                className="flex-grow overflow-y-auto p-6 sm:p-12 font-serif text-[#333] leading-relaxed text-[13px] text-left scroll-smooth"
              >
                {activeTab === "terms" ? (
                  /* TERMS & CONDITIONS TAB CONTENT */
                  <div>
                    {/* Intro warning banner for Terms */}
                    <div className="mb-10 p-5 bg-red-50/75 rounded-3xl border border-red-100/50 space-y-3">
                      <div className="flex items-center gap-2 text-red-800 font-sans font-bold uppercase tracking-widest text-[10px]">
                        <ShieldAlert size={14} />
                        <span>{language === "en" ? "Attention Needed" : "Lecture Importante Obligatoire"}</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed font-serif text-[12px] text-justify">
                        {language === "en" ? (
                          <>
                            <strong>IMPORTANT!</strong> YOUR ACCESS TO THIS WEBSITE IS SUBJECT TO THESE GENERAL TERMS AND CONDITIONS OF USE. CAREFULLY READ ALL OF THE FOLLOWING TERMS AND CONDITIONS OF USE BEFORE PROCEEDING. ACCESSING THIS WEBSITE IS THE EQUIVALENT OF YOUR SIGNATURE AND INDICATES YOUR ACCEPTANCE OF THESE TERMS AND CONDITIONS.
                          </>
                        ) : (
                          <>
                            <strong>IMPORTANT !</strong> VOTRE ACCÈS À CE SITE WEB EST ASSUJETTI À CES CONDITIONS GÉNÉRALES D'UTILISATION. VEUILLEZ LIRE ATTENTIVEMENT TOUTES LES CONDITIONS AVANT DE CONTINUER. L'ACCÈS À CE SITE S'ASSIMILE À VOTRE SIGNATURE ET SIGNIFIE VOTRE ACCORD.
                          </>
                        )}
                      </p>
                    </div>

                    <div className="space-y-10">
                      <section id="id-intro" className="scroll-mt-6">
                        <h3 className="font-sans font-bold text-gray-950 text-base uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                          <span className="p-1 px-2 bg-gray-100 rounded text-gray-800 font-mono text-xs">1</span>
                          <span>1. INTRODUCTION</span>
                        </h3>
                        
                        <div className="space-y-4">
                          <h4 className="font-sans font-bold text-gray-900 text-[11px] uppercase tracking-wider">
                            1.1 Acceptance of Terms and Conditions of Use
                          </h4>
                          <p className="text-gray-600 text-justify">
                            These general terms and conditions of use (the "Terms of Use") constitute a legal agreement between you ("You" and "Your") and Vonn Essentials (the "Company") governing Your use of Vonn Essentials and all associated web pages owned by the Company (collectively, the "Website"). "We" and "Us" means both You and the Company. By accessing or using the Website or otherwise indicating Your consent to these Terms of Use, You agree to be bound by these Terms of Use and the documents referred to herein. If You do not agree with or accept any of the terms of these Terms of Use, You should cease using the Website immediately. These electronic Terms of Use shall be the equivalent of a written paper agreement between Us.
                          </p>
                          <p className="text-gray-600 text-justify">
                            By using the Website, You represent and warrant that You are the legal age of majority under applicable law to form a binding contract with the Company.
                          </p>

                          <h4 className="font-sans font-bold text-gray-900 text-[11px] uppercase tracking-wider pt-2">
                            1.2 Amendment of Terms of Use
                          </h4>
                          <p className="text-gray-600 text-justify">
                            These Terms of Use are dated 06/28/2023. The Company reserves the right in its sole discretion to amend these Terms of Use for any or no reason, at any time, and from time to time. Any and all such amendments will be effective from the date they are published and will apply to all access to or continued use of the Website.
                          </p>
                        </div>
                      </section>

                      <section id="id-conduct" className="scroll-mt-6">
                        <h3 className="font-sans font-bold text-gray-950 text-base uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                          <span className="p-1 px-2 bg-gray-100 rounded text-gray-800 font-mono text-xs">2</span>
                          <span>2. YOUR USE OF AND CONDUCT ON THE WEBSITE</span>
                        </h3>

                        <div className="space-y-4">
                          <h4 className="font-sans font-bold text-gray-900 text-[11px] uppercase tracking-wider">
                            2.1 Nature of Use
                          </h4>
                          <p className="text-gray-600 text-justify">
                            The Website is for Your personal and non-commercial use only. You agree that You will only access or use the Website for lawful purposes and in accordance with these Terms of Use. As a condition of Your access to and use of the Website, You warrant and agree that You will not use or access the Website to:
                          </p>
                          <ul className="list-disc pl-6 space-y-2 text-gray-600 text-justify">
                            <li>Violate or promote the violation of any government-imposed restriction or rule or of any third-party's rights;</li>
                            <li>Impersonate any person or entity, misrepresent Your affiliation with a person or entity, or do any other thing or act that brings the Company into disrepute;</li>
                            <li>Distribute viruses, malware, or any other technologies that are malicious or that may harm the Company, the Website, or other users;</li>
                            <li>Reverse engineer, decompile, copy, modify, distribute, transmit, license, sub-license, sell, or otherwise exploit the Website IP except as permitted by the Company.</li>
                          </ul>

                          <h4 className="font-sans font-bold text-gray-900 text-[11px] uppercase tracking-wider pt-2">
                            2.2 User Generated Content
                          </h4>
                          <p className="text-gray-600 text-justify">
                            You are entirely responsible for all User Generated Content You submit, post, publish, display, or otherwise transmit on or through the Website. The Company is not responsible or legally liable to any third party for the content or accuracy of any User Generated Content. By submitting any content, You grant the Company a worldwide, royalty-free, perpetual, irrevocable, non-exclusive license to use, reproduce, modify, display, and distribute such materials.
                          </p>

                          <h4 className="font-sans font-bold text-gray-900 text-[11px] uppercase tracking-wider pt-2">
                            2.3 Ordering and Purchases
                          </h4>
                          <p className="text-gray-600 text-justify">
                            By selecting a product, quantity, colour, and/or any other features, providing Your payment method, and completing checkout, You place an order. Order confirmations do not constitute an acceptance of Your order. The Company reserves the right to accept or reject any order prior to shipment.
                          </p>
                          <p className="text-gray-600 text-justify">
                            All prices quoted on the Website, including the prices for products and shipping, are in <strong>Canadian dollars (CAD)</strong> unless otherwise explicitly stated. You agree to pay the Company the total amount set-out at the time You confirm Your order.
                          </p>
                        </div>
                      </section>

                      <section id="id-ip" className="scroll-mt-6">
                        <h3 className="font-sans font-bold text-gray-950 text-base uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                          <span className="p-1 px-2 bg-gray-100 rounded text-gray-800 font-mono text-xs">3</span>
                          <span>3. INTELLECTUAL PROPERTY RIGHTS AND OWNERSHIP</span>
                        </h3>
                        <p className="text-gray-600 text-justify">
                          The Website and all content of the Website (including information, databases, graphics, interfaces, code, logos, product names, company names) are owned by the Company, its licensors, or other providers, and are protected in all forms by copyright, trademark, patent, and other intellectual property laws. The Company grants You a personal, revocable, non-transferable, and non-exclusive license to access and read the Website IP.
                        </p>
                      </section>

                      <section id="id-termination" className="scroll-mt-6">
                        <h3 className="font-sans font-bold text-gray-950 text-base uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                          <span className="p-1 px-2 bg-gray-100 rounded text-gray-800 font-mono text-xs">4</span>
                          <span>4. ENFORCEMENT, SUSPENSION, AND TERMINATION</span>
                        </h3>
                        <p className="text-gray-600 text-justify">
                          The Company may in its sole discretion for any or no reason, with or without notice, and at any time terminate these Terms of Use, limit, suspend, or terminate Your access to or use of the Website, and remove or otherwise modify any User Generated Content.
                        </p>
                      </section>

                      <section id="id-indemnity" className="scroll-mt-6">
                        <h3 className="font-sans font-bold text-gray-950 text-base uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                          <span className="p-1 px-2 bg-gray-100 rounded text-gray-800 font-mono text-xs">5</span>
                          <span>5. INDEMNITY</span>
                        </h3>
                        <p className="text-gray-600 text-justify">
                          To the maximum extent permitted by applicable law, You agree at all times to indemnify, defend, and hold harmless the Company, its agents, affiliates, partners, and its and their respective directors, officers, employees, agents, service providers, contractors, licensors, suppliers, successors, and assigns from and against any claims, actions, proceedings, demands, liabilities, damages, judgments, awards, losses, costs, expenses, or fees arising out of or relating to Your breach of these Terms of Use.
                        </p>
                      </section>

                      <section id="id-liability" className="scroll-mt-6">
                        <h3 className="font-sans font-bold text-gray-950 text-base uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                          <span className="p-1 px-2 bg-gray-100 rounded text-gray-800 font-mono text-xs">6</span>
                          <span>6. LIMITATIONS ON LIABILITY AND DISCLAIMER</span>
                        </h3>
                        
                        <div className="space-y-4">
                          <h4 className="font-sans font-bold text-gray-900 text-[11px] uppercase tracking-wider">
                            6.1 Limitations on Liability
                          </h4>
                          <p className="text-gray-600 text-justify font-sans text-xs uppercase leading-relaxed bg-gray-50 p-4 border border-gray-100 rounded-2xl">
                            EXCEPT TO THE EXTENT PERMITTED BY LAW, IN NO EVENT WILL THE COMPANY, ITS AFFILIATES, AGENTS, LICENSORS, SUPPLIERS, OR THEIR RESPECTIVE DIRECTORS, OFFICERS, EMPLOYEES BE LIABLE FOR ANY SPECIAL, INDIRECT, INCIDENTAL, PUNITIVE, EXEMPLARY, AGGRAVATED, ECONOMIC, OR CONSEQUENTIAL DAMAGES, HOWSOEVER CAUSED, RESULTING FROM YOUR USE OF OR INABILITY TO USE THE WEBSITE. LIABILITY IS LIMITED TO THE GREATER OF: THE TOTAL FEES SUCH PARTY MADE TO THE COMPANY IN THE 12 MONTHS PRIOR TO THE ACTION, AND $150 CAD.
                          </p>

                          <h4 className="font-sans font-bold text-gray-900 text-[11px] uppercase tracking-wider pt-2">
                            6.2 Availability, Completeness, and Quality
                          </h4>
                          <p className="text-gray-600 text-justify">
                            You understand and agree that the Website and any content thereon are provided on an "as is" and "as available" basis, without any warranties of any kind, either express or implied, including without limitation the implied warranties of merchantability, fitness for a particular purpose, or non-infringement.
                          </p>

                          <h4 className="font-sans font-bold text-gray-900 text-[11px] uppercase tracking-wider pt-2">
                            6.3 Downloads & Third-Party links
                          </h4>
                          <p className="text-gray-600 text-justify">
                            The Company does not guarantee or warrant that files or data available for downloading on, through, or as a result of the Website will be free of viruses or other destructive code. Clicking any links to third-party sites from the Website is done entirely at Your own risk.
                          </p>
                        </div>
                      </section>

                      <section id="id-release" className="scroll-mt-6">
                        <h3 className="font-sans font-bold text-gray-950 text-base uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                          <span className="p-1 px-2 bg-gray-100 rounded text-gray-800 font-mono text-xs">7</span>
                          <span>7. RELEASE</span>
                        </h3>
                        <p className="text-gray-600 text-justify">
                          If You have a dispute with one or more other users of the Website, You release the Company, its affiliates, and licensors (and its and their directors, officers, employees, agents, and subsidiaries) from any claims, demands, and damages (actual and consequential) of every kind and nature, known and unknown, arising out of or in any way connected with such disputes.
                        </p>
                      </section>

                      <section id="id-privacy-ref" className="scroll-mt-6">
                        <h3 className="font-sans font-bold text-gray-950 text-base uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                          <span className="p-1 px-2 bg-gray-100 rounded text-gray-800 font-mono text-xs">8</span>
                          <span>8. PRIVACY POLICY REFERRAL</span>
                        </h3>
                        <p className="text-gray-600 text-justify">
                          The use by the Company of Your personal information is governed by the Company’s Privacy Policy. You can access it by clicking the <strong>Privacy</strong> tab at the top of this dialog window. By using the Company's Website or by submitting Your personal information on or through the Website, You consent to the collection, use, and disclosure of Your personal information in accordance with the terms of our Privacy Policy.
                        </p>
                      </section>

                      <section id="id-general" className="scroll-mt-6">
                        <h3 className="font-sans font-bold text-gray-950 text-base uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                          <span className="p-1 px-2 bg-gray-100 rounded text-gray-800 font-mono text-xs">9</span>
                          <span>9. GENERAL</span>
                        </h3>
                        
                        <div className="space-y-4">
                          <h4 className="font-sans font-bold text-gray-900 text-[11px] uppercase tracking-wider">
                            9.2 Governing Law, Jurisdiction, and Attornment
                          </h4>
                          <p className="text-gray-600 text-justify">
                            These Terms of Use shall be governed by and construed in accordance with the laws of the Province of Ontario and the federal laws of Canada applicable therein, without giving effect to any choice of law provision, principle, or rule, and notwithstanding Your domicile, residence, or physical location.
                          </p>
                          <p className="text-gray-600 text-justify">
                            For the purpose of all legal proceedings, these Terms of Use shall be deemed to have been performed in the Province of Ontario and the courts of the Province of Ontario shall have jurisdiction to entertain any action. You waive any right You may have to a trial by jury or to commence or participate in any class action.
                          </p>

                          <h4 className="font-sans font-bold text-gray-900 text-[11px] uppercase tracking-wider pt-2">
                            9.4 Severability & Waiver
                          </h4>
                          <p className="text-gray-600 text-justify">
                            Any term of these Terms of Use that is prohibited or unenforceable in any jurisdiction shall, as to that jurisdiction, be ineffective and severed, all without affecting the remaining terms. No failure to exercise, or delay in exercising, any right or remedy operates as a waiver thereof.
                          </p>

                          <h4 className="font-sans font-bold text-gray-900 text-[11px] uppercase tracking-wider pt-2">
                            9.6 Notices and Electronic Exchange Of Info
                          </h4>
                          <p className="text-gray-600 text-justify">
                            For any communications or inquiries about these terms or product inquiries, You consent to the exchange of information and documents between Us electronically. Please reach out to our team at <a href="mailto:customerservice@vonnessentials.com" className="text-brand-accent hover:underline">customerservice@vonnessentials.com</a>.
                          </p>
                        </div>
                      </section>
                    </div>
                  </div>
                ) : (
                  /* PRIVACY POLICY TAB CONTENT */
                  <div>
                    {/* Intro general description banner for Privacy */}
                    <div className="mb-10 p-5 bg-amber-50/70 rounded-3xl border border-amber-100/50 space-y-3">
                      <div className="flex items-center gap-2 text-amber-800 font-sans font-bold uppercase tracking-widest text-[10px]">
                        <Shield size={14} className="stroke-2" />
                        <span>{language === "en" ? "Privacy Protection" : "Protection des Informations"}</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed font-serif text-[12px] text-justify">
                        {language === "en" ? (
                          <>
                            Vonn Essentials (the "Company") respects your privacy. This <strong>Privacy Policy</strong> describes how the Company collects, uses, maintains, discloses, and protects Personal Information, as well as the rights and choices You have regarding Your Personal Information.
                          </>
                        ) : (
                          <>
                            Vonn Essentials (la « Société ») respecte votre vie privée. Cette <strong>Politique de Confidentialité</strong> définit les conditions de collecte, de traitement, d'utilisation et de protection des données nominatives indispensables au bon fonctionnement de notre site et de nos services.
                          </>
                        )}
                      </p>
                    </div>

                    <div className="space-y-10">
                      <section id="id-priv-intro" className="scroll-mt-6">
                        <h3 className="font-sans font-bold text-gray-950 text-base uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                          <span className="p-1 px-2 bg-gray-100 rounded text-gray-800 font-mono text-xs">1</span>
                          <span>1. INTRODUCTION</span>
                        </h3>
                        <div className="space-y-4">
                          <p className="text-gray-600 text-justify">
                            This electronic document governed by the laws of Ontario, Canada, covers Your use of the Vonn Essentials online store and associated web pages (collectively, the "Website"). We do not knowingly collect information from anyone below the legal age of majority.
                          </p>
                          <p className="text-gray-600 text-justify">
                            {language === "en" 
                              ? "By accessing or using the store, you signify your voluntary consent to the collection, storage, and processing of metadata and delivery logistics in accordance with this document."
                              : "En accédant à notre boutique, vous manifestez volontairement votre consentement éclairé à la collecte et au traitement de vos données d'expédition conformément à ce document."}
                          </p>
                        </div>
                      </section>

                      <section id="id-priv-types" className="scroll-mt-6">
                        <h3 className="font-sans font-bold text-gray-950 text-base uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                          <span className="p-1 px-2 bg-gray-100 rounded text-gray-800 font-mono text-xs">2</span>
                          <span>2. TYPES OF PERSONAL INFORMATION COLLECTED</span>
                        </h3>
                        <div className="space-y-4">
                          <p className="text-gray-600 text-justify">
                            Depending on your interaction levels (guest checkout, newsletter signup, support emails, active cart items), we collect specific blocks of information:
                          </p>
                          <ul className="list-disc pl-6 space-y-2.5 text-gray-600 text-justify">
                            <li><strong>Identity & Delivery details:</strong> Your legal name, billing addresses, shipping addresses, phone numbers, and direct email address.</li>
                            <li><strong>Technical Identifiers:</strong> Your current Internet Protocol (IP) address, localized timezone offsets, device browser strings, equipment configurations, and operating system platforms.</li>
                            <li><strong>Engagement Metrics:</strong> Duration logs spent on specific product pages, page interaction speeds, product search terms, and transition clickstreams.</li>
                            <li><strong>Payment verification logs:</strong> Indirect transaction logs generated by secure third-party billing providers (such as PayPal authorization codes and capture tokens).</li>
                          </ul>
                        </div>
                      </section>

                      <section id="id-priv-methods" className="scroll-mt-6">
                        <h3 className="font-sans font-bold text-gray-950 text-base uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                          <span className="p-1 px-2 bg-gray-100 rounded text-gray-800 font-mono text-xs">3</span>
                          <span>3. METHODS FOR COLLECTING PERSONAL INFORMATION</span>
                        </h3>
                        <div className="space-y-4">
                          <p className="text-gray-600 text-justify font-bold bg-gray-50/50 p-3 rounded-xl text-xs uppercase tracking-wide font-sans text-brand-accent">
                            3.1 Information Provided directly by you:
                          </p>
                          <p className="text-gray-600 text-justify">
                            When you input your address fields during Checkout, communicate with our customer support teams via email, or contribute reviews or testimonials, this is collected and stored safely in our system logs.
                          </p>

                          <p className="text-gray-600 text-justify font-bold bg-gray-50/50 p-3 rounded-xl text-xs uppercase tracking-wide font-sans text-brand-accent mt-4">
                            3.2 Information Collected through technological means:
                          </p>
                          <p className="text-gray-600 text-justify">
                            We use cookies (small text files stored in your local browser history) to persist active shopping carts, identify recurring sessions, and save localization preferences (such as French/English states). You may disable cookies in your browser, but this may cause some parts of checkout to fail.
                          </p>
                        </div>
                      </section>

                      <section id="id-priv-usage" className="scroll-mt-6">
                        <h3 className="font-sans font-bold text-gray-950 text-base uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                          <span className="p-1 px-2 bg-gray-100 rounded text-gray-800 font-mono text-xs">4</span>
                          <span>4. USING AND DISCLOSING PERSONAL INFORMATION</span>
                        </h3>
                        <div className="space-y-4">
                          <p className="text-gray-600 text-justify">
                            The Company collects, stores, and transfers this information to deliver premium results. We use this data to:
                          </p>
                          <ul className="list-disc pl-6 space-y-2 text-gray-600 text-justify">
                            <li>Process, register, capture, and fulfill your checkout purchases and deliver packages via third-party logistics carriers.</li>
                            <li>Offer customized user interfaces matching your preferred language and layout options.</li>
                            <li>Prevent fraudulent checkout requests, credit/debit card abuse, and secure the transactional interfaces.</li>
                            <li>Provide urgent alerts regarding product recalls or critical changes in our delivery terms.</li>
                          </ul>
                          <div className="p-4 bg-brand-accent/[0.02] border border-brand-accent/5 rounded-3xl mt-4 font-sans text-xs">
                            <p className="font-bold text-gray-900 mb-1">
                              {language === "en" ? "NO SELLING POLICY" : "POLITIQUE DE NON-COMMERCIALISATION"}
                            </p>
                            <p className="text-gray-500 font-serif leading-relaxed text-[11px] text-justify">
                              {language === "en"
                                ? "Vonn Essentials does NOT sell, rent, or trade your personal identities or skin profile logs with advertising brokers. Third-party logistics layers (postal carriers) only see your name and shipping destination fields to facilitate accurate postal delivery."
                                : "Vonn Essentials ne vend ni ne loue vos coordonnées ou profils de produits cutanés à des tiers publicitaires. Les intermédiaires postaux ne reçoivent que votre nom et adresse d'expédition pour assurer l'acheminement précis."}
                            </p>
                          </div>
                        </div>
                      </section>

                      <section id="id-priv-access" className="scroll-mt-6">
                        <h3 className="font-sans font-bold text-gray-950 text-base uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                          <span className="p-1 px-2 bg-gray-100 rounded text-gray-800 font-mono text-xs">5</span>
                          <span>5. ACCESS AND CORRECTION</span>
                        </h3>
                        <div className="space-y-4">
                          <p className="text-gray-600 text-justify">
                            You maintain full ownership rights over your personal representations in our online workspace. You have the right to request access to the logs containing your physical addresses, order histories, and communications to correct any typographical or delivery mistakes.
                          </p>
                          <p className="text-gray-600 text-justify">
                            Please email us at <a href="mailto:customerservice@vonnessentials.com" className="text-brand-accent hover:underline">customerservice@vonnessentials.com</a> if you wish to wipe, delete, or correct any record in our primary log databases.
                          </p>
                        </div>
                      </section>

                      <section id="id-priv-security" className="scroll-mt-6">
                        <h3 className="font-sans font-bold text-gray-950 text-base uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                          <span className="p-1 px-2 bg-gray-100 rounded text-gray-800 font-mono text-xs">6</span>
                          <span>6. DATA SECURITY</span>
                        </h3>
                        <div className="space-y-4">
                          <p className="text-gray-600 text-justify">
                            The security of your personal data is vital. We utilize high-standard physical, organizational, and technological safeguards to block third-party malicious intrusions, eavesdropping, and database data leaks. We protect all credit transaction screens with Secure Sockets Layer (SSL) certificate authentications.
                          </p>
                          <p className="text-gray-600 text-justify">
                            While we apply all commercial methods of safety, please be aware that no physical electronic channel is fully immune to hacker penetrations or connection risks. Continue using direct local security precautions in your own browsers.
                          </p>
                        </div>
                      </section>

                      <section id="id-priv-changes" className="scroll-mt-6">
                        <h3 className="font-sans font-bold text-gray-950 text-base uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                          <span className="p-1 px-2 bg-gray-100 rounded text-gray-800 font-mono text-xs">7</span>
                          <span>7. CHANGES TO THE PRIVACY POLICY</span>
                        </h3>
                        <p className="text-gray-600 text-justify">
                          The Company reserves the right in its sole discretion to update this Privacy Policy Statement block when regional data policies evolve. All amendments are active starting from the published date written at the top of this dialogue. Your continued access to the store constitutes active and ongoing acceptance.
                        </p>
                      </section>

                      <section id="id-priv-officer" className="scroll-mt-6">
                        <h3 className="font-sans font-bold text-gray-950 text-base uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                          <span className="p-1 px-2 bg-gray-100 rounded text-gray-800 font-mono text-xs">8</span>
                          <span>8. CONTACT INFORMATION AND PRIVACY COMPLIANCE</span>
                        </h3>
                        <p className="text-gray-600 text-justify">
                          We have appointed a certified Privacy Compliance Officer tasked with supervising data safety and resolving consumer complaints. For any specific queries regarding our storage rules or electronic data wiping, please contact our team:
                        </p>
                        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 font-sans text-xs space-y-1">
                          <p className="font-bold text-gray-900">Vonn Essentials Private Officer</p>
                          <p className="text-gray-600">Email: <a href="mailto:customerservice@vonnessentials.com" className="text-brand-accent hover:underline font-bold">customerservice@vonnessentials.com</a></p>
                          <p className="text-gray-400 font-serif text-[11px] pt-1">Please include "[Privacy Inquiry]" in your email subject heading for faster processing speeds.</p>
                        </div>
                      </section>
                    </div>
                  </div>
                )}

                {/* Footer Meta info */}
                <div className="mt-16 pt-8 border-t border-gray-100 text-center text-gray-400 font-sans text-[10px] uppercase tracking-widest space-y-2">
                  <p>© {new Date().getFullYear()} Vonn Essentials – All Rights Reserved</p>
                  <p>Handcrafted skincare products infused with pure organic essential oils.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
