"use client";

import { Briefcase, Calendar, Link2, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserProfile } from "@/modules/profile/types";

interface ProfileViewProps {
  profile: UserProfile;
}

export function ProfileView({ profile }: ProfileViewProps) {
  const current = profile.career?.current;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border bg-card/60 backdrop-blur">
        <div className="h-24 bg-gradient-to-r from-primary/30 via-violet-500/20 to-emerald-500/20" />
        <CardContent className="relative pt-0">
          <div className="-mt-10 mb-4 flex size-20 items-center justify-center rounded-2xl border-4 border-background bg-primary/10 text-2xl font-semibold">
            {profile.name?.charAt(0) ?? "S"}
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">{profile.name}</h2>
          {current && (
            <p className="text-muted-foreground">
              {current.role} · {current.company}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
            {profile.email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="size-3.5" />
                {profile.email}
              </span>
            )}
            {profile.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3.5" />
                {profile.phone}
              </span>
            )}
            {profile.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {profile.location}
              </span>
            )}
            {profile.dateOfBirth && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3.5" />
                DOB {profile.dateOfBirth}
                {profile.age != null && ` · ${profile.age} yrs`}
              </span>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            {profile.githubUrl && (
              <Link
                href={profile.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Link2 className="size-4" />
                GitHub
              </Link>
            )}
            {profile.linkedinUrl && (
              <Link
                href={profile.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Link2 className="size-4" />
                LinkedIn
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {profile.about && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed">
            {profile.about}
          </CardContent>
        </Card>
      )}

      {profile.skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Skills</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {profile.experience && profile.experience.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2 text-base">
              <Briefcase className="size-4" />
              Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {profile.experience.map((job) => (
              <div key={`${job.company}-${job.period}`} className="border-b pb-4 last:border-0 last:pb-0">
                <p className="font-medium">{job.role}</p>
                <p className="text-sm text-muted-foreground">
                  {job.company} · {job.period}
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {job.highlights.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {profile.education && profile.education.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Education</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.education.map((edu) => (
              <div key={edu.institution}>
                <p className="font-medium">{edu.degree}</p>
                <p className="text-sm text-muted-foreground">
                  {edu.institution} · {edu.period}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {profile.projects && profile.projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.projects.map((project) => (
              <div key={project.name}>
                <p className="font-medium">{project.name}</p>
                <p className="text-sm text-muted-foreground">{project.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {project.stack.map((tech) => (
                    <Badge key={tech} variant="outline" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
