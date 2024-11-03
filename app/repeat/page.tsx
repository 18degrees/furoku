'use client'

import { useState, useEffect, useCallback, useContext } from "react"
import { AlertsContext } from "../components/providers/Alerts/AlertsProvider"
import { IDefaultBodyResponse } from "../interfaces/response.interface"
import { knownValue, pointsOf } from "../interfaces/kanji.interface"
import { SortTriangle } from "./components/Sort-triangle-icon"
import { IKanjiProps } from "../interfaces/kanji.interface"
import { Spinner } from "../components/spinner/Spinner"
import { useHttp } from "../hooks/http.hook"
import Card from "./components/card/Card"
import { Masonry } from "react-plock"
import style from './page.module.css'
import Link from "next/link"

interface IResponseBody extends IDefaultBodyResponse {
    kanjis?: IKanjiProps[]
    totalAmount?: number
}

const path = `/api/profile/kanji`

let isFirstLoadingProcessing = true

export default function Profile() {
    const {request} = useHttp()
    const [kanjis, setKanjis] = useState<IKanjiProps[] | null>(null)
    const [index, setIndex] = useState(0)

    const [isResponseLoading, setIsResponseLoading] = useState(true)

    const [knownValue, setKnownValue]= useState<knownValue>('writing')
    const [pointsOf, setPointsOf] = useState<pointsOf>('total')

    const alerts = useContext(AlertsContext)

    const [isKnownMenuOpened, setIsKnownMenuOpened] = useState(false)
    const [isPointsMenuOpened, setIsPointsnMenuOpened] = useState(false)

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
        } catch (error: unknown) {
            alerts.pushAlert({
                message: 'Произошла ошибка. Попробуйте позже',
                status: 'error'
            })
        } finally {
            setIndex(0)
            setIsResponseLoading(false)
            isFirstLoadingProcessing = false
        }
    }, [knownValue, alerts, pointsOf, request])
    
    useEffect(() => {
        getKanjis()
    }, [knownValue, pointsOf, getKanjis])

    useEffect(() => {
        setIsKnownMenuOpened(false)

        setPointsOf('total')
    }, [knownValue])

    useEffect(() => {
        setIsPointsnMenuOpened(false)
    }, [pointsOf])

    function isArrayEmpty(arr: any[]) {
        return !arr[0]
    }

    async function removeKanji(writing: string) {
        try {
            const resBody = await request({
                path,
                method: 'DELETE',
                body: [writing]
            }) as IDefaultBodyResponse

            if (resBody.message && resBody.applicableFor === 'alert') {
                alerts.pushAlert({
                    message: resBody.message,
                    status: resBody.success ? 'success' : 'error'
                })
            }

            deleteKanjiState(writing) 
        } catch (error) {
            alerts.pushAlert({
                message: 'Произошла ошибка. Попробуйте позже',
                status: 'error'
            })
        }
    }

    function deleteKanjiState(writing: string) {
        if (!kanjis || kanjis.length === 1) return setKanjis(null)      //если элемент единственный и в массиве ничего не осталось - ставим null

        const updKanjis = [...kanjis]

        const index = kanjis.findIndex(kanjiObj => kanjiObj.writing === writing)

        updKanjis.splice(index, 1)

        setKanjis(updKanjis)
    }

    return (
        <div className={style.container}>
            <div>
                {isResponseLoading ? <div className={style.spinner}><Spinner size={30}/></div> : null}
                <div className={style['sort-container']}>
                    <div className={isKnownMenuOpened ? style.active : ''}>
                        <label>С известным</label>
                        <div 
                            className={style.field}
                            onClick={() => setIsKnownMenuOpened(prev => !prev)}
                            >
                            {
                                knownValue === 'meaning' ? 'значением' : 
                                knownValue === 'reading' ? 'чтением' : 
                                'написанием'
                            }
                            <span><SortTriangle/></span>
                        </div>
                        <ul>
                            <li 
                                className={knownValue === 'writing' ? style.active : ''}
                                onClick={() => setKnownValue('writing')}
                                >написанием
                            </li>
                            <li 
                                className={knownValue === 'reading' ? style.active : ''}
                                onClick={() => setKnownValue('reading')}
                                >чтением
                            </li>
                            <li 
                                className={knownValue === 'meaning' ? style.active : ''}
                                onClick={() => setKnownValue('meaning')}
                                >значением
                            </li>
                        </ul>
                    </div>
                    <div className={isPointsMenuOpened ? style.active : ''}>
                        <label>Отобразить по очкам</label>
                        <div 
                            className={style.field}
                            onClick={() => setIsPointsnMenuOpened(prev => !prev)}
                            >
                            {
                                pointsOf === 'meaning' ? 'значений' : 
                                pointsOf === 'reading' ? 'чтений' : 
                                pointsOf === 'writing' ? 'написания' :
                                'общим'
                            }
                            <span><SortTriangle/></span>
                        </div>
                        <ul>
                            <li 
                                className={pointsOf === 'total' ? style.active : ''}
                                onClick={() => setPointsOf('total')}
                                >общим
                            </li>
                            {
                                knownValue === 'writing' ? 
                                <>
                                    <li 
                                        className={pointsOf === 'reading' ? style.active : ''}
                                        onClick={() => setPointsOf('reading')}
                                        >чтений
                                    </li>
                                    <li 
                                        className={pointsOf === 'meaning' ? style.active : ''}
                                        onClick={() => setPointsOf('meaning')}
                                        >значений
                                    </li>
                                </> : knownValue === 'meaning' ? 
                                <>
                                    <li 
                                        className={pointsOf === 'writing' ? style.active : ''}
                                        onClick={() => setPointsOf('writing')}
                                        >написания
                                    </li>
                                    <li 
                                        className={pointsOf === 'reading' ? style.active : ''}
                                        onClick={() => setPointsOf('reading')}
                                        >чтений
                                    </li>
                                </> :
                                <>
                                    <li 
                                        className={pointsOf === 'writing' ? style.active : ''}
                                        onClick={() => setPointsOf('writing')}
                                        >написания
                                    </li>
                                    <li 
                                        className={pointsOf === 'meaning' ? style.active : ''}
                                        onClick={() => setPointsOf('meaning')}
                                    >значений</li>
                                </>
                                
                            }
                        </ul>
                    </div>
                </div>
                {
                    kanjis ?
                        <Masonry
                        className={style.cards}
                            items={kanjis}
                            config={{
                                columns: [1, 2, 3, 4],
                                gap: [48, 48, 48, 48],
                                media: [730, 1024, 1366, 1440],
                            }}
                            render={(kanjiObj) => (
                                <Card 
                                    kanjiInfo={kanjiObj}
                                    knownValue={knownValue}
                                    key={kanjiObj.writing}
                                    removeKanji={removeKanji}
                                />
                            )}
                        /> : !isResponseLoading ? 
                        <p className={style['non-kanji-plug']}>Кажется, вы ещё не добавили иероглифы к повторению.<br/>Посмотрите в <Link href={'/kanji/single'}>списке</Link>.</p> : 
                        null 
                }
            </div>
        </div>
    )
}