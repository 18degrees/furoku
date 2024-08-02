import { Metadata } from "next"

export const metadata: Metadata = {
    title: 'Зарегистрироваться'
}

export default function Layout({children}: {children: React.ReactNode}) {
    return (
        <>
            {children}
        </>
    )
}