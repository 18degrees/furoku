"use client"

import { IDefaultBodyResponse } from "@/app/interfaces/response.interface"
import { KnownWritingForm } from "../components/forms/Test-forms"
import { useCallback, useEffect, useState } from "react"
import { useHttp } from "@/app/hooks/http.hook"
import style from './page.module.css'
import Link from "next/link"

type knowledgeLevelType = 'well' | 'medium' | 'bad' | null

interface IResponseBody extends IDefaultBodyResponse {
    kanjis: [string] | null
}
export default function Test({params}: {params: {mode : string}}) {
    const [kanjis, setKanjis] = useState<string[] | null>(null)
    const {request} = useHttp()
    const [pageNumber, setPageNumber] = useState(1)
    const [maxPageNumber, setMaxPageNumber] = useState(1)

    const [areKanjisLoading, setAreKanjisLoading] = useState(true)

    const [readingKnowledge, setReadingKnowledge] = useState<knowledgeLevelType>(null)
    const [meaningKnowledge, setMeaningKnowledge] = useState<knowledgeLevelType>(null)
    const [writingKnowledge, setWritingKnowledge] = useState<knowledgeLevelType>(null)

    const [btnDisabled, setBtnDisabled] = useState(true)

    const [isTestFinished, setIsTestFinished] = useState(false)

    function clearInputs() {
        setMeaningKnowledge(null)
        setReadingKnowledge(null)
        setWritingKnowledge(null)
    }

    useEffect(() => {
        async function startTest() {
            setAreKanjisLoading(true)

            const resKanjis = await getKanjis()

            setKanjis(resKanjis)

            if (resKanjis) setMaxPageNumber(resKanjis.length)

            setAreKanjisLoading(false)
        }
        async function getKanjis() {
            try {
                const body = await request({path: `/api/test/${params.mode}`}) as IResponseBody
    
                const kanjis = body.kanjis

                return kanjis
            } catch (error) {
                return null
            }
        }
        startTest()
    }, [params.mode, request])

    const areInputsComplete = useCallback((): boolean => {
        if (params.mode === 'known_writing' && readingKnowledge && meaningKnowledge) return true

        if (params.mode === 'known_reading' && writingKnowledge && meaningKnowledge) return true

        if (params.mode === 'known_meaning' && writingKnowledge && readingKnowledge) return true

        return false
    }, [params.mode, readingKnowledge, meaningKnowledge, writingKnowledge])

    useEffect(() => {
        areInputsComplete() ? setBtnDisabled(false) : setBtnDisabled(true)
    }, [readingKnowledge, meaningKnowledge, writingKnowledge, areInputsComplete])

    async function pushTestHandler() {
        if (areInputsComplete()) {
            if (pageNumber === maxPageNumber) setIsTestFinished(true)
    
            clearInputs()
            
            if (pageNumber !== maxPageNumber) setPageNumber(prev => prev + 1)
    
            await savePoints()
        }
    }
    async function savePoints() {
        const writing =  kanjis ? kanjis[pageNumber - 1] : null

        if (!writing) return

        const body = params.mode === 'known_writing' ? {
            readingKnowledge,
            meaningKnowledge,
            writing

        } : params.mode === 'known_reading' ? {
            writingKnowledge,
            meaningKnowledge,
            writing

        } : params.mode === 'known_meaning' ? {
            readingKnowledge,
            writingKnowledge,
            writing

        } : null

        if (!body) return

        await request({
            path: `/api/test/${params.mode}`,
            method: 'POST',
            body
        })
    }
    return (
        <div className={style.container}>
            {kanjis && params.mode === 'known_writing' && !isTestFinished ? (
                <div className={style['test-container']}>
                    <span className={style['page-count']}>{`${pageNumber} / ${maxPageNumber}`}</span>
                    <div className={style['writing-block']}>
                        <span className={style.writing}>{kanjis[pageNumber - 1]}</span>
                    </div>

                    <KnownWritingForm 
                        readingKnowledge={readingKnowledge} 
                        meaningKnowledge={meaningKnowledge} 
                        setReadingKnowledge={setReadingKnowledge} 
                        setMeaningKnowledge={setMeaningKnowledge}
                    />

                    <button
                        disabled={btnDisabled}
                        onClick={() => pushTestHandler()}
                        >
                        {pageNumber === maxPageNumber ? 'Завершить' : 'Далее'}
                    </button>
                </div>
            ) : areKanjisLoading ? (
                <div className={style['non-kanji-container']}>
                    <span className={style.loading}></span>
                </div> 
            ) : !isTestFinished ? (
                <div className={style['non-kanji-container']}>
                    <h2>Иероглифы отсутствуют</h2>
                    <p>В этой категории тестировать нечего.<br/>
                    Пока недоступны недавно протестированные иероглифы, вы можете <Link href='/kanji/single' className={style.link}>добавить новые</Link>.</p>
                </div>
            ) : (
                <div className={style['non-kanji-container']}>
                    <h2>Тест завершён</h2>
                    <p>Возвращайтесь позже и не забудьте <Link href='/repeat'>повторить иероглифы</Link>.</p>
                </div>
            )
            }
        </div>
    )
}