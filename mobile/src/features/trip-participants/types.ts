export type TripParticipant = {
  userId: string;
  displayName: string;
};

export type CompletedTripParticipant = {
  userId: string;
  displayName: string;
  role: "navigator" | "participant";
};

export type TripParticipantQrToken = {
  token: string;
  qrValue: string;
  displayName: string;
  expiresAt: string;
};