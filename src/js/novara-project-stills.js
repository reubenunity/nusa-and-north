// Novara uses the original Berlin gallery for every project with verified frames.
// The protected original site's two galleries stay unchanged.
import { projectStills as originalStills } from './review-project-stills.js';
import destinationStills from './novara-stills-a.json';
import hospitalityStills from './novara-stills-b.json';
import campaignStills from './novara-stills-c.json';
import couchvibesStills from './novara-stills-couchvibes.json';
import anantaraStills from './novara-stills-anantara.json';

export const projectStills = {
  ...originalStills,
  ...destinationStills,
  ...hospitalityStills,
  ...campaignStills,
  ...couchvibesStills,
  ...anantaraStills,
};
