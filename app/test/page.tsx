import { alegreya, shippori_mincho } from '../fonts'
import style from './page.module.css'
import Link from 'next/link'

export default function Test() {
    return (
        <div className={style.container}>
            <h1 className={alegreya.className}>Режимы тестирования</h1>
            <div>
                <Link
                    href={'/test/known_writing'} 
                    className={`${style['mode-box']} ${style['known-writing']}`}
                    >
                    <h2 className={alegreya.className}>По написанию</h2>
                    <p className={`${style['known-value']} ${shippori_mincho.className}`}>学</p>
                    <p className={style['checking']}>Проверяется знание<br/><i>чтений, значений</i></p>
                </Link>
                <div className={`${style['mode-box']} ${style['known-reading']}`}>
                    <h2 className={alegreya.className}>По чтениям</h2>
                    <p className={`${style['known-value']} ${shippori_mincho.className}`}>まなぶ,<br/>がく</p>
                    <p className={style['checking']}>Проверяется знание<br/><i>написания, значений</i></p>
                </div>
                <div className={`${style['mode-box']} ${style['known-meaning']}`}>
                    <h2 className={alegreya.className}>По значениям</h2>
                    <p className={style['known-value']}>изучать,<br/>учение</p>
                    <p className={style['checking']}>Проверяется знание<br/><i>написания, чтений</i></p>
                </div>
            </div>
        </div>
    )
}