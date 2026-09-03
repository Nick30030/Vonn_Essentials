import fs from "fs";
import path from "path";

export interface Product {
  id: number;
  name: string;
  price: string;
  discountPrice?: string;
  weight: string;
  image: string;
  sku?: string;
  collection?: string;
  description?: string;
}

export interface GiftCode {
  code: string;
  discountType: "product_percentage" | "product_fixed" | "shipping_percentage" | "shipping_free";
  discountValue: number;
  description: string;
}

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

export interface StoreData {
  productsEn: Product[];
  productsFr: Product[];
  blogsEn: any[];
  blogsFr: any[];
  shippingEn: string[];
  shippingFr: string[];
  aboutEn: string[];
  aboutFr: string[];
  heroContent?: HeroContent;
  shippingSection?: SectionContentData;
  aboutSection?: SectionContentData;
  announcement: {
    textEn: string;
    textFr: string;
    isActive: boolean;
  };
  newsletters: any[];
  giftCodes: GiftCode[];
  orders: any[];
}

const DEFAULT_PRODUCTS_EN: Product[] = [
  {
    id: 552557185,
    name: "Activated Charcoal & Lavender Bar Soap",
    price: "C$5.00",
    weight: "142.0 g",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/5162316022.jpg",
    sku: "VE-SOAP-CHAR",
    collection: "Soaps",
    description: "Handcrafted natural bar soap combining activated charcoal and soothing lavender essential oils."
  },
  {
    id: 715314856,
    name: "Activated Charcoal Mask",
    price: "C$10.55",
    weight: "2 Oz/60 g",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/5278612939.jpg",
    sku: "VE-MASK-CHAR",
    collection: "Skincare",
    description: "Deep cleansing facial clay mask formulated to draw out impurities and leave skin feeling revitalized."
  },
  {
    id: 778852491,
    name: "Cucumber Face Wash",
    price: "C$8.00",
    weight: "2.7 fl. Oz/80 mL",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/778852491/5735737241.jpg",
    sku: "VE-WASH-CUCUMBER",
    collection: "Skincare",
    description: "Refreshing gentle face wash infused with natural cucumber extract to cleanse without drying."
  },
  {
    id: 790734919,
    name: "Facial Care Gift Set",
    price: "C$34.99",
    weight: "Complete Set",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/790734919/5735691901.jpg",
    sku: "VE-GIFT-FACIAL",
    collection: "Gift Sets",
    description: "Complete luxurious skincare routine set featuring our best-selling artisanal essentials."
  },
  {
    id: 708162349,
    name: "Lavender Facial Serum",
    price: "C$12.99",
    weight: "1 fl. Oz/30 mL",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/708162349/5735794901.jpg",
    sku: "VE-SERUM-LAV",
    collection: "Skincare",
    description: "Nourishing botanical serum formulated with pure lavender oil to promote radiant hydration."
  },
  {
    id: 670404034,
    name: "Lavender Facial Spray",
    price: "C$10.90",
    weight: "2 fl. Oz/60 mL",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/670404034/5741905326.jpg",
    sku: "VE-SPRAY-LAV",
    collection: "Skincare",
    description: "Hydrating and soothing mist to refresh and calm the skin throughout the day."
  },
  {
    id: 556991930,
    name: "Orange Blossom Face Wash",
    price: "C$8.00",
    weight: "2.7 fl. Oz/80 mL",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/556991930/5735741401.jpg",
    sku: "VE-WASH-ORANGE",
    collection: "Skincare",
    description: "Brightening plant-based cleanser infused with sweet orange blossom essence."
  },
  {
    id: 636311177,
    name: "Orange Blossom Facial Serum",
    price: "C$12.99",
    weight: "1 fl. Oz/30 mL",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/636311177/5735794843.jpg",
    sku: "VE-SERUM-ORANGE",
    collection: "Skincare",
    description: "Revitalizing face serum enriched with botanical oils for a healthy, vibrant glow."
  }
];

const DEFAULT_PRODUCTS_FR: Product[] = [
  {
    id: 552557185,
    name: "Savon au charbon actif et à la lavande",
    price: "C$5.00",
    weight: "142,0 g",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/5162316022.jpg",
    sku: "VE-SOAP-CHAR",
    collection: "Savons",
    description: "Savon artisanal naturel combinant charbon actif et huiles essentielles de lavande apaisantes."
  },
  {
    id: 715314856,
    name: "Masque purifiant au charbon actif",
    price: "C$10.55",
    weight: "2 Oz/60 g",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/5278612939.jpg",
    sku: "VE-MASK-CHAR",
    collection: "Soins de la peau",
    description: "Masque à l'argile nettoyant en profondeur formulé pour éliminer les impuretés."
  },
  {
    id: 778852491,
    name: "Nettoyant pour le visage au concombre",
    price: "C$8.00",
    weight: "2,7 fl. Oz/80 mL",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/778852491/5735737241.jpg",
    sku: "VE-WASH-CUCUMBER",
    collection: "Soins de la peau",
    description: "Nettoyant doux et rafraîchissant infusé d'extrait naturel de concombre."
  },
  {
    id: 790734919,
    name: "Coffret de soins du visage complet",
    price: "C$34.99",
    weight: "Ensemble complet",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/790734919/5735691901.jpg",
    sku: "VE-GIFT-FACIAL",
    collection: "Coffrets Cadeaux",
    description: "Ensemble luxueux complet comprenant nos essentiels artisanaux les plus appréciés."
  },
  {
    id: 708162349,
    name: "Sérum visage apaisant à la lavande",
    price: "C$12.99",
    weight: "1 fl. Oz/30 mL",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/708162349/5735794901.jpg",
    sku: "VE-SERUM-LAV",
    collection: "Soins de la peau",
    description: "Sérum botanique nourrissant à l'huile pure de lavande pour une hydratation éclatante."
  },
  {
    id: 670404034,
    name: "Brume faciale rafraîchissante lavande",
    price: "C$10.90",
    weight: "2 fl. Oz/60 mL",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/670404034/5741905326.jpg",
    sku: "VE-SPRAY-LAV",
    collection: "Soins de la peau",
    description: "Brume hydratante et apaisante pour rafraîchir et calmer la peau à tout moment."
  },
  {
    id: 556991930,
    name: "Nettoyant visage fleur d'oranger",
    price: "C$8.00",
    weight: "2.7 fl. Oz/80 mL",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/556991930/5735741401.jpg",
    sku: "VE-WASH-ORANGE",
    collection: "Soins de la peau",
    description: "Nettoyant végétal illuminateur infusé d'essence de fleur d'oranger."
  },
  {
    id: 636311177,
    name: "Sérum visage fleur d'oranger",
    price: "C$12.99",
    weight: "1 fl. Oz/30 mL",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/636311177/5735794843.jpg",
    sku: "VE-SERUM-ORANGE",
    collection: "Soins de la peau",
    description: "Sérum revitalisant enrichi en huiles botaniques pour un éclat radieux et naturel."
  }
];

const DEFAULT_SHIPPING_EN = [
  "The team at Vonn Essentials is committed to ensuring that your shopping experience online is just as positive as visiting a physical store. That’s why we crafted our policies to be fair, transparent, and hassle-free.",
  "Order processing is 5 to 7 business days. Shipping is approximately 3 to 5 business days within Canada and more than 7 days internationally.",
  "Once your product has been shipped, the order cannot be canceled. Any product to be returned within 14 days of the purchase, MUST be kept in an UNOPEN condition and will be at the expense of the customer."
];

const DEFAULT_SHIPPING_FR = [
  "L'équipe de Vonn Essentials s'engage à faire en sorte que votre expérience d'achat en ligne soit aussi positive qu'une visite dans un magasin physique. C'est pourquoi nous avons conçu nos règlements de manière à ce qu'ils soient équitables, transparents et sans tracas.",
  "Le délai de traitement des commandes est de 5 à 7 jours ouvrables. Le délai de livraison est d'environ 3 à 5 jours ouvrables au Canada et de plus de 7 jours à l'étranger.",
  "Une fois que votre produit a été expédié, la commande ne peut pas être annulée. Tout produit devant être retourné dans les 14 jours suivant l'achat DOIT être conservé en parfait état NON OUVERT, au frais de l'acheteur-consommateur."
];

const DEFAULT_ABOUT_EN = [
  "Vonn Essentials was born from a simple question: What if your daily rituals could be both effective and indulgent? With a background in chemistry and a passion for natural wellness, I spent years experimenting, blending, testing, and perfecting formulations that actually work.",
  "We believe self-care shouldn't require compromise. Our products combine the precision of science with the soul of handcrafted care. Every bar of soap, every blend of oil, every product we create is formulated with intention and in small batches to ensure quality you can feel."
];

const DEFAULT_ABOUT_FR = [
  "Vonn Essentials est née d’une question simple : Et si vos rituels quotidiens pouvaient être à la fois efficaces et raffinés ? Ayant une formation en chimie et une passion pour le bien-être naturel, j'ai passé des années à expérimenter, composer, tester et perfectionner des formules qui fonctionnent réellement.",
  "Nous croyons que prendre soin de soi ne devrait pas nécessiter de compromis. Nos produits allient la précision de la science à l'âme des soins artisanaux. Chaque savon, chaque mélange d'huiles, chaque produit que nous créons est formulé avec soin et en petites quantités afin de garantir une qualité que vous pouvez ressentir."
];

const DEFAULT_BLOG_EN = [
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
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/5162316022.jpg",
    text: "DIY skincare can be fun and creative—it's a great way to tailor products to your preferences. However, it comes with challenges such as research depth and minimum-quantity ingredient sourcing...",
    fullText: "DIY skincare can be fun and creative—it’s a great way to tailor products to your preferences. However, it comes with challenges. First, the research required to create safe and effective recipes can be overwhelming, demanding hours of dedication to understand skin types, ingredient interactions, and proper formulations.\n\nSecond, sourcing high-quality ingredients often means buying larger quantities than needed, leading to unnecessary expenses and waste. At Vonn Essentials, we take the guesswork out of skincare by combining passion and expertise to craft recipes with the best ingredients and precise formulations. So while you can DIY it, why not let us do the hard work for you and deliver professional-grade results?"
  },
  {
    id: "natural-skincare-routine",
    title: "How to build a natural skincare routine",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/708162349/5735794901.jpg",
    text: "Building a simple yet effective skincare routine starts with understanding your skin type and choosing products with gentle, skin-friendly ingredients that meet your needs seamlessly...",
    fullText: "Building a simple yet effective skincare routine starts with understanding your skin type and choosing products with gentle, skin-friendly ingredients that meet your needs. Start with a basic regimen of cleansing, toning, and moisturising using plant-based cleansers.\n\nFor example, after a long and busy day, your nighttime facial routine will start with a Vonn Essentials face wash, followed by one of our alcohol-free facial sprays, such as Orange Blossom Face Spray. Finish with a hydrating serum enriched with botanical oils like Orange Blossom Facial Serum or Lavender Facial Serum. Incorporate weekly treatments such as detoxification with natural and rejuvenating masks that have ingredients such as clay to maintain skin vitality. Always patch test new products to ensure compatibility, and remember to protect your skin with a mineral-based sunscreen. With consistent use of products like these from Vonn Essentials and a commitment to natural care, your skin will thank you with a healthy, radiant glow."
  },
  {
    id: "why-small-brands",
    title: "Why supporting small cosmetic brands matters",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/790734919/5735691901.jpg",
    text: "Running a small cosmetic business is a rewarding but often challenging journey. Unlike established brands, smaller businesses must work harder to gain trust and recognition...",
    fullText: "Running a small cosmetic business is a rewarding but often challenging journey. Unlike established brands, smaller businesses must work harder to gain trust and recognition. Potential customers might hesitate to try products simply because they are unfamiliar, not realizing the level of care, quality, and personal dedication that goes into crafting these offerings. This hesitation can be discouraging, especially for passionate entrepreneurs who invest significant time and resources to create products that genuinely benefit their users.\n\nSupporting small businesses not only helps their owners achieve their dreams but also empowers communities by encouraging diversity and innovation in the beauty industry. By choosing to shop from brands like Vonn Essentials, you are fostering growth and contributing to the success of individuals who pour their hearts into every product they create.",
    sourceUrl: "https://www.theupsstore.com/small-business-services/small-business-blog/small-business-blog/2024/10/what-is-brand-awareness",
    sourceTitle: "The UPS Store - What is Brand Awareness?"
  },
  {
    id: "hands-behind-products",
    title: "Meet the hands behind the products",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/636311177/5735794843.jpg",
    text: "At Vonn Essentials, every product tells a story - a story of passion, perseverance and love for natural beauty. Founded in 2018, the small business was built with dedication...",
    fullText: "At Vonn Essentials, every product tells a story - a story of passion, perseverance and love for natural beauty. Founded in 2018, the small business was built with dedication and an unwavering belief in creating luxurious skincare at an affordable price, that truly works.\n\nBehind every soap, every bottle and every jar are hands carefully crafting, innovating and overcoming challenges to bring you the best. By supporting Vonn Essentials, you're not just buying skincare; you're becoming part of a journey fuelled by hope, resilience and a commitment to enhancing your natural radiance."
  }
];

const DEFAULT_BLOG_FR = [
  {
    id: "essential-oils",
    title: "Que sont les huiles essentielles ?",
    image: "https://dhgf5mcbrms62.cloudfront.net/86991813/customer-review-7jFZXh/bCCWBzq-600x600.webp",
    text: "Les huiles essentielles sont des extraits de plantes aux propriétés curatives naturelles, favorisant la relaxation, le soulagement du stress et l'amélioration de la qualité du sommeil...",
    fullText: "Les huiles essentielles sont des extraits de plantes aux propriétés curatives naturelles, favorisant la relaxation, le soulagement du stress et l'amélioration de la qualité du sommeil. Elles ont également des propriétés antimicrobiennes et anti-inflammatoires et soutiennent la peau et le système immunitaire. Ces petites merveilles aromatiques peuvent améliorer l'humeur, stimuler l'énergie et apporter des solutions naturelles à divers maux, ce qui en fait une approche polyvalente et holistique de la santé et du bien-être en général.\n\nLes huiles essentielles contenues dans les savons améliorent les routines de nettoyage quotidiennes en offrant une expérience sensorielle aux parfums délicieux. La synergie thérapeutique de ces extraits naturels dans nos savons nourrit à la fois le corps et l'esprit, offrant une expérience de chouchoutage."
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
    text: "L'association courante entre les bulles et le nettoyage efficace des savons est profondément ancrée dans la perception des consommateurs...",
    fullText: "L'association courante entre les bulles et le nettoyage efficace des savons est profondément ancrée dans la perception des consommateurs, ce qui les amène souvent à penser qu'un produit n'est efficace que s'il produit une mousse substantielle. Cependant, l'efficacité d'un savon ne dépend pas uniquement de sa capacité à mousser. Les composants actifs des savons, appelés surfactants, se lient à la fois à l'eau et à l'huile, facilitant ainsi l'élimination de la saleté et de la graisse.\n\nMême si les agents moussants peuvent améliorer le processus de nettoyage, les savons artisanaux, qu'ils produisent d'abondantes bulles ou non, sont souvent considérés comme supérieurs. Les savons artisanaux utilisent généralement des ingrédients naturels et évitent les produits chimiques agressifs, offrant ainsi une expérience de nettoyage plus douce et plus nourrissante. Leurs formules sont souvent adaptées aux différents types de peau, et l'absence d'additifs synthétiques peut s'avérer particulièrement bénéfique pour les personnes à la peau sensible. En outre, le savoir-faire et le souci du détail des savons artisanaux contribuent à une expérience de soin unique et personnalisée, ce qui en fait un choix de prédilection pour les personnes à la recherche d'une routine de nettoyage saine et individualisée.",
    sourceUrl: "https://medium.com/@isabella.meibauer/why-do-we-think-soap-only-works-when-it-lathers-and-foams-e5587976e97e",
    sourceTitle: "Medium - Why do we think soap only works when it lathers and foams?"
  },
  {
    id: "you-can-diy",
    title: "Vous pouvez le faire vous-même, mais laissez-nous le faire pour vous",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/5162316022.jpg",
    text: "Créer vos propres soins de la peau peut être amusant et créatif — une belle manière de personnaliser vos produits selon vos goûts. Cependant, cela comporte des défis majeurs...",
    fullText: "Créer vos propres soins de la peau peut être amusant et créatif — une belle manière de personnaliser vos produits selon vos goûts. Cependant, cela comporte des défis. Premièrement, la recherche nécessaire pour développer des recettes sûres et efficaces peut être accablante, exigeant des heures pour comprendre les types de peau, les interactions des ingrédients, et les formulations adéquates.\n\nDeuxièmement, trouver des ingrédients de qualité implique souvent d'acheter des quantités plus importantes que nécessaire, ce qui entraîne des dépenses inutiles et du gaspillage. Chez Vonn Essentials, nous enlevons cette charge de vos épaules en combinant passion et expertise pour créer des recettes avec les meilleurs ingrédients et des formulations précises. Alors, même si vous pouvez le faire vous-même, pourquoi ne pas nous laisser le soin de vous offrir des résultats professionnels ?"
  },
  {
    id: "natural-skincare-routine",
    title: "Comment élaborer un programme de soins naturels",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/708162349/5735794901.jpg",
    text: "Pour mettre en place un programme de soins simple mais efficace, il faut d'abord comprendre le type de peau et choisir des produits contenant des ingrédients extrêmement doux...",
    fullText: "Pour mettre en place un programme de soins simple mais efficace, il faut d'abord comprendre le type de peau et choisir des produits contenant des ingrédients doux et respectueux de la peau, qui répondent à ses besoins. Commencez par un régime de base de nettoyage, de tonification et d'hydratation à l'aide de nettoyants à base de plantes.\n\nPar exemple, après une longue journée bien remplie, votre routine de soin du visage du soir commencera par un nettoyant Vonn Essentials, suivi de l'un de nos sprays pour le visage sans alcool, comme le spray à la fleur d'oranger. Terminez par un sérum hydratant enrichi en huiles végétales, comme le sérum à la fleur d'oranger ou le sérum à la lavande. Incorporez également des traitements hebdomadaires tels que la désintoxication avec des masques naturels et rajeunissants contenant des ingrédients tels que l'argile, afin de maintenir la vitalité de la peau. Testez toujours les nouveaux produits pour vous assurer de leur compatibilité et n'oubliez pas de protéger votre peau avec un écran solaire minéral. En utilisant régulièrement des produits comme ceux de Vonn Essentials et en vous engageant à prodiguer des soins naturels, votre peau vous remerciera en affichant un éclat sain et radieux."
  },
  {
    id: "why-small-brands",
    title: "Pourquoi soutenir les petites marques cosmétiques est important",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/790734919/5735691901.jpg",
    text: "Gérer une petite entreprise cosmétique est une aventure enrichissante mais souvent semée d'embûches. Contrairement aux grandes marques, les petites entreprises redoublent d'efforts...",
    fullText: "Gérer une petite entreprise cosmétique est une aventure enrichissante mais souvent semée d'embûches. Contrairement aux grandes marques établies, les petites entreprises doivent redoubler d'efforts pour gagner la confiance et se faire connaître. Les clients potentiels hésitent parfois à essayer des produits simplement parce qu'ils ne leur sont pas familiers, sans se rendre compte du soin, de la qualité et de la dévotion personnelle investis dans la création de ces produits. Cette hésitation peut être décourageante, surtout pour des entrepreneurs passionnés qui consacrent tant de temps et de ressources à offrir des produits réellement bénéfiques.\n\nSoutenir les petites entreprises ne permet pas seulement aux propriétaires de réaliser leurs rêves, mais cela renforce également les communautés en encourageant la diversité et l'innovation dans l'industrie de la beauté. En choisissant de soutenir des marques comme Vonn Essentials, vous contribuez à la croissance et au succès d’individus qui mettent tout leur cœur dans chaque produit qu'ils créent.",
    sourceUrl: "https://www.theupsstore.com/small-business-services/small-business-blog/small-business-blog/2024/10/what-is-brand-awareness",
    sourceTitle: "The UPS Store - Qu'est-ce que la notoriété de marque ?"
  },
  {
    id: "hands-behind-products",
    title: "Meet les mains derrière les produits",
    image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/636311177/5735794843.jpg",
    text: "Chez Vonn Essentials, chaque produit raconte une histoire de passion, de persévérance et d'amour pour la beauté naturelle. Fondée en 2018, cette petite entreprise...",
    fullText: "Chez Vonn Essentials, chaque produit raconte une histoire de passion, de persévérance et d'amour pour la beauté naturelle. Fondée en 2018, cette petite entreprise a été construite avec dévouement et une croyance inébranlable dans la création de soins de luxe efficaces à prix abordable.\n\nDerrière chaque savon, chaque bouteille et chaque pot se trouvent des mains qui fabriquent avec soin, innovent et surmontent les défis pour vous offrir le meilleur. En soutenant Vonn Essentials, vous n'achetez pas seulement des soins de la peau ; vous participez à un voyage porté par l'espoir, la résilience et l'engagement à embellir votre éclat naturel."
  }
];

const DEFAULT_GIFT_CODES: GiftCode[] = [
  { code: "WELCOME25", discountType: "product_percentage", discountValue: 25, description: "25% discount on products" },
  { code: "SAVE50", discountType: "product_percentage", discountValue: 50, description: "50% discount on products" },
  { code: "FREESHIP", discountType: "shipping_free", discountValue: 100, description: "100% free shipping" },
  { code: "HALFSHIP", discountType: "shipping_percentage", discountValue: 50, description: "50% off shipping" }
];

const DEFAULT_ORDERS = [
  {
    id: "VONN-9023",
    date: "Aug 26, 2026, 03:45 PM",
    customerName: "Sarah Jenkins",
    customerEmail: "sarah.j@example.com",
    address: "248 St. George St",
    city: "Toronto",
    province: "ON",
    postal: "M5R 2N5",
    country: "CA",
    items: [
      {
        id: 778852491,
        name: "Orange Blossom Facial Spray",
        price: "12.99",
        quantity: 2,
        image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/778852491/5735737241.jpg"
      },
      {
        id: 708162349,
        name: "Lavender Face Spray",
        price: "12.99",
        quantity: 1,
        image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/708162349/5735794901.jpg"
      }
    ],
    subtotal: 38.97,
    shipping: 8.99,
    hst: 6.23,
    total: 54.19,
    paymentMethod: "etransfer",
    paymentStatus: "pending_etransfer",
    shippingMethod: "Canada Post Tracked Expedited Parcel",
    orderComments: "Please ring the buzzer 4A on delivery.",
    etransferDetails: {
      senderName: "Sarah Jenkins",
      senderBank: "TD Canada Trust",
      senderEmail: "sarah.j@example.com",
      referenceCode: "CA72834921S",
      submittedAt: "2026-08-26T20:01:14.238Z"
    }
  },
  {
    id: "VONN-8941",
    date: "Aug 25, 2026, 11:20 AM",
    customerName: "Jean-François Lemieux",
    customerEmail: "jf.lemieux@example.ca",
    address: "410 Rue Sherbrooke Est",
    city: "Montreal",
    province: "QC",
    postal: "H2L 1J7",
    country: "CA",
    items: [
      {
        id: 636311177,
        name: "Sérum visage fleur d'oranger",
        price: "12.99",
        quantity: 1,
        image: "https://d2j6dbq0eux0bg.cloudfront.net/images/86991813/products/636311177/5735794843.jpg"
      }
    ],
    subtotal: 12.99,
    shipping: 10.99,
    hst: 3.59,
    total: 27.57,
    paymentMethod: "paypal",
    paymentStatus: "completed",
    shippingMethod: "Canada Post Expedited Parcel"
  }
];

const DEFAULT_NEWSLETTERS = [
  {
    id: "news-1",
    subject: "🌿 Introducing Our Activated Charcoal Facial Care Series!",
    content: "We are thrilled to launch our new deeply clarifying charcoal soap and mud masks. Cleanse pores naturally and hydrate with organic orange blossom essentials. Available today with free shipping!",
    sentAt: "Aug 12, 2026, 10:30 AM",
    subscribersCount: 248
  },
  {
    id: "news-2",
    subject: "🌸 Gentle Lavender Rituals for Safe and Restful Sleep",
    content: "Discover how our custom small-batch lavender-infused soap bars and soothing facial mist sprays are balanced to promote optimal bedtime relaxation and gentle hydration.",
    sentAt: "Jul 28, 2026, 04:15 PM",
    subscribersCount: 240
  }
];

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

function ensureStoreFile(): StoreData {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    const initialData: StoreData = {
      productsEn: DEFAULT_PRODUCTS_EN,
      productsFr: DEFAULT_PRODUCTS_FR,
      blogsEn: DEFAULT_BLOG_EN,
      blogsFr: DEFAULT_BLOG_FR,
      shippingEn: DEFAULT_SHIPPING_EN,
      shippingFr: DEFAULT_SHIPPING_FR,
      aboutEn: DEFAULT_ABOUT_EN,
      aboutFr: DEFAULT_ABOUT_FR,
      announcement: {
        textEn: "🌿 Summer Sale: Free shipping on orders over C$35 across Canada!",
        textFr: "🌿 Solde d'été : Livraison gratuite sur commandes de plus de 35$ au Canada !",
        isActive: true
      },
      newsletters: DEFAULT_NEWSLETTERS,
      giftCodes: DEFAULT_GIFT_CODES,
      orders: DEFAULT_ORDERS
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), "utf8");
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const data = JSON.parse(raw);
    return {
      productsEn: data.productsEn || DEFAULT_PRODUCTS_EN,
      productsFr: data.productsFr || DEFAULT_PRODUCTS_FR,
      blogsEn: data.blogsEn || DEFAULT_BLOG_EN,
      blogsFr: data.blogsFr || DEFAULT_BLOG_FR,
      shippingEn: data.shippingEn || DEFAULT_SHIPPING_EN,
      shippingFr: data.shippingFr || DEFAULT_SHIPPING_FR,
      aboutEn: data.aboutEn || DEFAULT_ABOUT_EN,
      aboutFr: data.aboutFr || DEFAULT_ABOUT_FR,
      heroContent: data.heroContent,
      shippingSection: data.shippingSection,
      aboutSection: data.aboutSection,
      announcement: data.announcement || {
        textEn: "🌿 Summer Sale: Free shipping on orders over C$35 across Canada!",
        textFr: "🌿 Solde d'été : Livraison gratuite sur commandes de plus de 35$ au Canada !",
        isActive: true
      },
      newsletters: data.newsletters || DEFAULT_NEWSLETTERS,
      giftCodes: data.giftCodes || DEFAULT_GIFT_CODES,
      orders: data.orders || DEFAULT_ORDERS
    };
  } catch (e) {
    console.error("Error reading store.json, returning defaults", e);
    return {
      productsEn: DEFAULT_PRODUCTS_EN,
      productsFr: DEFAULT_PRODUCTS_FR,
      blogsEn: DEFAULT_BLOG_EN,
      blogsFr: DEFAULT_BLOG_FR,
      shippingEn: DEFAULT_SHIPPING_EN,
      shippingFr: DEFAULT_SHIPPING_FR,
      aboutEn: DEFAULT_ABOUT_EN,
      aboutFr: DEFAULT_ABOUT_FR,
      announcement: {
        textEn: "🌿 Summer Sale: Free shipping on orders over C$35 across Canada!",
        textFr: "🌿 Solde d'été : Livraison gratuite sur commandes de plus de 35$ au Canada !",
        isActive: true
      },
      newsletters: DEFAULT_NEWSLETTERS,
      giftCodes: DEFAULT_GIFT_CODES,
      orders: DEFAULT_ORDERS
    };
  }
}

export function getStore(): StoreData {
  return ensureStoreFile();
}

export function saveStore(data: StoreData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Failed to write store.json", error);
  }
}
