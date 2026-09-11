import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { useLanguage } from "./LanguageContext";

export default function Hero() {
  const containerRef = useRef(null);
  const { language, getHeroContent } = useLanguage();
  const hero = getHeroContent ? getHeroContent() : null;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const textVariants: any = {
    hidden: { y: 100, opacity: 0 },
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1]
      }
    })
  };

  const title = language === "fr" ? (hero?.titleFr || "Profitez de la fraîcheur") : (hero?.titleEn || "Enjoy Nature's");
  const titleAccent = language === "fr" ? (hero?.titleAccentFr || "de la nature !") : (hero?.titleAccentEn || "freshness!");
  const desc = language === "fr" ? (hero?.descFr || "Des soins de la peau purs et artisanaux...") : (hero?.descEn || "Pure, handcrafted skincare...");
  const shopBtn = language === "fr" ? (hero?.buttonShopFr || "Découvrir la collection") : (hero?.buttonShopEn || "Shop Collection");
  const storyBtn = language === "fr" ? (hero?.buttonStoryFr || "Découvrir notre histoire") : (hero?.buttonStoryEn || "Read Our Story");
  const heroImg = hero?.image || "https://dhgf5mcbrms62.cloudfront.net/86991813/cover-HaXq6F/YRkMx7N-2000x2000.jpg";

  return (
    <section ref={containerRef} className="relative overflow-hidden bg-brand-muted" id="hero font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch min-h-screen md:min-h-[800px]">
        <div className="flex-1 p-6 sm:p-12 md:p-16 lg:p-24 flex flex-col justify-center bg-brand-muted relative z-10 pt-32 md:pt-16">
          <div className="overflow-hidden">
            <motion.h1 
              custom={1}
              variants={textVariants}
              initial="hidden"
              animate="visible"
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-sans font-bold text-gray-900 leading-[1.1] mb-6 md:mb-8"
            >
              {title} <br/>
              <span className="text-brand-brown font-serif font-medium">{titleAccent}</span>
            </motion.h1>

            <motion.div 
              custom={2}
              variants={textVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4 md:space-y-6 text-lg sm:text-xl text-gray-600 max-w-xl font-serif leading-relaxed"
            >
              <p>
                {desc}
              </p>
            </motion.div>

            <motion.div 
              custom={3}
              variants={textVariants}
              initial="hidden"
              animate="visible"
              className="mt-10 md:mt-16 flex flex-wrap gap-4 md:gap-6 items-center"
            >
              <motion.a 
                href="#store" 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 md:px-12 py-4 md:py-5 bg-brand-accent text-white rounded-full text-xs md:text-sm font-sans font-bold tracking-[0.2em] hover:shadow-2xl transition-all uppercase"
              >
                {shopBtn}
              </motion.a>
              <a href="#about" className="group flex items-center gap-3 font-sans font-bold text-[10px] md:text-xs uppercase tracking-widest text-gray-500 hover:text-brand-accent transition-colors">
                {storyBtn}
                <motion.span 
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-6 md:h-[2px] bg-brand-accent/30 group-hover:bg-brand-accent group-hover:w-10 transition-all"
                />
              </a>
            </motion.div>
          </div>
        </div>

        <motion.div 
          className="flex-1 relative min-h-[400px] md:min-h-0 overflow-hidden"
          style={{ y: y1, opacity }}
        >
          <motion.img 
            src={heroImg} 
            alt="Natural skincare products" 
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 w-full h-full object-cover font-serif"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-brand-accent/5 pointer-events-none mix-blend-overlay"></div>
        </motion.div>
      </div>

      {/* Modern floating elements */}
      <motion.div 
        className="absolute top-1/4 right-0 w-64 h-64 bg-brand-accent/10 rounded-full blur-[100px]"
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
    </section>
  );
}
