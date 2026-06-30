import { River } from "../../types";
import { elkRiverCoordinates } from "./elkRiver.coordinates";

export const elkRiverTN: River = {
  id: "tn-elk-river",
  name: "Elk River",
  slug: "elk-river",

  state: "TN",
  stateName: "Tennessee",

  difficulty: 2,
  cleanliness: 4,
  fishing: 4,
  usgsGaugeId: "03582000",

  flowStats: {
    lowPercentile: 500,
    median: 1000,
    highPercentile: 2500,
    max: 8000,
  },

  accessPoints: {
    public: [
      {
        id: "tn_elk-pa-1",
        name: "Tim's Ford Boat Launch (Public Access)",
        latitude: 35.19238,
        longitude: -86.28018,
        type: "public_access",
      },
      {
        id: "tn_elk-pa-2",
        name: "Farris Creek Bridge (Public Access)",
        latitude: 35.16367,
        longitude: -86.31900,
        type: "public_access",
      },
      {
        id: "tn_elk-pa-3",
        name: "Old Ford Dam (Public Access)",
        latitude: 35.12417,
        longitude: -86.33238,
        type: "public_access",
      },
      {
        id: "tn_elk-pa-4",
        name: "Shiloh Bridge (Public Access)",
        latitude: 35.13913,
        longitude: -86.38307,
        type: "public_access",
      },
      {
        id: "tn_elk-pa-5",
        name: "Dickey Bridge (Public Access)",
        latitude: 35.13930,
        longitude: -86.44805,
        type: "public_access",
      },
      {
        id: "tn_elk-pa-6",
        name: "Stump Shoals (Public Access)",
        latitude: 35.14032,
        longitude: -86.47520,
        type: "public_access",
      },
      {
        id: "tn_elk-pa-7",
        name: "Chenault Ford (Public Access)",
        latitude: 35.14957,
        longitude: -86.51108,
        type: "public_access",
      },
      {
        id: "tn_elk-pa-8",
        name: "Old Stone Bridge (Public Access)",
        latitude: 35.14090,
        longitude: -86.57157,
        type: "public_access",
      },
    ],

    private: [
      {
        id: "tn_elk-pr-1",
        name: "Elk River Canoe Rental (Private Access)",
        latitude: 35.12720,
        longitude: -86.40793,
        type: "private_access",
      },
      {
        id: "tn_elk-pr-2",
        name: "Old Harms Dam (Private Access)",
        latitude: 35.15074,
        longitude: -86.64871,
        type: "private_access",  
      },
    ],
  },

  pois: [
    {
      id: "tn_elk-poi-1",
      type: "poi",
      name: "Dickey Island",
      latitude: 35.13061,
      longitude: -86.43705,
    },
  ],

  coordinates: elkRiverCoordinates,
};