import Link from 'next/link'
import { Badge, type BadgeTone } from '@/components/kit'
import { BlogPostMeta, CATEGORY_LABELS } from '@/lib/blog'

const CATEGORY_TONE: Record<BlogPostMeta['category'], BadgeTone> = {
  'how-to': 'accent',
  corporate: 'info',
  pulse: 'success',
  pakistan: 'magenta',
}

export default function BlogCard({ post }: { post: BlogPostMeta }) {
  const date = new Date(post.publishedAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-2xl bg-surface p-6 shadow-card transition-[background-color,transform] duration-150 hover:-translate-y-0.5 hover:bg-raised"
    >
      <Badge tone={CATEGORY_TONE[post.category]} className="self-start">{CATEGORY_LABELS[post.category]}</Badge>
      <h2 className="mt-4 text-[17px] font-semibold leading-snug tracking-tight text-fg">{post.title}</h2>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{post.excerpt}</p>
      <div className="mt-auto flex items-center justify-between pt-5 text-xs text-subtle">
        <span>{date}</span>
        <span>{post.readingTime} min read</span>
      </div>
    </Link>
  )
}
