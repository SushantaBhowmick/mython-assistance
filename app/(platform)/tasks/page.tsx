import { Suspense } from "react";

import { TasksList } from "@/components/tasks/TasksList";
import { TasksListSkeleton } from "@/components/tasks/TasksSkeletons";

export default function TasksPage() {
  return (
    <Suspense fallback={<TasksListSkeleton />}>
      <TasksList />
    </Suspense>
  );
}
