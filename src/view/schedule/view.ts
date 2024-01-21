import { format as formatDate, parse as parseDate } from "date-fns";

import { ModalView, OptionObject } from "~src/view/view.type";

export type ScheduleModalViewOptions = {
  initialTimeAuto?: string;
  initialTimeAway?: string;

  disableSaturdaySchedule?: boolean;
  showSaturdayTimePickers?: boolean;

  initialSaturdayTimeAuto?: string;
  initialSaturdayTimeAway?: string;

  disableSundaySchedule?: boolean;
  showSundayTimePickers?: boolean;

  initialSundayTimeAuto?: string;
  initialSundayTimeAway?: string;

  /**
   * An array of exception date strings.
   * Individual date strings must be in the format of `"YYYY-MM-DD"`.
   */
  exceptionDates?: string[];

  pauseUpdates?: boolean;
};

export type ScheduleModalViewMetadata = {
  exceptionDates?: string[];
};

const scheduleLabeler = (options?: ScheduleModalViewOptions) => {
  const excludeSaturday = options?.disableSaturdaySchedule || options?.showSaturdayTimePickers;
  const excludeSunday = options?.disableSundaySchedule || options?.showSundayTimePickers;

  return (status: string): string => {
    if (excludeSaturday && excludeSunday) {
      return `Set my status to \`${status}\` every weekday at:`;
    } else if (excludeSaturday) {
      return `Set to \`${status}\` every weekday plus Sunday at:`;
    } else if (excludeSunday) {
      return `Set to \`${status}\` every weekday plus Saturday at:`;
    } else {
      return `Set my status to \`${status}\` every day at:`;
    }
  };
};

export const modalView = (options?: ScheduleModalViewOptions): ModalView => {
  const getDefaultScheduleLabel = scheduleLabeler(options);

  const privateMetadata: ScheduleModalViewMetadata = {
    exceptionDates: options?.exceptionDates || []
  };

  const disableSaturdayScheduleOption: OptionObject = {
    text: { type: "plain_text", text: "Disable status update on Saturday" },
    value: "disable-saturday-schedule"
  };

  const differentSaturdayScheduleOption: OptionObject = {
    text: {
      type: "plain_text",
      text: "Use different update schedule for Saturday"
    },
    value: "different-saturday-schedule"
  };

  const disableSundayScheduleOption: OptionObject = {
    text: { type: "plain_text", text: "Disable status update on Sunday" },
    value: "disable-sunday-schedule"
  };

  const differentSundayScheduleOption: OptionObject = {
    text: { type: "plain_text", text: "Use different update schedule for Sunday" },
    value: "different-sunday-schedule"
  };

  const pauseUpdateOption: OptionObject = {
    text: { type: "plain_text", text: "Pause status updates" },
    value: "pause-updates"
  };

  return {
    type: "modal",
    callback_id: "schedule-view",
    private_metadata: JSON.stringify(privateMetadata),
    title: { type: "plain_text", text: "Auto Away Schedule" },
    blocks: [
      { type: "header", text: { type: "plain_text", text: "Scheduled Auto Away Time" } },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Select the times when *Slack Auto Away* would set and unset your `away` status."
        }
      },
      {
        type: "section",
        block_id: "section-schedule-time-auto",
        text: { type: "mrkdwn", text: getDefaultScheduleLabel("auto") },
        accessory: {
          type: "timepicker",
          action_id: "time-auto",
          initial_time: options?.initialTimeAuto
        }
      },
      {
        type: "section",
        block_id: "section-schedule-time-away",
        text: { type: "mrkdwn", text: getDefaultScheduleLabel("away") },
        accessory: {
          type: "timepicker",
          action_id: "time-away",
          initial_time: options?.initialTimeAway
        }
      },
      {
        type: "section",
        block_id: "section-saturday-schedule",
        text: { type: "mrkdwn", text: "Saturday schedule" },
        accessory: {
          type: "checkboxes",
          action_id: "saturday-schedule",
          options: [
            disableSaturdayScheduleOption,
            ...(options?.disableSaturdaySchedule ? [] : [differentSaturdayScheduleOption])
          ],
          ...(options?.disableSaturdaySchedule || options?.showSaturdayTimePickers
            ? {
                initial_options: [
                  ...(options?.disableSaturdaySchedule ? [disableSaturdayScheduleOption] : []),
                  ...(!options?.disableSaturdaySchedule && options?.showSaturdayTimePickers
                    ? [differentSaturdayScheduleOption]
                    : [])
                ]
              }
            : {})
        }
      },
      ...(!options?.disableSaturdaySchedule && options?.showSaturdayTimePickers
        ? [
            {
              type: "section",
              block_id: "section-saturday-schedule-time-auto",
              text: { type: "mrkdwn", text: "Set my status to `auto` on Saturday at:" },
              accessory: {
                type: "timepicker",
                action_id: "saturday-time-auto",
                initial_time: options.initialSaturdayTimeAuto
              }
            } as const,
            {
              type: "section",
              block_id: "section-saturday-schedule-time-away",
              text: { type: "mrkdwn", text: "Set my status to `away` on Saturday at:" },
              accessory: {
                type: "timepicker",
                action_id: "saturday-time-away",
                initial_time: options.initialSaturdayTimeAway
              }
            } as const
          ]
        : []),
      {
        type: "section",
        block_id: "section-sunday-schedule",
        text: { type: "mrkdwn", text: "Sunday schedule" },
        accessory: {
          type: "checkboxes",
          action_id: "sunday-schedule",
          options: [
            disableSundayScheduleOption,
            ...(options?.disableSundaySchedule ? [] : [differentSundayScheduleOption])
          ],
          ...(options?.disableSundaySchedule || options?.showSundayTimePickers
            ? {
                initial_options: [
                  ...(options?.disableSundaySchedule ? [disableSundayScheduleOption] : []),
                  ...(!options?.disableSundaySchedule && options?.showSundayTimePickers
                    ? [differentSundayScheduleOption]
                    : [])
                ]
              }
            : {})
        }
      },
      ...(!options?.disableSundaySchedule && options?.showSundayTimePickers
        ? [
            {
              type: "section",
              block_id: "section-sunday-schedule-time-auto",
              text: { type: "mrkdwn", text: "Set my status to `auto` on Sunday at:" },
              accessory: {
                type: "timepicker",
                action_id: "sunday-time-auto",
                initial_time: options.initialSundayTimeAuto
              }
            } as const,
            {
              type: "section",
              block_id: "section-sunday-schedule-time-away",
              text: { type: "mrkdwn", text: "Set my status to `away` on Sunday at:" },
              accessory: {
                type: "timepicker",
                action_id: "sunday-time-away",
                initial_time: options.initialSundayTimeAway
              }
            } as const
          ]
        : []),
      { type: "header", text: { type: "plain_text", text: "Exceptions and Pause Updates" } },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "To skip status updates on specific dates, use the form below:"
        }
      },
      ...(options?.exceptionDates || []).map(
        (exceptionDate) =>
          ({
            type: "section",
            block_id: `section-exception-date-${exceptionDate}`,
            text: {
              type: "mrkdwn",
              text: formatDate(parseDate(exceptionDate, "yyyy-MM-dd", new Date()), "MMMM do, yyyy")
            },
            accessory: {
              type: "button",
              action_id: `remove-exception-date-${exceptionDate}`,
              text: { type: "plain_text", text: "Remove" }
            }
          }) as const
      ),
      {
        type: "actions",
        block_id: "section-add-exception-date",
        elements: [
          { type: "datepicker", action_id: "new-exception-date" },
          {
            type: "button",
            action_id: "add-exception-date",
            text: { type: "plain_text", text: "Add" }
          }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "To indefinitely pause status updates, check the checkbox below:"
        }
      },
      {
        type: "actions",
        block_id: "section-pause-updates",
        elements: [
          {
            type: "checkboxes",
            action_id: "pause-updates",
            options: [pauseUpdateOption],
            ...(options?.pauseUpdates ? { initial_options: [pauseUpdateOption] } : {})
          }
        ]
      }
    ],
    close: { type: "plain_text", text: "Cancel" },
    submit: { type: "plain_text", text: "Submit" }
  };
};
