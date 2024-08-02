import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Кандзи по популярности',
    description: "Иероглифы, доступные для сохранения и повторения"
}

export default function Layout({children}: {children: React.ReactNode}) {
    return (
        <>
            {children}
        </>
    )
}