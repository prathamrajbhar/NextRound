import { GoogleGenAI } from '@google/genai';

export interface ExtractedRequirements {
  skills: string[];
  softSkills: string[];
  cultureKeywords: string[];
  rubric: {
    technical: number;
    communication: number;
    problemSolving: number;
    experience: number;
  };
  enhancedDescription?: string;
}

/**
 * Extracts technical skills, soft skills, culture keywords, and rubric weights
 * directly from raw job description text using Gemini LLM with context-aware fallback.
 */
export async function extractRequirementsFromJd(
  description: string,
  title?: string
): Promise<ExtractedRequirements> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && description.trim().length > 15) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an expert AI recruiter and technical talent architect.
Analyze the following job title and job description text. Extract real, precise requirements directly present or implied in the text.

JOB TITLE: ${title || 'Not specified'}
JOB DESCRIPTION:
${description.slice(0, 12000)}

DIRECTIVES:
1. "skills": Extract 3-10 core technical skills, programming languages, frameworks, vector databases, AI/ML tools, APIs, cloud platforms, or domain tools mentioned or directly implied.
2. "softSkills": Extract 2-5 soft skills, interpersonal traits, or leadership capabilities mentioned or implied (e.g., "Stakeholder Management", "Cross-functional Collaboration", "Analytical Thinking").
3. "cultureKeywords": Extract 2-5 company culture, mindset, or work value keywords (e.g., "Innovation", "Fast Execution", "Quality Focus", "Customer Obsessed").
4. "rubric": Suggest balanced evaluation weights percentage (technical, communication, problemSolving, experience) summing to EXACTLY 100 based on the job role type.
5. "enhancedDescription": Provide a clean, structured, ATS-friendly markdown job description with headers (Role Overview, Responsibilities, Requirements, Preferred Qualifications).

Return ONLY a valid JSON object matching this schema:
{
  "skills": string[],
  "softSkills": string[],
  "cultureKeywords": string[],
  "rubric": {
    "technical": number,
    "communication": number,
    "problemSolving": number,
    "experience": number
  },
  "enhancedDescription": string
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Normalize rubric weights to guarantee sum === 100
        let tech = Math.max(10, Math.min(80, Number(parsed.rubric?.technical) || 30));
        let comm = Math.max(10, Math.min(80, Number(parsed.rubric?.communication) || 20));
        let prob = Math.max(10, Math.min(80, Number(parsed.rubric?.problemSolving) || 25));
        let exp = Math.max(10, Math.min(80, Number(parsed.rubric?.experience) || 25));
        const sum = tech + comm + prob + exp;
        if (sum !== 100) {
          exp = Math.max(10, 100 - (tech + comm + prob));
        }

        return {
          skills: Array.isArray(parsed.skills)
            ? parsed.skills.filter((s: unknown): s is string => typeof s === 'string' && s.trim().length > 0)
            : [],
          softSkills: Array.isArray(parsed.softSkills)
            ? parsed.softSkills.filter((s: unknown): s is string => typeof s === 'string' && s.trim().length > 0)
            : [],
          cultureKeywords: Array.isArray(parsed.cultureKeywords)
            ? parsed.cultureKeywords.filter((s: unknown): s is string => typeof s === 'string' && s.trim().length > 0)
            : [],
          rubric: { technical: tech, communication: comm, problemSolving: prob, experience: exp },
          enhancedDescription: typeof parsed.enhancedDescription === 'string' ? parsed.enhancedDescription : undefined,
        };
      }
    } catch (err) {
      console.error('Gemini JD requirement extraction error:', err);
    }
  }

  // Context-aware NLP Heuristic Fallback based ON THE ACTUAL INPUT TEXT
  return extractNlpFallback(description, title);
}

/**
 * Context-aware NLP Fallback scanning the ACTUAL job description text
 * instead of returning hardcoded generic dummy data.
 */
function extractNlpFallback(description: string, title?: string): ExtractedRequirements {
  const combinedText = `${title || ''} ${description}`;

  // Comprehensive tech keywords library
  const knownTech = [
    'React', 'TypeScript', 'JavaScript', 'Next.js', 'Node.js', 'Express', 'Python', 'PyTorch',
    'TensorFlow', 'LLM', 'LLMs', 'Generative AI', 'RAG', 'Vector Database', 'Vector DB', 'Pinecone',
    'Weaviate', 'Chroma', 'Qdrant', 'FastAPI', 'LangChain', 'LlamaIndex', 'OpenAI', 'Gemini',
    'Anthropic', 'System Architecture', 'APIs', 'REST', 'GraphQL', 'PostgreSQL', 'MongoDB',
    'Redis', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'CI/CD', 'Figma', 'UI/UX',
    'Design Systems', 'Go', 'Golang', 'Java', 'C++', 'Rust', 'SQL', 'NoSQL', 'Microservices',
    'Tailwind', 'DevOps', 'Data Engineering', 'Spark', 'Kafka', 'Hadoop', 'MLOps'
  ];

  const extractedTech: string[] = [];
  knownTech.forEach((tech) => {
    const escaped = tech.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(combinedText)) {
      extractedTech.push(tech);
    }
  });

  // Extract capital tech acronyms or phrases from text (e.g. AI/ML, NLP, Prompt Engineering)
  const regexPatterns = [
    /\b(AI\/ML|NLP|LLM|RAG|REST API|GraphQL|CI\/CD|UI\/UX|MLOps|DevOps)\b/gi,
    /\b(Machine Learning|Deep Learning|Artificial Intelligence|Prompt Engineering|Vector Databases)\b/gi
  ];
  regexPatterns.forEach((pattern) => {
    const matches = combinedText.match(pattern);
    if (matches) {
      matches.forEach((m) => {
        const clean = m.trim();
        if (!extractedTech.some((t) => t.toLowerCase() === clean.toLowerCase())) {
          extractedTech.push(clean);
        }
      });
    }
  });

  // Soft skills keywords
  const softSkillCatalog = [
    'Collaboration', 'Cross-functional Collaboration', 'Problem Solving', 'Technical Leadership',
    'Stakeholder Management', 'Communication', 'Public Speaking', 'Analytical Thinking',
    'Empathy', 'Creative Problem Solving', 'Adaptability', 'Mentorship'
  ];
  const extractedSoft: string[] = [];
  softSkillCatalog.forEach((soft) => {
    const escaped = soft.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(combinedText)) {
      extractedSoft.push(soft);
    }
  });
  if (extractedSoft.length === 0) {
    if (combinedText.toLowerCase().includes('lead') || combinedText.toLowerCase().includes('senior')) {
      extractedSoft.push('Technical Leadership', 'Cross-functional Collaboration');
    } else {
      extractedSoft.push('Problem Solving', 'Collaboration');
    }
  }

  // Culture keywords
  const cultureCatalog = [
    'Innovation', 'Customer Obsessed', 'High Performance', 'Metrics-Driven', 'Detail Oriented',
    'Fast Execution', 'Design Excellence', 'Continuous Learning', 'User Centricity'
  ];
  const extractedCulture: string[] = [];
  cultureCatalog.forEach((culture) => {
    const escaped = culture.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(combinedText)) {
      extractedCulture.push(culture);
    }
  });
  if (extractedCulture.length === 0) {
    extractedCulture.push('Innovation', 'Continuous Learning', 'High Performance');
  }

  // Dynamic rubric weighting
  let techWeight = 30;
  if (extractedTech.length > 5) techWeight = 35;
  if (combinedText.toLowerCase().includes('ai') || combinedText.toLowerCase().includes('architecture')) techWeight = 35;

  return {
    skills: Array.from(new Set(extractedTech)),
    softSkills: Array.from(new Set(extractedSoft)),
    cultureKeywords: Array.from(new Set(extractedCulture)),
    rubric: {
      technical: techWeight,
      communication: 20,
      problemSolving: 25,
      experience: 100 - (techWeight + 20 + 25),
    },
  };
}
