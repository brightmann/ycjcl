# GitHub Pages

This fork uses local Markdown content, not the upstream author's private content repository.
The site rebuilds automatically on every push to `master`.

## Add a post

Create `content/blog/my-post.md`:

```md
---
title: My post
description: A short summary
pubDatetime: 2026-11-12T12:00:00Z
tags: [notes]
draft: false
---

Write your post here.
```

Posts directly in `content/blog/` appear on the main site. Only `.md` files
are picked up, not `.mdx`. For a Chinese post, use `content/blog/zh/` instead;
it appears in the Chinese section at `/zh/`. A post in `content/blog/en/`
behaves like one at the root. Use one location per post.

This example is documentation only. No sample posts are published.
Optional About pages go in `content/about/en.md` and `content/about/zh.md`,
with `title` in their frontmatter. Put images in `public/` and link using the
site's `/ycjcl/` prefix, for example `/ycjcl/images/photo.jpg`.

## Build locally

Use Node 20.19.0 and pnpm 10.6.5:

```sh
pnpm install --frozen-lockfile
node scripts/build-pages.mjs
```

The Pages adapter configures the project subpath, fixes root-relative template
links and search assets, handles empty post lists, and builds from local content.
It restores the upstream source files after building. Output is in `dist/`.
Use this command instead of `pnpm build`, whose upstream prebuild script expects
access to the original author's content repository. No content token is needed.
