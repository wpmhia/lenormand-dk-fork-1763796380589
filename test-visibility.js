// Quick test to check for visibility issues
const issues = [];

// Check 1: min-h-screen on body
if (document.body.classList.contains("min-h-screen")) {
  issues.push("Body has min-h-screen class");
}

// Check 2: Check main element visibility
const main = document.querySelector("main");
if (main) {
  const style = window.getComputedStyle(main);
  if (style.display === "none") {
    issues.push("Main element is hidden (display: none)");
  }
  if (style.visibility === "hidden") {
    issues.push("Main element is hidden (visibility: hidden)");
  }
  if (parseFloat(style.opacity) === 0) {
    issues.push("Main element is transparent (opacity: 0)");
  }
}

// Check 3: Check if content is rendered
const content = document.querySelector("main")?.textContent?.trim();
if (content?.length === 0) {
  issues.push("Main element has no visible content");
}

// Check 4: Check for overlay elements
const overlays = document.querySelectorAll(
  '[style*="position: fixed"], [style*="position: absolute"]',
);
overlays.forEach((el) => {
  const style = window.getComputedStyle(el);
  if (style.zIndex && parseInt(style.zIndex) > 100) {
    issues.push(
      `High z-index overlay found: ${el.tagName} (z-index: ${style.zIndex})`,
    );
  }
});

console.log("Visibility Issues:", issues.length ? issues : "None found");
