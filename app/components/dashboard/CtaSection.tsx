import { Button } from '@/components/ui/button'

export default function CtaSection() {
  return (
    <section className="py-12 px-4 bg-primary text-primary-foreground md:py-16 md:px-8">
      <div className="container mx-auto text-center">
        <h2 className="text-2xl font-semibold mb-4 md:text-3xl md:font-bold">Ready to Start Learning?</h2>
        <p className="text-lg mb-6 md:text-xl md:mb-8">Join thousands of learners and boost your skills today!</p>
        <Button size="lg" variant="secondary">Sign Up Now</Button>
      </div>
    </section>
  )
}

