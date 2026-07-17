import {
  API_URL,
} from "../config";

export type EmailTripPlanRequest = {
  recipientEmail: string;
  riverName: string;
  state: string;
  launchName: string;
  takeoutName: string;
  distanceMiles: number;
  estimatedTime: string;
  plannedLaunch?: string | null;
  pdfBlob: Blob;
  pdfFilename: string;
};

async function readApiError(
  response: Response
) {
  try {
    const data =
      await response.json();

    if (
      data &&
      typeof data.detail === "string"
    ) {
      return data.detail;
    }
  } catch {
    // Use fallback below.
  }

  return (
    "Unable to email the trip plan."
  );
}

export async function sendTripPlanEmail(
  request: EmailTripPlanRequest
) {
  const formData = new FormData();

  formData.append(
    "recipient_email",
    request.recipientEmail
  );

  formData.append(
    "river_name",
    request.riverName
  );

  formData.append(
    "state",
    request.state
  );

  formData.append(
    "launch_name",
    request.launchName
  );

  formData.append(
    "takeout_name",
    request.takeoutName
  );

  formData.append(
    "distance_miles",
    String(
      request.distanceMiles
    )
  );

  formData.append(
    "estimated_time",
    request.estimatedTime
  );

  if (request.plannedLaunch) {
    formData.append(
      "planned_launch",
      request.plannedLaunch
    );
  }

  formData.append(
    "pdf",
    request.pdfBlob,
    request.pdfFilename
  );

  const response = await fetch(
    `${API_URL}/trip-plans/email`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(
      await readApiError(response)
    );
  }

  return response.json() as Promise<{
    message: string;
  }>;
}