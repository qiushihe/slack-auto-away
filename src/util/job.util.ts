import { SendMessageCommand } from "@aws-sdk/client-sqs";

import { JobByName, JobName } from "~src/constant/job.constant";

export const invokeJobCommand = <TName extends JobName>(
  queueUrl: string,
  name: TName,
  job: Omit<JobByName[TName], "type">
): SendMessageCommand =>
  new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify({ ...job, type: name })
  });
