import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Сочетания кандзи по популярности',
    description: 'Японские слова с переводом, отсортированные по частоте употребления и отфильтрованные по jlpt или классу прохождения употребляемых в них кандзи',
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