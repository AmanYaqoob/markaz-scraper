import HeroBanner from "@/components/HeroBanner";
import CategoryGrid from "@/components/CategoryGrid";
import FeaturedSection from "@/components/FeaturedSection";
import ComingSoon from "@/components/ComingSoon";
import { getCategories, getFeaturedProducts, getNewArrivals } from "@/lib/db";

export const revalidate = 60;

export default async function HomePage() {
  const [categories, featured, newArrivals] = await Promise.all([
    getCategories(),
    getFeaturedProducts(16),
    getNewArrivals(12),
  ]);

  const isEmpty = categories.length === 0 && newArrivals.length === 0;

  return (
    <>
      <HeroBanner />
      {isEmpty ? (
        <ComingSoon />
      ) : (
        <>
          {featured.length > 0 && (
            <FeaturedSection products={featured} title="Featured Products" subtitle="Handpicked" />
          )}
          <CategoryGrid categories={categories} />
          {newArrivals.length > 0 && (
            <FeaturedSection products={newArrivals} title="New Arrivals" subtitle="Just In" />
          )}
        </>
      )}
    </>
  );
}
