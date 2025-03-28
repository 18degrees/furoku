import Link from 'next/link'
import { ibm_plex_sans_jp } from '../fonts'
import style from './page.module.css'
import { getServerSession } from 'next-auth'
import { authConfig } from '../configs/auth'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Тестирование. Выбор категории',
    description: "Доступные разделы: проверка знания одиночных кандзи, сочетаний иероглифов и информация о тестировании"
}

export default async function Page() {
    const session = await getServerSession(authConfig)
    return (
        <div className={style.container}>
            <Link 
                href={session ? '/test/single' : '/signin?callbackUrl=/test/single'}
                className='link-box'
                >
                <label>К тестированию<br/> иероглифов</label>
                <div className={`${style.preview} ${style.single} ${ibm_plex_sans_jp.className}`}>
                    <p>人 自</p>
                    <p>最 近</p>
                    <p>録 仕</p>
                </div>
            </Link>
            <Link 
                href={session ? '/test/combo' : '/signin?callbackUrl=/test/combo'}
                className='link-box'
                >
                <label>К тестированию<br/> сочетаний<br/> иероглифов</label>
                <div className={`${style.preview} ${style.combo} ${ibm_plex_sans_jp.className}`}>
                    <p>従業員</p>
                    <p>事業</p>
                </div>
            </Link>
            <Link 
                href='/test/info'
                className='link-box'
                >
                <label>О тестировании</label>
                <div className={`${style.preview} ${style.info}`}>
                    <p>Режимы тестирования</p>
                    <p>Порядок элементов</p>
                </div>
            </Link>
        </div>
    )
}