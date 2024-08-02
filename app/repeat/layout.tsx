import { Metadata } from "next"

export const metadata: Metadata = {
    title: 'Место для повторения'
}

export default function Layout({children}: {children: React.ReactNode}) {
    return (
        <>
            {children}
        </>
    )
}