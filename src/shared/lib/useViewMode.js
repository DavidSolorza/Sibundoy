import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export default function useViewMode() {
  const [params] = useSearchParams();
  return useMemo(() => ({
    isViewOnly: params.has("view"),
  }), [params]);
}
