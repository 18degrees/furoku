import github_mark from '@/app/images/github-mark-white.png'
import style from './footer.module.css'
import { alegreya } from '@/app/fonts'
import Image from 'next/image'
import Link from 'next/link'
import { GithubMark } from '../Gihub-mark'

export function Footer() {
    return (
        <footer className={style.footer}>
            <div>
                <div className={style.info}>
                    <h2 className={alegreya.className}>Контакты</h2>
                    <p>support@furoku.ru</p>
                </div>
                <Link 
                    href='https://github.com/18degrees/furoku' 
                    target='_blank'
                    rel='external'
                    className={style.git}
                >
                    <GithubMark/>
                </Link>
            </div>
        </footer>
    )
}