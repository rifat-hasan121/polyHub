import { timingSafeEqual } from "node:crypto";
import { connection, NextResponse } from "next/server";
import { headers } from "next/headers";
import { fetchLatestBTEBNotices } from "@/lib/scrapers/bteb-scraper";
import { parseBTEBResultPdf } from "@/lib/scrapers/result-parser";
import { prisma } from "@/lib/prisma";

const relevantTerms = ["ডিপ্লোমা", "পলিটেকনিক", "সেমিস্টার", "পরীক্ষা"];
const allowedPdfHosts = new Set([
  "bteb.gov.bd",
  "www.bteb.gov.bd",
  "objectstorage.ap-dcc-gazipur-1.oraclecloud15.com",
]);
const maximumPdfBytes = 20 * 1024 * 1024;

function isAuthorized(requestHeaders: Pick<Headers, "get">, secret: string) {
  const authorization = requestHeaders.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const provided = Buffer.from(authorization);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

function isRelevantNotice(title: string) {
  const normalizedTitle = title.toLocaleLowerCase();
  return relevantTerms.some((term) => normalizedTitle.includes(term));
}

function isAllowedPdfUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      allowedPdfHosts.has(url.hostname.toLowerCase()) &&
      url.pathname.toLowerCase().endsWith(".pdf")
    );
  } catch {
    return false;
  }
}

async function downloadPdf(url: string) {
  if (!isAllowedPdfUrl(url)) {
    throw new Error("The result PDF URL is not from an allowed BTEB host.");
  }

  const response = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(`Result PDF request failed with HTTP ${response.status}.`);
  }

  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maximumPdfBytes) {
    throw new Error("Result PDF exceeds the 20 MB processing limit.");
  }
  if (!response.body) {
    throw new Error("Result PDF response did not contain a body.");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maximumPdfBytes) {
        await reader.cancel();
        throw new Error("Result PDF exceeds the 20 MB processing limit.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const pdfBuffer = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
  if (!pdfBuffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
    throw new Error("Downloaded result file is not a valid PDF.");
  }
  return pdfBuffer;
}

export async function GET() {
  await connection();
  const requestHeaders = await headers();
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("CRON_SECRET is not configured.");
    return NextResponse.json(
      { error: "Cron endpoint is not configured." },
      { status: 500 },
    );
  }
  if (!isAuthorized(requestHeaders, secret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let notices;
  try {
    notices = await fetchLatestBTEBNotices();
  } catch (error) {
    console.error("Failed to fetch BTEB notices:", error);
    return NextResponse.json(
      { error: "Unable to fetch BTEB notices." },
      { status: 502 },
    );
  }

  let processedNotices = 0;
  let parsedResultsCount = 0;
  const relevantNotices = notices.filter(({ title }) => isRelevantNotice(title));

  for (const notice of relevantNotices) {
    try {
      const existing = await prisma.btebNotice.findUnique({
        where: { btebId: notice.btebId },
        select: { id: true },
      });

      const savedNotice = await prisma.btebNotice.upsert({
        where: { btebId: notice.btebId },
        create: {
          btebId: notice.btebId,
          title: notice.title,
          publishDate: notice.publishDate,
          fileUrl: notice.fileUrl,
          isImportant: notice.isImportant,
          isResultPdf: notice.isResultPdf,
        },
        update: {
          title: notice.title,
          publishDate: notice.publishDate,
          fileUrl: notice.fileUrl,
          isImportant: notice.isImportant,
          isResultPdf: notice.isResultPdf,
        },
        select: { id: true },
      });
      processedNotices += 1;

      if (!existing && notice.isResultPdf) {
        try {
          const pdfBuffer = await downloadPdf(notice.fileUrl);
          const results = await parseBTEBResultPdf(pdfBuffer);
          if (results.length > 0) {
            const inserted = await prisma.examResult.createMany({
              data: results.map((result) => ({
                noticeId: savedNotice.id,
                roll: result.roll,
                gpa: result.gpa,
                passed: result.passed,
                failedSubjects: result.failedSubjects,
              })),
              skipDuplicates: true,
            });
            parsedResultsCount += inserted.count;
          }
        } catch (error) {
          console.error(`Failed to process result PDF for notice ${notice.btebId}:`, error);
        }
      }
    } catch (error) {
      console.error(`Failed to sync BTEB notice ${notice.btebId}:`, error);
    }
  }

  return NextResponse.json({
    success: true,
    processedNotices,
    parsedResultsCount,
    timestamp: new Date().toISOString(),
  });
}
