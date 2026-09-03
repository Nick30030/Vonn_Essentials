import { motion } from "motion/react";
import { useLanguage } from "./LanguageContext";
import logoNew from "../assets/images/vonn_logo.png";

interface FooterProps {
  onOpenTerms?: (tab?: "terms" | "privacy") => void;
  onOpenAdmin?: () => void;
}

export default function Footer({ onOpenTerms, onOpenAdmin }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const { language, t } = useLanguage();
  
  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1 }}
      className="bg-[#162F1C] text-white pt-24 pb-12 px-6 font-serif"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-20">
          <div className="space-y-8 text-left">
            <div className="relative w-24 h-24 group cursor-pointer overflow-hidden rounded-full flex items-center justify-center shadow-inner">
              <img 
                src={logoNew} 
                alt="Vonn Essentials Logo" 
                className="absolute inset-0 w-full h-full object-contain rounded-full transition-all duration-700 ease-in-out opacity-100 group-hover:opacity-0 group-hover:scale-95"
                referrerPolicy="no-referrer"
              />
              <img 
                src={logoNew} 
                alt="Vonn Essentials Logo Hover" 
                className="absolute inset-0 w-full h-full object-contain rounded-full transition-all duration-700 ease-in-out opacity-0 group-hover:opacity-100 group-hover:scale-105 filter brightness-110 drop-shadow-[0_0_12px_rgba(197,154,67,0.85)]"
                referrerPolicy="no-referrer"
              />
            </div>

          </div>

          <div className="text-left">
             <h4 className="font-sans font-bold uppercase tracking-widest text-xs mb-8 text-white/50">
               {language === "en" ? "Quick Links" : "Liens Rapides"}
             </h4>
             <ul className="space-y-4 font-sans font-medium text-gray-300 text-xs tracking-wider">
               <li><a href="#store" className="hover:text-white transition-colors uppercase">{t("nav_store")}</a></li>
               <li><a href="#shipping" className="hover:text-white transition-colors uppercase">{t("nav_shipping")}</a></li>
               <li><a href="#blog" className="hover:text-white transition-colors uppercase">{language === "en" ? "Blog" : "Le Journal"}</a></li>
               <li><a href="#contact" className="hover:text-white transition-colors uppercase">{t("nav_contact")}</a></li>
             </ul>
          </div>

          <div className="text-left">
             <h4 className="font-sans font-bold uppercase tracking-widest text-xs mb-8 text-white/50">
               {language === "en" ? "Legal" : "Mentions Légales"}
             </h4>
             <ul className="space-y-4 font-sans font-medium text-gray-300 text-xs tracking-wider flex flex-col items-start">
               <li>
                 <button 
                   onClick={(e) => {
                     e.preventDefault();
                     if (onOpenTerms) onOpenTerms("terms");
                   }}
                   className="hover:text-white transition-colors uppercase text-left outline-none cursor-pointer"
                 >
                   {language === "en" ? "Terms & Conditions" : "Conditions Générales"}
                 </button>
               </li>
               <li>
                 <button 
                   onClick={(e) => {
                     e.preventDefault();
                     if (onOpenTerms) onOpenTerms("privacy");
                   }}
                   className="hover:text-white transition-colors uppercase text-left outline-none cursor-pointer"
                 >
                   {language === "en" ? "Privacy Policy" : "Confidentialité"}
                 </button>
               </li>
               <li>
                 <a href="#shipping" className="hover:text-white transition-colors uppercase block">
                   {language === "en" ? "Return Policy" : "Politique de Retour"}
                 </a>
               </li>
               <li>
                 <button 
                   onClick={(e) => {
                     e.preventDefault();
                     if (onOpenAdmin) onOpenAdmin();
                   }}
                   className="hover:text-white transition-colors uppercase text-left outline-none cursor-pointer font-sans"
                 >
                   {language === "en" ? "Admin Portal" : "Portail Admin"}
                 </button>
               </li>
             </ul>
          </div>


        </div>

        <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8 text-gray-500 text-xs">
          <div className="text-center md:text-left space-y-2 font-sans font-semibold tracking-wider uppercase text-[10px]">
             <p>© {currentYear} Vonn Essentials – {language === "en" ? "All Rights Reserved" : "Tous Droits Réservés"}</p>
             <p>{language === "en" ? "All prices are in Canadian dollars" : "Tous les prix sont affichés en dollars canadiens (CAD)"}</p>
          </div>
          {/* Removed Powered by Lightspeed */}
        </div>
      </div>
    </motion.footer>
  );
}
