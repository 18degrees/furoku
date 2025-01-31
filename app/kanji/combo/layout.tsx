import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Сочетания кандзи по порядку',
    description: 'Сочетания иероглифов, отфильтрованные по jlpt или классу прохождения и отсортированные по частоте употребления на вики',
    alternates: {
        canonical: '/kanji/combo'
    }
}

export default function Layout({children}: {children: React.ReactNode}) {
    return (
        <>
            {children}
        </>
    )
}