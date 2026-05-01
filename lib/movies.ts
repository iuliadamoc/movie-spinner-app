import type { CategoryMeta, Movie } from "@/lib/types";

export const categories: CategoryMeta[] = [
  {
    key: "action",
    label: "Action",
    emoji: "💥",
    color: "#ff4d6d"
  },
  {
    key: "comedy",
    label: "Comedy",
    emoji: "😂",
    color: "#ffd166"
  },
  {
    key: "horror",
    label: "Horror",
    emoji: "😱",
    color: "#7c3aed"
  },
  {
    key: "romance",
    label: "Romance",
    emoji: "❤️",
    color: "#ff7ab6"
  }
];

export const defaultMovies: Movie[] = [
  {
    id: "inception",
    title: "Inception",
    category: "action",
    icon: "🌀"
  },
  {
    id: "interstellar",
    title: "Interstellar",
    category: "action",
    icon: "🚀"
  },
  {
    id: "avatar",
    title: "Avatar",
    category: "action",
    icon: "🌌"
  },
  {
    id: "mad-max-fury-road",
    title: "Mad Max: Fury Road",
    category: "action",
    icon: "🔥"
  },
  {
    id: "the-dark-knight",
    title: "The Dark Knight",
    category: "action",
    icon: "🦇"
  },
  {
    id: "joker",
    title: "Joker",
    category: "horror",
    icon: "🃏"
  },
  {
    id: "get-out",
    title: "Get Out",
    category: "horror",
    icon: "👁️"
  },
  {
    id: "a-quiet-place",
    title: "A Quiet Place",
    category: "horror",
    icon: "🤫"
  },
  {
    id: "the-conjuring",
    title: "The Conjuring",
    category: "horror",
    icon: "🕯️"
  },
  {
    id: "superbad",
    title: "Superbad",
    category: "comedy",
    icon: "🍿"
  },
  {
    id: "the-grand-budapest-hotel",
    title: "The Grand Budapest Hotel",
    category: "comedy",
    icon: "🛎️"
  },
  {
    id: "the-hangover",
    title: "The Hangover",
    category: "comedy",
    icon: "🥂"
  },
  {
    id: "paddington-2",
    title: "Paddington 2",
    category: "comedy",
    icon: "🍊"
  },
  {
    id: "titanic",
    title: "Titanic",
    category: "romance",
    icon: "🚢"
  },
  {
    id: "la-la-land",
    title: "La La Land",
    category: "romance",
    icon: "🎹"
  },
  {
    id: "before-sunrise",
    title: "Before Sunrise",
    category: "romance",
    icon: "🌅"
  },
  {
    id: "crazy-rich-asians",
    title: "Crazy Rich Asians",
    category: "romance",
    icon: "💎"
  }
];
