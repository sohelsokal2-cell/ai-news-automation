-- Add region column to sources table
ALTER TABLE sources ADD COLUMN IF NOT EXISTS region text NOT NULL DEFAULT 'bangladesh';

-- Seed 10 RSS sources
INSERT INTO sources (source_name, feed_url, region, is_active, created_at, updated_at)
VALUES
  ('প্রথম আলো', 'https://www.prothomalo.com/feed/', 'bangladesh', true, NOW(), NOW()),
  ('The Daily Star', 'https://www.thedailystar.net/frontpage/rss.xml', 'bangladesh', true, NOW(), NOW()),
  ('bdnews24', 'https://bdnews24.com/?widgetName=rssfeed&widgetId=1150&getXmlFeed=true', 'bangladesh', true, NOW(), NOW()),
  ('Kaler Kantho', 'https://www.kalerkantho.com/rss.xml', 'bangladesh', true, NOW(), NOW()),
  ('Jugantor', 'https://www.jugantor.com/feed/rss.xml', 'bangladesh', true, NOW(), NOW()),
  ('Jago News 24', 'https://www.jagonews24.com/rss/rss.xml', 'bangladesh', true, NOW(), NOW()),
  ('Bangla News 24', 'https://www.banglanews24.com/rss/rss.xml', 'bangladesh', true, NOW(), NOW()),
  ('BBC News', 'https://feeds.bbci.co.uk/news/rss.xml', 'international', true, NOW(), NOW()),
  ('Al Jazeera', 'https://www.aljazeera.com/xml/rss/all.xml', 'international', true, NOW(), NOW()),
  ('CNN', 'https://rss.cnn.com/rss/edition.rss', 'international', true, NOW(), NOW())
ON CONFLICT (feed_url) DO NOTHING;
