import { ModalView } from "~src/view/view.type";

type ScheduleModalViewOptions = {
  disableSaturdaySchedule?: boolean;
  showSaturdayTimePickers?: boolean;
  disableSundaySchedule?: boolean;
  showSundayTimePickers?: boolean;
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

export const scheduleModalView = (options?: ScheduleModalViewOptions): ModalView => {
  const getDefaultScheduleLabel = scheduleLabeler(options);

  return {
    type: "modal",
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
        block_id: "section-schedule-time-away",
        text: { type: "mrkdwn", text: getDefaultScheduleLabel("away") },
        accessory: { type: "timepicker", action_id: "time-away" }
      },
      {
        type: "section",
        block_id: "section-schedule-time-auto",
        text: { type: "mrkdwn", text: getDefaultScheduleLabel("auto") },
        accessory: { type: "timepicker", action_id: "time-auto" }
      },
      {
        type: "section",
        block_id: "section-saturday-schedule",
        text: { type: "mrkdwn", text: "Saturday schedule" },
        accessory: {
          type: "checkboxes",
          action_id: "saturday-schedule",
          options: [
            {
              text: { type: "plain_text", text: "Disable status update on Saturday" },
              value: "disable-saturday-schedule"
            },
            ...(options?.disableSaturdaySchedule
              ? []
              : [
                  {
                    text: {
                      type: "plain_text",
                      text: "Use different update schedule for Saturday"
                    },
                    value: "different-saturday-schedule"
                  } as const
                ])
          ]
        }
      },
      ...(!options?.disableSaturdaySchedule && options?.showSaturdayTimePickers
        ? [
            {
              type: "section",
              block_id: "section-saturday-schedule-time-away",
              text: { type: "mrkdwn", text: "Set my status to `away` on Saturday at:" },
              accessory: { type: "timepicker", action_id: "saturday-time-away" }
            } as const,
            {
              type: "section",
              block_id: "section-saturday-schedule-time-auto",
              text: { type: "mrkdwn", text: "Set my status to `auto` on Saturday at:" },
              accessory: { type: "timepicker", action_id: "saturday-time-auto" }
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
            {
              text: { type: "plain_text", text: "Disable status update on Sunday" },
              value: "disable-sunday-schedule"
            },
            ...(options?.disableSundaySchedule
              ? []
              : [
                  {
                    text: { type: "plain_text", text: "Use different update schedule for Sunday" },
                    value: "different-sunday-schedule"
                  } as const
                ])
          ]
        }
      },
      ...(!options?.disableSundaySchedule && options?.showSundayTimePickers
        ? [
            {
              type: "section",
              block_id: "section-sunday-schedule-time-away",
              text: { type: "mrkdwn", text: "Set my status to `away` on Sunday at:" },
              accessory: { type: "timepicker", action_id: "sunday-time-away" }
            } as const,
            {
              type: "section",
              block_id: "section-sunday-schedule-time-auto",
              text: { type: "mrkdwn", text: "Set my status to `auto` on Sunday at:" },
              accessory: { type: "timepicker", action_id: "sunday-time-auto" }
            } as const
          ]
        : [])
    ],
    close: { type: "plain_text", text: "Cancel" },
    submit: { type: "plain_text", text: "Submit" }
  };
};
