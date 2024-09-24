'use client'

import { useState, useEffect, ChangeEvent, useCallback, useContext } from "react"
import { AlertsContext } from "../components/providers/Alerts/AlertsProvider"
import { IDefaultBodyResponse } from "../interfaces/response.interface"
import { alegreya, shippori_mincho, ibm_plex_sans_jp } from '../fonts'
import { DirectionIcon } from "./components/Direction-icon"
import { Spinner } from "../components/spinner/Spinner"
import { RemoveIcon } from './components/Remove-icon'
import { useHttp } from "../hooks/http.hook"
import style from './page.module.css'
import Link from "next/link"
import { IKanjiProps } from "../interfaces/kanji.interface"
import { knownValue, pointsOf } from "../interfaces/kanji.interface"
import { SortTriangle } from "./components/Sort-triangle-icon"

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

    const [isWritingVisible, setIsWritingVisible] = useState(knownValue === 'writing')
    const [isReadingVisible, setIsReadingVisible] = useState(knownValue === 'reading')
    const [isMeaningVisible, setIsMeaningVisible] = useState(knownValue === 'meaning')

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

    useEffect(() => {
        setIsWritingVisible(knownValue === 'writing')
        setIsReadingVisible(knownValue === 'reading')
        setIsMeaningVisible(knownValue === 'meaning')
    }, [knownValue])

    function isArrayEmpty(arr: any[]) {
        return !arr[0]
    }

    async function removeKanji() {
        const currentKanji = kanjis ? kanjis[index].writing : null

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
        if (!kanjis || kanjis.length === 1) return setKanjis(null)      //если элемент единственный и в массиве ничего не осталось - ставим null

        const updKanjis = [...kanjis]

        updKanjis.splice(index, 1)

        setKanjis(updKanjis)

        if (index !== 0 && !kanjis[index + 1]) setIndex(index - 1)      //сдвигаем индекс, если кандзи последний, чтобы не оставалось пустого пространства
    }

    function onIndexIncrement() {
        if (kanjis && !kanjis[index + 1]) return

        setIndex(currentIndex => currentIndex + 1)
    }
    function onIndexDecrement() {
        if (index === 0) return

        setIndex(currentIndex => currentIndex - 1)
    }

    function chooseKanji(writing: string) {
        if (!kanjis) return

        kanjis.forEach((consideredKanji, index) => {
            if (consideredKanji.writing === writing) setIndex(index)
        })
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
                
                <div className={style['primary-block']}>
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

                    <div className={style['kanji-block']}>
                        <div className={style.writing}>
                            <h2 className={alegreya.className}>Написание</h2>
                            <p 
                                className={`${shippori_mincho.className} ${!kanjis || isWritingVisible ? style.active : ''}`}
                                >
                                {kanjis ? kanjis[index].writing : '?'}
                            </p>
                        </div>
                        <div className={style.reading}>
                            <h2 className={alegreya.className}>Чтения</h2>
                            <div className={!kanjis || isReadingVisible ? style.active : ''}>
                                <div>
                                    <h3>Кунные</h3>
                                    <p className={ibm_plex_sans_jp.className}>{kanjis && kanjis[index].kun_readings[0] ? kanjis[index].kun_readings.join('; ') : '?'}</p>
                                </div>
                                <div>
                                    <h3>Онные</h3>
                                    <p className={ibm_plex_sans_jp.className}>{kanjis && kanjis[index].on_readings[0] ? kanjis[index].on_readings.join('; ') : '?'}</p>
                                </div>
                            </div>
                        </div>
                        <div className={style.meaning}>
                            <h2 className={alegreya.className}>Значения</h2>
                            <p 
                                className={!kanjis || isMeaningVisible ? style.active : ''}
                                >
                                {kanjis && kanjis[index].meanings[0] ? kanjis[index].meanings.join('; ') : '?'}
                            </p>
                        </div>
                    </div>
                    <div className={style.interaction}>
                        <div>
                            <button 
                                className={`${ibm_plex_sans_jp.className} ${!isWritingVisible ? style.transparent : ''}`}
                                onClick={() => setIsWritingVisible(prev => !prev)}
                                >字
                            </button>
                            <button 
                                className={`${ibm_plex_sans_jp.className} ${!isReadingVisible ? style.transparent : ''}`}
                                onClick={() => setIsReadingVisible(prev => !prev)}
                                >か
                            </button>
                            <button 
                                className={!isMeaningVisible ? style.transparent : ''}
                                onClick={() => setIsMeaningVisible(prev => !prev)}
                                >А</button>
                        </div>
                        <button 
                            className={style.remove}
                            onClick={removeKanji}
                            disabled={!kanjis}
                            >
                            <RemoveIcon/>
                        </button>
                    </div>
                </div>
                {kanjis ? 
                    <div 
                        className={`${ 
                            knownValue === 'writing' ? style.kanjis : style.words} 
                            ${knownValue === 'writing' ? shippori_mincho.className : knownValue === 'reading' ? ibm_plex_sans_jp.className : ''}`}
                            >
                        {kanjis.map(({writing, kun_readings, meanings, on_readings}) => 
                            <p 
                                className={
                                    (knownValue === 'writing' && kanjis[index].writing === writing) ||
                                    (knownValue === 'reading' && kanjis[index].kun_readings === kun_readings) ||
                                    (knownValue === 'meaning' && kanjis[index].meanings === meanings) ? 
                                    style.current : ''
                                    
                                }
                                key={Date.now() * Math.random()}
                                onClick={() => chooseKanji(writing)}
                                >
                                {
                                    knownValue === 'writing' ? writing : 
                                    knownValue === 'reading' && (kun_readings[0] && on_readings[0]) ? <><span>{kun_readings.join('; ')}<br/></span><span>{on_readings.join('; ')}</span></> :
                                    knownValue === 'reading' && (kun_readings[0]) ? kun_readings.join('; ') :
                                    knownValue === 'reading' && (on_readings[0]) ? on_readings.join('; ') :
                                    // knownValue === 'reading' && kun_readings[0] ? kun_readings.join('; ') :
                                    // knownValue === 'reading' && on_readings[0] ? on_readings.join('; ') :
                                    knownValue === 'meaning' && meanings ? meanings.join('; ') : 
                                    'Нет данных'
                                }
                            </p>
                        )}
                    </div> : 
                    !isResponseLoading ? 
                        <p className={style['non-kanji-plug']}>Кажется, вы ещё не добавили иероглифы к повторению.<br/>Посмотрите в <Link href={'/kanji/single'}>списке</Link>.</p> : 
                        null
                }
            </div>
        </div>
    )
}