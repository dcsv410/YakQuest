export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type StateCode = "AL" | "TN" | "GA" | "FL" | "MS" | "CO";

export type RiverPointType = "public" | "private" | "poi" | "hazard";

export type RiverPoint = Coordinate & {
  id: string;
  name: string;
  type: RiverPointType;
  description?: string;
  photos?: string[];
  website?: string;
  phone?: string;
  parking?: boolean;
  restroom?: boolean;
  camping?: boolean;
  hazardType?: string;
  poiType?: string;
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
  slug: string;

  state: StateCode;
  stateName: string;

  difficulty: number;
  cleanliness: number;
  fishing: number;

  flow?: string;
  usgsGaugeId?: string;
  flowStats?: FlowStats;

  coordinates: Coordinate[];

  accessPoints: {
    public: RiverPoint[];
    private: RiverPoint[];
  };

  pois: RiverPoint[];
};