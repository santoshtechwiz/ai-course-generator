import Link from 'next/link'
import { Search, BookOpen, HelpCircle, PlusCircle } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl w-full space-y-8 text-center">
          <Image
            src="/404-illustration.svg"
            alt="404 Illustration"
            width={300}
            height={300}
            className="mx-auto"
          />
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Oops! Page not found
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="mt-6">
            <form className="mt-2 flex rounded-md shadow-sm">
              <Input
                type="text"
                name="search"
                id="search"
                className="flex-1 min-w-0 rounded-l-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Search for content"
              />
              <Button type="submit" className="-ml-px relative inline-flex items-center rounded-r-md px-4 py-2">
                <Search className="h-5 w-5" />
                <span className="sr-only">Search</span>
              </Button>
            </form>
          </div>
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Suggested Pages</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/dashboard/courses" className="block">
                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <BookOpen className="h-12 w-12 text-indigo-500 mb-2" />
                    <h3 className="font-semibold text-lg">Courses</h3>
                    <p className="text-sm text-gray-600">Explore our courses</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/dashboard/quizzes" className="block">
                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <HelpCircle className="h-12 w-12 text-indigo-500 mb-2" />
                    <h3 className="font-semibold text-lg">Quizzes</h3>
                    <p className="text-sm text-gray-600">Test your knowledge</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/dashboard/create" className="block">
                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <PlusCircle className="h-12 w-12 text-indigo-500 mb-2" />
                    <h3 className="font-semibold text-lg">Create New</h3>
                    <p className="text-sm text-gray-600">Start a new project</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
          <div className="mt-8">
            <Button asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        </div>
      </main>
      <footer className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <nav className="-mx-5 -my-2 flex flex-wrap justify-center" aria-label="Footer">
            <div className="px-5 py-2">
              <Link href="/privacy" className="text-base text-gray-500 hover:text-gray-900">
                Privacy Policy
              </Link>
            </div>
            <div className="px-5 py-2">
              <Link href="/terms" className="text-base text-gray-500 hover:text-gray-900">
                Terms of Service
              </Link>
            </div>
            <div className="px-5 py-2">
              <Link href="/contact" className="text-base text-gray-500 hover:text-gray-900">
                Contact
              </Link>
            </div>
          </nav>
        </div>
      </footer>
    </div>
  )
}

