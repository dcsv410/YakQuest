import { StateCode } from "../types";

export const riverStates: {
  code: StateCode;
  name: string;
}[] = [
  {
    code: "AL",
    name: "Alabama",
  },
  {
    code: "TN",
    name: "Tennessee",
  },
];

export const stateNamesByCode: Record<StateCode, string> = {
  AL: "Alabama",
  TN: "Tennessee",
  GA: "Georgia",
  FL: "Florida",
  MS: "Mississippi",
  CO: "Colorado",
};