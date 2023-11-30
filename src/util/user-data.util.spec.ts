import { beforeEach, describe, expect, it } from "@jest/globals";

import {
  CreateBucketCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException
} from "@aws-sdk/client-s3";

import { userDataS3StorageKey } from "../constant/s3.constant";
import { NamespacedLogger, UnitTestNamespacedLogger } from "./logger.util";
import { getUserData, setUserData, UserData } from "./user-data.util";
import { uuidV4 } from "./uuid.util";

describe("util / user-data", () => {
  let logger: NamespacedLogger;
  let s3: S3Client;
  let bucketName: string;
  let userId: string;

  beforeEach(() => {
    logger = new UnitTestNamespacedLogger("unit test");

    s3 = new S3Client({
      endpoint: "https://s3.localhost.localstack.cloud:4566",
      region: "us-east-1",
      credentials: { accessKeyId: "aCcEsS", secretAccessKey: "sEcEeT" }
    });

    bucketName = `test-bucket-${uuidV4()}`;
    userId = `test-user-${uuidV4()}`;
  });

  describe("getUserData", () => {
    it("should return error when bucket does not exist", async () => {
      const [err] = await getUserData(logger, s3, bucketName, userId);

      expect(err).toBeInstanceOf(S3ServiceException);
      expect(err as S3ServiceException).toHaveProperty("name", "NoSuchBucket");
    });

    describe("when bucket exists", () => {
      beforeEach(async () => {
        await s3.send(new CreateBucketCommand({ Bucket: bucketName }));
      });

      it("should return error when user data file does not exist", async () => {
        const [err] = await getUserData(logger, s3, bucketName, userId);

        expect(err).toBeInstanceOf(S3ServiceException);
        expect(err as S3ServiceException).toHaveProperty("name", "NoSuchKey");
      });

      describe("when user data file exists", () => {
        let userData: UserData;

        beforeEach(async () => {
          userData = { userId };

          await s3.send(
            new PutObjectCommand({
              Bucket: bucketName,
              Key: userDataS3StorageKey(userId),
              Body: JSON.stringify(userData)
            })
          );
        });

        it("should return user data file", async () => {
          const [err, data] = await getUserData(logger, s3, bucketName, userId);

          expect(err).toBeNull();
          expect(data).not.toBeNull();
          expect(data).toHaveProperty("userId", userId);
        });
      });
    });
  });

  describe("setUserData", () => {
    it("should return error when bucket does not exist", async () => {
      const err = await setUserData(logger, s3, bucketName, userId, {
        timezoneName: "Zone/Twilight"
      });

      expect(err).toBeInstanceOf(S3ServiceException);
      expect(err as S3ServiceException).toHaveProperty("name", "NoSuchBucket");
    });

    describe("when bucket exists", () => {
      let timezoneName: string;

      beforeEach(async () => {
        timezoneName = "Zone/Twilight";

        await s3.send(new CreateBucketCommand({ Bucket: bucketName }));
      });

      it("should set user data when user data file does not exist", async () => {
        const err = await setUserData(logger, s3, bucketName, userId, { timezoneName });

        expect(err).toBeNull();

        const getObjectOutput = await s3.send(
          new GetObjectCommand({ Bucket: bucketName, Key: userDataS3StorageKey(userId) })
        );

        expect(getObjectOutput).not.toBeNull();
        expect(getObjectOutput).toHaveProperty("Body");

        const userData = JSON.parse(
          await getObjectOutput.Body!.transformToString("utf-8")
        ) as UserData;
        expect(userData).toHaveProperty("userId", userId);
        expect(userData).toHaveProperty("timezoneName", timezoneName);
      });

      describe("when user data file exists", () => {
        let userData: UserData;

        beforeEach(async () => {
          userData = { userId, authToken: `test-auth-token-${uuidV4()}` };

          await s3.send(
            new PutObjectCommand({
              Bucket: bucketName,
              Key: userDataS3StorageKey(userId),
              Body: JSON.stringify(userData)
            })
          );
        });

        it("should set user data when user data file exists", async () => {
          const err = await setUserData(logger, s3, bucketName, userId, { timezoneName });

          expect(err).toBeNull();

          const getObjectOutput = await s3.send(
            new GetObjectCommand({ Bucket: bucketName, Key: userDataS3StorageKey(userId) })
          );

          expect(getObjectOutput).not.toBeNull();
          expect(getObjectOutput).toHaveProperty("Body");

          const userData = JSON.parse(
            await getObjectOutput.Body!.transformToString("utf-8")
          ) as UserData;
          expect(userData).toHaveProperty("userId", userData.userId);
          expect(userData).toHaveProperty("authToken", userData.authToken);
          expect(userData).toHaveProperty("timezoneName", timezoneName);
        });
      });
    });
  });
});
