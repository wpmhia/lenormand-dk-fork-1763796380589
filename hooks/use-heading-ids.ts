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
    const trackedElements: Array<{ element: Element; enter: () => void; leave: () => void }> = [];

    headings.forEach((heading) => {
      if (!heading.id) {
        const id =
          heading.textContent
            ?.toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "") || "";

        if (id) {
          heading.id = id;
        }
      }

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

        const enterHandler = () => {
          anchor.style.opacity = "0.5";
        };
        const leaveHandler = () => {
          anchor.style.opacity = "0";
        };

        heading.addEventListener("mouseenter", enterHandler);
        heading.addEventListener("mouseleave", leaveHandler);
        
        trackedElements.push({ element: heading, enter: enterHandler, leave: leaveHandler });
      }
    });

    return () => {
      trackedElements.forEach(({ element, enter, leave }) => {
        element.removeEventListener("mouseenter", enter);
        element.removeEventListener("mouseleave", leave);
      });
    };
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
