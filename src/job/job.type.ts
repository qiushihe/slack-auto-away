import { JobName } from "~src/constant/job.constant";

export type Job = {
  type: JobName;
};

export interface SendResponseJob extends Job {
  type: JobName.SEND_RESPONSE;
  responseUrl: string;
  responseMessage: string;
}

export interface CheckStatusJob extends Job {
  type: JobName.CHECK_STATUS;
  responseUrl: string;
  userId: string;
}
