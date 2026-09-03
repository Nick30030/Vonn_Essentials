import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "motion/react";
import { Search, ShoppingBag, Menu, Globe, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "./LanguageContext";
import logoNew from "../assets/images/vonn_logo.png";

interface NavbarProps {
  itemCount: number;
  onOpenCart: () => void;
  onOpenTerms?: (tab?: "terms" | "privacy") => void;
}

export default function Navbar({ itemCount, onOpenCart, onOpenTerms }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { language, toggleLanguage, t } = useLanguage();
  const { scrollY } = useScroll();

  const [announcement, setAnnouncement] = useState<{ textEn: string; textFr: string; isActive: boolean } | null>(() => {
    const saved = localStorage.getItem("vonn_announcement");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return {
      textEn: "🌿 Summer Sale: Free shipping on orders over C$35 across Canada!",
      textFr: "🌿 Solde d'été : Livraison gratuite sur commandes de plus de 35$ au Canada !",
      isActive: true
    };
  });

  useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem("vonn_announcement");
      if (saved) {
        try { setAnnouncement(JSON.parse(saved)); } catch (e) { setAnnouncement(null); }
      } else {
        setAnnouncement(null);
      }
    };
    window.addEventListener("vonn_announcement_changed", handleUpdate);
    return () => window.removeEventListener("vonn_announcement_changed", handleUpdate);
  }, []);

  const announcementText = announcement && announcement.isActive
    ? (language === "en" ? announcement.textEn : announcement.textFr)
    : "";

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  const links = [
    { name: t("nav_store"), href: "#store" },
    { name: t("nav_shipping"), href: "#shipping" },
    { name: language === "en" ? "Terms" : "Conditions", onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      if (onOpenTerms) onOpenTerms("terms");
    }},
    { name: t("nav_contact"), href: "#contact" }
  ];

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? "bg-white/80 backdrop-blur-xl border-b border-gray-200/50 py-3" 
          : "bg-transparent pt-4 pb-6"
      }`}
      id="navbar"
    >
      {announcementText && !isScrolled && (
        <div className="bg-[#162F1C] text-[#fff] text-[10px] md:text-xs font-sans font-bold tracking-widest text-center py-2 px-4 uppercase rounded-full max-w-4xl mx-auto mb-4 shadow-md border border-white/15 animate-fadeIn">
          {announcementText}
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-6 md:gap-12">
          <a href="/" className="group flex items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="relative w-14 h-14 md:w-16 md:h-16 overflow-hidden flex items-center justify-center rounded-full shadow-inner border border-gray-100/10"
            >
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
            </motion.div>
            <span className={`font-sans font-bold uppercase tracking-[0.2em] text-xs md:text-sm transition-colors duration-500 ${isScrolled ? 'text-gray-900' : 'text-brand-accent'}`}>
              Vonn Essentials
            </span>
          </a>
          
          <nav className="hidden lg:flex items-center gap-8 text-[10px] font-sans font-bold uppercase tracking-[0.3em] text-gray-500">
            {links.map((link) => link.onClick ? (
              <button 
                key={link.name}
                onClick={link.onClick} 
                className="relative group overflow-hidden text-left outline-none cursor-pointer font-bold text-[10px] uppercase tracking-[0.3em]"
              >
                <span className="group-hover:-translate-y-full inline-block transition-transform duration-500 ease-in-out">
                  {link.name}
                </span>
                <span className="absolute left-0 top-full group-hover:-translate-y-full inline-block transition-transform duration-500 ease-in-out text-brand-accent">
                  {link.name}
                </span>
              </button>
            ) : (
              <a 
                key={link.name}
                href={link.href} 
                className="relative group overflow-hidden"
              >
                <span className="group-hover:-translate-y-full inline-block transition-transform duration-500 ease-in-out">
                  {link.name}
                </span>
                <span className="absolute left-0 top-full group-hover:-translate-y-full inline-block transition-transform duration-500 ease-in-out text-brand-accent">
                  {link.name}
                </span>
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
           {/* Instantaneous Language Toggle */}
           <button 
             onClick={toggleLanguage}
             className={`px-3 py-1.5 rounded-full text-[10px] font-sans font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-1 border ${
               isScrolled 
                 ? 'border-gray-200 text-gray-700 hover:border-brand-accent hover:text-brand-accent bg-gray-50' 
                 : 'border-brand-accent/20 text-brand-accent hover:border-brand-accent hover:bg-white/15'
             }`}
             aria-label="Toggle language"
           >
             <Globe size={11} />
             <span>{language === "en" ? "FR" : "EN"}</span>
           </button>

           <div className="hidden sm:flex items-center bg-gray-100/50 rounded-full px-4 py-2 border border-gray-200/20 backdrop-blur-sm">
             <Search size={14} className="text-gray-400" />
             <input 
               type="text" 
               placeholder={t("nav_search")} 
               className="bg-transparent border-none focus:ring-0 text-xs font-sans ml-2 w-24 outline-none placeholder:text-gray-400/80"
             />
           </div>
                      <div className="flex items-center gap-2">
              <motion.button 
                onClick={onOpenCart}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.9 }}
                className={`p-2.5 rounded-full transition-colors relative ${isScrolled ? 'hover:bg-gray-100' : 'hover:bg-white/20'}`}
                aria-label="Cart"
               >
                 <ShoppingBag size={18} className={isScrolled ? "text-gray-700" : "text-brand-accent"} />
                 {itemCount > 0 && (
                   <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-brand-accent text-white text-[10px] font-bold rounded-full border-2 border-white px-1">
                     {itemCount}
                   </span>
                 )}
               </motion.button>

              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`lg:hidden p-2.5 rounded-full transition-colors ${isScrolled ? 'hover:bg-gray-100' : 'hover:bg-white/20'}`} 
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <X size={18} className="text-gray-700" /> : <Menu size={18} className={isScrolled ? "text-gray-700" : "text-brand-accent"} />}
              </button>
           </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <nav className="flex flex-col p-6 gap-6">
              {links.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => {
                    if (link.onClick) {
                      link.onClick(e as any);
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  className="font-sans font-bold uppercase tracking-[0.3em] text-[10px] text-gray-700 hover:text-brand-accent transition-colors"
                >
                  {link.name}
                </a>
              ))}
              <div className="flex items-center bg-gray-50 rounded-full px-4 py-2 border border-gray-100">
                <Search size={14} className="text-gray-400" />
                <input 
                  type="text" 
                  placeholder={t("nav_search")} 
                  className="bg-transparent border-none focus:ring-0 text-xs font-sans ml-2 w-full outline-none placeholder:text-gray-400/80"
                />
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
