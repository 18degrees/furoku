'use client'

import { AlertsContext } from '@/app/components/providers/Alerts/AlertsProvider'
import { useHttp } from '@/app/hooks/http.hook'
import { useSession } from 'next-auth/react'
import { useContext, useState } from 'react'
import { ibm_plex_sans_jp } from '@/app/fonts'
import style from './card.module.css'

interface FilledCard {
    mode: 'FILLED'
    isCardAdded: boolean
    writing: string
    index?: string
    setHasCardJustBeenAdded: (isAdded: boolean) => void
}
interface PreloadCard {
    mode: 'PRELOAD'
}
type CardProps = FilledCard | PreloadCard

export function Card(props: CardProps) {
    const mode = props.mode

    const {data: session} = useSession()
    const {request} = useHttp()
    const [isCardAdded, setIsCardAdded] = useState(mode === 'FILLED' ? props.isCardAdded : false)

    const alerts = useContext(AlertsContext)

    const writing = mode === 'PRELOAD' ? '?' : props.writing
    const index = mode === 'PRELOAD' ? 'загрузка...' : props.index

    async function addKanji() {
        if (mode === 'PRELOAD') return

        try {
            const body = await request({
                path: '/api/profile/kanji',
                body: {writing: props.writing},
                method: 'POST'
            })

            if (body instanceof Error) throw body
            
            props.setHasCardJustBeenAdded(true)

            setIsCardAdded(true)
            
            if (body.message && body.applicableFor && body.applicableFor === 'alert') {
                alerts.pushAlert({
                    message: body.message,
                    status: body.success ? 'success' : 'error'
                })
            }
        } catch (error) {
            console.log(error)

            alerts.pushAlert({
                message: 'Сохранить иероглиф не удалось. Попробуйте позже',
                status: 'error'
            })
        }
    }


    return (
        <div className={style['card-container']}>
            <div 
                className={`${style.card} ${mode === 'PRELOAD' ? 'blank' : ''}`}
            >
                <span className={style.index}>{index ? index : '?'}</span>
                <span className={`${style.kanji} ${ibm_plex_sans_jp.className}`}>{writing}</span>
                <div className={`${style['btn-box']} ${session && mode === 'FILLED' ? '' : style.inactive}`}>
                    {
                        !isCardAdded ? 
                            <button 
                                className={`${style['kanji-btn']} ${style['add']}`}
                                onClick={() => addKanji()}
                            >Добавить</button> :
                            <span 
                                className={style['added-kanji-plug']}
                            >Добавлен</span>
                    }
                </div>
            </div>
        </div>
    )
}