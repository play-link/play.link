export function formatAdminSlug(
  requestedSlug: string | null | undefined,
  realSlug: string | null | undefined,
) {
  if (requestedSlug && realSlug && requestedSlug !== realSlug) {
    return `${requestedSlug} (${realSlug})`
  }

  return requestedSlug || realSlug || null
}
