/*
    Ответ сервера может включать applicableFor, 
    чтобы было понятно, подходит ли message для трансляции пользователю в виде alert (всплювающие уведомления) 
    или notification (интегрированные в интерфейс уведомления).
    access (для выведение alert с подходящим фоном) показывает, прошла ли операция успешно
*/

export interface IDefaultBodyResponse {
    [key: string]: any
    message?: string
    applicableFor?: 'notification' | 'alert'
    success?: boolean
}