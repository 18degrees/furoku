import { IUserDoc, usersCombo, usersKanji } from "@/app/interfaces/user.interface"
import { UnreachablePathError, WrongPathError } from "../../../errors"
import getUser from "../../../auxiliaries/getUser"
import { NextRequest } from "next/server"
import nano from "nano"
import { ITestCombo, IDBComboKanji } from "@/app/interfaces/combo-kanji.interface"

const DB_URI = process.env.COUCHDB_URI!
const PAGES_ANALYZED = +process.env.PAGES_ANALYZED!

const TEST_COOLDOWN_TIME_MS = 1000 * 60 * 60 * 12                       //12 часов

const EXTRA_POINT = 1                                                   
const MAX_EXTRA_POINTS = 3
const MIN_EXTRA_POINTS = -3

const MAX_KNOWLEDGE_POINTS = 10
const MIN_KNOWLEDGE_POINTS = 0

const WELL_POINTS = 2
const MEDIUM_POINTS = 1

interface IComboView {
    id: string
    points: number
    test_timestamp: number
}

interface IComboWithPoints {
    id: string
    points: number
}

type modeType = 'known_writing' | 'known_reading' | 'known_meaning'

export async function GET(req: NextRequest) {
    try {
        const mode = getCorrectMode(req)

        if (!mode) throw new WrongPathError('Неверный путь')

        const nanoServer = nano(DB_URI)
        const usersDB: nano.DocumentScope<IUserDoc> = nanoServer.db.use('users')

        const user = await getUser(usersDB)

        if (!user) return Response.json({
            message: 'Пользователь не авторизован'
        }, {status: 403})

        const combosView: nano.DocumentViewResponse<IComboView, IUserDoc> = await usersDB.view('for_test', 'combo_' + mode, {key: user.email})

        const combosAmount = combosView.total_rows 

        if (combosAmount === 0) {
            return Response.json({
                combos: null
            })
        }

        const combos = combosView.rows.map(obj => obj.value)

        const readyToTestCombos = getReadyToTestCombos(combos)

        if (!readyToTestCombos) {
            return Response.json({
                combos: null
            })
        }
        const preparedCombos = await getNeededCombos(readyToTestCombos, mode)

        return Response.json({
            combos: preparedCombos
        })
    } catch (error) {
        console.log(error)
        
        if (error instanceof WrongPathError) {
            return Response.json({
                message: error.message,
                redirectTo: '/test'
            }, {status: 308})
            
        } else if (error instanceof UnreachablePathError) {
            return Response.json({
                message: error.message,
                redirectTo: '/test'
            }, {status: 307})
        }

        return Response.json({
            message: "Ошибка сервера"
        }, {status: 500})
    }
}
function getCorrectMode(req: NextRequest): modeType | null {
    const modeRough = req.nextUrl.pathname.split('/')[4].trim().toLowerCase()

    if (modeRough === 'known_writing' || modeRough === 'known_meaning' || modeRough === 'known_reading') return modeRough

    return null
}
function getReadyToTestCombos(kanjis: IComboView[]): IComboView[] | null {
    const readyToTest: IComboView[] = []

    let isThereToTest = false

    kanjis.forEach(comboObj => {
        const lastTimeCheckTimestamp = comboObj.test_timestamp
        
        const currentTimestamp = Date.now()

        if (currentTimestamp - lastTimeCheckTimestamp > TEST_COOLDOWN_TIME_MS) {
            isThereToTest = true

            readyToTest.push(comboObj)
        }
    })
    if (!isThereToTest) return null

    return readyToTest
}
async function getNeededCombos(combos: IComboView[], mode: modeType): Promise<ITestCombo[]> {
    const combosWithComplexPoints = await getCombosWithComplexPoints(combos)

    sortByPoints(combosWithComplexPoints)

    const cutComboIds = getCutComboids(combosWithComplexPoints)

    const neededInfoOfCombo: ITestCombo[] = []

    for (const id of cutComboIds) {
        const primeWriting = id.split('|')[0]

        if (mode === 'known_writing') {
            neededInfoOfCombo.push({id, writing: primeWriting})
        } else {
            try {
                const nanoServer = nano(DB_URI)
                const comboDB: nano.DocumentScope<IDBComboKanji> = nanoServer.db.use('combo-kanji')
    
                const comboObj = await comboDB.get(id)
    
                if (mode === 'known_reading') {
                    const readings = comboObj.variants[0].readings
    
                    if (!readings[0]) continue
    
                    neededInfoOfCombo.push({
                        id,
                        writing: primeWriting,
                        readings
                    })
                }
    
                if (mode === 'known_meaning') {
                    const meanings = comboObj.meanings
    
                    if (!meanings[0]) continue
    
                    neededInfoOfCombo.push({
                        id,
                        writing: primeWriting,
                        meanings
                    })
                }
            } catch (error) {
                continue
            }
        }
    }
    return neededInfoOfCombo

}
async function getCombosWithComplexPoints(combos: IComboView[]): Promise<IComboWithPoints[]> {
    const nanoServer = nano(DB_URI)
    const comboKanjiDB: nano.DocumentScope<IDBComboKanji> = nanoServer.db.use('combo-kanji')

    const updCombos = Promise.all(combos.map(async combo => {
        const testedDaysAgo = (Date.now() - combo.test_timestamp) / (1000 * 60 * 60 * 24)
        const daysPenalty = Math.trunc(testedDaysAgo)

        const points = combo.points

        const frequency = await getWikiFrequency(combo.id) ?? 0.01
    
        const frequencyMultiplier = frequency <= 0.01 ? 500 : frequency <= 0.1 ? 80 : frequency <= 1 ? 10 : frequency <= 4 ? 5 : 2
    
        const frequencyPenalty = Math.random() * frequencyMultiplier * frequency        //вносим случайность, основанную на частоте, для иммитации естественного подбора
    
        const correctPoints = points - frequencyPenalty - daysPenalty

        return {
            id: combo.id,
            points: correctPoints
        }
    }))

    return updCombos

    async function getWikiFrequency(id: string): Promise<number | undefined> {
        try {
            const comboObj = await comboKanjiDB.get(id)

            const absoluteFrequency = comboObj.frequencies.wikipedia?.total

            const relativeFrequnecy = absoluteFrequency ? absoluteFrequency / PAGES_ANALYZED : undefined
    
            return relativeFrequnecy
        } catch (error) {
            return undefined
        }
    }
}
function sortByPoints(kanjis: IComboWithPoints[]) {
    kanjis.sort((kanji_1, kanji_2) => kanji_1.points - kanji_2.points)
}
function getCutComboids(combos: IComboWithPoints[]): string[] {
    const cutIdsArr: string[] = []

    combos.forEach(comboObj => {
        return cutIdsArr.push(comboObj.id)
    })
    return cutIdsArr
}

type knowledgeLevelType = 'well' | 'medium' | 'bad' 

type knownWritingParams = {
    mode: 'known_writing'
    id: string
    readingKnowledge: knowledgeLevelType
    meaningKnowledge: knowledgeLevelType
}
type knownMeaningParams = {
    mode: 'known_meaning'
    id: string
    readingKnowledge: knowledgeLevelType
    writingKnowledge: knowledgeLevelType
}
type knownReadingParams = {
    mode: 'known_reading'
    id: string
    writingKnowledge: knowledgeLevelType
    meaningKnowledge: knowledgeLevelType
}


export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        const mode = getCorrectMode(req)
            
        if (!mode) throw new WrongPathError('Неверный путь')

        const params = getParams(body, mode)

        if (!params) return Response.json({
            message: 'Отсутствуют данные'
        }, {status: 400})

        const nanoServer = nano(DB_URI)
        const usersDB: nano.DocumentScope<IUserDoc> = nanoServer.db.use('users')
        
        const user = await getUser(usersDB)
        
        if (!user) return Response.json({
            message: 'Пользователь не авторизован'
        }, {status: 403})
        
        const combos = user.combos
        
        if (!combos) throw new Error()
        
        const currentcomboObj = getCurrentCombo(params.id, combos)
        
        if (!currentcomboObj) throw new Error()

        const updatedComboObj = getUpdComboObj(currentcomboObj, params)

        const updCombos = getUpdCombos(combos, updatedComboObj)

        await usersDB.insert({
            ...user,
            combos: updCombos,
            _rev: user._rev
        } as IUserDoc)

        return Response.json({
            message: 'Результаты сохранены'
        }, {status: 200})

    } catch (error) {
        console.log(error)
        
    if (error instanceof WrongPathError) {
        return Response.json({
            message: error.message,
            redirectTo: '/test'
        }, {status: 308})

    } else if (error instanceof UnreachablePathError) {
        return Response.json({
            message: error.message,
            redirectTo: '/test'
        }, {status: 307})
    }

    return Response.json({
        message: "Ошибка сервера"
    }, {status: 500})
    }
}
function getParams(body: any, mode: modeType): knownWritingParams | knownReadingParams | knownMeaningParams | null {
    if (!body) return null

    const id = typeof body?.id === 'string' ? body.id : null

    if (!id) return null

    switch (mode) {
        case 'known_writing': {
            const {readingKnowledge, meaningKnowledge} = body

            if (!readingKnowledge || !meaningKnowledge) return null

            return {
                mode: 'known_writing',
                id,
                readingKnowledge,
                meaningKnowledge
            }
        }
        case 'known_reading': {
            const {writingKnowledge, meaningKnowledge} = body

            if (!writingKnowledge || !meaningKnowledge) return null

            return {
                mode: 'known_reading',
                id,
                writingKnowledge,
                meaningKnowledge
            }
        }
        case 'known_meaning': {
            const {readingKnowledge, writingKnowledge} = body

            if (!readingKnowledge || !writingKnowledge) return null

            return {
                mode: 'known_meaning',
                id,
                readingKnowledge,
                writingKnowledge
            }
        }
        default:
            return null
    }


}
function getCurrentCombo(currentId: string, allCombos: usersCombo[]): usersCombo | null {
    for (let comboObj of allCombos) {
        if (currentId === comboObj.id) {
            return comboObj
        }
    }
    return null
}
function getUpdComboObj(comboObj: usersCombo, params: knownWritingParams | knownReadingParams | knownMeaningParams): usersCombo {
    const timestamp = Date.now()

    switch (params.mode) {
        case 'known_writing': {
            const meaning = getPoints({comboObj, answer: params.meaningKnowledge, knowledgeOf: 'meaning', known: 'writing'})
            const reading = getPoints({comboObj, answer: params.readingKnowledge, knowledgeOf: 'reading', known: 'writing'})
            
            comboObj.points[params.mode].meaning.points = meaning.updPoints
            comboObj.points[params.mode].meaning.extra_points = meaning.updExtraPoints
            
            comboObj.points[params.mode].reading.points = reading.updPoints
            comboObj.points[params.mode].reading.extra_points = reading.updExtraPoints

            comboObj.points[params.mode].total = meaning.updPoints + reading.updPoints
            break
        }
        case 'known_reading': {
            const writing = getPoints({comboObj, answer: params.writingKnowledge, knowledgeOf: 'writing', known: 'reading'})
            const meaning = getPoints({comboObj, answer: params.meaningKnowledge, knowledgeOf: 'meaning', known: 'reading'})
                    
            comboObj.points[params.mode].meaning.points = meaning.updPoints
            comboObj.points[params.mode].meaning.extra_points = meaning.updExtraPoints
            
            comboObj.points[params.mode].writing.points = writing.updPoints
            comboObj.points[params.mode].writing.extra_points = writing.updExtraPoints

            comboObj.points[params.mode].total = meaning.updPoints + writing.updPoints
            break
        }
        case 'known_meaning': {
            const writing = getPoints({comboObj, answer: params.writingKnowledge, knowledgeOf: 'writing', known: 'meaning'})
            const reading = getPoints({comboObj, answer: params.readingKnowledge, knowledgeOf: 'reading', known: 'meaning'})
                    
            comboObj.points[params.mode].writing.points = writing.updPoints
            comboObj.points[params.mode].writing.extra_points = writing.updExtraPoints
            
            comboObj.points[params.mode].reading.points = reading.updPoints
            comboObj.points[params.mode].reading.extra_points = reading.updExtraPoints

            comboObj.points[params.mode].total = writing.updPoints + reading.updPoints
            break
        }

    }
    comboObj.points.total = comboObj.points.known_meaning.total + comboObj.points.known_reading.total + comboObj.points.known_writing.total
    
    comboObj.points[params.mode].test_timestamp = timestamp

    return comboObj
}
interface IGetPointsProps {
    comboObj: usersCombo
    answer: knowledgeLevelType
    known: 'writing' | 'reading' | 'meaning'
    knowledgeOf: 'meaning' | 'reading' | 'writing'
    
}
interface IPoints {
    updPoints: number
    updExtraPoints: number
}
type knowledgeType = 'meaning' | 'reading' | 'writing'

function getPoints({comboObj, answer, known, knowledgeOf}: IGetPointsProps): IPoints {
    const prevExtra = (
        known === 'writing' && knowledgeOf === 'meaning' ? comboObj.points.known_writing.meaning.extra_points :
        known === 'writing' && knowledgeOf === 'reading' ? comboObj.points.known_writing.reading.extra_points :

        known === 'meaning' && knowledgeOf === 'writing' ? comboObj.points.known_meaning.writing.extra_points :
        known === 'meaning' && knowledgeOf === 'reading' ? comboObj.points.known_meaning.reading.extra_points :

        known === 'reading' && knowledgeOf === 'writing' ? comboObj.points.known_reading.writing.extra_points :
        known === 'reading' && knowledgeOf === 'meaning' ? comboObj.points.known_reading.meaning.extra_points : 0
    )
    const prevPoints = (
        known === 'writing' && knowledgeOf === 'meaning' ? comboObj.points.known_writing.meaning.points :
        known === 'writing' && knowledgeOf === 'reading' ? comboObj.points.known_writing.reading.points :

        known === 'meaning' && knowledgeOf === 'writing' ? comboObj.points.known_meaning.writing.points :
        known === 'meaning' && knowledgeOf === 'reading' ? comboObj.points.known_meaning.reading.points :

        known === 'reading' && knowledgeOf === 'writing' ? comboObj.points.known_reading.writing.points :
        known === 'reading' && knowledgeOf === 'meaning' ? comboObj.points.known_reading.meaning.points : 0
    )

    let updExtraPoints;
    let updPoints;

    switch (answer) {
        case "bad": 
            updExtraPoints = prevExtra > 0 ? 0 : prevExtra - EXTRA_POINT             //если ответ плохой, то сбрасываются доп. очки (если они были)

            updPoints = prevExtra > 0 ? 0 : prevExtra                               //при остальных ответах учитываются доп. очки за прошлые тестирования; здесь - учитываются обнулённые, если вышло больше 0
            break
        case "medium":
            updExtraPoints = prevExtra < 1 ? prevExtra + EXTRA_POINT : 1            //при среднем ответе бонус не может быть больше 1

            updPoints = prevPoints + MEDIUM_POINTS + prevExtra                      //обновлённые очки включают доп. очки за прошлые тестирования
            break
        case "well":
            updExtraPoints = prevExtra + EXTRA_POINT > MAX_EXTRA_POINTS ? MAX_EXTRA_POINTS : prevExtra + EXTRA_POINT

            updPoints = prevPoints + WELL_POINTS + prevExtra
            break
    }

    updPoints = (
        updPoints < MIN_KNOWLEDGE_POINTS ? MIN_KNOWLEDGE_POINTS :
        updPoints > MAX_KNOWLEDGE_POINTS ? MAX_KNOWLEDGE_POINTS :
        updPoints
    )

    updExtraPoints = (
        updExtraPoints < MIN_EXTRA_POINTS ? MIN_EXTRA_POINTS :
        updExtraPoints > MAX_EXTRA_POINTS ? MAX_EXTRA_POINTS :
        updExtraPoints
    )

    return {updPoints, updExtraPoints}
}

function getUpdCombos(usersCombos: usersCombo[], newCombo: usersCombo): usersCombo[] {
    return usersCombos.map(prevCombo => {
        if (prevCombo.id === newCombo.id) return newCombo

        return prevCombo
    })
}