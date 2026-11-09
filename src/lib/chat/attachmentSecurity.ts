/**
 * Security & in-memory processing for ephemeral file attachments (Option A: $0 storage).
 * Files exist only in-memory during the request and are never written to disk or database.
 */

export interface AttachmentInput {
  name: string;
  type: string;
  base64: string;
}

export interface ProcessedAttachment {
  type: "image" | "document";
  fileName: string;
  dataUrl?: string; // for images (passed to multimodal vision)
  extractedText?: string; // for pdf/text (injected into prompt)
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const DANGEROUS_EXTENSIONS = [
  ".svg",
  ".html",
  ".htm",
  ".exe",
  ".bat",
  ".cmd",
  ".sh",
  ".js",
  ".mjs",
  ".php",
  ".jar",
  ".vbs",
  ".scr",
];

const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".pdf",
  ".txt",
  ".md",
  ".py",
  ".csv",
];

/**
 * Checks magic bytes to verify file format regardless of claimed extension or MIME type.
 */
function verifyMagicBytes(buffer: Buffer, ext: string): { valid: boolean; detectedMime: string } {
  if (buffer.length < 4) return { valid: false, detectedMime: "unknown" };

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: [".jpg", ".jpeg"].includes(ext), detectedMime: "image/jpeg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { valid: ext === ".png", detectedMime: "image/png" };
  }

  // WEBP: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: ext === ".webp", detectedMime: "image/webp" };
  }

  // PDF: %PDF- (25 50 44 46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return { valid: ext === ".pdf", detectedMime: "application/pdf" };
  }

  // Plain text / code (ASCII / UTF-8 without NUL bytes)
  if ([".txt", ".md", ".py", ".csv"].includes(ext)) {
    for (let i = 0; i < Math.min(buffer.length, 1024); i++) {
      if (buffer[i] === 0) {
        return { valid: false, detectedMime: "application/octet-stream" };
      }
    }
    return { valid: true, detectedMime: "text/plain" };
  }

  return { valid: false, detectedMime: "unknown" };
}

/**
 * Validates and parses an uploaded attachment safely in memory.
 * No data is saved to disk or persistent databases.
 */
export async function validateAndProcessAttachment(
  att: AttachmentInput
): Promise<ProcessedAttachment> {
  const cleanName = (att.name || "attachment").replace(/[^a-zA-Z0-9._-]/g, "_");
  const ext = cleanName.slice(cleanName.lastIndexOf(".")).toLowerCase();

  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    throw new Error(
      `File format "${ext}" is not supported for security reasons. Please upload JPG, PNG, WEBP, or PDF.`
    );
  }

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(
      `Unsupported file type "${ext}". Supported types: JPG, PNG, WEBP, PDF, TXT.`
    );
  }

  // Strip possible data URI header (e.g. data:image/png;base64,...)
  let base64Data = att.base64;
  if (base64Data.includes(",")) {
    base64Data = base64Data.split(",")[1];
  }

  const buffer = Buffer.from(base64Data, "base64");

  if (buffer.length > MAX_SIZE_BYTES) {
    throw new Error(
      `File is too large (${(buffer.length / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 5 MB.`
    );
  }

  const { valid, detectedMime } = verifyMagicBytes(buffer, ext);
  if (!valid) {
    throw new Error(
      `File verification failed. The file contents do not match its declared extension "${ext}".`
    );
  }

  // Process Document (PDF)
  if (detectedMime === "application/pdf") {
    try {
      // Dynamic import to prevent client bundling issues
      // @ts-ignore
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      const extracted = (textResult?.text || "").trim();

      if (extracted.length > 10) {
        return {
          type: "document",
          fileName: cleanName,
          extractedText: extracted.slice(0, 20000), // Cap extracted text to ~20k chars
        };
      }
    } catch (pdfErr: any) {
      console.warn("[Attachment Security] PDF text extraction warning:", pdfErr?.message);
    }

    // If PDF has no text layer (scanned handwritten), treat as empty or fallback
    return {
      type: "document",
      fileName: cleanName,
      extractedText: `[Note: PDF "${cleanName}" was attached, but contains scanned images or no extractable text layer. Please attach photos as PNG or JPG for visual solving.]`,
    };
  }

  // Process Plain Text / Code / CSV
  if (detectedMime === "text/plain") {
    const text = buffer.toString("utf-8", 0, 30000);
    return {
      type: "document",
      fileName: cleanName,
      extractedText: text,
    };
  }

  // Process Images (JPEG, PNG, WEBP)
  return {
    type: "image",
    fileName: cleanName,
    dataUrl: `data:${detectedMime};base64,${buffer.toString("base64")}`,
  };
}

