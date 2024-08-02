import { Metadata } from "next"

export const metadata: Metadata = {
    title: 'Войти в систему'
}

export default function Layout({children}: {children: React.ReactNode}) {
    return (
        <>
            {children}
        </>
    )
}