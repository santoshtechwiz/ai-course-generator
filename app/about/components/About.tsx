'use client'

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import CTA from "./CTA"
import ParallaxBackground from "./ParallaxBackground"
import Icon from "./Icon"

import BrainSVG from "./BrainSvg"


export default function About() {
  const [scrollY, setScrollY] = useState(0)
  const aboutRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <div ref={aboutRef} className="relative min-h-screen overflow-hidden bg-light-gray">
      <ParallaxBackground scrollY={scrollY} />

      <main className="relative z-10 px-4 py-16 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <motion.h1 
          className="mb-8 text-4xl font-bold text-center text-primary md:text-5xl"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          Why CourseAI?
        </motion.h1>

        <motion.p 
          className="mb-12 text-xl text-center text-gray-700 md:text-2xl"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          Easily create any course on any topic with CourseAI, designed for busy professionals like you.
        </motion.p>

        <motion.section 
          className="mb-16"
          ref={ref}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={fadeInUp}
        >
          <h2 className="mb-6 text-3xl font-semibold text-center text-primary md:text-4xl">
            About Us
          </h2>
          <p className="mb-4 text-lg text-center text-gray-700 md:text-xl">
            CourseAI is an educational platform designed to allow anyone—whether an expert or a beginner—to easily create and share courses on any topic. We understand that time is valuable, so we've made course creation quick, effective, and flexible.
          </p>
          <div className="flex justify-center mt-8">
            <BrainSVG className="w-64 h-64 text-primary" />
          </div>
        </motion.section>

        <motion.section 
          className="mb-16"
          ref={ref}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={fadeInUp}
        >
          <h2 className="mb-6 text-3xl font-semibold text-center text-primary md:text-4xl">
            Our Core Values
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <CoreValue
              icon="clock"
              title="Effortless Course Creation"
              description="Create any course easily with our intuitive platform and templates."
            />
            <CoreValue
              icon="device"
              title="On-the-Go Learning"
              description="Access your courses from any device, at any time, from anywhere."
            />
            <CoreValue
              icon="users"
              title="Built by Professionals"
              description="CourseAI is designed by experts who understand the needs of professionals."
            />
            <CoreValue
              icon="wallet"
              title="Affordable and Flexible"
              description="Affordable pricing for everyone, making course creation accessible to all."
            />
          </div>
        </motion.section>

        <motion.section 
          className="mb-16"
          ref={ref}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={fadeInUp}
        >
          <h2 className="mb-6 text-3xl font-semibold text-center text-primary md:text-4xl">
            Why We Created CourseAI
          </h2>
          <p className="mb-4 text-lg text-center text-gray-700 md:text-xl">
            While there are many platforms like Udemy and Codecademy offering online courses, they often come with high fees and lack the flexibility that busy professionals need. We created CourseAI to solve these problems. Our goal is to democratize education by allowing anyone to create a course and share knowledge on any topic, without the financial barrier.
          </p>
          <p className="mb-4 text-lg text-center text-gray-700 md:text-xl">
            Unlike Udemy, where course creators are limited by their content's pricing model, CourseAI gives you full control over your content. You can create a course for free, offer it for a fee, or even make it available to others at no cost. We believe in making education accessible, without the need for huge investments upfront.
          </p>
          <p className="mb-4 text-lg text-center text-gray-700 md:text-xl">
            And unlike Codecademy, which focuses mainly on coding and technical skills, CourseAI allows you to create courses on any topic imaginable—from business to cooking, from marketing to music. Whether you're an expert in your field or passionate about sharing your knowledge, CourseAI gives you the tools to share it with the world.
          </p>
          <p className="mb-4 text-lg text-center text-gray-700 md:text-xl">
            We created CourseAI to empower individuals to learn, teach, and grow without the limitations of traditional learning platforms.
          </p>
        </motion.section>

        <motion.section 
          className="mb-16"
          ref={ref}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={fadeInUp}
        >
          <h2 className="mb-6 text-3xl font-semibold text-center text-primary md:text-4xl">
            Quickly Test Your Knowledge
          </h2>
          <p className="mb-4 text-lg text-center text-gray-700 md:text-xl">
            Need to test your knowledge on any topic? With CourseAI, you can quickly create multiple choice, open-ended, or fill-in-the-blank questions in just seconds. Whether you're preparing for an exam, creating a quiz for your course, or simply testing your knowledge, we make it easy.
          </p>
      
        </motion.section>

        <motion.section 
          className="mb-16"
          ref={ref}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={fadeInUp}
        >
          <h2 className="mb-6 text-3xl font-semibold text-center text-primary md:text-4xl">
            Join CourseAI Today
          </h2>
          <p className="mb-8 text-lg text-center text-gray-700 md:text-xl">
            With CourseAI, creating a course or testing your knowledge on any topic is just a few clicks away. Start your journey today, and make your knowledge available to others while expanding your own.
          </p>
          <CTA />
        </motion.section>
      </main>
    </div>
  )
}

function CoreValue({ icon, title, description }) {
  return (
    <motion.div 
      className="flex flex-col items-center text-center"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Icon name={icon} className="w-16 h-16 mb-4 text-primary" />
      <h3 className="mb-2 text-xl font-semibold text-primary">{title}</h3>
      <p className="text-gray-700 text-lg">{description}</p>
    </motion.div>
  )
}
