import { EMAIL_PATTERN, PASSWORD_LENGTH } from "../patterns/auth"
import Credentials from "next-auth/providers/credentials"
import { IUserDoc } from "@/app/interfaces/db.interface"
import { AuthOptions, User } from "next-auth"
import bcrypt from 'bcrypt'
import nano from 'nano'

interface IUsersDB extends nano.DocumentScope<unknown> {
    docs: [IUserDoc]
  }

const DB_URI = process.env.COUCHDB_URI!

export const authConfig: AuthOptions = {
    providers: [
          Credentials({
            name: 'Credentials',
            credentials: {
                email: {type: 'text', label: 'email'},
                password: {type: 'password', label: 'password'}
            },
            async authorize(credentials) {
                try {
                    const email = credentials?.email.trim()
                    const password = credentials?.password.trim()

                    if (!email || !password) return null

                    if (!email.match(EMAIL_PATTERN)) return null

                    if (password.length < PASSWORD_LENGTH.min || password.length > PASSWORD_LENGTH.max) {
                        return null
                    }
                    
                    const nanoServer = nano(DB_URI)
            
                    const usersDB = nanoServer.db.use('users') as IUsersDB
        
                    const user = await usersDB.get(email) as IUserDoc
                    
                    const isPasswordCorrect = await bcrypt.compare(password, user.hashed_password)

                    if (!isPasswordCorrect) return null

                    return {email: user.email} as User
      
                } catch (error) {
                    return null
                }
      
            }
        })
    ],
    pages: {
        signIn: '/signin'
    }
}