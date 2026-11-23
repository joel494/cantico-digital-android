export type HymnCollection = "alabanzas" | "armonia";

export interface HymnSection {
  label?: string | null;
  lines?: string[] | null;
  text?: string | null;
}

export interface Hymn {
  id: string;
  number: number;
  title: string;
  collection: HymnCollection;
  hymnalSlug: string;
  hymnalName: string;
  category?: string | null;
  scripture?: string | null;
  sections: HymnSection[];
  searchText: string;
}

export interface Hymnal {
  slug: string;
  name: string;
  collection: HymnCollection;
  hymns: Hymn[];
}

export interface BibleVerse {
  number: number;
  text: string;
}

export interface BibleChapter {
  number: number;
  verses: BibleVerse[];
}

export interface BibleBook {
  id: string;
  name: string;
  order: number;
  testament: "old" | "new";
  chapters: BibleChapter[];
}

export interface ContentManifestFile {
  name: string;
  url: string;
  bytes: number;
  sha256: string;
}

export interface ContentManifest {
  schema: number;
  version: string;
  generatedAt: string;
  counts: { hymns: number; verses: number };
  files: ContentManifestFile[];
}

export interface MobileContent {
  manifest: ContentManifest;
  hymnals: Hymnal[];
  bible: BibleBook[];
}
