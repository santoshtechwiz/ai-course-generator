import { Button } from '@/components/ui/button'

export default function CtaSection() {
  return (
    <section className="py-16 bg-primary text-primary-foreground">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
        <p className="text-xl mb-8">Join thousands of learners and boost your skills today!</p>
        <Button size="lg" variant="secondary">Sign Up Now</Button>
      </div>
    </section>
  )
}

