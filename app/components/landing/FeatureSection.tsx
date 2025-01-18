"use client";

import { useRef, useEffect } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import { Element } from "react-scroll";
import { Brain, Sparkles, Rocket, BarChart, Book, Zap, Layout } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Brain,
    title: "AI Course Builder",
    description:
      "Generate comprehensive course outlines effortlessly with CourseAI's AI-powered topic suggestions.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Book,
    title: "Smart Content Generation",
    description:
      "Automatically curate educational materials tailored to your course's objectives and learners' needs.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Sparkles,
    title: "Interactive Assessments",
    description:
      "Create dynamic quizzes and tests with AI-generated questions, explanations, and feedback.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Rocket,
    title: "Personalized Learning Paths",
    description:
      "Offer adaptive learning experiences and personalized resources based on each learner's progress.",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: BarChart,
    title: "Progress Analytics",
    description:
      "Monitor learner progress with advanced analytics and get actionable insights to improve outcomes.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Layout,
    title: "User-Friendly Interface",
    description:
      "Navigate through a sleek, intuitive interface for easy course creation and management with CourseAI.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Zap,
    title: "Instant Course Creation",
    description:
      "Generate fully structured courses in minutes with CourseAI's powerful and fast AI technology.",
    gradient: "from-emerald-500 to-green-500",
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

type FeatureProps = {
  featuresRef: React.RefObject<HTMLElement>;
  controls: ReturnType<typeof useAnimation>;
};

export default function FeatureSections({ featuresRef, controls }: FeatureProps) {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  return (
    <Element name="features">
      <section ref={sectionRef} className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            animate={controls}
            variants={stagger}
            className="space-y-12"
          >
            <motion.div variants={fadeInUp} className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Powerful Features</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Everything you need to create and manage engaging online courses
              </p>
            </motion.div>

            <motion.div
              variants={stagger}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  variants={fadeInUp}
                  custom={idx}
                >
                  <Card
                    className="relative overflow-hidden border-none bg-gradient-to-br bg-opacity-10 hover:bg-opacity-20 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg h-full"
                  >
                    <motion.div
                      className={cn(
                        "absolute inset-0 opacity-10 bg-gradient-to-br",
                        feature.gradient
                      )}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 0.1 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    />
                    <CardHeader>
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 200 }}
                      >
                        <feature.icon
                          className={cn(
                            "h-8 w-8 mb-2",
                            `text-gradient ${feature.gradient}`
                          )}
                        />
                      </motion.div>
                      <CardTitle>{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground">
                      {feature.description}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>
    </Element>
  );
}

