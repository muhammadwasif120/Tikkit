import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const CONTENT_DIR = path.join(process.cwd(), 'src/content/blog')

export type BlogPost = {
  slug: string
  title: string
  description: string
  publishedAt: string
  updatedAt?: string
  category: 'how-to' | 'corporate' | 'pulse' | 'pakistan'
  keywords: string[]
  readingTime: number
  pillar?: string
  excerpt: string
  author: string
  authorTitle: string
  content: string
}

export type BlogPostMeta = Omit<BlogPost, 'content'>

function estimateReadingTime(content: string): number {
  const words = content.split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

export function getAllPosts(): BlogPostMeta[] {
  if (!fs.existsSync(CONTENT_DIR)) return []

  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.mdx'))

  const posts = files.map(filename => {
    const slug = filename.replace('.mdx', '')
    const raw = fs.readFileSync(path.join(CONTENT_DIR, filename), 'utf-8')
    const { data, content } = matter(raw)

    return {
      slug,
      title: data.title ?? '',
      description: data.description ?? '',
      publishedAt: data.publishedAt ?? '',
      updatedAt: data.updatedAt,
      category: data.category ?? 'how-to',
      keywords: data.keywords ?? [],
      readingTime: estimateReadingTime(content),
      pillar: data.pillar,
      excerpt: data.excerpt ?? data.description ?? '',
      author: data.author ?? 'Muhammad Wasif',
      authorTitle: data.authorTitle ?? 'Founder, Two Bit Digital Ltd',
    } as BlogPostMeta
  })

  return posts.sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)

  return {
    slug,
    title: data.title ?? '',
    description: data.description ?? '',
    publishedAt: data.publishedAt ?? '',
    updatedAt: data.updatedAt,
    category: data.category ?? 'how-to',
    keywords: data.keywords ?? [],
    readingTime: estimateReadingTime(content),
    pillar: data.pillar,
    excerpt: data.excerpt ?? data.description ?? '',
    author: data.author ?? 'Muhammad Wasif',
    authorTitle: data.authorTitle ?? 'Founder, Two Bit Digital Ltd',
    content,
  }
}

export function getPostsByCategory(category: BlogPost['category']): BlogPostMeta[] {
  return getAllPosts().filter(p => p.category === category)
}

export const CATEGORY_LABELS: Record<BlogPost['category'], string> = {
  'how-to': 'Platform Guide',
  'corporate': 'Corporate Events',
  'pulse': 'Wellness & Retreats',
  'pakistan': 'Pakistan Events',
}

export const CATEGORY_COLORS: Record<BlogPost['category'], string> = {
  'how-to': '#1E5EFF',
  'corporate': '#0F1724',
  'pulse': '#7C9A7E',
  'pakistan': '#FFC745',
}
