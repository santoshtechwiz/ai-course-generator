"use client";

import { motion } from "framer-motion";
import { Element } from "react-scroll";
import { Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";

type LandingCTAProps = {
  handleSignInClick: () => void;
}

const LandingCTA = ({ handleSignInClick }: LandingCTAProps) => {
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };
  
  const stagger = {
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <Element name="cta">
      <section className="py-20 px-4 bg-muted/30">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="container mx-auto max-w-6xl text-center space-y-8"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-bold text-gradient"
          >
            Ready to Revolutionize Your Learning?
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Join thousands of educators and learners creating AI-powered
            courses today!
          </motion.p>

          <motion.div variants={fadeInUp}>
            <Button
              size="lg"
              onClick={handleSignInClick}
              className="h-12 px-8 text-lg w-full sm:w-auto"
            >
              <Zap className="mr-2 h-5 w-5" />
              Get Started for Free
            </Button>
          </motion.div>
        </motion.div>
      </section>
    </Element>
  );
}

export default LandingCTA;
