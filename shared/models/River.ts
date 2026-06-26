import type { Coordinate } from "./Coordinate"; 
import type { RiverPoint } from "./RiverPoint";

export type FlowStats = {
  lowPercentile: number;
  median: number;
  highPercentile: number;
  max: number;
};

export type River = {
  id: string;
  name: string;
  slug?: string | null;

  state: string;
  stateName?: string | null;

  usgsGaugeId?: string | null;
  flowStats?: FlowStats | null;

  difficulty: number;
  cleanliness: number;
  fishing: number;

  coordinates: Coordinate[];

  accessPoints: {
    public: RiverPoint[];
    private: RiverPoint[];
  };

  pois: RiverPoint[];
  hazards?: RiverPoint[];
};