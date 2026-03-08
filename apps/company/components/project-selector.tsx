"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useParams, usePathname } from "next/navigation";
import { Button } from "@repo/ui";
import { ChevronDown, Plus, FolderKanban, Check } from "lucide-react";

type Project = {
  id: string;
  name: string;
};

export function ProjectSelector({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const projectId = params.projectId as string | undefined;
  const currentProject = projects.find((p) => p.id === projectId);

  const handleSelect = (id: string) => {
    setOpen(false);
    // Navigate to the new project dashboard
    router.push(`/projects/${id}`);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2 min-w-40"
        onClick={() => setOpen(!open)}
      >
        <FolderKanban className="h-4 w-4" />
        <span className="truncate max-w-32">
          {currentProject?.name || "Select Project"}
        </span>
        <ChevronDown className="h-4 w-4 ml-auto" />
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 z-50 w-64 bg-background border rounded-md shadow-lg py-1">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Projects
            </div>
            {projects.map((project) => (
              <button
                key={project.id}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                onClick={() => handleSelect(project.id)}
              >
                <span className="truncate flex-1">{project.name}</span>
                {project.id === projectId && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
            <div className="border-t my-1" />
            <Link
              href="/projects/new"
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
              onClick={() => setOpen(false)}
            >
              <Plus className="h-4 w-4" />
              Create New Project
            </Link>
            <Link
              href="/projects"
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-muted-foreground"
              onClick={() => setOpen(false)}
            >
              View All Projects
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
