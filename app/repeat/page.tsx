'use client'

import { useState, useEffect, ChangeEvent, useCallback, useContext } from "react"
import { AlertsContext } from "../components/providers/Alerts/AlertsProvider"
import { IDefaultBodyResponse } from "../interfaces/response.interface"
import { DirectionIcon } from "./components/Direction-icon"
import { Spinner } from "../components/spinner/Spinner"
import { RemoveIcon } from './components/Remove-icon'
import { CopyIcon } from "./components/Copy-icon"
import { alegreya, alegreya_sans, shippori_mincho } from '../fonts'
import { useHttp } from "../hooks/http.hook"
import style from './page.module.css'
import Link from "next/link"

interface IResponseBody extends IDefaultBodyResponse {
    kanjis?: string[]
    totalAmount?: number
}

type knownValue = 'known_writing' | 'known_meaning' | 'known_reading' | 'total'
type pointsOf = 'writing' | 'meaning' | 'reading' | 'total'

const path = `/api/profile/kanji`

let isFirstLoadingProcessing = true

export default function Profile() {
    const {request} = useHttp()
    const [kanjis, setKanjis] = useState<string[] | null>(null)
    const [index, setIndex] = useState(0)

    const [isResponseLoading, setIsResponseLoading] = useState(true)

    const [knownValue, setKnownValue]= useState<knownValue>('known_writing')
    const [pointsOf, setPointsOf] = useState<pointsOf>('total')

    const alerts = useContext(AlertsContext)

    const getKanjis = useCallback(async(): Promise<void> => {
        setIsResponseLoading(true)

        try {
            const body = await request({
                path,
                headers: {
                    options: JSON.stringify({
                        sort: {
                            knownValue,
                            pointsOf,
                        }
                    })
                }
            }) as IResponseBody
                
            if (body.kanjis) setKanjis(() => {                    
                const kanjis = body.kanjis 

                if (!kanjis || isArrayEmpty(kanjis)) return null

                return kanjis
            })

            setIsResponseLoading(false)
            isFirstLoadingProcessing = false
        } catch (error: unknown) {
            setKanjis(null)

            setIsResponseLoading(false)
            isFirstLoadingProcessing = false

            alerts.pushAlert({
                message: 'Произошла ошибка. Попробуйте позже',
                status: 'error'
            })
        }
    }, [knownValue, alerts, pointsOf, request])
    
    useEffect(() => {
        getKanjis()
    }, [knownValue, pointsOf, getKanjis])

    function isArrayEmpty(arr: any[]) {
        return !arr[0]
    }

    async function removeKanji() {
        const currentKanji = kanjis ? kanjis[index] : null

        if (!currentKanji) return

        try {
            const resBody = await request({
                path,
                method: 'DELETE',
                body: [currentKanji]
            }) as IDefaultBodyResponse

            if (resBody.message && resBody.applicableFor === 'alert') {
                alerts.pushAlert({
                    message: resBody.message,
                    status: resBody.success ? 'success' : 'error'
                })
            }

            deleteKanjiState() 
        } catch (error) {
            alerts.pushAlert({
                message: 'Произошла ошибка. Попробуйте позже',
                status: 'error'
            })
        }
    }

    function deleteKanjiState() {
        if (!kanjis || kanjis.length === 1) return setKanjis(null)      //если элементы единственный, и в массиве ничего не осталось - ставим null

        const updKanjis = [...kanjis]

        updKanjis.splice(index, 1)

        setKanjis(updKanjis)

        if (index !== 0 && !kanjis[index + 1]) setIndex(index - 1)      //сдвигаем индекс, если кандзи последний, чтобы не оставалось пустого пространства
    }

    function handleKnownValueChange(event: ChangeEvent<HTMLSelectElement>) {
        const knownV = event.target.value

        setKnownValue(() => {
            if (knownV === 'known_writing' || knownV === 'known_meaning' || knownV === 'known_reading') {
                return knownV
            } else {
                return 'total'
            }
        })
    }
    function handlePointsOfValueChange(event: ChangeEvent<HTMLSelectElement>) {
        const pointsOf = event.target.value

        setPointsOf(() => {
            if (pointsOf === 'meaning' || pointsOf === 'writing' || pointsOf === 'reading') {
                return pointsOf
            } else {
                return 'total'
            }
        })
    }

    function onIndexIncrement() {
        if (kanjis && !kanjis[index + 1]) return

        setIndex(currentIndex => currentIndex + 1)
    }
    function onIndexDecrement() {
        if (index === 0) return

        setIndex(currentIndex => currentIndex - 1)
    }

    function updateClipboard() {
        try {
            kanjis && kanjis[index] ? navigator.clipboard.writeText(kanjis[index]) : null

            alerts.pushAlert({
                message: 'Скопировано!', 
                status: 'default'
            })
        } catch (error) {
            alerts.pushAlert({
                message: 'Не удалось скопировать', 
                status: 'error'
            })
            console.log(error)
        }
    }
    function chooseKanji(writing: string) {
        if (!kanjis) return

        kanjis.forEach((consideredKanji, index) => {
            if (consideredKanji === writing) setIndex(index)
        })
    }
    return (
        <div className={style.container}>
            <div>
                {isResponseLoading ? <div className={style.spinner}><Spinner size={30}/></div> : null}
                <h1 className={alegreya.className}>Повторение</h1>
                <div className={style['top-block']}>
                    <div className={`${style['primary-kanji']} ${shippori_mincho.className}`}>
                        {kanjis ? kanjis[index] : '?'}
                    </div>
                    <div className={style.menu}>
                        <div>
                            <div>
                                <label htmlFor='known-value'>С известным</label>
                                <select 
                                    id='known-value'
                                    onChange={handleKnownValueChange}
                                    value={knownValue}
                                    className={alegreya_sans.className}
                                    >
                                    <option value='known_writing'>написанием</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor='points-of-knowledge'>Отобразить по очкам</label>
                                <select 
                                    id='points-of-knowledge'
                                    onChange={handlePointsOfValueChange}
                                    value={pointsOf}
                                    className={alegreya_sans.className}
                                    >
                                    <option value='total'>общим</option>
                                    <option value='reading'>чтений</option>
                                    <option value='meaning'>значений</option>
                                </select>
                            </div>
                        </div>
                        <div className={style.interaction}>
                            <div>
                                <button 
                                    className={style.copy}
                                    onClick={updateClipboard}
                                    disabled={!kanjis}
                                    >
                                    <CopyIcon isDisabled={!kanjis}/><span>копировать</span>
                                </button>
                                <button 
                                    className={style.remove}
                                    onClick={removeKanji}
                                    disabled={!kanjis}
                                    >
                                    <RemoveIcon/>
                                </button>
                            </div>
                            <div className={style.direction}>
                                <button 
                                    className={style.prev}
                                    disabled={index === 0 ? true : false}
                                    onClick={onIndexDecrement}
                                    >
                                    <DirectionIcon/>
                                </button>
                                <button 
                                    className={style.next}
                                    disabled={!kanjis || (!kanjis[index + 1]) ? true : false}
                                    onClick={onIndexIncrement}
                                    >
                                    <DirectionIcon/>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {kanjis ? <div className={`${style['other-kanji']} ${shippori_mincho.className}`}>
                    {kanjis.map(writing => 
                        <span 
                            className={kanjis[index] === writing ? style.current : ''}
                            key={Date.now() * Math.random()}
                            onClick={() => chooseKanji(writing)}
                            >
                            {writing}
                        </span>
                    )}
                </div> : !isResponseLoading ? <p className={style['non-kanji-plug']}>Кажется, вы ещё не добавили иероглифы к повторению.<br/>Посмотрите в <Link href={'/kanji/single'}>списке</Link>.</p> : null}
            </div>
        </div>
    )
}