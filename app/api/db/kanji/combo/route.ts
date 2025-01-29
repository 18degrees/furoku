import { IUserDoc } from '@/app/interfaces/user.interface'
import getUser from '../../../auxiliaries/getUser'
import { NextRequest } from "next/server"
import type { Document } from 'nano'
import nano from 'nano'
import { filterMethod, level, sortMethod } from '@/app/interfaces/search.interface'
import { IDBComboKanji, ISearchComboKanji } from '@/app/interfaces/combo-kanji.interface'

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


interface IComboKanjiWithFilterView {
    variants: [{
        writing: string
        readings: [string]
    }]
    jlpt?: number
    grade?: number
    wiki: number
    meanings: [string]
}
interface IComboKanjiWithoutFilterView {
    variants: [{
        writing: string
        readings: [string]
    }]
    wiki: number
    meanings: [string]
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
        const roughIncludeLearntCombo = searchParams.get('includeLearntCombo')
        const roughOnlyLearntKanji = searchParams.get('onlyLearntKanji')
        const roughFilterMethod = searchParams.get('filter')
    
        const searchedComboArr = getAcceptableText(roughText)
        const filterMethod = getAcceptableFilterMethod(roughFilterMethod)
        const level = getAcceptableLevel(roughLevel, filterMethod)
        
        const page = getAcceptablePage(pageRough)
        const includeLearntCombo = getAcceptableBooleanValue(roughIncludeLearntCombo)
        const onlyLearntKanji = getAcceptableBooleanValue(roughOnlyLearntKanji)

        const nanoServer = nano(DB_URI)
    
        const kanjiDB: nano.DocumentScope<IDBComboKanji> = nanoServer.db.use('combo-kanji')

        const searchMethod = searchedComboArr ? 'byWriting' : 'byNumber'

        const filteredCombos = filterMethod ? (
            await kanjiDB.view<IComboKanjiWithFilterView>(filterMethod, searchMethod === 'byWriting' ? 'byWritingPrimePerKanji' : searchMethod, {
                keys: searchMethod === 'byWriting' ? searchedComboArr : level === 'all' ? undefined : [+level],
                limit: 100000
            })).rows :
            (await kanjiDB.view<IComboKanjiWithoutFilterView>('wiki', searchMethod === 'byWriting' ? 'byWritingPrimePerKanji' : searchMethod, {
                keys: searchMethod === 'byWriting' ? searchedComboArr : undefined,
                descending: true,
                limit: 100000
            })).rows
        
        const totalRelevantAmount = filteredCombos.length

        if (totalRelevantAmount === 0) throw new Error()

        const {preparedCombos, totalRelevantCombos} = await getPreparedCombos({
            combos: filteredCombos,
            page,
            filterMethod,
            includeLearntCombo,
            onlyLearntKanji,
            level,
            searchMethod,                          //если что-то пришло в input type=text, ищутся именно они; тогда разделение на уровни не учитывается
            searchedComboArr
        })

        return Response.json(
            {
                combos: preparedCombos,
                totalAmount: totalRelevantCombos
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
    // const onlyJPComboRegExp = /\p{Script=Han}+|\p{Script=Hira}+|\p{Script=Kana}+/ug
    // const spacesRegExp = /[ 　]/g 

    // if (typeof roughText !== 'string') return undefined

    // const text = roughText.trim()

    // const wordsArr = text.split(spacesRegExp)

    // const resultArr = wordsArr?.map(word => word.match(onlyJPComboRegExp)?.join(''))

    // if (!resultArr) return undefined

    // const combosArr = []

    // for (const combo of resultArr) {
    //     if (combo) combosArr.push(combo)
    // }

    // return combosArr[0] ? combosArr : undefined

    if (typeof roughText !== 'string') return undefined

    const text = roughText.trim()

    const symbolsArr = Array.from(text)

    return symbolsArr[0] ? symbolsArr : undefined
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

function getAcceptablePage(pageRough: any): number {
    const page = typeof pageRough === 'string' ? pageRough : '1'

    const nonNumberRegExp = /\D/

    const isItNumber = !(nonNumberRegExp.test(page))

    return isItNumber ? +page : 1 
}

function getAcceptableBooleanValue(value: any) {
    return (value === 'true' || value === '1') ? true : false
}

interface IPrepParams {
    combos: {
        id: string;
        key: string;
        value: IComboKanjiWithFilterView;
        doc?: (IDBComboKanji & Document) | undefined;
    }[]
    page: number
    includeLearntCombo: boolean
    onlyLearntKanji: boolean
    searchMethod: 'byNumber' | 'byWriting'
    filterMethod: filterMethod
    level: level,
    searchedComboArr: string[] | undefined
}

async function getPreparedCombos(params: IPrepParams) {
    const appropriateCombos = getAppropriateCombos(params)
    
    const combosWithOwnerInfo = await getCombosWithOwnerInfo(appropriateCombos, params.includeLearntCombo)           //чтобы раздличать, какие были добавлены в профиль, какие нет
    
    const selectedCombos = params.onlyLearntKanji ? await getOnlyLearntKanjis(combosWithOwnerInfo) : undefined

    const totalRelevantCombos = selectedCombos ? selectedCombos.length : combosWithOwnerInfo.length

    const sortedCombos = params.searchMethod === 'byWriting' || params.filterMethod ? sortCombos(selectedCombos ? selectedCombos : combosWithOwnerInfo, true, params.searchedComboArr) : selectedCombos ? selectedCombos : combosWithOwnerInfo        //отдельная сортировка по частоте для 'byWriting' требуется, так как при поиске 'byNumber' она автоматически сортировалась nano, здесь же - нет
    
    const cutCombos = cutKanjisForPage(sortedCombos, params.page)
    
    const preparedCombos = makeFrequencyRelative(cutCombos)

    return {preparedCombos, totalRelevantCombos}

}
interface IAppropriateComboObj {
    id: string
    variants: [{
        writing: string
        readings: [string]
    }]
    meanings: [string]
    index: {
        filter?: number
        sort: number
    }
}
interface IAppropriateProps {
    combos: {
        id: string;
        key: string | number;
        value: IComboKanjiWithFilterView;
        doc?: (IDBComboKanji & Document) | undefined;
    }[]
    filterMethod: filterMethod
    searchMethod: searchMethod
}
function getAppropriateCombos({combos, filterMethod, searchMethod}: IAppropriateProps): IAppropriateComboObj[] {
    let appropriateCombos: IAppropriateComboObj[] = []

    combos.forEach(comboObj => {
        const filterIndex = searchMethod === 'byNumber' && filterMethod ? Number(comboObj.key) : filterMethod ? comboObj.value[filterMethod] : undefined
        const sortIndex = filterMethod || searchMethod === 'byWriting' ? comboObj.value['wiki'] : Number(comboObj.key)

        appropriateCombos.push({
            id: comboObj.id,
            variants: comboObj.value.variants,
            meanings: comboObj.value.meanings,
            index: {
                filter: filterIndex,
                sort: sortIndex
            }
        })
    })
    if (searchMethod === 'byWriting') appropriateCombos = deleteCopies(appropriateCombos)
    
    return appropriateCombos
}
function deleteCopies(appropriateCombos: IAppropriateComboObj[]): IAppropriateComboObj[] {
    const nonCopyArr:IAppropriateComboObj[] = []

    appropriateCombos.forEach(comboObj => {
        if (!nonCopyArr.find(nonCopyComboObj => nonCopyComboObj.id === comboObj.id)) {
            nonCopyArr.push(comboObj)
        }
    })
    return nonCopyArr
}
function cutKanjisForPage(combos: ISearchComboKanji[], page: number) {
    const prevPage = page - 1

    const fromIndex = page === 1 ? 0 : (prevPage * KANJI_AMOUNT_PER_PAGE)
    const toIndex = fromIndex + (KANJI_AMOUNT_PER_PAGE - 1)

    const slicedKanjis = combos.slice(fromIndex, toIndex + 1) //+1, поскольку последний не включён

    return slicedKanjis
}

async function getCombosWithOwnerInfo(combosGlobal: IAppropriateComboObj[], includeLearnt: boolean): Promise<ISearchComboKanji[]> {
    try {
        const nanoServer = nano(DB_URI)
        const usersDB: nano.DocumentScope<IUserDoc> = nanoServer.db.use('users')

        const user = await getUser(usersDB)
        
        if (!user) return combosGlobal.map(comboObj => {
            return {
                ...comboObj,
                added: false
            }
        })
        
        const email = user.email

        const userWCombosView = await usersDB.view('others', 'just_combo', {
            key: email
        })

        const usersCombosAmount = userWCombosView.total_rows

        if (usersCombosAmount === 0) return combosGlobal.map(comboObj => {
            return {
                ...comboObj,
                added: false
            }
        })

        const usersCombos = userWCombosView.rows

        const updCombos: ISearchComboKanji[] = [];

        combosGlobal.forEach(globalComboObj => {
            const idOfGlobal = globalComboObj.id

            let isUserHave = false

            usersCombos.forEach(usersComboObj => {
                const idOfUser = usersComboObj.value

                if (idOfGlobal === idOfUser) isUserHave = true
            })
            if (!(!includeLearnt && isUserHave)) {
                updCombos.push({
                    ...globalComboObj,
                    added: isUserHave
                })
            }

        })
        return updCombos
        
    } catch (error) {
        return combosGlobal.map(comboObj => {
            return {
                ...comboObj,
                added: false
            }
        })
    }
}
function makeFrequencyRelative(combos: ISearchComboKanji[]): ISearchComboKanji[] {
    return combos.map((comboObj) => {
        const numbAfterDot = 4

        const relativeFriquency = +(comboObj.index.sort / PAGES_ANALYZED).toFixed(numbAfterDot)

        return {
            ...comboObj,
            index: {
                ...comboObj.index,
                sort: relativeFriquency
            }
        }
    })
}

async function getOnlyLearntKanjis(combos: ISearchComboKanji[]) {
    try {
        const nanoServer = nano(DB_URI)
        const usersDB: nano.DocumentScope<IUserDoc> = nanoServer.db.use('users')

        const user = await getUser(usersDB)
        
        if (!user) return combos

        const userskanjis = user.kanjis?.map(comboObj => comboObj.writing)

        if (!userskanjis || !userskanjis[0]) return combos

        const onlyKanjiRegExp = /\p{Script=Han}/ug

        const onlyLearntKanjiCombos: ISearchComboKanji[] = []
        
        for (const comboObj of combos) {
            const primeWritingKanjis = comboObj.variants[0].writing.match(onlyKanjiRegExp)

            if (!primeWritingKanjis) continue

            let isComboSuite = true

            for (const writing of primeWritingKanjis) {
                const isKanjiFound = userskanjis.find(usersKanji => usersKanji === writing)

                if (!isKanjiFound) {
                    isComboSuite = false
                    break
                }
            }
            if (isComboSuite) onlyLearntKanjiCombos.push(comboObj)
        }
        return onlyLearntKanjiCombos

    } catch (error) {
        return combos
    }
}
interface comboWithMatchedKanjis {
    id: string
    matchedInARow: number
    matchedTotal: number
    index: {
        sort: number
    }
    length: number
}
function sortCombos(combos: ISearchComboKanji[], descending: boolean, searchedComboArr: string[] | undefined) {
    const idsWithMatchInfo = searchedComboArr ? getSortedMatchInfo(combos, searchedComboArr) : undefined

    const combosWithKnownSort: ISearchComboKanji[] = [...combos]

    if (idsWithMatchInfo) {
        idsWithMatchInfo.sort((a, b) => {
            if (a.matchedInARow !== b.matchedInARow) return b.matchedInARow - a.matchedInARow

            if (a.matchedTotal !== b.matchedTotal) return b.matchedTotal - a.matchedTotal

            if (a.length !== b.length) return a.length - b.length

            return descending ? b.index.sort - a.index.sort : a.index.sort - b.index.sort
        })
        combosWithKnownSort.sort((a, b) => {
            const posA = idsWithMatchInfo.findIndex(idsWithMatchInfoObj => idsWithMatchInfoObj.id === a.id)
            const posB = idsWithMatchInfo.findIndex(idsWithMatchInfoObj => idsWithMatchInfoObj.id === b.id)

            return posA - posB
        })

    } else {
        combosWithKnownSort.sort((a, b) => descending ? b.index.sort - a.index.sort : a.index.sort - b.index.sort)
    }
    return combosWithKnownSort
}

function getSortedMatchInfo(combos: ISearchComboKanji[], searchedComboArr: string[]): comboWithMatchedKanjis[] {
    const searchedStr = searchedComboArr.join('')
    const searchedKanjiCountRegExp = new RegExp(searchedComboArr.join('|'), 'g')

    const comboWithMatchedKanjis: comboWithMatchedKanjis[] = combos.map(comboObj => {
        const id = comboObj.id
        const sortIndex = comboObj.index.sort
        const primeWriting = comboObj.variants[0].writing

        const matchedArr = primeWriting.match(searchedKanjiCountRegExp)
        const kanjiMatchCount = matchedArr ? new Set(matchedArr).size : 0   //set для исключения одинаковых иероглифов в слове
        
        const writingLength = Array.from(primeWriting).length
        let kanjiMaxMatchInARowCount = 0

        for (let start = 0; start < writingLength - 1; start++) {
            for (let end = writingLength; end > 0; end--) {
                const searchedStrSlice = searchedStr.slice(start, end)

                const isMatched = primeWriting.includes(searchedStrSlice)

                if (isMatched) {
                    const matchLength = searchedStrSlice.length

                    if (kanjiMaxMatchInARowCount < matchLength) kanjiMaxMatchInARowCount = matchLength
                }
            }
        }
        return {
            id,
            index: {
                sort: sortIndex
            },
            matchedTotal: kanjiMatchCount,
            matchedInARow: kanjiMaxMatchInARowCount,
            length: writingLength
        }
    })
    return comboWithMatchedKanjis
}