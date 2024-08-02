export class WrongPathError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'WrongPathError'
    }
}
export class UnreachablePathError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'UnreachablePathError'
    }
}