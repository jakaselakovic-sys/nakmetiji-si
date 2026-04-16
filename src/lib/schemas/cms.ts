import { z } from "zod";

export const storySchema = z.object({
  title: z.string().min(5, "Naslov mora biti dolg vsaj 5 znakov."),
  slug: z.string().min(3),
  excerpt: z.string().min(10, "Kratek povzetek je obvezen."),
  content_html: z.string().min(20, "Vsebina je prekrata."),
  content_json: z.any().optional(), // Tiptap state
  type: z.enum(["news", "blog"]),
  category: z.enum(["nasveti", "recepti", "dogodki", "intervjuji", "splosno"]),
  status: z.enum(["draft", "published", "archived"]),
  related_farm_id: z.string().uuid().optional().nullable(),
  metadata: z
    .object({
      focus_keywords: z.array(z.string()).optional(),
      meta_description: z.string().optional(),
      og_caption: z.string().optional(),
    })
    .optional(),
});

export type StoryInput = z.infer<typeof storySchema>;
