import type {Context, Next} from 'hono'
import type {AppContext} from '../types'

/**
 * Middleware: Validates JWT token and sets user in context
 */
export async function authMiddleware(c: Context<AppContext>, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    c.set('user', null)
    return next()
  }

  const token = authHeader.slice(7)

  try {
    const supabase = c.get('supabase')
    const {
      data: {user},
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      c.set('user', null)
    } else {
      c.set('user', {
        id: user.id,
        email: user.email ?? '',
      })
    }
  } catch {
    c.set('user', null)
  }

  return next()
}

/**
 * Helper: Returns 401 if user is not authenticated
 */
export function requireAuth(c: Context<AppContext>) {
  const user = c.get('user')
  if (!user) {
    return c.json({error: 'Unauthorized'}, 401)
  }
  return null
}
