import { ISearchKanji } from '@/app/interfaces/kanji.interface'
import { IUserDoc } from '@/app/interfaces/user.interface'
import getUser from '../../auxiliaries/getUser'
import { NextRequest } from "next/server"
import type { Document } from 'nano'
import nano from 'nano'
import { level, sortMethod } from '@/app/interfaces/search.interface'

interface IKanjiView {
    id: string 
    key: string 
    value: string 
    doc?: Document | undefined
    added?: boolean 
}

const DB_URI = process.env.COUCHDB_URI!

const PAGES_ANALYZED = +process.env.PAGES_ANALYZED!         //количество проанализированных страниц, разделив на которые получаем относительную частоту появления иероглифа

const KANJI_AMOUNT_PER_PAGE = +process.env.NEXT_PUBLIC_KANJI_PER_PAGE!

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams

    try {
        const roughLevel = searchParams.get('level')
        const pageRough = searchParams.get('page')
        const roughText = searchParams.get('text')
        const roughIncludeLearnt = searchParams.get('includeLearnt')
        const roughSortMethod = searchParams.get('by')
    
        const searchedkanjiArr = getAcceptableText(roughText)
        const sortMethod = getAcceptableSortMethod(roughSortMethod)
        const level = getAcceptableLevel(roughLevel, sortMethod) !== 'all' ? +getAcceptableLevel(roughLevel, sortMethod) : 'all'
        const range = sortMethod === 'wiki' || sortMethod === 'mainichi' ? getRange(level) : undefined
        const page = searchedkanjiArr ? 1 : getAcceptablePage(pageRough)
        const includeLearnt = getAcceptableIncludeLeant(roughIncludeLearnt)

        const nanoServer = nano(DB_URI)
    
        const kanjiDB = nanoServer.db.use('kanji')

        const dbResponse = await kanjiDB.view(sortMethod, searchedkanjiArr ? 'byWriting' : 'byNumber', {
            keys: searchedkanjiArr ? searchedkanjiArr : (level != 'all' && (sortMethod === 'jlpt' || sortMethod === 'grade')) ? [level] : undefined,
            descending: (sortMethod === 'wiki' || sortMethod === 'jlpt') ? true : false,
            skip: range?.from,
            limit: range?.amount ?? 100000,
        })
        
        const kanjis = dbResponse.rows as IKanjiView[]
        const totalRelevantAmount = kanjis.length

        if (totalRelevantAmount === 0) throw new Error()

        const {preparedKanjis, totalRelevantKanjis} = await getPreparedKanjis(kanjis, {
            page,
            sortMethod,
            includeLearnt,
            searchFrom: searchedkanjiArr ? 'writing' : 'number'                          //если что-то пришло в input type=text, ищутся именно они; тогда разделение на уровни не учитывается
        })

        return Response.json(
            {
                kanjis: preparedKanjis,
                totalAmount: totalRelevantKanjis
            }, 
            {status: 200}
        )

    } catch (error: unknown) {
        console.log(error)
        
        return Response.json(
            {message: "Ошибка сервера"},
            {status: 500}
        )
    }
}
function getAcceptableLevel(roughLevel: string | null, sortMethod: sortMethod): string {
    if (!roughLevel || roughLevel === 'all' || sortMethod === 'stroke') return 'all'

    if (sortMethod === 'grade' && (roughLevel === '9' || roughLevel === '8' || roughLevel === '7' || roughLevel === '6')) {
        return roughLevel
    }
    if ((roughLevel === '1' || roughLevel === '2' || roughLevel === '3' || roughLevel === '4' || roughLevel === '5')) {
        return roughLevel
    }
    return 'all'
}
function getAcceptableText(roughText: any): string[] | undefined {
    const onlyKanjiRegExp = /\p{Script=Han}+/ug

    if (typeof roughText !== 'string') return undefined

    const text = roughText.trim()

    const kanjisArr = text.match(onlyKanjiRegExp)?.join('').split('')

    return kanjisArr ? kanjisArr : undefined
}
function getAcceptableSortMethod(roughSortMethod: any): sortMethod {
    switch (roughSortMethod) {
        case 'jlpt':
        case 'stroke':
        case 'mainichi':
        case 'grade':
        case 'wiki':
            return roughSortMethod
        default:
            return 'jlpt'
    }
}
function getRange(level: any) {
    switch (level) {
        case 5:
            return {from: 0, amount: 100}
        
        case 4: 
            return {from: 100, amount: 200}
        
        case 3:
            return {from: 300, amount: 300}

        case 2: 
            return {from: 600, amount: 400}

        case 1:
            return {from: 1000, amount: 30000}

        default:
            return {from: 0, amount: 30000}
    }
}

function getAcceptablePage(pageRough: any): number {
    const page = typeof pageRough === 'string' ? pageRough : '1'

    const nonNumberRegExp = /\D/

    const isItNumber = !(nonNumberRegExp.test(page))

    return isItNumber ? +page : 1 
}

function getAcceptableIncludeLeant(roughIncludeLearnt: any): boolean {
    return (roughIncludeLearnt === 'true' || roughIncludeLearnt === '1') ? true : false
}

interface IPrepParams {
    page: number
    includeLearnt: boolean
    searchFrom: 'number' | 'writing'
    sortMethod: sortMethod
}

async function getPreparedKanjis(roughKanjis: IKanjiView[], {page, includeLearnt, searchFrom, sortMethod}: IPrepParams) {
    let kanjis = searchFrom === 'writing' ? transformKanjiForPreparation(roughKanjis): roughKanjis

    kanjis = await getKanjisWithOwnerInfo(kanjis, includeLearnt)           //чтобы раздличать, какие были добавлены в профиль, какие нет

    const totalRelevantKanjis = kanjis.length

    kanjis = cutKanjisForPage(kanjis, page)

    let briefKanjis = getBriefKanjis(kanjis)

    briefKanjis = searchFrom === 'writing' ? sortKanjis(briefKanjis) : briefKanjis        //отедльная сортировка по частоте для 'byWriting' требуется, так как при поиске 'byFrequency' она автоматически сортировалась nano, здесь же - нет

    const preparedKanjis = sortMethod === 'wiki' ? makeFrequencyRelative(briefKanjis) : briefKanjis

    return {preparedKanjis, totalRelevantKanjis}

}

function transformKanjiForPreparation(kanjisByWriting: IKanjiView[]): IKanjiView[] {
    return kanjisByWriting.map(kanji => {
        return {
            ...kanji,
            key: kanji.value,
            value: kanji.key
        }
    })
}
function cutKanjisForPage(kanjis: IKanjiView[], page: number) {
    const prevPage = page - 1

    const fromIndex = page === 1 ? 0 : (prevPage * KANJI_AMOUNT_PER_PAGE)
    const toIndex = fromIndex + (KANJI_AMOUNT_PER_PAGE - 1)

    const slicedKanjis = kanjis.slice(fromIndex, toIndex + 1) //+1, поскольку последний не включён

    return slicedKanjis
}
async function getKanjisWithOwnerInfo(kanjisGlobal: IKanjiView[], includeLearnt: boolean) {
    try {
        const nanoServer = nano(DB_URI)
        const usersDB: nano.DocumentScope<IUserDoc> = nanoServer.db.use('users')

        const user = await getUser(usersDB)
        
        if (!user) return kanjisGlobal
        
        const email = user.email

        const userWKanjisView = await usersDB.view('others', 'just_kanji', {
            key: email
        })

        const usersKanjisAmount = userWKanjisView.total_rows

        if (usersKanjisAmount === 0) return kanjisGlobal

        const usersKanjis = userWKanjisView.rows

        const updKanjis: IKanjiView[] = [];

        kanjisGlobal.forEach(globalKanjiObj => {
            const writingOfGlobal = globalKanjiObj.value

            let isUserHave = false

            usersKanjis.forEach(usersKanjiObj => {
                const writingOfUser = usersKanjiObj.value

                if (writingOfGlobal === writingOfUser) isUserHave = true
            })
            if (!(!includeLearnt && isUserHave)) {
                updKanjis.push({
                    ...globalKanjiObj,
                    added: isUserHave
                })
            }

        })
        return updKanjis
        
    } catch (error) {
        return kanjisGlobal
    }
}
function getBriefKanjis(kanjis: IKanjiView[]): ISearchKanji[] {
    return kanjis.map(kanjiObj => {
        return {
            id: kanjiObj.id,
            index: kanjiObj.key,
            writing: kanjiObj.value,
            added: kanjiObj.added ? true : false
        }
    })
}
function makeFrequencyRelative(kanjis: ISearchKanji[]): ISearchKanji[] {
    return kanjis.map((kanjiObj) => {
        const relativeFriquency = (+kanjiObj.index / PAGES_ANALYZED).toFixed(4)

        return {
            ...kanjiObj,
            index: relativeFriquency,
        }
    })
}
function sortKanjis(kanjis: ISearchKanji[]) {
    return kanjis.sort((a, b) => {
        return +b.index - +a.index
    })
}