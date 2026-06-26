import { River } from "../../types";
import { flintRiverCoordinates } from "./flintRiver.coordinates";

export const flintRiverAL: River = {
  id: "al-flint-river",
  name: "Flint River",
  slug: "flint-river",

  state: "AL",
  stateName: "Alabama",

  difficulty: 2,
  cleanliness: 4,
  fishing: 4,

  flow: "Unknown",
  usgsGaugeId: "03575100",

  flowStats: {
    lowPercentile: 200,
    median: 400,
    highPercentile: 1000,
    max: 3000,
  },

  accessPoints: {
    public: [
      {
        id: "al_flint-pa-1",
        name: "Hump Creek Swimming Hole (Public Access)",
        latitude: 34.91758,
        longitude: -86.50261,
        type: "public",        
      },
      {
        id: "al_flint-pa-2",
        name: "Oscar Patterson Kayak Input Point (Public Access)",
        latitude: 34.87985,
        longitude: -86.48100,
        type: "public",
      },
      {
        id: "al_flint-pa-4",
        name: "Ryland Pike Bridge (Public Access)",
        latitude: 34.76774,
        longitude: -86.44248,
        type: "public",
      },
      {
        id: "al_flint-pa-5",
        name: "Toledo Landing US-72 (Public Access)",
        latitude: 34.74117,
        longitude: -86.44115,
        type: "public",
      },
      {
        id: "al_flint-pa-6",
        name: "Little Cove Rd (Public Access)",
        latitude: 34.69643,
        longitude: -86.42238,
        type: "public",
      },
      {
        id: "al_flint-pa-7",
        name: "Old Hwy 431 Kayak Launch (Public Access)",
        latitude: 34.65131,
        longitude: -86.44845,
        type: "public",
      },
      {
        id: "al_flint-pa-8",
        name: "Hays Preserve Kayak Launch (Public Access)",
        latitude: 34.64361,
        longitude: -86.46568,
        type: "public",
      },
      {
        id: "al_flint-pa-9",
        name: "Hwy 431 Bridge (Public Access)",
        latitude: 34.63865,
        longitude: -86.46843,
        type: "public",
      },
      {
        id: "al_flint-pa-10",
        name: "Old Big Cove Rd (Public Access)",
        latitude: 34.59388,
        longitude: -86.46836,
        type: "public",
      },
    ],

    private: [
      {
        id: "al_flint-pa-1",
        name: "Bloucher Ford Preserve (Private Access)",
        latitude: 34.87454,
        longitude: -86.47561,
        type: "private",
      },
      {
        id: "al_flint-pr-2",
        name: "Berryhill Estates River Park (Private Access)",
        latitude: 34.84083,
        longitude: -86.47172,
        type: "private",
      },
      {
        id: "al_flint-pr-3",
        name: "Brown Bear Kayak Rental (Private Access)",
        latitude: 34.82250,
        longitude: -86.48301,
        type: "private",  
      },
      {
        id: "al_flint-pr-4",
        name: "Brown Bear Exit (Private Access)",
        latitude: 34.77029,
        longitude: -86.44281,
        type: "private",
      },
    ],
  },

   pois: [
    {
      id: "al_flint-poi-1",
      name: "Rope Swing",
      latitude: 34.79524,
      longitude: -86.47928,
      type: "poi",
    },
    {
      id: "al_flint-poi-2",
      name: "Fording Spot",
      latitude: 34.78763,
      longitude: -86.48413,
      type: "poi",
    },
    {
      id: "al_flint-poi-3",
      name: "Buffalo Island, stay right",
      latitude: 34.66858,
      longitude: -86.43434,
      type: "poi",
    },
  ],

  coordinates: flintRiverCoordinates,
};