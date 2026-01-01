// Learning module configuration for breadcrumbs and navigation
export const LEARNING_MODULES = [
  {
    id: "introduction",
    title: "Introduction to Lenormand",
    path: "/learn/introduction",
    order: 1,
  },
  {
    id: "history",
    title: "History & Origins",
    path: "/learn/history",
    order: 2,
  },
  {
    id: "reading-basics",
    title: "How to Read Lenormand",
    path: "/learn/reading-basics",
    order: 3,
  },
  {
    id: "card-meanings",
    title: "Card Meanings & Associations",
    path: "/learn/card-meanings",
    order: 4,
  },
  {
    id: "spreads",
    title: "Spreads & Techniques",
    path: "/learn/spreads",
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
