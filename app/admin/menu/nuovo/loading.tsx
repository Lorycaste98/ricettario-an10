import { FormSkeleton } from "@/components/admin/FormSkeleton";
import { PageLoader } from "@/components/brand/An10Loader";

export default function Loading() {
  return (
    <>
      <PageLoader />
      <FormSkeleton variant="menu" />
    </>
  );
}
