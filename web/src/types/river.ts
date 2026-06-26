export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type RiverPointType =
  | "public"
  | "private"
  | "public_access"
  | "private_access"
  | "poi"
  | "hazard";

export type RiverPoint = Coordinate & {
  id: string;
  name: string;
  type: RiverPointType;
  description?: string | null;
  parking?: boolean;
  restroom?: boolean;
  camping?: boolean;
  photos?: string[];
  website?: string | null;
  phone?: string | null;
};

export type FlowStats = {
  lowPercentile: number;
  median: number;
  highPercentile: number;
  max: number;
};

export type River = {
  id: string;
  name: string;
  state: string;
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