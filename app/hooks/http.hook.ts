
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { IDefaultBodyResponse } from "../interfaces/response.interface"

export interface IRequest {
    path: string
    method?: 'GET' | 'POST' | 'DELETE' | 'PUT'
    headers?: any
    body?: any
}

export function useHttp() {
    const router = useRouter()

    const request: ({ path, method, body, headers }: IRequest) => Promise<IDefaultBodyResponse> = useCallback(async ({path, method = 'GET', body, headers = {}}: IRequest) => {
        try {
            if (body) {
                headers['Content-Type'] = 'application/json'

                body = JSON.stringify(body)
            }
            const url = path
            
            const response = await fetch(url, { method, body, headers })
            
            const resBody = await response.json()

            if ((response.status === 307 || response.status === 308)) {
                return router.replace(resBody.redirectTo)
            }

            if (!response.ok) throw new Error(resBody.message ? resBody.message : 'Ошибка сервера')
            
            return resBody
            
        } catch (error: unknown) {
            console.log(error)

            throw error
        }
    }, [router])
    return {request}
}