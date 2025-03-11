'use client'

import { useAppSelector } from "@/app/hooks/redux.hook"


export function SortTriangle() {
    const theme = useAppSelector((state) => state.theme.value)
    const backgroundColor = theme === 'dark' ? '#dadada' : ' #B197AF'

    return (
        <svg xmlnsXlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" width="10" height="5" viewBox="0 0 10 5" fill="none" stroke="none" version="1.1">
        <g id="triangle" opacity="1">
            <path d="M10 0L10 0L10 5L0 5L0 0L10 0Z" style={{mixBlendMode: 'normal'}}/>
            <path id="triangle" d="M0 10L5 5L0 0L0 10Z" transform="matrix(0 1 -1 0 10 0)" style={{fill: backgroundColor, fillRule: 'evenodd', mixBlendMode: 'normal'}}/>
        </g>
        </svg>
    )
}