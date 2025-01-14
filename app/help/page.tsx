'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { BookOpen, HelpCircle, Mail, MessageCircle, Phone } from 'lucide-react'

export default function HelpAndSupport() {
  const [activeSection, setActiveSection] = useState('faq')

  const faqItems = [
    { question: "How do I enroll in a course?", answer: "To enroll in a course, simply navigate to the course page and click the 'Enroll' button. Follow the prompts to complete your registration." },
    { question: "Can I access the courses on mobile devices?", answer: "Yes, our platform is fully responsive and optimized for mobile devices. You can access your courses on smartphones and tablets." },
    { question: "What payment methods do you accept?", answer: "We accept various payment methods including credit/debit cards, PayPal, and bank transfers. Check our payment page for more details." },
    { question: "How do I reset my password?", answer: "To reset your password, click on the 'Forgot Password' link on the login page. Follow the instructions sent to your email to create a new password." },
    { question: "Are the courses self-paced?", answer: "Most of our courses are self-paced, allowing you to learn at your own speed. Some courses may have specific start and end dates, which will be clearly indicated." },
  ]

  const howItWorksSteps = [
    { title: "Browse Courses", description: "Explore our wide range of courses and find the perfect fit for your learning goals.", icon: BookOpen },
    { title: "Enroll", description: "Sign up for your chosen course with just a few clicks.", icon: HelpCircle },
    { title: "Learn", description: "Access course materials, complete assignments, and track your progress.", icon: BookOpen },
    { title: "Get Support", description: "Reach out to our support team or engage with fellow learners in course forums.", icon: MessageCircle },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        <h1 className="text-4xl font-bold text-center mb-8">Help & Support</h1>
        
        <div className="flex justify-center space-x-4 mb-8">
          <Button
            variant={activeSection === 'faq' ? 'default' : 'outline'}
            onClick={() => setActiveSection('faq')}
          >
            FAQ
          </Button>
          <Button
            variant={activeSection === 'howItWorks' ? 'default' : 'outline'}
            onClick={() => setActiveSection('howItWorks')}
          >
            How It Works
          </Button>
          <Button
            variant={activeSection === 'contact' ? 'default' : 'outline'}
            onClick={() => setActiveSection('contact')}
          >
            Contact Us
          </Button>
        </div>

        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeSection === 'faq' && (
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>Find quick answers to common questions about CourseAI.</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger>{item.question}</AccordionTrigger>
                      <AccordionContent>{item.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}

          {activeSection === 'howItWorks' && (
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
                <CardDescription>Learn how to get started with CourseAI in just a few steps.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {howItWorksSteps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <step.icon className="mr-2" />
                            {step.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p>{step.description}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'contact' && (
            <Card>
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
                <CardDescription>Get in touch with our support team for personalized assistance.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" placeholder="Your name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="Your email" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" placeholder="How can we help you?" />
                  </div>
                  <Button type="submit">Send Message</Button>
                </form>
                <div className="mt-8 flex flex-col space-y-2">
                  <p className="flex items-center"><Phone className="mr-2" /> +1 (555) 123-4567</p>
                  <p className="flex items-center"><Mail className="mr-2" /> support@courseai.com</p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}

