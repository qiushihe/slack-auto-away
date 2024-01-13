import { S3Client } from "@aws-sdk/client-s3";

import { InteractivityEventHandler } from "~src/functions/interactivity/event-handler.type";
import { arrayUnique } from "~src/util/array.util";
import { promisedFn } from "~src/util/promise.util";
import { getUserData } from "~src/util/user-data.util";
import { State as StatePayload } from "~src/view/payload.type";
import { modalView, ScheduleModalViewMetadata } from "~src/view/schedule/view";

type RecordValues<T> = T[keyof T];

const DATE_STRING_REGEXP = new RegExp("^\\d\\d\\d\\d-\\d\\d-\\d\\d$");

const REMOVE_EXCEPTION_DATE_ACTION_ID_REGEXP = new RegExp(
  "^remove-exception-date-(\\d\\d\\d\\d-\\d\\d-\\d\\d)$"
);

export const eventHandler: InteractivityEventHandler =
  (logger, dataBucketName, slackApiUrlPrefix) => async (payload) => {
    logger.log("!!! payload", JSON.stringify(payload, null, 2));

    if (payload.type !== "block_actions") {
      logger.warn(`Unknown interactivity payload type: ${payload.type}`);
      return null;
    }

    const [privateMetadataErr, privateMetadata] = await promisedFn<ScheduleModalViewMetadata>(() =>
      JSON.parse(payload.view.private_metadata || "{}")
    );
    if (privateMetadataErr) {
      return new Error(`Unable to parse private metadata: ${privateMetadataErr.message}`);
    }

    const allInputs = Object.values(payload.view.state.values).reduce(
      (acc, blocksInputs) => ({
        ...acc,
        ...blocksInputs
      }),
      {} as Record<string, RecordValues<RecordValues<StatePayload["values"]>>>
    );

    let exceptionDates = privateMetadata?.exceptionDates || [];
    const addExceptionDateClicked = !!payload.actions.find(
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
    const removeExceptionDateAction = payload.actions.find(
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
      payload.user.id
    );
    if (userDataErr) {
      return new Error(`Unable to get user data: ${userDataErr.message}`);
    } else {
      logger.log(`Done getting user data`);
    }
    if (!userData) {
      return new Error("Missing get user data");
    }
    if (!userData.authToken) {
      return new Error("Missing get user authentication token");
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
          view_id: payload.view.id,
          view: modalView({
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
      return new Error(`Error updating modal: ${err.message}`);
    } else {
      logger.log(`Done updating modal`);
    }

    return null;
  };
