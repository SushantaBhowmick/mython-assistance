export interface CareerCurrent {
  company: string;
  role: string;
  joinedAt?: string;
  location?: string;
}

export interface CareerBlock {
  current?: CareerCurrent;
  summary?: string;
}

export interface ExperienceEntry {
  company: string;
  role: string;
  period: string;
  highlights: string[];
}

export interface EducationEntry {
  institution: string;
  degree: string;
  period: string;
}

export interface ProjectEntry {
  name: string;
  description: string;
  stack: string[];
}

export interface UserProfile {
  id: string;
  userId: string;
  email: string | null;
  name: string | null;
  age: number | null;
  dateOfBirth: string | null;
  phone: string | null;
  location: string | null;
  avatarUrl: string | null;
  about: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  skills: string[];
  career: CareerBlock | null;
  experience: ExperienceEntry[] | null;
  education: EducationEntry[] | null;
  projects: ProjectEntry[] | null;
}
