import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://contribute.solana.com', // Replace with actual domain
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]
}
