import { IKanjiProps, knownValue } from "@/app/interfaces/kanji.interface"
import { alegreya, shippori_mincho, ibm_plex_sans_jp, alegreya_sans } from '@/app/fonts'
import { SortTriangle } from "../Sort-triangle-icon"
import { RemoveIcon } from '../Remove-icon'
import style from './card.module.css'
import { useEffect, useState } from "react"
import { IComboProps } from "@/app/interfaces/combo-kanji.interface"

interface CardProps {
    cardInfo: IKanjiProps | IComboProps
    knownValue: knownValue
    removeCard: (id: string) => {}
    increaseCardPoints: (id: string) => {}
}
export default function Card({cardInfo, knownValue, removeCard, increaseCardPoints}: CardProps) {
    const [isWritingShown, setIsWritingShown] = useState(knownValue === 'writing')
    const [isReadingShown, setIsReadingShown] = useState(knownValue === 'reading')
    const [isMeaningShown, setIsMeaningShown] = useState(knownValue === 'meaning')

    useEffect(() => {
        setIsWritingShown(knownValue === 'writing')
        setIsReadingShown(knownValue === 'reading')
        setIsMeaningShown(knownValue === 'meaning')
    }, [knownValue])
    
    return (
        <div className={style['card-container']}>
            <div className={`${style.card} card ${cardInfo.writing.length === 1 ? style.single : style.combo}`}>
                <button 
                    className={style.remove}
                    onClick={() => removeCard(cardInfo.id)}
                    ><RemoveIcon/>
                </button>
                <div>
                    {
                        knownValue === 'writing' ? <>
                        <div 
                            className={`${style.writing} ${isWritingShown ? style.active : ''} ${shippori_mincho.className}`}
                            >
                            <p>{cardInfo.writing}</p>
                        </div>
                        <div className={`${style.reading} ${isReadingShown ? style.active : ''}`}>
                            <h2 className={alegreya.className} onClick={() => setIsReadingShown(prev => !prev)}>Чтения <span><SortTriangle/></span></h2>
                            <ul>
                                {cardInfo.readings[0] ? cardInfo.readings.map(reading => <li key={reading}>{reading}</li>) : <li>?</li>}
                            </ul>
                        </div>
                        <div className={`${style.meaning} ${isMeaningShown ? style.active : ''}`}>
                            <h2 className={alegreya.className} onClick={() => setIsMeaningShown(prev => !prev)}>Значения <span><SortTriangle/></span></h2>
                            <ul>
                                {cardInfo.meanings[0] ? cardInfo.meanings.map(meaning => <li key={meaning}>{meaning}</li>) : <i>Неизвестны</i>}
                            </ul>
                        </div>
                        </> : knownValue === 'reading' ? <>
                        <div className={`${style.reading} ${isReadingShown ? style.active : ''}`}>
                            <ul>
                                {cardInfo.readings[0] ? cardInfo.readings.map(reading => <li key={reading}>{reading}</li>) : <li>?</li>}
                            </ul>
                        </div>
                        <div className={`${style.writing} ${isWritingShown ? style.active : ''} ${shippori_mincho.className}`}>
                            <h2 className={alegreya.className} onClick={() => setIsWritingShown(prev => !prev)}>Написание <span><SortTriangle/></span></h2>
                            <div><p>{cardInfo.writing}</p></div>
                        </div>
                        <div className={`${style.meaning} ${isMeaningShown ? style.active : ''}`}>
                            <h2 className={alegreya.className} onClick={() => setIsMeaningShown(prev => !prev)}>Значения <span><SortTriangle/></span></h2>
                            <ul>
                                {cardInfo.meanings[0] ? cardInfo.meanings.map(meaning => <li key={meaning}>{meaning}</li>) : <i>Неизвестны</i>}
                            </ul>
                        </div>  
                        </> : <>
                        <div className={`${style.meaning} ${isReadingShown ? style.active : ''}`}>
                            <ul>
                                {cardInfo.meanings[0] ? cardInfo.meanings.map(meaning => <li key={meaning}>{meaning}</li>) : <i>Неизвестны</i>}
                            </ul>
                        </div>
                        <div className={`${style.reading} ${isReadingShown ? style.active : ''}`}>
                            <h2 className={alegreya.className} onClick={() => setIsReadingShown(prev => !prev)}>Чтения <span><SortTriangle/></span></h2>
                            <ul>
                                {cardInfo.readings[0] ? cardInfo.readings.map(reading => <li key={reading}>{reading}</li>) : <li>?</li>}
                            </ul>
                        </div>
                        <div className={`${style.writing} ${isWritingShown ? style.active : ''} ${shippori_mincho.className}`}>
                            <h2 className={alegreya.className} onClick={() => setIsWritingShown(prev => !prev)}>Написание <span><SortTriangle/></span></h2>
                            <div><p>{cardInfo.writing}</p></div>
                        </div>
                        </>
                    }
                </div>
                <button 
                    className={`${style.increase} increase ${alegreya_sans.className}`}
                    onClick={() => increaseCardPoints(cardInfo.id)}
                    >+1
                </button>
            </div>
            
        </div>
        // <div>
        //     <div className={style['show-btns']}>
        //         <button 
        //             className={isWritingShown ? style.active : ''}
        //             onClick={() => setIsWritingShown((prev) => !prev)}
        //             disabled={!cardInfo.writing}
        //             style={{
        //                 display: knownValue === 'writing' ? 'none' : 'block'
        //             }}>{isWritingShown ? 'Скрыть' : 'Показать'} написание
        //         </button>
        //         <button 
        //             className={isReadingShown ? style.active : ''}
        //             onClick={() => setIsReadingShown((prev) => !prev)}
        //             disabled={!cardInfo.readings[0]}
        //             style={{
        //                 display: knownValue === 'reading' ? 'none' : 'block'
        //             }}>{isReadingShown ? 'Скрыть' : 'Показать'} чтения
        //         </button>
        //         <button 
        //             className={isMeaningShown ? style.active : ''}
        //             onClick={() => setIsMeaningShown((prev) => !prev)}
        //             disabled={!cardInfo.meanings[0]}
        //             style={{
        //                 display: knownValue === 'meaning' ? 'none' : 'block'
        //             }}>{isMeaningShown ? 'Скрыть' : 'Показать'} значения
        //         </button>
        //     </div>
        //     <div className={style.card}>
        //         <button 
        //             className={style.remove}
        //             onClick={() => removeCard(cardInfo.id)}
        //             ><RemoveIcon/></button>
        //         <div 
        //             className={`${shippori_mincho.className} ${style.writing}`}
        //             style={{
        //                 display: knownValue === 'writing' || isWritingShown ? 'block' : 'none'
        //             }}
        //             >
        //             <p>{cardInfo.writing}</p>
        //         </div>
        //         <div
        //             className={ibm_plex_sans_jp.className}
        //             style={{
        //                 display: knownValue === 'reading' || isReadingShown ? 'block' : 'none'
        //             }}
        //             >
        //             <ul>
        //                 {cardInfo.readings[0] ? cardInfo.readings.map(reading => <li key={reading}>{reading}</li>) : <li>?</li>}
        //             </ul>
        //         </div>
        //         <div
        //             style={{
        //                 display: knownValue === 'meaning' || isMeaningShown ? 'block' : 'none'
        //             }}
        //             >
        //             <ul>
        //                 {cardInfo.meanings[0] ? cardInfo.meanings.map(meaning => <li key={meaning}>{meaning}</li>) : <li>?</li>}
        //             </ul>
        //         </div>
        //         <button 
        //             className={`${style.increase} ${alegreya_sans.className}`}
        //             onClick={() => increaseCardPoints(cardInfo.id)}
        //             >+1
        //         </button>
        //     </div>
        // </div>
        // <div className={style.card}>
        //     <button onClick={() => removeCard(cardInfo.writing)}><RemoveIcon/></button>
        //     {knownValue === 'writing' ? <>
        //         <div className={`${style.writing} ${isWritingShown ? style.active : ''} ${shippori_mincho.className}`}><p>{cardInfo.writing}</p></div>
        //         <div className={`${style.reading} ${isReadingShown ? style.active : ''}`}>
        //             <h2 className={alegreya.className} onClick={() => setIsReadingShown(prev => !prev)}>Чтения <span><SortTriangle/></span></h2>
        //             <div>
        //                 <div>{cardInfo.kun_readings[0] ? <p className={ibm_plex_sans_jp.className}>{cardInfo.kun_readings.join(' ')}</p> : <i>Кунные неизвестны</i>}</div>
        //                 <hr/>
        //                 <div>{cardInfo.on_readings[0] ? <p className={ibm_plex_sans_jp.className}>{cardInfo.on_readings.join(' ')}</p> : <i>Онные неизвестны</i>}</div>
        //             </div>
        //         </div>
        //         <div className={`${style.meaning} ${isMeaningShown ? style.active : ''}`}>
        //             <h2 className={alegreya.className} onClick={() => setIsMeaningShown(prev => !prev)}>Значения <span><SortTriangle/></span></h2>
        //             <div>
        //                 {cardInfo.meanings[0] ? cardInfo.meanings.map(meaning => <p key={meaning}>{meaning}</p>) : <i>Неизвестны</i>}
        //             </div>
        //         </div>
        //     </> : knownValue === 'reading' ? <>
        //         <div className={`${style.reading} ${isReadingShown ? style.active : ''}`}>
        //             <div>{cardInfo.kun_readings[0] ? <p className={ibm_plex_sans_jp.className}>{cardInfo.kun_readings.join(' ')}</p> : <i>Кунные неизвестны</i>}</div>
        //             <hr/>
        //             <div>{cardInfo.on_readings[0] ? <p className={ibm_plex_sans_jp.className}>{cardInfo.on_readings.join(' ')}</p> : <i>Онные неизвестны</i>}</div>
        //         </div>
        //         <div className={`${style.writing} ${isWritingShown ? style.active : ''} ${shippori_mincho.className}`}>
        //             <h2 className={alegreya.className} onClick={() => setIsWritingShown(prev => !prev)}>Написание <span><SortTriangle/></span></h2>
        //             <div><p>{cardInfo.writing}</p></div>
        //         </div>
        //         <div className={`${style.meaning} ${isMeaningShown ? style.active : ''}`}>
        //             <h2 className={alegreya.className} onClick={() => setIsMeaningShown(prev => !prev)}>Значения <span><SortTriangle/></span></h2>
        //             <div>
        //                 {cardInfo.meanings[0] ? cardInfo.meanings.map(meaning => <p key={meaning}>{meaning}</p>) : <i>Неизвестны</i>}
        //             </div>
        //         </div>  
        //     </> : <>
        //             <div>
        //                 {cardInfo.meanings[0] ? cardInfo.meanings.map(meaning => <p key={meaning}>{meaning}</p>) : <i>Неизвестны</i>}
        //             </div>
        //         <div className={`${style.reading} ${isReadingShown ? style.active : ''}`}>
        //             <h2 className={alegreya.className} onClick={() => setIsReadingShown(prev => !prev)}>Чтения <span><SortTriangle/></span></h2>
        //             <div>
        //                 <div>{cardInfo.kun_readings[0] ? <p className={ibm_plex_sans_jp.className}>{cardInfo.kun_readings.join(' ')}</p> : <i>Кунные неизвестны</i>}</div>
        //                 <hr/>
        //                 <div>{cardInfo.on_readings[0] ? <p className={ibm_plex_sans_jp.className}>{cardInfo.on_readings.join(' ')}</p> : <i>Онные неизвестны</i>}</div>
        //             </div>
        //         </div>
        //         <div className={`${style.writing} ${isWritingShown ? style.active : ''} ${shippori_mincho.className}`}>
        //             <h2 className={alegreya.className} onClick={() => setIsWritingShown(prev => !prev)}>Написание <span><SortTriangle/></span></h2>
        //             <div><p>{cardInfo.writing}</p></div>
        //         </div>
        //     </>}
        // </div>
    )
}