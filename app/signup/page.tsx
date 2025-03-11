'use client'

import { AlertsContext } from "../components/providers/Alerts/AlertsProvider"
import { IDefaultBodyResponse } from "../interfaces/response.interface"
import { EMAIL_PATTERN, PASSWORD_LENGTH } from "../patterns/auth"
import { useContext, useEffect, useState, useRef } from "react"
import { Spinner } from "../components/spinner/Spinner"
import { signIn, useSession } from 'next-auth/react'
import { useHttp } from "../hooks/http.hook"
import { useRouter } from "next/navigation"
import style from './page.module.css'
import { alegreya } from "../fonts"
import Link from "next/link"

const SEND_CODE_COOLDOWN_SEC = 59

export default function Signup() {
    const {request} = useHttp()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [secondPassword, setSecondPassword] = useState('')
    const [code, setCode] = useState('')
    const [areCredentialsCorrect, setAreCredentialsCorrect] = useState<boolean>(false)
    const router = useRouter()

    const isCodeSent = useRef(false)

    const [isEmailConfirmed, setIsEmailConfirmed] = useState(false)

    const [secondsToSendCodeRemaining, setSecondsToSendCodeRemaining] = useState(0)

    const intervalID = useRef<ReturnType<typeof setTimeout>>()

    const [isResponseLoading, setIsResponseLoading] = useState(false)

    const [wrongCodeMessage, setWrongCodeMessage] = useState<string | null>(null)

    const {data: session} = useSession()

    const alerts = useContext(AlertsContext)

    useEffect(() => {
        session ? router.replace('/repeat') : null
    }, [router, session])

    useEffect(() => {
        if (wrongCodeMessage) setWrongCodeMessage(null)
    }, [code, wrongCodeMessage])

    useEffect(() => {
        checkCredentials()

        function checkCredentials() {
            if (!email || !email.match(EMAIL_PATTERN) || !isEmailConfirmed) {
                setAreCredentialsCorrect(false)

            } else if (!password || password.length < PASSWORD_LENGTH.min || password.length > PASSWORD_LENGTH.max || password !== secondPassword) {
                setAreCredentialsCorrect(false)

            } else {
                setAreCredentialsCorrect(true)
            }
        }
    }, [email, password, secondPassword, isEmailConfirmed])

    async function signup() {
        if (!areCredentialsCorrect) return

        try {
            setIsResponseLoading(true)

            const reqBody = await request({
                path: '/api/signup',
                method: 'POST',
                body: {email, password, code}
            }) as IDefaultBodyResponse
                
            if (reqBody.message && reqBody.applicableFor === 'alert') {
                alerts.pushAlert({
                    message: reqBody.message,
                    status: reqBody.success ? 'success' : 'error'
                })
            }
            
            if (!reqBody.success) return 
            
            await signIn('credentials', {email, password, redirect: false})

            setIsResponseLoading(false)
            
        } catch (error) {
            setIsResponseLoading(false)

            setIsEmailConfirmed(false)

            isCodeSent.current = false
            
            setCode('')

            alerts.pushAlert({
                message: 'Произошла ошибка. Попробуйте позже',
                status: 'error'
            })
        }

    }

    async function sendCode() {
        try {
            if (!email || !email.match(EMAIL_PATTERN)) return
            
            setIsResponseLoading(true)

            const body = await request({
                path: '/api/email/sendCode',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: {email}
            }) as IDefaultBodyResponse
    
            setIsResponseLoading(false)

            if (body.message && body.applicableFor === 'alert') {
                alerts.pushAlert({
                    message: body.message,
                    status: body.success ? 'success' : 'error'
                })
            }
    
            if (body.success) {
                isCodeSent.current = true

                setTimerToSendCodeAgain()
            }
        } catch (error) {
            setIsResponseLoading(false)
            alerts.pushAlert({
                message: 'Не удалось отправить код подтверждения. Попробуйте позже',
                status: 'error'
            })
        }
    }
    function setTimerToSendCodeAgain() {
        setSecondsToSendCodeRemaining(SEND_CODE_COOLDOWN_SEC)

        intervalID.current = setInterval(() => {
            setSecondsToSendCodeRemaining(currentSecond => {
                if (currentSecond === 0) {
                    clearInterval(intervalID.current)

                    return 0
                } else {
                    return currentSecond - 1
                }
            })
        }, 1000)
    }

    function onCodeChange(symbol: string) {
        if (symbol.match(/^\d+$/) || symbol === '') setCode(symbol)
    }

    async function checkEmailValidity() {
        try {
            if (!email || !email.match(EMAIL_PATTERN) || !code || code.length !== 5) return
                
            setIsResponseLoading(true)

            const body = await request({
                path: '/api/email/verify',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: {email, code}
            }) as IDefaultBodyResponse

            setIsResponseLoading(false)
    
            if (body.success) setIsEmailConfirmed(true)

            if (body.message && body.applicableFor === 'notification' && !body.success) {
                setWrongCodeMessage(body.message)
            }


        } catch (error) {
            setIsResponseLoading(false)
        }
    }

    return (
        <div className={style.container}>
            <div className={`${style.content} auth-box`}>
                {isResponseLoading ? <div className={style.spinner}><Spinner size={30}/></div> : null}
                <h1 className={`${alegreya.className} ${style.h1}`}>Регистрация</h1>
                <div className={style.interactive}>
                    <Link 
                        href='/signin'
                        className={style.signin}
                        >
                        Уже есть аккаунт?
                    </Link>
                    <div className={style['inputs-box']}>
                        <div className={style['credentials']}>
                            <label htmlFor='email'>Почта</label>
                            <div className={style['email-container']}>
                                <input 
                                    type="email" 
                                    id='email'
                                    name="email"
                                    placeholder='Введите почту'
                                    pattern={EMAIL_PATTERN}
                                    spellCheck={false}
                                    autoComplete="email"
                                    value={email}
                                    readOnly={isEmailConfirmed}
                                    onInput={(event: React.ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
                                />
                                <button
                                    onClick={sendCode}
                                    disabled={!email || !email.match(EMAIL_PATTERN) || secondsToSendCodeRemaining || isEmailConfirmed ? true : false}
                                >
                                    Отправить код подтверждения
                                </button>
                            </div>
                            {/* <div className={style['error-box']}>
                                <span 
                                    hidden={email && !email.match(EMAIL_PATTERN) ? false : true}
                                    >Почта введена в неверном формате</span>
                            </div> */}
                            {isCodeSent.current && secondsToSendCodeRemaining && !isEmailConfirmed ? 
                                <p className={style.remaining}>Повторить попытку можно через {secondsToSendCodeRemaining} с</p> 
                            : null}
                            <div className={`${style['code-container']} code-container`}>
                                <input 
                                    type="text" 
                                    id='code'
                                    name="code"
                                    placeholder='Код с почты'
                                    spellCheck={false}
                                    autoComplete='off'
                                    value={code}
                                    maxLength={5}
                                    readOnly={isEmailConfirmed}
                                    onInput={(event: React.ChangeEvent<HTMLInputElement>) => onCodeChange(event.target.value)}
                                />
                                <button
                                    onClick={checkEmailValidity}
                                    disabled={code.length != 5 || isEmailConfirmed ? true : false}
                                >
                                    {isEmailConfirmed ? 'Подтверждено' : 'Подтвердить'}
                                </button>
                            </div>
                            <p className={style['wrong-code-message']}>{wrongCodeMessage}</p>
                        </div>
                        <div className={style['credentials']}>
                            <label htmlFor='password'>Пароль</label>
                            <input
                                type="password"
                                id='password'
                                placeholder='Введите пароль'
                                minLength={PASSWORD_LENGTH.min}
                                maxLength={PASSWORD_LENGTH.max}
                                value={password}
                                onInput={(event: React.ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
                            />
                            {/* <div className={style['error-box']}>
                                <span
                                    hidden={password && password.length < PASSWORD_LENGTH.min ? false : true}
                                >Слишком короткий пароль</span>
                                <span
                                    hidden={password && password.length > PASSWORD_LENGTH.max ? false : true}
                                >Слишком длинный пароль</span>
                            </div> */}
                        </div>
                        <div className={style['credentials']}>
                            <label htmlFor='password-2'>Повторите пароль</label>
                            <input
                                type="password"
                                id='password-2'
                                placeholder='Введите пароль повторно'
                                value={secondPassword}
                                onInput={(event: React.ChangeEvent<HTMLInputElement>) => setSecondPassword(event.target.value)}
                            />
                            {/* <div className={style['error-box']}>
                                <span
                                    hidden={password && secondPassword && password !== secondPassword ? false : true}
                                >Пароли не совпадают</span>
                            </div> */}
                        </div>
                    </div>
                    <button
                        className={style['reg-btn']}
                        onClick={signup} 
                        disabled={!areCredentialsCorrect}
                        >Зарегистрироваться
                    </button>
                </div>
            </div>
            <style jsx>{`
                ${isCodeSent.current ? 
                    `.code-container {
                        display: block
                    }` : null}
                }
                ${password && secondPassword && password !== secondPassword ? 
                    `#password-2 {
                        border: 1px solid #9d7575;
                    }` : null}
            `}</style>
        </div>
        
    )
}