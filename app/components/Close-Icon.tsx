'use client'

import { useAppSelector } from "../hooks/redux.hook"

export function CloseIcon() {
    const theme = useAppSelector((state) => state.theme.value)
    const backgroundColor = theme === 'dark' ? '#B9B9B9' : '#818080'

    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <g>
                <path d="M17.132 0L19.9905 2.8585L2.8585 19.9904L0 17.1319L17.132 0Z" fill={backgroundColor} fillRule="evenodd" transform="translate(0 0)"/>
                <path d="M0 2.8585L2.8585 0L20 17.1415L17.1415 20L0 2.8585Z" fill={backgroundColor} fillRule="evenodd" transform="translate(0 0)"/>
            </g>
        </svg>
    )
}