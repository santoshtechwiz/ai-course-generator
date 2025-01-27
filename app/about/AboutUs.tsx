"use client"

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { RocketIcon, BrainCircuitIcon, UsersIcon, SparklesIcon } from "lucide-react";

const AboutUs = () => {
  const sections = [
    {
      title: "Our Mission",
      description:
        "At CourseAI, we aim to simplify course creation by leveraging the power of AI. Our mission is to empower educators and learners worldwide with seamless tools to share knowledge.",
      icon: <RocketIcon className="w-8 h-8 text-primary" />,
    },
    {
      title: "Our Vision",
      description:
        "Our vision is to create a world where learning is accessible, affordable, and engaging for everyone. We aspire to become the go-to platform for personalized and interactive learning, helping individuals unlock their potential and achieve their goals through innovative AI-driven solutions.",
      icon: <BrainCircuitIcon className="w-8 h-8 text-primary" />,
    },
    {
      title: "Meet the Founder",
      description:
        "Hi, I'm a seasoned software developer with 13 years of experience. I've always been passionate about learning new things, but I often found online courses to be very costly. This inspired me to create a platform where anyone can instantly generate quizzes on any topic to check their knowledge.",
      icon: <UsersIcon className="w-8 h-8 text-primary" />,
    },
    {
      title: "Future Plans",
      description:
        "We're constantly innovating to improve CourseAI. Our future plans include expanding AI capabilities for more interactive courses, introducing new subscription tiers with premium features, and building a thriving community of educators and learners.",
      icon: <SparklesIcon className="w-8 h-8 text-primary" />,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-16">
     

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="space-y-16"
      >
        {sections.map((section, index) => (
          <motion.div
            key={section.title}
            variants={itemVariants}
            className={`flex flex-col ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} items-center gap-6`}
          >
            <Card className="w-full md:w-1/2 overflow-hidden">
              <CardContent className="p-4 flex items-center justify-center">
                {section.icon}
              </CardContent>
            </Card>
            <div className="w-full md:w-1/2 space-y-3">
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <p className="text-sm text-muted-foreground">{section.description}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <Button size="lg" className="px-6">
          Get in Touch
        </Button>
      </motion.div>
    </div>
  );
};

export default AboutUs;
