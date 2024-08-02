import { Shippori_Mincho, Alegreya, Alegreya_Sans, IBM_Plex_Sans_JP } from 'next/font/google'

export const alegreya = Alegreya({weight: ['400'], subsets: ['cyrillic', 'latin']}) 
export const alegreya_sans = Alegreya_Sans({weight: ['400', '500'], subsets: ['cyrillic', 'latin']})

export const shippori_mincho = Shippori_Mincho({weight: ['400'], subsets: ['latin-ext']})
export const ibm_plex_sans_jp = IBM_Plex_Sans_JP({weight: ['200'], subsets: ['latin-ext']})