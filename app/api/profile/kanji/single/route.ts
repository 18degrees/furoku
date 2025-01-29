import { IDBKanji, IKanjiProps, IKanjiWithPointsBrief, knownValue } from "@/app/interfaces/kanji.interface"
import { IUserDoc, usersKanji } from "@/app/interfaces/user.interface"
import getUser from "../../../auxiliaries/getUser"
import { NextRequest } from "next/server"
import nano from "nano"

const DB_URI = process.env.COUCHDB_URI!

// Здесь происходит сохранение иероглифа в профиль с начислением ему базовых 0 очков по всем категориям

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        const kanji = body?.writing

        if (!kanji) return Response.json({
            message: 'Отсутствуют данные'
        }, {status: 400})
    
        const nanoServer = nano(DB_URI)
        const usersDB: nano.DocumentScope<IUserDoc> = nanoServer.db.use('users')

        const user = await getUser(usersDB)

        if (!user) return Response.json({
            message: 'Пользователь не авторизован'
        }, {status: 403})

        if (!isKanjiNew(kanji, user)) return Response.json({
            message: 'Иероглиф уже был добавлен',
            applicableFor: 'alert',
            success: false
        }, {status: 208})

        const fullInfoKanji: usersKanji = {
            writing: kanji,
            points: {
                total: 0,
                known_writing: {
                    total: 0,
                    reading: {
                        points: 0,
                        extra_points: 0,
                    },
                    meaning: {
                        points: 0,
                        extra_points: 0,
                    },
                    test_timestamp: 0,
                },
                known_reading: {
                    total: 0,
                    writing: {
                        points: 0,
                        extra_points: 0,
                    },
                    meaning: {
                        points: 0,
                        extra_points: 0,
                    },
                    test_timestamp: 0,
                },
                known_meaning: {
                    total: 0,
                    writing: {
                        points: 0,
                        extra_points: 0,
                    },
                    reading: {
                        points: 0,
                        extra_points: 0,
                    },
                    test_timestamp: 0,
                }
            },
            addition_timestamp: Date.now()
        }

        const updKanjis = user.kanjis ? [...user.kanjis, fullInfoKanji] : [fullInfoKanji];

        await usersDB.insert({
            ...user,
            kanjis: updKanjis
        } as IUserDoc)

        return Response.json(
            {
                message: 'Иероглиф добавлен',
                applicableFor: 'alert',
                success: true
            }, {status: 200})

    } catch (error) {
        console.log(error)

        return Response.json({
            message: 'Ошибка сервера'
        }, {status: 500})
    }
    function isKanjiNew(searchedKanji: string, user: IUserDoc) {
        if (!user.kanjis) return true
    
        for (let kanjiObj of user.kanjis) {
            if (kanjiObj.writing === searchedKanji) return false
        }
        return true
    }
}

interface IKanjiWithPointsView {
    id: string 
    key: string 
    value: usersKanji
    doc?: Document | undefined
}
interface IOptions {
    sort: {
        knownValue: any,
        pointsOf: any
    },
    descending: any,
}

//Далее интерфейсы с возможными параметрами сортировки в профиле
interface IKnownWritingSort {
    knownValue: 'writing'
    pointsOf: 'total' | 'meaning' | 'reading'
}
interface IKnownMeaningSort {
    knownValue: 'meaning'
    pointsOf: 'total' | 'writing' | 'reading'
}
interface IKnownReadingSort {
    knownValue: 'reading'
    pointsOf: 'total' | 'meaning' | 'writing'
}

type sortType = IKnownMeaningSort | IKnownReadingSort | IKnownWritingSort

//Здесь сортируются по очкам и отправляются повторяемые кандзи

export async function GET(req: NextRequest) {
    try {
        const optionsStr = req.headers.get('options')

        const options: IOptions = optionsStr ? JSON.parse(optionsStr) : undefined

        const sort = getAcceptableSortValues(options?.sort)
        const descending = getAcceptableDescending(options?.descending)     //хотя подразумевается возможость изменения порядка, на клиенте она пока не используется: сортировка идёт только от меньшего числа очков к большему

        const nanoServer = nano(DB_URI)
        const usersDB: nano.DocumentScope<IUserDoc> = nanoServer.db.use('users')

        const user = await getUser(usersDB)
    
        if (!user) return Response.json({
            message: 'Пользователь не авторизован'
        }, {status: 403})
        
        const userskanjiView = await usersDB.view('others', 'kanji_with_points', {key: user.email})
        
        const kanjis = userskanjiView.rows as IKanjiWithPointsView[]

        const totalRelevantAmount = kanjis.length

        if (totalRelevantAmount === 0) return Response.json({
            message: 'Иероглифы не добавлены'
        }, {status: 200})                                   //204 статус выдаёт ошибку, поэтому просто не возвращаем массив kanjis

        const preparedKanjis = await prepareKanjis(kanjis, {sort, descending})

        const fullInfoKanjis = await getFullInfoKanji(preparedKanjis, sort.knownValue)
        
        return Response.json(
            {
                cards: fullInfoKanjis
            }, 
            {status: 200}
        )
    } catch (error) {
        console.log(error)

        return Response.json({
            message: 'Ошибка сервера'
        }, {status: 500})
    }

    function getAcceptableSortValues(sortObj: any): sortType {
        const knownValue = sortObj.knownValue
        const pointsOf = sortObj.pointsOf

        if ( //если и известное значение, и то, от чего сортировать верно
            (knownValue === 'writing' && (pointsOf === 'meaning' || pointsOf === 'reading')) ||
            (knownValue === 'meaning' && (pointsOf === 'writing' || pointsOf === 'reading')) ||
            (knownValue === 'reading' && (pointsOf === 'writing' || pointsOf === 'meaning')) 
        ) {
            return {
                knownValue,
                pointsOf
            }
        } else {
            if (knownValue === 'writing' || knownValue === 'meaning' || knownValue === 'reading') { //если верно только известное изачение
                return {
                    knownValue,
                    pointsOf: 'total'
                }
            } else { //если все данные неверны
                return {
                    knownValue: 'writing',
                    pointsOf: 'total'
                }
            }
        }
    }
    function getAcceptableDescending(descending: any): boolean {
        return descending === 'true' ? true : false
    }
    async function getFullInfoKanji(kanjis: string[], knownValue: knownValue): Promise<IKanjiProps[]> {
        try {
            const kanjisFullInfo: IKanjiProps[] = []
            
            const nanoServer = nano(DB_URI)

            const kanjiDB: nano.DocumentScope<IDBKanji> = nanoServer.db.use('kanji')

            for (const writing of kanjis) {
                try {
                    const kanjiWritingView = await kanjiDB.get(writing)

                    const readings = [...kanjiWritingView.kun_readings, ...kanjiWritingView.on_readings]

                    if (
                        (knownValue === 'writing' && !kanjiWritingView.writing) ||
                        (knownValue === 'reading' && !readings[0]) ||
                        (knownValue === 'meaning' && !kanjiWritingView.meanings[0]) 
                    ) continue
                    
                    kanjisFullInfo.push({
                        id: writing,
                        readings,
                        writing: kanjiWritingView.writing,
                        meanings: kanjiWritingView.meanings
                    })
                    
                } catch (error) {
                    continue
                }

            }
            return kanjisFullInfo
            
        } catch (error) {
            console.log(error)

            throw new Error()
        }
    }
    async function prepareKanjis(roughKanjis: IKanjiWithPointsView[], options: {sort: sortType, descending: boolean}): Promise<string[]> {
        const briefKanjis = getBriefKanjis(roughKanjis)

        sortKanjis(briefKanjis, options.sort, options.descending)

        const onlyWritings = briefKanjis.map(kanji => kanji.writing)
        
        return onlyWritings
    }
    function getBriefKanjis(kanjis: IKanjiWithPointsView[]): IKanjiWithPointsBrief[] {
        return kanjis.map(kanjiObj => {
            return {
                id: kanjiObj.id,
                writing: kanjiObj.value.writing,
                points: {
                    total: kanjiObj.value.points.total,
                    known_writing: {
                        total: kanjiObj.value.points.known_writing.total,
                        reading: kanjiObj.value.points.known_writing.reading.points,
                        meaning: kanjiObj.value.points.known_writing.meaning.points
                    },
                    known_reading: {
                        total: kanjiObj.value.points.known_reading.total,
                        writing: kanjiObj.value.points.known_reading.writing.points,
                        meaning: kanjiObj.value.points.known_reading.meaning.points
                    },
                    known_meaning: {
                        total: kanjiObj.value.points.known_meaning.total,
                        reading: kanjiObj.value.points.known_meaning.reading.points,
                        writing: kanjiObj.value.points.known_meaning.writing.points
                    }
                }
            }
        })
    }
    function sortKanjis(kanjis: IKanjiWithPointsBrief[], sort: sortType, descending: boolean): IKanjiWithPointsBrief[] {
        const knownValue = sort.knownValue

        return kanjis.sort((a, b) => {
            switch (knownValue) {
                case 'writing':
                    return descending ? 
                        b.points.known_writing[sort.pointsOf] - a.points.known_writing[sort.pointsOf] : 
                        a.points.known_writing[sort.pointsOf] - b.points.known_writing[sort.pointsOf]
                case 'meaning':
                    return descending ? 
                        b.points.known_meaning[sort.pointsOf] - a.points.known_meaning[sort.pointsOf] : 
                        a.points.known_meaning[sort.pointsOf] - b.points.known_meaning[sort.pointsOf]
                case 'reading':
                    return descending ? 
                        b.points.known_reading[sort.pointsOf] - a.points.known_reading[sort.pointsOf] : 
                        a.points.known_reading[sort.pointsOf] - b.points.known_reading[sort.pointsOf]
                default:
                    return descending ? b.points.total - a.points.total : a.points.total - b.points.total
            }
        })
    }
}
export async function DELETE(req: NextRequest) {
    try {
        const kanjisToDelete = await req.json()

        const isArray = Array.isArray(kanjisToDelete)
    
        if (!isArray) return Response.json({
            message: 'Неверные данные'
        }, {status: 400})
    
        const nanoServer = nano(DB_URI)
        const usersDB: nano.DocumentScope<IUserDoc> = nanoServer.db.use('users')

        const user = await getUser(usersDB)
    
        if (!user) return Response.json({
            message: 'Пользователь не авторизован'
        }, {status: 403})
    
        const remainingKanjis = getRemainingKanjis(kanjisToDelete, user)

        await usersDB.insert({
            ...user,
            kanjis: remainingKanjis
        } as IUserDoc)

        return Response.json({
            message: 'Иероглиф удалён',
            applicableFor: 'alert',
            success: true
        }, {status: 200})

    } catch (error) {
        console.log(error)

        return Response.json({
            message: 'Ошибка сервера'
        }, {status: 500})
    }
    function getRemainingKanjis(writingsToDelete: any[], user: IUserDoc): usersKanji[]  {
        const allKanjis = user.kanjis

        if (!allKanjis) return []

        const remainingKanjis: usersKanji[] = []
        
        allKanjis.forEach((kanjiToCheck) => {
            let isCardRemain = true

            writingsToDelete.forEach(writingToDelete => {
                if (kanjiToCheck.writing === writingToDelete) {
                    isCardRemain = false
                }
            })
            if (isCardRemain) remainingKanjis.push(kanjiToCheck)
        })
        
        return remainingKanjis
    }
}