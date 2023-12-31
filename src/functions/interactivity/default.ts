import { S3Client } from "@aws-sdk/client-s3";
import { Handler } from "aws-lambda";

import { InteractivityEventPayload, InteractivityPayload } from "~src/constant/event.constant";
import { arrayUnique } from "~src/util/array.util";
import { processEnvGetString } from "~src/util/env.util";
import { NamespacedLogger } from "~src/util/logger.util";
import { promisedFn } from "~src/util/promise.util";
import { eventBodyExtractor, IVerifiableEvent } from "~src/util/request.util";
import { emptyResponse } from "~src/util/response.util";
import { getUserData } from "~src/util/user-data.util";
import { State as StatePayload } from "~src/view/payload.type";
import { scheduleModalView, ScheduleModalViewMetadata } from "~src/view/schedule.view";

interface InteractivityDefaultEvent extends IVerifiableEvent {}

type RecordValues<T> = T[keyof T];

const DATE_STRING_REGEXP = new RegExp("^\\d\\d\\d\\d-\\d\\d-\\d\\d$");

const REMOVE_EXCEPTION_DATE_ACTION_ID_REGEXP = new RegExp(
  "^remove-exception-date-(\\d\\d\\d\\d-\\d\\d-\\d\\d)$"
);

const logger = new NamespacedLogger("interactivity/default");

export const handler: Handler<InteractivityDefaultEvent> = async (evt) => {
  logger.log("Event: ", evt);

  const dataBucketName = processEnvGetString("DATA_BUCKET_NAME");
  const slackApiUrlPrefix = processEnvGetString("SLACK_API_URL_PREFIX");
  const signingSecret = processEnvGetString("SIGNING_SECRET");

  const extractInteractivityEventBody = eventBodyExtractor<InteractivityEventPayload>(
    logger,
    true,
    "v0",
    signingSecret
  );

  logger.log(`Extracting event body ...`);
  const [evtBodyErr, evtBody] = extractInteractivityEventBody(evt);
  if (evtBodyErr) {
    logger.error(`Unable to extract event body: ${evtBodyErr.message}`);
    return emptyResponse();
  } else {
    logger.log(`Done extracting event body`);
  }

  logger.log(`Parsing interactivity payload ...`);
  const [interactivityPayloadErr, interactivityPayload] = await promisedFn<InteractivityPayload>(
    () => JSON.parse(evtBody.payload)
  );
  if (interactivityPayloadErr) {
    logger.error(`Unable to parse interactivity payload: ${interactivityPayloadErr.message}`);
    return emptyResponse();
  } else {
    logger.log(`Done parsing interactivity payload`);
  }

  if (interactivityPayload.type !== "block_actions") {
    logger.warn(`Unknown interactivity payload type: ${interactivityPayload.type}`);
    return emptyResponse();
  }

  const [privateMetadataErr, privateMetadata] = await promisedFn<ScheduleModalViewMetadata>(() =>
    JSON.parse(interactivityPayload.view.private_metadata || "{}")
  );
  if (privateMetadataErr) {
    logger.error(`Unable to parse private metadata: ${privateMetadataErr.message}`);
    return emptyResponse();
  }

  const allInputs = Object.values(interactivityPayload.view.state.values).reduce(
    (acc, blocksInputs) => ({
      ...acc,
      ...blocksInputs
    }),
    {} as Record<string, RecordValues<RecordValues<StatePayload["values"]>>>
  );

  let exceptionDates = privateMetadata?.exceptionDates || [];
  const addExceptionDateClicked = !!interactivityPayload.actions.find(
    (action) => action.type === "button" && action.action_id === "add-exception-date"
  );
  const newExceptionDateInput = allInputs["new-exception-date"];
  if (
    addExceptionDateClicked &&
    newExceptionDateInput &&
    newExceptionDateInput.type === "datepicker" &&
    newExceptionDateInput.selected_date &&
    newExceptionDateInput.selected_date.match(DATE_STRING_REGEXP)
  ) {
    exceptionDates.push(newExceptionDateInput.selected_date);
  }
  const removeExceptionDateAction = interactivityPayload.actions.find(
    (action) =>
      action.type === "button" &&
      (action.action_id || "").match(REMOVE_EXCEPTION_DATE_ACTION_ID_REGEXP)
  );
  if (removeExceptionDateAction) {
    const actionIdMatch = removeExceptionDateAction.action_id.match(
      REMOVE_EXCEPTION_DATE_ACTION_ID_REGEXP
    );
    const dateString = actionIdMatch?.[1];
    if (dateString && dateString.match(DATE_STRING_REGEXP)) {
      exceptionDates = exceptionDates.filter((exceptionDate) => exceptionDate !== dateString);
    }
  }

  let disableSaturdaySchedule: boolean = false;
  let differentSaturdaySchedule: boolean = false;
  const saturdayScheduleInput = allInputs["saturday-schedule"];
  if (saturdayScheduleInput && saturdayScheduleInput.type === "checkboxes") {
    disableSaturdaySchedule = !!saturdayScheduleInput.selected_options.find(
      ({ value }) => value === "disable-saturday-schedule"
    );
    differentSaturdaySchedule = !!saturdayScheduleInput.selected_options.find(
      ({ value }) => value === "different-saturday-schedule"
    );
  }

  let disableSundaySchedule: boolean = false;
  let differentSundaySchedule: boolean = false;
  const sundayScheduleInput = allInputs["sunday-schedule"];
  if (sundayScheduleInput && sundayScheduleInput.type === "checkboxes") {
    disableSundaySchedule = !!sundayScheduleInput.selected_options.find(
      ({ value }) => value === "disable-sunday-schedule"
    );
    differentSundaySchedule = !!sundayScheduleInput.selected_options.find(
      ({ value }) => value === "different-sunday-schedule"
    );
  }

  logger.log(`Getting user data ...`);
  const [userDataErr, userData] = await getUserData(
    logger,
    new S3Client(),
    dataBucketName,
    interactivityPayload.user.id
  );
  if (userDataErr) {
    logger.error(`Unable to get user data: ${userDataErr.message}`);
    return emptyResponse();
  } else {
    logger.log(`Done getting user data`);
  }
  if (!userData) {
    logger.error("Missing get user data");
    return emptyResponse();
  }
  if (!userData.authToken) {
    logger.error("Missing get user authentication token");
    return emptyResponse();
  }

  logger.log(`Updating modal ...`);
  const [err] = await promisedFn(() =>
    fetch(`${slackApiUrlPrefix}/views.update`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userData.authToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        view_id: interactivityPayload.view.id,
        view: scheduleModalView({
          disableSaturdaySchedule: disableSaturdaySchedule,
          showSaturdayTimePickers: differentSaturdaySchedule,
          disableSundaySchedule: disableSundaySchedule,
          showSundayTimePickers: differentSundaySchedule,
          exceptionDates: arrayUnique(exceptionDates)
        })
      })
    })
  );
  if (err) {
    logger.error(`Error updating modal: ${err.message}`);
  } else {
    logger.log(`Done updating modal`);
  }

  return emptyResponse();
};
