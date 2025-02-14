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
    cards?: IKanjiProps[]
    totalAmount?: number
}

type ShowType = 'single' | 'combo'
type Path = `/api/profile/kanji/single` | `/api/profile/kanji/combo`

let isFirstLoadingProcessing = true

export default function Profile() {
    const {request} = useHttp()
    const [cards, setCards] = useState<IKanjiProps[] | null>(null)
    const [index, setIndex] = useState(0)
    const [hasPointsChanged, setHasPointsChanged] = useState(false)

    const [isResponseLoading, setIsResponseLoading] = useState(true)

    const [showType, setShowType] = useState<ShowType>('single')
    const [knownValue, setKnownValue]= useState<knownValue>('writing')
    const [pointsOf, setPointsOf] = useState<pointsOf>('total')

    const alerts = useContext(AlertsContext)

    const [path, setPath] = useState<Path>(`/api/profile/kanji/single`)


    const [isShowTypenMenuOpened, setIsShowTypenMenuOpened] = useState(false)
    const [isKnownMenuOpened, setIsKnownMenuOpened] = useState(false)
    const [isPointsMenuOpened, setIsPointsnMenuOpened] = useState(false)

    const getCards = useCallback(async(): Promise<void> => {
        setIsResponseLoading(true)
        setCards(null)

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
                
            if (body.cards) setCards(() => {                    
                const cards = body.cards 

                if (!cards || isArrayEmpty(cards)) return null

                return cards
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
    }, [knownValue, alerts, pointsOf, path, request, hasPointsChanged])

    useEffect(() => {
        setIsShowTypenMenuOpened(false)
        
        setPath(`/api/profile/kanji/${showType}`)
    }, [showType])
    
    useEffect(() => {
        getCards()
    }, [knownValue, pointsOf, hasPointsChanged, getCards])

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

    async function removeCard(id: string) {
        try {
            const resBody = await request({
                path,
                method: 'DELETE',
                body: [id]
            }) as IDefaultBodyResponse

            if (resBody.message && resBody.applicableFor === 'alert') {
                alerts.pushAlert({
                    message: resBody.message,
                    status: resBody.success ? 'success' : 'error'
                })
            }

            deleteCardState(id) 
        } catch (error) {
            alerts.pushAlert({
                message: 'Произошла ошибка. Попробуйте позже',
                status: 'error'
            })
        }
    }

    async function increaseCardPoints(id: string) {
        try {
            await request({
                path,
                method: 'PATCH',
                body: {writing: id, knownValue}
            }) as IDefaultBodyResponse
    
            setHasPointsChanged(prev => !prev)
        } catch (error) {
            alerts.pushAlert({
                message: 'Произошла ошибка. Попробуйте позже',
                status: 'error'
            })
        }
    }

    function deleteCardState(id: string) {
        if (!cards || cards.length === 1) return setCards(null)      //если элемент единственный и в массиве ничего не осталось - ставим null

        const updCards = [...cards]

        const index = cards.findIndex(cardsObj => cardsObj.id === id)

        updCards.splice(index, 1)

        setCards(updCards)
    }


    function menuToggler(menuType: menu) {
        switch (menuType) {
            case 'showType':
                setIsShowTypenMenuOpened(prev => !prev)
                setIsKnownMenuOpened(false)
                setIsPointsnMenuOpened(false)
                break
            case 'knownValue':
                setIsKnownMenuOpened(prev => !prev)
                setIsShowTypenMenuOpened(false)
                setIsPointsnMenuOpened(false)
                break
            case 'pointsOf':
                setIsPointsnMenuOpened(prev => !prev)
                setIsKnownMenuOpened(false)
                setIsShowTypenMenuOpened(false)
        }
    }
    
    return (
        <div className={style.container}>
            <div>
                {isResponseLoading ? <div className={style.spinner}><Spinner size={30}/></div> : null}
                <div className={style['sort-container']}>
                    <div className={isShowTypenMenuOpened ? style.active : ''}>
                        <label>Тип карточек</label>
                        <div 
                            className={style.field}
                            onClick={() => menuToggler('showType')}
                            >
                            {
                                showType === 'single' ? 'одиночные' : 'сочетания'
                            }
                            <span><SortTriangle/></span>
                        </div>
                        <ul>
                            <li 
                                className={showType === 'single' ? style.active : ''}
                                onClick={() => setShowType('single')}
                                >одиночные
                            </li>
                            <li 
                                className={showType === 'combo' ? style.active : ''}
                                onClick={() => setShowType('combo')}
                                >сочетания
                            </li>
                        </ul>
                    </div>
                    <div className={isKnownMenuOpened ? style.active : ''}>
                        <label>С известным</label>
                        <div 
                            className={style.field}
                            onClick={() => menuToggler('knownValue')}
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
                        <label>По очкам</label>
                        <div 
                            className={style.field}
                            onClick={() => menuToggler('pointsOf')}
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
                    cards ?
                        cards.map(cardObj => {
                            return (<Card 
                                cardInfo={cardObj}
                                knownValue={knownValue}
                                key={cardObj.id}
                                removeCard={removeCard}
                                increaseCardPoints={increaseCardPoints}
                            />)
                        }) : !isResponseLoading ? 
                        <p className={style['non-kanji-plug']}>
                            Кажется, вы ещё не добавили {showType === 'single' ? 'иероглифы' : 'сочетания'} к повторению.<br/>
                            Посмотрите в <Link href={`/kanji/${showType === 'single' ? 'single' : 'combo'}`}>списке</Link>.
                        </p> : 
                        null 
                }
            </div>
        </div>
    )
}