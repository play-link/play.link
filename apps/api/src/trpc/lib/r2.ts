import type {Env} from '../../types'

/**
 * Download an image from a URL and upload it to R2.
 * Returns the public URL of the uploaded file.
 */
export async function downloadToR2(
  env: Env,
  sourceUrl: string,
  folder: string,
): Promise<string> {
  const response = await fetch(sourceUrl)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`)
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg'
  const body = await response.arrayBuffer()

  const ext = contentType.includes('png') ? 'png' : 'jpg'
  const key = `${folder}/${crypto.randomUUID()}.${ext}`

  await env.R2_BUCKET.put(key, body, {
    httpMetadata: {contentType},
  })

  return `${env.R2_PUBLIC_URL}/${key}`
}
