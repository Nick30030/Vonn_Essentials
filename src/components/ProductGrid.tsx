import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "motion/react";
import React, { useState } from "react";
import { Eye, Leaf } from "lucide-react";
import QuickViewModal from "./QuickViewModal";
import { useLanguage } from "./LanguageContext";
import { Product } from "../types";

interface ProductGridProps {
  onAddToCart: (product: Product) => void;
}

function ProductCard({ product, onQuickView, onAddToCart }: { product: Product; onQuickView: (p: Product) => void; onAddToCart: (product: Product) => void }) {
  const { language, t } = useLanguage();
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      variants={{
        hidden: { y: 30, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
      }}
      className="group cursor-pointer font-serif"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => onQuickView(product)}
      style={{
        rotateY,
        rotateX,
        transformStyle: "preserve-3d",
      }}
    >
      <div 
        className="relative aspect-square mb-6 overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100 group-hover:shadow-2xl transition-all duration-500"
        style={{ transform: "translateZ(50px)" }}
      >
        {product.discountPrice && (
          <div className="absolute top-3 left-3 bg-brand-accent text-white font-sans font-bold text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full z-10 shadow-sm">
            {language === "en" ? "On Sale" : "En Solde"}
          </div>
        )}
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-contain p-8 group-hover:scale-110 transition-transform duration-700 ease-out"
          style={{ transform: "translateZ(30px)" }}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-brand-accent/0 group-hover:bg-brand-accent/[0.03] transition-colors duration-500"></div>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0" style={{ transform: "translateZ(60px)" }}>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="bg-brand-accent text-white font-sans font-bold px-8 py-3 rounded-full shadow-xl text-xs uppercase tracking-widest"
          >
            {t("gallery_quickadd")}
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="bg-white/90 backdrop-blur-md text-brand-accent font-sans font-bold px-6 py-2 rounded-full shadow-lg flex items-center gap-2 text-[10px] uppercase tracking-widest border border-brand-accent/10"
          >
            <Eye size={14} />
            {t("gallery_view3d")}
          </motion.button>
        </div>
      </div>
      <div className="text-center space-y-2" style={{ transform: "translateZ(20px)" }}>
        <h3 className="font-sans font-semibold text-gray-800 text-base leading-snug tracking-tight group-hover:text-brand-accent transition-colors">
          {product.name}
        </h3>
        <p className="text-[10px] text-gray-400 font-sans uppercase tracking-[0.2em]">{product.weight}</p>
        <p className="font-sans font-bold text-gray-900 text-lg flex items-center justify-center gap-2">
          {product.discountPrice ? (
            <>
              <span className="text-brand-accent">{product.discountPrice}</span>
              <span className="text-sm text-gray-400 line-through font-normal">{product.price}</span>
            </>
          ) : (
            product.price
          )}
        </p>
      </div>
    </motion.div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

export default function ProductGrid({ onAddToCart }: ProductGridProps) {
  const { getProducts, t, language } = useLanguage();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Set default active collection based on current language
  const [selectedCollection, setSelectedCollection] = useState<string>(() => {
    return language === "en" ? "All" : "Tous";
  });

  // Keep collection selection in sync when language is toggled
  React.useEffect(() => {
    if (language === "en") {
      if (selectedCollection === "Tous") setSelectedCollection("All");
      else if (selectedCollection === "Savons") setSelectedCollection("Soaps");
      else if (selectedCollection === "Soins de la peau") setSelectedCollection("Skincare");
      else if (selectedCollection === "Soins des cheveux") setSelectedCollection("Hair Care");
      else if (selectedCollection === "Coffrets Cadeaux") setSelectedCollection("Gift Sets");
    } else {
      if (selectedCollection === "All") setSelectedCollection("Tous");
      else if (selectedCollection === "Soaps") setSelectedCollection("Savons");
      else if (selectedCollection === "Skincare") setSelectedCollection("Soins de la peau");
      else if (selectedCollection === "Hair Care") setSelectedCollection("Soins des cheveux");
      else if (selectedCollection === "Gift Sets") setSelectedCollection("Coffrets Cadeaux");
    }
  }, [language]);

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const currentProductsList = getProducts();

  // Filter products by the currently selected collection
  const filteredProducts = (selectedCollection === "All" || selectedCollection === "Tous")
    ? currentProductsList
    : currentProductsList.filter((p) => p.collection === selectedCollection);

  // Categories list for the filter tabs including standard + any custom collections from added products
  const baseCollections = language === "en"
    ? ["All", "Soaps", "Skincare", "Gift Sets", "Hair Care"]
    : ["Tous", "Savons", "Soins de la peau", "Coffrets Cadeaux", "Soins des cheveux"];

  const customCollections = Array.from(
    new Set(
      currentProductsList
        .map((p) => p.collection?.trim())
        .filter((c): c is string => Boolean(c && !baseCollections.includes(c)))
    )
  );

  const navigationCollections = [...baseCollections, ...customCollections];

  return (
    <section id="store" className="py-20 md:py-32 px-4 sm:px-6 max-w-7xl mx-auto perspective-1000">
      {/* SHOP OUR COLLECTIONS Section */}
      <div className="mb-14 text-center px-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-sans font-bold text-gray-900 tracking-[0.2em] uppercase mb-4">
          {language === "en" ? "SHOP OUR COLLECTIONS" : "MAGASINEZ NOS COLLECTIONS"}
        </h2>
        
        {/* Decorative leaf ornament */}
        <div className="flex items-center justify-center gap-3 text-brand-brown mb-10">
          <div className="h-[1px] w-12 bg-brand-brown/20"></div>
          <Leaf className="w-4 h-4 fill-current opacity-70" />
          <div className="h-[1px] w-12 bg-brand-brown/20"></div>
        </div>

        {/* Collection Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-3xl mx-auto">
          {navigationCollections.map((colName) => {
            const isActive = selectedCollection === colName;
            return (
              <button
                key={colName}
                onClick={() => setSelectedCollection(colName)}
                className={`px-6 py-2.5 rounded-full text-xs font-sans font-bold uppercase tracking-widest transition-all duration-300 transform hover:scale-105 ${
                  isActive
                    ? "bg-[#162F1C] text-white shadow-lg shadow-[#162F1C]/20 border border-transparent"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                {colName}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. PRODUCTS GRID */}
      <div className="max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {filteredProducts.length > 0 ? (
            <motion.div
              key={selectedCollection}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
            >
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={handleQuickView}
                  onAddToCart={onAddToCart}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 px-6 bg-white/60 rounded-3xl border border-gray-100 max-w-xl mx-auto"
            >
              <Leaf className="w-8 h-8 text-brand-gold/60 mx-auto mb-4 animate-pulse" />
              <h4 className="text-sm font-sans font-bold text-gray-900 uppercase tracking-wider mb-2">
                {language === "en" ? "Coming Soon" : "Arrive bientôt"}
              </h4>
              <p className="text-xs text-gray-500 font-serif leading-relaxed">
                {language === "en"
                  ? "Our exquisite, natural formulations for this collection are currently in progress. Stay tuned!"
                  : "Nos formules naturelles pour cette collection sont en cours de préparation. Restez à l'écoute !"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <QuickViewModal 
        product={selectedProduct} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAddToCart={onAddToCart}
      />
    </section>
  );
}
