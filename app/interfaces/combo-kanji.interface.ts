type jlpt = 5 | 4 | 3 | 2 | 1
type grade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export interface ISearchComboKanji {
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
    added: boolean
}


export interface IComboWithPointsBrief {
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

export interface IComboProps {
    id: string
    writing: string
    readings: string[]
    meanings: string[]
}

export interface IDBComboKanji {
    frequencies: {
        wikipedia: {
            total: number
            pagesAnalyzed: number
            variants: [{
                writing: string
                frequency: number
            }]
            timestamp: number
        }
    }
    variants: [{
        writing: string
        readings: [string]
    }]
    meanings: [string]

    jlpt?: jlpt
    grade?: grade
}

export interface ITestCombo {
    id: string
    writing: string
    readings?: string[]
    meanings?: string[]
}