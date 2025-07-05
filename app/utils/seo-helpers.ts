/**
 * SEO utilities for managing structured data across the site
 */

import { BreadcrumbItem } from "../types/seo";


/**
 * Create breadcrumb items for schema.org structured data
 * @param paths Array of path segments
 * @param baseUrl Base URL of the site
 * @returns Array of formatted breadcrumb items
 */
export function createBreadcrumbItems(
  paths: { name: string; path: string }[],
  baseUrl = 'https://courseai.io'
): BreadcrumbItem[] {
  return paths.map((item, index) => ({
    position: index + 1,
    name: item.name,
    url: item.path.startsWith('http') ? item.path : `${baseUrl}${item.path}`
  }));
}

/**
 * Create social media profile URLs for Organization schema
 * @param profiles Object containing social media handles
 * @returns Array of formatted social media URLs
 */
export function createSocialProfiles(profiles: {
  twitter?: string;
  facebook?: string;
  linkedin?: string;
  github?: string;
  youtube?: string;
  instagram?: string;
}): string[] {
  const socialProfiles = [];

  if (profiles.twitter) {
    socialProfiles.push(`https://twitter.com/${profiles.twitter}`);
  }
  if (profiles.facebook) {
    socialProfiles.push(`https://facebook.com/${profiles.facebook}`);
  }
  if (profiles.linkedin) {
    socialProfiles.push(`https://linkedin.com/company/${profiles.linkedin}`);
  }
  if (profiles.github) {
    socialProfiles.push(`https://github.com/${profiles.github}`);
  }
  if (profiles.youtube) {
    socialProfiles.push(`https://youtube.com/c/${profiles.youtube}`);
  }
  if (profiles.instagram) {
    socialProfiles.push(`https://instagram.com/${profiles.instagram}`);
  }

  return socialProfiles;
}
