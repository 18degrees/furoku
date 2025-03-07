'use client'

import { useEffect } from 'react'
import { useAppSelector } from '../hooks/redux.hook'

export function ClientStyleWrapper({ 
    children 
}: { 
    children: React.ReactNode 
}) {
    const theme = useAppSelector(state => state.theme.value)

    useEffect(() => {
        document.documentElement.classList.add('loaded')

        if (theme === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [])

    return <>{children}</>
}