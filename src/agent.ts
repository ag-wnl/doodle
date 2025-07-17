import { getModel } from "./gemini";
import { saveMarkdown } from "./markdown";

const MAX_ITERATIONS = 10; // Allow more iterations for quality
const QUALITY_THRESHOLD = 8; // Out of 10

interface ResearchState {
  topic: string;
  currentContent: string;
  iteration: number;
  completedSubTopics: string[];
  identifiedGaps: string[];
}

export async function research(topic: string) {
  console.log(`🔍 Initializing comprehensive research for: ${topic}`);
  const model = await getModel();

  const state: ResearchState = {
    topic,
    currentContent: "",
    iteration: 0,
    completedSubTopics: [],
    identifiedGaps: [],
  };

  try {
    // Step 1: Initial Analysis & Planning
    await performInitialAnalysis(model, state);

    // Step 2: Iterative Research & Improvement
    await performIterativeResearch(model, state);

    // Step 3: Add Extra Knowledge Section
    await addExtraKnowledge(model, state);

    // Step 4: Final Polish & Save
    await finalizeAndSave(model, state);
  } catch (error) {
    console.error("❌ Research failed:", error);
    console.log("💾 Saving partial results...");
    const filePath = await saveMarkdown(
      topic,
      state.currentContent ||
        `# Research Failed for ${topic}\n\nError: ${error}`
    );
    console.log(`📄 Partial results saved to: ${filePath}`);
  }
}

async function performInitialAnalysis(model: any, state: ResearchState) {
  console.log(`📋 [Step 1] Analyzing topic and creating research plan...`);

  const analysisPrompt = `You are a research expert tasked with creating a comprehensive learning document about "${state.topic}".

CRITICAL INSTRUCTIONS:
- Be factually accurate and avoid hallucination
- Only state information you are confident about
- For any uncertain information, clearly mark it as "needs verification"
- Focus on verifiable, well-established knowledge

Your task: Analyze this topic and create a detailed research plan.

1. Provide a brief overview of what "${state.topic}" is
2. Identify 5-7 key subtopics that would give someone a comprehensive understanding
3. Determine what level of technical depth is appropriate (beginner, intermediate, advanced)
4. Suggest specific areas where code examples would be valuable
5. List important historical context or foundational concepts

Format your response as a structured plan in markdown.`;

  const result = await model.generateContent(analysisPrompt);
  const analysis = result.response.text();

  state.currentContent = `# Research Plan for ${state.topic}\n\n${analysis}\n\n---\n\n`;
  console.log("✅ Initial analysis complete");
}

async function performIterativeResearch(model: any, state: ResearchState) {
  console.log(`🔄 [Step 2] Beginning iterative research process...`);

  while (state.iteration < MAX_ITERATIONS) {
    state.iteration++;
    console.log(
      `\n📚 [Iteration ${state.iteration}/${MAX_ITERATIONS}] Researching and improving document...`
    );

    // Identify what to research next
    const nextSteps = await identifyNextResearchSteps(model, state);
    if (!nextSteps.hasMore) {
      console.log(
        "✅ Research appears complete, moving to quality evaluation..."
      );
      break;
    }

    // Perform the research
    await conductResearch(model, state, nextSteps.focus);

    // Evaluate current quality
    const quality = await evaluateDocumentQuality(model, state);
    console.log(`📊 Current document quality: ${quality.score}/10`);

    if (quality.score >= QUALITY_THRESHOLD && quality.isComplete) {
      console.log("🎯 Quality threshold reached and document is complete!");
      break;
    }

    if (quality.suggestions.length > 0) {
      state.identifiedGaps = quality.suggestions;
      console.log(
        `📝 Areas for improvement: ${quality.suggestions.join(", ")}`
      );
    }
  }
}

async function identifyNextResearchSteps(model: any, state: ResearchState) {
  const prompt = `Review the current research document for "${
    state.topic
  }" and determine what should be researched next.

Current document:
---
${state.currentContent}
---

Completed subtopics: ${state.completedSubTopics.join(", ")}
Identified gaps: ${state.identifiedGaps.join(", ")}

Instructions:
1. Determine if more research is needed (respond with "true" or "false")
2. If more research is needed, identify the most important next focus area
3. Be specific about what aspect needs attention

Respond in this exact format:
HAS_MORE: [true/false]
FOCUS: [specific area to research next, or "none" if no more research needed]
REASON: [brief explanation]`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  const hasMore = response.includes("HAS_MORE: true");
  const focusMatch = response.match(/FOCUS: (.+)/);
  const focus = focusMatch ? focusMatch[1].trim() : "";

  return { hasMore, focus };
}

async function conductResearch(
  model: any,
  state: ResearchState,
  focus: string
) {
  console.log(`🔍 Researching: ${focus}`);

  const researchPrompt = `You are researching "${focus}" as part of a comprehensive document about "${
    state.topic
  }".

CRITICAL GUIDELINES:
- Provide ONLY factually accurate information
- Include specific, real examples and case studies when possible
- Add relevant code snippets with proper syntax highlighting
- Include references to authoritative sources (mark as "Reference needed: [description]" if you cannot provide exact URLs)
- Structure content with clear headings and subheadings
- Make the content educational and easy to understand

Current document context:
---
${state.currentContent.slice(-2000)} // Last 2000 chars for context
---

Your task: Create a comprehensive section about "${focus}" that integrates well with the existing document. Include:
1. Clear explanations with examples
2. Code snippets where relevant (properly formatted)
3. Real-world applications or use cases
4. Any important considerations or best practices
5. Reference placeholders for further reading

Format your response in markdown.`;

  const result = await model.generateContent(researchPrompt);
  const newContent = result.response.text();

  // Integrate the new content
  state.currentContent += `\n## ${focus}\n\n${newContent}\n\n`;
  state.completedSubTopics.push(focus);
}

async function evaluateDocumentQuality(model: any, state: ResearchState) {
  const prompt = `Evaluate the quality and completeness of this research document about "${state.topic}":

---
${state.currentContent}
---

Rate the document on these criteria (1-10 scale):
1. Completeness: Does it cover all essential aspects?
2. Accuracy: Is the information factually correct?
3. Clarity: Is it well-written and easy to understand?
4. Examples: Are there sufficient code examples and real-world cases?
5. Structure: Is it well-organized with clear sections?

Respond in this exact format:
SCORE: [average score 1-10]
COMPLETE: [true/false - is the document comprehensive enough?]
SUGGESTIONS: [list 2-3 specific areas that need improvement, separated by semicolons, or "none" if no major improvements needed]

Be honest and constructive in your evaluation.`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  const scoreMatch = response.match(/SCORE: (\d+(?:\.\d+)?)/);
  const score = scoreMatch ? parseFloat(scoreMatch[1]) : 5;

  const isComplete = response.includes("COMPLETE: true");

  const suggestionsMatch = response.match(/SUGGESTIONS: (.+)/);
  const suggestionsText = suggestionsMatch ? suggestionsMatch[1].trim() : "";
  const suggestions =
    suggestionsText === "none"
      ? []
      : suggestionsText.split(";").map((s: string) => s.trim());

  return { score, isComplete, suggestions };
}

async function addExtraKnowledge(model: any, state: ResearchState) {
  console.log(`🧠 [Step 3] Adding extra knowledge section...`);

  const extraPrompt = `Based on your comprehensive research about "${state.topic}", create an "Extra Knowledge" section that includes:

1. **Related Genius Concepts**: Fascinating related topics or advanced concepts that would interest someone learning about ${state.topic}
2. **Cutting-Edge Developments**: Recent innovations or emerging trends in this field
3. **Cross-Disciplinary Connections**: How this topic connects to other fields or domains
4. **Hidden Insights**: Non-obvious but valuable insights that experts know
5. **Future Implications**: Where this field might be heading

Guidelines:
- Make it genuinely interesting and thought-provoking
- Include specific examples and real applications
- Add code snippets if relevant to demonstrate advanced concepts
- Keep it factual and avoid speculation beyond clearly marked predictions
- Structure with clear subheadings

Format in markdown as a comprehensive "Extra Knowledge" section.`;

  const result = await model.generateContent(extraPrompt);
  const extraContent = result.response.text();

  state.currentContent += `\n---\n\n# Extra Knowledge\n\n${extraContent}\n\n`;
  console.log("✅ Extra knowledge section added");
}

async function finalizeAndSave(model: any, state: ResearchState) {
  console.log(`✨ [Step 4] Finalizing document...`);

  const finalPrompt = `Polish and finalize this research document about "${state.topic}". 

Current document:
---
${state.currentContent}
---

Your tasks:
1. Add a compelling introduction that summarizes key learning outcomes
2. Ensure all sections flow logically
3. Add a proper table of contents
4. Include a "References and Further Reading" section with placeholder citations
5. Add conclusion/summary section
6. Ensure all code blocks are properly formatted
7. Fix any formatting issues or inconsistencies

Return the complete, polished document in markdown format.`;

  const result = await model.generateContent(finalPrompt);
  const finalContent = result.response.text();

  // Save the final document
  const filePath = await saveMarkdown(state.topic, finalContent);

  console.log(`\n🎉 Research complete!`);
  console.log(`📊 Final document stats:`);
  console.log(`   - Iterations: ${state.iteration}`);
  console.log(`   - Subtopics covered: ${state.completedSubTopics.length}`);
  console.log(`   - Content length: ${finalContent.length} characters`);
  console.log(`📄 Notes saved to: ${filePath}`);
  console.log(
    `\n💡 You can now read your comprehensive notes on "${state.topic}"!`
  );
}
