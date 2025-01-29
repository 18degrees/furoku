"use client"

import { shippori_mincho, alegreya } from '@/app/fonts'
import { signOut, useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PagesIcon } from '../Pages-icon'
import { CloseIcon } from '../Close-Icon'
import style from './header.module.css'
import Link from 'next/link'
import '@/app/globals.css'

export function Header() {
    const {data: session} = useSession()

    const [isNavOpened, setIsNavOpened] = useState(false)

    const pathname = usePathname()

    useEffect(() => {
        setIsNavOpened(false)
    }, [])

    return (
        <header className={`${style.header}`}>
            <span className={`${shippori_mincho.className} ${style.logo}`}>ふ</span>
            <div>
                <div 
                    className={style['pages-icon']}
                    onClick={() => setIsNavOpened(true)}>
                    <PagesIcon/>
                </div>
                <div>
                    <div 
                        className={`${style['nav-background']} nav-background`}
                        onClick={() => setIsNavOpened(false)}
                    />
                    <nav className={`${style.nav} nav`}>
                        <div 
                            className={style.close}
                            onClick={() => setIsNavOpened(false)}>
                            <CloseIcon/>
                        </div>
                        <ul>
                            <li>
                                <Link 
                                    href='/'
                                    onClick={() => setIsNavOpened(false)}
                                    >Главная
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    href='/kanji'
                                    onClick={() => setIsNavOpened(false)}
                                    >Иероглифы
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    href='/test'
                                    onClick={() => setIsNavOpened(false)}
                                    >Тестирование
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    href={session ? '/repeat' : '/signin?callbackUrl=/repeat'}
                                    onClick={() => setIsNavOpened(false)}
                                    >Повторение
                                </Link>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
            <div className={style['user-box']}>
                {session ? 
                <>
                    <span className={`${shippori_mincho.className} ${style.user}`}>人</span>
                    <div className={style['menu-container']}>
                        <div className={style.menu}>
                            <span onClick={() => signOut()}>Выйти</span>
                        </div>
                    </div>
                </>
                :
                <Link 
                    href='/signin' 
                    className={`${shippori_mincho.className} ${style.user}`}
                >?
                </Link>
                }
            </div>
            <style jsx>{`
                    ${isNavOpened ? `
                        html {
                            overflow: hidden !important
                        }
                        .nav-background {
                            transform: translateX(0);
                            display: block;
                        }
                        .nav {
                            transform: translateX(0);
                        }
                        ${
                            pathname === '/' ? `
                                .nav li:first-of-type {
                                    background-color: #6e596d
                                }
                            ` : pathname === '/kanji' ? `
                                .nav li:nth-of-type(2) {
                                    background-color: #6e596d
                                }
                            ` : pathname === '/test' ? `
                                .nav li:nth-of-type(3) {
                                    background-color: #6e596d
                                }
                            ` : pathname === '/repeat' ? `
                                .nav li:nth-of-type(4) {
                                    background-color: #6e596d
                                }
                            ` : ''}
                    `   : ``}
            `}</style>
        </header>
    )
}