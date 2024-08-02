import { IUserDoc, usersKanji } from "@/app/interfaces/db.interface"
import { UnreachablePathError, WrongPathError } from "../../errors"
import getUser from "../../auxiliaries/getUser"
import { NextRequest } from "next/server"
import nano from "nano"

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

const TIME_IMPORTANCE = 0.5

interface IKnownWritingView {
    id: string;
    key: string;
    value: {
        writing: string
        points: number
        test_timestamp: number
    };
    doc?: nano.Document | undefined;
}

interface IKanjiWithPoints {
    writing: string
    points: number
}

type modeType = 'known_writing' | 'known_reading' | 'known_meaning' | null

export async function GET(req: NextRequest) {
    try {
        const mode = getCorrectMode(req)

        if (mode === 'known_meaning' || mode === 'known_reading') throw new UnreachablePathError('Путь пока недоступен')

        if (!mode) throw new WrongPathError('Неверный путь')

        const nanoServer = nano(DB_URI)
        const usersDB = nanoServer.db.use('users')

        const user = await getUser(usersDB)

        if (!user) return Response.json({
            message: 'Пользователь не авторизован'
        }, {status: 403})

        const kanjisView = await usersDB.view('for_test', mode, {key: user.email})

        const kanjisAmount = kanjisView.total_rows 

        if (kanjisAmount === 0) {
            return Response.json({
                kanjis: null
            })
        }

        const kanjis = kanjisView.rows as IKnownWritingView[]

        const readyToTestKanjis = getReadyToTestKanjis(kanjis)

        if (!readyToTestKanjis) {
            return Response.json({
                kanjis: null
            })
        }
        const preparedKanjis = getNeededKanjis(readyToTestKanjis)

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
function getCorrectMode(req: NextRequest): modeType {
    const modeRough = req.nextUrl.pathname.split('/')[3].trim().toLowerCase()

    if (modeRough === 'known_writing' || modeRough === 'known_meaning' || modeRough === 'known_reading') return modeRough

    return null
}
function getReadyToTestKanjis(kanjis: IKnownWritingView[]): IKnownWritingView[] | null {
    const readyToTest: IKnownWritingView[] = []

    let isThereToTest = false

    kanjis.forEach(kanjiObj => {
        const lastTimeCheckTimestamp = kanjiObj.value.test_timestamp
        
        const currentTimestamp = Date.now()

        if (currentTimestamp - lastTimeCheckTimestamp > TEST_COOLDOWN_TIME_MS) {
            isThereToTest = true

            readyToTest.push(kanjiObj)
        }
    })
    if (!isThereToTest) return null

    return readyToTest
}
function getNeededKanjis(kanjis: IKnownWritingView[]) {
    const kanjisTimeConsidered = getKanjisWithTimeConsideredPoints(kanjis)

    sortByPoints(kanjisTimeConsidered)

    const cutKanjis = getCutKanjis(kanjisTimeConsidered)

    return cutKanjis
}
function getKanjisWithTimeConsideredPoints(kanjis: IKnownWritingView[]): IKanjiWithPoints[] {
    return kanjis.map(kanji => {
        const testedDaysAgo = Math.trunc((Date.now() - kanji.value.test_timestamp) / (1000 * 60 * 60 * 24))
        const points = kanji.value.points

        const pointsTimeConsidered = points - (testedDaysAgo * TIME_IMPORTANCE)

        return {
            writing: kanji.value.writing,
            points: pointsTimeConsidered
        }
    })
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
    writing: string
    readingKnowledge: knowledgeLevelType
    meaningKnowledge: knowledgeLevelType
}
type pointsObj = {
    points: number
    extra_points: number
}
interface IKnownWritingPoints {
    currentReadingKnowledge: pointsObj
    currentMeaningKnowledge: pointsObj
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        const mode = getCorrectMode(req)
    
        if (mode === 'known_meaning' || mode === 'known_reading') throw new UnreachablePathError('Путь пока недоступен')
        
        if (!mode) throw new WrongPathError('Неверный путь')

        const params = getParams(body, mode)

        if (!params) return Response.json({
            message: 'Отсутствуют данные'
        }, {status: 400})

        const nanoServer = nano(DB_URI)
        const usersDB = nanoServer.db.use('users')
        
        const user = await getUser(usersDB)
        
        if (!user) return Response.json({
            message: 'Пользователь не авторизован'
        }, {status: 403})
        
        const kanjis = user.kanjis
        
        if (!kanjis) throw new Error()
        
        const currentKanjiObj = getCurrentKanji(params.writing, kanjis)
        
        if (!currentKanjiObj) throw new Error()

        const updatedKanjiObj = getUpdKanjiObj(currentKanjiObj, mode, params)

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
function getParams(body: any, mode: modeType): knownWritingParams | null {
    if (!body) return null

    const writing = typeof body?.writing === 'string' ? body.writing : null

    if (!writing) return null

    switch (mode) {
        case 'known_writing':
            const {readingKnowledge, meaningKnowledge} = body

            if (!readingKnowledge || !meaningKnowledge) return null

            return {
                writing,
                readingKnowledge,
                meaningKnowledge
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
function getUpdKanjiObj(kanjiObj: usersKanji, mode: 'known_writing', params: knownWritingParams): usersKanji {
    switch (mode) {
        case 'known_writing':
            const meaning = getPoints(kanjiObj, params.meaningKnowledge, 'meaning')
            const reading = getPoints(kanjiObj, params.readingKnowledge, 'reading')
        
            const timestamp = Date.now()
            
            kanjiObj.points[mode].meaning.points = meaning.updPoints
            kanjiObj.points[mode].meaning.extra_points = meaning.updExtraPoints
            
            kanjiObj.points[mode].reading.points = reading.updPoints
            kanjiObj.points[mode].reading.extra_points = reading.updExtraPoints

            kanjiObj.points.total = kanjiObj.points[mode].total = meaning.updPoints + reading.updPoints                 //поскольку режим тестирования пока один, общее число очков = числу очков в этом режиме 
        
            kanjiObj.points[mode].test_timestamp = timestamp
            
            return kanjiObj
    }
}
interface IPoints {
    updPoints: number
    updExtraPoints: number
}
type knowledgeType = 'meaning' | 'reading'

function getPoints(kanjiObj: usersKanji, answer: knowledgeLevelType, knowledge: knowledgeType): IPoints {
    const prevExtra = kanjiObj.points.known_writing[knowledge].extra_points
    const prevPoints = kanjiObj.points.known_writing[knowledge].points

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