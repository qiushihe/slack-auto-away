import { S3Client } from "@aws-sdk/client-s3";

import { UserSchedule } from "~src/constant/user-data.constant";
import { InteractivityEventHandler } from "~src/functions/interactivity/event-handler.type";
import { arrayUnique } from "~src/util/array.util";
import { promisedFn } from "~src/util/promise.util";
import { getUserData, setUserData } from "~src/util/user-data.util";
import { State as StatePayload } from "~src/view/payload.type";
import { modalView, ScheduleModalViewMetadata } from "~src/view/schedule/view";

type RecordValues<T> = T[keyof T];

const DATE_STRING_REGEXP = new RegExp("^\\d\\d\\d\\d-\\d\\d-\\d\\d$");

const REMOVE_EXCEPTION_DATE_ACTION_ID_REGEXP = new RegExp(
  "^remove-exception-date-(\\d\\d\\d\\d-\\d\\d-\\d\\d)$"
);

export const eventHandler: InteractivityEventHandler =
  (logger, dataBucketName, slackApiUrlPrefix) => async (payload) => {
    if (payload.type !== "block_actions" && payload.type !== "view_submission") {
      logger.warn(`Unknown interactivity payload type: ${payload["type"]}`);
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

    let timeAuto: string = "09:00";
    const timeAutoInput = allInputs["time-auto"];
    if (timeAutoInput && timeAutoInput.type == "timepicker" && timeAutoInput.selected_time) {
      timeAuto = timeAutoInput.selected_time;
    }

    let timeAway: string = "17:00";
    const timeAwayInput = allInputs["time-away"];
    if (timeAwayInput && timeAwayInput.type == "timepicker" && timeAwayInput.selected_time) {
      timeAway = timeAwayInput.selected_time;
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

    let saturdayTimeAuto: string = "10:00";
    const saturdayTimeAutoInput = allInputs["saturday-time-auto"];
    if (
      saturdayTimeAutoInput &&
      saturdayTimeAutoInput.type == "timepicker" &&
      saturdayTimeAutoInput.selected_time
    ) {
      saturdayTimeAuto = saturdayTimeAutoInput.selected_time;
    }

    let saturdayTimeAway: string = "16:00";
    const saturdayTimeAwayInput = allInputs["saturday-time-away"];
    if (
      saturdayTimeAwayInput &&
      saturdayTimeAwayInput.type == "timepicker" &&
      saturdayTimeAwayInput.selected_time
    ) {
      saturdayTimeAway = saturdayTimeAwayInput.selected_time;
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

    let sundayTimeAuto: string = "11:00";
    const sundayTimeAutoInput = allInputs["sunday-time-auto"];
    if (
      sundayTimeAutoInput &&
      sundayTimeAutoInput.type == "timepicker" &&
      sundayTimeAutoInput.selected_time
    ) {
      sundayTimeAuto = sundayTimeAutoInput.selected_time;
    }

    let sundayTimeAway: string = "15:00";
    const sundayTimeAwayInput = allInputs["sunday-time-away"];
    if (
      sundayTimeAwayInput &&
      sundayTimeAwayInput.type == "timepicker" &&
      sundayTimeAwayInput.selected_time
    ) {
      sundayTimeAway = sundayTimeAwayInput.selected_time;
    }

    let exceptionDates = privateMetadata?.exceptionDates || [];
    if (payload.type === "block_actions") {
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
    }

    let pauseUpdates: boolean = false;
    const pauseUpdatesInput = allInputs["pause-updates"];
    if (pauseUpdatesInput && pauseUpdatesInput.type === "checkboxes") {
      pauseUpdates = !!pauseUpdatesInput.selected_options.find(
        ({ value }) => value === "pause-updates"
      );
    }

    const scheduleData: UserSchedule = {
      timeAuto,
      timeAway,
      disableSaturdaySchedule,
      differentSaturdaySchedule,
      saturdayTimeAuto,
      saturdayTimeAway,
      disableSundaySchedule,
      differentSundaySchedule,
      sundayTimeAuto,
      sundayTimeAway,
      exceptionDates: arrayUnique(exceptionDates),
      pauseUpdates
    };

    if (payload.type === "view_submission") {
      logger.log(`Saving user schedule data ...`);
      const setUserDataErr = await setUserData(
        logger,
        new S3Client(),
        dataBucketName,
        payload.user.id,
        {
          schedule: scheduleData
        }
      );
      if (setUserDataErr) {
        return new Error(`Unable to save user schedule data: ${setUserDataErr.message}`);
      } else {
        logger.log(`Done saving user schedule data`);
      }
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

          // Slack automatically maintain input values between renders based on input ID.
          // So we only have to provide values for those fields that have side effects based on
          // the input's value (i.e. rendering different labels based on checkbox status, etc.)
          view: modalView({
            disableSaturdaySchedule: scheduleData.disableSaturdaySchedule,
            showSaturdayTimePickers: scheduleData.differentSaturdaySchedule,
            disableSundaySchedule: scheduleData.disableSundaySchedule,
            showSundayTimePickers: scheduleData.differentSundaySchedule,
            exceptionDates: scheduleData.exceptionDates
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
