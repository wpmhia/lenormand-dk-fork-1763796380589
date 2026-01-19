// Learning module configuration for breadcrumbs and navigation
export const LEARNING_MODULES = [
  {
    id: "history-basics",
    title: "History & Basics",
    path: "/learn/history-basics",
    order: 1,
  },
  {
    id: "reading-fundamentals",
    title: "Reading Fundamentals",
    path: "/learn/reading-fundamentals",
    order: 2,
  },
  {
    id: "card-combinations",
    title: "Card Combinations",
    path: "/learn/card-combinations",
    order: 3,
  },
  {
    id: "spreads",
    title: "Spreads & Techniques",
    path: "/learn/spreads",
    order: 4,
  },
  {
    id: "grand-tableau-techniques",
    title: "Grand Tableau Techniques",
    path: "/learn/grand-tableau-techniques",
    order: 5,
  },
  {
    id: "advanced",
    title: "Advanced Concepts",
    path: "/learn/advanced",
    order: 6,
  },
  {
    id: "marie-annes-system",
    title: "Marie-Anne's System",
    path: "/learn/marie-annes-system",
    order: 7,
  },
];

// Reference modules (not part of sequential course)
export const REFERENCE_MODULES = [
  {
    id: "card-meanings",
    title: "Card Meanings Reference",
    path: "/learn/card-meanings",
  },
];

export function getModuleByPath(path: string) {
  return LEARNING_MODULES.find((mod) => mod.path === path);
}

export function getNextModule(currentModuleId: string) {
  const current = LEARNING_MODULES.find((mod) => mod.id === currentModuleId);
  if (!current) return null;
  return LEARNING_MODULES.find((mod) => mod.order === current.order + 1);
}

export function getPreviousModule(currentModuleId: string) {
  const current = LEARNING_MODULES.find((mod) => mod.id === currentModuleId);
  if (!current) return null;
  return LEARNING_MODULES.find((mod) => mod.order === current.order - 1);
}

export function getBreadcrumbItems(currentModuleId: string) {
  const foundModule = LEARNING_MODULES.find(
    (mod) => mod.id === currentModuleId,
  );
  if (!foundModule) return [];

  return [
    { name: "Home", url: "/" },
    { name: "Learn", url: "/learn" },
    { name: foundModule.title, url: foundModule.path },
  ];
}

export function getReferenceBreadcrumbItems(referenceModuleId: string) {
  const foundModule = REFERENCE_MODULES.find(
    (mod) => mod.id === referenceModuleId,
  );
  if (!foundModule) return [];

  return [
    { name: "Home", url: "/" },
    { name: "Learn", url: "/learn" },
    { name: "Reference", url: "/learn/reference" },
    { name: foundModule.title, url: foundModule.path },
  ];
}
