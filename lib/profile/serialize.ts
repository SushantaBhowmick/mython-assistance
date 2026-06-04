import type {
  CareerBlock,
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  UserProfile,
} from "@/modules/profile/types";
import type { Profile } from "@prisma/client";

function parseJson<T>(value: unknown): T | null {
  if (value == null) return null;
  return value as T;
}

export function serializeProfile(row: Profile): UserProfile {
  return {
    id: row.id,
    userId: row.userId,
    email: row.email,
    name: row.name,
    age: row.age,
    dateOfBirth: row.dateOfBirth?.toISOString().slice(0, 10) ?? null,
    phone: row.phone,
    location: row.location,
    avatarUrl: row.avatarUrl,
    about: row.about,
    githubUrl: row.githubUrl,
    linkedinUrl: row.linkedinUrl,
    skills: row.skills ?? [],
    career: parseJson<CareerBlock>(row.career),
    experience: parseJson<ExperienceEntry[]>(row.experience),
    education: parseJson<EducationEntry[]>(row.education),
    projects: parseJson<ProjectEntry[]>(row.projects),
  };
}
