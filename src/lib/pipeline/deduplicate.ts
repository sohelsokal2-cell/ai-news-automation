import { db } from "@/db";
import { collectedItems } from "@/db/schema";
import { eq } from "drizzle-orm";

const SIMILARITY_THRESHOLD = 0.8;

function tokenize(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]+/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1),
  );
}

function jaccardSimilarity(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (!ta.size || !tb.size) return 0;
  let overlap = 0;
  for (const t of ta) if (tb.has(t)) overlap++;
  const union = ta.size + tb.size - overlap;
  return union === 0 ? 0 : overlap / union;
}

class UnionFind {
  private parent: Map<number, number>;
  private rank: Map<number, number>;

  constructor(ids: number[]) {
    this.parent = new Map();
    this.rank = new Map();
    for (const id of ids) {
      this.parent.set(id, id);
      this.rank.set(id, 0);
    }
  }

  find(x: number): number {
    if (this.parent.get(x) !== x) {
      this.parent.set(x, this.find(this.parent.get(x)!));
    }
    return this.parent.get(x)!;
  }

  union(a: number, b: number): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return;
    const rankA = this.rank.get(ra)!;
    const rankB = this.rank.get(rb)!;
    if (rankA < rankB) {
      this.parent.set(ra, rb);
    } else if (rankA > rankB) {
      this.parent.set(rb, ra);
    } else {
      this.parent.set(rb, ra);
      this.rank.set(ra, rankA + 1);
    }
  }

  groups(): Map<number, number[]> {
    const map = new Map<number, number[]>();
    for (const id of this.parent.keys()) {
      const root = this.find(id);
      const group = map.get(root);
      if (group) {
        group.push(id);
      } else {
        map.set(root, [id]);
      }
    }
    return map;
  }
}

type PendingItem = {
  id: number;
  title: string;
  excerpt: string;
  fullText: string | null;
  pubDate: Date | null;
};

function contentLength(item: PendingItem): number {
  return (item.fullText || item.excerpt || "").length;
}

function pickPrimary(group: PendingItem[]): PendingItem {
  return group.reduce((best, cur) => {
    const bestLen = contentLength(best);
    const curLen = contentLength(cur);
    if (curLen > bestLen) return cur;
    if (curLen < bestLen) return best;
    if (best.pubDate && cur.pubDate) {
      return cur.pubDate < best.pubDate ? cur : best;
    }
    if (!best.pubDate && cur.pubDate) return cur;
    return best;
  });
}

export type DedupeResult = {
  totalPending: number;
  groupsFound: number;
  duplicatesMarked: number;
  primaryIds: number[];
};

export async function deduplicate(): Promise<DedupeResult> {
  const pending = await db
    .select({
      id: collectedItems.id,
      title: collectedItems.title,
      excerpt: collectedItems.excerpt,
      fullText: collectedItems.fullText,
      pubDate: collectedItems.pubDate,
    })
    .from(collectedItems)
    .where(eq(collectedItems.status, "pending"))
    .limit(200);

  const result: DedupeResult = {
    totalPending: pending.length,
    groupsFound: 0,
    duplicatesMarked: 0,
    primaryIds: [],
  };

  if (pending.length < 2) {
    result.primaryIds = pending.map((p) => p.id);
    return result;
  }

  const uf = new UnionFind(pending.map((p) => p.id));

  for (let i = 0; i < pending.length; i++) {
    for (let j = i + 1; j < pending.length; j++) {
      const sim = jaccardSimilarity(pending[i].title, pending[j].title);
      if (sim >= SIMILARITY_THRESHOLD) {
        uf.union(pending[i].id, pending[j].id);
      }
    }
  }

  const groups = uf.groups();
  const itemMap = new Map(pending.map((p) => [p.id, p]));
  const duplicateIds: number[] = [];
  const primaryIds: number[] = [];
  const dupToPrimary = new Map<number, number>();

  for (const memberIds of groups.values()) {
    if (memberIds.length < 2) {
      primaryIds.push(memberIds[0]);
      continue;
    }

    result.groupsFound++;
    const members = memberIds.map((id) => itemMap.get(id)!);
    const primary = pickPrimary(members);
    primaryIds.push(primary.id);

    for (const member of members) {
      if (member.id !== primary.id) {
        duplicateIds.push(member.id);
        dupToPrimary.set(member.id, primary.id);
      }
    }
  }

  if (duplicateIds.length > 0) {
    await db.transaction(async (tx) => {
      for (const dupId of duplicateIds) {
        const primaryId = dupToPrimary.get(dupId);
        if (primaryId) {
          await tx
            .update(collectedItems)
            .set({ status: "duplicate", duplicateOf: primaryId })
            .where(eq(collectedItems.id, dupId));
          result.duplicatesMarked++;
        }
      }
    });
  }

  result.primaryIds = primaryIds;
  return result;
}
