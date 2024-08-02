'use client'

import style from './spinner.module.css'

interface SpinnerProps {
    size: number
}

export function Spinner({size}: SpinnerProps) {
    return (
        <>
            <div className={style.spinner}/>
            <style jsx>{`
                div {
                    height: ${size}px;
                    width: ${size}px
                }
            `}</style>
        </>
    )    
}