import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_ENDPOINT = process.env.R2_ENDPOINT; // Ensure this is set to your Cloudflare R2-compatible endpoint

if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_ENDPOINT) {
    throw new Error("❌ Cloudflare R2 credentials are missing in environment variables.");
}

const s3Client = new S3Client({
    region: "auto", // Cloudflare R2 does not use traditional AWS regions
    endpoint: R2_ENDPOINT,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

/**
 * Uploads a file buffer to Cloudflare R2.
 */
export async function uploadToCloudflareR2(fileBuffer: Buffer, fileName: string): Promise<string> {
    try {
        console.log(`🟡 Uploading ${fileName} to Cloudflare R2...`);

        const uploadParams = {
            Bucket: R2_BUCKET_NAME,
            Key: fileName,
            Body: fileBuffer,
            ContentType: "application/pdf",
        };

        await s3Client.send(new PutObjectCommand(uploadParams));

        const fileUrl = `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${fileName}`;
        console.log(`✅ Upload successful. File URL: ${fileUrl}`);

        return fileUrl;
    } catch (error) {
        console.error("❌ Cloudflare R2 upload error:", error);
        throw new Error("Failed to upload file to Cloudflare R2.");
    }
}
