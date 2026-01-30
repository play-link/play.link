import {Hono} from 'hono'
import type {AppContext} from '../types'

const upload = new Hono<AppContext>()

upload.post('/', async (c) => {
  const user = c.get('user')
  if (!user) {
    return c.json({error: 'Unauthorized'}, 401)
  }

  const contentType = c.req.header('content-type') || 'image/jpeg'
  const folder = c.req.query('folder') || 'uploads'

  const body = await c.req.arrayBuffer()
  if (!body || body.byteLength === 0) {
    return c.json({error: 'Empty body'}, 400)
  }

  // Max 10MB
  if (body.byteLength > 10 * 1024 * 1024) {
    return c.json({error: 'File too large (max 10MB)'}, 400)
  }

  const ext = contentType.includes('png') ? 'png' : 'jpg'
  const key = `${folder}/${crypto.randomUUID()}.${ext}`

  await c.env.R2_BUCKET.put(key, body, {
    httpMetadata: {contentType},
  })

  const publicUrl = `${c.env.R2_PUBLIC_URL}/${key}`

  return c.json({url: publicUrl, key})
})

export {upload}
