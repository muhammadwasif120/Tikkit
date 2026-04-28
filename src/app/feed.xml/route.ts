import { getAllPosts, CATEGORY_LABELS } from '@/lib/blog'

const BASE_URL = 'https://www.tikkitx.com'

export async function GET() {
  const posts = getAllPosts()

  const items = posts
    .map(post => {
      const url = `${BASE_URL}/blog/${post.slug}`
      const pubDate = new Date(post.publishedAt).toUTCString()
      const category = CATEGORY_LABELS[post.category] ?? post.category

      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description><![CDATA[${post.description}]]></description>
      <pubDate>${pubDate}</pubDate>
      <category><![CDATA[${category}]]></category>
      <dc:creator><![CDATA[Tikkit Team]]></dc:creator>
    </item>`
    })
    .join('\n')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom"
>
  <channel>
    <title>Tikkit Blog — Event Planning Guides for Pakistan</title>
    <link>${BASE_URL}/blog</link>
    <description>Practical how-to guides, corporate event playbooks, wellness retreat planning, and Pakistan event scene insights — powered by Tikkit.</description>
    <language>en-PK</language>
    <managingEditor>hello@tikkitx.com (Tikkit Team)</managingEditor>
    <webMaster>hello@tikkitx.com (Tikkit Team)</webMaster>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${BASE_URL}/tikkit-logo.svg</url>
      <title>Tikkit Blog</title>
      <link>${BASE_URL}/blog</link>
    </image>
${items}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
