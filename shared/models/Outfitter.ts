export type Outfitter = {
  id: string;
  riverId: string;

  name: string;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  description?: string | null;

  highestPutInPointId?: string | null;
  lowestTakeOutPointId?: string | null;
  accessPointIds: string[];

  isActive: boolean;
};