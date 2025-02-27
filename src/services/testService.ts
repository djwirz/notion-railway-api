import puppeteer from "puppeteer";
import MarkdownIt from "markdown-it";
import { writeFile } from "fs/promises"; // ✅ Corrected import

/**
 * Converts Markdown to properly structured HTML for PDF generation using different spacing methods.
 */
function convertMarkdownToHTML(markdown: string, layoutOption: string): string {
    const md = new MarkdownIt({
        html: true,
        linkify: true, // Auto-detects URLs and converts them to links
    });

    let htmlContent = md.render(markdown);

    // Ensure email is NOT hyperlinked
    htmlContent = htmlContent.replace(
        /<a href="mailto:[^"]+">([^<]+)<\/a>/g,
        "$1"
    );

    // Remove duplicate header by stripping out the first markdown header element
    htmlContent = htmlContent.replace(/<h1>.*?<\/h1>/, ""); 

    let spacingStyles = "";

    if (layoutOption === "margin-padding") {
        spacingStyles = `
            .experience-container h3 { margin-bottom: 2px; } /* Title close to role */
            .experience-container .job-company { margin-bottom: 2px; } /* Company close to bullets */
            .experience-container ul { margin-top: 2px; } /* Tighter spacing to bullets */
        `;
    } else if (layoutOption === "flexbox") {
        spacingStyles = `
            .experience-container { display: flex; flex-direction: column; gap: 2px; }
            .experience-container h3 { order: 1; }
            .experience-container .job-company { order: 2; }
            .experience-container ul { order: 3; margin-top: 0; padding-top: 0; }
        `;
    } else if (layoutOption === "whitespace") {
        // Manipulating the HTML structure itself
        htmlContent = htmlContent.replace(/<\/h3>\s*<p class="job-company">/g, "</h3><br><p class='job-company'>");
        htmlContent = htmlContent.replace(/<\/p>\s*<ul>/g, "</p><br><ul>");
    }

    return `
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.4; max-width: 850px; margin: auto; padding: 20px; }
                h1, h2, h3 { color: #222; }
                h1 { font-size: 22px; text-align: center; margin-bottom: 4px; } 
                h2 { font-size: 18px; }
                h3 { font-size: 16px; font-weight: bold; }
                a { color: black; text-decoration: underline; }
                strong { font-weight: bold; }
                hr { border: none; border-top: 1px solid #ccc; margin: 12px 0; }
                .header { text-align: center; }
                .experience-container { margin-bottom: 10px; }
                .project-header { display: flex; justify-content: space-between; align-items: center; font-weight: bold; }
                ${spacingStyles}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Daniel J. Wirz</h1>
                <p class="header-info">
                    <a href="https://github.com/djwirz">GitHub</a> | 
                    <a href="https://linkedin.com/in/djwirz">LinkedIn</a> | 
                    Minneapolis, MN | 715-225-8532 | djwirz@gmail.com
                </p>
                <p class="summary">
                    Software Engineer experienced in healthcare solutions and AI-enabled developer tools. 
                    Building scalable microservices, AI-driven agentic solutions, and enabling ridiculous personal use cases in Notion.
                </p>
            </div>
            ${htmlContent}
        </body>
        </html>
    `;
}

/**
 * Generates three PDFs with different spacing approaches for testing.
 */
export async function generateTestPDFs(markdown: string): Promise<void> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    for (const layoutOption of ["margin-padding", "flexbox", "whitespace"]) {
        const htmlContent = convertMarkdownToHTML(markdown, layoutOption);
        await page.setContent(htmlContent, { waitUntil: "networkidle0" });

        const pdfBuffer = await page.pdf({
            format: "A4",
            margin: { top: "18px", bottom: "18px", left: "22px", right: "22px" },
        });

        await writeFile(`test_output_${layoutOption}.pdf`, pdfBuffer); // ✅ Fixed this line
    }

    await browser.close();
}
