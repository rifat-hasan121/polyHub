import { createHash } from "node:crypto";
import * as cheerio from "cheerio";

const BTEB_NOTICES_URL = "http://www.bteb.gov.bd/site/view/notices";
const BTEB_ORIGIN = "http://www.bteb.gov.bd";
const importantTerms = ["বিজ্ঞপ্তি", "ফরম পূরণ", "রুটিন"];
const resultTerms = ["ফলাফল", "রেজাল্ট"];

export type BtebNotice = {
  btebId: string;
  title: string;
  publishDate: string | null;
  fileUrl: string;
  isImportant: boolean;
  isResultPdf: boolean;
};

function makeBtebId(sourceUrl: string, title: string) {
  const slug = new URL(sourceUrl).pathname
    .split("/")
    .filter(Boolean)
    .at(-1)
    ?.replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug) return `bteb-${slug}`;
  const titleHash = createHash("sha256").update(title).digest("hex").slice(0, 20);
  return `bteb-${titleHash}`;
}

function normalizePublishDate(value: string) {
  const cleaned = value
    .replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)))
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return null;

  const match = cleaned.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (!match) return cleaned;

  const [, first, second, year] = match;
  const day = Number(first);
  const month = Number(second);
  if (day > 12) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  if (month > 12) {
    return `${year}-${String(day).padStart(2, "0")}-${String(month).padStart(2, "0")}`;
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isPdfUrl(fileUrl: string) {
  return new URL(fileUrl).pathname.toLowerCase().endsWith(".pdf");
}

export function parseBtebNoticeHtml(html: string): BtebNotice[] {
  const $ = cheerio.load(html);
  const notices: BtebNotice[] = [];
  const seen = new Set<string>();

  $("table tbody tr, table tr").each((_rowIndex, row) => {
    const cells = $(row).find("td");
    if (cells.length === 0) return;

    const links = $(row)
      .find("a[href]")
      .toArray()
      .map((anchor) => ({
        title: $(anchor).text().replace(/\s+/g, " ").trim(),
        url: new URL($(anchor).attr("href") ?? "", BTEB_ORIGIN).toString(),
      }))
      .filter(({ url }) => ["http:", "https:"].includes(new URL(url).protocol));
    if (links.length === 0) return;

    const fileLink =
      links.find(
        ({ title, url }) =>
          isPdfUrl(url) ||
          /download|attachment|ফাইল|ডাউনলোড/i.test(title) ||
          /download|attachment/i.test(url) ||
          (!title && new URL(url).origin !== BTEB_ORIGIN),
      ) ?? links[0];
    if (!fileLink) return;

    const title =
      cells
        .toArray()
        .map((cell) => $(cell).text().replace(/\s+/g, " ").trim())
        .find(
          (text) =>
            text.length > 2 &&
            !/^\d+$/.test(text) &&
            !/[0-9০-৯]{1,4}[./-][0-9০-৯]{1,2}[./-][0-9০-৯]{2,4}/.test(text) &&
            !/^(দেখুন|view|download|ডাউনলোড)$/i.test(text),
        ) ??
      links.find(({ title }) => title.length > 2 && !/^(দেখুন|view|download|ডাউনলোড)$/i.test(title))
        ?.title ??
      "";
    if (!title) return;

    const dateCell = cells
      .toArray()
      .map((cell) => $(cell).text().replace(/\s+/g, " ").trim())
      .find((text) => /[0-9০-৯]{1,4}[./-][0-9০-৯]{1,2}[./-][0-9০-৯]{2,4}/.test(text));
    const publishDate = dateCell ? normalizePublishDate(dateCell) : null;
    const btebId = makeBtebId(fileLink.url, title);
    if (seen.has(btebId)) return;
    seen.add(btebId);

    const normalizedTitle = title.toLocaleLowerCase();
    const isImportant = importantTerms.some((term) => normalizedTitle.includes(term));
    const isResultPdf =
      resultTerms.some((term) => normalizedTitle.includes(term)) &&
      isPdfUrl(fileLink.url);

    notices.push({
      btebId,
      title,
      publishDate,
      fileUrl: fileLink.url,
      isImportant,
      isResultPdf,
    });
  });

  return notices;
}

export async function scrapeBtebNotices(): Promise<BtebNotice[]> {
  const response = await fetch(BTEB_NOTICES_URL, {
    headers: { "User-Agent": "PolyHub BTEB notices scraper/1.0" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`BTEB notices request failed with HTTP ${response.status}.`);
  }

  return parseBtebNoticeHtml(await response.text());
}

export const fetchLatestBTEBNotices = scrapeBtebNotices;

export { BTEB_NOTICES_URL };
