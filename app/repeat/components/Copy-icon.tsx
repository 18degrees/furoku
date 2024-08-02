interface CopyIconProps {
    isDisabled: boolean
}
export function CopyIcon({ isDisabled }: CopyIconProps) {
    const fillColor = isDisabled ? '#e5d9e7' : '#eee5ef'

    return (
        <svg xmlnsXlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" width="23px" height="22px" viewBox="0 0 23 22" version="1.1">
            <g id="lists">
                <path d="M6.57227 0L20.6549 0L20.6549 13.9954L6.57227 13.9954L6.57227 0Z" id="Rectangle" fill="#877685" fillRule="evenodd" stroke="#877685" strokeWidth="2"/>
                <path d="M0 5.77002L14.0825 5.77002L14.0825 19.7652L0 19.7652L0 5.77002Z" id="Rectangle" fill={fillColor} fillRule="evenodd" stroke="#877685" strokeWidth="2"/>
            </g>
        </svg>
    )
}