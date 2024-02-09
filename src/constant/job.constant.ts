export enum JobName {
  SEND_RESPONSE = "SEND_RESPONSE",
  CHECK_STATUS = "CHECK_STATUS",
  STORE_AUTH = "STORE_AUTH",
  STORE_TIMEZONE = "STORE_TIMEZONE",
  LOGOUT = "LOGOUT",
  INDEX_USER_DATA = "INDEX_USER_DATA"
}

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

export interface StoreAuthJob extends Job {
  type: JobName.STORE_AUTH;
  userId: string;
  authToken: string;
}

export interface StoreTimezoneJob extends Job {
  type: JobName.STORE_TIMEZONE;
  userId: string;
  timezoneName: string;
}

export interface LogoutJob extends Job {
  type: JobName.LOGOUT;
  responseUrl: string;
  userId: string;
}

export interface IndexUserDataJob extends Job {
  type: JobName.INDEX_USER_DATA;
  userId: string;
}

export type JobByName = {
  [JobName.SEND_RESPONSE]: SendResponseJob;
  [JobName.CHECK_STATUS]: CheckStatusJob;
  [JobName.STORE_AUTH]: StoreAuthJob;
  [JobName.STORE_TIMEZONE]: StoreTimezoneJob;
  [JobName.LOGOUT]: LogoutJob;
  [JobName.INDEX_USER_DATA]: IndexUserDataJob;
};
