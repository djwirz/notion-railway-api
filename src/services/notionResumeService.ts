import dotenv from "dotenv";

dotenv.config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const RESUMES_DB_ID = process.env.NOTION_RESUMES_DB_ID;
const JOB_APPLICATIONS_DB_ID = process.env.NOTION_JOB_APPLICATIONS_DB_ID;

if (!NOTION_API_KEY || !RESUMES_DB_ID || !JOB_APPLICATIONS_DB_ID) {
    throw new Error("❌ Missing required environment variables (NOTION_API_KEY, NOTION_RESUMES_DB_ID, NOTION_JOB_APPLICATIONS_DB_ID).");
}

const NOTION_HEADERS = {
    "Authorization": `Bearer ${NOTION_API_KEY}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
};

/**
 * Fetches the latest Base Resume.
 */
async function getLatestBaseResume() {
    const response = await fetch(`https://api.notion.com/v1/databases/${RESUMES_DB_ID}/query`, {
        method: "POST",
        headers: NOTION_HEADERS,
        body: JSON.stringify({
            filter: { property: "Base Resume", checkbox: { equals: true } },
            sorts: [{ property: "Created Date", direction: "descending" }],
            page_size: 1,
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch base resume: ${response.statusText}`);
    }

    const data = await response.json();
    const baseResume = data.results[0];

    if (!baseResume) {
        throw new Error("No Base Resume found.");
    }

    return baseResume;
}

/**
 * Splits a string into chunks of 2000 characters or less for Notion rich_text compliance.
 */
function splitTextIntoChunks(text: string, chunkSize: number = 2000) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.substring(i, i + chunkSize));
  }
  return chunks.map(chunk => ({ text: { content: chunk } }));
}

/**
* Creates a new Resume entry in Notion with chunked Markdown.
*/
async function createResume(baseResume: any, applicationId: string) {
  const markdownContent = baseResume.properties["Markdown"].rich_text.map((t: any) => t.plain_text).join("");

  // Split Markdown into multiple rich_text blocks
  const markdownChunks = splitTextIntoChunks(markdownContent);

  const requestBody = {
      parent: { database_id: RESUMES_DB_ID },
      properties: {
          Name: { title: [{ text: { content: "Resume for Application" } }] },
          "Markdown": { rich_text: markdownChunks },
          "Base Resume": { checkbox: false },
          "Created Date": { date: { start: new Date().toISOString() } },
      },
  };

  console.log("🔍 Creating Notion Resume with chunked payload:", JSON.stringify(requestBody, null, 2));

  const response = await fetch(`https://api.notion.com/v1/pages`, {
      method: "POST",
      headers: NOTION_HEADERS,
      body: JSON.stringify(requestBody),
  });

  const data = await response.json();

  if (!response.ok) {
      console.error("❌ Notion API Error:", JSON.stringify(data, null, 2));
      throw new Error(`Failed to create new resume: ${response.statusText}`);
  }

  return data;
}



/**
 * Links the newly created Resume to the Job Application.
 */
async function linkResumeToJobApplication(applicationId: string, resumeId: string) {
    const response = await fetch(`https://api.notion.com/v1/pages/${applicationId}`, {
        method: "PATCH",
        headers: NOTION_HEADERS,
        body: JSON.stringify({
            properties: {
                Resume: { relation: [{ id: resumeId }] },
            },
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to link resume to job application: ${response.statusText}`);
    }
}

/**
 * Main function: Creates a Resume and links it to the Job Application.
 */
export async function createResumeFromApplication(applicationId: string) {
    const baseResume = await getLatestBaseResume();
    const newResume = await createResume(baseResume, applicationId);
    await linkResumeToJobApplication(applicationId, newResume.id);
}
