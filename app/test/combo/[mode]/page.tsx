"use client"

import { KnownWritingForm, KnownMeaningForm, KnownReadingForm } from "../../components/forms/Test-forms"
import { IDefaultBodyResponse } from "@/app/interfaces/response.interface"
import { ITestCombo } from "@/app/interfaces/combo-kanji.interface"
import { useCallback, useEffect, useState } from "react"
import { useHttp } from "@/app/hooks/http.hook"
import style from './page.module.css'
import Link from "next/link"

type knowledgeLevelType = 'well' | 'medium' | 'bad' | null

interface IResponseBody extends IDefaultBodyResponse {
    combos: ITestCombo[] | null
}
export default function Test({params}: {params: {mode : string}}) {
    const [combosInfo, setcombosInfo] = useState<ITestCombo[] | null>(null)
    const {request} = useHttp()
    const [pageNumber, setPageNumber] = useState(1)
    const [maxPageNumber, setMaxPageNumber] = useState(1)

    const [areCombosLoading, setAreCombosLoading] = useState(true)

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
            setAreCombosLoading(true)

            const resKanjis = await getKanjis()

            setcombosInfo(resKanjis)

            if (resKanjis) setMaxPageNumber(resKanjis.length)

            setAreCombosLoading(false)
        }
        async function getKanjis() {
            try {
                const body = await request({path: `/api/test/combo/${params.mode}`}) as IResponseBody
    
                const combos = body.combos

                return combos && combos[0] ? combos : null
            } catch (error) {
                return null
            }
        }

        // function getNeededInfo(resKanjis: ITestKanji[]) {
        //     const neededInfo: string[] = []

        //     for (const kanjiObj of resKanjis) {
        //         switch (params.mode) {
        //             case 'known_reading':
        //                 if (kanjiObj.kun_readings) neededInfo.push(kanjiObj.kun_readings)
        //                 break;
        //             case 'known_meaning':
        //                 if (kanjiObj.meanings) neededInfo.push(kanjiObj.meanings)
        //                 break;
        //             default:
        //                 neededInfo.push(kanjiObj.writing)
        //         }
        //     }
        //     return neededInfo
        // }
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
        const id = combosInfo ? combosInfo[pageNumber - 1].id : null

        if (!id) return

        const body = params.mode === 'known_writing' ? {
            readingKnowledge,
            meaningKnowledge,
            id

        } : params.mode === 'known_reading' ? {
            writingKnowledge,
            meaningKnowledge,
            id

        } : params.mode === 'known_meaning' ? {
            readingKnowledge,
            writingKnowledge,
            id

        } : null

        if (!body) return

        await request({
            path: `/api/test/combo/${params.mode}`,
            method: 'POST',
            body
        })
    }
    return (
        <div className={style.container}>
            {combosInfo && (params.mode === 'known_writing' || params.mode === 'known_reading' || params.mode === 'known_meaning') && !isTestFinished ? (
                <div className={`${style['test-container']} test-container`}>
                    <span className={style['page-count']}>{`${pageNumber} / ${maxPageNumber}`}</span>
                    <div className={style['writing-block']}>
                        <span className={`${style.writing} writing`}>{
                            params.mode === 'known_reading' && combosInfo[pageNumber - 1].readings ?  combosInfo[pageNumber - 1].readings!.join(';\n') :
                            params.mode === 'known_meaning' && combosInfo[pageNumber - 1].meanings ?  combosInfo[pageNumber - 1].meanings!.join(';\n') :
                            combosInfo[pageNumber - 1].writing
                        }</span>
                    </div>

                    { 
                        params.mode === 'known_writing' ? <KnownWritingForm 
                            readingKnowledge={readingKnowledge} 
                            meaningKnowledge={meaningKnowledge} 
                            setReadingKnowledge={setReadingKnowledge} 
                            setMeaningKnowledge={setMeaningKnowledge}
                        /> : 
                        params.mode === 'known_reading' ? <KnownReadingForm 
                            writingKnowledge={writingKnowledge}
                            meaningKnowledge={meaningKnowledge}
                            setWritingKnowledge={setWritingKnowledge} 
                            setMeaningKnowledge={setMeaningKnowledge}
                        /> :
                        params.mode === 'known_meaning' ? <KnownMeaningForm 
                            writingKnowledge={writingKnowledge}
                            readingKnowledge={readingKnowledge}
                            setWritingKnowledge={setWritingKnowledge} 
                            setReadingKnowledge={setReadingKnowledge}
                        /> :
                        <p>Выбран неверный режим тестирования</p>
                    }

                    <button
                        disabled={btnDisabled}
                        onClick={() => pushTestHandler()}
                        >
                        {pageNumber === maxPageNumber ? 'Завершить' : 'Далее'}
                    </button>
                </div>
            ) : areCombosLoading ? (
                <div className={`${style['non-kanji-container']} non-kanji-container`}>
                    <span className={style.loading}></span>
                </div> 
            ) : !isTestFinished ? (
                <div className={`${style['non-kanji-container']} non-kanji-container`}>
                    <h2>Иероглифы отсутствуют</h2>
                    <p>В этой категории тестировать нечего.<br/>
                    Пока недоступны недавно протестированные комбинации иероглифов, вы можете <Link href='/kanji/combo' className={style.link}>добавить новые</Link>.</p>
                </div>
            ) : (
                <div className={`${style['non-kanji-container']} non-kanji-container`}>
                    <h2>Тест завершён</h2>
                    <p>Возвращайтесь позже и не забудьте <Link href='/repeat'>повторить иероглифы</Link>.</p>
                </div>
            )
            }
            <style jsx>{`
                .writing {
                    font-size: ${params.mode === 'known_writing' ? 65 : 35}px
                }
            `}

            </style>
        </div>
    )
}