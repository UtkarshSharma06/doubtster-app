"use client";

import React, { useState, useEffect } from "react";

interface ImagePayload {
  query?: string;
  caption?: string;
}

interface ImageApiResult {
  found: boolean;
  url?: string;
  title?: string;
  author?: string;
  license?: string;
  filePageUrl?: string;
}

export function ImageVisual({
  rawJson,
  onImageStatus,
}: {
  rawJson: string;
  onImageStatus?: (found: boolean) => void;
}) {
  const [data, setData] = useState<ImageApiResult | null>(null);
  const [loading, setLoading] = useState(true);

  let query = "";
  let caption = "";
  try {
    let cleaned = rawJson.trim();
    if (cleaned.startsWith("```json")) cleaned = cleaned.replace(/^```json\s*/i, "");
    if (cleaned.endsWith("```")) cleaned = cleaned.replace(/\s*```$/, "");
    const parsed: ImagePayload = JSON.parse(cleaned);
    query = parsed.query || "";
    caption = parsed.caption || "";
  } catch (err) {
    // If not json, use raw string as query
    query = rawJson.trim();
  }

  useEffect(() => {
    if (!query) {
      setLoading(false);
      onImageStatus?.(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetch(`/api/image?q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((resData: ImageApiResult) => {
        if (!isMounted) return;
        setLoading(false);
        if (resData && resData.found && resData.url) {
          setData(resData);
          onImageStatus?.(true);
        } else {
          setData({ found: false });
          onImageStatus?.(false);
        }
      })
      .catch((err) => {
        console.warn("Fetch image failed:", err);
        if (isMounted) {
          setLoading(false);
          setData({ found: false });
          onImageStatus?.(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [query]);

  if (loading) {
    return (
      <div className="doubtster-image-loading" aria-label="Searching Wikimedia Commons">
        <div className="doubtster-image-spinner" />
        <span className="doubtster-image-loading-text">Finding image...</span>
      </div>
    );
  }

  // If nothing found: show nothing (no broken image)
  if (!data || !data.found || !data.url) {
    return null;
  }

  return (
    <div className="doubtster-image-container">
      <div className="doubtster-image-frame">
        <img
          src={data.url}
          alt={caption || data.title || query}
          className="doubtster-image-element"
          loading="lazy"
          crossOrigin="anonymous"
        />
      </div>
      <div className="doubtster-image-footer">
        {caption && <div className="doubtster-image-caption">{caption}</div>}
        <div className="doubtster-image-credit">
          Image: {data.author || "Contributor"},{" "}
          <span className="doubtster-image-license">{data.license || "Free License"}</span>, via{" "}
          <a
            href={data.filePageUrl || "https://commons.wikimedia.org"}
            target="_blank"
            rel="noopener noreferrer"
            className="doubtster-image-link"
          >
            Wikimedia Commons
          </a>
        </div>
      </div>
    </div>
  );
}
