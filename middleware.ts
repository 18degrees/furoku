export {default} from 'next-auth/middleware'

export const config = {
    matcher: ['/repeat', '/test/:path*']
}