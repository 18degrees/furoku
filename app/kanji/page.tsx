import Link from 'next/link'
import { ibm_plex_sans_jp } from '../fonts'
import style from './page.module.css'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Списки. Выбор категории',
    description: "Доступные разделы: одиночные кандзи, сочетания иероглифов и информация о списках"
}

export default function Page() {
    return (
        <div className={style.container}>
            <Link href='/kanji/single'>
                <label>К списку<br/> иероглифов</label>
                <div className={`${style.preview} ${style.single} ${ibm_plex_sans_jp.className}`}>
                    <p>人 自</p>
                    <p>最 近</p>
                    <p>録 仕</p>
                </div>
            </Link>
            <Link href='/kanji/combo'>
                <label>К списку<br/> сочетаний<br/> иероглифов</label>
                <div className={`${style.preview} ${style.combo} ${ibm_plex_sans_jp.className}`}>
                    <p>従業員</p>
                    <p>事業</p>
                </div>
            </Link>
            <Link href='/kanji/info'>
                <label>О списках</label>
                <div className={`${style.preview} ${style.info}`}>
                    <p>Содержимое карточек</p>
                    <p>Упрощение поиска</p>
                </div>
            </Link>
        </div>
    )
}