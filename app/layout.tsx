import { Header } from './components/header/Header'
import { Footer } from './components/footer/Footer'
import { Providers } from './components/Providers'
import style from './layout.module.css'
import { alegreya_sans } from './fonts'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | furoku',
    default: 'Помощник в повторении кандзи'
  },
  description: "Сортировка изучаемых иероглифов по срочности повторения"
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ru">
        <body className={alegreya_sans.className}>
            <Providers>
                <Header/>
                <main className={style.main}>{children}</main>
                <Footer/>
            </Providers>
        </body>
    </html>
  )
}
