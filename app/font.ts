import { Inter, Roboto } from 'next/font/google'

export const fontInterSans = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const fontRobotoSans = Roboto({
  weight: ['100', '300', '400', '500'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-roboto',
  display: 'swap',
})