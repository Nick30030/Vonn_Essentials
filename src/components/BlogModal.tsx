import { motion, AnimatePresence } from "motion/react";
import { X, Clock, BookOpen, Share2 } from "lucide-react";
import { useLanguage } from "./LanguageContext";
import { toast } from "react-hot-toast";

interface BlogPost {
  id: string;
  title: string;
  image: string;
  text: string;
  fullText: string;
  sourceUrl?: string;
  sourceTitle?: string;
}

interface BlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: BlogPost | null;
}

export default function BlogModal({ isOpen, onClose, post }: BlogModalProps) {
  const { language } = useLanguage();

  if (!post) return null;

  const handleCopyLink = () => {
    // Generate an absolute shareable deep-link with hash
    const shareUrl = `${window.location.origin}${window.location.pathname}#blog-${post.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success(
        language === "en" 
          ? "Article link copied to clipboard!" 
          : "Lien de l'article copié dans le presse-papiers !"
      );
    }).catch(() => {
      toast.error(
        language === "en" 
          ? "Failed to copy link." 
          : "Échec du copier-coller."
      );
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-10">
          {/* Backdrop with elegant blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: "spring", duration: 0.55 }}
            className="relative w-full max-w-4xl h-[85vh] sm:h-[80vh] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100/50 z-10 flex flex-col"
          >
            {/* Elegant Header Hero Banner with parallax style overlay */}
            <div className="relative h-64 sm:h-80 w-full shrink-0">
              <img 
                src={post.image} 
                alt={post.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 flex flex-col justify-end p-6 sm:p-10 text-left" />
              
              {/* Floating Buttons inside Hero */}
              <div className="absolute top-6 right-6 flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="p-3 bg-white/15 hover:bg-white/25 active:scale-95 backdrop-blur-md rounded-full text-white transition-all shadow border border-white/10"
                  title={language === "en" ? "Share Article" : "Partager l'article"}
                >
                  <Share2 size={16} className="stroke-[2.5]" />
                </button>
                <button
                  onClick={onClose}
                  className="p-3 bg-white hover:bg-gray-50 text-gray-950 rounded-full transition-all active:scale-95 shadow-md flex items-center justify-center border border-gray-200"
                  title={language === "en" ? "Close" : "Fermer"}
                >
                  <X size={16} className="stroke-[2.5]" />
                </button>
              </div>

              {/* Title Info placed neatly at the bottom edge of the banner */}
              <div className="absolute bottom-6 left-6 right-6 text-left">
                <div className="flex items-center gap-3 text-white/80 font-sans text-[10px] uppercase tracking-widest font-bold mb-3">
                  <span className="px-2.5 py-1 bg-brand-accent/90 rounded-full text-white font-semibold">
                    {language === "en" ? "Journal" : "Revue"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    <span>3 Min Read</span>
                  </span>
                  <span className="flex items-center gap-1 hidden sm:inline-flex">
                    <BookOpen size={11} />
                    <span>Vonn Essentials</span>
                  </span>
                </div>
                <h2 className="font-sans font-bold text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight uppercase">
                  {post.title}
                </h2>
              </div>
            </div>

            {/* Scrollable Reading Area */}
            <div className="flex-grow overflow-y-auto p-6 sm:p-10 lg:p-12 text-left bg-gray-50/20">
              <div className="max-w-3xl mx-auto">
                {/* Visual quote indicator */}
                <div className="border-l-[3px] border-brand-accent pl-5 my-6">
                  <p className="font-sans font-semibold text-gray-500 text-[14px] leading-relaxed">
                    {language === "en" 
                      ? "Deepening our collective dialogue around organic, clean body care formulations that restore the natural alignment, energy, and comfort of skin."
                      : "Construire un dialogue authentique autour de méthodes de formulation saines pour préserver l'équilibre, l'éclat et le confort de la peau et de l'esprit."}
                  </p>
                </div>

                {/* Primary Content Paragraphs */}
                <div className="font-serif text-[15px] sm:text-[16px] text-gray-700 leading-relaxed font-normal whitespace-pre-wrap text-justify antialiased">
                  {post.fullText}
                </div>

                {post.sourceUrl && (
                  <div className="mt-8 p-5 bg-white border border-gray-200/80 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-sans text-[10px] uppercase font-bold text-brand-accent tracking-wider">
                        {language === "en" ? "External Reference" : "Référence externe"}
                      </p>
                      <h5 className="font-sans font-bold text-gray-900 text-sm tracking-tight">
                        {post.sourceTitle || post.sourceUrl}
                      </h5>
                    </div>
                    <a
                      href={post.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 px-4 py-2 bg-gray-900 hover:bg-black text-white font-sans text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow"
                    >
                      <span>{language === "en" ? "Read Article" : "Lire l'article"}</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  </div>
                )}
                
                {/* Author signature block */}
                <div className="mt-12 pt-8 border-t border-gray-100 flex items-center gap-4">
                  <div className="w-11 h-11 bg-brand-accent rounded-full flex items-center justify-center text-white font-sans font-bold text-sm tracking-wider">
                    VE
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-gray-900 text-xs uppercase tracking-wider">
                      Vonn Essentials
                    </h4>
                    <p className="font-sans text-[10px] uppercase text-gray-400 tracking-widest font-semibold">
                      {language === "en" ? "Artisanal Skincare Boutique" : "Boutique de Soins Artisanaux"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
