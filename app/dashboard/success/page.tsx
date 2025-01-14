import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Subscription Successful!</h1>
      <p className="mb-4">Thank you for subscribing to our service.</p>
      <Button asChild>
        <Link href="/dashboard">Return to Home</Link>
      </Button>
    </div>
  );
}

