export interface ISearchKanji {
    id: string
    writing: string
    frequency: string
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