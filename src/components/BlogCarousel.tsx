import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useLanguage } from "./LanguageContext";
import BlogModal from "./BlogModal";

export default function BlogCarousel() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const { language, t, getBlogPosts } = useLanguage();

  const posts = getBlogPosts();

  const next = () => {
    if (posts.length === 0) return;
    setDirection(1);
    setIndex((index + 1) % posts.length);
  };
  const prev = () => {
    if (posts.length === 0) return;
    setDirection(-1);
    setIndex((index - 1 + posts.length) % posts.length);
  };

  const variants: any = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.4 },
        scale: { duration: 0.4 }
      }
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.4 },
        scale: { duration: 0.4 }
      }
    })
  };

  return (
    <section className="bg-brand-muted py-32 px-6 overflow-hidden font-serif" id="blog">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
           <div className="space-y-4 text-left">
             <motion.span 
               initial={{ opacity: 0, x: -20 }}
               whileInView={{ opacity: 1, x: 0 }}
               className="text-brand-accent font-sans font-bold uppercase tracking-[0.4em] text-[10px]"
             >
               {t("blog_tag")}
             </motion.span>
             <motion.h2 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               className="text-4xl md:text-5xl font-sans font-bold text-gray-900 uppercase tracking-tight"
             >
               {t("blog_title") === "The Journal" ? (
                 <>
                   The <span className="font-serif font-semibold lowercase text-brand-accent">Journal</span>
                 </>
               ) : (
                 <>
                   Le <span className="font-serif font-semibold lowercase text-brand-accent">Journal</span>
                 </>
               )}
             </motion.h2>
           </div>
           
          <div className="flex gap-4">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={prev}
              className="p-5 rounded-full border border-gray-200 bg-white text-gray-800 hover:bg-brand-accent hover:text-white transition-all shadow-xl group"
              aria-label="Previous Post"
            >
              <ArrowLeft size={24} />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={next}
              className="p-5 rounded-full border border-gray-200 bg-white text-gray-800 hover:bg-brand-accent hover:text-white transition-all shadow-xl group"
              aria-label="Next Post"
            >
              <ArrowRight size={24} />
            </motion.button>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="bg-white rounded-[3rem] p-16 text-center text-gray-400 font-serif shadow-xl border border-gray-100 max-w-5xl w-full mx-auto">
            {language === "en" ? "No journal entries found." : "Aucun article de journal trouvé."}
          </div>
        ) : (
          <div className="relative min-h-[500px] flex items-center justify-center">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={posts[index]?.id || "empty"}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full max-w-5xl bg-white rounded-[3rem] overflow-hidden shadow-2xl border border-gray-100 flex flex-col md:flex-row items-stretch"
              >
                <div className="md:w-1/2 relative min-h-[300px] md:min-h-0">
                  <img 
                    src={posts[index]?.image} 
                    alt={posts[index]?.title} 
                    className="absolute inset-0 w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center gap-8 text-left">
                  <div className="space-y-4">
                    <h3 className="text-2xl md:text-3xl font-sans font-bold text-gray-900 leading-tight">
                      {posts[index]?.title}
                    </h3>
                    <p className="text-gray-500 leading-relaxed font-serif text-sm">
                      {posts[index]?.text}
                    </p>
                  </div>

                  <motion.button 
                    whileHover={{ x: 5 }}
                    onClick={() => {
                      setSelectedPost(posts[index]);
                      setIsModalOpen(true);
                    }}
                    className="font-sans font-bold text-[10px] uppercase tracking-widest text-brand-accent hover:text-brand-accent/80 transition-all flex items-center gap-2"
                  >
                    {t("blog_readmore")}
                    <ArrowUpRight size={16} />
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
      
      <BlogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        post={selectedPost}
      />
    </section>
  );
}
