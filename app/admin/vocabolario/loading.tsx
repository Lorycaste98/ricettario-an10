import { AdminListSkeleton } from "@/components/admin/AdminListSkeleton";
import { PageLoader } from "@/components/brand/An10Loader";

export default function Loading() {
  return (
    <>
      <PageLoader />
      <AdminListSkeleton />
    </>
  );
}
