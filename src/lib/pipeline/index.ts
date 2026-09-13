import { collectAllFeeds, type CollectResult } from "@/lib/collector/rss";
import { extractPendingItems, type ExtractResult } from "@/lib/collector/extract";
import { deduplicate, type DedupeResult } from "@/lib/pipeline/deduplicate";
import { writePending, type WriteResult } from "@/lib/pipeline/writer";
import { runRuleEngine, type RuleEngineResult } from "@/lib/pipeline/rule-engine";

export type PipelineResult = {
  collect: CollectResult[];
  extract: ExtractResult[];
  deduplicate: DedupeResult;
  write: WriteResult[];
  ruleEngine: RuleEngineResult;
};

export async function runFullPipeline(): Promise<PipelineResult> {
  // Phase 1: Collect RSS feeds (parallel per feed, pollInterval respected)
  const collect = await collectAllFeeds();

  // Phase 2: Extract full text (parallel per item, bounded concurrency)
  const extract = await extractPendingItems();

  // Phase 3: Deduplicate pending items
  const deduplicateResult = await deduplicate();

  // Phase 4: AI writer (batched, with fallback)
  const write = await writePending();

  // Phase 5: Rule engine validation + insert into articles
  const allWritten = write.flatMap((w) => w.written);
  const ruleEngine = allWritten.length > 0
    ? await runRuleEngine(allWritten)
    : { published: 0, failed: 0, details: [] };

  return {
    collect,
    extract,
    deduplicate: deduplicateResult,
    write,
    ruleEngine,
  };
}
