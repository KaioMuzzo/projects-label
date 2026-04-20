import { z } from 'zod'

const envSchema = z.object({
    PORT: z.string().default('3333'),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.url(),
    JWT_SECRET: z.string().min(32),
})

export const env = envSchema.parse(process.env)
