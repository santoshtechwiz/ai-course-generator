// "use client";

// import { useRef, useState, useEffect } from "react";
// import { motion, useInView, useAnimation, Variants } from "framer-motion";
// import { Element } from "react-scroll";
// import { ArrowUp } from 'lucide-react';
// import { useRouter } from "next/navigation";

// import ShowcaseSection from "../ShowcaseSection";
// import HowItWorks from "@/app/components/HowItWorks";
// import { FAQSection } from "@/app/components/faq-section";
// import { TestimonialsSection } from "@/app/components/testimonials-section";

// import FeatureSections from "@/app/components/FeatureSection";
// import LandingCTA from "@/app/components/LandingCTA";
// import LandingHero from "@/app/components/LandingHero";
// import LandingHeader from "../LanndingHeader";

// const fadeInUp: Variants = {
//   hidden: { opacity: 0, y: 20 },
//   visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
// };

// const fadeInLeft: Variants = {
//   hidden: { opacity: 0, x: -50 },
//   visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
// };

// const fadeInRight: Variants = {
//   hidden: { opacity: 0, x: 50 },
//   visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
// };

// const stagger: Variants = {
//   visible: {
//     transition: {
//       staggerChildren: 0.1,
//     },
//   },
// };

// export default function LandingComponent() {
//   const router = useRouter();
//   const [showScrollTop, setShowScrollTop] = useState(false);
//   const featuresRef = useRef(null);
//   const howItWorksRef = useRef(null);
//   const showcaseRef = useRef(null);
//   const testimonialsRef = useRef(null);
//   const faqRef = useRef(null);

//   const isInViewFeatures = useInView(featuresRef, { once: true, amount: 0.3 });
//   const isInViewHowItWorks = useInView(howItWorksRef, { once: true, amount: 0.3 });
//   const isInViewShowcase = useInView(showcaseRef, { once: true, amount: 0.3 });
//   const isInViewTestimonials = useInView(testimonialsRef, { once: true, amount: 0.3 });
//   const isInViewFAQ = useInView(faqRef, { once: true, amount: 0.3 });

//   const controls = useAnimation();

//   useEffect(() => {
//     const handleScroll = () => {
//       setShowScrollTop(window.scrollY > 300);
//     };

//     window.addEventListener("scroll", handleScroll);
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, []);

//   const handleTopicSubmit = (topic: string) => {
//     if (topic) {
//       router.push(`/dashboard/create?topic=${encodeURIComponent(topic)}`);
//     } else {
//       router.push('/dashboard/create');
//     }
//   };

//   const handleSignInClick = () => {
//     router.push('/auth/signin?callbackUrl=/dashboard');
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
//       <LandingHeader />
//       <LandingHero onTopicSubmit={handleTopicSubmit} />

//       {/* How It Works Section */}
//       <Element name="how-it-works">
//         <section className="py-20 px-4 bg-muted/30" ref={howItWorksRef}>
//           <motion.div
//             className="container mx-auto max-w-6xl"
//             initial="hidden"
//             animate={isInViewHowItWorks ? "visible" : "hidden"}
//             variants={fadeInLeft}
//           >
//             <motion.div variants={stagger} className="space-y-12">
//               <motion.div variants={fadeInUp} className="text-center space-y-4">
//                 <h2 className="text-3xl font-bold text-primary">How It Works</h2>
//                 <p className="text-muted-foreground max-w-2xl mx-auto">
//                   See how our AI transforms your ideas into a complete course
//                 </p>
//               </motion.div>

//               <motion.div variants={fadeInUp}>
//                 <HowItWorks />
//               </motion.div>
//             </motion.div>
//           </motion.div>
//         </section>
//       </Element>

//       {/* Features Section */}
//       <section ref={featuresRef}>
//         <motion.div
//           initial="hidden"
//           animate={isInViewFeatures ? "visible" : "hidden"}
//           variants={fadeInRight}
//         >
//           <FeatureSections featuresRef={featuresRef} controls={controls} />
//         </motion.div>
//       </section>

//       {/* Showcase Section */}
//       <Element name="showcase">
//         <section ref={showcaseRef} className="bg-muted/20">
//           <motion.div
//             initial="hidden"
//             animate={isInViewShowcase ? "visible" : "hidden"}
//             variants={fadeInLeft}
//           >
//             <ShowcaseSection />
//           </motion.div>
//         </section>
//       </Element>

//       {/* Testimonials Section */}
//       <Element name="testimonials">
//         <section ref={testimonialsRef}>
//           <motion.div
//             initial="hidden"
//             animate={isInViewTestimonials ? "visible" : "hidden"}
//             variants={fadeInRight}
//           >
//             <TestimonialsSection />
//           </motion.div>
//         </section>
//       </Element>

//       {/* FAQ Section */}
//       <Element name="faq">
//         <section ref={faqRef} className="bg-muted/20">
//           <motion.div
//             initial="hidden"
//             animate={isInViewFAQ ? "visible" : "hidden"}
//             variants={fadeInLeft}
//           >
//             <FAQSection />
//           </motion.div>
//         </section>
//       </Element>

//       {/* CTA Section */}
//       <LandingCTA handleSignInClick={handleSignInClick} />

//       {/* Scroll to Top Button */}
//       <motion.button
//         initial={{ opacity: 0 }}
//         animate={{ opacity: showScrollTop ? 1 : 0 }}
//         transition={{ duration: 0.3 }}
//         className={`fixed bottom-8 right-8 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors duration-200 ${
//           showScrollTop ? "visible" : "invisible"
//         }`}
//         onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
//         aria-label="Scroll to top"
//       >
//         <ArrowUp className="h-6 w-6" />
//       </motion.button>
//     </div>
//   );
// }

"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, useAnimation, Variants } from "framer-motion";
import { Element } from "react-scroll";
import { ArrowUp } from 'lucide-react';
import { useRouter } from "next/navigation";
import { FAQSection } from "@/app/components/faq-section";
import FeatureSections from "@/app/components/FeatureSection";
import HowItWorks from "@/app/components/HowItWorks";
import LandingCTA from "@/app/components/LandingCTA";
import LandingHero from "@/app/components/LandingHero";
import { TestimonialsSection } from "@/app/components/testimonials-section";
import LandingHeader from "../LanndingHeader";
import ShowcaseSection from "../ShowcaseSection";



const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};

const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};

const stagger: Variants = {
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function LandingComponent() {
  const router = useRouter();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const showcaseRef = useRef(null);
  const testimonialsRef = useRef(null);
  const faqRef = useRef(null);

  const isInViewFeatures = useInView(featuresRef, { once: true, amount: 0.3 });
  const isInViewHowItWorks = useInView(howItWorksRef, { once: true, amount: 0.3 });
  const isInViewShowcase = useInView(showcaseRef, { once: true, amount: 0.3 });
  const isInViewTestimonials = useInView(testimonialsRef, { once: true, amount: 0.3 });
  const isInViewFAQ = useInView(faqRef, { once: true, amount: 0.3 });

  const controls = useAnimation();

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleTopicSubmit = (topic: string) => {
    if (topic) {
      router.push(`/dashboard/create?topic=${encodeURIComponent(topic)}`);
    } else {
      router.push('/dashboard/create');
    }
  };

  const handleSignInClick = () => {
    router.push('/auth/signin?callbackUrl=/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <LandingHeader />
      <main className="space-y-24 pb-24">
        <LandingHero onTopicSubmit={handleTopicSubmit} />

        {/* How It Works Section */}
        <Element name="how-it-works">
          <section className="py-20 px-4 bg-muted/30" ref={howItWorksRef}>
            <motion.div
              className="container mx-auto max-w-6xl"
              initial="hidden"
              animate={isInViewHowItWorks ? "visible" : "hidden"}
              variants={fadeInLeft}
            >
              <motion.div variants={stagger} className="space-y-12">
                <motion.div variants={fadeInUp} className="text-center space-y-4">
                  <h2 className="text-3xl font-bold text-primary">How It Works</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    See how our AI transforms your ideas into a complete course
                  </p>
                </motion.div>

                <motion.div variants={fadeInUp}>
                  <HowItWorks />
                </motion.div>
              </motion.div>
            </motion.div>
          </section>
        </Element>

        {/* Features Section */}
        <Element name="features">
          <section ref={featuresRef} className="py-20 px-4">
            <motion.div
              initial="hidden"
              animate={isInViewFeatures ? "visible" : "hidden"}
              variants={fadeInRight}
            >
              <FeatureSections featuresRef={featuresRef} controls={controls} />
            </motion.div>
          </section>
        </Element>

        {/* Showcase Section */}
        <Element name="showcase">
          <section ref={showcaseRef} className="py-20 px-4 bg-muted/20">
            <motion.div
              initial="hidden"
              animate={isInViewShowcase ? "visible" : "hidden"}
              variants={fadeInLeft}
            >
              <ShowcaseSection />
            </motion.div>
          </section>
        </Element>

        {/* Testimonials Section */}
        <Element name="testimonials">
          <section ref={testimonialsRef} className="py-20 px-4">
            <motion.div
              initial="hidden"
              animate={isInViewTestimonials ? "visible" : "hidden"}
              variants={fadeInRight}
            >
              <TestimonialsSection />
            </motion.div>
          </section>
        </Element>

        {/* FAQ Section */}
        <Element name="faq">
          <section ref={faqRef} className="py-20 px-4 bg-muted/20">
            <motion.div
              initial="hidden"
              animate={isInViewFAQ ? "visible" : "hidden"}
              variants={fadeInLeft}
            >
              <FAQSection />
            </motion.div>
          </section>
        </Element>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <LandingCTA handleSignInClick={handleSignInClick} />
        </section>
      </main>

      {/* Scroll to Top Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: showScrollTop ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className={`fixed bottom-8 right-8 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors duration-200 ${
          showScrollTop ? "visible" : "invisible"
        }`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Scroll to top"
      >
        <ArrowUp className="h-6 w-6" />
      </motion.button>
    </div>
  );
}

