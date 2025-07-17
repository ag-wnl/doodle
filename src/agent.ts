import { getModel } from "./gemini";
import { saveMarkdown } from "./markdown";

const MAX_ITERATIONS = 5; // Increased for more thorough research
const QUALITY_THRESHOLD = 8; // Out of 10, minimum quality score to stop iterating

interface ResearchSection {
  title: string;
  content: string;
  sources: string[];
}

interface QualityEvaluation {
  score: number;
  feedback: string;
  missingAreas: string[];
}

export async function research(topic: string) {
  console.log(`🔍 Initializing comprehensive research for: "${topic}"`);
  const model = await getModel();

  console.log(`\n📋 Step 1: Understanding topic and creating research plan...`);
  const planningResult = await planResearch(model, topic);
  if (!planningResult) return;

  const { researchPlan, keyAreas } = planningResult;
  console.log(
    `\n🎯 Research plan created with ${keyAreas.length} key areas to explore`
  );

  let researchSections: ResearchSection[] = [];
  let iteration = 0;
  let qualityScore = 0;

  while (iteration < MAX_ITERATIONS && qualityScore < QUALITY_THRESHOLD) {
    iteration++;
    console.log(
      `\n🔄 Iteration ${iteration}/${MAX_ITERATIONS} - Researching key areas...`
    );

    // Research each key area
    for (const area of keyAreas) {
      console.log(`  📚 Researching: ${area}`);
      const section = await researchArea(model, topic, area, researchSections);
      if (section) {
        const existingIndex = researchSections.findIndex(
          (s) => s.title === section.title
        );
        if (existingIndex >= 0) {
          // Update existing section
          researchSections[existingIndex] = section;
        } else {
          // Add new section
          researchSections.push(section);
        }
      }
    }

    console.log(`\n📊 Evaluating research quality...`);
    const evaluation = await evaluateQuality(model, topic, researchSections);
    qualityScore = evaluation.score;

    console.log(`  Quality Score: ${qualityScore}/10`);
    console.log(`  Feedback: ${evaluation.feedback}`);

    if (qualityScore < QUALITY_THRESHOLD && iteration < MAX_ITERATIONS) {
      console.log(
        `\n🔍 Quality below threshold. Identifying areas for improvement...`
      );
      if (evaluation.missingAreas.length > 0) {
        console.log(
          `  Missing areas identified: ${evaluation.missingAreas.join(", ")}`
        );
        // Add missing areas to research plan
        evaluation.missingAreas.forEach((area) => {
          if (!keyAreas.includes(area)) {
            keyAreas.push(area);
          }
        });
      }
    } else if (qualityScore >= QUALITY_THRESHOLD) {
      console.log(
        `\n✅ Quality threshold reached! Moving to final synthesis...`
      );
      break;
    }
  }

  console.log(
    `\n🧠 Step 4: Adding extra knowledge section with related insights...`
  );
  const extraKnowledge = await generateExtraKnowledge(
    model,
    topic,
    researchSections
  );

  // Step 5: Final synthesis and formatting
  console.log(`\n📝 Step 5: Synthesizing final document...`);
  const finalMarkdown = await synthesizeFinalDocument(
    model,
    topic,
    researchSections,
    extraKnowledge
  );

  // Step 6: Save the markdown file
  const filePath = await saveMarkdown(topic, finalMarkdown);
  console.log(`\n🎉 Research complete! Document saved to: ${filePath}`);
  console.log(`📈 Final quality score: ${qualityScore}/10`);
}

async function planResearch(model: any, topic: string) {
  const prompt = `You are a research planning expert. For the topic "${topic}", create a comprehensive research plan.

1. First, provide a brief analysis of what this topic encompasses
2. Then, identify 4-6 key areas that need to be thoroughly researched to understand this topic completely
3. Consider both fundamental concepts and advanced/practical applications

Return your response in this exact format:
ANALYSIS: [Your analysis of the topic]

KEY_AREAS:
- [Area 1]
- [Area 2]
- [Area 3]
- [Area 4]
- [Area 5]
- [Area 6]

Focus on areas that would be most valuable for someone learning about this topic.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    const analysisMatch = response.match(
      /ANALYSIS:\s*([\s\S]*?)(?=KEY_AREAS:|$)/
    );
    const areasMatch = response.match(/KEY_AREAS:\s*((?:- .*(?:\n|$))*)/);

    if (!areasMatch) {
      console.error("Could not parse research plan. Using fallback approach.");
      return null;
    }

    const keyAreas = areasMatch[1]
      .split("\n")
      .map((line: string) => line.replace(/^-\s*/, "").trim())
      .filter((area: string) => area.length > 0);

    const researchPlan = analysisMatch
      ? analysisMatch[1].trim()
      : "Research plan generated";

    return { researchPlan, keyAreas };
  } catch (error) {
    console.error("Error during research planning:", error);
    return null;
  }
}

async function researchArea(
  model: any,
  mainTopic: string,
  area: string,
  existingSections: ResearchSection[]
): Promise<ResearchSection | null> {
  const existingContext =
    existingSections.length > 0
      ? `\n\nExisting research context:\n${existingSections
          .map((s) => `- ${s.title}: ${s.content.substring(0, 200)}...`)
          .join("\n")}`
      : "";

  const prompt = `You are a thorough researcher. Research the area "${area}" in the context of the main topic "${mainTopic}".

${existingContext}

Provide comprehensive information including:
1. Core concepts and definitions
2. Key principles or mechanisms
3. Real-world applications and examples
4. Code snippets (if applicable and relevant)
5. Important considerations or best practices
6. Links to authoritative sources (use real, verifiable URLs when possible)

Format your response as well-structured content with proper headings and subheadings. 
Include code blocks using markdown syntax when providing code examples.
Include a SOURCES section at the end with numbered references.

Make sure to provide factual, accurate information and avoid speculation.`;

  try {
    const result = await model.generateContent(prompt);
    const content = result.response.text();

    // Extract sources from the content
    const sourcesMatch = content.match(/SOURCES?:?\s*((?:\d+\..*(?:\n|$))*)/i);
    const sources = sourcesMatch
      ? sourcesMatch[1]
          .split("\n")
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0)
      : [];

    return {
      title: area,
      content: content,
      sources: sources,
    };
  } catch (error) {
    console.error(`Error researching area "${area}":`, error);
    return null;
  }
}

async function evaluateQuality(
  model: any,
  topic: string,
  sections: ResearchSection[]
): Promise<QualityEvaluation> {
  const sectionsText = sections
    .map((s) => `${s.title}:\n${s.content.substring(0, 500)}...`)
    .join("\n\n");

  const prompt = `You are a quality evaluator for research documents. Evaluate the quality and completeness of this research on "${topic}".

Research sections:
${sectionsText}

Rate the research on a scale of 1-10 considering:
1. Completeness and depth of coverage
2. Accuracy and factual content
3. Practical examples and code snippets (if relevant)
4. Source citations and references
5. Clarity and organization
6. Coverage of both fundamental and advanced concepts

Return your response in this exact format:
SCORE: [number from 1-10]
FEEDBACK: [detailed feedback on what's good and what could be improved]
MISSING_AREAS: [comma-separated list of important areas that are missing or need more coverage]

Be constructive but thorough in your evaluation.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    const scoreMatch = response.match(/SCORE:\s*(\d+)/);
    const feedbackMatch = response.match(
      /FEEDBACK:\s*([\s\S]*?)(?=MISSING_AREAS:|$)/
    );
    const missingMatch = response.match(/MISSING_AREAS:\s*([\s\S]*?)$/);

    const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;
    const feedback = feedbackMatch
      ? feedbackMatch[1].trim()
      : "Evaluation completed";
    const missingAreas = missingMatch
      ? missingMatch[1]
          .split(",")
          .map((area: string) => area.trim())
          .filter((area: string) => area.length > 0)
      : [];

    return { score, feedback, missingAreas };
  } catch (error) {
    console.error("Error during quality evaluation:", error);
    return {
      score: 5,
      feedback: "Could not evaluate quality",
      missingAreas: [],
    };
  }
}

async function generateExtraKnowledge(
  model: any,
  topic: string,
  sections: ResearchSection[]
): Promise<string> {
  const prompt = `Based on the research about "${topic}", generate an "Extra Knowledge" section with fascinating related insights.

Include:
1. Interesting historical anecdotes or lesser-known facts
2. Related technologies, concepts, or fields that readers might find intriguing
3. Emerging trends or future developments
4. Genius insights or innovative applications
5. Cross-disciplinary connections

Make this section engaging and thought-provoking while maintaining accuracy. Use markdown formatting with proper headings and bullet points.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error generating extra knowledge:", error);
    return "## Extra Knowledge\n\nAdditional insights could not be generated at this time.";
  }
}

async function synthesizeFinalDocument(
  model: any,
  topic: string,
  sections: ResearchSection[],
  extraKnowledge: string
): Promise<string> {
  const sectionsText = sections
    .map((s) => `## ${s.title}\n\n${s.content}`)
    .join("\n\n");
  const allSources = sections
    .flatMap((s) => s.sources)
    .filter((source, index, arr) => arr.indexOf(source) === index);

  const prompt = `Create a final, well-structured markdown document about "${topic}". 

Organize and synthesize the following research sections into a coherent, professional document:

${sectionsText}

Requirements:
1. Start with a compelling title and brief introduction
2. Create a table of contents
3. Organize content logically with clear headings and subheadings
4. Ensure all code snippets are properly formatted in markdown code blocks
5. Include the extra knowledge section
6. Add a comprehensive references section at the end
7. Use proper markdown formatting throughout
8. Make sure the document flows well and is easy to read

Extra Knowledge Section:
${extraKnowledge}

Create a document that serves as an excellent learning resource for someone studying this topic.`;

  try {
    const result = await model.generateContent(prompt);
    let finalContent = result.response.text();

    // ensure references section includes all collected sources
    if (allSources.length > 0) {
      const referencesSection = `\n\n## References\n\n${allSources
        .map((source, i) => `${i + 1}. ${source}`)
        .join("\n")}`;

      // add references if not already included
      if (
        !finalContent.toLowerCase().includes("references") &&
        !finalContent.toLowerCase().includes("sources")
      ) {
        finalContent += referencesSection;
      }
    }

    return finalContent;
  } catch (error) {
    console.error("Error during final synthesis:", error);
    // Fallback: create a basic structured document
    return createFallbackDocument(topic, sections, extraKnowledge);
  }
}

function createFallbackDocument(
  topic: string,
  sections: ResearchSection[],
  extraKnowledge: string
): string {
  const sectionsText = sections
    .map((s) => `## ${s.title}\n\n${s.content}`)
    .join("\n\n");
  const allSources = sections
    .flatMap((s) => s.sources)
    .filter((source, index, arr) => arr.indexOf(source) === index);

  return `# ${topic}

## Table of Contents
${sections
  .map((s) => `- [${s.title}](#${s.title.toLowerCase().replace(/\s+/g, "-")})`)
  .join("\n")}
- [Extra Knowledge](#extra-knowledge)
- [References](#references)

## Introduction

This document provides comprehensive information about ${topic}, covering key concepts, practical applications, and additional insights.

${sectionsText}

${extraKnowledge}

## References

${allSources.map((source, i) => `${i + 1}. ${source}`).join("\n")}
`;
}
