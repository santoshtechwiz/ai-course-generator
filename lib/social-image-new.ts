/**
 * @deprecated Import from '@/lib/seo-manager-new' instead
 * This file is kept for backward compatibility and will be removed in a future version.
 */

import { 
  generateSocialImage as newGenerateSocialImage,
  SocialImageProps
} from './seo-manager-new';

export { 
  SocialImageProps
} from './seo-manager-new';

// Re-export
export const generateSocialImage = newGenerateSocialImage;
