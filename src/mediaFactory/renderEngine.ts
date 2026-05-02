import { MediaFactoryOutput } from "./schema.js";
import { RenderPackage, RenderJob } from "./renderSchema.js";

export function buildRenderPackage(mf: MediaFactoryOutput): RenderPackage {
  const jobs: RenderJob[] = [];
  const warnings: string[] = [];

  for (const asset of mf.assets) {
    let target: RenderJob["target"] = "json";
    let renderer: RenderJob["renderer"] = "internal_plan";
    const requiredSecrets: string[] = [];

    switch (asset.type) {
      case "markdown":
      case "text":
        target = "markdown";
        break;
      case "html":
      case "web_page":
        target = "html";
        break;
      case "docx_plan":
        target = "docx";
        renderer = "external_api";
        requiredSecrets.push("DOCX_RENDERER_API_KEY");
        break;
      case "pdf_plan":
        target = "pdf";
        renderer = "external_api";
        requiredSecrets.push("PDF_RENDERER_API_KEY");
        break;
      case "slides_plan":
        target = "pptx";
        renderer = "external_api";
        requiredSecrets.push("SLIDES_RENDERER_API_KEY");
        break;
      case "image_prompt":
        target = "image";
        renderer = "external_api";
        requiredSecrets.push("IMAGE_API_KEY");
        break;
      case "audio_script":
        target = "audio";
        renderer = "external_api";
        requiredSecrets.push("TTS_API_KEY");
        break;
      case "video_brief":
        target = "video";
        renderer = "manual_review";
        break;
      default:
        target = "json";
    }

    const blockingIssues: string[] = [];
    if (renderer === "external_api" && !requiredSecrets.length) {
      blockingIssues.push("Missing API key configuration");
    }

    jobs.push({
      id: `job-${asset.id}`,
      assetId: asset.id,
      mediaType: asset.type,
      target,
      title: asset.title,
      input: asset.output,
      renderer,
      requiredSecrets,
      status: blockingIssues.length ? "blocked" : "planned",
      blockingIssues
    });
  }

  const deliveryChecklist = [
    "All external API keys configured",
    "Outputs reviewed for factual accuracy",
    "Sensitive data redacted where required",
    "Formats validated (PDF/DOCX/PPTX)",
    "Consistency check across all media"
  ];

  if (jobs.some(j => j.status === "blocked")) {
    warnings.push("Some render jobs are blocked due to missing configuration");
  }

  return { id: `render-${mf.id}`, jobs, deliveryChecklist, warnings };
}
