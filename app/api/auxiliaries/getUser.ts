import { IUserDoc } from "@/app/interfaces/db.interface"
import { authConfig } from "@/app/configs/auth"
import { getServerSession } from "next-auth"
import nano from "nano"

export default async function getUser(usersDB: nano.DocumentScope<unknown>) {
    try {
        const session = await getServerSession(authConfig)
    
        const email = session?.user?.email

        if (!email) return null
    
        const user = await usersDB.get(email) as IUserDoc | undefined
    
        return user ? user : null
    } catch (error) {
        return null
    }
}