import { Metadata } from "next"

export const metadata: Metadata = {
    title: 'Тестирование'
}


export default function Layout({children}: {children: React.ReactNode}) {
    return (
        <>
            {children}
        </>
    )
}