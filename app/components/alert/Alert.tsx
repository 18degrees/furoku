import { IAlert } from '@/app/interfaces/alert.interface'
import { useCallback, useEffect, useRef, useState } from 'react'
import style from './alert.module.css'

interface AlertProps extends IAlert {
    id: string
    deleteAlert: (keyToDelete: string) => void
}

type extraClassType = '' | 'disappearing'

const MS_TO_START_DIAPPEARING = 4000
const MS_TO_DELETE = 7000

export function Alert({message, status, id, deleteAlert}: AlertProps) {
    
    const isItFirstLoading = useRef(true)
    
    const background = status === 'success' ? '#EECFEA' : status === 'error' ? '#EBB6BA' : '#FFE6F3'
    
    let timeoutOfDisappearingID = useRef<ReturnType<typeof setTimeout>>()
    let timeoutOfDeletingID = useRef<ReturnType<typeof setTimeout>>()
    
    const [extraClass, setExtaClass] = useState<extraClassType>('')
    
    const setTimeouts = useCallback(() => {
        timeoutOfDisappearingID.current = setTimeout(() => {
            setExtaClass('disappearing')
        }, MS_TO_START_DIAPPEARING)

        timeoutOfDeletingID.current = setTimeout(() => {
            deleteAlert(id)
        }, MS_TO_DELETE)
    }, [id, deleteAlert])

    useEffect(() => {
        if (isItFirstLoading.current) setTimeouts()

        isItFirstLoading.current = false
    }, [setTimeouts])

    
    function onAlertOver() {
        clearTimeout(timeoutOfDisappearingID.current)
        clearTimeout(timeoutOfDeletingID.current)

        setExtaClass('')
    }

    function onAlertOut() {
        setTimeouts()
    }

    return (
        <div 
            className={`${style.alert} alert`}
            onMouseOver={onAlertOver}
            onMouseOut={onAlertOut}>
            {message}
            <style jsx>{`
                .alert {
                    background-color: ${background};
                    ${extraClass ? `
                    transition: all 3s;
                    opacity: 0                    
                    ` : null}
                }
            `}</style>
        </div>
    )
}