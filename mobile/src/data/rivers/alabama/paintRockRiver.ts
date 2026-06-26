import { River } from "../../types";
import { paintRockRiverCoordinates } from "./paintRockRiver.coordinates";

export const paintRockRiverAL: River = {
  id: "al-paintRock-river",
  name: "Paint Rock River",
  slug: "paint-rock-river",

  state: "AL",
  stateName: "Alabama",

  difficulty: 2,
  cleanliness: 4,
  fishing: 4,

  flow: "Unknown",
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
        id: "paintRock-pa-1",
        name: "Paint Rock River Fording Point (Public Access)",
        latitude: 34.69891,
        longitude: -86.30797,
        type: "public",
      },
      {
        id: "paintRock-pa-2",
        name: "Hwy 72 (Public Access)",
        latitude: 34.62433,
        longitude: -86.30650,
        type: "public",
      },
    ],

    private: [
      {
        id: "paintRock-pr-1",
        name: "Paint Rock River Canoe and Kayak Rental (Private Access)",
        latitude: 34.66018,
        longitude: -86.32627,
        type: "private",
      },
    ],
  },
  pois: [    
  ],

  coordinates: paintRockRiverCoordinates,
};