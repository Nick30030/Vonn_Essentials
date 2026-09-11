import { motion } from "motion/react";
import { Phone, Mail, Instagram, Facebook, ArrowUpRight } from "lucide-react";
import { useLanguage } from "./LanguageContext";

export default function Contact() {
  const { t, language } = useLanguage();

  return (
    <section id="contact" className="py-32 px-6 max-w-7xl mx-auto font-serif">
      <div className="flex flex-col lg:flex-row items-stretch bg-white rounded-[3rem] overflow-hidden shadow-2xl shadow-brand-accent/5 border border-gray-100">
        <motion.div 
          initial={{ opacity: 0, scale: 1.1 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="lg:w-1/2 relative min-h-[500px]"
        >
          <img 
            src="https://dhgf5mcbrms62.cloudfront.net/86991813/location-BBYesn/bvZkly2-1200x1200.jpg" 
            alt="Handcrafted Soap Presentation" 
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-brand-accent/10 backdrop-contrast-[1.1] mix-blend-multiply"></div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="absolute bottom-12 left-12 right-12 p-8 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 text-left"
          >
            <p className="text-white font-sans font-bold uppercase tracking-widest text-[10px] mb-2 opacity-60">{t("contact_workshop_tag")}</p>
            <h3 className="text-white text-2xl font-sans font-bold">
              {language === "en" ? "Handcrafted in" : "Fabriqué main au"} <br/>
              {language === "en" ? "Canada" : "Canada"}
            </h3>
          </motion.div>
        </motion.div>

        <div className="lg:w-1/2 p-8 md:p-16 lg:p-20 flex flex-col justify-center gap-16 text-left">
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <div className="h-[1px] w-8 bg-brand-accent/30"></div>
              <span className="text-brand-accent font-sans font-bold uppercase tracking-[0.4em] text-[10px]">{t("contact_tag")}</span>
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-sans font-bold text-gray-900 leading-tight uppercase tracking-tight"
            >
              {language === "en" ? (
                <>
                  Contact <span className="text-brand-accent font-serif font-semibold lowercase">Us</span>
                </>
              ) : (
                <>
                  Contacter <span className="text-brand-accent font-serif font-semibold lowercase">l'équipe</span>
                </>
              )}
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-gray-500 leading-relaxed font-serif"
            >
              {t("contact_desc")}
            </motion.p>
          </div>

          <div className="space-y-6">
            {[
              { icon: Phone, label: t("contact_phone"), value: "+1-647-491-6024", href: "tel:+16474916024" },
              { icon: Mail, label: t("contact_email"), value: "customerservice@vonnessentials.com", href: "mailto:customerservice@vonnessentials.com" }
            ].map((item, i) => (
              <motion.a 
                key={i}
                href={item.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + (i * 0.1) }}
                className="flex items-center justify-between p-6 rounded-[2rem] border border-gray-100 hover:border-brand-accent transition-all group pointer-events-auto"
              >
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-brand-muted rounded-2xl group-hover:bg-brand-accent group-hover:text-white transition-all">
                    <item.icon size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">{item.label}</p>
                    <p className="text-lg font-sans font-bold text-gray-800 break-all leading-tight">{item.value}</p>
                  </div>
                </div>
                <ArrowUpRight className="text-gray-300 group-hover:text-brand-accent transition-colors" size={20} />
              </motion.a>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-6"
          >
            <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-gray-400">{t("contact_follow")}</span>
            <div className="flex gap-4">
              {[
                { icon: Instagram, link: "https://www.instagram.com/vonnessentials/" },
                { icon: Facebook, link: "https://www.facebook.com/vonnessentials/" },
              ].map((social, idx) => (
                <motion.a
                  key={idx}
                  href={social.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -3, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-3 bg-brand-muted rounded-full text-gray-600 hover:bg-brand-accent hover:text-white transition-all shadow-sm"
                >
                  <social.icon size={18} />
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
