import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  nameBn: text("name_bn").notNull(),
  nameEn: text("name_en").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sources = pgTable(
  "sources",
  {
    id: serial("id").primaryKey(),
    sourceName: text("source_name").notNull(),
    sourceType: text("source_type").notNull().default("rss"),
    feedUrl: text("feed_url").notNull(),
    websiteUrl: text("website_url"),
    region: text("region").notNull().default("bangladesh"),
    categoryHint: text("category_hint"),
    isActive: boolean("is_active").default(true).notNull(),
    licenseNotes: text("license_notes"),
    attributionRequired: boolean("attribution_required").default(true).notNull(),
    pollInterval: integer("poll_interval").default(900).notNull(),
    lastFetchedAt: timestamp("last_fetched_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("sources_feed_url_idx").on(table.feedUrl),
  ],
);

export const collectedItems = pgTable(
  "collected_items",
  {
    id: serial("id").primaryKey(),
    sourceName: text("source_name").notNull(),
    sourceLink: text("source_link").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull(),
    fullText: text("full_text"),
    imageUrl: text("image_url"),
    pubDate: timestamp("pub_date", { withTimezone: true }),
    categoryHint: text("category_hint"),
    status: text("status").notNull().default("pending"),
    duplicateOf: integer("duplicate_of"),
    retryCount: integer("retry_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("collected_source_link_idx").on(table.sourceLink),
  ],
);

export const articles = pgTable(
  "articles",
  {
    id: serial("id").primaryKey(),
    collectedItemId: integer("collected_item_id").references(() => collectedItems.id),
    categoryId: integer("category_id").references(() => categories.id),
    bnHeadline: text("bn_headline").notNull(),
    bnSummary: text("bn_summary").notNull(),
    bnBody: text("bn_body").notNull(),
    enHeadline: text("en_headline").notNull(),
    enSummary: text("en_summary").notNull(),
    enBody: text("en_body").notNull(),
    slug: text("slug").notNull(),
    seoTitle: text("seo_title"),
    metaDescription: text("meta_description"),
    imageUrl: text("image_url"),
    sourceName: text("source_name"),
    sourceUrl: text("source_url"),
    pubDate: timestamp("pub_date", { withTimezone: true }),
    status: text("status").notNull().default("held"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("articles_slug_idx").on(table.slug),
    index("articles_status_idx").on(table.status),
    index("articles_category_idx").on(table.categoryId),
  ],
);

export const pipelineRuns = pgTable("pipeline_runs", {
  id: serial("id").primaryKey(),
  status: text("status").notNull().default("running"), // running | ok | failed
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  collected: integer("collected"),
  duplicates: integer("duplicates"),
  published: integer("published"),
  held: integer("held"),
  failed: integer("failed"),
  errors: text("errors"),
});

export const ads = pgTable(
  "ads",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    // Slot placement on the public site: header | sidebar | in-article | footer
    slot: text("slot").notNull().default("sidebar"),
    imageUrl: text("image_url"),
    linkUrl: text("link_url"),
    // Raw HTML/script (e.g. AdSense). Rendered as-is; trusted admin input only.
    html: text("html"),
    isActive: boolean("is_active").default(true).notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    priority: integer("priority").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("ads_slot_idx").on(table.slot)],
);

export type Category = typeof categories.$inferSelect;
export type PipelineRun = typeof pipelineRuns.$inferSelect;
export type Source = typeof sources.$inferSelect;
export type CollectedItem = typeof collectedItems.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type Ad = typeof ads.$inferSelect;
