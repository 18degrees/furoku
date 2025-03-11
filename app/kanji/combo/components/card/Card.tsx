'use client'

import { AlertsContext } from '@/app/components/providers/Alerts/AlertsProvider'
import { useHttp } from '@/app/hooks/http.hook'
import { useSession } from 'next-auth/react'
import { useContext, useState } from 'react'
import { ibm_plex_sans_jp } from '@/app/fonts'
import { Plus } from '../../../components/Plus'
import style from './card.module.css'
import { Minus } from '../../../components/Cross'
import { IDefaultBodyResponse } from '@/app/interfaces/response.interface'

interface FilledCard {
    mode: 'FILLED'
    id: string
    isCardAdded: boolean
    variants: [{
        writing: string
        readings: [string]
    }]
    meanings: [string]
    index: {
        filter?: number
        sort: number
    }
    setHasStateOfComboJustBeenChanged: (isAdded: boolean) => void
}
interface PreloadCard {
    mode: 'PRELOAD'
}
type CardProps = FilledCard | PreloadCard

const path = '/api/profile/kanji/combo'

export function Card(props: CardProps) {
    const mode = props.mode

    const {data: session} = useSession()
    const {request} = useHttp()
    const [isCardAdded, setIsCardAdded] = useState(mode === 'FILLED' ? props.isCardAdded : false)

    const alerts = useContext(AlertsContext)

    const primeWriting = mode === 'PRELOAD' ? '?' : props.variants[0].writing
    const readingsOfPrime = mode === 'PRELOAD' ? '' : props.variants[0].readings
    const meanings = mode === 'PRELOAD' ? '' : props.meanings
    const sort = mode === 'PRELOAD' ? 'загрузка...' : props.index.sort
    const filter = mode === 'FILLED' ? props.index.filter : undefined
    const variants = mode === 'FILLED' ? props.variants.slice(1) : []

    async function addCombo() {
        if (mode === 'PRELOAD') return

        try {
            const body = await request({
                path,
                body: {id: props.id},
                method: 'POST'
            })

            if (body instanceof Error) throw body
            
            props.setHasStateOfComboJustBeenChanged(true)

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
                message: 'Сохранить сочетание не удалось. Попробуйте позже',
                status: 'error'
            })
        }
    }
    async function removeCombo() {
        if (mode === 'PRELOAD') return

        try {
            const resBody = await request({
                path,
                method: 'DELETE',
                body: [props.id]
            }) as IDefaultBodyResponse

            if (resBody.message && resBody.applicableFor === 'alert') {
                alerts.pushAlert({
                    message: resBody.message,
                    status: resBody.success ? 'success' : 'error'
                })
            }

            props.setHasStateOfComboJustBeenChanged(false)

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
            <div className={`${style.card} card`}>
                <span className={style.sort}>{sort ? sort : '?'}</span>
                <p className={`${style.writing} ${ibm_plex_sans_jp.className}`}>{primeWriting}</p>
                <div className={`${style.readings} ${ibm_plex_sans_jp.className}`}>
                    {
                        readingsOfPrime ? readingsOfPrime.map(reading => <p key={reading}>{reading}</p>) : null
                    }
                </div>
                <div className={style.meanings}>
                    {
                        meanings ? meanings.map((meaning) => <p key={meaning}>{meaning}</p>) : null
                    }
                </div>
                {
                    variants[0] ? 
                        <div className={`${style.variants} ${ibm_plex_sans_jp.className}`}>
                            {variants.map(variant => {
                                return (
                                    <div key={variant.writing}>
                                        <p className={style.writing}>{variant.writing}</p>
                                        <div className={style.readings}>
                                            {variant.readings.map(reading => <p key={reading}>{reading}</p>)}
                                        </div>
                                    </div>
                                )
                            })}
                        </div> :
                        null
                }
            </div>
            <button 
                className={session && mode === 'FILLED' ? '' : style.inactive}
                onClick={() => isCardAdded ? removeCombo() : addCombo()}
                >{isCardAdded ? <Minus/> : <Plus/>}
            </button>
        </div>
    )
}