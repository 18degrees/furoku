import { ICodeDoc } from "@/app/interfaces/code.interface"
import { EMAIL_PATTERN } from "@/app/patterns/auth"
import { NextRequest } from "next/server"
import nano from "nano"

interface IRequestBody {
    email: any
    code: any
    deleteAfter: any

    /*
        Запрос сюда для проверки кода делается в двух случаях:
        1) При предварительной проверке - когда нажимается кнопка "проверить" во время регистрации
        2) После ввода всех данных - при нажитии кнопки "зарегистрироваться"
        Если данные введены верно и пользователь создан - удаляем коды регистрации
    */
}

const DB_URI = process.env.COUCHDB_URI!

export async function POST(req: NextRequest) {
    try {
        const body: IRequestBody = await req.json()
    
        const email = typeof body?.email === 'string' ? body.email.trim() : null
    
        if (!email || !email.match(EMAIL_PATTERN)) throw new Error('Неверная почта')
    
        const code = typeof body?.code === 'string' ? body.code.trim() : null
    
        if (!code) throw new Error('Отсутствует код')
            
        const isCodeValid = await checkIsCodeValid(email, code)

        if (!isCodeValid) return Response.json({
            message: 'Код неверен. Возможно, он устарел',
            applicableFor: 'notification',
            success: false
        })

        if (body.deleteAfter) await deleteCodes(email)

        return Response.json({
            message: 'Почта подтверждена',
            success: true
        }, {status: 200})

        } catch (error) {
            console.log(error)
            return Response.json({
                message: "Ошибка сервера",
            }, {status: 500})
        }
        
    async function checkIsCodeValid(email: string, codeToCheck: string) {
        const nanoServer = nano(DB_URI)
        const codesDB = nanoServer.db.use('email_verification')

        const codesDoc = await codesDB.get(email) as ICodeDoc

        const savedCodes = codesDoc.codes
        
        for (const {code: savedCode, expires} of savedCodes) {
            if (savedCode === codeToCheck) {
                if (!isCodeExpired(expires)) {
                    return true
                }
            }
        }
        return false
    }
    
    function isCodeExpired(expireTime: number) {
        return Date.now() > expireTime
    }

    async function deleteCodes(email: string) {
        try {
            const nanoServer = nano(DB_URI)
            const codesDB = nanoServer.db.use('email_verification')
    
            const codesDoc = await codesDB.get(email) as ICodeDoc

            if (codesDoc._rev) codesDB.destroy(email, codesDoc._rev)
            
        } catch (error) {
            return
        }
    }
}