/** Writes schema.org structured data into the page for search engines and AI assistants. */
export default function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output with "<" escaped so it can never close the script tag early.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
