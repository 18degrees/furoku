'use client'
import { useEffect, useRef } from 'react'
import { Provider } from 'react-redux'
import { makeStore, AppStore } from '@/lib/store'
import { setInitialTheme } from '@/lib/features/theme/themeSlice'
import { theme } from '@/app/interfaces/theme.interface'

export default function StoreProvider({
    theme,
    children
}: {
    theme: theme,
    children: React.ReactNode
}) {
    const storeRef = useRef<AppStore | null>(null)

    if (!storeRef.current) {
        storeRef.current = makeStore()
        storeRef.current.dispatch(setInitialTheme(theme))
    }

    return <Provider store={storeRef.current}>{children}</Provider>
}