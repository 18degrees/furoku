'use client'

import { AlertsContext } from '../../components/providers/Alerts/AlertsProvider'
import { useState, useEffect, useRef, useCallback, useContext } from 'react'
import { IDefaultBodyResponse } from '../../interfaces/response.interface'
import { ISearchKanji } from '../../interfaces/kanji.interface'
import { Spinner } from '../../components/spinner/Spinner'
import type { TouchEvent, MouseEvent, ChangeEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import { useHttp } from '../../hooks/http.hook'
import { Card } from './components/card/Card'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { alegreya } from '../../fonts'
import style from './page.module.css'
import Link from 'next/link'
import { filterMethod, level, sortMethod } from '@/app/interfaces/search.interface'

interface IBody extends IDefaultBodyResponse {
    kanjis: ISearchKanji[]
    totalAmount: number
}
const SWIPE_MODE_WIDTH = 700
const PART_OF_SCREEN_TO_SWIPE = 0.2

const KANJI_AMOUNT_PER_PAGE = +process.env.NEXT_PUBLIC_KANJI_PER_PAGE!

const onlyKanjiRegExp = /\p{Script=Han}+/ug

type includeLearnt = true | false
type page = number
type text = string

export default function Page() {
    const router = useRouter()
    const params = useSearchParams()
    const {request} = useHttp()
    const {data: session} = useSession()

    const [isLoadingProcessing, setIsLoadingProcessing] = useState(true)

    const [searchText, setSearchText] = useState<text>(getTextInitial)

    const [filterMethod, setFilterMethod] = useState<filterMethod>(getInitialFilterMethod)
    const [sortMethod, setSortMethod] = useState<sortMethod>(getInitialSortMethod)

    const page = useRef<page>(getPageInitial())
    const level = useRef<level>(getLevelInitial())
    const includeLearnt = useRef<includeLearnt>(getIncludeLearntInitial())
    const pagesAmount = useRef<page | ''>('')

    const [cards, setCards] = useState<JSX.Element[] | null>(() => putBlankCards())
    const [hasStateOfKanjiJustBeenChanged, setHasStateOfKanjiJustBeenChanged] = useState<boolean>(false)
        
    const [leftCoord, setLeftCoord] = useState(0)

    const alerts = useContext(AlertsContext)
    
    let touchStartLeftCoord = 0;

    function getInitialFilterMethod(): filterMethod {
        const method = params.get('filter')

        return (
            method === 'jlpt' || method === 'grade' || method === '' ? method : ''
        )
    }
    function getInitialSortMethod(): sortMethod {
        const method = params.get('sort')

        return (
            method === 'stroke' || method === 'mainichi' || method === 'wiki' ? method : 'wiki'
        )
    }
    function getTextInitial(): text {
        const textRough = params.get('text')
        const text = typeof textRough === 'string' ? textRough : '' 

        const kanjisText = text.match(onlyKanjiRegExp)?.join('')

        return kanjisText ? kanjisText : ''
    }
    function getLevelInitial(): level {
        const level = params.get('level')

        return (
            level === '5' || 
            level === '4' || 
            level === '3' || 
            level === '2' || 
            level === '1' || 
            level === 'all' ? level : 'all'
        )
    }
    function getIncludeLearntInitial(): includeLearnt {
        const includeLearnt = params.get('includeLearnt')
        
        return (
            includeLearnt === 'true' || 
            includeLearnt === '1' ? true : false
        )
    }
    function getPageInitial(): page {
        const pageParam = params.get('page')
        const page = pageParam ? pageParam : '1'
        const nonNumberRegExp = /\D/

        if (nonNumberRegExp.test(page) || page === '0' || +page < 0) return 1

        return +page
    }

    function changeLevel(newLevel: level) {
        const pathToModify = new URL(window.location.href);
        
        (newLevel === 'all') ? 
        pathToModify.searchParams.delete('level') : 
        pathToModify.searchParams.set('level', newLevel)

        setLeftCoord(0)
        
        level.current = newLevel

        pathToModify.searchParams.delete('page')
        page.current = 1
        
        router.push(`${pathToModify.pathname}${pathToModify.search}`)

    }

    function changeIncludeLearnt(newIncludeLeantStatus: includeLearnt) {
        const pathToModify = new URL(window.location.href);

        (newIncludeLeantStatus === false) ? 
        pathToModify.searchParams.delete('includeLearnt') : 
        pathToModify.searchParams.set('includeLearnt', newIncludeLeantStatus.toString())

        includeLearnt.current = newIncludeLeantStatus

        router.push(`${pathToModify.pathname}${pathToModify.search}`)
    }

    const changePage = useCallback((newPage: page) => {
        const pathToModify = new URL(window.location.href)

        if (newPage === 1) {
            pathToModify.searchParams.delete('page')
        } else {
            pathToModify.searchParams.set('page', newPage.toString())
        }

        page.current = newPage

        router.push(`${pathToModify.pathname}${pathToModify.search}`)
    }, [router])

    useEffect(() => {
        const kanjisText = searchText.match(onlyKanjiRegExp)?.join('')
                
        const pathToModify = new URL(window.location.href)

        if (searchText) {
            pathToModify.searchParams.delete('page')
            page.current = 1
    
            pathToModify.searchParams.delete('level')
            level.current = 'all'
        }

        kanjisText ? pathToModify.searchParams.set('text', kanjisText) : pathToModify.searchParams.delete('text') 

        router.push(`${pathToModify.pathname}${pathToModify.search}`)

    }, [searchText, router])
    
    function onFilterMethodChange(method: filterMethod) {
        setFilterMethod(method)

        const pathToModify = new URL(window.location.href)

        method === '' ? pathToModify.searchParams.delete('filter') : pathToModify.searchParams.set('filter', method)

        if (page.current !== 1) {
            pathToModify.searchParams.delete('page')
            page.current = 1
        }
        if (level.current !== 'all') {
            pathToModify.searchParams.delete('level')
            level.current = 'all'
        }

        router.push(`${pathToModify.pathname}${pathToModify.search}`)
    }
    function onSortMethodChange(method: sortMethod) {
        setSortMethod(method)

        const pathToModify = new URL(window.location.href)

        method === 'wiki' ? pathToModify.searchParams.delete('sort') : pathToModify.searchParams.set('sort', method)

        if (page.current !== 1) {
            pathToModify.searchParams.delete('page')
            page.current = 1
        }
        if (level.current !== 'all') {
            pathToModify.searchParams.delete('level')
            level.current = 'all'
        }

        router.push(`${pathToModify.pathname}${pathToModify.search}`)
    }
    function onPageIncrement(): void {
        if (page.current !== pagesAmount.current) {
            changePage(page.current + 1)
        }
    }
    function onPageDecrement(): void {
        if (page.current !== 1) {
            changePage(page.current - 1)
        }
    }

    function putBlankCards() {
        const blankCards = []
    
        for (let i = 0; i < KANJI_AMOUNT_PER_PAGE; i++) {
            const key = Math.trunc(Math.random() * Date.now())

            blankCards.push(
                <Card 
                    mode='PRELOAD'
                    key={key}/>
            )
        }
        return blankCards
    }

    const clearAddStatus = () => setHasStateOfKanjiJustBeenChanged(false)
        
    useEffect(() => {
        clearAddStatus()
        
        async function getCards(): Promise<void> {
            const kanjis = await loadCards()

            setCards(() => {
                if (isArrayEmpty(kanjis)) return null

                return kanjis.map((kanjiInfo => {
                    return (
                        <Card 
                            mode='FILLED'
                            index={kanjiInfo.index} 
                            writing={kanjiInfo.writing}  
                            key={kanjiInfo.id} 
                            isCardAdded={kanjiInfo.added}
                            setHasStateOfKanjiJustBeenChanged={setHasStateOfKanjiJustBeenChanged}
                        />
                    )
                }))
            })
        }
        async function loadCards(): Promise<ISearchKanji[]> {
            try {
                const path = `/api/db/kanji?${params.toString()}`

                setIsLoadingProcessing(true)
        
                const json = await request({path}) as IBody
        
                setIsLoadingProcessing(false)

                setPagesAmount(json.totalAmount)
                
                const kanjis = json.kanjis
                
                return kanjis
                
            } catch (error) {
                setIsLoadingProcessing(false)

                alerts.pushAlert({
                    message: 'Произошла ошибка. Попробуйте позже',
                    status: 'error'
                })

                console.log(error)
                
                return []
            }
        }
        function setPagesAmount(totalKanjis: number) {
            const pagesNeeded = Math.ceil(totalKanjis / KANJI_AMOUNT_PER_PAGE)
    
            pagesAmount.current = pagesNeeded

            if (page.current > pagesNeeded) changePage(pagesNeeded)
        }
        
        function isArrayEmpty(arr: any[]) {
            for (let elem of arr) {
                return false
            }
            return true
        }

        getCards()
    }, [params, hasStateOfKanjiJustBeenChanged, alerts, changePage, request])

    function isPageCorrect(consideredPage: number) {
        if (consideredPage <= 0) return false

        if (pagesAmount.current && (consideredPage > pagesAmount.current)) return false

        return true
    }

    useEffect(() => {
        function fixLeftShift() {
            if (window.innerWidth > SWIPE_MODE_WIDTH) setLeftCoord(0)
        }
        window.addEventListener('resize', fixLeftShift)
    }, [])

    function onMouseDown(mouseX: number) {
        touchStartLeftCoord = mouseX
    }
    function onMouseUp(touchEndLeftCoord: number) {
        const windowWidth = window.innerWidth
        
        if (windowWidth > SWIPE_MODE_WIDTH || !cards) return
        
        const swipeWidth = touchEndLeftCoord - touchStartLeftCoord
        
        const swipeAbsoluteValue = Math.abs(swipeWidth)

        if (swipeAbsoluteValue / windowWidth < PART_OF_SCREEN_TO_SWIPE) return

        
        const swipeDirection = swipeWidth > 0 ? 'RIGHT' : 'LEFT'
        
        switch (swipeDirection) {
            case 'LEFT':
                if (isItLastCard(leftCoord)) {
                    if (isPageCorrect(page.current + 1)) {
                        setCards(null)
                        swipePage('NEXT')

                        setLeftCoord(0)
                    }
                } else {
                    setLeftCoord(prev => prev - 100)
                }
                break;    
            case 'RIGHT':
                if (isItFisrtCard(leftCoord)) {
                    if (isPageCorrect(page.current - 1)) {
                        setCards(null)
                        swipePage('PREVIOUS')

                        setLeftCoord(KANJI_AMOUNT_PER_PAGE * -100 + 100)
                        
                    }
                } else {
                    setLeftCoord(prev => prev + 100)
                }
        }
    }
    function isItLastCard(currentLeftCoord: number) {
        if (!cards) return false

        const lastCardCoord = (cards.length * -100) + 100

        if (lastCardCoord === currentLeftCoord) return true

        return false
    }
    function isItFisrtCard(currentLeftCoord: number) {
        if (!cards) return false

        if (currentLeftCoord === 0) return true

        return false
    }
    function swipePage(direction: 'PREVIOUS' | 'NEXT') {
        const newPage = direction === 'NEXT' ? page.current + 1 : page.current - 1

        changePage(newPage)
    }
    return (
        <div className={`${style.container}`}>
            {isLoadingProcessing ? <div className={style.spinner}><Spinner size={50}/></div> : null}
            <h1 className={alegreya.className}>Список иероглифов</h1>
            <p className={style.description}>Здесь вы найдёте доступные к повторению иероглифы. Для упрощения поиска используйте фильтрацию и сортировку по разным категориям или введите напрямую с помощью поисковой строки.</p>
            {/* <div className={style['sort-block']}> */}
            <div className={style.settings}>
                <div className={style.filter}>
                    <p>Фильтрация</p>
                    <div className={style.radios}>
                        <label>Отсутствует
                            <input 
                                type='radio' 
                                name='filter' 
                                value='' 
                                defaultChecked={filterMethod === ''} 
                                onChange={() => onFilterMethodChange('')}
                                />
                        </label>
                        <label>JLPT
                            <input 
                                type='radio' 
                                name='filter' 
                                value='jlpt' 
                                defaultChecked={filterMethod === 'jlpt'} 
                                onChange={() => onFilterMethodChange('jlpt')}
                                />
                        </label>
                        <label>Классу похождения
                            <input 
                                type='radio' 
                                name='filter' 
                                value='grade' 
                                defaultChecked={filterMethod === 'grade'} 
                                onChange={() => onFilterMethodChange('grade')}
                                />
                        </label>
                    </div>
                    {
                        filterMethod === 'jlpt' ? <select 
                            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => changeLevel(event.target.value as level)}
                            value={level.current}
                            disabled={!!searchText}
                            >
                            <option value='all'>Все</option>
                            <option value='5'>N5</option>
                            <option value='4'>N4</option>
                            <option value='3'>N3</option>
                            <option value='2'>N2</option>
                            <option value='1'>N1</option>
                        </select> : filterMethod === 'grade' ? <select 
                            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => changeLevel(event.target.value as level)}
                            value={level.current}
                            disabled={!!searchText}
                            >
                            <option value='all'>Все</option>
                            <option value='1'>Класс 1</option>
                            <option value='2'>Класс 2</option>
                            <option value='3'>Класс 3</option>
                            <option value='4'>Класс 4</option>
                            <option value='5'>Класс 5</option>
                            <option value='6'>Класс 6</option>
                            <option value='7'>Класс 7</option>
                            <option value='8'>Класс 8</option>
                            <option value='9'>Класс 9</option>
                        </select> : <select 
                            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => changeLevel(event.target.value as level)}
                            value={level.current}
                            disabled={true}
                            >
                            <option value='all'>Все</option>
                        </select>
                    }
                </div>
                <div className={style.sort}>
                    <p>Сортировка по</p>
                    <div className={style.radios}>
                        <label>Частоте в вики
                            <input 
                                type='radio' 
                                name='sort' 
                                value='wiki' 
                                defaultChecked={sortMethod === 'wiki'} 
                                onChange={() => onSortMethodChange('wiki')}
                                />
                        </label>
                        <label>Частоте в газете &quot;Маинити&quot;
                            <input 
                                type='radio' 
                                name='sort' 
                                value='mainichi' 
                                defaultChecked={sortMethod === 'mainichi'} 
                                onChange={() => onSortMethodChange('mainichi')}
                                />
                        </label>
                        <label>Количеству черт
                            <input 
                                type='radio' 
                                name='sort' 
                                value='stroke' 
                                defaultChecked={sortMethod === 'stroke'} 
                                onChange={() => onSortMethodChange('stroke')}
                                />
                        </label>
                    </div>
                </div>
                <div>
                    <input 
                        type='text'
                        onChange={(event) => setSearchText(event.target.value)}
                        value={searchText}
                        spellCheck={false}
                        placeholder='Поиск'
                    />
                    <div className={style['checkbox-container']}>
                        <input 
                            type='checkbox' 
                            id='learning-include'
                            onChange={event => changeIncludeLearnt(event.target.checked)}
                            checked={includeLearnt.current}
                            disabled={!session}
                        ></input>
                        <label htmlFor='learning-include'>Показать изучаемые</label>
                    </div>
                </div>
                {/* <div>
                    <p>Отобразить по</p>
                    <div className={style.radios}>
                        <label>JLPT
                            <input 
                                type='radio' 
                                name='sort' 
                                value='jlpt' 
                                defaultChecked={sortMethod === 'jlpt'} 
                                onChange={() => onSortMethodChange('jlpt')}
                                />
                        </label>
                        <label>Чертам
                        <input 
                                type='radio' 
                                name='sort' 
                                value='stroke' 
                                defaultChecked={sortMethod === 'stroke'} 
                                onChange={() => onSortMethodChange('stroke')}
                                />
                        </label>
                        <label>Газете &quot;Маинити&quot;
                        <input 
                                type='radio' 
                                name='sort' 
                                value='mainichi' 
                                defaultChecked={sortMethod === 'mainichi'} 
                                onChange={() => onSortMethodChange('mainichi')}
                                />
                        </label>
                        <label>Классу
                        <input 
                                type='radio' 
                                name='sort' 
                                value='grade' 
                                defaultChecked={sortMethod === 'grade'} 
                                onChange={() => onSortMethodChange('grade')}
                                />
                        </label>
                        <label>Частоте в вики
                        <input 
                                type='radio' 
                                name='sort' 
                                value='wiki' 
                                defaultChecked={sortMethod === 'wiki'} 
                                onChange={() => onSortMethodChange('wiki')}
                                />
                        </label>
                    </div>
                    <div>
                        <input 
                            type='text'
                            onChange={(event) => setSearchText(event.target.value)}
                            value={searchText}
                            spellCheck={false}
                            placeholder='Поиск'
                        />
                        {sortMethod === 'wiki' || sortMethod === 'mainichi' ? <select 
                            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => changeLevel(event.target.value as level)}
                            value={level.current}
                            disabled={!!searchText}
                            >
                            <option value='all'>Все</option>
                            <option value='5'>Уровень 5</option>
                            <option value='4'>Уровень 4</option>
                            <option value='3'>Уровень 3</option>
                            <option value='2'>Уровень 2</option>
                            <option value='1'>Уровень 1</option>
                        </select> : sortMethod === 'jlpt' ? <select 
                            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => changeLevel(event.target.value as level)}
                            value={level.current}
                            disabled={!!searchText}
                            >
                            <option value='all'>Все</option>
                            <option value='5'>N5</option>
                            <option value='4'>N4</option>
                            <option value='3'>N3</option>
                            <option value='2'>N2</option>
                            <option value='1'>N1</option>
                        </select> : sortMethod === 'grade' ? <select 
                            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => changeLevel(event.target.value as level)}
                            value={level.current}
                            disabled={!!searchText}
                            >
                            <option value='all'>Все</option>
                            <option value='1'>Класс 1</option>
                            <option value='2'>Класс 2</option>
                            <option value='3'>Класс 3</option>
                            <option value='4'>Класс 4</option>
                            <option value='5'>Класс 5</option>
                            <option value='6'>Класс 6</option>
                            <option value='7'>Класс 7</option>
                            <option value='8'>Класс 8</option>
                            <option value='9'>Класс 9</option>
                        </select> : <select 
                            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => changeLevel(event.target.value as level)}
                            value={level.current}
                            disabled={true}
                            >
                            <option value='all'>Все</option>
                        </select>}
                    </div>
                    <div className={style['checkbox-container']}>
                        <input 
                            type='checkbox' 
                            id='learning-include'
                            onChange={event => changeIncludeLearnt(event.target.checked)}
                            checked={includeLearnt.current}
                            disabled={!session}
                        ></input>
                        <label htmlFor='learning-include'>Показать изучаемые</label>
                    </div>
                </div> */}
            </div>
            {!session ? 
                <div className={style.alert}>
                    <p><Link href='/signin'>Авторизируйтесь</Link> для добавления иероглифов к повторению</p>
                </div> : null
            }
            <div className={`${style['page-choice-box']} page-choice-box`}>
                <button 
                    onClick={onPageDecrement}
                    disabled={page.current === 1}
                >Предыдущая</button>
                <button 
                    onClick={onPageIncrement}
                    disabled={page.current === pagesAmount.current}
                >Следующая</button>
            </div>
            <div className={style['cards-block']}>
                <div 
                    className={`${style['sub-container']} sub-container`}
                    onMouseDown={(event: MouseEvent<HTMLDivElement>) => onMouseDown(event.clientX)}
                    onMouseUp={(event: MouseEvent<HTMLDivElement>) => onMouseUp(event.clientX)}
                    onTouchStart={(event: TouchEvent<HTMLDivElement>) => onMouseDown(event.touches[0].clientX)}
                    onTouchEnd={(event: TouchEvent<HTMLDivElement>) =>onMouseUp(event.changedTouches[0].clientX)}
                >{cards}
                </div>
                <style jsx>{`
                        .sub-container {
                            transform: translateX(${leftCoord}vw);
                        }
                `}</style>
            </div>
            <div className={`${style['page-choice-box']} page-choice-box`}>
                <button 
                    onClick={onPageDecrement}
                    disabled={page.current === 1}
                >Предыдущая</button>
                <button 
                    onClick={onPageIncrement}
                    disabled={page.current === pagesAmount.current}
                >Следующая</button>
            </div>
        </div>
    )
}