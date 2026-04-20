import { defineConfig } from 'vitest/config'
import { config } from 'dotenv'

config({ path: '.env.test' })

export default defineConfig({
    test: {
        globalSetup: './src/test/globalSetup.ts',
        setupFiles: ['./src/test/setup.ts'],
    },
})