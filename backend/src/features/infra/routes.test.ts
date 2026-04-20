import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../../app'

describe('GET /api/infra/health', () => {
    it('retorna 200 e status ok', async () => {
        const res = await request(app).get('/api/infra/health')
        expect(res.status).toBe(200)
        expect(res.body).toEqual({ status: 'ok' })
    })
})
