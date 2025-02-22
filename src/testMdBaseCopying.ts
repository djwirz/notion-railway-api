import dotenv from "dotenv";
import { createResumeFromApplication } from "./services/notionResumeService";

dotenv.config();

/**
 * Test Script to run createResumeFromApplication locally
 */
async function testCreateResume() {
    // Replace with a valid job application ID from your Notion database
    const applicationId = process.env.TEST_APPLICATION_ID || "your_test_application_id_here";

    if (!applicationId) {
        console.error("❌ Error: Missing test application ID.");
        process.exit(1);
    }

    try {
        console.log(`🚀 Running test: Creating resume for Job Application ID: ${applicationId}...`);
        await createResumeFromApplication(applicationId);
        console.log("✅ Success: Resume created and linked to job application.");
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

testCreateResume();
