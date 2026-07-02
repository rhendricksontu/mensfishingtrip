import "server-only";
import sanitizeHtml from "sanitize-html";

// Clean pasted rich text (from Word/Docs) down to a safe formatting subset:
// bold, italic, underline, strikethrough, color, lists, links, headings.
export function sanitizeNotes(dirty: string): string {
  const clean = sanitizeHtml(dirty, {
    allowedTags: [
      "p", "br", "div", "span",
      "b", "strong", "i", "em", "u", "s", "strike", "sub", "sup",
      "ul", "ol", "li",
      "a", "blockquote",
      "h1", "h2", "h3", "h4",
    ],
    allowedAttributes: {
      a: ["href"],
      "*": ["style"],
    },
    allowedStyles: {
      "*": {
        color: [/^.*$/],
        "background-color": [/^.*$/],
        "text-align": [/^(left|right|center|justify)$/],
        "text-decoration": [/^.*$/],
        "font-weight": [/^.*$/],
        "font-style": [/^.*$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      // Force safe link behavior.
      a: (tagName, attribs) => ({
        tagName: "a",
        attribs: { ...attribs, target: "_blank", rel: "noopener noreferrer" },
      }),
    },
  }).trim();

  // Treat "empty" markup (e.g. "<br>", "<p></p>") as no notes.
  return sanitizeHtml(clean, { allowedTags: [], allowedAttributes: {} }).trim() ? clean : "";
}
