import { alegreya, ibm_plex_sans_jp, shippori_mincho } from '../../fonts'
import style from './page.module.css'
import Link from 'next/link'

export default function Test() {
    return (
        <div className={style.container}>
            <h1 className={alegreya.className}>Режимы тестирования</h1>
            <div>
                <Link
                    href={'/test/single/known_writing'} 
                    className={`${style['mode-box']} card ${style['known-writing']}`}
                    >
                    <h2 className={alegreya.className}>По написанию</h2>
                    <p className={`${style['known-value']} ${shippori_mincho.className}`}>学</p>
                    <p className={`${style['checking']} checking`}>Проверяется знание<br/><i>чтений, значений</i></p>
                </Link>
                <Link
                    href={'/test/single/known_reading'}
                    className={`${style['mode-box']} card ${style['known-reading']}`}
                    >
                    <h2 className={alegreya.className}>По чтениям</h2>
                    <p className={`${style['known-value']} ${ibm_plex_sans_jp.className}`}>まなぶ;<br/>がく</p>
                    <p className={`${style['checking']} checking`}>Проверяется знание<br/><i>написания, значений</i></p>
                </Link>
                <Link
                    href={'/test/single/known_meaning'} 
                    className={`${style['mode-box']} card ${style['known-meaning']}`}>
                    <h2 className={alegreya.className}>По значениям</h2>
                    <p className={style['known-value']}>learning;<br/>science;<br/>study</p>
                    <p className={`${style['checking']} checking`}>Проверяется знание<br/><i>написания, чтений</i></p>
                </Link>
            </div>
        </div>
    )
}