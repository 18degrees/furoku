import { ICodeDoc, codeInfoType } from "@/app/interfaces/code.interface"
import { EMAIL_PATTERN } from "@/app/patterns/auth"
import { NextRequest } from "next/server"
import nodemailer from 'nodemailer'
import nano from "nano"

interface IRequestBody {
    email: any
}

const VERIFICATION_EMAIL = process.env.VERIFICATION_EMAIL!
const VERIFICATION_EMAIL_PASSWORD = process.env.VERIFICATION_EMAIL_PASSWORD!

const DB_URI = process.env.COUCHDB_URI!

const MINUTE_MS = 1000 * 60

const MINUTES_TO_EXPIRE = 5

const EXPIRES_IN = MINUTE_MS * MINUTES_TO_EXPIRE

const SEND_COOLDOWN_MS = MINUTE_MS


export async function POST(req: NextRequest) {
    try {
        const body: IRequestBody = await req.json()
        
        const email = typeof body?.email === 'string' ? body.email.trim() : null

        if (!email || !email.match(EMAIL_PATTERN)) throw new Error('Неверная почта')

        const nanoServer = nano(DB_URI)
        
        const usersDB = nanoServer.db.use('users')
        
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
            
        const code = getCode()

        await saveCode(code, email)

        await sendEmail(code, email)

        return Response.json({
            message: 'Код для верификации отправлен',
            applicableFor: 'alert',
            success: true
        }, {status: 200})
        
    } catch (error) {
        return Response.json({
            message: "Ошибка сервера",
        }, {status: 500})
    }
}

function getCode() {
    let code = ''

    for (let i = 0; i < 5; i++) {
        const number = Math.trunc(Math.random() * 10)

        code+= number
    }

    return code
}

async function saveCode(code: string, email: string) {
    try {
        const expires = Date.now() + EXPIRES_IN
        const codes: [codeInfoType] = [{code, expires}]

        const nanoServer = nano(DB_URI)
        const codesDB = nanoServer.db.use('email_verification')

        /*
            Для подстверждения почты можно ввести не только последний отправленный код, 
            но и предыдущие, если их срок действия не истёк.
            Это сделано на случай, если сообщение было досталвно с задержкой, и пользователь успел отправить ещё несколько кодов подтверждения
         */

        const prevCodesDoc = await getPreviousSentCodesDocument(codesDB, email)
        
        // Чтобы не скапливались, удаляем нерелевантные коды
        
        if (prevCodesDoc) {
            const prevCodes = prevCodesDoc.codes
            
            prevCodes.forEach((prevCodeInfo, index) => {
                /*
                    Так как первый элемент массива - последний добавленный код, 
                    по нему можно судить о времени предыдущего отправленного сообщения.
                    Отправка отменяется, если не прошло достаточно времени    
                */

                if (index === 0) {
                    if (!isItTimeToSendEmail(prevCodeInfo.expires)) {
                        throw new Error('Для отправки следующего кода прошло недостаточно времени')
                    }   
                }

                if (!isCodeExpired(prevCodeInfo.expires)) {
                    codes.push(prevCodeInfo)
                }
            })
        }

        const newCodeDoc: ICodeDoc = {
            _rev: prevCodesDoc?._rev,       // Если предыдущая версия есть - добавляем её _rev
            _id: email,
            codes,
        }

        await codesDB.insert(newCodeDoc)
        
    } catch (error) {
        console.log(error)

        throw new Error('Ошбика при сохранении верификационного кода')
    }
}
async function getPreviousSentCodesDocument(codesDB: nano.DocumentScope<unknown>, email: string): Promise<ICodeDoc | undefined> {
    try {
        const codesDoc = await codesDB.get(email) as ICodeDoc

        return codesDoc
    } catch (error) {
        return undefined
    }
}
function isItTimeToSendEmail(expireTime: number) {
    const sendingTime = expireTime - EXPIRES_IN

    return Date.now() - sendingTime > SEND_COOLDOWN_MS
}
function isCodeExpired(expireTime: number) {
    return Date.now() > expireTime
}
async function sendEmail(code: string, recipient: string) {
    try {
        const mailTransport = nodemailer.createTransport({
            host: 'smtp.zoho.eu',
            port: 465,
            secure: true,
            auth: {
                user: VERIFICATION_EMAIL,
                pass: VERIFICATION_EMAIL_PASSWORD,
            },
        })
    
        const message = getVerificationEmail(code)

        const mailOptions = {
            from: {
                name: 'Furoku verification',
                address: VERIFICATION_EMAIL
            },
            to: recipient,
            subject: 'Подтверждение почты',
            html: message,
        }
    
        await mailTransport.sendMail(mailOptions)

    } catch (error) {
        console.log(error)

        throw new Error("Ошибка при отправке кода верификации")
    }
}

function getVerificationEmail(code: string) {
    return (
        `
            <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <html>
                <head>
                    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Verification</title>
                    
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    
                    <style>
                        @media (prefers-color-scheme: light) {
                            div {
                                background-color: #fffaff;
                            }
                            p {
                                color: #625961;
                            }
                        }
                        @media (prefers-color-scheme: dark) {
                            div {
                                background-color: #564555;
                            }
                            p {
                                color: #ede5eb
                            }
                        }
                    </style>
                </head>
                <body>
                    <div style="padding: 10px 30px 10px 30px;background-color: #fffaff;width: fit-content;max-width: 400px;border: 1px solid #ece5ed;">
                        <table style="width: 100%;">
                            <tr>
                                <td>
                                    <img src="http://postimg.su/image/Ik9UvBVY/furoku.png" alt="furoku logo" border="0">
                                </td>
                            </tr>
                        </table>
                        <p style="font-family: &quot;Alegreya Sans&quot;, sans-serif;font-size: 16px;color: #625961;line-height: 22px">Для продолжения регистрации введите: ${code}</p>
                        <p style="font-family: &quot;Alegreya Sans&quot;, sans-serif;font-size: 16px;color: #625961;line-height: 22px">Код действует 5 минут*</p>
                    </div>
                </body>
            </html>
        `
    )
}