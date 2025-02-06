import { Metadata } from "next"

export const metadata: Metadata = {
    title: 'Повторение'
}

export default function Layout({children}: {children: React.ReactNode}) {
    return (
        <>
            {children}
        </>
    )
}