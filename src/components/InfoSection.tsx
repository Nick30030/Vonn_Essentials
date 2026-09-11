import { motion } from "motion/react";

interface InfoSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  content: string[];
  isDark?: boolean;
}

export default function InfoSection({ id, title, subtitle, content, isDark }: InfoSectionProps) {
  return (
    <section 
      id={id} 
      className={`py-20 md:py-32 px-6 ${isDark ? 'bg-brand-forest text-white' : 'bg-brand-bg text-brand-text'} overflow-hidden relative`}
    >
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          className="space-y-8 md:space-y-12"
        >
          <div className="space-y-4 md:space-y-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-4"
            >
              <div className={`h-[1px] w-8 md:w-12 ${isDark ? 'bg-brand-gold/40' : 'bg-brand-gold/60'}`}></div>
              <span className={`text-[8px] md:text-[10px] uppercase tracking-[0.4em] font-bold ${isDark ? 'text-brand-gold/90' : 'text-brand-gold'}`}>Essential Detail</span>
            </motion.div>
            
            <motion.h2 
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className={`text-3xl sm:text-4xl md:text-6xl font-sans font-bold leading-tight ${isDark ? 'text-white' : 'text-brand-accent'}`}
            >
              {title}
            </motion.h2>
            
            {subtitle && (
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className={`text-lg md:text-2xl font-serif opacity-60 max-w-2xl`}
              >
                {subtitle}
              </motion.p>
            )}
          </div>
         
          <div className="space-y-6 md:space-y-10 text-base md:text-2xl leading-relaxed font-serif">
            {content.map((p, idx) => (
              <motion.p 
                key={idx} 
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 + (idx * 0.1) }}
                className={`${isDark ? 'text-white/80' : 'text-brand-text/90'}`}
              >
                {p}
              </motion.p>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Subtle organic movement for background */}
      {isDark && (
        <motion.div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ 
            backgroundImage: "radial-gradient(circle at 50% 50%, rgba(197, 154, 67, 0.15) 0%, transparent 50%)",
            backgroundSize: "200% 200%"
          }}
        />
      )}
    </section>
  );
}
