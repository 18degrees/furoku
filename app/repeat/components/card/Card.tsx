import { IKanjiProps, knownValue } from "@/app/interfaces/kanji.interface"
import { alegreya, shippori_mincho, ibm_plex_sans_jp } from '@/app/fonts'
import { SortTriangle } from "../Sort-triangle-icon"
import { RemoveIcon } from '../Remove-icon'
import style from './card.module.css'
import { useEffect, useState } from "react"
import { IComboProps } from "@/app/interfaces/combo-kanji.interface"

interface CardProps {
    cardInfo: IKanjiProps | IComboProps
    knownValue: knownValue
    removeCard: (id: string) => {}
}
export default function Card({cardInfo, knownValue, removeCard}: CardProps) {
    const [isWritingShown, setIsWritingShown] = useState(knownValue === 'writing')
    const [isReadingShown, setIsReadingShown] = useState(knownValue === 'reading')
    const [isMeaningShown, setIsMeaningShown] = useState(knownValue === 'meaning')

    useEffect(() => {
        setIsWritingShown(knownValue === 'writing')
        setIsReadingShown(knownValue === 'reading')
        setIsMeaningShown(knownValue === 'meaning')
    }, [knownValue])
    
    return (
        <div>
            <div className={style['show-btns']}>
                <button 
                    className={isWritingShown ? style.active : ''}
                    onClick={() => setIsWritingShown((prev) => !prev)}
                    disabled={!cardInfo.writing}
                    style={{
                        display: knownValue === 'writing' ? 'none' : 'block'
                    }}>{isWritingShown ? 'Скрыть' : 'Показать'} написание
                </button>
                <button 
                    className={isReadingShown ? style.active : ''}
                    onClick={() => setIsReadingShown((prev) => !prev)}
                    disabled={!cardInfo.readings[0]}
                    style={{
                        display: knownValue === 'reading' ? 'none' : 'block'
                    }}>{isReadingShown ? 'Скрыть' : 'Показать'} чтения
                </button>
                <button 
                    className={isMeaningShown ? style.active : ''}
                    onClick={() => setIsMeaningShown((prev) => !prev)}
                    disabled={!cardInfo.meanings[0]}
                    style={{
                        display: knownValue === 'meaning' ? 'none' : 'block'
                    }}>{isMeaningShown ? 'Скрыть' : 'Показать'} значения
                </button>
            </div>
            <div className={style.card}>
                <button 
                    className={style.remove}
                    onClick={() => removeCard(cardInfo.id)}
                    ><RemoveIcon/></button>
                <div 
                    className={`${shippori_mincho.className} ${style.writing}`}
                    style={{
                        display: knownValue === 'writing' || isWritingShown ? 'block' : 'none'
                    }}
                    >
                    <p>{cardInfo.writing}</p>
                </div>
                <div
                    className={ibm_plex_sans_jp.className}
                    style={{
                        display: knownValue === 'reading' || isReadingShown ? 'block' : 'none'
                    }}
                    >
                    <ul>
                        {cardInfo.readings[0] ? cardInfo.readings.map(reading => <li key={reading}>{reading}</li>) : <li>?</li>}
                    </ul>
                </div>
                <div
                    style={{
                        display: knownValue === 'meaning' || isMeaningShown ? 'block' : 'none'
                    }}
                    >
                    <ul>
                        {cardInfo.meanings[0] ? cardInfo.meanings.map(meaning => <li key={meaning}>{meaning}</li>) : <li>?</li>}
                    </ul>
                </div>
            </div>
        </div>
        // <div className={style.card}>
        //     <button onClick={() => removeCard(kanjiInfo.writing)}><RemoveIcon/></button>
        //     {knownValue === 'writing' ? <>
        //         <div className={`${style.writing} ${isWritingShown ? style.active : ''} ${shippori_mincho.className}`}><p>{kanjiInfo.writing}</p></div>
        //         <div className={`${style.reading} ${isReadingShown ? style.active : ''}`}>
        //             <h2 className={alegreya.className} onClick={() => setIsReadingShown(prev => !prev)}>Чтения <span><SortTriangle/></span></h2>
        //             <div>
        //                 <div>{kanjiInfo.kun_readings[0] ? <p className={ibm_plex_sans_jp.className}>{kanjiInfo.kun_readings.join(' ')}</p> : <i>Кунные неизвестны</i>}</div>
        //                 <hr/>
        //                 <div>{kanjiInfo.on_readings[0] ? <p className={ibm_plex_sans_jp.className}>{kanjiInfo.on_readings.join(' ')}</p> : <i>Онные неизвестны</i>}</div>
        //             </div>
        //         </div>
        //         <div className={`${style.meaning} ${isMeaningShown ? style.active : ''}`}>
        //             <h2 className={alegreya.className} onClick={() => setIsMeaningShown(prev => !prev)}>Значения <span><SortTriangle/></span></h2>
        //             <div>
        //                 {kanjiInfo.meanings[0] ? kanjiInfo.meanings.map(meaning => <p key={meaning}>{meaning}</p>) : <i>Неизвестны</i>}
        //             </div>
        //         </div>
        //     </> : knownValue === 'reading' ? <>
        //         <div className={`${style.reading} ${isReadingShown ? style.active : ''}`}>
        //             <div>{kanjiInfo.kun_readings[0] ? <p className={ibm_plex_sans_jp.className}>{kanjiInfo.kun_readings.join(' ')}</p> : <i>Кунные неизвестны</i>}</div>
        //             <hr/>
        //             <div>{kanjiInfo.on_readings[0] ? <p className={ibm_plex_sans_jp.className}>{kanjiInfo.on_readings.join(' ')}</p> : <i>Онные неизвестны</i>}</div>
        //         </div>
        //         <div className={`${style.writing} ${isWritingShown ? style.active : ''} ${shippori_mincho.className}`}>
        //             <h2 className={alegreya.className} onClick={() => setIsWritingShown(prev => !prev)}>Написание <span><SortTriangle/></span></h2>
        //             <div><p>{kanjiInfo.writing}</p></div>
        //         </div>
        //         <div className={`${style.meaning} ${isMeaningShown ? style.active : ''}`}>
        //             <h2 className={alegreya.className} onClick={() => setIsMeaningShown(prev => !prev)}>Значения <span><SortTriangle/></span></h2>
        //             <div>
        //                 {kanjiInfo.meanings[0] ? kanjiInfo.meanings.map(meaning => <p key={meaning}>{meaning}</p>) : <i>Неизвестны</i>}
        //             </div>
        //         </div>  
        //     </> : <>
        //             <div>
        //                 {kanjiInfo.meanings[0] ? kanjiInfo.meanings.map(meaning => <p key={meaning}>{meaning}</p>) : <i>Неизвестны</i>}
        //             </div>
        //         <div className={`${style.reading} ${isReadingShown ? style.active : ''}`}>
        //             <h2 className={alegreya.className} onClick={() => setIsReadingShown(prev => !prev)}>Чтения <span><SortTriangle/></span></h2>
        //             <div>
        //                 <div>{kanjiInfo.kun_readings[0] ? <p className={ibm_plex_sans_jp.className}>{kanjiInfo.kun_readings.join(' ')}</p> : <i>Кунные неизвестны</i>}</div>
        //                 <hr/>
        //                 <div>{kanjiInfo.on_readings[0] ? <p className={ibm_plex_sans_jp.className}>{kanjiInfo.on_readings.join(' ')}</p> : <i>Онные неизвестны</i>}</div>
        //             </div>
        //         </div>
        //         <div className={`${style.writing} ${isWritingShown ? style.active : ''} ${shippori_mincho.className}`}>
        //             <h2 className={alegreya.className} onClick={() => setIsWritingShown(prev => !prev)}>Написание <span><SortTriangle/></span></h2>
        //             <div><p>{kanjiInfo.writing}</p></div>
        //         </div>
        //     </>}
        // </div>
    )
}