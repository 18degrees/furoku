import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Кандзи по популярности',
    description: 'Иероглифы, отфильтрованные по jlpt или классу прохождения и отсортированные по частоте употребления или количеству черт',
    alternates: {
        canonical: '/kanji/single'
    }
}

export default function Layout({children}: {children: React.ReactNode}) {
    return (
        <>
            {children}
        </>
    )
}