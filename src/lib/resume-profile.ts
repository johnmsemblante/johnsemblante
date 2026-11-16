import { profile, socialAccounts } from "@/content/profile";
import { site } from "@/content/site";
import { emptyResume, type Resume } from "./resume-model";

/** Only already-public, source-managed facts; never infer metrics or private contacts. */
export function resumeFromPublicProfile(): Resume {
  return { ...emptyResume(), name: profile.fullName, headline: profile.title, location: profile.location,
    email: site.email, website: site.url, linkedin: socialAccounts.find(account => account.name === "LinkedIn")?.url ?? "",
    summary: profile.introduction, skills: [...profile.skills, ...profile.languages, ...profile.tools].join(", "),
    experience: profile.experience.map((entry, index) => ({ id: `profile-work-${index}`, title: entry.role, organization: entry.company, location: "", dates: entry.dates, url: "", highlights: entry.responsibilities.join("\n") })),
    education: profile.education.filter(entry => entry.qualification.startsWith("Bachelor")).map((entry, index) => ({ id: `profile-education-${index}`, title: entry.qualification, organization: entry.school, dates: entry.dates, location: "", url: "", highlights: "" })),
  };
}
