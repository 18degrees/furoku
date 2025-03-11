'use client'

import style from './spinner.module.css'
import { useAppSelector } from "@/app/hooks/redux.hook"

interface SpinnerProps {
    size: number
}

export function Spinner({size}: SpinnerProps) {
    const theme = useAppSelector((state) => state.theme.value)
    const color = theme === 'dark' ? '#c4c4c4' : '#d8a8a8'

    return (
        <>
            <div 
                className={style.spinner}
                style={{
                    borderBottomColor: color
                }}/>
            <style jsx>{`
                div {
                    height: ${size}px;
                    width: ${size}px
                }
            `}</style>
        </>
    )    
}