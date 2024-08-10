'use client'

import { AlertsContext } from "../components/providers/Alerts/AlertsProvider"
import { EMAIL_PATTERN, PASSWORD_LENGTH } from "../patterns/auth"
import { useRouter, useSearchParams } from "next/navigation"
import { Spinner } from "../components/spinner/Spinner"
import { useState, useEffect, useContext } from "react"
import { signIn, useSession } from "next-auth/react"
import style from './page.module.css'
import { alegreya } from "../fonts"
import Link from "next/link"

export default function SignIn() {
    const [email, setEmail] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [areCredentialsCorrect, setAreCredentialsCorrect] = useState<boolean>(false)
    const router = useRouter()

    const [isResponseLoading, setIsResponseLoading] = useState(false)
    
    const alerts = useContext(AlertsContext)

    const searchParams = useSearchParams()
    const {data: session} = useSession()
    
    useEffect(() => {
        const callbackUrl = searchParams.get('callbackUrl') ?? '/repeat'
        
        if (session) {
            router.replace(callbackUrl)
        }
    }, [router, session, searchParams])

    useEffect(() => {
        checkCredentials()

        function checkCredentials() {
            if (!email || !email.match(EMAIL_PATTERN)) {
                setAreCredentialsCorrect(false)

            } else if (!password || password.length < PASSWORD_LENGTH.min || password.length > PASSWORD_LENGTH.max) {
                setAreCredentialsCorrect(false)

            } else {
                setAreCredentialsCorrect(true)
            }
        }
    }, [email, password])

    async function sendRequest() {
        try {
            setIsResponseLoading(true)

            const response = await signIn('credentials', {email, password, redirect: false})

            setIsResponseLoading(false)

            if (response && response.status >= 500) throw Error('Ошибка сервера')
            
            if (response && !response.ok) return alerts.pushAlert({message: 'Данные неверны', status: 'error'})

            alerts.pushAlert({message: 'Авторизация выполнена', status: 'success'})                
        } catch (error) {
            alerts.pushAlert({message: 'Ошибка сервера. Попробуйте позже', status: 'error'})
        }
    }
    return (
        <div className={style.container}>
            <div className={style.content}>
                {isResponseLoading ? <div className={style.spinner}><Spinner size={30}/></div> : null}
                <h1 className={`${alegreya.className} ${style.h1}`}>Вход</h1>
                <div className={style.interactive}>
                    <Link 
                        href='/signup'
                        className={style.signup}
                        >Новый аккаунт?
                    </Link>
                    <div className={style['inputs-box']}>
                        <div className={`${style['email-box']} ${style['credentials']}`}>
                            <label htmlFor="email">Почта</label>
                            <input 
                                type="text" 
                                id='email'
                                placeholder='Введите почту'
                                pattern={`${EMAIL_PATTERN}`}
                                value={email}
                                onInput={(event: React.ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
                            ></input>
                        </div>
                        <div className={`${style['password-box']} ${style['credentials']}`}>
                            <label htmlFor="password">Пароль</label>
                            <input
                                type="password"
                                id='password'
                                placeholder='Введите пароль'
                                minLength={PASSWORD_LENGTH.min}
                                maxLength={PASSWORD_LENGTH.max}
                                value={password}
                                onInput={(event: React.ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
                            ></input>
                        </div>
                    </div>
                    <button 
                        onClick={sendRequest} 
                        disabled={!areCredentialsCorrect}
                        >Войти
                    </button>
                </div>
            </div>
        </div>
    )
}