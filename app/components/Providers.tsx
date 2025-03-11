"use client"

import {SessionProvider} from 'next-auth/react'
import AlertsProvider from './providers/Alerts/AlertsProvider'
import StoreProvider from './providers/StoreProvider'
import { theme } from '../interfaces/theme.interface'

export const Providers = ({children}: {children: React.ReactNode}) => {
    const theme: theme = getTheme() 

    function getTheme() {
        try {
            const providedTheme = localStorage.getItem('theme') ?? null
            
            if (!providedTheme) {
                const isPreferedDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                
                if (isPreferedDark) return 'dark'
            } else {
                if (providedTheme === 'dark') return 'dark'
            }
            return 'light'
        } catch (error) {
            return 'light'
        }
    }

    return (
        <SessionProvider>
            <StoreProvider theme={theme}>
                <AlertsProvider>
                    {children}
                </AlertsProvider>
            </StoreProvider>
        </SessionProvider>
    )
}
