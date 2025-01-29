import { IDBKanji, IKanjiProps, IKanjiWithPointsBrief, knownValue } from "@/app/interfaces/kanji.interface"
import { IUserDoc, usersCombo, usersKanji } from "@/app/interfaces/user.interface"
import getUser from "../../../auxiliaries/getUser"
import { NextRequest } from "next/server"
import nano from "nano"
import { IComboProps, IComboWithPointsBrief, IDBComboKanji } from "@/app/interfaces/combo-kanji.interface"

const DB_URI = process.env.COUCHDB_URI!

// Здесь происходит сохранение иероглифа в профиль с начислением ему базовых 0 очков по всем категориям

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        const id = body?.id

        if (!id) return Response.json({
            message: 'Отсутствуют данные'
        }, {status: 400})
    
        const nanoServer = nano(DB_URI)
        const usersDB: nano.DocumentScope<IUserDoc> = nanoServer.db.use('users')

        const user = await getUser(usersDB)

        if (!user) return Response.json({
            message: 'Пользователь не авторизован'
        }, {status: 403})

        if (!isComboNew(id, user)) return Response.json({
            message: 'Сочетание уже было добавлено',
            applicableFor: 'alert',
            success: false
        }, {status: 208})

        const fullInfoCombo: usersCombo = {
            id,
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

        const updCombos = user.combos ? [...user.combos, fullInfoCombo] : [fullInfoCombo];

        await usersDB.insert({
            ...user,
            combos: updCombos
        } as IUserDoc)

        return Response.json(
            {
                message: 'Сочетание добавлено',
                applicableFor: 'alert',
                success: true
            }, {status: 200})

    } catch (error) {
        console.log(error)

        return Response.json({
            message: 'Ошибка сервера'
        }, {status: 500})
    }
    function isComboNew(id: string, user: IUserDoc) {
        if (!user.combos) return true
    
        for (let comboObj of user.combos) {
            if (comboObj.id === id) return false
        }
        return true
    }
}

interface IComboWithPointsView {
    id: string 
    key: string 
    value: usersCombo
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
        
        const usersComboView = await usersDB.view('others', 'combo_with_points', {key: user.email})
        
        const combos = usersComboView.rows as IComboWithPointsView[]

        
        const totalRelevantAmount = combos.length

        if (totalRelevantAmount === 0) return Response.json({
            message: 'Сочетания не добавлены'
        }, {status: 200})                                   //204 статус выдаёт ошибку, поэтому просто не возвращаем массив combos
        
        const preparedCombos = await prepareCombos(combos, {sort, descending})
        
        const fullInfoCombos = await getFullInfoCombos(preparedCombos, sort.knownValue)
        
        return Response.json(
            {
                cards: fullInfoCombos
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
    async function getFullInfoCombos(ids: string[], knownValue: knownValue): Promise<IComboProps[]> {
        try {
            const combosFullInfo: IComboProps[] = []
            
            const nanoServer = nano(DB_URI)

            const comboDB: nano.DocumentScope<IDBComboKanji> = nanoServer.db.use('combo-kanji')

            for (const id of ids) {
                try {
                    const kanjiWritingView = await comboDB.get(id)

                    const primeWriting = kanjiWritingView.variants[0].writing
                    const primeReadings = kanjiWritingView.variants[0].readings
                    const meanings = kanjiWritingView.meanings

                    if (
                        (knownValue === 'writing' && !primeWriting[0]) ||
                        (knownValue === 'reading' && !primeReadings[0]) ||
                        (knownValue === 'meaning' && !meanings[0]) 
                    ) continue
                    
                    combosFullInfo.push({
                        id,
                        writing: primeWriting,
                        readings: primeReadings,
                        meanings: kanjiWritingView.meanings
                    })
                    
                } catch (error) {
                    continue
                }

            }
            return combosFullInfo
            
        } catch (error) {
            console.log(error)

            throw new Error()
        }
    }
    async function prepareCombos(roughCombos: IComboWithPointsView[], options: {sort: sortType, descending: boolean}): Promise<string[]> {
        const briefCombo = getBriefCombos(roughCombos)

        sortCombo(briefCombo, options.sort, options.descending)

        const onlyWritings = briefCombo.map(combo => combo.writing)
        
        return onlyWritings
    }
    function getBriefCombos(combos: IComboWithPointsView[]): IComboWithPointsBrief[] {
        return combos.map(comboObj => {
            return {
                id: comboObj.id,
                writing: comboObj.value.id.split('|')[0],
                points: {
                    total: comboObj.value.points.total,
                    known_writing: {
                        total: comboObj.value.points.known_writing.total,
                        reading: comboObj.value.points.known_writing.reading.points,
                        meaning: comboObj.value.points.known_writing.meaning.points
                    },
                    known_reading: {
                        total: comboObj.value.points.known_reading.total,
                        writing: comboObj.value.points.known_reading.writing.points,
                        meaning: comboObj.value.points.known_reading.meaning.points
                    },
                    known_meaning: {
                        total: comboObj.value.points.known_meaning.total,
                        reading: comboObj.value.points.known_meaning.reading.points,
                        writing: comboObj.value.points.known_meaning.writing.points
                    }
                }
            }
        })
    }
    function sortCombo(combos: IComboWithPointsBrief[], sort: sortType, descending: boolean): IComboWithPointsBrief[] {
        const knownValue = sort.knownValue

        return combos.sort((a, b) => {
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
        const combosToDelete = await req.json()

        const isArray = Array.isArray(combosToDelete)
    
        if (!isArray) return Response.json({
            message: 'Неверные данные'
        }, {status: 400})
    
        const nanoServer = nano(DB_URI)
        const usersDB: nano.DocumentScope<IUserDoc> = nanoServer.db.use('users')

        const user = await getUser(usersDB)
    
        if (!user) return Response.json({
            message: 'Пользователь не авторизован'
        }, {status: 403})
    
        const remainingCombos = getRemainingCombos(combosToDelete, user)

        await usersDB.insert({
            ...user,
            combos: remainingCombos
        } as IUserDoc)

        return Response.json({
            message: 'Сочетание удалено',
            applicableFor: 'alert',
            success: true
        }, {status: 200})

    } catch (error) {
        console.log(error)

        return Response.json({
            message: 'Ошибка сервера'
        }, {status: 500})
    }
    function getRemainingCombos(idsToDelete: any[], user: IUserDoc): usersCombo[]  {
        const allCombos = user.combos

        if (!allCombos) return []

        const remainingCombos: usersCombo[] = []
        
        allCombos.forEach((comboToCheck) => {
            let isCardRemain = true

            idsToDelete.forEach(idToDelete => {
                if (comboToCheck.id === idToDelete) {
                    isCardRemain = false
                }
            })
            if (isCardRemain) remainingCombos.push(comboToCheck)
        })
        
        return remainingCombos
    }
}