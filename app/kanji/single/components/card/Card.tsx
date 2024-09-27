'use client'

import { AlertsContext } from '@/app/components/providers/Alerts/AlertsProvider'
import { useHttp } from '@/app/hooks/http.hook'
import { useSession } from 'next-auth/react'
import { useContext, useState } from 'react'
import { ibm_plex_sans_jp } from '@/app/fonts'
import { Plus } from './components/Plus'
import style from './card.module.css'
import { Minus } from './components/Cross'
import { IDefaultBodyResponse } from '@/app/interfaces/response.interface'

interface FilledCard {
    mode: 'FILLED'
    isCardAdded: boolean
    writing: string
    index: {
        filter?: number
        sort?: number
    }
    setHasStateOfKanjiJustBeenChanged: (isAdded: boolean) => void
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
    const sort = mode === 'PRELOAD' ? 'загрузка...' : props.index.sort
    const filter = mode === 'FILLED' ? props.index.filter : undefined

    async function addKanji() {
        if (mode === 'PRELOAD') return

        try {
            const body = await request({
                path: '/api/profile/kanji',
                body: {writing: props.writing},
                method: 'POST'
            })

            if (body instanceof Error) throw body
            
            props.setHasStateOfKanjiJustBeenChanged(true)

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
    async function removeKanji() {
        if (mode === 'PRELOAD') return

        try {
            const resBody = await request({
                path: '/api/profile/kanji',
                method: 'DELETE',
                body: [writing]
            }) as IDefaultBodyResponse

            if (resBody.message && resBody.applicableFor === 'alert') {
                alerts.pushAlert({
                    message: resBody.message,
                    status: resBody.success ? 'success' : 'error'
                })
            }

            props.setHasStateOfKanjiJustBeenChanged(false)

            setIsCardAdded(false)

            
        } catch (error) {
            alerts.pushAlert({
                message: 'Произошла ошибка. Попробуйте позже',
                status: 'error'
            })
        }
    }


    return (
        <div className={style['card-container']}>
            <div 
                className={`${style.card} ${mode === 'PRELOAD' ? 'blank' : ''}`}
            >
                <span className={style.sort}>{sort ? sort : '?'}</span>
                {filter ? <span className={style.filter}>{filter}</span> : null}
                <span className={`${style.kanji} ${ibm_plex_sans_jp.className}`}>{writing}</span>
                <div className={`${style['btn-box']} ${session && mode === 'FILLED' ? '' : style.inactive}`}>
                    <button 
                        onClick={() => isCardAdded ? removeKanji() : addKanji()}
                        >{isCardAdded ? <Minus/> : <Plus/>}
                    </button>
                </div>
            </div>
        </div>
    )
}