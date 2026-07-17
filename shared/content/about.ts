export const YAKQUEST_NAME =
  "YakQuest";

export const YAKQUEST_TAGLINE =
  "Canoe/Kayak Trip Planner";

export const YAKQUEST_WEBSITE =
  "https://www.yakquest.com";

export const YAKQUEST_CONTACT_EMAIL =
  "support@yakquest.com";

export const YAKQUEST_COPYRIGHT_YEAR =
  new Date().getFullYear();

export type AboutSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

export const ABOUT_INTRODUCTION = [
  "YakQuest is a canoe and kayak trip-planning tool designed to help paddlers discover rivers, choose launch and takeout points, estimate trip distance and time, review current conditions, and prepare for a safer day on the water.",
  "YakQuest brings route planning, river access information, points of interest, hazards, flow information, weather forecasts, saved trips, and community contributions together in one place.",
];

export const ABOUT_SECTIONS:
  AboutSection[] = [
  {
    id: "mission",
    title: "Our Mission",
    paragraphs: [
      "Our goal is to make paddling trips easier to plan while encouraging safe, responsible, and respectful use of rivers and waterways.",
      "YakQuest is built for recreational paddlers and the communities that know these waterways best. Community contributions help keep access points, hazards, photos, and river information useful and current.",
    ],
  },
  {
    id: "community-information",
    title: "Community Information",
    paragraphs: [
      "Some information displayed by YakQuest may be submitted by users or gathered from publicly available sources. Community-submitted information may be reviewed before publication, but YakQuest cannot guarantee that every location, description, photograph, access rule, hazard, or condition is complete or current.",
      "Access rights and conditions can change. Always confirm whether a launch, takeout, parking area, road, shoreline, or other property is open to the public before entering or using it.",
    ],
  },
  {
    id: "safety",
    title: "Safety Disclaimer",
    paragraphs: [
      "Paddling involves inherent risks, including changing water levels, strong currents, strainers, dams, rapids, weather, wildlife, submerged objects, limited cellular coverage, and difficult access for emergency responders.",
      "YakQuest is a planning aid and is not a substitute for personal judgment, proper training, local knowledge, official warnings, emergency services, or current on-site observations.",
      "River flow, weather, estimated travel time, route distance, hazards, and navigation information may be delayed, incomplete, inaccurate, or unavailable. Conditions can change rapidly.",
      "Before launching, check current weather and water conditions, inspect the route, verify access, tell someone your plans, wear a properly fitted personal flotation device, and carry appropriate safety and communication equipment.",
      "You are solely responsible for deciding whether a route and its conditions are appropriate for your experience, equipment, and abilities.",
    ],
  },
  {
    id: "navigation",
    title: "Navigation Notice",
    paragraphs: [
      "Map locations, route lines, access points, points of interest, hazards, distances, notifications, and estimated arrival times are approximate.",
      "GPS accuracy varies by device, terrain, weather, signal availability, battery settings, and surrounding vegetation or structures. Never rely on YakQuest as your only means of navigation.",
    ],
  },
  {
    id: "privacy",
    title: "Privacy",
    paragraphs: [
      "YakQuest may use account information, saved trips, completed-trip information, contributions, photographs, and location data when necessary to provide requested features.",
      "Location information should only be collected or used when a location-based feature is active and the user has granted the appropriate device or browser permission.",
      "Do not submit photographs, descriptions, or other content containing private information that you do not have permission to share.",
    ],
  },
  {
    id: "third-party-services",
    title: "Third-Party Services and Data",
    paragraphs: [
      "YakQuest may use third-party map tiles, geographic data, river-flow information, weather forecasts, email delivery, hosting, and other supporting services.",
      "Availability and accuracy of third-party information are controlled by their respective providers and may change without notice.",
    ],
  },
  {
    id: "copyright",
    title: "Copyright and Content",
    paragraphs: [
      `Unless otherwise identified, the YakQuest name, logo, application design, original text, software, and original media are © ${YAKQUEST_COPYRIGHT_YEAR} YakQuest. All rights reserved.`,
      "Users should only submit photographs, descriptions, and other content that they created or have permission to share.",
      "Submitting content to YakQuest does not transfer ownership of that content, but YakQuest may need permission to store, display, resize, reproduce, and distribute it as part of operating the service.",
    ],
  },
];

export const ABOUT_ATTRIBUTIONS = [
  {
    name: "OpenStreetMap",
    description:
      "Map data and map tiles are provided by OpenStreetMap contributors and are subject to the applicable OpenStreetMap licenses.",
    url: "https://www.openstreetmap.org/copyright",
    linkLabel:
      "OpenStreetMap copyright and license information",
  },
  {
    name: "U.S. Geological Survey",
    description:
      "River-flow and gauge information may include data provided by the U.S. Geological Survey.",
    url: "https://www.usgs.gov",
    linkLabel:
      "Visit the U.S. Geological Survey",
  },
];

export const ABOUT_LEGAL_NOTE =
  "YakQuest is not affiliated with, sponsored by, or endorsed by the U.S. Geological Survey, OpenStreetMap, any government agency, property owner, outfitter, or emergency-response organization unless expressly stated.";