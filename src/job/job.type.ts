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

export interface StoreScheduleJob extends Job {
  type: JobName.STORE_SCHEDULE;
  responseUrl: string;
  userId: string;
  fromHour24: number;
  toHour24: number;
}

export interface ClearScheduleJob extends Job {
  type: JobName.CLEAR_SCHEDULE;
  responseUrl: string;
  userId: string;
}

export interface StoreAuthJob extends Job {
  type: JobName.STORE_AUTH;
  userId: string;
  authToken: string;
}

export interface ClearAuthJob extends Job {
  type: JobName.CLEAR_AUTH;
  responseUrl: string;
  userId: string;
}
