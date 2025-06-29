import { Roboto, Poppins, Open_Sans } from 'next/font/google'
const roboto = Roboto({
 weight: ['400', '700'],
 subsets: ['latin'],
 display: 'swap',
})
const poppins = Poppins({
 weight: ['400', '600'],
 subsets: ['latin'],
 display: 'swap',
})
const openSans = Open_Sans({
 subsets: ['latin'],
 display: 'swap',
})


export const font = {
  roboto,
  poppins,
  openSans,
}