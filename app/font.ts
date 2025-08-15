import { Inter, Poppins, Open_Sans, Roboto } from 'next/font/google'

// Primary font - Inter for body text
const inter = Inter({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

// Heading font - Poppins for titles and headings
const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
})

// Secondary font - Open Sans for alternative text
const openSans = Open_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-open-sans',
})

// Fallback font - Roboto for system compatibility
const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
})

export const font = {
  inter,
  poppins,
  openSans,
  roboto,
}