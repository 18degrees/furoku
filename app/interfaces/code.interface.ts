export type codeInfoType = {
    code: string, 
    expires: number
}

export interface ICodeDoc {
    _id: string
    _rev?: string
    codes: [{code: string, expires: number}]
}