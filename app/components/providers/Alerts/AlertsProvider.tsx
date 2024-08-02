'use client'

import { createContext } from "react"
import { IAlert, alertsType } from "@/app/interfaces/alert.interface"
import { useAlert } from "@/app/hooks/alert.hook"
import style from './alertsProvider.module.css'

interface IAlertsContext {
    alerts: alertsType
    pushAlert: ({message, status}: IAlert) => void
}


export const AlertsContext = createContext<IAlertsContext>({
    alerts: null,
    pushAlert: ({}) => {}
})

export default function AlertsProvider({children}: {children: React.ReactNode}) {
    const {alerts, pushAlert} = useAlert()
    
    return (
        <AlertsContext.Provider value={{alerts, pushAlert}}>
            <div 
                className={`${style.container} container`}>
                {alerts}
            </div>
            <style jsx>{`
                .container {
                    display: ${alerts ? 'block' : 'none'}
                }
            `}</style>
            {children}
        </AlertsContext.Provider> 
    )
}