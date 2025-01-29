export interface IUserDoc {
    email: string
    hashed_password: string
    signup_date: Date
    kanjis?: usersKanji[]
    combos?: usersCombo[]
}

export interface usersKanji {
    writing: string
    points: {
        total: number
        known_writing: {
            total: number
            reading: {
                points: number
                extra_points: number
            }
            meaning: {
                points: number
                extra_points: number
            }
            test_timestamp: number
        }
        known_reading: {
            total: number
            writing: {
                points: number
                extra_points: number
            }
            meaning: {
                points: number
                extra_points: number
            }
            test_timestamp: number
        }
        known_meaning: {
            total: number
            writing: {
                points: number
                extra_points: number
            }
            reading: {
                points: number
                extra_points: number
            }
            test_timestamp: number
        }
    }
    addition_timestamp: number
}

export interface usersCombo {
    id: string
    points: {
        total: number
        known_writing: {
            total: number
            reading: {
                points: number
                extra_points: number
            }
            meaning: {
                points: number
                extra_points: number
            }
            test_timestamp: number
        }
        known_reading: {
            total: number
            writing: {
                points: number
                extra_points: number
            }
            meaning: {
                points: number
                extra_points: number
            }
            test_timestamp: number
        }
        known_meaning: {
            total: number
            writing: {
                points: number
                extra_points: number
            }
            reading: {
                points: number
                extra_points: number
            }
            test_timestamp: number
        }
    }
    addition_timestamp: number
}