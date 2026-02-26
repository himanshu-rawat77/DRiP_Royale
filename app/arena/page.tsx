import { Suspense } from "react"
import Arena from "@/components/Arena";

export default function ArenaPage() {
  return ( <Suspense fallback={<div>Loading arena...</div>}>
  <Arena />
  </Suspense>
  );
}


