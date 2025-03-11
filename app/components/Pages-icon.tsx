'use client'

import { useAppSelector } from "../hooks/redux.hook"

export function PagesIcon() {
    const theme = useAppSelector((state) => state.theme.value)
    const backgroundColor = theme === 'dark' ? '#B9B9B9' : '#818080'

    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25" fill="none">
            <g>
                <rect width="24" height="5" fill={backgroundColor} fillRule="evenodd"/>
                <rect width="24" height="5" fill={backgroundColor} fillRule="evenodd" transform="translate(0 10)"/>
                <rect width="24" height="5" fill={backgroundColor} fillRule="evenodd" transform="translate(0 20)"/>
            </g>
        </svg>
    )
}