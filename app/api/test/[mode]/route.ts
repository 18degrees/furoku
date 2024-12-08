import { IUserDoc, usersKanji } from "@/app/interfaces/user.interface"
import { UnreachablePathError, WrongPathError } from "../../errors"
import getUser from "../../auxiliaries/getUser"
import { NextRequest } from "next/server"
import nano from "nano"
import { IDBKanji, ITestKanji } from "@/app/interfaces/kanji.interface"

const DB_URI = process.env.COUCHDB_URI!

const TEST_COOLDOWN_TIME_MS = 1000 * 60 * 60 * 12                       //12 часов

const EXTRA_POINT = 1                                                   
const MAX_EXTRA_POINTS = 3
const MIN_EXTRA_POINTS = -3

const MAX_KNOWLEDGE_POINTS = 10
const MIN_KNOWLEDGE_POINTS = 0

const WELL_POINTS = 2
const MEDIUM_POINTS = 1
const BAD_POINTS = -2

interface IKanjiView {
    writing: string
    points: number
    test_timestamp: number
}

interface IKanjiWithPoints {
    writing: string
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

        const kanjisView: nano.DocumentViewResponse<IKanjiView, IUserDoc> = await usersDB.view('for_test', mode, {key: user.email})

        const kanjisAmount = kanjisView.total_rows 

        if (kanjisAmount === 0) {
            return Response.json({
                kanjis: null
            })
        }

        const kanjis = kanjisView.rows.map(obj => obj.value)

        const readyToTestKanjis = getReadyToTestKanjis(kanjis)

        if (!readyToTestKanjis) {
            return Response.json({
                kanjis: null
            })
        }
        const preparedKanjis = await getNeededKanjis(readyToTestKanjis, mode)

        return Response.json({
            kanjis: preparedKanjis
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
    const modeRough = req.nextUrl.pathname.split('/')[3].trim().toLowerCase()

    if (modeRough === 'known_writing' || modeRough === 'known_meaning' || modeRough === 'known_reading') return modeRough

    return null
}
function getReadyToTestKanjis(kanjis: IKanjiView[]): IKanjiView[] | null {
    const readyToTest: IKanjiView[] = []

    let isThereToTest = false

    kanjis.forEach(kanjiObj => {
        const lastTimeCheckTimestamp = kanjiObj.test_timestamp
        
        const currentTimestamp = Date.now()

        if (currentTimestamp - lastTimeCheckTimestamp > TEST_COOLDOWN_TIME_MS) {
            isThereToTest = true

            readyToTest.push(kanjiObj)
        }
    })
    if (!isThereToTest) return null

    return readyToTest
}
async function getNeededKanjis(kanjis: IKanjiView[], mode: modeType): Promise<ITestKanji[]> {
    const kanjisTimeConsidered = await getKanjisWithComplexPoints(kanjis)

    sortByPoints(kanjisTimeConsidered)

    const cutKanjis = getCutKanjis(kanjisTimeConsidered)

    const neededInfoOfKanji: ITestKanji[] = []

    if (mode !== 'known_writing') {
        for (const writing of cutKanjis) {
            try {
                const nanoServer = nano(DB_URI)
                const kanjiDB: nano.DocumentScope<IDBKanji> = nanoServer.db.use('kanji')

                const kanjiObj = await kanjiDB.get(writing)

                if (mode === 'known_reading') {
                    if (!kanjiObj.kun_readings[0] && !kanjiObj.on_readings[0]) continue

                    neededInfoOfKanji.push({
                        writing,
                        readings: kanjiObj.kun_readings.concat(kanjiObj.on_readings)
                    })
                }    
                if (mode === 'known_meaning') {
                    if (!kanjiObj.meanings[0]) continue

                    neededInfoOfKanji.push({
                        writing,
                        meanings: kanjiObj.meanings
                    })
                }
                
            } catch (error) {
                continue
            }
        }
        return neededInfoOfKanji
    } else {
        return cutKanjis.map(writing => {
            return {writing}
        })
    }

}
async function getKanjisWithComplexPoints(kanjis: IKanjiView[]): Promise<IKanjiWithPoints[]> {
    const nanoServer = nano(DB_URI)
    const kanjiDB: nano.DocumentScope<IDBKanji> = nanoServer.db.use('kanji')

    const updKanjis = Promise.all(kanjis.map(async kanji => {
        const testedDaysAgo = (Date.now() - kanji.test_timestamp) / (1000 * 60 * 60 * 24)
        const daysPenalty = Math.trunc(testedDaysAgo)

        const points = kanji.points

        const frequency = await getWikiFrequency(kanji.writing) ?? 0.01
    
        const frequencyMultiplier = frequency <= 0.01 ? 500 : frequency <= 0.1 ? 80 : frequency <= 1 ? 10 : frequency <= 4 ? 5 : 2
    
        const frequencyPenalty = Math.random() * frequencyMultiplier * frequency        //вносим случайность, основанную на частоте, для иммитации естественного подбора
    
        const correctPoints = points - frequencyPenalty - daysPenalty

        return {
            writing: kanji.writing,
            points: correctPoints
        }
    }))

    return updKanjis

    async function getWikiFrequency(writing: string): Promise<number | undefined> {
        try {
            const kanjiObj = await kanjiDB.get(writing)
    
            return kanjiObj.frequencies.wikipedia?.total
        } catch (error) {
            return undefined
        }
    }
}
function sortByPoints(kanjis: IKanjiWithPoints[]) {
    kanjis.sort((kanji_1, kanji_2) => kanji_1.points - kanji_2.points)
}
function getCutKanjis(kanjis: IKanjiWithPoints[]): string[] {
    const cutKanjisArr: string[] = []

    kanjis.forEach(kanjiObj => {
        return cutKanjisArr.push(kanjiObj.writing)
    })
    return cutKanjisArr
}

type knowledgeLevelType = 'well' | 'medium' | 'bad' 

type knownWritingParams = {
    mode: 'known_writing'
    writing: string
    readingKnowledge: knowledgeLevelType
    meaningKnowledge: knowledgeLevelType
}
type knownMeaningParams = {
    mode: 'known_meaning'
    writing: string
    readingKnowledge: knowledgeLevelType
    writingKnowledge: knowledgeLevelType
}
type knownReadingParams = {
    mode: 'known_reading'
    writing: string
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
        
        const kanjis = user.kanjis
        
        if (!kanjis) throw new Error()
        
        const currentKanjiObj = getCurrentKanji(params.writing, kanjis)
        
        if (!currentKanjiObj) throw new Error()

        const updatedKanjiObj = getUpdKanjiObj(currentKanjiObj, params)

        const updKanjis = getUpdKanjis(kanjis, updatedKanjiObj)

        await usersDB.insert({
            ...user,
            kanjis: updKanjis,
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

    const writing = typeof body?.writing === 'string' ? body.writing : null

    if (!writing) return null

    switch (mode) {
        case 'known_writing': {
            const {readingKnowledge, meaningKnowledge} = body

            if (!readingKnowledge || !meaningKnowledge) return null

            return {
                mode: 'known_writing',
                writing,
                readingKnowledge,
                meaningKnowledge
            }
        }
        case 'known_reading': {
            const {writingKnowledge, meaningKnowledge} = body

            if (!writingKnowledge || !meaningKnowledge) return null

            return {
                mode: 'known_reading',
                writing,
                writingKnowledge,
                meaningKnowledge
            }
        }
        case 'known_meaning': {
            const {readingKnowledge, writingKnowledge} = body

            if (!readingKnowledge || !writingKnowledge) return null

            return {
                mode: 'known_meaning',
                writing,
                readingKnowledge,
                writingKnowledge
            }
        }
        default:
            return null
    }


}
function getCurrentKanji(currentWriting: string, allKanjis: usersKanji[]): usersKanji | null {
    for (let kanjiObj of allKanjis) {
        if (currentWriting === kanjiObj.writing) {
            return kanjiObj
        }
    }
    return null
}
function getUpdKanjiObj(kanjiObj: usersKanji, params: knownWritingParams | knownReadingParams | knownMeaningParams): usersKanji {
    const timestamp = Date.now()

    switch (params.mode) {
        case 'known_writing': {
            const meaning = getPoints({kanjiObj, answer: params.meaningKnowledge, knowledgeOf: 'meaning', known: 'writing'})
            const reading = getPoints({kanjiObj, answer: params.readingKnowledge, knowledgeOf: 'reading', known: 'writing'})
            
            kanjiObj.points[params.mode].meaning.points = meaning.updPoints
            kanjiObj.points[params.mode].meaning.extra_points = meaning.updExtraPoints
            
            kanjiObj.points[params.mode].reading.points = reading.updPoints
            kanjiObj.points[params.mode].reading.extra_points = reading.updExtraPoints

            kanjiObj.points[params.mode].total = meaning.updPoints + reading.updPoints
            break
        }
        case 'known_reading': {
            const writing = getPoints({kanjiObj, answer: params.writingKnowledge, knowledgeOf: 'writing', known: 'reading'})
            const meaning = getPoints({kanjiObj, answer: params.meaningKnowledge, knowledgeOf: 'meaning', known: 'reading'})
                    
            kanjiObj.points[params.mode].meaning.points = meaning.updPoints
            kanjiObj.points[params.mode].meaning.extra_points = meaning.updExtraPoints
            
            kanjiObj.points[params.mode].writing.points = writing.updPoints
            kanjiObj.points[params.mode].writing.extra_points = writing.updExtraPoints

            kanjiObj.points[params.mode].total = meaning.updPoints + writing.updPoints
            break
        }
        case 'known_meaning': {
            const writing = getPoints({kanjiObj, answer: params.writingKnowledge, knowledgeOf: 'writing', known: 'meaning'})
            const reading = getPoints({kanjiObj, answer: params.readingKnowledge, knowledgeOf: 'reading', known: 'meaning'})
                    
            kanjiObj.points[params.mode].writing.points = writing.updPoints
            kanjiObj.points[params.mode].writing.extra_points = writing.updExtraPoints
            
            kanjiObj.points[params.mode].reading.points = reading.updPoints
            kanjiObj.points[params.mode].reading.extra_points = reading.updExtraPoints

            kanjiObj.points[params.mode].total = writing.updPoints + reading.updPoints
            break
        }

    }
    kanjiObj.points.total = kanjiObj.points.known_meaning.total + kanjiObj.points.known_reading.total + kanjiObj.points.known_writing.total
    
    kanjiObj.points[params.mode].test_timestamp = timestamp

    return kanjiObj
}
interface IGetPointsProps {
    kanjiObj: usersKanji
    answer: knowledgeLevelType
    known: 'writing' | 'reading' | 'meaning'
    knowledgeOf: 'meaning' | 'reading' | 'writing'
    
}
interface IPoints {
    updPoints: number
    updExtraPoints: number
}
type knowledgeType = 'meaning' | 'reading' | 'writing'

function getPoints({kanjiObj, answer, known, knowledgeOf}: IGetPointsProps): IPoints {
    const prevExtra = (
        known === 'writing' && knowledgeOf === 'meaning' ? kanjiObj.points.known_writing.meaning.extra_points :
        known === 'writing' && knowledgeOf === 'reading' ? kanjiObj.points.known_writing.reading.extra_points :

        known === 'meaning' && knowledgeOf === 'writing' ? kanjiObj.points.known_meaning.writing.extra_points :
        known === 'meaning' && knowledgeOf === 'reading' ? kanjiObj.points.known_meaning.reading.extra_points :

        known === 'reading' && knowledgeOf === 'writing' ? kanjiObj.points.known_reading.writing.extra_points :
        known === 'reading' && knowledgeOf === 'meaning' ? kanjiObj.points.known_reading.meaning.extra_points : 0
    )
    const prevPoints = (
        known === 'writing' && knowledgeOf === 'meaning' ? kanjiObj.points.known_writing.meaning.points :
        known === 'writing' && knowledgeOf === 'reading' ? kanjiObj.points.known_writing.reading.points :

        known === 'meaning' && knowledgeOf === 'writing' ? kanjiObj.points.known_meaning.writing.points :
        known === 'meaning' && knowledgeOf === 'reading' ? kanjiObj.points.known_meaning.reading.points :

        known === 'reading' && knowledgeOf === 'writing' ? kanjiObj.points.known_reading.writing.points :
        known === 'reading' && knowledgeOf === 'meaning' ? kanjiObj.points.known_reading.meaning.points : 0
    )

    let updExtraPoints;
    let updPoints;

    switch (answer) {
        case "bad": 
            updExtraPoints = prevExtra > 0 ? 0 : prevExtra - EXTRA_POINT             //если ответ плохой, то сбрасываются доп. очки (если они были)

            updPoints = prevPoints + BAD_POINTS + (prevExtra > 0 ? 0 : prevExtra)    //при остальных ответах учитываются доп. очки за прошлые тестирования; здесь - учитываются обнулённые, если вышло больше 0
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

function getUpdKanjis(usersKanjis: usersKanji[], newKanji: usersKanji): usersKanji[] {
    return usersKanjis.map(prevKanji => {
        if (prevKanji.writing === newKanji.writing) return newKanji

        return prevKanji
    })
}