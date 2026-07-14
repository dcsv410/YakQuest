import { Alert } from "react-native";

import { pickContributionPhoto } from "./photoContribution";
import { saveAndSubmitContribution } from "../../services/contributionService";
import { getCurrentUser } from "../../services/authService";

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
  const user = await getCurrentUser();

  if (!user) {
    Alert.alert(
      "Login Required",
      "Please sign in before uploading photos."
    );
    return;
  }

  const photoUri =
    await pickContributionPhoto();

  if (!photoUri) {
    return;
  }

  Alert.alert(
    "Confirm Photo Submission",
    `Please confirm that this photo is for:\n\n${pointName}\n${riverName}`,
    [
      {
        text: "Choose Again",
        style: "cancel",
      },
      {
        text: "Submit Photo",
        onPress: async () => {
          try {
            const { submitted } =
              await saveAndSubmitContribution({
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
              submitted
                ? "Photo Submitted"
                : "Saved for Retry",
              submitted
                ? "Thanks! This photo will appear after it is approved."
                : "The photo was saved locally, but could not be submitted right now."
            );
          } catch (error) {
            console.error(
              "Failed to submit point photo",
              error
            );

            Alert.alert(
              "Submission Failed",
              "YakQuest could not submit this photo. Please try again."
            );
          }
        },
      },
    ]
  );
}