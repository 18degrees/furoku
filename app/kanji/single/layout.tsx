import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Список кандзи',
    description: 'Иероглифы, отсортированные по: jlpt, частоте употребления, классу прохождения, количеству черт'
}

export default function Layout({children}: {children: React.ReactNode}) {
    return (
        <>
            {children}
        </>
    )
}