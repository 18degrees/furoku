type status = 'success' | 'error' | 'default'

export type alertsType = JSX.Element[] | null

export interface IAlert {
    message: string
    status: status
}