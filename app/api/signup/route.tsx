import { EMAIL_PATTERN, PASSWORD_LENGTH } from "@/app/patterns/auth"
import { IUserDoc, usersKanji } from "@/app/interfaces/user.interface"
import { NextRequest } from "next/server"
import nodemailer from 'nodemailer'
import bcrypt from 'bcrypt'
import nano from "nano"

interface IRequestBody {
    email: any
    code: any
    password: any
}
interface INewUser extends nano.MaybeDocument {
    email: string
    hashed_password: string
    signup_date: Date
    kanjis?: usersKanji[]
}
interface IUsersDB extends nano.DocumentScope<unknown> {
    docs: [IUserDoc]
}

const URL = process.env.URL!
const DB_URI = process.env.COUCHDB_URI!

export async function POST(req: NextRequest) {
    try {        
        if (!req) throw new Error('Отсутствует переменная запроса')
        
        const body = await req.json() as IRequestBody
        
        const email = typeof body.email === 'string' ? body.email.trim() : null
        const password = typeof body.password === 'string' ? body.password.trim() : null
        const code = typeof body.code === 'string' ? body.code.trim() : null

        if (!email || !email.match(EMAIL_PATTERN)) {
            return Response.json({
                message: 'Почта введена неверно',
            }, {status: 400})
        }
        if (!password || password.length < PASSWORD_LENGTH.min || password.length > PASSWORD_LENGTH.max) {
            return Response.json({
                message: 'Пароль введён неверно',
            }, {status: 400})
        }
        
        const nanoServer = nano(DB_URI)
        
        const usersDB = nanoServer.db.use('users') as IUsersDB
        
        const sameEmailSearchResult = await usersDB.find({
            selector: {
                email: {"$eq": email}
            }
        })
        const isEmailRegistered = sameEmailSearchResult.docs[0]

        if (isEmailRegistered) {
            return Response.json({
                message: 'Почта уже используется',
                applicableFor: 'alert',
                success: false
            }, {status: 200})
        }
        if (!code || !(await isEmailValid(email, code))) {
            return Response.json({
                message: 'Код верификации неверен'
            }, {status: 400})
        }
        const hashedPassword = await bcrypt.hash(password, 12)

        const user: INewUser = {
            _id: email,
            email,
            hashed_password: hashedPassword,
            signup_date: new Date()
        }

        await usersDB.insert(user)

        await sendWelcomeEmail(email)

        return Response.json({
            message: 'Регистрация завершена',
            applicableFor: 'alert',
            success: true
        })
    } catch (error: unknown) {
        console.log(error)
        return Response.json(
            {
                message: 'Неизвестная ошибка. Попробуйте позже',
            }, {status: 500})
    }
}
async function isEmailValid(email: string, code: string) {
    try {    
        const reqBody = JSON.stringify({
            email, 
            code,
            deleteAfter: true
        })
    
        const response = await fetch(`${URL}/api/email/verify`, {
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: reqBody
        })
        
        if (!response.ok) return false

        const resBody = await response.json()

        if (resBody.success) return true

        return false
    } catch (error) {
        throw error
    }
}
async function sendWelcomeEmail(recipient: string) {
    const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL!
    const SUPPORT_EMAIL_PASSWORD = process.env.VERIFICATION_EMAIL_PASSWORD!

    try {
        const mailTransport = nodemailer.createTransport({
            host: 'smtppro.zoho.eu',
            port: 465,
            secure: true,
            auth: {
                user: SUPPORT_EMAIL,
                pass: SUPPORT_EMAIL_PASSWORD,
            },
        })
    
        const email = getWelcomeEmail()

        const mailOptions = {
            from: {
                name: 'Furoku welcome',
                address: SUPPORT_EMAIL
            },
            to: recipient,
            subject: 'Добро пожаловать',
            html: email,
        }
    
        await mailTransport.sendMail(mailOptions)
    } catch (error) {
        return null
    }
}

function getWelcomeEmail() {
    return (
        `
            <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <html>
                <head>
                    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Welcome</title>
                    
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    
                    <style>
                        @media (prefers-color-scheme: light) {
                            div {
                                background-color: #EDDCEC;
                            }
                            p {
                                color: #50444D;
                            }
                        }
                        @media (prefers-color-scheme: dark) {
                            div {
                                background-color: #5D4C5C;
                            }
                            p {
                                color: #DFD7DD
                            }
                        }
                    </style>
                </head>
                <body>
                    <div style="max-width: 600px;width: fit-content;padding: 20px 30px 20px 30px;margin: 0 auto 0 auto;background-color: #EDDCEC;">
                        <table style="width: 100%;">
                            <tr>
                                <td align="center">
                                    <img src="https://i.postimg.cc/XYwkgYpN/furoku.png" alt="furoku logo" border="0">
                                </td>
                            </tr>
                        </table>
                        <p style="font-family: &quot;Alegreya Sans&quot;, sans-serif;font-size: 17px;color: #50444D;">Регистрация прошла успешно. Теперь вы можете сохранять иероглифы и проходить тестирование.</p>
                        <p style="font-family: &quot;Alegreya Sans&quot;, sans-serif;font-size: 17px;color: #50444D;">Если появятся какие-то вопросы по использованию сайта, или вы хотели бы что-то предложить для его улучшения — пишите по этому же адресу: support@furoku.ru</p>
                        <p style="font-family: &quot;Alegreya Sans&quot;, sans-serif;font-size: 17px;color: #50444D;">С уважением,<br>furoku support</p>
                    </div>
                </body>
            </html>
        `
    )
}