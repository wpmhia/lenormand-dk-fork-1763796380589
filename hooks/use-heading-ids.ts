import { useEffect } from "react";

/**
 * Hook to automatically add IDs to headings in the DOM
 * Converts heading text to kebab-case IDs for use in anchor links
 */
export function useHeadingIds(
  selector: string = "h2, h3",
  containerSelector: string = "main, [data-content]",
) {
  useEffect(() => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const headings = container.querySelectorAll(selector);

    headings.forEach((heading) => {
      if (!heading.id) {
        // Convert heading text to kebab-case ID
        const id =
          heading.textContent
            ?.toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "") // Remove special chars
            .replace(/\s+/g, "-") // Replace spaces with dashes
            .replace(/-+/g, "-") // Replace multiple dashes with single dash
            .replace(/^-|-$/g, "") || ""; // Remove leading/trailing dashes

        if (id) {
          heading.id = id;
        }
      }

      // Add a subtle anchor link visual indicator
      if (!heading.querySelector("a.heading-anchor")) {
        const anchor = document.createElement("a");
        anchor.href = `#${heading.id}`;
        anchor.className = "heading-anchor";
        anchor.innerHTML = "#";
        anchor.style.opacity = "0";
        anchor.style.marginLeft = "0.5rem";
        anchor.style.fontSize = "0.875em";
        anchor.style.textDecoration = "none";
        anchor.style.color = "currentColor";
        heading.appendChild(anchor);

        // Show anchor on hover
        heading.addEventListener("mouseenter", () => {
          anchor.style.opacity = "0.5";
        });
        heading.addEventListener("mouseleave", () => {
          anchor.style.opacity = "0";
        });
      }
    });
  }, [selector, containerSelector]);
}

/**
 * Generate a kebab-case ID from text
 */
export function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with dashes
    .replace(/-+/g, "-") // Replace multiple dashes with single dash
    .replace(/^-|-$/g, ""); // Remove leading/trailing dashes
}
