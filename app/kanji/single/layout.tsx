import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Кандзи по популярности',
    description: "Иероглифы, отсортированные по частоте употребления и доступные для повторения"
}

export default function Layout({children}: {children: React.ReactNode}) {
    return (
        <>
            {children}
        </>
    )
}