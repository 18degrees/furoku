type kanjiProps = 'writing' | 'meaning' | 'reading'

export type knownValue = kanjiProps

export type pointsOf = kanjiProps | 'total'

export interface ISearchKanji {
    id: string
    writing: string
    index: string
    added: boolean
}
export interface IKanjiWithPointsBrief {
    id: string
    writing: string
    points: {
        total: number
        known_writing: {
            total: number
            reading: number
            meaning: number
        }
        known_reading: {
            total: number
            writing: number
            meaning: number
        }
        known_meaning: {
            total: number
            reading: number
            writing: number
        }
    }
}

type jlpt = 5 | 4 | 3 | 2 | 1
type grade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export interface IDBKanji {
    writing: string
    frequencies: {
        wikipedia?: {
            timestamp: number,
            total: number,
            single: number,
            combined: number,
            pagesAnalyzed: number
        }
        mainichi_shinbun?: number
    }
    kun_readings: string[]
    on_readings: string[]
    meanings: string[]

    jlpt?: jlpt
    grade?: grade
    stroke_count: number
}

export interface ITestKanji {
    writing: string
    readings?: string[]
    meanings?: string[]
}

export interface IKanjiProps {
    writing: string
    kun_readings: string[]
    on_readings: string[]
    meanings: string[]
}