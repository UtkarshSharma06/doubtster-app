"use client";

/**
 * Exports the visual inside containerEl to a downloadable PNG file.
 */
export async function exportVisualToPng(containerEl: HTMLElement, filename = "doubtster-visual.png") {
  if (!containerEl) return;

  try {
    // 1. If there is an SVG inside (Charts, Mermaid diagrams, Figures)
    const svgEl = containerEl.querySelector("svg");
    if (svgEl) {
      // Clone SVG so we can apply computed styles for accurate rasterization
      const clone = svgEl.cloneNode(true) as SVGSVGElement;
      
      const width = svgEl.getBoundingClientRect().width || svgEl.clientWidth || 600;
      const height = svgEl.getBoundingClientRect().height || svgEl.clientHeight || 400;

      clone.setAttribute("width", String(width));
      clone.setAttribute("height", String(height));
      if (!clone.getAttribute("viewBox") && width > 0 && height > 0) {
        clone.setAttribute("viewBox", `0 0 ${width} ${height}`);
      }

      // Ensure xmlns
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

      const svgData = new XMLSerializer().serializeToString(clone);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const blobUrl = URL.createObjectURL(svgBlob);

      const canvas = document.createElement("canvas");
      // Scale canvas by 2x for sharp retina PNG
      const scale = 2;
      canvas.width = Math.max(width * scale, 400);
      canvas.height = Math.max(height * scale, 300);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        // Draw background
        const isDark = document.documentElement.classList.contains("dark");
        ctx.fillStyle = isDark ? "#0f172a" : "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(blobUrl);

        canvas.toBlob((blob) => {
          if (!blob) return;
          const downloadUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.download = filename;
          a.href = downloadUrl;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
        }, "image/png");
      };

      img.onerror = () => {
        URL.revokeObjectURL(blobUrl);
      };

      img.src = blobUrl;
      return;
    }

    // 2. If it is an HTML image element
    const imgEl = containerEl.querySelector("img");
    if (imgEl && imgEl.src) {
      // Create canvas to convert to PNG
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        canvas.width = img.naturalWidth || 600;
        canvas.height = img.naturalHeight || 400;
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.download = filename;
            a.href = url;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }, "image/png");
        }
      };
      img.onerror = () => {
        // Fallback: direct download link
        const a = document.createElement("a");
        a.download = filename;
        a.href = imgEl.src;
        a.target = "_blank";
        a.click();
      };
      img.src = imgEl.src;
    }
  } catch (err) {
    console.error("Export visual failed:", err);
  }
}
