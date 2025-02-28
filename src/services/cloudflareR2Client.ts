import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // 👈 Set this to your bucket’s public base URL
const R2_ENDPOINT = process.env.R2_ENDPOINT;

if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_URL || !R2_ENDPOINT) {
    throw new Error("❌ Cloudflare R2 credentials are missing in environment variables.");
}

const s3Client = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

/**
 * Uploads a file buffer to Cloudflare R2 and returns a **permanent public URL**.
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
        console.log(`✅ Upload successful.`);

        // Construct the permanent **public** URL
        const publicUrl = `${R2_PUBLIC_URL}/${fileName}`;
        console.log(`✅ Public URL: ${publicUrl}`);

        return publicUrl;
    } catch (error) {
        console.error("❌ Cloudflare R2 upload error:", error);
        throw new Error("Failed to upload file to Cloudflare R2.");
    }
}
