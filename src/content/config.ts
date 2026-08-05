import { defineCollection, z } from 'astro:content';

const postsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    date: z.string(),
    tags: z.array(z.string()).default([]),
    summary: z.string().default(''),
    cover: z.string().default(''),
    cover_ascii: z.string().default(''),
    word_count: z.number().default(0),
  }),
});

export const collections = {
  posts: postsCollection,
};