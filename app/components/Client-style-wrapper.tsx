'use client'

import { useEffect } from 'react'

export function ClientStyleWrapper({ 
    children 
}: { 
    children: React.ReactNode 
}) {
    useEffect(() => {
        document.documentElement.classList.add('loaded')
    }, [])

    return <>{children}</>
}