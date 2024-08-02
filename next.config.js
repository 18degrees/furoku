/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [
            {
                source: '/about',
                destination: '/',
                permanent: true,
            },
            {
                source: '/kanji',
                destination: '/kanji/single',
                permanent: true,
            },
        ]
    } 
}

module.exports = nextConfig
