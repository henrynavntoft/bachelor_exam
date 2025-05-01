import { S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({
    region: "eu-central-1",
    endpoint: process.env.LINODE_OBJECT_STORAGE_ENDPOINT,
    credentials: {
        accessKeyId: process.env.LINODE_ACCESS_KEY!,
        secretAccessKey: process.env.LINODE_SECRET_KEY!,
    },
    forcePathStyle: true, // required by Linode
});

export default s3;