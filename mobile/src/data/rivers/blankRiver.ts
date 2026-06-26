// go to https://waterdata.usgs.gov/ to find gauge IDs and flow stats for real rivers. 

import { River } from "../types";

export const blankRiver: River = {
  id: "river_id",
  name: "River Name",
  difficulty: 3,
  cleanliness: 4,
  fishing: 5,
  usgsGaugeId: "00000000",
  flowStats: {
    lowPercentile: 200,
    median: 600,
    highPercentile: 1500,
    max: 4000,
  },
  accessPoints: {
    public: [
      {
        id: "public_id_1",
        name: "Name (Public Access)",
        latitude: 35.19238,
        longitude: -86.28018,
      },
    ],

    private: [
      {
        id: "private_id_1",
        name: "Name (Private Access)",
        latitude: 35.12720,
        longitude: -86.40793,
      },
    ],
  },
  pois: [
    {
      id: "poi_id_1",
      type: "other",
      name: "Name",
      latitude: 35.13061,
      longitude: -86.43705,
    },
  ],
  coordinates: [
  {
    "latitude": 35.19203464129069,
    "longitude": -86.28092784962493
  },
],
};