import { useEffect } from 'react'

type PageSeoConfig = {
  description: string
  keywords?: string[]
  noindex?: boolean
  path?: string
  title: string
}

const SITE_NAME = 'Cimo School Teacher'
const SITE_URL = import.meta.env.VITE_SITE_URL?.trim() || 'https://school.cimoschool.xyz'
const OG_IMAGE_URL =
  import.meta.env.VITE_OG_IMAGE_URL?.trim() || `${SITE_URL}/brand/opengraph-1200x630.png`

function upsertMetaByName(name: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('name', name)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

function upsertMetaByProperty(property: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('property', property)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

function upsertCanonicalLink(href: string) {
  let element = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    document.head.appendChild(element)
  }

  element.setAttribute('href', href)
}

export function usePageSeo(config: PageSeoConfig) {
  const keywords = config.keywords?.join(', ') || ''

  useEffect(() => {
    const title = config.title.includes(SITE_NAME) ? config.title : `${config.title} | ${SITE_NAME}`
    const currentPath =
      config.path ?? `${window.location.pathname}${window.location.search}${window.location.hash}`
    const canonicalUrl = new URL(currentPath, SITE_URL).toString()
    const robots = config.noindex ? 'noindex,nofollow' : 'index,follow'

    document.title = title
    upsertMetaByName('description', config.description)
    upsertMetaByName('robots', robots)
    if (keywords) {
      upsertMetaByName('keywords', keywords)
    }

    upsertMetaByProperty('og:site_name', SITE_NAME)
    upsertMetaByProperty('og:type', 'website')
    upsertMetaByProperty('og:title', title)
    upsertMetaByProperty('og:description', config.description)
    upsertMetaByProperty('og:url', canonicalUrl)
    upsertMetaByProperty('og:image', OG_IMAGE_URL)

    upsertMetaByName('twitter:card', 'summary_large_image')
    upsertMetaByName('twitter:title', title)
    upsertMetaByName('twitter:description', config.description)
    upsertMetaByName('twitter:image', OG_IMAGE_URL)

    upsertCanonicalLink(canonicalUrl)
  }, [config.description, config.noindex, config.path, config.title, keywords])
}
