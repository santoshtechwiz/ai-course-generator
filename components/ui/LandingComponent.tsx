"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, useAnimation } from "framer-motion";
import { Element, Link as ScrollLink } from "react-scroll";
import { Brain, Sparkles, Rocket, BarChart, Book, Zap, Layout, Share2, ArrowUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";


import { cn } from "@/lib/utils";
import FeatureVideo from "@/app/components/animations/FeatureVideo";
import ShowcaseSection from "../ShowcaseSection";

import HowItWorks from "@/app/components/HowItWorks";
import { FAQSection } from "@/app/components/faq-section";
import { TestimonialsSection } from "@/app/components/testimonials-section";
import LandingHeader from "../LanndingHeader";

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

export default function LandingComponent() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const featuresRef = useRef(null);
  const isInView = useInView(featuresRef, { once: true, margin: "-100px" });
  const controls = useAnimation();

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [controls, isInView]);

  const handleTopicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic) {
      router.push(`/dashboard/create?topic=${encodeURIComponent(topic)}`);
    }else{
      router.push('/dashboard/create');
    }
  };

  const handleSignInClick = () => {
     router.push('/auth/signin?callbackUrl=/dashboard');
  }

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* Hero Section */}
      <Element name="hero">
        <section className="pt-32 pb-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="space-y-12"
            >
              <div className="text-center space-y-8">
                <motion.h1
                  variants={fadeInUp}
                  className="text-4xl md:text-6xl font-bold tracking-tight"
                >
                  Create AI-Powered Courses
                  <span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
                    {" "}
                    in Minutes
                  </span>
                </motion.h1>

                <motion.p
                  variants={fadeInUp}
                  className="text-xl text-muted-foreground max-w-2xl mx-auto"
                >
                  Transform your knowledge into engaging courses with
                  AI-generated content, interactive quizzes, and personalized
                  learning paths.
                </motion.p>

                <motion.div variants={fadeInUp}>
                  <form
                    onSubmit={handleTopicSubmit}
                    className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto"
                  >
                    <Input
                      type="text"
                      placeholder="Enter a course topic..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="h-12 text-lg flex-grow"
                      aria-label="Course topic"
                    />
                    <Button
                      type="submit"
                      size="lg"
                      className="h-12 px-8 w-full sm:w-auto"
                    >
                      Generate Course
                    </Button>
                  </form>
                </motion.div>
              </div>

              <motion.div
                variants={fadeInUp}
                className="max-w-4xl mx-auto w-full"
              >
                <main className="min-h-screen bg-gradient-to-b from-background to-background/80 flex items-center justify-center p-4">
                  <div className="w-full ">
                    <FeatureVideo />
                  </div>
                </main>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </Element>

      {/* How It Works Section */}
      <Element name="how-it-works">
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="space-y-12"
            >
              <motion.div variants={fadeInUp} className="text-center space-y-4">
                <h2 className="text-3xl font-bold">How It Works</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  See how our AI transforms your ideas into a complete course
                </p>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <HowItWorks />
              </motion.div>
            </motion.div>
          </div>
        </section>
      </Element>

      {/* Features Section */}
      <Element name="features">
        <section ref={featuresRef} className="py-20 px-4">
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
                  Everything you need to create and manage engaging online
                  courses
                </p>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {features.map((feature, idx) => (
                  <Card
                    key={idx}
                    className="relative overflow-hidden border-none bg-gradient-to-br bg-opacity-10 hover:bg-opacity-20 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div
                      className={cn(
                        "absolute inset-0 opacity-10 bg-gradient-to-br",
                        feature.gradient
                      )}
                    />
                    <CardHeader>
                      <feature.icon
                        className={cn(
                          "h-8 w-8 mb-2",
                          `text-gradient ${feature.gradient}`
                        )}
                      />
                      <CardTitle>{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground">
                      {feature.description}
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>
      </Element>

      {/* Showcase Section */}
      <Element name="showcase">
        <ShowcaseSection />
      </Element>

      {/* Testimonials Section */}
      <Element name="testimonials">
        <TestimonialsSection />
      </Element>

      {/* FAQ Section */}
      <Element name="faq">
        <FAQSection />
      </Element>

      {/* CTA Section */}
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
              className="text-3xl md:text-4xl font-bold"
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
                onClick={() => handleSignInClick()}
                className="h-12 px-8 text-lg w-full sm:w-auto"
              >
                <Zap className="mr-2 h-5 w-5" />
                Get Started for Free
              </Button>
            </motion.div>
          </motion.div>
        </section>
      </Element>

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

