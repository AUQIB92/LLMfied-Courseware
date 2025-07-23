"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import ContentDisplay from "@/components/ContentDisplay";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Play,
  Trophy,
  Target,
  CheckCircle,
  FileText,
  Video,
  Globe,
  Wrench,
  GraduationCap,
  Lightbulb,
  BarChart3,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  Crown,
  Brain,
  Timer,
  RotateCcw,
  Star,
  Zap,
} from "lucide-react";
import ModuleContent from "./ModuleContent";
import AITutor from "./AITutor";
import QuizModal from "./QuizModal"; // Import the QuizModal component

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
};

// CSS for 3D flashcard animations
const flashcardStyles = `
  .flashcard-container {
    perspective: 1000px;
  }
  
  .flashcard {
    position: relative;
    width: 100%;
    height: 400px;
    transform-style: preserve-3d;
    transition: transform 0.6s ease-in-out;
    cursor: pointer;
  }
  
  .flashcard.flipped {
    transform: rotateY(180deg);
  }
  
  .flashcard-side {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    overflow: hidden;
  }
  
  .flashcard-front {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  
  .flashcard-back {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
    transform: rotateY(180deg);
  }
  
  .flashcard-content {
    text-align: center;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
  }
  
  .flashcard-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.8;
    margin-bottom: 0.5rem;
    flex-shrink: 0;
  }
  
  .flashcard-text {
    font-size: 1rem;
    font-weight: 500;
    line-height: 1.4;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 0.5rem 0;
  }
  
  /* Formula-specific styling for math equations */
  .flashcard-question .katex-display,
  .flashcard-answer .katex-display {
    margin: 0.5rem 0 !important;
    font-size: 1rem !important;
    background: rgba(255, 255, 255, 0.1) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    padding: 0.5rem !important;
    border-radius: 8px !important;
  }
  
  .flashcard-question .katex,
  .flashcard-answer .katex {
    font-size: 0.9rem !important;
    color: white !important;
    background: rgba(255, 255, 255, 0.1) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-radius: 6px !important;
    padding: 0.3rem 0.5rem !important;
    margin: 0.3rem auto !important;
    display: inline-block !important;
    max-width: 100% !important;
  }
  
  /* Scale down very large equations */
  .flashcard-text .katex-display {
    transform: scale(0.85);
    transform-origin: center center;
  }
  
  .flashcard-text .katex {
    transform: scale(0.9);
    transform-origin: center center;
  }
  
  /* Ensure text wraps properly in flashcards */
  .flashcard-text p {
    margin: 0.25rem 0;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  
  /* Formula flashcard specific adjustments */
  .formula-flashcard .flashcard-text {
    font-size: 0.95rem;
    line-height: 1.3;
  }
  
  .concept-flashcard .flashcard-text {
    font-size: 1rem;
    line-height: 1.4;
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.textContent = flashcardStyles;
  document.head.appendChild(styleElement);
}

export default function ExamGeniusCourseViewer({ course, onBack, onProgress }) {
  const { getAuthHeaders } = useAuth();
  const [viewerCourse, setViewerCourse] = useState(course);
  const [currentModule, setCurrentModule] = useState(0);
  const [currentSubsection, setCurrentSubsection] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [completedModules, setCompletedModules] = useState(new Set());
  const [completedSubsections, setCompletedSubsections] = useState(new Set());
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedQuizDifficulty, setSelectedQuizDifficulty] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [quizResults, setQuizResults] = useState({});
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [sidebarManuallyToggled, setSidebarManuallyToggled] = useState(false);
  const [loadingDetailedContent, setLoadingDetailedContent] = useState(false);
  const [currentPageTabs, setCurrentPageTabs] = useState({});
  const [selectedResourceCategory, setSelectedResourceCategory] =
    useState("articles"); // Default to articles
  const [activeContentTab, setActiveContentTab] = useState("content");
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [activeFlashcardIndex, setActiveFlashcardIndex] = useState(0);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [currentFlashcardSet, setCurrentFlashcardSet] = useState([]);
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState(false);
  const [studiedCards, setStudiedCards] = useState(new Set());

  const resourceCategories = {
    books: { icon: BookOpen, label: "Books" },
    courses: { icon: GraduationCap, label: "Courses" },
    articles: { icon: FileText, label: "Articles" },
    videos: { icon: Video, label: "Videos" },
    tools: { icon: Wrench, label: "Tools" },
    websites: { icon: Globe, label: "Websites" },
    exercises: { icon: Target, label: "Exercises" },
  };

  const categoryStyles = {
    books: { text: "text-blue-600", bg: "bg-blue-100", ring: "ring-blue-500" },
    courses: {
      text: "text-green-600",
      bg: "bg-green-100",
      ring: "ring-green-500",
    },
    articles: {
      text: "text-purple-600",
      bg: "bg-purple-100",
      ring: "ring-purple-500",
    },
    videos: { text: "text-red-600", bg: "bg-red-100", ring: "ring-red-500" },
    tools: {
      text: "text-orange-600",
      bg: "bg-orange-100",
      ring: "ring-orange-500",
    },
    websites: {
      text: "text-cyan-600",
      bg: "bg-cyan-100",
      ring: "ring-cyan-500",
    },
    exercises: {
      text: "text-pink-600",
      bg: "bg-pink-100",
      ring: "ring-pink-500",
    },
  };

  const modules = viewerCourse.modules || [];
  const currentModuleData = modules[currentModule];
  const subsections = currentModuleData?.detailedSubsections || [];
  const currentSubsectionData = subsections?.[currentSubsection];

  useEffect(() => {
    const savedProgress = localStorage.getItem(
      `exam-progress-${viewerCourse._id}`
    );
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      setCompletedModules(new Set(progress.completedModules || []));
      setCompletedSubsections(new Set(progress.completedSubsections || []));
    }
  }, [viewerCourse._id]);

  useEffect(() => {
    if (viewerCourse.isExamGenius) {
      console.log(
        "🔄 ExamGenius course detected, fetching detailed content for module:",
        currentModule
      );
      fetchDetailedContent(currentModule);
    }
  }, [currentModule, viewerCourse.isExamGenius]);

  // Also trigger parsing when the course data changes
  useEffect(() => {
    console.log("📋 Course data updated:", {
      courseId: viewerCourse._id,
      isExamGenius: viewerCourse.isExamGenius,
      modulesCount: viewerCourse.modules?.length || 0,
      currentModule,
      currentModuleData: currentModuleData
        ? {
            title: currentModuleData.title,
            hasEnhancedMarkdown: !!currentModuleData.enhancedMarkdown,
            hasContent: !!currentModuleData.content,
            hasDetailedSubsections:
              !!currentModuleData.detailedSubsections?.length,
            detailedSubsectionsInfo: currentModuleData.detailedSubsections?.map(
              (sub) => ({
                title: sub.title,
                hasGeneratedMarkdown: !!sub.generatedMarkdown,
                hasPages: !!sub.pages?.length,
                hasSummary: !!sub.summary,
              })
            ),
          }
        : null,
    });

    // Check if we have subsections that need processing
    if (currentModuleData?.detailedSubsections?.length > 0) {
      const needsProcessing = currentModuleData.detailedSubsections.some(
        (sub) =>
          // If subsection has generatedMarkdown but no proper pages/summary structure
          sub.generatedMarkdown &&
          (!sub.pages || sub.pages.length === 0 || !sub.summary)
      );

      if (needsProcessing) {
        console.log(
          "🔧 Found subsections with generatedMarkdown that need processing..."
        );

        const processedSubsections = currentModuleData.detailedSubsections.map(
          (subsection) => {
            if (
              subsection.generatedMarkdown &&
              (!subsection.pages || subsection.pages.length === 0)
            ) {
              console.log(
                `📝 Processing generatedMarkdown for: ${subsection.title}`
              );

              // Parse the subsection data (JSON or markdown) into the expected structure
              const parsed = parseSubsectionData(
                subsection.pages ? subsection : subsection.generatedMarkdown,
                subsection.title
              );

              return {
                ...subsection,
                ...parsed, // This adds summary, keyPoints, pages, etc.
                difficulty: parsed.difficulty || "intermediate",
                estimatedTime: parsed.estimatedTime || "15-20 minutes",
              };
            }
            return subsection;
          }
        );

        console.log("✅ Processed subsections, updating course data...");
        setViewerCourse((prevCourse) => {
          const newModules = [...prevCourse.modules];
          newModules[currentModule] = {
            ...newModules[currentModule],
            detailedSubsections: processedSubsections,
          };
          return { ...prevCourse, modules: newModules };
        });
      }
    }

    // Original enhanced markdown parsing (keep as fallback)
    if (
      currentModuleData?.enhancedMarkdown &&
      (!currentModuleData.detailedSubsections ||
        currentModuleData.detailedSubsections.length === 0)
    ) {
      console.log(
        "🔧 Found enhancedMarkdown without parsed subsections, parsing now..."
      );
      const parsedSubsections = parseMarkdownToSubsections(
        currentModuleData.enhancedMarkdown
      );

      if (parsedSubsections.length > 0) {
        console.log(
          "✅ Successfully parsed subsections, updating course data..."
        );
        setViewerCourse((prevCourse) => {
          const newModules = [...prevCourse.modules];
          newModules[currentModule] = {
            ...newModules[currentModule],
            detailedSubsections: parsedSubsections,
          };
          return { ...prevCourse, modules: newModules };
        });
      } else {
        console.log("❌ Failed to parse any subsections from markdown");
      }
    }
  }, [viewerCourse, currentModule, currentModuleData]);

  const fetchDetailedContent = async (moduleIndex) => {
    const module = viewerCourse.modules[moduleIndex];
    if (!module) {
      console.log("No module found at index:", moduleIndex);
      return;
    }

    // Check if module already has detailed content
    if (module.detailedSubsections && module.detailedSubsections.length > 0) {
      console.log(
        "Module already has detailed content:",
        module.detailedSubsections.length,
        "subsections"
      );
      return;
    }

    // Check if module has enhancedMarkdown content that needs to be parsed
    if (
      module.enhancedMarkdown &&
      typeof module.enhancedMarkdown === "string"
    ) {
      console.log("Module has enhancedMarkdown content, parsing...");
      // Parse the markdown content into detailed subsections
      const parsedSubsections = parseMarkdownToSubsections(
        module.enhancedMarkdown
      );
      if (parsedSubsections.length > 0) {
        setViewerCourse((prevCourse) => {
          const newModules = [...prevCourse.modules];
          newModules[moduleIndex] = {
            ...newModules[moduleIndex],
            detailedSubsections: parsedSubsections,
          };
          return { ...prevCourse, modules: newModules };
        });
        return;
      }
    }

    try {
      setLoadingDetailedContent(true);
      console.log(`🔄 Fetching detailed content for module ${moduleIndex}...`);

      const response = await fetch(
        `/api/courses/${viewerCourse._id}/detailed-content?moduleIndex=${moduleIndex}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Received detailed content:", data);

        // Handle both structured JSON content and legacy format
        if (data.content && typeof data.content === "object") {
          console.log("🔧 Processing JSON structured content from API");

          // Update module with structured JSON content
          setViewerCourse((prevCourse) => {
            const newModules = [...prevCourse.modules];
            newModules[moduleIndex] = {
              ...newModules[moduleIndex],
              content: data.content, // Store the full JSON structure
              summary: data.content.summary || newModules[moduleIndex].summary,
              objectives:
                data.content.objectives || newModules[moduleIndex].objectives,
              examples:
                data.content.examples || newModules[moduleIndex].examples,
              resources:
                data.content.resources || newModules[moduleIndex].resources,
              detailedSubsections:
                data.content.detailedSubsections ||
                newModules[moduleIndex].detailedSubsections,
            };
            return { ...prevCourse, modules: newModules };
          });
          console.log(
            `✅ Updated module ${moduleIndex} with JSON structured content`
          );
        } else if (
          data.detailedSubsections &&
          data.detailedSubsections.length > 0
        ) {
          // Legacy format with detailedSubsections array
          setViewerCourse((prevCourse) => {
            const newModules = [...prevCourse.modules];
            newModules[moduleIndex] = {
              ...newModules[moduleIndex],
              detailedSubsections: data.detailedSubsections,
            };
            return { ...prevCourse, modules: newModules };
          });
          console.log(
            `✅ Updated module ${moduleIndex} with ${data.detailedSubsections.length} subsections`
          );
        } else if (
          data.markdownContent &&
          typeof data.markdownContent === "string"
        ) {
          console.log("🔧 Processing markdown content from API");

          // Handle markdown content response
          setViewerCourse((prevCourse) => {
            const newModules = [...prevCourse.modules];
            newModules[moduleIndex] = {
              ...newModules[moduleIndex],
              enhancedMarkdown: data.markdownContent,
              content: data.markdownContent,
            };
            return { ...prevCourse, modules: newModules };
          });
          console.log(`✅ Updated module ${moduleIndex} with markdown content`);
        } else {
          console.log("⚠️ No recognized content format in response");
          toast.error(
            `No compatible content available for module ${moduleIndex + 1}`
          );
        }
      } else {
        const errorText = await response.text();
        console.error(
          "❌ Failed to fetch detailed content:",
          response.status,
          errorText
        );
        toast.error(`Failed to load content for module ${moduleIndex + 1}`);
      }
    } catch (error) {
      console.error("❌ Error fetching detailed content:", error);
      toast.error(`An error occurred while loading content.`);
    } finally {
      setLoadingDetailedContent(false);
    }
  };

  // Function to parse markdown content into subsections
  const parseMarkdownToSubsections = (markdownContent) => {
    if (!markdownContent || typeof markdownContent !== "string") {
      return [];
    }

    console.log(
      "🔍 Parsing markdown content:",
      markdownContent.substring(0, 200) + "..."
    );

    const subsections = [];

    // Split by #### headings (subsections) - updated to handle the actual format
    const sections = markdownContent.split(/(?=####\s+[^#])/);

    console.log("📊 Found sections:", sections.length);

    sections.forEach((section, index) => {
      if (!section.trim()) return;

      const lines = section.trim().split("\n");
      const titleMatch = lines[0].match(/^####\s+(.+)$/);

      if (titleMatch) {
        const title = titleMatch[1].trim();
        const content = lines.slice(1).join("\n").trim();

        console.log(`📝 Processing subsection ${index + 1}: "${title}"`);
        console.log(`📄 Content length: ${content.length} characters`);

        // Split content by paragraphs for better page structure
        const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim());

        // Create meaningful pages from content
        let pages = [];

        if (paragraphs.length === 0) {
          // If no paragraphs, create a single page with the raw content
          pages = [
            {
              pageTitle: title,
              content: content || "Content will be available soon.",
              keyTakeaway: "Review the key concepts covered in this section.",
            },
          ];
        } else if (paragraphs.length === 1) {
          // Single paragraph, make it one page
          pages = [
            {
              pageTitle: title,
              content: paragraphs[0],
              keyTakeaway:
                "This completes the key concepts for this subsection.",
            },
          ];
        } else {
          // Multiple paragraphs, split into logical pages
          const maxParagraphsPerPage = 2;
          for (let i = 0; i < paragraphs.length; i += maxParagraphsPerPage) {
            const pageParagraphs = paragraphs.slice(
              i,
              i + maxParagraphsPerPage
            );
            const pageNumber = Math.floor(i / maxParagraphsPerPage) + 1;
            const totalPages = Math.ceil(
              paragraphs.length / maxParagraphsPerPage
            );

            pages.push({
              pageTitle:
                totalPages > 1 ? `${title} - Part ${pageNumber}` : title,
              content: pageParagraphs.join("\n\n"),
              keyTakeaway:
                i + maxParagraphsPerPage >= paragraphs.length
                  ? "This completes the key concepts for this subsection."
                  : `Continue to Part ${pageNumber + 1} for more details.`,
            });
          }
        }

        subsections.push({
          title,
          summary:
            content.length > 300 ? content.substring(0, 300) + "..." : content,
          pages,
          estimatedTime: Math.max(5, Math.ceil(content.length / 250) * 3), // More realistic time estimate
          difficulty: "medium",
          keyPoints: extractKeyPoints(content), // Extract key points from content
        });

        console.log(
          `✅ Created subsection "${title}" with ${pages.length} page(s)`
        );
      } else {
        console.log(`⚠️ Skipping section ${index + 1}: No #### header found`);
        console.log(`First line: "${lines[0]}"`);
      }
    });

    console.log(`🎯 Total subsections created: ${subsections.length}`);
    return subsections;
  };

  // Helper function to extract key points from content
  const extractKeyPoints = (content) => {
    if (!content) return [];

    // Look for bullet points, numbered lists, or key terms
    const lines = content.split("\n");
    const keyPoints = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      // Match bullet points, numbered lists, or lines with "key", "important", etc.
      if (
        trimmed.match(/^[•\-\*]\s+/) ||
        trimmed.match(/^\d+\.\s+/) ||
        trimmed.toLowerCase().includes("key") ||
        trimmed.toLowerCase().includes("important")
      ) {
        keyPoints.push(trimmed.replace(/^[•\-\*\d\.]\s*/, ""));
      }
    });

    // If no structured points found, create some from the first few sentences
    if (keyPoints.length === 0) {
      const sentences = content
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 20);
      return sentences.slice(0, 3).map((s) => s.trim());
    }

    return keyPoints.slice(0, 5); // Limit to 5 key points
  };

  // Updated function to handle subsection data from new JSON format or legacy content
  const parseSubsectionData = (subsectionData, title) => {
    // Handle new enhanced JSON structure with conceptGroups (from generateCompetitiveExamSubsectionDetails)
    if (
      subsectionData &&
      typeof subsectionData === "object" &&
      subsectionData.conceptGroups
    ) {
      console.log(`🧠 Processing enhanced JSON subsection data for "${title}"`);

      return {
        type: "conceptGroups",
        data: subsectionData,
        summary: subsectionData.summary || `Learn about ${title}`,
        keyPoints: subsectionData.conceptBullets || [
          `Master the fundamentals of ${title}`,
          `Apply problem-solving techniques`,
          `Understand practical applications`,
        ],
        practicalExample:
          subsectionData.practicalUseCase || `Practical example for ${title}`,
        commonPitfalls: subsectionData.conceptGroups?.flatMap(
          (g) => g.misconceptions || []
        ) || [`Common issues with ${title}`],
        refresherBoost: {
          conceptBullets: subsectionData.conceptBullets || [
            `🔥 Key concept for ${title}`,
          ],
          flashCards: subsectionData.flashCards || [
            {
              question: `What is ${title}?`,
              answer: `${title} is an important concept for exam preparation.`,
            },
          ],
        },
        difficulty: subsectionData.difficulty || "Intermediate",
        estimatedTime: subsectionData.estimatedTime || "15-20 minutes",
      };
    }

    // Handle legacy JSON structure with pages
    if (
      subsectionData &&
      typeof subsectionData === "object" &&
      subsectionData.pages
    ) {
      console.log(`🔧 Processing legacy JSON subsection data for "${title}"`);

      return {
        type: "pages",
        data: subsectionData,
        summary: subsectionData.summary || `Learn about ${title}`,
        keyPoints: subsectionData.keyPoints || [
          `Master the fundamentals of ${title}`,
          `Apply practical problem-solving techniques`,
          `Understand real-world applications`,
        ],
        pages: subsectionData.pages.map((page, index) => ({
          id: `page-${index + 1}`,
          pageNumber: page.pageNumber || index + 1,
          title: page.pageTitle || page.title || `Page ${index + 1}`,
          content: page.content || "",
          keyTakeaway:
            page.keyTakeaway || `Key learning from page ${index + 1}`,
        })),
        practicalExample:
          subsectionData.practicalExample || `Practical example for ${title}`,
        commonPitfalls: subsectionData.commonPitfalls || [
          `Common issues with ${title}`,
        ],
        refresherBoost: subsectionData.refresherBoost || {
          conceptBullets: [`🔥 Key concept for ${title}`],
          flashCards: [
            {
              question: `What is ${title}?`,
              answer: `${title} is an important concept for exam preparation.`,
            },
          ],
        },
      };
    }

    // Handle legacy markdown format
    const generatedMarkdown =
      typeof subsectionData === "string"
        ? subsectionData
        : subsectionData?.generatedMarkdown;

    if (!generatedMarkdown || typeof generatedMarkdown !== "string") {
      return {
        type: "fallback",
        summary: `Learn about ${title}`,
        keyPoints: [
          `Master the fundamentals of ${title}`,
          `Apply practical problem-solving techniques`,
          `Understand real-world applications`,
        ],
        pages: [
          {
            id: "page-1",
            pageNumber: 1,
            title: "Overview",
            content: `Content for ${title} will be generated.`,
            keyTakeaway: `Understanding ${title} concepts`,
          },
        ],
        practicalExample: `Practical example for ${title}`,
        commonPitfalls: [`Common issues with ${title}`],
      };
    }

    console.log(
      `🔍 Parsing generatedMarkdown for "${title}":`,
      generatedMarkdown.substring(0, 200) + "..."
    );

    // Process legacy markdown content
    const processedMarkdown = generatedMarkdown;

    // Extract summary
    const summaryMatch = processedMarkdown.match(
      /\*\*Summary:\*\*\s*\n([^*]+?)(?=\*\*|$)/s
    );
    const summary = summaryMatch
      ? summaryMatch[1].trim()
      : `Learn about ${title}`;

    // Extract key learning points
    const keyPointsMatch = processedMarkdown.match(
      /\*\*Key Learning Points:\*\*\s*\n((?:\s*[-•]\s*.+\n?)+)/
    );
    const keyPoints = keyPointsMatch
      ? keyPointsMatch[1]
          .split("\n")
          .filter((line) => line.trim().match(/^[-•]\s+/))
          .map((line) => line.trim().replace(/^[-•]\s+/, ""))
          .filter((point) => point.length > 0)
      : [
          `Master the fundamentals of ${title}`,
          `Apply practical problem-solving techniques`,
          `Understand real-world applications`,
        ];

    // Split content into logical pages
    const pages = [];
    const sections = processedMarkdown.split(/(?=####\s+[^#])/);

    let pageNumber = 1;
    sections.forEach((section) => {
      const sectionMatch = section.match(/####\s+(.+?)\n([\s\S]*)/);
      if (sectionMatch) {
        const pageTitle = sectionMatch[1].trim();
        let content = sectionMatch[2].trim();

        // Extract key takeaway if present
        const takeawayMatch = content.match(
          /\*\*Key Takeaway:\*\*\s*([^*]+?)(?=\*\*|$)/s
        );
        const keyTakeaway = takeawayMatch
          ? takeawayMatch[1].trim()
          : `This section completes your understanding of ${pageTitle.toLowerCase()}.`;

        pages.push({
          pageNumber: pageNumber++,
          pageTitle,
          content: content.replace(/\*\*Key Takeaway:\*\*.*$/s, "").trim(),
          keyTakeaway,
        });
      }
    });

    // If no #### sections found, create pages from the main content
    if (pages.length === 0) {
      const mainContent = processedMarkdown
        .replace(/^###.*?\n/, "") // Remove main title
        .replace(/\*\*Summary:\*\*.*?\n.*?\n/, "") // Remove summary section
        .replace(/\*\*Key Learning Points:\*\*.*?\n((?:\s*[-•]\s*.+\n?)+)/, "") // Remove key points
        .trim();

      if (mainContent) {
        // Split by major sections or just create one big page
        const paragraphs = mainContent.split(/\n\s*\n/).filter((p) => p.trim());

        if (paragraphs.length <= 3) {
          // Single page
          pages.push({
            pageNumber: 1,
            pageTitle: title,
            content: mainContent,
            keyTakeaway: `This completes your study of ${title}.`,
          });
        } else {
          // Multiple pages
          const chunkSize = Math.ceil(paragraphs.length / 3);
          for (let i = 0; i < paragraphs.length; i += chunkSize) {
            const chunk = paragraphs.slice(i, i + chunkSize).join("\n\n");
            const pageNum = Math.floor(i / chunkSize) + 1;
            const totalPages = Math.ceil(paragraphs.length / chunkSize);

            pages.push({
              pageNumber: pageNum,
              pageTitle: totalPages > 1 ? `${title} - Part ${pageNum}` : title,
              content: chunk,
              keyTakeaway:
                pageNum === totalPages
                  ? `This completes your study of ${title}.`
                  : `Continue to Part ${pageNum + 1} for more details.`,
            });
          }
        }
      }
    }

    // Ensure we have at least one page
    if (pages.length === 0) {
      pages.push({
        pageNumber: 1,
        pageTitle: title,
        content: summary || `Content for ${title} will be available soon.`,
        keyTakeaway: `Review the key concepts covered in ${title}.`,
      });
    }

    const result = {
      summary,
      keyPoints,
      pages,
      difficulty: "intermediate",
      estimatedTime: `${Math.max(
        5,
        Math.ceil(processedMarkdown.length / 300) * 3
      )}-${Math.max(
        10,
        Math.ceil(processedMarkdown.length / 250) * 4
      )} minutes`,
    };

    console.log(
      `✅ Parsed "${title}": ${pages.length} pages, ${keyPoints.length} key points`
    );
    return result;
  };

  const saveProgress = () => {
    const progress = {
      completedModules: Array.from(completedModules),
      completedSubsections: Array.from(completedSubsections),
      currentModule,
      currentSubsection,
      currentPage,
      lastAccessed: new Date().toISOString(),
    };
    localStorage.setItem(
      `exam-progress-${viewerCourse._id}`,
      JSON.stringify(progress)
    );
    onProgress?.(progress);
  };

  const handleQuizStart = (difficulty, subsectionData, subsectionIndex) => {
    if (!subsectionData) {
      toast.error("No subsection data available");
      return;
    }

    console.log(`🎯 Starting ${difficulty} quiz for: ${subsectionData.title}`);

    // Look for existing quiz in the current module's subsectionQuizzes
    const quizKey = `${subsectionIndex}_${difficulty.toLowerCase()}`;
    const existingQuiz = currentModuleData?.subsectionQuizzes?.[quizKey];

    console.log("🔍 Quiz lookup:", {
      quizKey,
      availableQuizzes: Object.keys(currentModuleData?.subsectionQuizzes || {}),
      hasQuiz: !!existingQuiz,
      currentModule: currentModule,
      subsectionIndex,
      difficulty,
    });

    if (!existingQuiz) {
      toast.error(
        `No ${difficulty.toLowerCase()} quiz available for this subsection. Please ask your educator to generate quizzes.`
      );
      return;
    }

    // Validate quiz structure
    if (!existingQuiz.questions || existingQuiz.questions.length === 0) {
      toast.error("Quiz has no questions available");
      return;
    }

    // Set up the quiz with the existing data
    setQuizData({
      questions: existingQuiz.questions,
      subsectionTitle: existingQuiz.subsectionTitle || subsectionData.title,
      difficulty: difficulty.toLowerCase(),
      totalQuestions:
        existingQuiz.totalQuestions || existingQuiz.questions.length,
      createdAt: existingQuiz.createdAt || new Date().toISOString(),
    });

    setSelectedQuizDifficulty(difficulty);
    setShowQuiz(true);

    toast.success(`${difficulty} quiz loaded successfully!`);
  };

  const handleQuizCompletion = (results) => {
    const quizKey = `${currentModule}-${currentSubsection}-${selectedQuizDifficulty}`;
    setQuizResults((prev) => ({ ...prev, [quizKey]: results }));

    if (results.score >= 60) {
      const subsectionKey = `${currentModule}-${currentSubsection}`;
      setCompletedSubsections((prev) => new Set([...prev, subsectionKey]));
    }

    setShowQuiz(false);
    setQuizData(null);
    saveProgress();
    toast.success(`Quiz completed! Score: ${results.score}%`);
  };

  const markModuleComplete = () => {
    setCompletedModules((prev) => new Set([...prev, currentModule]));
    saveProgress();
    toast.success("Module marked as complete!");
  };

  const getOverallProgress = () => {
    const totalModules = modules.length;
    const completedCount = completedModules.size;
    return totalModules > 0
      ? Math.round((completedCount / totalModules) * 100)
      : 0;
  };

  const getModuleProgress = (moduleIndex) => {
    const module = modules[moduleIndex];
    const subsections = module?.detailedSubsections || [];
    const completedSubsectionCount = subsections.filter((_, subIndex) =>
      completedSubsections.has(`${moduleIndex}-${subIndex}`)
    ).length;
    return subsections.length > 0
      ? Math.round((completedSubsectionCount / subsections.length) * 100)
      : 0;
  };

  const getQuizResultsForSubsection = (moduleIndex, subsectionIndex) => {
    const results = {};
    ["Easy", "Medium", "Hard"].forEach((difficulty) => {
      const key = `${moduleIndex}-${subsectionIndex}-${difficulty}`;
      if (quizResults[key]) {
        results[difficulty] = quizResults[key];
      }
    });
    return results;
  };

  // Helper function to check if a quiz exists for a given subsection and difficulty
  const hasQuizForSubsection = (moduleIndex, subsectionIndex, difficulty) => {
    const module = modules[moduleIndex];
    const quizKey = `${subsectionIndex}_${difficulty.toLowerCase()}`;
    return !!module?.subsectionQuizzes?.[quizKey];
  };

  // Helper function to get quiz data for a subsection
  const getQuizForSubsection = (moduleIndex, subsectionIndex, difficulty) => {
    const module = modules[moduleIndex];
    const quizKey = `${subsectionIndex}_${difficulty.toLowerCase()}`;
    return module?.subsectionQuizzes?.[quizKey] || null;
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) newSet.delete(section);
      else newSet.add(section);
      return newSet;
    });
  };

  const ResourceCard = ({ resource, type }) => {
    const getIcon = () => {
      const iconMap = {
        books: <BookOpen className="h-6 w-6 text-white" />,
        courses: <Video className="h-6 w-6 text-white" />,
        videos: <Play className="h-6 w-6 text-white" />,
        articles: <FileText className="h-6 w-6 text-white" />,
        tools: <Wrench className="h-6 w-6 text-white" />,
        websites: <Globe className="h-6 w-6 text-white" />,
        exercises: <Target className="h-6 w-6 text-white" />,
      };
      return iconMap[type] || <ExternalLink className="h-6 w-6 text-white" />;
    };

    const getGradientAndColors = () => {
      const designMap = {
        books: {
          gradient: "from-blue-500/10 via-indigo-500/10 to-purple-500/10",
          border: "border-blue-200/50",
          iconBg: "from-blue-500 to-indigo-600",
          titleColor: "text-blue-700",
          accent: "blue",
        },
        courses: {
          gradient: "from-purple-500/10 via-pink-500/10 to-rose-500/10",
          border: "border-purple-200/50",
          iconBg: "from-purple-500 to-pink-600",
          titleColor: "text-purple-700",
          accent: "purple",
        },
        videos: {
          gradient: "from-red-500/10 via-orange-500/10 to-yellow-500/10",
          border: "border-red-200/50",
          iconBg: "from-red-500 to-orange-600",
          titleColor: "text-red-700",
          accent: "red",
        },
        articles: {
          gradient: "from-green-500/10 via-emerald-500/10 to-teal-500/10",
          border: "border-green-200/50",
          iconBg: "from-green-500 to-emerald-600",
          titleColor: "text-green-700",
          accent: "green",
        },
        tools: {
          gradient: "from-orange-500/10 via-amber-500/10 to-yellow-500/10",
          border: "border-orange-200/50",
          iconBg: "from-orange-500 to-amber-600",
          titleColor: "text-orange-700",
          accent: "orange",
        },
        websites: {
          gradient: "from-indigo-500/10 via-blue-500/10 to-cyan-500/10",
          border: "border-indigo-200/50",
          iconBg: "from-indigo-500 to-blue-600",
          titleColor: "text-indigo-700",
          accent: "indigo",
        },
        exercises: {
          gradient: "from-pink-500/10 via-rose-500/10 to-red-500/10",
          border: "border-pink-200/50",
          iconBg: "from-pink-500 to-rose-600",
          titleColor: "text-pink-700",
          accent: "pink",
        },
      };
      return designMap[type] || designMap.articles;
    };
    const design = getGradientAndColors();
    const isInstructorChoice = resource.isInstructorChoice;

    return (
      <motion.div
        variants={cardVariants}
        whileHover="hover"
        className="group h-full"
      >
        <Card
          className={`h-full bg-gradient-to-br ${design.gradient} backdrop-blur-sm border ${design.border} transition-all duration-300 hover:shadow-xl hover:scale-[1.02] overflow-hidden relative`}
        >
          {isInstructorChoice && (
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          )}
          <CardHeader className="pb-4 relative z-10">
            <div className="flex items-start gap-4">
              <motion.div
                className={`p-3 rounded-2xl bg-gradient-to-br ${design.iconBg} shadow-lg group-hover:shadow-xl transition-all duration-300`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {getIcon()}
              </motion.div>
              <div className="flex-1 min-w-0">
                <CardTitle
                  className={`${
                    design.titleColor
                  } group-hover:${design.titleColor.replace(
                    "700",
                    "800"
                  )} transition-colors duration-300 text-lg font-bold leading-tight mb-2`}
                >
                  {resource.title || resource.name}
                </CardTitle>
                {resource.creator && (
                  <p className="text-slate-600 text-sm font-medium">
                    by {resource.creator}
                  </p>
                )}
                {resource.isAIGenerated ? (
                  <motion.div
                    className="mt-2"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 shadow-md">
                      <Sparkles className="h-3 w-3 mr-1" /> AI Curated
                    </Badge>
                  </motion.div>
                ) : (
                  isInstructorChoice && (
                    <motion.div
                      className="mt-2"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                    >
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 shadow-md">
                        <Crown className="h-3 w-3 mr-1" /> Instructor's Choice
                      </Badge>
                    </motion.div>
                  )
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-4 relative z-10">
            {resource.description && (
              <div className="p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-white/40 group-hover:bg-white/80 transition-all duration-300">
                <div className="text-slate-700 text-sm leading-relaxed line-clamp-3">
                  <ContentDisplay
                    content={resource.description}
                    renderingMode="math-optimized"
                    className="resource-description"
                  />
                </div>
              </div>
            )}
            <div className="space-y-3">
              {resource.difficulty && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600">
                    Difficulty:
                  </span>
                  <Badge
                    className={`font-semibold ${
                      resource.difficulty === "Beginner"
                        ? "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-300"
                        : resource.difficulty === "Intermediate"
                        ? "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-300"
                        : "bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-red-300"
                    }`}
                  >
                    {resource.difficulty}
                  </Badge>
                </div>
              )}
              {resource.url && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="pt-2"
                >
                  <Button
                    className={`w-full bg-gradient-to-r ${design.iconBg} hover:from-${design.accent}-600 hover:to-${design.accent}-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group/button`}
                    asChild
                  >
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4 group-hover/button:scale-110 transition-transform duration-300" />
                      <span className="font-semibold">Explore Resource</span>
                    </a>
                  </Button>
                </motion.div>
              )}
            </div>
          </CardContent>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          {resource.isAIGenerated && (
            <div className="absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          )}
          {isInstructorChoice && (
            <div className="absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-r from-amber-400/20 to-orange-400/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          )}
        </Card>
      </motion.div>
    );
  };

  const getCurrentPageTab = (moduleIndex, subsectionIndex) => {
    const key = `${moduleIndex}-${subsectionIndex}`;
    return currentPageTabs[key] || 0;
  };

  const setCurrentPageTab = (moduleIndex, subsectionIndex, tabIndex) => {
    const key = `${moduleIndex}-${subsectionIndex}`;
    setCurrentPageTabs((prev) => ({ ...prev, [key]: tabIndex }));
  };

  const toggleSidebar = () => {
    const newVisibility = !sidebarVisible;
    setSidebarVisible(newVisibility);
    setSidebarManuallyToggled(true);
    if (!newVisibility) {
      setTimeout(() => setSidebarManuallyToggled(false), 2000);
    }
  };

  const handleMouseEnter = () => {
    if (!sidebarManuallyToggled) setSidebarVisible(true);
  };

  const handleMouseLeave = () => {
    if (!sidebarManuallyToggled) setSidebarVisible(false);
  };

  const handleModuleSelect = (moduleIndex) => {
    setCurrentModule(moduleIndex);
    setCurrentSubsection(0);
    setCurrentPage(0);
  };

  // Flashcard functions
  const openFlashcards = (subsectionData) => {
    const hasConceptCards =
      subsectionData?.conceptFlashCards &&
      subsectionData.conceptFlashCards.length > 0;
    const hasFormulaCards =
      subsectionData?.formulaFlashCards &&
      subsectionData.formulaFlashCards.length > 0;

    if (hasConceptCards || hasFormulaCards) {
      // Combine both types with category labels
      const allCards = [];

      if (hasConceptCards) {
        subsectionData.conceptFlashCards.forEach((card) => {
          allCards.push({
            ...card,
            category: "concept",
            categoryLabel: "📚 Important Concept",
          });
        });
      }

      if (hasFormulaCards) {
        subsectionData.formulaFlashCards.forEach((card) => {
          allCards.push({
            ...card,
            category: "formula",
            categoryLabel: "🧮 Mathematical Formula",
          });
        });
      }

      setCurrentFlashcardSet(allCards);
      setActiveFlashcardIndex(0);
      setIsFlashcardFlipped(false);
      setStudiedCards(new Set()); // Reset studied cards when opening new set
      setShowFlashcards(true);
    } else {
      toast.error("No flashcards available for this section");
    }
  };

  const closeFlashcards = () => {
    setShowFlashcards(false);
    setCurrentFlashcardSet([]);
    setActiveFlashcardIndex(0);
    setIsFlashcardFlipped(false);
  };

  const nextFlashcard = () => {
    if (activeFlashcardIndex < currentFlashcardSet.length - 1) {
      setActiveFlashcardIndex(activeFlashcardIndex + 1);
      setIsFlashcardFlipped(false);
    }
  };

  const prevFlashcard = () => {
    if (activeFlashcardIndex > 0) {
      setActiveFlashcardIndex(activeFlashcardIndex - 1);
      setIsFlashcardFlipped(false);
    }
  };

  const flipFlashcard = () => {
    setIsFlashcardFlipped(!isFlashcardFlipped);
  };

  // Helper function to format curriculum content
  const formatCurriculumContent = (content) => {
    if (!content || typeof content !== "string") return content;

    console.log("🔍 RAW CONTENT:", content);
    console.log("🔍 CONTENT LENGTH:", content.length);
    console.log("🔍 HAS ###:", content.includes("###"));
    console.log("🔍 HAS ####:", content.includes("####"));

    // Check if this looks like curriculum structure content (concatenated headers)
    if (
      content.includes("###") ||
      content.includes("####") ||
      content.includes("##")
    ) {
      console.log("🔧 Processing curriculum structure for formatting");

      let formatted = content;

      // More aggressive formatting for concatenated content
      formatted = formatted
        // First, handle the most common case: text directly followed by headers
        .replace(/([a-zA-Z0-9])(#{2,4})(\s*\d)/g, "$1\n\n$2$3") // text###1.1 -> text\n\n###1.1
        .replace(/([a-zA-Z0-9])(#{2,4})(\s*[A-Z])/g, "$1\n\n$2$3") // textR### -> text\n\n###

        // Handle headers without proper spacing
        .replace(/###(?!\s)/g, "\n\n### ") // ###Something -> \n\n### Something
        .replace(/####(?!\s)/g, "\n\n#### ") // ####Something -> \n\n#### Something
        .replace(/##(?!#)(?!\s)/g, "\n\n## ") // ##Something -> \n\n## Something (not ###)

        // Handle words directly followed by headers
        .replace(/([a-zA-Z0-9])(\s*###)/g, "$1\n\n###") // word### -> word\n\n###
        .replace(/([a-zA-Z0-9])(\s*####)/g, "$1\n\n####") // word#### -> word\n\n####
        .replace(/([a-zA-Z0-9])(\s*##)(?!#)/g, "$1\n\n##") // word## -> word\n\n##

        // Clean up spacing
        .replace(/\n\n\n+/g, "\n\n") // Clean up multiple line breaks
        .replace(/\s+\n/g, "\n") // Remove trailing spaces
        .trim();

      console.log("🔧 FORMATTED CONTENT:", formatted);

      // If it starts with "Module X:" pattern, make it a proper header
      if (formatted.match(/^Module \d+:/)) {
        const lines = formatted.split("\n").filter((line) => line.trim());
        if (lines.length > 0) {
          const moduleTitle = lines[0];
          const restContent = lines.slice(1).join("\n");
          formatted = `# ${moduleTitle}\n\n${restContent}`;
        }
      }

      console.log("🎯 FINAL FORMATTED CONTENT:", formatted);
      return formatted;
    }

    console.log("⚪ No markdown headers detected, returning original content");
    return content;
  };

  if (showQuiz && quizData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold">
                      {selectedQuizDifficulty} Quiz
                    </CardTitle>
                    <p className="text-orange-100 mt-1">
                      {currentSubsectionData?.title} •{" "}
                      {currentModuleData?.title}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQuiz(false)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <QuizInterface
                  quizData={quizData}
                  onComplete={handleQuizCompletion}
                  difficulty={selectedQuizDifficulty}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // If showing flashcards, render the elegant flashcard interface
  if (showFlashcards && currentFlashcardSet.length > 0) {
    const currentCard = currentFlashcardSet[activeFlashcardIndex];

    // Transform our flashcard data to match the elegant design format
    const flashcardsArray = currentFlashcardSet.map((card, index) => ({
      id: index + 1,
      front: card.question,
      back: card.answer,
      category: card.category === "formula" ? "Formula" : "Concept",
      difficulty: "Medium", // Could be derived from subsection difficulty
      gradient:
        card.category === "formula"
          ? "from-blue-500 via-blue-600 to-indigo-700"
          : "from-purple-500 via-violet-600 to-indigo-700",
      accent: card.category === "formula" ? "blue" : "purple",
      categoryIcon: card.category === "formula" ? Zap : Brain,
    }));

    const card = flashcardsArray[activeFlashcardIndex];
    const CategoryIcon = card.categoryIcon;
    const difficultyConfig = {
      Easy: {
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        glow: "shadow-emerald-200/50",
        icon: "🟢",
      },
      Medium: {
        color: "bg-amber-50 text-amber-700 border-amber-200",
        glow: "shadow-amber-200/50",
        icon: "🟡",
      },
      Hard: {
        color: "bg-rose-50 text-rose-700 border-rose-200",
        glow: "shadow-rose-200/50",
        icon: "🔴",
      },
    };
    const difficultyStyle = difficultyConfig[card.difficulty];

    const nextCard = () => {
      setActiveFlashcardIndex(
        (prev) => (prev + 1) % currentFlashcardSet.length
      );
      setIsFlashcardFlipped(false);
    };

    const prevCard = () => {
      setActiveFlashcardIndex(
        (prev) =>
          (prev - 1 + currentFlashcardSet.length) % currentFlashcardSet.length
      );
      setIsFlashcardFlipped(false);
    };

    const flipCard = () => {
      setIsFlashcardFlipped(!isFlashcardFlipped);
      if (!isFlashcardFlipped) {
        setStudiedCards((prev) => new Set([...prev, card.id]));
      }
    };

    const progress = (studiedCards.size / currentFlashcardSet.length) * 100;

    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 z-50 p-6 flex items-center justify-center relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-emerald-400/10 to-cyan-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="w-full max-w-3xl space-y-8 relative z-10">
          {/* Elegant Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-white/20">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Study Flashcards
              </h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeFlashcards}
                className="text-slate-600 hover:bg-slate-100 rounded-full ml-2"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-slate-600 font-medium">
              Master your subjects with elegant learning
            </p>
          </div>

          {/* Refined Progress */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                <span className="text-slate-700 font-semibold">
                  Learning Progress
                </span>
              </div>
              <span className="text-slate-600 font-medium">
                {studiedCards.size} of {currentFlashcardSet.length} mastered
              </span>
            </div>
            <Progress value={progress} className="h-3 bg-slate-100" />
            <div className="mt-2 text-right">
              <span className="text-sm text-slate-500">
                {Math.round(progress)}% complete
              </span>
            </div>
          </div>

          {/* Premium Flashcard */}
          <div className="relative perspective-1000">
            <div
              className={`relative w-full h-96 cursor-pointer transition-all duration-700 transform-style-preserve-3d hover:scale-[1.02] ${
                isFlashcardFlipped ? "rotate-y-180" : ""
              }`}
              onClick={flipCard}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front of card - Enhanced */}
              <Card
                className={`absolute inset-0 w-full h-full backface-hidden shadow-2xl border-0 bg-gradient-to-br ${card.gradient} overflow-hidden group`}
              >
                <div className="absolute inset-0 bg-black/5"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

                <CardContent className="p-8 h-full flex flex-col justify-between relative z-10">
                  <div className="flex justify-between items-start">
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm font-medium px-3 py-1">
                      <CategoryIcon className="w-3 h-3 mr-2" />
                      {card.category}
                    </Badge>
                    <Badge
                      className={`${difficultyStyle.color} ${difficultyStyle.glow} shadow-lg backdrop-blur-sm font-medium px-3 py-1`}
                    >
                      <span className="mr-1">{difficultyStyle.icon}</span>
                      {card.difficulty}
                    </Badge>
                  </div>

                  <div className="text-center space-y-6">
                    <div className="relative">
                      <div className="text-8xl opacity-20 text-white font-light">
                        ?
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-white/10 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <div className="text-lg font-bold leading-tight text-white drop-shadow-sm px-4">
                      <ContentDisplay
                        content={card.front}
                        renderingMode="math-optimized"
                        className="text-white flashcard-question"
                        enableTelemetry={false}
                      />
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <p className="text-white/90 text-sm font-medium">
                        Tap to reveal answer
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Back of card - Enhanced */}
              <Card className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 shadow-2xl bg-white/95 backdrop-blur-sm border border-white/20 overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full -translate-y-20 translate-x-20 opacity-60"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-emerald-50 to-cyan-50 rounded-full translate-y-16 -translate-x-16 opacity-60"></div>

                <CardContent className="p-8 h-full flex flex-col justify-between relative z-10">
                  <div className="flex justify-between items-start">
                    <Badge
                      variant="outline"
                      className="border-slate-200 bg-white/80 backdrop-blur-sm font-medium px-3 py-1"
                    >
                      <CategoryIcon className="w-3 h-3 mr-2" />
                      {card.category}
                    </Badge>
                    <Badge
                      className={`${difficultyStyle.color} ${difficultyStyle.glow} shadow-lg backdrop-blur-sm font-medium px-3 py-1`}
                    >
                      <span className="mr-1">{difficultyStyle.icon}</span>
                      {card.difficulty}
                    </Badge>
                  </div>

                  <div className="text-center space-y-6">
                    <div className="relative">
                      <div className="text-6xl text-emerald-500 drop-shadow-sm">
                        ✓
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full opacity-30"></div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="w-12 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent mx-auto"></div>
                      <div className="text-base text-slate-800 leading-relaxed font-medium px-4">
                        <ContentDisplay
                          content={card.back}
                          renderingMode="math-optimized"
                          className="text-slate-800 flashcard-answer"
                          enableTelemetry={false}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-200">
                      <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                      <p className="text-slate-600 text-sm font-medium">
                        Tap to flip back
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Elegant Controls */}
          <div className="flex justify-between items-center bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
            <Button
              variant="outline"
              onClick={prevCard}
              disabled={activeFlashcardIndex === 0}
              className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-white/30 hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl px-6 py-3"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="font-medium">Previous</span>
            </Button>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-800">
                  {activeFlashcardIndex + 1}
                </div>
                <div className="text-sm text-slate-500 font-medium">
                  of {currentFlashcardSet.length}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={flipCard}
                className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-white/30 hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl px-4 py-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="font-medium">Flip</span>
              </Button>
            </div>

            <Button
              onClick={nextCard}
              disabled={activeFlashcardIndex === currentFlashcardSet.length - 1}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl px-6 py-3"
            >
              <span className="font-medium">Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Sophisticated Card Indicators */}
          <div className="flex justify-center gap-3">
            {flashcardsArray.map((flashcard, index) => (
              <button
                key={index}
                onClick={() => {
                  setActiveFlashcardIndex(index);
                  setIsFlashcardFlipped(false);
                }}
                className={`relative w-4 h-4 rounded-full transition-all duration-300 transform hover:scale-110 ${
                  index === activeFlashcardIndex
                    ? `bg-gradient-to-r ${flashcard.gradient} shadow-lg`
                    : studiedCards.has(flashcard.id)
                    ? "bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-md"
                    : "bg-slate-300 hover:bg-slate-400"
                }`}
              >
                {studiedCards.has(flashcard.id) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <style jsx>{`
          .backface-hidden {
            backface-visibility: hidden;
          }
          .rotate-y-180 {
            transform: rotateY(180deg);
          }
          .transform-style-preserve-3d {
            transform-style: preserve-3d;
          }
          .perspective-1000 {
            perspective: 1000px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div
        className="fixed left-0 top-0 w-4 h-full z-50 bg-transparent"
        onMouseEnter={handleMouseEnter}
      />
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-2xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-5 w-5 mr-2" /> Back to Library
              </Button>
              <div className="h-8 w-px bg-white/30"></div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="text-white hover:bg-white/20"
                title={sidebarVisible ? "Hide Modules" : "Show Modules"}
              >
                <BookOpen className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Modules</span>
                {sidebarVisible ? (
                  <ChevronLeft className="h-4 w-4 ml-1" />
                ) : (
                  <ChevronRight className="h-4 w-4 ml-1" />
                )}
              </Button>
              <div className="h-8 w-px bg-white/30"></div>
              <div>
                <h1 className="text-2xl font-bold">{viewerCourse.title}</h1>
                <div className="text-orange-100 flex items-center gap-2 mt-1">
                  <Trophy className="h-4 w-4" /> {viewerCourse.examType} •{" "}
                  {viewerCourse.subject}
                  <Badge className="bg-white/20 text-white border-white/30 ml-2">
                    {viewerCourse.level || "Intermediate"}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-orange-100 text-sm">Overall Progress</p>
                <p className="text-2xl font-bold">{getOverallProgress()}%</p>
              </div>
              <Progress value={getOverallProgress()} className="w-32 h-3" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-4 lg:gap-8">
          <div
            className={`transition-all duration-300 ${
              sidebarVisible
                ? "w-80 lg:w-80 md:w-72 sm:w-64 xs:w-full opacity-100"
                : "w-0 opacity-0"
            } overflow-hidden flex-shrink-0`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Card className="sticky top-4 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <BookOpen className="h-5 w-5" /> Course Modules
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-6 p-6 min-h-[calc(100vh-8rem)]">
                  {modules.map((module, index) => (
                    <div key={index} className="space-y-2">
                      <Button
                        variant={currentModule === index ? "default" : "ghost"}
                        className={`w-full justify-start text-left h-auto p-3 ${
                          currentModule === index
                            ? "bg-gradient-to-r from-orange-500 to-red-600 text-white"
                            : "hover:bg-orange-50"
                        }`}
                        onClick={() => handleModuleSelect(index)}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              completedModules.has(index)
                                ? "bg-green-500 text-white"
                                : currentModule === index
                                ? "bg-white/20 text-white"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {completedModules.has(index) ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <span className="text-sm font-bold">
                                {index + 1}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {module.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress
                                value={getModuleProgress(index)}
                                className="h-1 flex-1"
                              />
                              <span className="text-xs opacity-70">
                                {getModuleProgress(index)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1 min-w-0">
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">
                      {currentModuleData?.title}
                    </CardTitle>
                    <p className="text-slate-300 mt-1">
                      Module {currentModule + 1} of {modules.length}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!completedModules.has(currentModule) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={markModuleComplete}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" /> Mark Complete
                      </Button>
                    )}
                    <Badge className="bg-white/20 text-white border-white/30">
                      {subsections.length} subsections
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue="content" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-gray-50">
                    <TabsTrigger
                      value="content"
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Content
                    </TabsTrigger>
                    <TabsTrigger
                      value="flashcards"
                      className="flex items-center gap-2"
                    >
                      <Brain className="h-4 w-4" />
                      Flashcards
                    </TabsTrigger>
                    <TabsTrigger
                      value="quiz"
                      className="flex items-center gap-2"
                    >
                      <Trophy className="h-4 w-4" />
                      Quiz
                    </TabsTrigger>
                    <TabsTrigger
                      value="resources"
                      className="flex items-center gap-2"
                    >
                      <BookOpen className="h-4 w-4" />
                      Resources
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="content" className="p-6">
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                          Module Overview
                        </h3>
                        <div className="prose max-w-none">
                          {(() => {
                            // Handle different content types (JSON object or string)
                            const rawContent = currentModuleData?.content;
                            let displayContent = null;
                            let hasStructuredData = false;

                            if (rawContent && typeof rawContent === "object") {
                              // Handle JSON structured content
                              console.log(
                                "🔧 Rendering JSON structured module content"
                              );
                              displayContent =
                                rawContent.summary ||
                                rawContent.content ||
                                "JSON content structure detected. Check subsections for detailed content.";
                              hasStructuredData = true;

                              // If we have JSON structured content, also update module data
                              if (
                                rawContent.summary &&
                                !currentModuleData.summary
                              ) {
                                currentModuleData.summary = rawContent.summary;
                              }
                              if (
                                rawContent.objectives &&
                                !currentModuleData.objectives
                              ) {
                                currentModuleData.objectives =
                                  rawContent.objectives;
                              }
                              if (
                                rawContent.examples &&
                                !currentModuleData.examples
                              ) {
                                currentModuleData.examples =
                                  rawContent.examples;
                              }
                              if (
                                rawContent.resources &&
                                !currentModuleData.resources
                              ) {
                                currentModuleData.resources =
                                  rawContent.resources;
                              }
                            } else if (
                              rawContent &&
                              typeof rawContent === "string"
                            ) {
                              // Handle string content (markdown)
                              displayContent = rawContent;
                            } else {
                              // Fallback to other sources
                              displayContent =
                                currentModuleData?.enhancedMarkdown ||
                                currentModuleData?.summary;
                            }

                            if (
                              displayContent &&
                              typeof displayContent === "string"
                            ) {
                              // Clean and format the content for better display using helper function
                              const formattedContent =
                                formatCurriculumContent(displayContent);

                              // If content looks like curriculum structure, render it specially
                              if (
                                formattedContent.includes("###") ||
                                formattedContent.includes("####")
                              ) {
                                return (
                                  <div>
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                      <p className="text-sm text-yellow-800">
                                        📖{" "}
                                        <strong>
                                          Curriculum Structure Detected
                                        </strong>{" "}
                                        - Rendering with enhanced formatting
                                      </p>
                                    </div>
                                    <ContentDisplay
                                      content={formattedContent}
                                      renderingMode="math-optimized"
                                      className="module-overview curriculum-content"
                                    />
                                    {hasStructuredData && (
                                      <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                                        <p className="text-sm text-green-700 flex items-center gap-2">
                                          <CheckCircle className="h-4 w-4" />✅
                                          Enhanced JSON content loaded with
                                          structured data
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                );
                              }

                              return (
                                <div>
                                  <ContentDisplay
                                    content={formattedContent}
                                    renderingMode="math-optimized"
                                    className="module-overview"
                                  />
                                  {hasStructuredData && (
                                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                                      <p className="text-sm text-green-700 flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4" />✅
                                        Enhanced JSON content loaded with
                                        structured data
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            } else {
                              return (
                                <div className="text-gray-500 italic p-4 bg-white/50 rounded-lg border">
                                  <p>📚 Module content is being processed...</p>
                                  <p className="text-sm mt-2">
                                    Check the "Subsections" tab for detailed
                                    content.
                                  </p>
                                  {process.env.NODE_ENV === "development" && (
                                    <div className="mt-2 text-xs text-gray-400">
                                      <p>Content type: {typeof rawContent}</p>
                                      <p>
                                        Has enhancedMarkdown:{" "}
                                        {!!currentModuleData?.enhancedMarkdown}
                                      </p>
                                      <p>
                                        Has summary:{" "}
                                        {!!currentModuleData?.summary}
                                      </p>
                                      <p>
                                        Has structured data: {hasStructuredData}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </div>

                      {/* Module Summary (if different from main content) */}
                      {currentModuleData?.summary &&
                        currentModuleData?.summary !==
                          currentModuleData?.content && (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                              <BookOpen className="h-5 w-5 text-blue-600" />
                              Summary
                            </h3>
                            <div className="prose max-w-none">
                              <ContentDisplay
                                content={currentModuleData.summary}
                                renderingMode="math-optimized"
                                className="module-summary"
                              />
                            </div>
                          </div>
                        )}

                      {/* Learning Objectives - Handle both direct and JSON-nested objectives */}
                      {(() => {
                        let objectives = currentModuleData?.objectives;

                        // If objectives is not available directly, check if it's in JSON content
                        if (
                          !objectives &&
                          currentModuleData?.content &&
                          typeof currentModuleData.content === "object"
                        ) {
                          objectives = currentModuleData.content.objectives;
                        }

                        return objectives && objectives.length > 0 ? (
                          <div className="bg-blue-50 p-6 rounded-xl">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                              <Target className="h-5 w-5 text-blue-600" />
                              Learning Objectives
                            </h3>
                            <ul className="space-y-2">
                              {objectives.map((objective, index) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-3"
                                >
                                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                                    {index + 1}
                                  </div>
                                  <div className="text-gray-700 flex-1">
                                    <ContentDisplay
                                      content={objective}
                                      renderingMode="math-optimized"
                                      className="objective"
                                    />
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null;
                      })()}

                      {/* Key Examples - Handle both direct and JSON-nested examples */}
                      {(() => {
                        let examples = currentModuleData?.examples;

                        // If examples is not available directly, check if it's in JSON content
                        if (
                          !examples &&
                          currentModuleData?.content &&
                          typeof currentModuleData.content === "object"
                        ) {
                          examples = currentModuleData.content.examples;
                        }

                        return examples && examples.length > 0 ? (
                          <div className="bg-green-50 p-6 rounded-xl">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                              <Lightbulb className="h-5 w-5 text-green-600" />
                              Key Examples
                            </h3>
                            <div className="space-y-4">
                              {examples.map((example, index) => (
                                <div
                                  key={index}
                                  className="bg-white p-4 rounded-lg shadow-sm"
                                >
                                  <div className="flex items-start gap-3">
                                    <Badge className="bg-green-100 text-green-800 mt-1">
                                      Example {index + 1}
                                    </Badge>
                                    <div className="flex-1">
                                      <div className="text-gray-700">
                                        <ContentDisplay
                                          content={example}
                                          renderingMode="math-optimized"
                                          className="example"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {/* Debug info for developers */}
                      {process.env.NODE_ENV === "development" && (
                        <div className="bg-gray-50 p-4 rounded-lg border text-xs text-gray-600">
                          <h4 className="font-semibold mb-2">Debug Info:</h4>
                          <p>Content sources available:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>
                              enhancedMarkdown:{" "}
                              {currentModuleData?.enhancedMarkdown
                                ? "✅ Available"
                                : "❌ Not available"}
                            </li>
                            <li>
                              content:{" "}
                              {currentModuleData?.content
                                ? "✅ Available"
                                : "❌ Not available"}
                            </li>
                            <li>
                              summary:{" "}
                              {currentModuleData?.summary
                                ? "✅ Available"
                                : "❌ Not available"}
                            </li>
                            <li>
                              detailedSubsections: {subsections.length} found
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="flashcards" className="p-6">
                    <div className="space-y-6">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
                          <Brain className="h-8 w-8 text-purple-600" />
                          Study Flashcards
                        </h2>
                        <p className="text-gray-600 mb-8">
                          Master key concepts and formulas with interactive
                          flashcards designed for {viewerCourse.examType} exam
                          success
                        </p>
                      </div>

                      {/* Flashcards for all subsections */}
                      <div className="space-y-6">
                        {subsections.length === 0 ? (
                          <div className="text-center py-12">
                            <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 mb-4">
                              No flashcards available yet
                            </p>
                            <p className="text-sm text-gray-400">
                              Flashcards will appear here once content is
                              generated for the subsections.
                            </p>
                          </div>
                        ) : (
                          subsections.map((subsection, index) => {
                            // Check if current subsection has flashcards
                            const hasConceptCards =
                              subsection?.conceptFlashCards &&
                              Array.isArray(subsection.conceptFlashCards) &&
                              subsection.conceptFlashCards.length > 0;
                            const hasFormulaCards =
                              subsection?.formulaFlashCards &&
                              Array.isArray(subsection.formulaFlashCards) &&
                              subsection.formulaFlashCards.length > 0;

                            const hasAnyFlashcards =
                              hasConceptCards || hasFormulaCards;

                            if (!hasAnyFlashcards) return null;

                            const conceptCount =
                              subsection.conceptFlashCards?.length || 0;
                            const formulaCount =
                              subsection.formulaFlashCards?.length || 0;
                            const totalCount = conceptCount + formulaCount;

                            return (
                              <Card
                                key={index}
                                className="border-2 border-gray-200 hover:border-purple-300 transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30"
                              >
                                <CardHeader className="pb-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-lg">
                                        {index + 1}
                                      </div>
                                      <div>
                                        <CardTitle className="text-xl text-gray-800">
                                          {subsection.title}
                                        </CardTitle>
                                        <div className="flex items-center gap-4 mt-2">
                                          <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                                            {totalCount} Cards Total
                                          </Badge>
                                          <div className="flex items-center gap-3 text-sm">
                                            {conceptCount > 0 && (
                                              <div className="flex items-center gap-1">
                                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                                <span>
                                                  📚 {conceptCount} Concepts
                                                </span>
                                              </div>
                                            )}
                                            {formulaCount > 0 && (
                                              <div className="flex items-center gap-1">
                                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                                <span>
                                                  🧮 {formulaCount} Formulas
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <Button
                                      onClick={() => openFlashcards(subsection)}
                                      className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                                    >
                                      <Brain className="h-4 w-4 mr-2" />
                                      Study Now
                                    </Button>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-4">
                                    {/* Summary */}
                                    {subsection.summary && (
                                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <p className="text-blue-800 text-sm">
                                          <ContentDisplay
                                            content={subsection.summary}
                                            renderingMode="math-optimized"
                                            className="subsection-summary"
                                            enableTelemetry={false}
                                          />
                                        </p>
                                      </div>
                                    )}

                                    {/* Preview cards by category */}
                                    <div className="space-y-4">
                                      {/* Concept Cards Preview */}
                                      {hasConceptCards && (
                                        <div>
                                          <h5 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                                            📚 Concept Cards Preview (
                                            {conceptCount} total)
                                          </h5>
                                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {subsection.conceptFlashCards
                                              .slice(0, 3)
                                              .map((card, cardIndex) => (
                                                <div
                                                  key={`concept-${cardIndex}`}
                                                  className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 hover:border-blue-300 transition-all duration-300 hover:shadow-md"
                                                >
                                                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
                                                    Concept Card {cardIndex + 1}
                                                  </div>
                                                  <div className="text-sm text-gray-700 line-clamp-3">
                                                    <ContentDisplay
                                                      content={card.question}
                                                      renderingMode="math-optimized"
                                                      className="text-sm"
                                                      enableTelemetry={false}
                                                    />
                                                  </div>
                                                </div>
                                              ))}
                                          </div>
                                          {conceptCount > 3 && (
                                            <p className="text-xs text-blue-600 mt-2 text-center">
                                              +{conceptCount - 3} more concept
                                              cards available
                                            </p>
                                          )}
                                        </div>
                                      )}

                                      {/* Formula Cards Preview */}
                                      {hasFormulaCards && (
                                        <div>
                                          <h5 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                                            🧮 Formula Cards Preview (
                                            {formulaCount} total)
                                          </h5>
                                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {subsection.formulaFlashCards
                                              .slice(0, 3)
                                              .map((card, cardIndex) => (
                                                <div
                                                  key={`formula-${cardIndex}`}
                                                  className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200 hover:border-green-300 transition-all duration-300 hover:shadow-md"
                                                >
                                                  <div className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">
                                                    Formula Card {cardIndex + 1}
                                                  </div>
                                                  <div className="text-sm text-gray-700 line-clamp-3">
                                                    <ContentDisplay
                                                      content={card.question}
                                                      renderingMode="math-optimized"
                                                      className="text-sm"
                                                      enableTelemetry={false}
                                                    />
                                                  </div>
                                                </div>
                                              ))}
                                          </div>
                                          {formulaCount > 3 && (
                                            <p className="text-xs text-green-600 mt-2 text-center">
                                              +{formulaCount - 3} more formula
                                              cards available
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    {/* Study time estimate */}
                                    <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Timer className="h-4 w-4" />
                                        <span>
                                          Estimated study time: ~
                                          {Math.ceil(totalCount * 0.5)} minutes
                                        </span>
                                      </div>
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {subsection.difficulty ||
                                          "Intermediate"}
                                      </Badge>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Quiz Tab Content */}
                  <TabsContent value="quiz" className="p-6">
                    <div className="space-y-6">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                          Practice Quizzes
                        </h2>
                        <p className="text-gray-600 mb-8">
                          Test your understanding with quizzes based on the
                          current module content
                        </p>

                        {/* Math Rendering Test in Development */}
                        {process.env.NODE_ENV === "development" && (
                          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h3 className="text-sm font-semibold text-blue-800 mb-2">
                              Math Rendering Test
                            </h3>
                            <div className="space-y-2 text-sm">
                              <div>
                                Inline:{" "}
                                <ContentDisplay
                                  content="The formula $E = mc^2$ shows energy-mass equivalence."
                                  renderingMode="math-optimized"
                                  className="inline-formula"
                                />
                              </div>
                              <div>
                                Block:{" "}
                                <ContentDisplay
                                  content="$$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$"
                                  renderingMode="math-optimized"
                                  className="block-formula"
                                />
                              </div>
                              <div>
                                Ohm's Law:{" "}
                                <ContentDisplay
                                  content="$V = IR$ where $V$ is voltage, $I$ is current, and $R$ is resistance."
                                  renderingMode="math-optimized"
                                  className="ohm-law"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {subsections.length > 0 ? (
                        <div className="grid gap-6">
                          {subsections.map((subsection, index) => (
                            <Card
                              key={index}
                              className="border-2 hover:border-purple-300 transition-colors"
                            >
                              <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <Target className="h-5 w-5 text-purple-600" />
                                  {subsection.title}
                                </CardTitle>
                                <p className="text-sm text-gray-600">
                                  {subsection.summary ||
                                    `Practice questions for ${subsection.title}`}
                                </p>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {["Easy", "Medium", "Hard"].map(
                                    (difficulty) => {
                                      const quizKey = `${currentModule}-${index}-${difficulty}`;
                                      const result = quizResults[quizKey];
                                      const hasCompletedQuiz = !!result;
                                      const hasQuiz = hasQuizForSubsection(
                                        currentModule,
                                        index,
                                        difficulty
                                      );

                                      return (
                                        <div
                                          key={difficulty}
                                          className="relative"
                                        >
                                          <Button
                                            onClick={() =>
                                              handleQuizStart(
                                                difficulty,
                                                subsection,
                                                index
                                              )
                                            }
                                            variant={
                                              hasCompletedQuiz
                                                ? "default"
                                                : "outline"
                                            }
                                            disabled={!hasQuiz}
                                            className={`w-full h-20 flex-col gap-2 ${
                                              difficulty === "Easy"
                                                ? "border-green-300 text-green-700 hover:bg-green-50"
                                                : difficulty === "Medium"
                                                ? "border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                                                : "border-red-300 text-red-700 hover:bg-red-50"
                                            } ${
                                              hasCompletedQuiz
                                                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
                                                : ""
                                            } ${
                                              !hasQuiz
                                                ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200"
                                                : ""
                                            }`}
                                          >
                                            <div className="flex items-center gap-2">
                                              {!hasQuiz ? (
                                                <X className="h-5 w-5" />
                                              ) : hasCompletedQuiz ? (
                                                <CheckCircle className="h-5 w-5" />
                                              ) : (
                                                <Play className="h-5 w-5" />
                                              )}
                                              <span className="font-semibold">
                                                {difficulty}
                                              </span>
                                            </div>
                                            <span className="text-xs opacity-80">
                                              {!hasQuiz
                                                ? "Not Available"
                                                : hasCompletedQuiz
                                                ? "Completed"
                                                : "Start Quiz"}
                                            </span>
                                          </Button>
                                          {hasCompletedQuiz && (
                                            <div className="absolute -top-2 -right-2">
                                              <Badge className="bg-green-100 text-green-800">
                                                {result.score}%
                                              </Badge>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 mb-4">
                            No quizzes available yet
                          </p>
                          <p className="text-sm text-gray-400">
                            Quizzes are generated by your educator for each
                            subsection. Check back later or contact your
                            educator to request quiz generation.
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="resources" className="p-6 bg-slate-50">
                    <div className="max-w-7xl mx-auto">
                      <div className="bg-gradient-to-r from-violet-100 to-purple-100 p-8 rounded-2xl mb-8 relative overflow-hidden">
                        <div className="relative z-10 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-full shadow-md">
                              <Sparkles className="h-8 w-8 text-purple-600" />
                            </div>
                            <div>
                              <h2 className="text-3xl font-bold text-slate-800">
                                Learning Resources
                              </h2>
                              <p className="text-slate-600 mt-1">
                                Comprehensive collection of exam preparation
                                materials
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-purple-600 text-white text-sm py-2 px-4 border-purple-700">
                            <Brain className="h-4 w-4 mr-2" />
                            Exam Focused
                          </Badge>
                        </div>
                      </div>

                      <div className="mb-8">
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                          {Object.entries(resourceCategories).map(
                            ([key, { icon: Icon, label }]) => {
                              // Get resources from either direct property or JSON content structure
                              let moduleResources =
                                currentModuleData?.resources;

                              // If resources not available directly, check if it's in JSON content
                              if (
                                !moduleResources &&
                                currentModuleData?.content &&
                                typeof currentModuleData.content === "object"
                              ) {
                                moduleResources =
                                  currentModuleData.content.resources;
                              }

                              const resources = moduleResources?.[key] || [];
                              const count = resources.length;
                              if (count === 0) return null;

                              const styles = categoryStyles[key] || {};
                              return (
                                <button
                                  key={key}
                                  onClick={() =>
                                    setSelectedResourceCategory(key)
                                  }
                                  className={`p-4 rounded-2xl text-center transition-all duration-300 transform hover:-translate-y-1 group ${
                                    selectedResourceCategory === key
                                      ? `bg-white shadow-lg ring-2 ${styles.ring}`
                                      : "bg-white/80 shadow-md hover:shadow-lg"
                                  }`}
                                >
                                  <Icon
                                    className={`h-7 w-7 mx-auto mb-3 ${styles.text} group-hover:text-opacity-80 transition-colors`}
                                  />
                                  <p className="font-semibold text-slate-800 text-sm">
                                    {label}
                                  </p>
                                  <div
                                    className={`mt-2 inline-block px-2 py-0.5 text-xs font-bold ${styles.text} ${styles.bg} rounded-full`}
                                  >
                                    {count}
                                  </div>
                                </button>
                              );
                            }
                          )}
                        </div>
                      </div>

                      <AnimatePresence mode="wait">
                        <motion.div
                          key={selectedResourceCategory}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {(() => {
                              // Get resources from either direct property or JSON content structure
                              let moduleResources =
                                currentModuleData?.resources;

                              // If resources not available directly, check if it's in JSON content
                              if (
                                !moduleResources &&
                                currentModuleData?.content &&
                                typeof currentModuleData.content === "object"
                              ) {
                                moduleResources =
                                  currentModuleData.content.resources;
                              }

                              const categoryResources =
                                moduleResources?.[selectedResourceCategory] ||
                                [];

                              return categoryResources.map(
                                (resource, index) => (
                                  <ResourceCard
                                    key={`${selectedResourceCategory}-${index}`}
                                    resource={resource}
                                    type={selectedResourceCategory}
                                    isInstructorChoice={
                                      resource.isInstructorChoice
                                    }
                                    resourceIndex={index}
                                  />
                                )
                              );
                            })()}
                          </div>
                          {(() => {
                            // Check if category has resources (handle both direct and JSON structure)
                            let moduleResources = currentModuleData?.resources;

                            if (
                              !moduleResources &&
                              currentModuleData?.content &&
                              typeof currentModuleData.content === "object"
                            ) {
                              moduleResources =
                                currentModuleData.content.resources;
                            }

                            const categoryResources =
                              moduleResources?.[selectedResourceCategory] || [];
                            const hasResources = categoryResources.length > 0;

                            return !hasResources ? (
                              <div className="text-center py-12">
                                <p className="text-slate-500">
                                  No resources in this category.
                                </p>
                                {process.env.NODE_ENV === "development" && (
                                  <div className="mt-2 text-xs text-gray-400">
                                    <p>
                                      Available resources:{" "}
                                      {JSON.stringify(
                                        Object.keys(moduleResources || {})
                                      )}
                                    </p>
                                    <p>
                                      Selected category:{" "}
                                      {selectedResourceCategory}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : null;
                          })()}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </TabsContent>
                  <TabsContent value="progress" className="p-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Your Progress</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <p>Overall Progress: {getOverallProgress()}%</p>
                            <Progress value={getOverallProgress()} />
                          </div>
                          <div>
                            <p>
                              Current Module Progress:{" "}
                              {getModuleProgress(currentModule)}%
                            </p>
                            <Progress
                              value={getModuleProgress(currentModule)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <QuizModal
        quiz={selectedQuiz}
        open={isQuizModalOpen}
        onOpenChange={setIsQuizModalOpen}
        onQuizComplete={(score) => {
          console.log(`Quiz completed with score: ${score}`);
          // Handle quiz completion for Exam Genius courses
        }}
      />
    </div>
  );
}

function QuizInterface({ quizData, onComplete, difficulty }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = quizData.questions || [];
  const currentQ = questions[currentQuestion];

  useEffect(() => {
    if (timeLeft > 0 && !showResults) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResults) {
      handleSubmit();
    }
  }, [timeLeft, showResults]);

  const handleAnswerSelect = (questionIndex, answer) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: answer }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    let correct = 0;
    const results = [];
    questions.forEach((question, index) => {
      const userAnswer = selectedAnswers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) correct++;
      results.push({
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
      });
    });

    const score = Math.round((correct / questions.length) * 100);

    setTimeout(() => {
      setIsSubmitting(false);
      setShowResults(true);
      onComplete({
        score,
        correct,
        total: questions.length,
        results,
        difficulty,
        completedAt: new Date().toISOString(),
      });
    }, 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isSubmitting) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-xl font-semibold text-gray-800">
          Evaluating your answers...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 quiz-content">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Question {currentQuestion + 1} of {questions.length}
        </h3>
        <div className="flex items-center gap-2 font-semibold text-red-500">
          <Timer className="h-5 w-5" />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>
      <div>
        <div className="font-medium text-lg mb-4 math-question">
          <ContentDisplay
            content={currentQ?.question}
            renderingMode="math-optimized"
            className="question"
            enableTelemetry={process.env.NODE_ENV === "development"}
            onRenderError={(error) =>
              console.warn("Quiz question math error:", error)
            }
          />
        </div>
        <div className="space-y-2">
          {currentQ?.options.map((option, index) => (
            <Button
              key={index}
              variant={
                selectedAnswers[currentQuestion] === index
                  ? "default"
                  : "outline"
              }
              className="w-full justify-start text-left h-auto py-3 quiz-option"
              onClick={() => handleAnswerSelect(currentQuestion, index)}
            >
              <ContentDisplay
                content={option}
                renderingMode="math-optimized"
                className="option"
                enableTelemetry={process.env.NODE_ENV === "development"}
                onRenderError={(error) =>
                  console.warn("Quiz option math error:", error)
                }
              />
            </Button>
          ))}
        </div>
      </div>
      <div className="flex justify-between">
        <Button
          onClick={() => setCurrentQuestion((q) => q - 1)}
          disabled={currentQuestion === 0}
        >
          Previous
        </Button>
        {currentQuestion === questions.length - 1 ? (
          <Button
            onClick={handleSubmit}
            className="bg-green-500 hover:bg-green-600"
          >
            Submit
          </Button>
        ) : (
          <Button onClick={() => setCurrentQuestion((q) => q + 1)}>Next</Button>
        )}
      </div>
    </div>
  );
}
