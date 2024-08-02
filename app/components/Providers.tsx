"use client"

import {SessionProvider} from 'next-auth/react'
import AlertsProvider from './providers/Alerts/AlertsProvider'

export const Providers = ({children}: {children: React.ReactNode}) => {
    return (
        <SessionProvider>
            <AlertsProvider>
                {children}
            </AlertsProvider>
        </SessionProvider>
    )
}
