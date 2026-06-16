// Selects condivisi per mantenere risposte consistenti

export const recipeSummarySelect = {
  id: true,
  name: true,
  servings: true,
  prep: true,
  cook: true,
  photo: true,
  notes: true,
  cookCount: true,
  createdAt: true,
  categories: {
    select: {
      category: { select: { id: true, name: true, color: true } },
    },
  },
  tags: {
    select: {
      tag: { select: { id: true, name: true } },
    },
  },
  _count: { select: { reviews: true } },
  reviews: { select: { rating: true } },
} as const;

export const recipeDetailSelect = {
  ...recipeSummarySelect,
  links: true,
  updatedAt: true,
  photos: {
    select: { id: true, url: true, order: true },
    orderBy: { order: "asc" as const },
  },
  ingredients: {
    select: { id: true, name: true, qty: true, unit: true, description: true, order: true },
    orderBy: { order: "asc" as const },
  },
  steps: {
    select: { id: true, text: true, mins: true, order: true },
    orderBy: { order: "asc" as const },
  },
  reviews: {
    select: {
      id: true,
      nickname: true,
      rating: true,
      comment: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" as const },
  },
} as const;

// Normalizza il risultato appiattendo le junction table categories/tags
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function flattenRecipe(r: any) {
  const reviews: { rating: number }[] = r.reviews ?? [];
  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((s: number, rv: { rating: number }) => s + rv.rating, 0) / reviews.length) * 10) / 10
      : null;
  return {
    ...r,
    categories: r.categories?.map((rc: { category: unknown }) => rc.category),
    tags: r.tags?.map((rt: { tag: unknown }) => rt.tag),
    avgRating,
  };
}

export function ok(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function err(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

