export type CategoryKey = "action" | "comedy" | "horror" | "romance";

export type FilterKey = "all" | CategoryKey;

export type Movie = {
  id: string;
  title: string;
  category: CategoryKey;
  icon: string;
  isCustom?: boolean;
};

export type CategoryMeta = {
  key: CategoryKey;
  label: string;
  emoji: string;
  color: string;
};
