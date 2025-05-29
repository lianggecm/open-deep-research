import { Client as ClientWorkflow } from "@upstash/workflow";
import { Client as ClientQstash } from "@upstash/qstash";
import { S3Client } from "@aws-sdk/client-s3";

export const workflow = new ClientWorkflow({
  token: process.env.QSTASH_TOKEN!,
});

export const qstash = new ClientQstash({
  token: process.env.QSTASH_TOKEN!,
});

export const awsS3Client = new S3Client({
  region: process.env.S3_UPLOAD_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_UPLOAD_KEY || "",
    secretAccessKey: process.env.S3_UPLOAD_SECRET || "",
  },
});
