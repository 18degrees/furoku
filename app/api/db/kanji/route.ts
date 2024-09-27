import { IDBKanji, ISearchKanji } from '@/app/interfaces/kanji.interface'
import { IUserDoc } from '@/app/interfaces/user.interface'
import getUser from '../../auxiliaries/getUser'
import { NextRequest } from "next/server"
import type { Document } from 'nano'
import nano from 'nano'
import { filterMethod, level, sortMethod } from '@/app/interfaces/search.interface'

interface IKanjiView {
    id: string 
    key: string 
    value: string 
    doc?: Document | undefined
    added?: boolean 
}

interface IKanjiWithFilterView {
    stroke: number
    wiki?: number
    mainichi?: number
    jlpt?: number
    grade?: number
}
interface IKanjiWithoutFilterView {
    stroke: number
    wiki?: number
    mainichi?: number
}

type searchMethod = 'byWriting' | 'byNumber'

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
        const roughFilterMethod = searchParams.get('filter')
        const roughSortMethod = searchParams.get('sort')
    
        const searchedkanjiArr = getAcceptableText(roughText)
        const filterMethod = getAcceptableFilterMethod(roughFilterMethod)
        const sortMethod = getAcceptableSortMethod(roughSortMethod)
        const level = getAcceptableLevel(roughLevel, filterMethod)
        const range = sortMethod === 'wiki' || sortMethod === 'mainichi' ? getRange(level) : undefined
        const page = searchedkanjiArr ? 1 : getAcceptablePage(pageRough)
        const includeLearnt = getAcceptableIncludeLeant(roughIncludeLearnt)

        const nanoServer = nano(DB_URI)
    
        const kanjiDB: nano.DocumentScope<IDBKanji> = nanoServer.db.use('kanji')

        const searchMethod = searchedkanjiArr ? 'byWriting' : 'byNumber'

        const filteredKanjis = filterMethod ? (
            await kanjiDB.view<IKanjiWithFilterView>(filterMethod, searchMethod, {
                keys: searchMethod === 'byWriting' ? searchedkanjiArr : level === 'all' ? undefined : [+level],
                limit: 100000
            })).rows :
            (await kanjiDB.view<IKanjiWithoutFilterView>(sortMethod, searchMethod, {
                keys: searchMethod === 'byWriting' ? searchedkanjiArr : undefined,
                descending: sortMethod === 'wiki' ? true : false,
                limit: 100000
            })).rows
        
        const totalRelevantAmount = filteredKanjis.length

        if (totalRelevantAmount === 0) throw new Error()

        const {preparedKanjis, totalRelevantKanjis} = await getPreparedKanjis({
            kanjis: filteredKanjis,
            page,
            sortMethod,
            filterMethod,
            includeLearnt,
            level,
            searchMethod                          //если что-то пришло в input type=text, ищутся именно они; тогда разделение на уровни не учитывается
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
function getAcceptableLevel(roughLevel: string | null, filterMethod: filterMethod): level {
    if (!roughLevel || roughLevel === 'all') return 'all'

    if (filterMethod === 'grade' && (roughLevel === '9' || roughLevel === '8' || roughLevel === '7' || roughLevel === '6')) {
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
function getAcceptableFilterMethod(roughFilterMethod: any): filterMethod {
    switch (roughFilterMethod) {
        case 'jlpt':
        case 'grade':
        case '':
            return roughFilterMethod
        default:
            return ''
    }
}
function getAcceptableSortMethod(roughSortMethod: any): sortMethod {
    switch (roughSortMethod) {
        case 'stroke':
        case 'mainichi':
        case 'wiki':
            return roughSortMethod
        default:
            return 'wiki'
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
    kanjis: {
        id: string;
        key: string;
        value: IKanjiWithFilterView;
        doc?: (IDBKanji & Document) | undefined;
    }[]
    page: number
    includeLearnt: boolean
    searchMethod: 'byNumber' | 'byWriting'
    sortMethod: sortMethod
    filterMethod: filterMethod
    level: level
}

async function getPreparedKanjis(params: IPrepParams) {

    const appropriateKanjis = getAppropriateKanjis(params)
    
    const kanjisWithOwnerInfo = await getKanjisWithOwnerInfo(appropriateKanjis, params.includeLearnt)           //чтобы раздличать, какие были добавлены в профиль, какие нет
    
    const totalRelevantKanjis = kanjisWithOwnerInfo.length
    
    // let briefKanjis = getBriefKanjis(kanjis)
    const sortedKanjis = params.searchMethod === 'byWriting' || params.filterMethod ? sortKanjis(kanjisWithOwnerInfo, params.sortMethod === 'wiki') : kanjisWithOwnerInfo        //отедльная сортировка по частоте для 'byWriting' требуется, так как при поиске 'byFrequency' она автоматически сортировалась nano, здесь же - нет
    
    const cutKanjis = cutKanjisForPage(sortedKanjis, params.page)
    
    const preparedKanjis = params.sortMethod === 'wiki' ? makeFrequencyRelative(cutKanjis) : cutKanjis

    return {preparedKanjis, totalRelevantKanjis}

}
interface IAppropriateKanjiObj {
    id: string
    writing: string
    index: {
        filter?: number
        sort?: number
    }
}
interface IAppropriateProps {
    kanjis: {
        id: string;
        key: string | number;
        value: IKanjiWithFilterView;
        doc?: (IDBKanji & Document) | undefined;
    }[]
    filterMethod: filterMethod
    sortMethod: sortMethod
    searchMethod: searchMethod
    level: level
}
function getAppropriateKanjis({kanjis, filterMethod, sortMethod, searchMethod, level}: IAppropriateProps): IAppropriateKanjiObj[] {

    return kanjis.map(kanjiObj => {
        const writing = kanjiObj.id

        const filterIndex = searchMethod === 'byNumber' && filterMethod ? Number(kanjiObj.key) : filterMethod ? kanjiObj.value[filterMethod] : undefined
        const sortIndex = filterMethod ? kanjiObj.value[sortMethod] : Number(kanjiObj.key)

        return {
            id: writing,
            writing,
            index: {
                filter: filterIndex,
                sort: sortIndex
            }
        }
    })
    // return kanjisByWriting.map(kanji => {
    //     return {
    //         ...kanji,
    //         key: kanji.value,
    //         value: kanji.key
    //     }
    // })
}
function cutKanjisForPage(kanjis: ISearchKanji[], page: number) {
    const prevPage = page - 1

    const fromIndex = page === 1 ? 0 : (prevPage * KANJI_AMOUNT_PER_PAGE)
    const toIndex = fromIndex + (KANJI_AMOUNT_PER_PAGE - 1)

    const slicedKanjis = kanjis.slice(fromIndex, toIndex + 1) //+1, поскольку последний не включён

    return slicedKanjis
}

async function getKanjisWithOwnerInfo(kanjisGlobal: IAppropriateKanjiObj[], includeLearnt: boolean): Promise<ISearchKanji[]> {
    try {
        const nanoServer = nano(DB_URI)
        const usersDB: nano.DocumentScope<IUserDoc> = nanoServer.db.use('users')

        const user = await getUser(usersDB)
        
        if (!user) return kanjisGlobal.map(kanjiObj => {
            return {
                ...kanjiObj,
                added: false
            }
        })
        
        const email = user.email

        const userWKanjisView = await usersDB.view('others', 'just_kanji', {
            key: email
        })

        const usersKanjisAmount = userWKanjisView.total_rows

        if (usersKanjisAmount === 0) return kanjisGlobal.map(kanjiObj => {
            return {
                ...kanjiObj,
                added: false
            }
        })

        const usersKanjis = userWKanjisView.rows

        const updKanjis: ISearchKanji[] = [];

        kanjisGlobal.forEach(globalKanjiObj => {
            const writingOfGlobal = globalKanjiObj.writing

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
        return kanjisGlobal.map(kanjiObj => {
            return {
                ...kanjiObj,
                added: false
            }
        })
    }
}
// function getBriefKanjis(kanjis: IKanjiView[]): ISearchKanji[] {
//     return kanjis.map(kanjiObj => {
//         return {
//             id: kanjiObj.id,
//             index: kanjiObj.key,
//             writing: kanjiObj.value,
//             added: kanjiObj.added ? true : false
//         }
//     })
// }
function makeFrequencyRelative(kanjis: ISearchKanji[]): ISearchKanji[] {
    return kanjis.map((kanjiObj) => {
        const numbAfterDot = 2

        const relativeFriquency = kanjiObj.index.sort ? +(kanjiObj.index.sort / PAGES_ANALYZED).toFixed(numbAfterDot) : undefined

        return {
            ...kanjiObj,
            index: {
                ...kanjiObj.index,
                sort: relativeFriquency
            }
        }
    })
}
function sortKanjis(kanjis: ISearchKanji[], descending: boolean) {
    const kanjisWithSortUndefiend: ISearchKanji[] = []
    const kanjisWithKnownSort: ISearchKanji[] = []

    for (const kanjiObj of kanjis) {
        kanjiObj.index.sort ? kanjisWithKnownSort.push(kanjiObj) : kanjisWithSortUndefiend.push(kanjiObj)
    }
    kanjisWithKnownSort.sort((a, b) => {
        if (!b.index.sort || !a.index.sort) return 0

        return descending ? b.index.sort - a.index.sort : a.index.sort - b.index.sort
    })

    return [...kanjisWithKnownSort, ...kanjisWithSortUndefiend]
}