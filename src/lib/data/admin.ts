import 'server-only'
import { redirect } from 'next/navigation'
import { getViewer } from './viewer'

export async function requireAdmin() {
  const viewer = await getViewer()
  if (!viewer || viewer.profile.role !== 'admin') redirect('/master/login')
  return viewer
}
