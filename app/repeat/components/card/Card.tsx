import { IKanjiProps, knownValue } from "@/app/interfaces/kanji.interface"
import { alegreya, shippori_mincho, ibm_plex_sans_jp } from '@/app/fonts'
import { SortTriangle } from "../Sort-triangle-icon"
import { RemoveIcon } from '../Remove-icon'
import style from './card.module.css'
import { useState } from "react"

interface CardProps {
    kanjiInfo: IKanjiProps
    knownValue: knownValue
    removeKanji: (writing: string) => {}
}
export default function Card({kanjiInfo, knownValue, removeKanji}: CardProps) {
    const [isWritingShown, setIsWritingShown] = useState(false)
    const [isReadingShown, setIsReadingShown] = useState(false)
    const [isMeaningShown, setIsMeaningShown] = useState(false)
    
    return (
        <div className={style.card}>
            <button onClick={() => removeKanji(kanjiInfo.writing)}><RemoveIcon/></button>
            {knownValue === 'writing' ? <>
                <div className={`${style.writing} ${isWritingShown ? style.active : ''} ${shippori_mincho.className}`}><p>{kanjiInfo.writing}</p></div>
                <div className={`${style.reading} ${isReadingShown ? style.active : ''}`}>
                    <h2 className={alegreya.className} onClick={() => setIsReadingShown(prev => !prev)}>Чтения <span><SortTriangle/></span></h2>
                    <div>
                        <div>{kanjiInfo.kun_readings[0] ? <p className={ibm_plex_sans_jp.className}>{kanjiInfo.kun_readings.join(' ')}</p> : <i>Кунные неизвестны</i>}</div>
                        <hr/>
                        <div>{kanjiInfo.on_readings[0] ? <p className={ibm_plex_sans_jp.className}>{kanjiInfo.on_readings.join(' ')}</p> : <i>Онные неизвестны</i>}</div>
                    </div>
                </div>
                <div className={`${style.meaning} ${isMeaningShown ? style.active : ''}`}>
                    <h2 className={alegreya.className} onClick={() => setIsMeaningShown(prev => !prev)}>Значения <span><SortTriangle/></span></h2>
                    <div>
                        {kanjiInfo.meanings[0] ? kanjiInfo.meanings.map(meaning => <p key={meaning}>{meaning}</p>) : <i>Неизвестны</i>}
                    </div>
                </div>
            </> : knownValue === 'reading' ? <>
                <div className={`${style.reading} ${isReadingShown ? style.active : ''}`}>
                    <div>{kanjiInfo.kun_readings[0] ? <p className={ibm_plex_sans_jp.className}>{kanjiInfo.kun_readings.join(' ')}</p> : <i>Кунные неизвестны</i>}</div>
                    <hr/>
                    <div>{kanjiInfo.on_readings[0] ? <p className={ibm_plex_sans_jp.className}>{kanjiInfo.on_readings.join(' ')}</p> : <i>Онные неизвестны</i>}</div>
                </div>
                <div className={`${style.writing} ${isWritingShown ? style.active : ''} ${shippori_mincho.className}`}>
                    <h2 className={alegreya.className} onClick={() => setIsWritingShown(prev => !prev)}>Написание <span><SortTriangle/></span></h2>
                    <div><p>{kanjiInfo.writing}</p></div>
                </div>
                <div className={`${style.meaning} ${isMeaningShown ? style.active : ''}`}>
                    <h2 className={alegreya.className} onClick={() => setIsMeaningShown(prev => !prev)}>Значения <span><SortTriangle/></span></h2>
                    <div>
                        {kanjiInfo.meanings[0] ? kanjiInfo.meanings.map(meaning => <p key={meaning}>{meaning}</p>) : <i>Неизвестны</i>}
                    </div>
                </div>  
            </> : <>
                    <div>
                        {kanjiInfo.meanings[0] ? kanjiInfo.meanings.map(meaning => <p key={meaning}>{meaning}</p>) : <i>Неизвестны</i>}
                    </div>
                <div className={`${style.reading} ${isReadingShown ? style.active : ''}`}>
                    <h2 className={alegreya.className} onClick={() => setIsReadingShown(prev => !prev)}>Чтения <span><SortTriangle/></span></h2>
                    <div>
                        <div>{kanjiInfo.kun_readings[0] ? <p className={ibm_plex_sans_jp.className}>{kanjiInfo.kun_readings.join(' ')}</p> : <i>Кунные неизвестны</i>}</div>
                        <hr/>
                        <div>{kanjiInfo.on_readings[0] ? <p className={ibm_plex_sans_jp.className}>{kanjiInfo.on_readings.join(' ')}</p> : <i>Онные неизвестны</i>}</div>
                    </div>
                </div>
                <div className={`${style.writing} ${isWritingShown ? style.active : ''} ${shippori_mincho.className}`}>
                    <h2 className={alegreya.className} onClick={() => setIsWritingShown(prev => !prev)}>Написание <span><SortTriangle/></span></h2>
                    <div><p>{kanjiInfo.writing}</p></div>
                </div>
            </>}
        </div>
    )
}