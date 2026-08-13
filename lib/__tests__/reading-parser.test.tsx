import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { extractCombinationFromChildren, extractCombinationFromText, nodeToStringWithBold } from "@/lib/reading-combination";

describe("extractCombinationFromText", () => {
  it("matches a plain bold pair label", () => {
    const out = extractCombinationFromText("**Birds + Letter**: News, calls, emails.");
    expect(out).toEqual({ pair: "Birds + Letter", meaning: "News, calls, emails." });
  });

  it("matches a pair label without bold markers", () => {
    const out = extractCombinationFromText("Birds + Letter: News becomes the vehicle.");
    expect(out).toEqual({ pair: "Birds + Letter", meaning: "News becomes the vehicle." });
  });

  it("returns null when no pair label is present", () => {
    expect(extractCombinationFromText("- Birds indicates chatter")).toBeNull();
  });

  it("does not match fragments of words like 'Letters' or 'uncovering'", () => {
    expect(extractCombinationFromText("**Letter**s are on the way.")).toBeNull();
    expect(extractCombinationFromText("uncove**Ring**")).toBeNull();
  });
});

describe("extractCombinationFromChildren", () => {
  it("extracts pair label from React children with bold elements", () => {
    const children = [
      createElement("strong", null, "Birds + Letter"),
      ": News, calls, emails, discussion or correspondence becomes the immediate vehicle.",
    ];
    const out = extractCombinationFromChildren(children);
    expect(out).toEqual({
      pair: "Birds + Letter",
      meaning: "News, calls, emails, discussion or correspondence becomes the immediate vehicle.",
    });
  });

  it("extracts pair label from plain-text children", () => {
    const children = "Birds + Letter: News becomes the vehicle.";
    const out = extractCombinationFromChildren(children);
    expect(out?.pair).toBe("Birds + Letter");
  });

  it("returns null for unrelated list content", () => {
    const children = [createElement("strong", null, "Birds"), " indicates chatter."];
    expect(extractCombinationFromChildren(children)).toBeNull();
  });
});

describe("nodeToStringWithBold", () => {
  it("preserves bold markers around <strong> elements", () => {
    const node = [
      createElement("strong", null, "Birds"),
      " + ",
      createElement("strong", null, "Letter"),
    ];
    expect(nodeToStringWithBold(node)).toBe("**Birds** + **Letter**");
  });
});
