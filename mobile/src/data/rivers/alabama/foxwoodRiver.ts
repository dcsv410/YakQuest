import { River } from "../../types";
import { foxwoodRiverCoordinates } from "./foxwoodRiver.coordinates";

export const foxwoodRiverAL: River = {
  id: "al-foxwood-river",
  name: "Foxwood River",
  slug: "foxwood-river",

  state: "AL",
  stateName: "Alabama",

  difficulty: 2,
  cleanliness: 4,
  fishing: 4,

  usgsGaugeId: "03574500",

  flowStats: {
    lowPercentile: 70,
    median: 200,
    highPercentile: 300,
    max: 3000,
  },
  accessPoints: {
    public: [
      {
        id: "foxwood-pa-1",
        name: "Foxwood River Access 1 (Public Access)",
        latitude: 34.783224,
        longitude: -86.777391,
        type: "public_access",
      },
      {
        id: "foxwood-pa-2",
        name: "Foxwood River Access 2 (Public Access)",
        latitude: 34.779535,
        longitude: -86.775736,
        type: "public_access",
      },
    ],

    private: [
      {
        id: "foxwood-pr-1",
        name: "Foxwood River Access 3 (Private Access)",
        latitude: 34.779622,
        longitude: -86.784368,
        type: "private_access",
      },
    ],
  },
  pois: [  
    {
      id: "al_foxwood-poi-1",
      name: "Rope Swing",
      latitude: 34.777264,
      longitude: -86.777592,
      type: "poi",
      description: "Popular rope swing with deep water landing."
    },  
  ],

  coordinates: foxwoodRiverCoordinates,
};