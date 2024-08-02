'use client'

import { IAlert, alertsType } from "../interfaces/alert.interface"
import { Alert } from "../components/alert/Alert"
import { useState } from "react"

export function useAlert() {
    const [alerts, setAlerts] = useState<alertsType>(null)
    
    function pushAlert({message, status}: IAlert) {
        const key = (Math.trunc(Date.now() * Math.random())).toString()
    
        setAlerts(prevAlerts => {

            if (status === 'error') {
                const isThereSameMessage = prevAlerts?.find(anotherAlert => anotherAlert.props.message === message)
    
                if (isThereSameMessage) return prevAlerts
            }
    
            const alert = <Alert 
                message={message} 
                status={status} 
                key={key}
                id={key}
                deleteAlert={deleteAlert}
            />
            
            if (prevAlerts) {
                return [alert, ...prevAlerts]
            } else {
                return [alert]
            }
        })
    }

    function deleteAlert(keyToDelete: string) {
        setAlerts(allAlerts => {
            if (!allAlerts) return null

            const remainingAlerts = [...allAlerts]
            
            remainingAlerts.forEach((alert, i) => {
                if (alert.key === keyToDelete) {
                    remainingAlerts.splice(i, 1)
                }
            })


            return isThereAlert(remainingAlerts) ? remainingAlerts : null
        })

        function isThereAlert(alerts: JSX.Element[]): boolean {
            return alerts[0] ? true : false
        }

    }
    return {alerts, pushAlert}
}