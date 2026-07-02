import { Alert } from "react-native";
import { pickContributionPhoto } from "./photoContribution";
import { saveAndSubmitContribution } from "../../services/contributionService";

type SubmitPointPhotoContributionArgs = {
  riverId: string;
  riverName: string;
  state?: string;
  pointId: string;
  pointName: string;
};

export async function submitPointPhotoContribution({
  riverId,
  riverName,
  state,
  pointId,
  pointName,
}: SubmitPointPhotoContributionArgs) {
  const photoUri = await pickContributionPhoto();

  if (!photoUri) return;

  const { submitted } = await saveAndSubmitContribution({
    kind: "point-photo",
    riverId,
    riverName,
    state,
    points: [],
    targetPointId: pointId,
    targetPointName: pointName,
    photoUri,
    photoCaption: null,
  });

  Alert.alert(
    submitted ? "Photo Submitted" : "Saved for Retry",
    submitted
      ? "Thanks! This photo will appear after it is approved."
      : "The photo was saved locally, but could not be submitted right now."
  );
}