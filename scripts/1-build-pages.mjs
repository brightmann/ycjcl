// GitHub Pages adapter. Keep upstream source unchanged between builds.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const base = '/ycjcl/'
const saved = new Map()
function patch(file, transform) {
  const original = readFileSync(file, 'utf8')
  if (!saved.has(file)) saved.set(file, original)
  writeFileSync(file, transform(original))
}
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = `${dir}/${entry.name}`
    return entry.isDirectory() ? files(path) : [path]
  })
}
try {
  // Use committed content, never the upstream author's private content service.
  for (const dir of ['content/blog/en', 'content/blog/zh', 'content/about']) {
    mkdirSync(dir, { recursive: true })
  }
  patch('astro.config.ts', s => s.replace('site: SITE.website,', `site: SITE.website,\n  base: '${base}',`))
  patch('src/config.ts', s => s.replace('https://rustc.cloud/', 'https://brightmann.github.io/ycjcl/'))

  // Astro prefixes generated asset/i18n links. Prefix the template's remaining
  // hard-coded root links too, including search, RSS, and theme resources.
  for (const file of files('src').filter(f => f.endsWith('.astro'))) {
    patch(file, s => s
      .replace(/(href|src)="\/(?!\/)([^"{}]*)"/g, (_, attr, path) => `${attr}={import.meta.env.BASE_URL + '${path}'}`)
      .replace(/(href|src)=\{"\/(?!\/)([^"{}]*)"\}/g, (_, attr, path) => `${attr}={import.meta.env.BASE_URL + '${path}'}`)
      .replace('href={`/tags/', 'href={`${import.meta.env.BASE_URL}tags/')
      .replace('backUrl ?? "/"', 'backUrl ?? import.meta.env.BASE_URL')
      .replace('element: "#pagefind-search",', 'element: "#pagefind-search",\n        bundlePath: import.meta.env.BASE_URL + "pagefind/",'))
  }
  patch('src/i18n/utils.ts', s => s.replace('const localizedPath = getRelativeLocaleUrl(locale, path, options)', `if (path.startsWith(import.meta.env.BASE_URL)) path = '/' + path.slice(import.meta.env.BASE_URL.length)
  const localizedPath = getRelativeLocaleUrl(locale, path, options)`))
  // A genuinely empty blog should have a useful home and an accessible post list.
  patch('src/pages/[...locale]/index.astro', s => s.replace('<div class="my-8 text-center">', `<div class="my-8 text-center">\n      {posts.length === 0 && <p class="mb-6">No posts yet.</p>}`))
  patch('src/pages/[...locale]/posts/[...page].astro', s => s.replace('return paginate(getSortedPosts(posts), {', `if (posts.length === 0) return [{\n      params: { locale: locale === DEFAULT_LOCALE ? undefined : locale, page: undefined },\n      props: { page: { data: [], start: 0, end: 0, size: SITE.postPerPage, total: 0, currentPage: 1, lastPage: 1, url: {} } },\n    }];\n    return paginate(getSortedPosts(posts), {`))

  // Avoid claiming the upstream author's identity on Brite's empty blog.
  for (const locale of ['en', 'zh']) {
    patch(`src/i18n/locales/${locale}.ts`, s => s.replace(/"site.title": "[^"]*"/, '"site.title": "Blog"').replace(/"site.desc": "[^"]*"/, '"site.desc": "A Markdown blog"'))
  }
  execFileSync('node_modules/.bin/astro', ['build'], { stdio: 'inherit' })
  execFileSync('node_modules/.bin/pagefind', ['--site', 'dist'], { stdio: 'inherit' })
  writeFileSync('dist/.nojekyll', '')
} finally {
  for (const [file, original] of saved) writeFileSync(file, original)
}
