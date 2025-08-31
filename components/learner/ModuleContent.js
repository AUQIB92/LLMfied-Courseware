"use client";

import React from "react";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { PremiumFeatureButton } from "@/components/ui/premium-upgrade";
import { checkPremiumFeature } from "@/lib/models";
import {
  Atom,
  BookOpen,
  Bookmark,
  Brain,
  CheckCircle,
  ChevronRight,
  Clock,
  Code,
  ExternalLink,
  FileText,
  Globe,
  Layers,
  Lightbulb,
  Play,
  Share2,
  Sparkles,
  Target,
  TestTube,
  Video,
  Wrench,
  Zap,
  Terminal,
  Code2,
  Cpu,
  PlayCircle,
  StopCircle,
  RotateCcw,
  Save,
  Download,
  Upload,
  TrendingUp,
  Award,
  User,
  Trophy,
  Flame,
  Star,
  Camera,
  Heart,
  Eye,
  Settings,
  Crown,
  Maximize2,
  Minimize2,
  RefreshCw,
  ChevronLeft,
  X,
  Edit,
  Plus,
} from "lucide-react";
import QuizModal from "./QuizModal";
import ContentDisplay from "@/components/ContentDisplay";
import MathMarkdownRenderer from "@/components/MathMarkdownRenderer";

// Helper function to parse markdown into pages
function parseMarkdownToPages(markdown) {
  if (!markdown || typeof markdown !== "string") {
    return [];
  }

  // Split by #### headers
  const sections = markdown.split(/\n####\s+/);
  const pages = [];

  // Handle content before first #### header
  const introContent = sections.shift()?.trim();
  if (introContent) {
    pages.push({ title: "Introduction", content: introContent });
  }

  // Process each section
  sections.forEach((section) => {
    const lines = section.split("\n");
    const title = lines.shift()?.trim() || "Untitled Section";
    const content = lines.join("\n").trim();
    if (title && content) {
      pages.push({ title, content });
    }
  });

  // If no sections found but there's content, return as single page
  if (pages.length === 0 && introContent) {
    return [{ title: "Content", content: introContent }];
  }

  return pages;
}

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

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
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

const pulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Number.POSITIVE_INFINITY,
      ease: "easeInOut",
    },
  },
};

// Floating animation for enhanced visual appeal
const floatingVariants = {
  floating: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Number.POSITIVE_INFINITY,
      ease: "easeInOut",
    },
  },
};

// Sparkle animation for interactive elements
const sparkleVariants = {
  sparkle: {
    scale: [1, 1.2, 1],
    rotate: [0, 180, 360],
    transition: {
      duration: 2,
      repeat: Number.POSITIVE_INFINITY,
      ease: "easeInOut",
    },
  },
};

// Gradient text animation
const gradientTextVariants = {
  animate: {
    backgroundPosition: ["0%", "100%"],
    transition: {
      duration: 4,
      repeat: Number.POSITIVE_INFINITY,
      ease: "linear",
    },
  },
};

// Custom hooks
const useProgressAnimation = (progress) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 500);

    return () => clearTimeout(timer);
  }, [progress]);

  return animatedProgress;
};

const useInViewAnimation = () => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return { ref, isInView };
};

// Enhanced Loading Component
const EnhancedLoader = ({ text = "Loading..." }) => (
  <motion.div
    className="flex flex-col items-center justify-center py-12"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.div
      className="relative w-16 h-16 mb-4"
      animate={{ rotate: 360 }}
      transition={{
        duration: 2,
        repeat: Number.POSITIVE_INFINITY,
        ease: "linear",
      }}
    >
      <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
      <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent"></div>
    </motion.div>
    <motion.p
      className="text-blue-600 font-medium"
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
    >
      {text}
    </motion.p>
  </motion.div>
);

// Enhanced Badge Component
const EnhancedBadge = ({
  children,
  variant = "default",
  className = "",
  ...props
}) => (
  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
    <Badge
      variant={variant}
      className={`backdrop-blur-sm shadow-lg border-0 ${className}`}
      {...props}
    >
      {children}
    </Badge>
  </motion.div>
);

// Glassmorphism Card Component with enhanced effects
const GlassCard = ({ children, className = "", ...props }) => (
  <motion.div
    variants={cardVariants}
    whileHover="hover"
    className={`
      backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl
      hover:shadow-3xl transition-all duration-300 overflow-hidden
      relative group
      ${className}
    `}
    {...props}
  >
    {/* Floating particles effect */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl group-hover:animate-pulse"></div>
      <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-gradient-to-r from-pink-400/20 to-cyan-400/20 rounded-full blur-xl group-hover:animate-bounce"></div>
      <div className="absolute top-1/2 -left-6 w-6 h-6 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-lg group-hover:animate-ping"></div>
    </div>
    {children}
  </motion.div>
);

// Enhanced Code Editor Component
const CodeEditor = ({
  value,
  onChange,
  language,
  readOnly = false,
  theme = "light",
  fontSize = 14,
}) => {
  const editorRef = useRef(null);

  return (
    <motion.div
      className="relative rounded-xl overflow-hidden border border-gray-300 shadow-lg"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-sm font-medium">
            {language}.
            {language === "javascript"
              ? "js"
              : language === "python"
              ? "py"
              : "java"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-xs text-gray-300 border-gray-600"
          >
            {language.toUpperCase()}
          </Badge>
        </div>
      </div>

      <Textarea
        ref={editorRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Write your ${language} code here...`}
        className={`min-h-[300px] font-mono text-sm resize-none border-0 rounded-none focus:ring-0 ${
          theme === "dark"
            ? "bg-gray-900 text-green-400"
            : "bg-white text-gray-800"
        }`}
        style={{ fontSize: `${fontSize}px` }}
        readOnly={readOnly}
      />

      {!readOnly && (
        <motion.div
          className="absolute top-12 right-2 flex flex-col gap-1"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFontSize((prev) => Math.min(prev + 1, 20))}
            className="w-8 h-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            +
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFontSize((prev) => Math.max(prev - 1, 10))}
            className="w-8 h-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            -
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

// Programming Challenge Card Component
const ProgrammingChallengeCard = ({
  challenge,
  isActive,
  onClick,
  challengeProgress,
}) => {
  const isCompleted = challengeProgress[challenge.id] === 100;

  return (
    <motion.div
      className={`cursor-pointer transition-all duration-300 ${
        isActive ? "ring-2 ring-blue-500 ring-offset-2" : "hover:shadow-lg"
      }`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <GlassCard
        className={`h-full ${
          isActive
            ? "bg-gradient-to-br from-blue-50/90 to-indigo-50/90 border-blue-300/50"
            : isCompleted
            ? "bg-gradient-to-br from-green-50/90 to-emerald-50/90 border-green-300/50"
            : "bg-white/70 border-gray-200/50"
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <motion.div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isActive
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
                whileHover={{ scale: 1.1 }}
              >
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  challenge.id.split("-")[1]
                )}
              </motion.div>
              <div>
                <h4 className="font-semibold text-sm text-gray-800">
                  {challenge.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <EnhancedBadge
                    className={`text-xs ${
                      challenge.difficulty === "beginner"
                        ? "bg-green-100 text-green-700"
                        : challenge.difficulty === "intermediate"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {challenge.difficulty}
                  </EnhancedBadge>
                  <span className="text-xs text-gray-500">
                    {challenge.estimatedTime}
                  </span>
                </div>
              </div>
            </div>
            {isCompleted && <Trophy className="h-5 w-5 text-yellow-500" />}
          </div>

          <MathMarkdownRenderer content={challenge.description} />

          {challenge.concepts && (
            <div className="flex flex-wrap gap-1">
              {challenge.concepts.slice(0, 3).map((concept, index) => (
                <EnhancedBadge
                  key={`challenge-concept-${index}-${concept}`}
                  variant="outline"
                  className="text-xs"
                >
                  {concept}
                </EnhancedBadge>
              ))}
              {challenge.concepts.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{challenge.concepts.length - 3} more
                </span>
              )}
            </div>
          )}
        </CardContent>
      </GlassCard>
    </motion.div>
  );
};

export default function ModuleContent({
  module,
  course,
  onProgress = () => {},
  onToggleBookmark = () => {},
  onModuleUpdate = () => {},
}) {
  const { user } = useAuth();

  // State management
  const [moduleProgress, setModuleProgress] = useState({
    completed: false,
    timeSpent: 0,
    notesCount: 0,
    bookmarked: false,
  });

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState(module.content || "");
  const [editedObjectives, setEditedObjectives] = useState(
    module.objectives || []
  );
  const [editedSummary, setEditedSummary] = useState(module.summary || "");
  const [isSaving, setIsSaving] = useState(false);

  // Content pagination state
  const [currentPage, setCurrentPage] = useState(0);

  // Parse module content into pages
  const contentPages = useMemo(() => {
    return parseMarkdownToPages(module.content || "");
  }, [module.content]);

  // Current page data
  const currentPageData =
    contentPages.length > 0 && currentPage < contentPages.length
      ? contentPages[currentPage]
      : null;

  // Keyboard navigation for pagination
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (contentPages.length <= 1) return;

      if (e.key === "ArrowLeft" && currentPage > 0) {
        setCurrentPage((prev) => prev - 1);
      } else if (
        e.key === "ArrowRight" &&
        currentPage < contentPages.length - 1
      ) {
        setCurrentPage((prev) => prev + 1);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentPage, contentPages.length]);

  // Notes and interaction state
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [expandedObjective, setExpandedObjective] = useState(null);
  const [expandedExample, setExpandedExample] = useState(null);
  const [expandedChallenge, setExpandedChallenge] = useState(null);
  const [viewMode, setViewMode] = useState("content");
  const [readingProgress, setReadingProgress] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [loadingSubsections, setLoadingSubsections] = useState(false);
  const [contentSubsections, setContentSubsections] = useState([]);
  const [expandedSubsections, setExpandedSubsections] = useState({});
  const [verifyingEnrollment, setVerifyingEnrollment] = useState(true);
  const [enrollmentVerified, setEnrollmentVerified] = useState(false);
  const [aiResources, setAiResources] = useState({
    books: [],
    courses: [],
    articles: [],
    videos: [],
    tools: [],
    websites: [],
    exercises: [],
  });
  const [editingResource, setEditingResource] = useState(null);
  const [editedResourceData, setEditedResourceData] = useState({});
  const [isUpdatingResource, setIsUpdatingResource] = useState(false);
  const [loadingExplanation, setLoadingExplanation] = useState({});
  const [simplifiedExplanations, setSimplifiedExplanations] = useState({});
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [programmingChallenges, setProgrammingChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [activeProgrammingChallenge, setActiveProgrammingChallenge] =
    useState(null);
  const [userCode, setUserCode] = useState("");
  const [programmingLanguage, setProgrammingLanguage] = useState("javascript");
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [codeErrors, setCodeErrors] = useState("");
  const [codeOutput, setCodeOutput] = useState("");
  const [testResults, setTestResults] = useState([]);
  const [challengeScore, setChallengeScore] = useState(0);
  const [savedCodes, setSavedCodes] = useState({});
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState({});
  const [explanationPages, setExplanationPages] = useState({});

  // Rich text formatting is now handled by MathMarkdownRenderer component

  // NEW: Helper functions for multi-page explanations
  const wordsPerExplanationPage = 100;
  const splitExplanationIntoPages = (explanation) => {
    if (!explanation || explanation.length === 0) return [];

    const words = explanation.split(" ");
    const pages = [];

    for (let i = 0; i < words.length; i += wordsPerExplanationPage) {
      const pageWords = words.slice(i, i + wordsPerExplanationPage);
      pages.push(pageWords.join(" "));
    }

    return pages.length > 0 ? pages : [explanation];
  };

  // Get current page for a specific subsection explanation
  const getCurrentExplanationPage = (subsectionId) => {
    return explanationPages[subsectionId] || 0;
  };

  // Set current page for a specific subsection explanation
  const setCurrentExplanationPageForSubsection = (subsectionId, pageIndex) => {
    setExplanationPages((prev) => ({
      ...prev,
      [subsectionId]: pageIndex,
    }));
  };

  // Calculate reading progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setReadingProgress(Math.min(progress, 100));
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Animated progress value
  const animatedProgress = useProgressAnimation(readingProgress);

  // Helper function to extract JSON from AI responses
  const extractJsonFromResponse = useCallback((responseText) => {
    // Debug: Log the response text sample
    console.log(
      "Attempting to parse AI response:",
      responseText.substring(0, 200) + "..."
    );

    try {
      // First try direct parsing
      const parsed = JSON.parse(responseText);
      console.log("✅ Direct JSON parse successful");
      return parsed;
    } catch (directParseError) {
      console.warn("Direct JSON parse failed:", directParseError.message);

      try {
        // Try to find JSON in code blocks or text
        let jsonString = responseText;

        // Look for JSON in various patterns
        const patterns = [
          /```json\s*([\s\S]*?)\s*```/, // JSON code blocks
          /```\s*([\s\S]*?)\s*```/, // Generic code blocks
          /\{[\s\S]*\}/, // Anything that looks like JSON
        ];

        for (const pattern of patterns) {
          const match = responseText.match(pattern);
          if (match) {
            jsonString = match[1] || match[0];
            console.log(
              "Found JSON pattern, extracted:",
              jsonString.substring(0, 100) + "..."
            );
            break;
          }
        }

        // Clean up the JSON string more carefully
        jsonString = jsonString.trim();

        // Only apply fixes if we're sure it's needed
        if (jsonString.includes(",}") || jsonString.includes(",]")) {
          console.log("Removing trailing commas...");
          // Remove trailing commas before closing brackets
          jsonString = jsonString.replace(/,(\s*[}\]])/g, "$1");
        }

        // Try to parse the cleaned JSON
        const parsed = JSON.parse(jsonString);
        console.log("✅ Successfully extracted and parsed JSON from response");
        return parsed;
      } catch (extractError) {
        console.error("❌ JSON extraction failed:", extractError.message);
        console.error("Response text sample:", responseText.substring(0, 500));

        // Try one more time with a more lenient approach
        try {
          // Look for the first complete JSON object
          const startIndex = responseText.indexOf("{");
          const endIndex = responseText.lastIndexOf("}");

          if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
            const jsonCandidate = responseText.substring(
              startIndex,
              endIndex + 1
            );
            console.log("Trying last resort JSON extraction...");
            const parsed = JSON.parse(jsonCandidate);
            console.log("✅ Last resort parsing successful");
            return parsed;
          }
        } catch (lastResortError) {
          console.error(
            "❌ Last resort JSON parsing also failed:",
            lastResortError.message
          );
        }

        // Return a safe fallback structure based on the context
        console.log("Returning fallback structure...");
        if (responseText.toLowerCase().includes("challenge")) {
          return {
            challenges: [],
            error: "Failed to parse AI response",
            originalError: extractError.message,
            rawResponse: responseText.substring(0, 200),
          };
        } else if (responseText.toLowerCase().includes("subsection")) {
          return {
            subsections: [],
            error: "Failed to parse AI response",
            originalError: extractError.message,
            rawResponse: responseText.substring(0, 200),
          };
        } else {
          return {
            error: "Failed to parse AI response",
            originalError: extractError.message,
            rawResponse: responseText.substring(0, 200),
          };
        }
      }
    }
  }, []);

  useEffect(() => {
    setStartTime(Date.now());
    if (module.content) {
      // Only use pre-generated detailed subsections from curriculum processing
      if (module.detailedSubsections && module.detailedSubsections.length > 0) {
        console.log(
          "🔍 Raw module.detailedSubsections:",
          module.detailedSubsections
        );

        // Ensure each subsection has a unique ID for proper toggling
        const subsectionsWithIds = module.detailedSubsections.map(
          (subsection, index) => {
            console.log(`🔧 Processing subsection ${index}:`, subsection);

            // Enhanced ID generation with multiple fallbacks
            let uniqueId;
            if (
              subsection.id &&
              typeof subsection.id === "string" &&
              subsection.id.trim() !== ""
            ) {
              uniqueId = subsection.id.trim();
            } else if (
              subsection.title &&
              typeof subsection.title === "string" &&
              subsection.title.trim() !== ""
            ) {
              uniqueId = subsection.title
                .trim()
                .replace(/[^a-zA-Z0-9]/g, "-")
                .toLowerCase();
            } else {
              uniqueId = `subsection-${module.id || "unknown"}-${index}`;
            }

            console.log(
              `✅ Generated ID for subsection ${index}: "${uniqueId}"`
            );

            return {
              ...subsection,
              id: uniqueId, // Ensure unique ID
            };
          }
        );

        console.log("✅ Subsections with proper IDs:", subsectionsWithIds);
        setContentSubsections(subsectionsWithIds);

        // Initialize expanded state for all subsections as closed
        const initialExpandedState = {};
        subsectionsWithIds.forEach((subsection) => {
          initialExpandedState[subsection.id] = false;
        });
        console.log("📊 Initial expanded state:", initialExpandedState);
        setExpandedSubsections(initialExpandedState);
      }
      // No fallback generation - content should be pre-generated during curriculum processing
    }
    return () => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000 / 60);
      if (timeSpent > 0) {
        onProgress(module.id, moduleProgress.completed, timeSpent);
      }
    };
  }, [module.id]);

  // Extract important topics from module content
  const extractImportantTopics = useCallback((content) => {
    if (!content) return [];

    const sentences = content
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 20);
    const topics = [];

    sentences.forEach((sentence, index) => {
      const trimmed = sentence.trim();
      if (
        trimmed.match(
          /\b(is|are|means|refers to|defined as|known as|called|represents)\b/i
        )
      ) {
        const words = trimmed.split(" ");
        if (words.length > 5) {
          const topicName = words
            .slice(
              0,
              Math.min(
                5,
                words.indexOf(
                  words.find((w) =>
                    w.match(
                      /\b(is|are|means|refers to|defined as|known as|called|represents)\b/i
                    )
                  )
                )
              )
            )
            .join(" ");

          if (topicName && topicName.length > 3) {
            topics.push({
              id: `topic-${index}`,
              name: topicName,
              content: trimmed,
              canVisualize: detectVisualizableContent(trimmed),
            });
          }
        }
      }
    });

    return topics.slice(0, 6);
  }, []);

  // Detect if content can be visualized
  const detectVisualizableContent = useCallback((content) => {
    const visualKeywords = [
      "algorithm",
      "process",
      "flow",
      "sequence",
      "steps",
      "procedure",
      "graph",
      "chart",
      "data",
      "structure",
      "tree",
      "network",
      "formula",
      "equation",
      "calculation",
      "function",
      "relationship",
      "cycle",
      "system",
      "architecture",
      "model",
      "diagram",
      "comparison",
      "vs",
      "versus",
      "difference",
      "similar",
      "timeline",
      "history",
      "evolution",
      "progression",
    ];

    return visualKeywords.some((keyword) =>
      content.toLowerCase().includes(keyword.toLowerCase())
    );
  }, []);

  // Generate simplified explanation using AI
  const generateSimplifiedExplanation = async (topic) => {
    setLoadingExplanation((prev) => ({ ...prev, [topic.id]: true }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Please provide a simplified, easy-to-understand explanation of this topic for a beginner. Use simple language, analogies, and real-world examples. Keep it under 200 words and use formatting for better readability.

Topic: ${topic.name}
Original Content: ${topic.content}

Please structure your response with clear formatting:

**Simple Definition**
Start with a clear, simple definition in 1-2 sentences.

**Easy Analogy** 
Compare it to something familiar that everyone understands.

**Real-world Example**
Provide a concrete example of where this is used in daily life or work.

**Why It Matters**
Explain the practical importance and benefits.

Use **bold text** for key terms, *italics* for emphasis, and \`code examples\` when relevant. Make it engaging and easy to scan.`,
          courseId: course._id,
          moduleId: module.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSimplifiedExplanations((prev) => ({
          ...prev,
          [topic.id]: data.response,
        }));
      } else {
        throw new Error("Failed to generate explanation");
      }
    } catch (error) {
      console.error("Error generating simplified explanation:", error);
      setSimplifiedExplanations((prev) => ({
        ...prev,
        [topic.id]:
          "Sorry, I couldn't generate a simplified explanation at this time. Please try again later.",
      }));
    } finally {
      setLoadingExplanation((prev) => ({ ...prev, [topic.id]: false }));
    }
  };

  // Note: Content subsections should be pre-generated during curriculum processing
  // The generateContentSubsections function has been removed to prevent learner-side content generation

  // Programming Practice Functions
  const generateProgrammingChallenges = async () => {
    setLoadingChallenges(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Generate interactive programming challenges based on this module content. Create 3-5 challenges that progressively build understanding of the concepts.

Module: ${module.title}
Content: ${module.content}
Objectives: ${
            module.objectives ? module.objectives.join(", ") : "Not specified"
          }

For each challenge, provide:
1. Clear problem statement
2. Starting code template
3. Expected output/behavior
4. Test cases
5. Hints for learners
6. Step-by-step solution
7. Difficulty level
8. Concepts reinforced

Return JSON in this format:
{
  "challenges": [
    {
      "id": "challenge-1",
      "title": "Challenge Title",
      "description": "Clear problem description with examples",
      "difficulty": "beginner|intermediate|advanced",
      "estimatedTime": "10-15 minutes",
      "concepts": ["concept1", "concept2"],
      "starterCode": {
        "javascript": "// Starting code template",
        "python": "# Starting code template",
        "java": "// Starting code template"
      },
      "solution": {
        "javascript": "// Complete solution",
        "python": "# Complete solution", 
        "java": "// Complete solution"
      },
      "testCases": [
        {
          "input": "input data",
          "expectedOutput": "expected result",
          "description": "Test case description"
        }
      ],
      "hints": [
        "Helpful hint 1",
        "Helpful hint 2"
      ],
      "explanation": "Why this solution works and key concepts"
    }
  ]
}`,
          courseId: course._id,
          moduleId: module.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        try {
          const challenges = extractJsonFromResponse(data.response);

          // Validate the structure
          if (
            challenges &&
            challenges.challenges &&
            Array.isArray(challenges.challenges)
          ) {
            setProgrammingChallenges(challenges.challenges);
            if (challenges.challenges.length > 0) {
              setSelectedChallenge(challenges.challenges[0]);
              setActiveProgrammingChallenge(challenges.challenges[0]);
              setUserCode(
                challenges.challenges[0].starterCode[programmingLanguage] || ""
              );
            }
          } else if (challenges && challenges.error) {
            console.error(
              "AI response parsing failed:",
              challenges.originalError
            );
            setProgrammingChallenges([]);
          } else {
            throw new Error("Invalid challenges structure");
          }
        } catch (parseError) {
          console.error("Error parsing programming challenges:", parseError);
          setProgrammingChallenges([]);
        }
      } else {
        console.error(
          "Failed to generate programming challenges:",
          response.statusText
        );
        setProgrammingChallenges([]);
      }
    } catch (error) {
      console.error("Error generating programming challenges:", error);
    } finally {
      setLoadingChallenges(false);
    }
  };

  const runCode = async () => {
    if (!userCode.trim()) return;

    setIsRunningCode(true);
    setCodeErrors("");
    setCodeOutput("");
    setTestResults([]);

    try {
      // Simulate code execution (in a real app, you'd use a sandboxed execution environment)
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Analyze and simulate the execution of this ${programmingLanguage} code. Provide:
1. Expected output
2. Any syntax or logical errors
3. Test case results if applicable
4. Performance feedback
5. Code quality suggestions

Code:
\`\`\`${programmingLanguage}
${userCode}
\`\`\`

${
  activeProgrammingChallenge
    ? `
This code is for challenge: ${activeProgrammingChallenge.title}
Test cases: ${JSON.stringify(activeProgrammingChallenge.testCases)}
`
    : ""
}

Return JSON format:
{
  "output": "Expected console output",
  "errors": "Any errors found (empty if none)",
  "testResults": [
    {
      "testCase": "test description",
      "passed": true/false,
      "actual": "actual result",
      "expected": "expected result"
    }
  ],
  "feedback": "Performance and quality feedback",
  "suggestions": ["suggestion1", "suggestion2"]
}`,
          courseId: course._id,
          moduleId: module.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        try {
          const result = extractJsonFromResponse(data.response);

          // Validate the structure
          if (result && !result.error) {
            setCodeOutput(result.output || "Code executed successfully");
            setCodeErrors(result.errors || "");
            setTestResults(result.testResults || []);

            if (result.testResults && Array.isArray(result.testResults)) {
              const passedTests = result.testResults.filter(
                (test) => test.passed
              ).length;
              const totalTests = result.testResults.length;
              const score =
                totalTests > 0
                  ? Math.round((passedTests / totalTests) * 100)
                  : 0;
              setChallengeScore(score);
            }
          } else if (result && result.error) {
            console.error("AI response parsing failed:", result.originalError);
            setCodeErrors(
              "Code analysis temporarily unavailable. Please try again."
            );
            setCodeOutput("");
          } else {
            throw new Error("Invalid code execution result structure");
          }
        } catch (parseError) {
          console.error("Error parsing code execution result:", parseError);
          setCodeErrors(
            "Error analyzing code execution. Please check your syntax and try again."
          );
          setCodeOutput("");
        }
      } else {
        console.error("Failed to run code analysis:", response.statusText);
        setCodeErrors(
          "Network error. Please check your connection and try again."
        );
        setCodeOutput("");
      }
    } catch (error) {
      setCodeErrors("Error running code: " + error.message);
    } finally {
      setIsRunningCode(false);
    }
  };

  const resetCode = () => {
    if (activeProgrammingChallenge) {
      setUserCode(
        activeProgrammingChallenge.starterCode[programmingLanguage] || ""
      );
      setCodeOutput("");
      setCodeErrors("");
      setTestResults([]);
      setChallengeScore(0);
    }
  };

  const saveCode = () => {
    if (activeProgrammingChallenge) {
      setSavedCodes((prev) => ({
        ...prev,
        [activeProgrammingChallenge.id]: {
          code: userCode,
          timestamp: new Date().toISOString(),
          language: programmingLanguage,
        },
      }));
    }
  };

  const loadSavedCode = () => {
    if (
      activeProgrammingChallenge &&
      savedCodes[activeProgrammingChallenge.id]
    ) {
      setUserCode(savedCodes[activeProgrammingChallenge.id].code);
    }
  };

  const switchProgrammingLanguage = (language) => {
    setProgrammingLanguage(language);
    if (activeProgrammingChallenge) {
      setUserCode(activeProgrammingChallenge.starterCode[language] || "");
      setCodeOutput("");
      setCodeErrors("");
      setTestResults([]);
    }
  };

  const selectChallenge = (challenge) => {
    setActiveProgrammingChallenge(challenge);
    setUserCode(challenge.starterCode[programmingLanguage] || "");
    setCodeOutput("");
    setCodeErrors("");
    setTestResults([]);
    setChallengeScore(0);
    setShowHints(false);
  };

  const toggleSolution = (challengeId) => {
    setShowSolution((prev) => ({
      ...prev,
      [challengeId]: !prev[challengeId],
    }));
  };

  const handleMarkComplete = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000 / 60);
    onProgress(module.id, true, timeSpent);
  };

  // Edit mode functions
  const enterEditMode = () => {
    setIsEditMode(true);
    setEditedContent(module.content || "");
    setEditedObjectives(module.objectives || []);
    setEditedSummary(module.summary || "");
  };

  const cancelEdit = () => {
    setIsEditMode(false);
    setEditedContent(module.content || "");
    setEditedObjectives(module.objectives || []);
    setEditedSummary(module.summary || "");
  };

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      const updatedModule = {
        ...module,
        content: editedContent,
        objectives: editedObjectives,
        summary: editedSummary,
      };

      // Call the update function passed as prop
      await onModuleUpdate(updatedModule);

      setIsEditMode(false);
      // Show success notification
      console.log("Module updated successfully");
    } catch (error) {
      console.error("Failed to save module changes:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const addObjective = () => {
    setEditedObjectives([...editedObjectives, ""]);
  };

  const updateObjective = (index, value) => {
    const newObjectives = [...editedObjectives];
    newObjectives[index] = value;
    setEditedObjectives(newObjectives);
  };

  const removeObjective = (index) => {
    const newObjectives = editedObjectives.filter((_, i) => i !== index);
    setEditedObjectives(newObjectives);
  };

  const toggleSubsection = (subsectionId) => {
    console.log("🔧 Toggling subsection:", subsectionId);
    console.log("📊 Current expandedSubsections:", expandedSubsections);

    setExpandedSubsections((prev) => {
      // Create new state with only the clicked subsection toggled
      const newState = {
        ...prev,
        [subsectionId]: !prev[subsectionId],
      };

      console.log("✅ New expandedSubsections state:", newState);
      console.log(
        `📍 Subsection ${subsectionId} is now:`,
        newState[subsectionId] ? "EXPANDED" : "COLLAPSED"
      );

      return newState;
    });
  };

  const { legacyResources, aiResources: memoizedAiResources } = useMemo(() => {
    let legacy = [];

    if (Array.isArray(module.resources)) {
      // Legacy array format - contains manual resources added by educators
      legacy = module.resources.filter(
        (resource) =>
          resource && (resource.title || resource.name || resource.url)
      );
    } else if (module.resources && typeof module.resources === "object") {
      // Check for manual resources in new object format (preferred structure from ModuleEditor)
      if (module.resources.manual && Array.isArray(module.resources.manual)) {
        // These are definitely educator-added manual resources from the course editor
        legacy = module.resources.manual.filter(
          (resource) =>
            resource &&
            (resource.title || resource.name || resource.url) &&
            // Ensure it has an ID (added by the educator through the interface)
            resource.id
        );
      }
    }

    // Process AI resources (generated content)
    const ai =
      module.resources &&
      typeof module.resources === "object" &&
      !Array.isArray(module.resources)
        ? {
            books: Array.isArray(module.resources.books)
              ? module.resources.books.filter((r) => r && (r.title || r.name))
              : [],
            courses: Array.isArray(module.resources.courses)
              ? module.resources.courses.filter((r) => r && (r.title || r.name))
              : [],
            articles: Array.isArray(module.resources.articles)
              ? module.resources.articles.filter(
                  (r) => r && (r.title || r.name)
                )
              : [],
            videos: Array.isArray(module.resources.videos)
              ? module.resources.videos.filter((r) => r && (r.title || r.name))
              : [],
            tools: Array.isArray(module.resources.tools)
              ? module.resources.tools.filter((r) => r && (r.title || r.name))
              : [],
            websites: Array.isArray(module.resources.websites)
              ? module.resources.websites.filter(
                  (r) => r && (r.title || r.name)
                )
              : [],
            exercises: Array.isArray(module.resources.exercises)
              ? module.resources.exercises.filter(
                  (r) => r && (r.title || r.name)
                )
              : [],
          }
        : {
            books: [],
            courses: [],
            articles: [],
            videos: [],
            tools: [],
            websites: [],
            exercises: [],
          };

    return { legacyResources: legacy, aiResources: ai };
  }, [module.resources]);

  useEffect(() => {
    setAiResources(memoizedAiResources);
  }, [memoizedAiResources]);

  // Organize resources by type for the comprehensive resources section
  const instructorMasterpieces = useMemo(() => {
    // Process manually added resources (educator interface)
    const educatorAddedResources = legacyResources.filter((resource) => {
      const hasId =
        resource.id && resource.id !== null && resource.id !== undefined;
      const hasRequiredFields =
        (resource.title || resource.name) && resource.url;
      return hasId && hasRequiredFields;
    });

    // ONLY include educator-added resources - NO AI-generated resources
    // This ensures the section is hidden when there are no actual instructor resources
    const allResources = [...educatorAddedResources];

    // AI resources are NOT included in instructor masterpieces
    // Only manually added educator resources should appear in this section
    // This ensures the section is hidden when there are no actual instructor resources

    // Remove AI resources section - instructor masterpieces should only show manually added resources
    // This ensures the section is hidden when there are no actual instructor resources

    const masterpieces = {
      articles: allResources.filter(
        (r) =>
          r.type === "article" ||
          r.type === "articles" ||
          (!r.type && (r.title || r.name)) ||
          r.type === "text" ||
          r.type === "reading" ||
          r.type === "paper"
      ),
      videos: allResources.filter(
        (r) =>
          r.type === "video" ||
          r.type === "videos" ||
          r.type === "youtube" ||
          r.type === "vimeo" ||
          r.type === "media"
      ),
      books: allResources.filter(
        (r) =>
          r.type === "book" ||
          r.type === "books" ||
          r.type === "ebook" ||
          r.type === "textbook" ||
          r.type === "publication"
      ),
      tools: allResources.filter(
        (r) =>
          r.type === "tool" ||
          r.type === "tools" ||
          r.type === "software" ||
          r.type === "app" ||
          r.type === "application"
      ),
      websites: allResources.filter(
        (r) =>
          r.type === "website" ||
          r.type === "websites" ||
          r.type === "web" ||
          r.type === "link" ||
          r.type === "url" ||
          r.type === "site"
      ),
      exercises: allResources.filter(
        (r) =>
          r.type === "exercise" ||
          r.type === "exercises" ||
          r.type === "practice" ||
          r.type === "assignment" ||
          r.type === "quiz"
      ),
      courses: allResources.filter(
        (r) =>
          r.type === "course" ||
          r.type === "courses" ||
          r.type === "tutorial" ||
          r.type === "learning" ||
          r.type === "mooc"
      ),
    };

    // Ensure no resource is categorized multiple times by removing duplicates
    const allCategorized = new Set();
    Object.keys(masterpieces).forEach((category) => {
      masterpieces[category] = masterpieces[category].filter((resource) => {
        const resourceKey =
          resource.id || resource.url || resource.title || resource.name;
        if (allCategorized.has(resourceKey)) {
          return false;
        }
        allCategorized.add(resourceKey);
        return true;
      });
    });

    return masterpieces;
  }, [legacyResources, aiResources]);

  // Check if there are any manually added educator resources (not AI-generated)
  const hasManualInstructorResources = useMemo(() => {
    const manualResources = legacyResources.filter((resource) => {
      const hasId =
        resource.id && resource.id !== null && resource.id !== undefined;
      const hasRequiredFields =
        (resource.title || resource.name) && resource.url;
      return hasId && hasRequiredFields;
    });
    return manualResources.length > 0;
  }, [legacyResources]);

  // Enhanced Resource Card Component with Educator Masterpiece Design
  const ResourceCard = ({
    resource,
    type,
    isInstructorChoice = false,
    resourceIndex = 0,
  }) => {
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

    return (
      <motion.div
        variants={cardVariants}
        whileHover="hover"
        className="group h-full"
      >
        <Card
          className={`h-full bg-gradient-to-br ${design.gradient} backdrop-blur-sm border ${design.border} transition-all duration-300 hover:shadow-xl hover:scale-[1.02] overflow-hidden relative`}
        >
          {/* Subtle background animation for instructor choice */}
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
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
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
                  </div>

                  {/* Edit button for AI-generated resources */}
                  {resource.isAIGenerated && (
                    <motion.button
                      onClick={() =>
                        startEditingResource(resource, type, resourceIndex)
                      }
                      className="opacity-0 group-hover:opacity-100 transition-all duration-300 p-2 rounded-full bg-white/80 hover:bg-white shadow-lg hover:shadow-xl"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Edit Resource"
                    >
                      <Settings className="h-4 w-4 text-slate-600 hover:text-blue-600 transition-colors duration-200" />
                    </motion.button>
                  )}
                </div>

                {/* Special badges for different resource types */}
                {resource.isAIGenerated ? (
                  <motion.div
                    className="mt-2"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 shadow-md">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Curated
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
                        <Crown className="h-3 w-3 mr-1" />
                        Instructor's Choice
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
                <MathMarkdownRenderer content={resource.description} />
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

          {/* Floating accent elements */}
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

  // Function to start editing a resource
  const startEditingResource = (resource, type, index) => {
    setEditingResource({ resource, type, index });
    setEditedResourceData({
      title: resource.title || resource.name || "",
      url: resource.url || resource.link || "",
      description: resource.description || "",
      difficulty: resource.difficulty || "Beginner",
      author: resource.author || resource.creator || "",
      duration: resource.duration || "",
      platform: resource.platform || resource.source || "",
      ...resource,
    });
  };

  // Function to save edited resource
  const saveEditedResource = async () => {
    if (!editingResource) return;

    setIsUpdatingResource(true);
    try {
      // Update the resource in the local state
      const { type, index } = editingResource;
      const updatedResources = { ...aiResources };

      if (updatedResources[type] && updatedResources[type][index]) {
        updatedResources[type][index] = {
          ...updatedResources[type][index],
          ...editedResourceData,
        };

        // Update the aiResources state
        setAiResources(updatedResources);

        // Close the edit modal
        setEditingResource(null);
        setEditedResourceData({});

        // Show success message
        console.log("Resource updated successfully!");
      }
    } catch (error) {
      console.error("Error updating resource:", error);
    } finally {
      setIsUpdatingResource(false);
    }
  };

  // Function to cancel editing
  const cancelEditingResource = () => {
    setEditingResource(null);
    setEditedResourceData({});
  };

  // Since ModuleContent is only accessible through CourseViewer after enrollment verification,
  // we can safely assume the user is enrolled. No need for additional verification.
  useEffect(() => {
    setEnrollmentVerified(true);
    setVerifyingEnrollment(false);
  }, []);

  // Show loading while verifying enrollment
  if (verifyingEnrollment) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600">Verifying course access...</p>
        </div>
      </div>
    );
  }

  // Block access if not enrolled
  if (!enrollmentVerified) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-6 max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <X className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Access Denied
            </h3>
            <p className="text-slate-600">
              You must be enrolled in this course to access module content.
              Please enroll first to continue learning.
            </p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 relative overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-cyan-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Enhanced Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-50 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 origin-left shadow-2xl"
        style={{ scaleX: animatedProgress / 100 }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: animatedProgress / 100 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="absolute right-0 top-0 h-full w-12 bg-gradient-to-r from-transparent via-white/30 to-white/60 blur-sm"
          animate={{ x: [0, 20, 0] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        />
        <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
      </motion.div>

      {/* Enhanced Floating Quick Actions */}
      <motion.div
        className="fixed bottom-8 right-8 z-40 flex flex-col gap-4"
        initial={{ opacity: 0, scale: 0, y: 100 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1, type: "spring", stiffness: 300 }}
      >
        {/* Quiz Challenge Button */}
        {checkPremiumFeature(user, "quizGeneration") ? (
          <PremiumFeatureButton
            feature="quizGeneration"
            className="group relative w-16 h-16 bg-gradient-to-br from-amber-500 via-orange-600 to-red-700 rounded-2xl shadow-2xl hover:shadow-amber-500/25 flex items-center justify-center text-white transition-all duration-500 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Crown className="h-7 w-7 relative z-10 group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>

            {/* Tooltip */}
            <div className="absolute right-full mr-4 top-1/2 transform -translate-y-1/2 bg-black/80 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap backdrop-blur-sm">
              Quiz Challenge
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-black/80"></div>
            </div>
          </PremiumFeatureButton>
        ) : (
          <PremiumFeatureButton
            feature="quizGeneration"
            className="group relative w-16 h-16 bg-gradient-to-br from-amber-500 via-orange-600 to-red-700 rounded-2xl shadow-2xl hover:shadow-amber-500/25 flex items-center justify-center text-white transition-all duration-500 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Brain className="h-8 w-8 relative z-10" />
          </PremiumFeatureButton>
        )}

        {/* Edit Button */}
        <motion.button
          onClick={isEditMode ? cancelEdit : enterEditMode}
          className={`group relative w-14 h-14 ${
            isEditMode
              ? "bg-gradient-to-br from-orange-500 via-red-600 to-pink-700"
              : "bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700"
          } rounded-2xl shadow-2xl hover:shadow-emerald-500/25 flex items-center justify-center text-white transition-all duration-500 overflow-hidden`}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          {isEditMode ? (
            <X className="h-6 w-6 relative z-10" />
          ) : (
            <Edit className="h-6 w-6 relative z-10" />
          )}
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>

          {/* Tooltip */}
          <div className="absolute right-full mr-4 top-1/2 transform -translate-y-1/2 bg-black/80 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap backdrop-blur-sm">
            {isEditMode ? "Cancel Edit" : "Edit Module"}
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-black/80"></div>
          </div>
        </motion.button>

        {/* Enhanced Bookmark Button */}
        <motion.button
          onClick={() => setIsBookmarked(!isBookmarked)}
          className={`group relative w-14 h-14 ${
            isBookmarked
              ? "bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-600 shadow-amber-500/25"
              : "bg-gradient-to-br from-slate-400 via-gray-500 to-slate-600 shadow-slate-500/25"
          } rounded-xl shadow-xl hover:shadow-2xl flex items-center justify-center text-white transition-all duration-500 overflow-hidden`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          variants={isBookmarked ? sparkleVariants : {}}
          animate={isBookmarked ? "sparkle" : ""}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <Bookmark
            className={`h-6 w-6 relative z-10 ${
              isBookmarked ? "fill-current" : ""
            } group-hover:scale-110 transition-transform duration-300`}
          />
          {isBookmarked && (
            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          )}

          {/* Tooltip */}
          <div className="absolute right-full mr-4 top-1/2 transform -translate-y-1/2 bg-black/80 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap backdrop-blur-sm">
            {isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-black/80"></div>
          </div>
        </motion.button>

        {/* Progress Circle with Enhanced Design */}
        <motion.div
          className="group relative w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-xl shadow-xl hover:shadow-2xl flex items-center justify-center text-white text-xs font-bold overflow-hidden transition-all duration-500"
          whileHover={{ scale: 1.1 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-white/20 rounded-xl"
            style={{
              clipPath: `polygon(0 ${100 - animatedProgress}%, 100% ${
                100 - animatedProgress
              }%, 100% 100%, 0% 100%)`,
            }}
            initial={{
              clipPath: "polygon(0 100%, 100% 100%, 100% 100%, 0% 100%)",
            }}
            animate={{
              clipPath: `polygon(0 ${100 - animatedProgress}%, 100% ${
                100 - animatedProgress
              }%, 100% 100%, 0% 100%)`,
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          <span className="relative z-10 font-extrabold">
            {Math.round(animatedProgress)}%
          </span>
          <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>

          {/* Tooltip */}
          <div className="absolute right-full mr-4 top-1/2 transform -translate-y-1/2 bg-black/80 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap backdrop-blur-sm">
            Reading Progress
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-black/80"></div>
          </div>
        </motion.div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="sticky top-16 z-30 bg-gradient-to-r from-white/95 via-slate-50/95 to-white/95 backdrop-blur-sm border-b border-slate-200/50 mb-8 -mx-4 px-4 py-4">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 h-auto p-2 bg-gradient-to-r from-white/80 to-slate-50/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg">
              <TabsTrigger
                value="overview"
                className="group relative flex items-center gap-3 px-6 py-4 text-slate-700 hover:text-slate-900 font-medium transition-all duration-300 rounded-xl hover:bg-white/70 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full group-data-[state=active]:bg-white transition-colors duration-300"></div>
                <span className="text-sm lg:text-base">Overview</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-600/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </TabsTrigger>

              <TabsTrigger
                value="resources"
                className="group relative flex items-center gap-3 px-6 py-4 text-slate-700 hover:text-slate-900 font-medium transition-all duration-300 rounded-xl hover:bg-white/70 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <div className="w-2 h-2 bg-purple-500 rounded-full group-data-[state=active]:bg-white transition-colors duration-300"></div>
                <span className="text-sm lg:text-base">Resources</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-600/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-8">
            {/* Masterpiece Hero Section - Educator Dashboard Style */}
            <motion.div key="hero-section" variants={itemVariants}>
              <div className="relative">
                {/* Enhanced background blur effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-3xl blur-3xl"></div>

                <Card className="relative border-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white shadow-2xl overflow-hidden">
                  {/* Animated background elements */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5"></div>

                    <motion.div
                      className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full blur-3xl"
                      animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                      transition={{
                        duration: 20,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      }}
                    />
                    <motion.div
                      className="absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
                      animate={{ rotate: -360, scale: [1.2, 1, 1.2] }}
                      transition={{
                        duration: 25,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      }}
                    />
                    <motion.div
                      className="absolute top-1/2 left-1/2 w-32 h-32 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-2xl"
                      animate={{
                        x: [-50, 50, -50],
                        y: [-25, 25, -25],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 15,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                    />
                  </div>

                  <CardHeader className="relative z-10 p-12">
                    {/* Decorative grid pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22%23ffffff%22 fillOpacity=%220.1%22%3E%3Cpath d=%22M0 0h40v40H0z%22/%3E%3Cpath d=%22M0 0h20v20H0zM20 20h20v20H20z%22/%3E%3C/g%3E%3C/svg%3E')]"></div>
                    </div>

                    <div className="relative flex justify-between items-start">
                      <div className="flex-1">
                        <motion.div
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3, duration: 0.8 }}
                        >
                          <motion.h1
                            className="text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent leading-tight"
                            style={{ backgroundSize: "200% 200%" }}
                            variants={gradientTextVariants}
                            animate="animate"
                          >
                            {module.title}
                          </motion.h1>
                          {(module.summary || isEditMode) && (
                            <CardDescription className="text-blue-100 text-xl leading-relaxed max-w-4xl">
                              {isEditMode ? (
                                <Textarea
                                  value={editedSummary}
                                  onChange={(e) =>
                                    setEditedSummary(e.target.value)
                                  }
                                  placeholder="Enter module summary..."
                                  className="bg-white/10 border-white/20 text-blue-100 placeholder-blue-200/70 resize-none min-h-[100px]"
                                  rows={3}
                                />
                              ) : (
                                <MathMarkdownRenderer
                                  content={module.summary}
                                />
                              )}
                            </CardDescription>
                          )}
                        </motion.div>

                        {/* Enhanced Summary Elements with Micro-interactions */}
                        {module.beautifulSummaryElements && (
                          <motion.div
                            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, staggerChildren: 0.1 }}
                          >
                            {module.beautifulSummaryElements
                              .difficultyLevel && (
                              <motion.div
                                className="group flex items-center gap-4 bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/30 hover:bg-white/30 transition-all duration-300"
                                whileHover={{ scale: 1.05, y: -5 }}
                                variants={floatingVariants}
                                animate="floating"
                              >
                                <motion.div
                                  className="w-4 h-4 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-full shadow-lg"
                                  variants={pulseVariants}
                                  animate="pulse"
                                />
                                <div>
                                  <span className="text-sm font-medium block">
                                    Difficulty
                                  </span>
                                  <span className="text-lg font-bold">
                                    {
                                      module.beautifulSummaryElements
                                        .difficultyLevel
                                    }
                                  </span>
                                </div>
                              </motion.div>
                            )}
                            {module.beautifulSummaryElements
                              .estimatedStudyTime && (
                              <motion.div
                                className="group flex items-center gap-4 bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/30 hover:bg-white/30 transition-all duration-300"
                                whileHover={{ scale: 1.05, y: -5 }}
                                variants={floatingVariants}
                                animate="floating"
                              >
                                <Clock className="h-6 w-6 text-blue-200" />
                                <div>
                                  <span className="text-sm font-medium block">
                                    Study Time
                                  </span>
                                  <span className="text-lg font-bold">
                                    {
                                      module.beautifulSummaryElements
                                        .estimatedStudyTime
                                    }
                                  </span>
                                </div>
                              </motion.div>
                            )}
                            <motion.div
                              className="group flex items-center gap-4 bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/30 hover:bg-white/30 transition-all duration-300"
                              whileHover={{ scale: 1.05, y: -5 }}
                              variants={floatingVariants}
                              animate="floating"
                            >
                              <motion.div
                                variants={sparkleVariants}
                                animate="sparkle"
                              >
                                <Sparkles className="h-6 w-6 text-purple-200" />
                              </motion.div>
                              <div>
                                <span className="text-sm font-medium block">
                                  Content Type
                                </span>
                                <span className="text-lg font-bold">
                                  Interactive
                                </span>
                              </div>
                            </motion.div>
                          </motion.div>
                        )}
                      </div>

                      <motion.div
                        className="flex items-center gap-4 ml-8"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                      >
                        {moduleProgress.completed && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              delay: 0.8,
                              type: "spring",
                              stiffness: 200,
                            }}
                          >
                            <EnhancedBadge className="flex items-center gap-3 bg-green-500/90 hover:bg-green-600/90 text-white border-green-400/50 px-6 py-3 text-lg">
                              <motion.div
                                variants={sparkleVariants}
                                animate="sparkle"
                              >
                                <CheckCircle className="h-5 w-5" />
                              </motion.div>
                              Completed
                            </EnhancedBadge>
                          </motion.div>
                        )}
                        <EnhancedBadge className="flex items-center gap-3 bg-white/20 text-white border-white/30 px-6 py-3 backdrop-blur-sm text-lg">
                          <Clock className="h-5 w-5" />
                          {Math.floor(moduleProgress.timeSpent / 60)}min
                        </EnhancedBadge>
                      </motion.div>
                    </div>
                  </CardHeader>
                </Card>
              </div>
            </motion.div>

            {/* Enhanced Learning Objectives - Educator Masterpiece Style */}
            {((module.objectives && module.objectives.length > 0) ||
              isEditMode) && (
              <motion.div
                key={`learning-objectives-${module.id}`}
                variants={itemVariants}
              >
                <div className="relative">
                  {/* Enhanced background blur effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 rounded-3xl blur-3xl"></div>

                  <Card className="relative border-0 bg-gradient-to-br from-blue-50/90 via-indigo-50/90 to-purple-50/90 shadow-2xl overflow-hidden backdrop-blur-sm">
                    {/* Animated background elements */}
                    <div className="absolute inset-0 overflow-hidden">
                      <motion.div
                        className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-2xl"
                        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                        transition={{
                          duration: 15,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "linear",
                        }}
                      />
                      <motion.div
                        className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-2xl"
                        animate={{ rotate: -360, scale: [1.1, 1, 1.1] }}
                        transition={{
                          duration: 20,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "linear",
                        }}
                      />
                    </div>

                    <CardHeader className="relative z-10 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border-b border-blue-200/50 p-8">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <motion.div
                            className="w-16 h-16 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 10,
                            }}
                          >
                            <Target className="h-8 w-8 text-white" />
                          </motion.div>

                          <div>
                            <CardTitle className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent mb-2">
                              Learning Objectives
                            </CardTitle>
                            <CardDescription className="text-blue-700 text-lg font-medium">
                              Your roadmap to mastering this module
                            </CardDescription>
                          </div>
                        </div>

                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.3, type: "spring" }}
                        >
                          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-lg px-4 py-2 text-sm font-bold">
                            <Award className="h-4 w-4 mr-2" />
                            {isEditMode
                              ? editedObjectives.length
                              : module.objectives.length}{" "}
                            Goals
                          </Badge>
                        </motion.div>
                      </div>
                    </CardHeader>

                    <CardContent className="relative z-10 p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(isEditMode
                          ? editedObjectives
                          : module.objectives
                        ).map((objective, index) => (
                          <motion.div
                            key={`objective-${index}-${objective.substring(
                              0,
                              30
                            )}`}
                            className="group relative"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index }}
                            whileHover={{ scale: 1.02 }}
                          >
                            <Card className="h-full bg-gradient-to-br from-white/80 to-blue-50/50 backdrop-blur-sm border border-blue-200/50 transition-all duration-300 hover:shadow-xl hover:border-blue-300/70 overflow-hidden">
                              {/* Subtle background animation */}
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                              <CardContent className="relative z-10 p-6">
                                <div className="flex items-start gap-4">
                                  <motion.div
                                    className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0 shadow-lg group-hover:shadow-xl transition-all duration-300"
                                    whileHover={{ scale: 1.1, rotate: 360 }}
                                    transition={{ duration: 0.5 }}
                                  >
                                    {index + 1}
                                  </motion.div>

                                  <div className="flex-1">
                                    {isEditMode ? (
                                      <div className="space-y-2">
                                        <Textarea
                                          value={objective}
                                          onChange={(e) =>
                                            updateObjective(
                                              index,
                                              e.target.value
                                            )
                                          }
                                          placeholder={`Enter objective ${
                                            index + 1
                                          }...`}
                                          className="w-full resize-none min-h-[80px]"
                                          rows={3}
                                        />
                                        <div className="flex gap-2">
                                          <Button
                                            onClick={() =>
                                              removeObjective(index)
                                            }
                                            size="sm"
                                            variant="outline"
                                            className="text-red-600 border-red-300 hover:bg-red-50"
                                          >
                                            <X className="h-4 w-4 mr-1" />
                                            Remove
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <MathMarkdownRenderer
                                        content={objective}
                                      />
                                    )}
                                    <motion.div
                                      className="mt-4 h-2 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 rounded-full origin-left shadow-lg"
                                      initial={{ scaleX: 0 }}
                                      animate={{ scaleX: 1 }}
                                      transition={{
                                        delay: 0.3 + 0.1 * index,
                                        duration: 0.8,
                                        ease: "easeOut",
                                      }}
                                    />
                                  </div>
                                </div>
                              </CardContent>

                              {/* Floating accent elements */}
                              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </Card>
                          </motion.div>
                        ))}
                      </div>

                      {/* Edit Mode Controls */}
                      {isEditMode && (
                        <div className="relative z-10 p-8 pt-0 space-y-4">
                          <Button
                            onClick={addObjective}
                            variant="outline"
                            className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Objective
                          </Button>

                          <div className="flex gap-4">
                            <Button
                              onClick={saveChanges}
                              disabled={isSaving}
                              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                            >
                              {isSaving ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save Changes
                                </>
                              )}
                            </Button>

                            <Button
                              onClick={cancelEdit}
                              variant="outline"
                              className="border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* Enhanced Module Content with Integrated Explanations */}
            {module.content && (
              <motion.div
                key={`module-content-${module.id}`}
                variants={itemVariants}
              >
                <GlassCard className="bg-gradient-to-br from-gray-50/80 to-blue-50/80 border-gray-200/50">
                  <CardContent className="p-8">
                    <motion.h3
                      className="font-bold text-2xl mb-6 flex items-center gap-3 text-gray-800"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <motion.div
                        className="p-3 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl shadow-lg"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <FileText className="h-6 w-6 text-white" />
                      </motion.div>
                      Module Content
                      <EnhancedBadge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-1 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        AI-Enhanced
                      </EnhancedBadge>
                    </motion.h3>

                    {contentPages.length > 1 && currentPageData ? (
                      <div className="space-y-6">
                        {/* Progress indicator */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">
                              Reading Progress
                            </span>
                            <span className="text-sm font-medium text-blue-600">
                              {Math.round(
                                ((currentPage + 1) / contentPages.length) * 100
                              )}
                              %
                            </span>
                          </div>
                          <Progress
                            value={
                              ((currentPage + 1) / contentPages.length) * 100
                            }
                            className="h-2"
                          />
                        </div>

                        <motion.div
                          key={currentPage}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <h4 className="font-bold text-3xl text-gray-800">
                              {currentPageData.title}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              Section {currentPage + 1}
                            </Badge>
                          </div>
                          <div className="prose prose-lg max-w-none">
                            <ContentDisplay
                              content={currentPageData.content}
                              renderingMode="math-optimized"
                              className="module-page-content"
                            />
                          </div>
                        </motion.div>

                        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                          <Button
                            onClick={() =>
                              setCurrentPage((p) => Math.max(0, p - 1))
                            }
                            disabled={currentPage === 0}
                            variant="outline"
                            className="flex items-center gap-2 hover:scale-105 transition-transform"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>

                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {contentPages.map((page, index) => (
                                <motion.button
                                  key={index}
                                  onClick={() => setCurrentPage(index)}
                                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                                    index === currentPage
                                      ? "bg-blue-600 scale-125"
                                      : "bg-gray-300 hover:bg-gray-400"
                                  }`}
                                  whileHover={{ scale: 1.2 }}
                                  whileTap={{ scale: 0.9 }}
                                  title={page.title}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                              {currentPage + 1} of {contentPages.length}
                            </span>
                          </div>

                          <Button
                            onClick={() =>
                              setCurrentPage((p) =>
                                Math.min(contentPages.length - 1, p + 1)
                              )
                            }
                            disabled={currentPage === contentPages.length - 1}
                            className="flex items-center gap-2 hover:scale-105 transition-transform"
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="prose prose-lg max-w-none">
                        <ContentDisplay
                          content={module.content}
                          renderingMode="math-optimized"
                          className="module-full-content"
                        />
                      </div>
                    )}

                    {/* Detailed Explanations & Simulators Section */}
                    <div className="border-t border-gray-200 pt-8 mt-8">
                      <motion.h4
                        className="font-bold text-xl mb-6 flex items-center gap-3 text-cyan-800"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <motion.div
                          className="p-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg shadow-lg"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          <Layers className="h-5 w-5 text-white" />
                        </motion.div>
                        Detailed Explanations & Interactive Elements
                      </motion.h4>

                      <AnimatePresence mode="wait">
                        {loadingSubsections ? (
                          <EnhancedLoader
                            key="loading-subsections"
                            text="Generating beautiful explanations..."
                          />
                        ) : contentSubsections.length > 0 ? (
                          <motion.div
                            key="content-subsections"
                            className="space-y-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            {contentSubsections.map((subsection, index) => (
                              <motion.div
                                key={subsection.id}
                                className="group"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * index }}
                              >
                                {console.log(
                                  `🔍 Rendering subsection ${subsection.id}, expanded:`,
                                  expandedSubsections[subsection.id]
                                )}
                                <GlassCard className="bg-white/70 border-cyan-200/50 overflow-hidden">
                                  <motion.div
                                    className="p-6 cursor-pointer hover:bg-cyan-50/50 transition-colors"
                                    onClick={() =>
                                      toggleSubsection(subsection.id)
                                    }
                                    whileHover={{
                                      backgroundColor:
                                        "rgba(6, 182, 212, 0.05)",
                                    }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-4 flex-1">
                                        <motion.div
                                          className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg group-hover:shadow-xl transition-all duration-300"
                                          whileHover={{
                                            scale: 1.1,
                                            rotate: 360,
                                          }}
                                          transition={{ duration: 0.3 }}
                                        >
                                          {index + 1}
                                        </motion.div>
                                        <div className="flex-1">
                                          <h4 className="font-semibold text-cyan-900 text-lg group-hover:text-cyan-800 transition-colors">
                                            {subsection.title}
                                          </h4>
                                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                                            {subsection.complexity && (
                                              <EnhancedBadge
                                                variant="outline"
                                                className={`text-xs ${
                                                  subsection.complexity ===
                                                  "beginner"
                                                    ? "border-green-300 text-green-700 bg-green-50"
                                                    : subsection.complexity ===
                                                      "intermediate"
                                                    ? "border-yellow-300 text-yellow-700 bg-yellow-50"
                                                    : "border-red-300 text-red-700 bg-red-50"
                                                }`}
                                              >
                                                {subsection.complexity}
                                              </EnhancedBadge>
                                            )}
                                            {subsection.estimatedTime && (
                                              <EnhancedBadge
                                                variant="outline"
                                                className="text-xs border-cyan-300 text-cyan-700 bg-cyan-50"
                                              >
                                                <Clock className="h-3 w-3 mr-1" />
                                                {subsection.estimatedTime}
                                              </EnhancedBadge>
                                            )}
                                            {subsection.needsCodeSimulation && (
                                              <EnhancedBadge
                                                variant="outline"
                                                className="text-xs border-green-300 text-green-700 bg-green-50"
                                              >
                                                <Code className="h-3 w-3 mr-1" />
                                                Interactive
                                              </EnhancedBadge>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <motion.div
                                        className="ml-4"
                                        animate={{
                                          rotate: expandedSubsections[
                                            subsection.id
                                          ]
                                            ? 90
                                            : 0,
                                        }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <ChevronRight className="h-5 w-5 text-cyan-600" />
                                      </motion.div>
                                    </div>
                                  </motion.div>

                                  <AnimatePresence>
                                    {expandedSubsections[subsection.id] && (
                                      <motion.div
                                        key={`expanded-${subsection.id}`}
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{
                                          duration: 0.3,
                                          ease: "easeInOut",
                                        }}
                                        className="overflow-hidden"
                                      >
                                        <div className="px-6 pb-6 border-t border-cyan-100 bg-gradient-to-r from-cyan-25 to-blue-25">
                                          <div className="pt-6 space-y-4">
                                            {/* Key Terms */}
                                            {subsection.keyTerms &&
                                              subsection.keyTerms.length >
                                                0 && (
                                                <div>
                                                  <h5 className="font-medium text-cyan-800 text-sm mb-3 flex items-center gap-2">
                                                    <Atom className="h-4 w-4" />
                                                    Key Terms
                                                  </h5>
                                                  <div className="flex flex-wrap gap-2">
                                                    {subsection.keyTerms.map(
                                                      (term, termIndex) => (
                                                        <motion.div
                                                          key={`term-${termIndex}-${term}`}
                                                          initial={{
                                                            opacity: 0,
                                                            scale: 0.8,
                                                          }}
                                                          animate={{
                                                            opacity: 1,
                                                            scale: 1,
                                                          }}
                                                          transition={{
                                                            delay:
                                                              0.1 * termIndex,
                                                          }}
                                                        >
                                                          <EnhancedBadge className="bg-cyan-100 text-cyan-800 hover:bg-cyan-200 border-cyan-200">
                                                            {term}
                                                          </EnhancedBadge>
                                                        </motion.div>
                                                      )
                                                    )}
                                                  </div>
                                                </div>
                                              )}

                                            {/* Explanation */}
                                            <motion.div
                                              className="p-6 bg-white/80 backdrop-blur-sm rounded-xl border border-cyan-100/50 shadow-sm"
                                              initial={{ opacity: 0, y: 10 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              transition={{ delay: 0.2 }}
                                            >
                                              <h5 className="font-medium text-cyan-800 text-sm mb-3 flex items-center gap-2">
                                                <Lightbulb className="h-4 w-4" />
                                                Explanation
                                              </h5>
                                              {/* Multi-page explanation system */}
                                              {(() => {
                                                // Check if AI generated explanationPages exist
                                                if (
                                                  subsection.explanationPages &&
                                                  Array.isArray(
                                                    subsection.explanationPages
                                                  ) &&
                                                  subsection.explanationPages
                                                    .length > 0
                                                ) {
                                                  const currentPage = Math.min(
                                                    getCurrentExplanationPage(
                                                      subsection.id
                                                    ),
                                                    subsection.explanationPages
                                                      .length - 1
                                                  );
                                                  const totalPages =
                                                    subsection.explanationPages
                                                      .length;
                                                  const currentPageData =
                                                    subsection.explanationPages[
                                                      currentPage
                                                    ];

                                                  // Safety check: ensure currentPageData exists and has content
                                                  if (
                                                    !currentPageData ||
                                                    !currentPageData.content
                                                  ) {
                                                    // Fallback to regular explanation if page data is malformed
                                                    return subsection.explanation ? (
                                                      <motion.div
                                                        className="prose prose-lg max-w-none"
                                                        initial={{
                                                          opacity: 0,
                                                          y: 15,
                                                        }}
                                                        animate={{
                                                          opacity: 1,
                                                          y: 0,
                                                        }}
                                                        transition={{
                                                          duration: 0.5,
                                                        }}
                                                      >
                                                        <div className="bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/50 rounded-2xl p-8 border border-cyan-100/50 shadow-lg backdrop-blur-sm">
                                                          <div
                                                            className="text-slate-700 leading-8 text-lg font-medium tracking-wide"
                                                            style={{
                                                              lineHeight: "1.8",
                                                              fontFamily:
                                                                '"Inter", "system-ui", sans-serif',
                                                              letterSpacing:
                                                                "0.01em",
                                                            }}
                                                          >
                                                            <MathMarkdownRenderer
                                                              content={
                                                                subsection.explanation
                                                              }
                                                            />
                                                          </div>
                                                        </div>
                                                      </motion.div>
                                                    ) : (
                                                      <div className="text-center py-8">
                                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                          <FileText className="h-8 w-8 text-gray-400" />
                                                        </div>
                                                        <p className="text-gray-500 italic text-lg">
                                                          No explanation
                                                          available for this
                                                          section.
                                                        </p>
                                                      </div>
                                                    );
                                                  }

                                                  return (
                                                    <div className="space-y-6">
                                                      {/* Enhanced Page Content */}
                                                      <div className="space-y-5">
                                                        {currentPageData.pageTitle && (
                                                          <motion.div
                                                            initial={{
                                                              opacity: 0,
                                                              y: 10,
                                                            }}
                                                            animate={{
                                                              opacity: 1,
                                                              y: 0,
                                                            }}
                                                            transition={{
                                                              duration: 0.4,
                                                            }}
                                                          >
                                                            <h6 className="font-bold text-2xl bg-gradient-to-r from-cyan-800 via-blue-700 to-indigo-800 bg-clip-text text-transparent mb-3 leading-tight">
                                                              {
                                                                currentPageData.pageTitle
                                                              }
                                                            </h6>
                                                            <div className="w-16 h-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full mb-4"></div>
                                                          </motion.div>
                                                        )}

                                                        <motion.div
                                                          className="prose prose-lg max-w-none"
                                                          initial={{
                                                            opacity: 0,
                                                            y: 15,
                                                          }}
                                                          animate={{
                                                            opacity: 1,
                                                            y: 0,
                                                          }}
                                                          transition={{
                                                            duration: 0.5,
                                                            delay: 0.1,
                                                          }}
                                                        >
                                                          <div className="group/text relative bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 rounded-2xl p-10 border border-blue-200/30 shadow-xl backdrop-blur-sm hover:shadow-2xl hover:bg-gradient-to-br hover:from-white hover:via-blue-50/40 hover:to-indigo-50/50 transition-all duration-700 hover:scale-[1.02] transform-gpu">
                                                            <MathMarkdownRenderer
                                                              content={
                                                                currentPageData.content
                                                              }
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover/text:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                                                            <div className="absolute top-4 right-4 opacity-0 group-hover/text:opacity-100 transition-all duration-500 transform translate-x-2 group-hover/text:translate-x-0">
                                                              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-blue-200 shadow-lg">
                                                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                                                <span className="text-xs font-medium text-blue-700">
                                                                  Enhanced
                                                                  Reading
                                                                </span>
                                                              </div>
                                                            </div>
                                                          </div>
                                                        </motion.div>

                                                        {currentPageData.keyTakeaway && (
                                                          <motion.div
                                                            className="mt-6 p-6 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 rounded-2xl border border-amber-200/50 shadow-lg"
                                                            initial={{
                                                              opacity: 0,
                                                              scale: 0.95,
                                                            }}
                                                            animate={{
                                                              opacity: 1,
                                                              scale: 1,
                                                            }}
                                                            transition={{
                                                              duration: 0.4,
                                                              delay: 0.2,
                                                            }}
                                                          >
                                                            <div className="flex items-center gap-3 mb-4">
                                                              <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-md">
                                                                <Star className="h-5 w-5 text-white" />
                                                              </div>
                                                              <span className="text-lg font-bold bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent">
                                                                💡 Key Takeaway
                                                              </span>
                                                            </div>
                                                            <p className="text-amber-800 text-base leading-7 font-medium italic">
                                                              "
                                                              {
                                                                currentPageData.keyTakeaway
                                                              }
                                                              "
                                                            </p>
                                                          </motion.div>
                                                        )}
                                                      </div>

                                                      {/* Page Navigation */}
                                                      {totalPages > 1 && (
                                                        <div className="flex items-center justify-between pt-4 border-t border-cyan-200">
                                                          <div className="flex items-center gap-2">
                                                            <span className="text-sm text-cyan-600">
                                                              Page{" "}
                                                              {currentPage + 1}{" "}
                                                              of {totalPages}
                                                            </span>
                                                            <Badge
                                                              variant="outline"
                                                              className="text-xs border-cyan-300 text-cyan-700"
                                                            >
                                                              <Sparkles className="h-3 w-3 mr-1" />
                                                              AI-generated pages
                                                            </Badge>
                                                          </div>
                                                          <div className="flex items-center gap-2">
                                                            <Button
                                                              size="sm"
                                                              variant="outline"
                                                              onClick={() =>
                                                                setCurrentExplanationPageForSubsection(
                                                                  subsection.id,
                                                                  Math.max(
                                                                    0,
                                                                    currentPage -
                                                                      1
                                                                  )
                                                                )
                                                              }
                                                              disabled={
                                                                currentPage ===
                                                                0
                                                              }
                                                              className="border-cyan-300 text-cyan-700 hover:bg-cyan-50"
                                                            >
                                                              <ChevronLeft className="h-4 w-4 mr-1" />
                                                              Previous
                                                            </Button>
                                                            <Button
                                                              size="sm"
                                                              variant="outline"
                                                              onClick={() =>
                                                                setCurrentExplanationPageForSubsection(
                                                                  subsection.id,
                                                                  Math.min(
                                                                    totalPages -
                                                                      1,
                                                                    currentPage +
                                                                      1
                                                                  )
                                                                )
                                                              }
                                                              disabled={
                                                                currentPage ===
                                                                totalPages - 1
                                                              }
                                                              className="border-cyan-300 text-cyan-700 hover:bg-cyan-50"
                                                            >
                                                              Next
                                                              <ChevronRight className="h-4 w-4 ml-1" />
                                                            </Button>
                                                          </div>
                                                        </div>
                                                      )}

                                                      {/* Page Numbers */}
                                                      {totalPages > 1 && (
                                                        <div className="flex justify-center gap-1 pt-2">
                                                          {Array.from(
                                                            {
                                                              length: Math.min(
                                                                totalPages,
                                                                5
                                                              ),
                                                            },
                                                            (_, i) => {
                                                              let pageNum;
                                                              if (
                                                                totalPages <= 5
                                                              ) {
                                                                pageNum = i;
                                                              } else if (
                                                                currentPage < 2
                                                              ) {
                                                                pageNum = i;
                                                              } else if (
                                                                currentPage >
                                                                totalPages - 3
                                                              ) {
                                                                pageNum =
                                                                  totalPages -
                                                                  5 +
                                                                  i;
                                                              } else {
                                                                pageNum =
                                                                  currentPage -
                                                                  2 +
                                                                  i;
                                                              }

                                                              return (
                                                                <Button
                                                                  key={`${subsection.id}-ai-page-${pageNum}`}
                                                                  size="sm"
                                                                  variant={
                                                                    currentPage ===
                                                                    pageNum
                                                                      ? "default"
                                                                      : "ghost"
                                                                  }
                                                                  onClick={() =>
                                                                    setCurrentExplanationPageForSubsection(
                                                                      subsection.id,
                                                                      pageNum
                                                                    )
                                                                  }
                                                                  className={`w-8 h-8 p-0 text-xs ${
                                                                    currentPage ===
                                                                    pageNum
                                                                      ? "bg-cyan-600 text-white"
                                                                      : "text-cyan-600 hover:bg-cyan-50"
                                                                  }`}
                                                                >
                                                                  {pageNum + 1}
                                                                </Button>
                                                              );
                                                            }
                                                          )}
                                                          {totalPages > 5 &&
                                                            currentPage <
                                                              totalPages -
                                                                3 && (
                                                              <React.Fragment
                                                                key={`${subsection.id}-ai-ellipsis-fragment`}
                                                              >
                                                                <span
                                                                  key={`${subsection.id}-ai-ellipsis`}
                                                                  className="text-cyan-400 text-xs self-center"
                                                                >
                                                                  ...
                                                                </span>
                                                                <Button
                                                                  key={`${subsection.id}-ai-last-page`}
                                                                  size="sm"
                                                                  variant="ghost"
                                                                  onClick={() =>
                                                                    setCurrentExplanationPageForSubsection(
                                                                      subsection.id,
                                                                      totalPages -
                                                                        1
                                                                    )
                                                                  }
                                                                  className="w-8 h-8 p-0 text-xs text-cyan-600 hover:bg-cyan-50"
                                                                >
                                                                  {totalPages}
                                                                </Button>
                                                              </React.Fragment>
                                                            )}
                                                        </div>
                                                      )}
                                                    </div>
                                                  );
                                                } else if (
                                                  subsection.explanation
                                                ) {
                                                  // Fallback: Split explanation by words for pagination
                                                  const pages =
                                                    splitExplanationIntoPages(
                                                      subsection.explanation
                                                    );
                                                  const currentPage =
                                                    getCurrentExplanationPage(
                                                      subsection.id
                                                    );
                                                  const totalPages =
                                                    pages.length;

                                                  if (totalPages === 1) {
                                                    // Single page, display beautifully
                                                    return (
                                                      <motion.div
                                                        className="prose prose-lg max-w-none"
                                                        initial={{
                                                          opacity: 0,
                                                          y: 15,
                                                        }}
                                                        animate={{
                                                          opacity: 1,
                                                          y: 0,
                                                        }}
                                                        transition={{
                                                          duration: 0.5,
                                                        }}
                                                      >
                                                        <div className="group/text relative bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 rounded-2xl p-10 border border-blue-200/30 shadow-xl backdrop-blur-sm hover:shadow-2xl hover:bg-gradient-to-br hover:from-white hover:via-blue-50/40 hover:to-indigo-50/50 transition-all duration-700 hover:scale-[1.02] transform-gpu">
                                                          <MathMarkdownRenderer
                                                            content={
                                                              subsection.explanation
                                                            }
                                                          />
                                                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover/text:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                                                          <div className="absolute top-4 right-4 opacity-0 group-hover/text:opacity-100 transition-all duration-500 transform translate-x-2 group-hover/text:translate-x-0">
                                                            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-blue-200 shadow-lg">
                                                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                                              <span className="text-xs font-medium text-blue-700">
                                                                Enhanced Reading
                                                              </span>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      </motion.div>
                                                    );
                                                  }

                                                  return (
                                                    <div className="space-y-6">
                                                      {/* Enhanced Page Content */}
                                                      <motion.div
                                                        className="prose prose-lg max-w-none"
                                                        initial={{
                                                          opacity: 0,
                                                          y: 15,
                                                        }}
                                                        animate={{
                                                          opacity: 1,
                                                          y: 0,
                                                        }}
                                                        transition={{
                                                          duration: 0.5,
                                                        }}
                                                        key={`page-${currentPage}`}
                                                      >
                                                        <div className="group/text relative bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 rounded-2xl p-10 border border-blue-200/30 shadow-xl backdrop-blur-sm hover:shadow-2xl hover:bg-gradient-to-br hover:from-white hover:via-blue-50/40 hover:to-indigo-50/50 transition-all duration-700 hover:scale-[1.02] transform-gpu">
                                                          <MathMarkdownRenderer
                                                            content={
                                                              pages[currentPage]
                                                            }
                                                          />
                                                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover/text:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                                                          <div className="absolute top-4 right-4 opacity-0 group-hover/text:opacity-100 transition-all duration-500 transform translate-x-2 group-hover/text:translate-x-0">
                                                            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-blue-200 shadow-lg">
                                                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                                              <span className="text-xs font-medium text-blue-700">
                                                                Enhanced Reading
                                                              </span>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      </motion.div>

                                                      {/* Page Navigation */}
                                                      <div className="flex items-center justify-between pt-4 border-t border-cyan-200">
                                                        <div className="flex items-center gap-2">
                                                          <span className="text-sm text-cyan-600">
                                                            Page{" "}
                                                            {currentPage + 1} of{" "}
                                                            {totalPages}
                                                          </span>
                                                          <Badge
                                                            variant="outline"
                                                            className="text-xs border-cyan-300 text-cyan-700"
                                                          >
                                                            ~
                                                            {
                                                              wordsPerExplanationPage
                                                            }{" "}
                                                            words per page
                                                          </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                          <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                              setCurrentExplanationPageForSubsection(
                                                                subsection.id,
                                                                Math.max(
                                                                  0,
                                                                  currentPage -
                                                                    1
                                                                )
                                                              )
                                                            }
                                                            disabled={
                                                              currentPage === 0
                                                            }
                                                            className="border-cyan-300 text-cyan-700 hover:bg-cyan-50"
                                                          >
                                                            <ChevronLeft className="h-4 w-4 mr-1" />
                                                            Previous
                                                          </Button>
                                                          <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                              setCurrentExplanationPageForSubsection(
                                                                subsection.id,
                                                                Math.min(
                                                                  totalPages -
                                                                    1,
                                                                  currentPage +
                                                                    1
                                                                )
                                                              )
                                                            }
                                                            disabled={
                                                              currentPage ===
                                                              totalPages - 1
                                                            }
                                                            className="border-cyan-300 text-cyan-700 hover:bg-cyan-50"
                                                          >
                                                            Next
                                                            <ChevronRight className="h-4 w-4 ml-1" />
                                                          </Button>
                                                        </div>
                                                      </div>

                                                      {/* Page Numbers */}
                                                      <div className="flex justify-center gap-1 pt-2">
                                                        {Array.from(
                                                          {
                                                            length: Math.min(
                                                              totalPages,
                                                              5
                                                            ),
                                                          },
                                                          (_, i) => {
                                                            let pageNum;
                                                            if (
                                                              totalPages <= 5
                                                            ) {
                                                              pageNum = i;
                                                            } else if (
                                                              currentPage < 2
                                                            ) {
                                                              pageNum = i;
                                                            } else if (
                                                              currentPage >
                                                              totalPages - 3
                                                            ) {
                                                              pageNum =
                                                                totalPages -
                                                                5 +
                                                                i;
                                                            } else {
                                                              pageNum =
                                                                currentPage -
                                                                2 +
                                                                i;
                                                            }

                                                            return (
                                                              <Button
                                                                key={`${subsection.id}-fallback-page-${pageNum}`}
                                                                size="sm"
                                                                variant={
                                                                  currentPage ===
                                                                  pageNum
                                                                    ? "default"
                                                                    : "ghost"
                                                                }
                                                                onClick={() =>
                                                                  setCurrentExplanationPageForSubsection(
                                                                    subsection.id,
                                                                    pageNum
                                                                  )
                                                                }
                                                                className={`w-8 h-8 p-0 text-xs ${
                                                                  currentPage ===
                                                                  pageNum
                                                                    ? "bg-cyan-600 text-white"
                                                                    : "text-cyan-600 hover:bg-cyan-50"
                                                                }`}
                                                              >
                                                                {pageNum + 1}
                                                              </Button>
                                                            );
                                                          }
                                                        )}
                                                        {totalPages > 5 &&
                                                          currentPage <
                                                            totalPages - 3 && (
                                                            <React.Fragment
                                                              key={`${subsection.id}-fallback-ellipsis-fragment`}
                                                            >
                                                              <span
                                                                key={`${subsection.id}-fallback-ellipsis`}
                                                                className="text-cyan-400 text-xs self-center"
                                                              >
                                                                ...
                                                              </span>
                                                              <Button
                                                                key={`${subsection.id}-fallback-last-page`}
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() =>
                                                                  setCurrentExplanationPageForSubsection(
                                                                    subsection.id,
                                                                    totalPages -
                                                                      1
                                                                  )
                                                                }
                                                                className="w-8 h-8 p-0 text-xs text-cyan-600 hover:bg-cyan-50"
                                                              >
                                                                {totalPages}
                                                              </Button>
                                                            </React.Fragment>
                                                          )}
                                                      </div>
                                                    </div>
                                                  );
                                                } else {
                                                  return (
                                                    <p className="text-cyan-500 italic">
                                                      No explanation available
                                                      for this section.
                                                    </p>
                                                  );
                                                }
                                              })()}
                                            </motion.div>

                                            {/* Practical Example */}
                                            {subsection.practicalExample && (
                                              <motion.div
                                                className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 shadow-sm"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3 }}
                                              >
                                                <h5 className="font-medium text-yellow-800 text-sm mb-3 flex items-center gap-2">
                                                  <TestTube className="h-4 w-4" />
                                                  Practical Example
                                                </h5>
                                                <MathMarkdownRenderer
                                                  content={
                                                    subsection.practicalExample
                                                  }
                                                />
                                              </motion.div>
                                            )}

                                            {/* Action Buttons */}
                                            <motion.div
                                              className="flex flex-wrap gap-3 pt-4"
                                              initial={{ opacity: 0, y: 10 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              transition={{ delay: 0.4 }}
                                            >
                                              {checkPremiumFeature(
                                                user,
                                                "getMoreDetails"
                                              ) ? (
                                                <motion.div
                                                  whileHover={{ scale: 1.05 }}
                                                  whileTap={{ scale: 0.95 }}
                                                >
                                                  <Button
                                                    onClick={() =>
                                                      generateSimplifiedExplanation(
                                                        {
                                                          id: subsection.id,
                                                          name: subsection.title,
                                                          content:
                                                            subsection.explanation,
                                                        }
                                                      )
                                                    }
                                                    disabled={
                                                      loadingExplanation[
                                                        subsection.id
                                                      ]
                                                    }
                                                    size="sm"
                                                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                                                  >
                                                    {loadingExplanation[
                                                      subsection.id
                                                    ] ? (
                                                      <>
                                                        <motion.div
                                                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                                          animate={{
                                                            rotate: 360,
                                                          }}
                                                          transition={{
                                                            duration: 1,
                                                            repeat:
                                                              Number.POSITIVE_INFINITY,
                                                            ease: "linear",
                                                          }}
                                                        />
                                                        Generating...
                                                      </>
                                                    ) : (
                                                      <>
                                                        <Brain className="h-4 w-4 mr-2" />
                                                        Get More Details
                                                      </>
                                                    )}
                                                  </Button>
                                                </motion.div>
                                              ) : (
                                                <motion.div
                                                  whileHover={{ scale: 1.05 }}
                                                  whileTap={{ scale: 0.95 }}
                                                >
                                                  <PremiumFeatureButton
                                                    feature="simplifiedExplanation"
                                                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                                                  >
                                                    <Lightbulb className="h-4 w-4 mr-2" />
                                                    Generate Simplified
                                                    Explanation
                                                  </PremiumFeatureButton>
                                                </motion.div>
                                              )}
                                            </motion.div>

                                            {/* Enhanced Explanation Display */}
                                            <AnimatePresence>
                                              {simplifiedExplanations[
                                                subsection.id
                                              ] && (
                                                <motion.div
                                                  key={`explanation-${subsection.id}`}
                                                  className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 shadow-sm"
                                                  initial={{
                                                    opacity: 0,
                                                    height: 0,
                                                  }}
                                                  animate={{
                                                    opacity: 1,
                                                    height: "auto",
                                                  }}
                                                  exit={{
                                                    opacity: 0,
                                                    height: 0,
                                                  }}
                                                  transition={{ duration: 0.3 }}
                                                >
                                                  <h5 className="font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                                                    <Zap className="h-4 w-4" />
                                                    Enhanced Explanation
                                                  </h5>
                                                  <div className="prose prose-lg max-w-none">
                                                    <div className="group/text relative bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/30 rounded-2xl p-8 border border-emerald-200/30 shadow-lg backdrop-blur-sm hover:shadow-xl hover:bg-gradient-to-br hover:from-white hover:via-emerald-50/40 hover:to-teal-50/50 transition-all duration-700 hover:scale-[1.01] transform-gpu">
                                                      <MathMarkdownRenderer
                                                        content={
                                                          simplifiedExplanations[
                                                            subsection.id
                                                          ]
                                                        }
                                                      />
                                                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-green-500/5 rounded-2xl opacity-0 group-hover/text:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                                                      <div className="absolute top-4 right-4 opacity-0 group-hover/text:opacity-100 transition-all duration-500 transform translate-x-2 group-hover/text:translate-x-0">
                                                        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-emerald-200 shadow-lg">
                                                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                                          <span className="text-xs font-medium text-emerald-700">
                                                            AI Enhanced
                                                          </span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </motion.div>
                                              )}
                                            </AnimatePresence>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </GlassCard>
                              </motion.div>
                            ))}
                          </motion.div>
                        ) : (
                          <motion.div
                            className="text-center py-8"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <motion.div className="space-y-4">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                                <Layers className="h-8 w-8 text-gray-400" />
                              </div>
                              <div>
                                <h3 className="text-lg font-medium text-gray-700 mb-2">
                                  Detailed Explanations Not Available
                                </h3>
                                <p className="text-sm text-gray-500 mb-4">
                                  This module is still being processed. Detailed
                                  subsections will be available once the
                                  curriculum processing is complete.
                                </p>
                                <p className="text-xs text-gray-400">
                                  Content should be pre-generated during course
                                  creation by the educator.
                                </p>
                              </div>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </GlassCard>
              </motion.div>
            )}

            {/* Enhanced Instructor Masterpieces Section - Only Show if Manual Resources Available */}
            {hasManualInstructorResources && (
              <motion.div
                key={`instructor-masterpieces-${module.id}`}
                variants={itemVariants}
              >
                <div className="relative">
                  {/* Enhanced background blur effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-600/10 via-orange-600/10 to-red-600/10 rounded-3xl blur-3xl"></div>

                  <Card className="relative border-0 bg-gradient-to-br from-amber-50/90 via-orange-50/90 to-red-50/90 shadow-2xl overflow-hidden backdrop-blur-sm">
                    {/* Animated background elements */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-100/30 to-orange-100/30"></div>
                      <motion.div
                        className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-r from-amber-400/20 to-orange-400/20 rounded-full blur-2xl"
                        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                        transition={{
                          duration: 15,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "linear",
                        }}
                      />
                      <motion.div
                        className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-r from-orange-400/20 to-red-400/20 rounded-full blur-2xl"
                        animate={{ rotate: -360, scale: [1.1, 1, 1.1] }}
                        transition={{
                          duration: 20,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "linear",
                        }}
                      />
                    </div>

                    <CardHeader className="relative z-10 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border-b border-amber-200/50 p-8">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <motion.div
                            className="w-16 h-16 bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 rounded-2xl flex items-center justify-center shadow-xl"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 10,
                            }}
                          >
                            <Crown className="h-8 w-8 text-white" />
                          </motion.div>

                          <div>
                            <CardTitle className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-amber-700 via-orange-700 to-red-700 bg-clip-text text-transparent mb-2">
                              Instructor's Masterpieces
                            </CardTitle>
                            <CardDescription className="text-amber-700 text-lg font-medium">
                              Handpicked resources curated especially for your
                              learning journey
                            </CardDescription>
                          </div>
                        </div>

                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.3, type: "spring" }}
                        >
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 shadow-lg px-4 py-2 text-sm font-bold">
                            <Star className="h-4 w-4 mr-2" />
                            Premium Collection
                          </Badge>
                        </motion.div>
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10 p-8">
                      <Tabs
                        defaultValue={
                          instructorMasterpieces.articles.length > 0
                            ? "articles"
                            : instructorMasterpieces.videos.length > 0
                            ? "videos"
                            : instructorMasterpieces.books.length > 0
                            ? "books"
                            : instructorMasterpieces.courses.length > 0
                            ? "courses"
                            : instructorMasterpieces.tools.length > 0
                            ? "tools"
                            : instructorMasterpieces.websites.length > 0
                            ? "websites"
                            : instructorMasterpieces.exercises.length > 0
                            ? "exercises"
                            : "articles"
                        }
                        className="w-full"
                      >
                        {/* Enhanced TabsList with Educator Design */}
                        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 h-auto p-2 bg-gradient-to-r from-white/80 to-amber-50/80 backdrop-blur-sm rounded-2xl border border-amber-200/50 shadow-lg">
                          <TabsTrigger
                            value="articles"
                            className="group flex flex-col items-center gap-2 p-4 data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl hover:bg-green-50"
                          >
                            <div className="p-2 rounded-lg bg-white/80 group-data-[state=active]:bg-white/20 transition-all duration-300">
                              <FileText className="h-5 w-5 text-green-600 group-data-[state=active]:text-white" />
                            </div>
                            <span className="text-xs font-semibold">
                              Articles
                            </span>
                            {instructorMasterpieces.articles.length > 0 && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-green-100 text-green-700 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white"
                              >
                                {instructorMasterpieces.articles.length}
                              </Badge>
                            )}
                          </TabsTrigger>

                          <TabsTrigger
                            value="videos"
                            className="group flex flex-col items-center gap-2 p-4 data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl hover:bg-red-50"
                          >
                            <div className="p-2 rounded-lg bg-white/80 group-data-[state=active]:bg-white/20 transition-all duration-300">
                              <Play className="h-5 w-5 text-red-600 group-data-[state=active]:text-white" />
                            </div>
                            <span className="text-xs font-semibold">
                              Videos
                            </span>
                            {instructorMasterpieces.videos.length > 0 && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-red-100 text-red-700 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white"
                              >
                                {instructorMasterpieces.videos.length}
                              </Badge>
                            )}
                          </TabsTrigger>

                          <TabsTrigger
                            value="books"
                            className="group flex flex-col items-center gap-2 p-4 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl hover:bg-blue-50"
                          >
                            <div className="p-2 rounded-lg bg-white/80 group-data-[state=active]:bg-white/20 transition-all duration-300">
                              <BookOpen className="h-5 w-5 text-blue-600 group-data-[state=active]:text-white" />
                            </div>
                            <span className="text-xs font-semibold">Books</span>
                            {instructorMasterpieces.books.length > 0 && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-blue-100 text-blue-700 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white"
                              >
                                {instructorMasterpieces.books.length}
                              </Badge>
                            )}
                          </TabsTrigger>

                          <TabsTrigger
                            value="courses"
                            className="group flex flex-col items-center gap-2 p-4 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl hover:bg-purple-50"
                          >
                            <div className="p-2 rounded-lg bg-white/80 group-data-[state=active]:bg-white/20 transition-all duration-300">
                              <Video className="h-5 w-5 text-purple-600 group-data-[state=active]:text-white" />
                            </div>
                            <span className="text-xs font-semibold">
                              Courses
                            </span>
                            {instructorMasterpieces.courses.length > 0 && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-purple-100 text-purple-700 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white"
                              >
                                {instructorMasterpieces.courses.length}
                              </Badge>
                            )}
                          </TabsTrigger>

                          <TabsTrigger
                            value="tools"
                            className="group flex flex-col items-center gap-2 p-4 data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl hover:bg-orange-50"
                          >
                            <div className="p-2 rounded-lg bg-white/80 group-data-[state=active]:bg-white/20 transition-all duration-300">
                              <Wrench className="h-5 w-5 text-orange-600 group-data-[state=active]:text-white" />
                            </div>
                            <span className="text-xs font-semibold">Tools</span>
                            {instructorMasterpieces.tools.length > 0 && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-orange-100 text-orange-700 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white"
                              >
                                {instructorMasterpieces.tools.length}
                              </Badge>
                            )}
                          </TabsTrigger>

                          <TabsTrigger
                            value="websites"
                            className="group flex flex-col items-center gap-2 p-4 data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl hover:bg-indigo-50"
                          >
                            <div className="p-2 rounded-lg bg-white/80 group-data-[state=active]:bg-white/20 transition-all duration-300">
                              <Globe className="h-5 w-5 text-indigo-600 group-data-[state=active]:text-white" />
                            </div>
                            <span className="text-xs font-semibold">
                              Websites
                            </span>
                            {instructorMasterpieces.websites.length > 0 && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-indigo-100 text-indigo-700 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white"
                              >
                                {instructorMasterpieces.websites.length}
                              </Badge>
                            )}
                          </TabsTrigger>

                          <TabsTrigger
                            value="exercises"
                            className="group flex flex-col items-center gap-2 p-4 data-[state=active]:bg-gradient-to-br data-[state=active]:from-pink-500 data-[state=active]:to-rose-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl hover:bg-pink-50"
                          >
                            <div className="p-2 rounded-lg bg-white/80 group-data-[state=active]:bg-white/20 transition-all duration-300">
                              <Target className="h-5 w-5 text-pink-600 group-data-[state=active]:text-white" />
                            </div>
                            <span className="text-xs font-semibold">
                              Exercises
                            </span>
                            {instructorMasterpieces.exercises.length > 0 && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-pink-100 text-pink-700 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white"
                              >
                                {instructorMasterpieces.exercises.length}
                              </Badge>
                            )}
                          </TabsTrigger>
                        </TabsList>

                        <div className="mt-8">
                          <TabsContent value="articles" className="space-y-6">
                            {instructorMasterpieces.articles.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {instructorMasterpieces.articles.map(
                                  (resource, index) => (
                                    <motion.div
                                      key={`instructor-article-${
                                        resource.id ||
                                        resource.url ||
                                        resource.title ||
                                        index
                                      }`}
                                      variants={itemVariants}
                                    >
                                      <ResourceCard
                                        resource={resource}
                                        type="articles"
                                        isInstructorChoice={true}
                                      />
                                    </motion.div>
                                  )
                                )}
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="videos" className="space-y-6">
                            {instructorMasterpieces.videos.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {instructorMasterpieces.videos.map(
                                  (resource, index) => (
                                    <motion.div
                                      key={`instructor-video-${
                                        resource.id ||
                                        resource.url ||
                                        resource.title ||
                                        index
                                      }`}
                                      variants={itemVariants}
                                    >
                                      <ResourceCard
                                        resource={resource}
                                        type="videos"
                                        isInstructorChoice={true}
                                      />
                                    </motion.div>
                                  )
                                )}
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="books" className="space-y-6">
                            {instructorMasterpieces.books.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {instructorMasterpieces.books.map(
                                  (resource, index) => (
                                    <motion.div
                                      key={`instructor-book-${
                                        resource.id ||
                                        resource.url ||
                                        resource.title ||
                                        index
                                      }`}
                                      variants={itemVariants}
                                    >
                                      <ResourceCard
                                        resource={resource}
                                        type="books"
                                        isInstructorChoice={true}
                                      />
                                    </motion.div>
                                  )
                                )}
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="courses" className="space-y-6">
                            {instructorMasterpieces.courses.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {instructorMasterpieces.courses.map(
                                  (resource, index) => (
                                    <motion.div
                                      key={`instructor-course-${
                                        resource.id ||
                                        resource.url ||
                                        resource.title ||
                                        index
                                      }`}
                                      variants={itemVariants}
                                    >
                                      <ResourceCard
                                        resource={resource}
                                        type="courses"
                                        isInstructorChoice={true}
                                      />
                                    </motion.div>
                                  )
                                )}
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="tools" className="space-y-6">
                            {instructorMasterpieces.tools.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {instructorMasterpieces.tools.map(
                                  (resource, index) => (
                                    <motion.div
                                      key={`instructor-tool-${
                                        resource.id ||
                                        resource.url ||
                                        resource.title ||
                                        index
                                      }`}
                                      variants={itemVariants}
                                    >
                                      <ResourceCard
                                        resource={resource}
                                        type="tools"
                                        isInstructorChoice={true}
                                      />
                                    </motion.div>
                                  )
                                )}
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="websites" className="space-y-6">
                            {instructorMasterpieces.websites.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {instructorMasterpieces.websites.map(
                                  (resource, index) => (
                                    <motion.div
                                      key={`instructor-website-${
                                        resource.id ||
                                        resource.url ||
                                        resource.title ||
                                        index
                                      }`}
                                      variants={itemVariants}
                                    >
                                      <ResourceCard
                                        resource={resource}
                                        type="websites"
                                        isInstructorChoice={true}
                                      />
                                    </motion.div>
                                  )
                                )}
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="exercises" className="space-y-6">
                            {instructorMasterpieces.exercises.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {instructorMasterpieces.exercises.map(
                                  (resource, index) => (
                                    <motion.div
                                      key={`instructor-exercise-${
                                        resource.id ||
                                        resource.url ||
                                        resource.title ||
                                        index
                                      }`}
                                      variants={itemVariants}
                                    >
                                      <ResourceCard
                                        resource={resource}
                                        type="exercises"
                                        isInstructorChoice={true}
                                      />
                                    </motion.div>
                                  )
                                )}
                              </div>
                            )}
                          </TabsContent>
                        </div>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="resources" className="space-y-8">
            {/* Complete Learning Resources Section - Educator Dashboard Style */}
            <motion.div
              key={`complete-learning-resources-${module.id}`}
              variants={itemVariants}
            >
              <div className="relative">
                {/* Enhanced background blur effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-blue-600/10 rounded-3xl blur-3xl"></div>

                <Card className="relative border-0 bg-gradient-to-br from-purple-50/90 via-indigo-50/90 to-blue-50/90 shadow-2xl overflow-hidden backdrop-blur-sm">
                  {/* Animated background elements */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-100/30 to-indigo-100/30"></div>
                    <motion.div
                      className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-indigo-400/20 rounded-full blur-2xl"
                      animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                      transition={{
                        duration: 15,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      }}
                    />
                    <motion.div
                      className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-r from-indigo-400/20 to-blue-400/20 rounded-full blur-2xl"
                      animate={{ rotate: -360, scale: [1.1, 1, 1.1] }}
                      transition={{
                        duration: 20,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      }}
                    />
                  </div>

                  <CardHeader className="relative z-10 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border-b border-purple-200/50 p-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <motion.div
                          className="w-16 h-16 bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 10,
                          }}
                        >
                          <Sparkles className="h-8 w-8 text-white" />
                        </motion.div>

                        <div>
                          <CardTitle className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 bg-clip-text text-transparent mb-2">
                            Complete Learning Resources
                          </CardTitle>
                          <CardDescription className="text-purple-700 text-lg font-medium">
                            AI-curated collection of comprehensive learning
                            materials
                          </CardDescription>
                        </div>
                      </div>

                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3, type: "spring" }}
                      >
                        <Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0 shadow-lg px-4 py-2 text-sm font-bold">
                          <Brain className="h-4 w-4 mr-2" />
                          AI Curated
                        </Badge>
                      </motion.div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10 p-8">
                    <Tabs
                      defaultValue={
                        // Check instructor resources first (prioritize educator-added content)
                        instructorMasterpieces.articles && instructorMasterpieces.articles.length > 0
                          ? "articles"
                          : instructorMasterpieces.videos && instructorMasterpieces.videos.length > 0
                          ? "videos"
                          : instructorMasterpieces.books && instructorMasterpieces.books.length > 0
                          ? "books"
                          : instructorMasterpieces.courses && instructorMasterpieces.courses.length > 0
                          ? "courses"
                          : instructorMasterpieces.tools && instructorMasterpieces.tools.length > 0
                          ? "tools"
                          : instructorMasterpieces.websites && instructorMasterpieces.websites.length > 0
                          ? "websites"
                          : instructorMasterpieces.exercises && instructorMasterpieces.exercises.length > 0
                          ? "exercises"
                          : // Fallback to AI resources
                          aiResources.articles && aiResources.articles.length > 0
                          ? "articles"
                          : aiResources.videos && aiResources.videos.length > 0
                          ? "videos"
                          : aiResources.books && aiResources.books.length > 0
                          ? "books"
                          : aiResources.courses &&
                            aiResources.courses.length > 0
                          ? "courses"
                          : aiResources.tools && aiResources.tools.length > 0
                          ? "tools"
                          : aiResources.websites &&
                            aiResources.websites.length > 0
                          ? "websites"
                          : aiResources.exercises &&
                            aiResources.exercises.length > 0
                          ? "exercises"
                          : "articles"
                      }
                      className="w-full"
                    >
                      {/* Enhanced TabsList with Educator Design */}
                      <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 h-auto p-2 bg-gradient-to-r from-white/80 to-purple-50/80 backdrop-blur-sm rounded-2xl border border-purple-200/50 shadow-lg">
                        {((aiResources.articles && aiResources.articles.length > 0) || 
                          (instructorMasterpieces.articles && instructorMasterpieces.articles.length > 0)) && (
                            <TabsTrigger
                              value="articles"
                              className="group flex flex-col items-center gap-2 p-4 data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl hover:bg-green-50"
                            >
                              <div className="p-2 rounded-lg bg-white/80 group-data-[state=active]:bg-white/20 transition-all duration-300">
                                <FileText className="h-5 w-5 text-green-600 group-data-[state=active]:text-white" />
                              </div>
                              <span className="text-xs font-semibold">
                                Articles
                              </span>
                              <Badge
                                variant="secondary"
                                className="text-xs bg-green-100 text-green-700 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white"
                              >
                                {(aiResources.articles?.length || 0) + (instructorMasterpieces.articles?.length || 0)}
                              </Badge>
                            </TabsTrigger>
                          )}

                        {((aiResources.videos && aiResources.videos.length > 0) || 
                          (instructorMasterpieces.videos && instructorMasterpieces.videos.length > 0)) && (
                            <TabsTrigger
                              value="videos"
                              className="group flex flex-col items-center gap-2 p-4 data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl hover:bg-red-50"
                            >
                              <div className="p-2 rounded-lg bg-white/80 group-data-[state=active]:bg-white/20 transition-all duration-300">
                                <Play className="h-5 w-5 text-red-600 group-data-[state=active]:text-white" />
                              </div>
                              <span className="text-xs font-semibold">
                                Videos
                              </span>
                              <Badge
                                variant="secondary"
                                className="text-xs bg-red-100 text-red-700 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white"
                              >
                                {(aiResources.videos?.length || 0) + (instructorMasterpieces.videos?.length || 0)}
                              </Badge>
                            </TabsTrigger>
                          )}

                        {((aiResources.books && aiResources.books.length > 0) || 
                          (instructorMasterpieces.books && instructorMasterpieces.books.length > 0)) && (
                          <TabsTrigger
                            value="books"
                            className="group flex flex-col items-center gap-2 p-4 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl hover:bg-blue-50"
                          >
                            <div className="p-2 rounded-lg bg-white/80 group-data-[state=active]:bg-white/20 transition-all duration-300">
                              <BookOpen className="h-5 w-5 text-blue-600 group-data-[state=active]:text-white" />
                            </div>
                            <span className="text-xs font-semibold">Books</span>
                            <Badge
                              variant="secondary"
                              className="text-xs bg-blue-100 text-blue-700 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white"
                            >
                              {(aiResources.books?.length || 0) + (instructorMasterpieces.books?.length || 0)}
                            </Badge>
                          </TabsTrigger>
                        )}

                        {((aiResources.courses && aiResources.courses.length > 0) || (instructorMasterpieces.courses && instructorMasterpieces.courses.length > 0)) && (
                            <TabsTrigger
                              value="courses"
                              className="group flex flex-col items-center gap-2 p-4 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl hover:bg-purple-50"
                            >
                              <div className="p-2 rounded-lg bg-white/80 group-data-[state=active]:bg-white/20 transition-all duration-300">
                                <Video className="h-5 w-5 text-purple-600 group-data-[state=active]:text-white" />
                              </div>
                              <span className="text-xs font-semibold">
                                Courses
                              </span>
                              <Badge
                                variant="secondary"
                                className="text-xs bg-purple-100 text-purple-700 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white"
                              >
                                {(aiResources.courses?.length || 0) + (instructorMasterpieces.courses?.length || 0)}
                              </Badge>
                            </TabsTrigger>
                          )}

                        {((aiResources.tools && aiResources.tools.length > 0) || (instructorMasterpieces.tools && instructorMasterpieces.tools.length > 0)) && (
                          <TabsTrigger
                            value="tools"
                            className="group flex flex-col items-center gap-2 p-4 data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl hover:bg-orange-50"
                          >
                            <div className="p-2 rounded-lg bg-white/80 group-data-[state=active]:bg-white/20 transition-all duration-300">
                              <Wrench className="h-5 w-5 text-orange-600 group-data-[state=active]:text-white" />
                            </div>
                            <span className="text-xs font-semibold">Tools</span>
                            <Badge
                              variant="secondary"
                              className="text-xs bg-orange-100 text-orange-700 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white"
                            >
                              {(aiResources.tools?.length || 0) + (instructorMasterpieces.tools?.length || 0)}
                            </Badge>
                          </TabsTrigger>
                        )}

                        {((aiResources.websites && aiResources.websites.length > 0) || (instructorMasterpieces.websites && instructorMasterpieces.websites.length > 0)) && (
                            <TabsTrigger
                              value="websites"
                              className="group flex flex-col items-center gap-2 p-4 data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl hover:bg-indigo-50"
                            >
                              <div className="p-2 rounded-lg bg-white/80 group-data-[state=active]:bg-white/20 transition-all duration-300">
                                <Globe className="h-5 w-5 text-indigo-600 group-data-[state=active]:text-white" />
                              </div>
                              <span className="text-xs font-semibold">
                                Websites
                              </span>
                              <Badge
                                variant="secondary"
                                className="text-xs bg-indigo-100 text-indigo-700 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white"
                              >
                                {(aiResources.websites?.length || 0) + (instructorMasterpieces.websites?.length || 0)}
                              </Badge>
                            </TabsTrigger>
                          )}

                        {((aiResources.exercises && aiResources.exercises.length > 0) || (instructorMasterpieces.exercises && instructorMasterpieces.exercises.length > 0)) && (
                            <TabsTrigger
                              value="exercises"
                              className="group flex flex-col items-center gap-2 p-4 data-[state=active]:bg-gradient-to-br data-[state=active]:from-pink-500 data-[state=active]:to-rose-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl hover:bg-pink-50"
                            >
                              <div className="p-2 rounded-lg bg-white/80 group-data-[state=active]:bg-white/20 transition-all duration-300">
                                <Target className="h-5 w-5 text-pink-600 group-data-[state=active]:text-white" />
                              </div>
                              <span className="text-xs font-semibold">
                                Exercises
                              </span>
                              <Badge
                                variant="secondary"
                                className="text-xs bg-pink-100 text-pink-700 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white"
                              >
                                {(aiResources.exercises?.length || 0) + (instructorMasterpieces.exercises?.length || 0)}
                              </Badge>
                            </TabsTrigger>
                          )}
                      </TabsList>

                      <div className="mt-8">
                        {/* Books Content - Combined AI + Instructor Resources */}
                        {((aiResources.books && aiResources.books.length > 0) ||
                          (instructorMasterpieces.books && instructorMasterpieces.books.length > 0)) && (
                          <TabsContent key="books" value="books">
                            <motion.div
                              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                              variants={containerVariants}
                              initial="hidden"
                              animate="visible"
                            >
                              {/* Display Instructor Resources First (Prioritized) */}
                              {instructorMasterpieces.books?.map((resource, index) => (
                                <motion.div
                                  key={`instructor-books-${index}-${
                                    resource.title || resource.name || index
                                  }`}
                                  variants={itemVariants}
                                >
                                  <ResourceCard
                                    resource={resource}
                                    type="books"
                                    resourceIndex={index}
                                    isInstructorChoice={true}
                                  />
                                </motion.div>
                              ))}
                              {/* Display AI Resources */}
                              {aiResources.books?.map((resource, index) => (
                                <motion.div
                                  key={`ai-books-${index}-${
                                    resource.title || resource.name || index
                                  }`}
                                  variants={itemVariants}
                                >
                                  <ResourceCard
                                    resource={resource}
                                    type="books"
                                    resourceIndex={index + (instructorMasterpieces.books?.length || 0)}
                                  />
                                </motion.div>
                              ))}
                            </motion.div>
                          </TabsContent>
                        )}

                        {/* Courses Content - Combined AI + Instructor Resources */}
                        {((aiResources.courses && aiResources.courses.length > 0) ||
                          (instructorMasterpieces.courses && instructorMasterpieces.courses.length > 0)) && (
                            <TabsContent key="courses" value="courses">
                              <motion.div
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                              >
                                {/* Display Instructor Resources First (Prioritized) */}
                                {instructorMasterpieces.courses?.map((resource, index) => (
                                  <motion.div
                                    key={`instructor-courses-${index}-${
                                      resource.title || resource.name || index
                                    }`}
                                    variants={itemVariants}
                                  >
                                    <ResourceCard
                                      resource={resource}
                                      type="courses"
                                      resourceIndex={index}
                                      isInstructorChoice={true}
                                    />
                                  </motion.div>
                                ))}
                                {/* Display AI Resources */}
                                {aiResources.courses?.map((resource, index) => (
                                  <motion.div
                                    key={`ai-courses-${index}-${
                                      resource.title || resource.name || index
                                    }`}
                                    variants={itemVariants}
                                  >
                                    <ResourceCard
                                      resource={resource}
                                      type="courses"
                                      resourceIndex={index + (instructorMasterpieces.courses?.length || 0)}
                                    />
                                  </motion.div>
                                ))}
                              </motion.div>
                            </TabsContent>
                          )}

                        {/* Videos Content - Combined AI + Instructor Resources */}
                        {((aiResources.videos && aiResources.videos.length > 0) ||
                          (instructorMasterpieces.videos && instructorMasterpieces.videos.length > 0)) && (
                            <TabsContent key="videos" value="videos">
                              <motion.div
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                              >
                                {/* Display Instructor Resources First (Prioritized) */}
                                {instructorMasterpieces.videos?.map((resource, index) => (
                                  <motion.div
                                    key={`instructor-videos-${index}-${
                                      resource.title || resource.name || index
                                    }`}
                                    variants={itemVariants}
                                  >
                                    <ResourceCard
                                      resource={resource}
                                      type="videos"
                                      resourceIndex={index}
                                      isInstructorChoice={true}
                                    />
                                  </motion.div>
                                ))}
                                {/* Display AI Resources */}
                                {aiResources.videos?.map((resource, index) => (
                                  <motion.div
                                    key={`ai-videos-${index}-${
                                      resource.title || resource.name || index
                                    }`}
                                    variants={itemVariants}
                                  >
                                    <ResourceCard
                                      resource={resource}
                                      type="videos"
                                      resourceIndex={index + (instructorMasterpieces.videos?.length || 0)}
                                    />
                                  </motion.div>
                                ))}
                              </motion.div>
                            </TabsContent>
                          )}

                        {/* Articles Content - Combined AI + Instructor Resources */}
                        {((aiResources.articles && aiResources.articles.length > 0) ||
                          (instructorMasterpieces.articles && instructorMasterpieces.articles.length > 0)) && (
                            <TabsContent key="articles" value="articles">
                              <motion.div
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                              >
                                {/* Display Instructor Resources First (Prioritized) */}
                                {instructorMasterpieces.articles?.map((resource, index) => (
                                  <motion.div
                                    key={`instructor-articles-${index}-${
                                      resource.title || resource.name || index
                                    }`}
                                    variants={itemVariants}
                                  >
                                    <ResourceCard
                                      resource={resource}
                                      type="articles"
                                      resourceIndex={index}
                                      isInstructorChoice={true}
                                    />
                                  </motion.div>
                                ))}
                                {/* Display AI Resources */}
                                {aiResources.articles?.map((resource, index) => (
                                  <motion.div
                                    key={`ai-articles-${index}-${
                                      resource.title || resource.name || index
                                    }`}
                                    variants={itemVariants}
                                  >
                                    <ResourceCard
                                      resource={resource}
                                      type="articles"
                                      resourceIndex={index + (instructorMasterpieces.articles?.length || 0)}
                                    />
                                  </motion.div>
                                ))}
                              </motion.div>
                            </TabsContent>
                          )}

                        {/* Tools Content - Combined AI + Instructor Resources */}
                        {((aiResources.tools && aiResources.tools.length > 0) ||
                          (instructorMasterpieces.tools && instructorMasterpieces.tools.length > 0)) && (
                          <TabsContent key="tools" value="tools">
                            <motion.div
                              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                              variants={containerVariants}
                              initial="hidden"
                              animate="visible"
                            >
                              {/* Display Instructor Resources First (Prioritized) */}
                              {instructorMasterpieces.tools?.map((resource, index) => (
                                <motion.div
                                  key={`instructor-tools-${index}-${
                                    resource.title || resource.name || index
                                  }`}
                                  variants={itemVariants}
                                >
                                  <ResourceCard
                                    resource={resource}
                                    type="tools"
                                    resourceIndex={index}
                                    isInstructorChoice={true}
                                  />
                                </motion.div>
                              ))}
                              {/* Display AI Resources */}
                              {aiResources.tools?.map((resource, index) => (
                                <motion.div
                                  key={`ai-tools-${index}-${
                                    resource.title || resource.name || index
                                  }`}
                                  variants={itemVariants}
                                >
                                  <ResourceCard
                                    resource={resource}
                                    type="tools"
                                    resourceIndex={index + (instructorMasterpieces.tools?.length || 0)}
                                  />
                                </motion.div>
                              ))}
                            </motion.div>
                          </TabsContent>
                        )}

                        {/* Websites Content - Combined AI + Instructor Resources */}
                        {((aiResources.websites && aiResources.websites.length > 0) ||
                          (instructorMasterpieces.websites && instructorMasterpieces.websites.length > 0)) && (
                            <TabsContent key="websites" value="websites">
                              <motion.div
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                              >
                                {/* Display Instructor Resources First (Prioritized) */}
                                {instructorMasterpieces.websites?.map((resource, index) => (
                                  <motion.div
                                    key={`instructor-websites-${index}-${
                                      resource.title || resource.name || index
                                    }`}
                                    variants={itemVariants}
                                  >
                                    <ResourceCard
                                      resource={resource}
                                      type="websites"
                                      resourceIndex={index}
                                      isInstructorChoice={true}
                                    />
                                  </motion.div>
                                ))}
                                {/* Display AI Resources */}
                                {aiResources.websites?.map((resource, index) => (
                                  <motion.div
                                    key={`ai-websites-${index}-${
                                      resource.title || resource.name || index
                                    }`}
                                    variants={itemVariants}
                                  >
                                    <ResourceCard
                                      resource={resource}
                                      type="websites"
                                      resourceIndex={index + (instructorMasterpieces.websites?.length || 0)}
                                    />
                                  </motion.div>
                                ))}
                              </motion.div>
                            </TabsContent>
                          )}

                        {/* Exercises Content - Combined AI + Instructor Resources */}
                        {((aiResources.exercises && aiResources.exercises.length > 0) ||
                          (instructorMasterpieces.exercises && instructorMasterpieces.exercises.length > 0)) && (
                            <TabsContent key="exercises" value="exercises">
                              <motion.div
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                              >
                                {/* Display Instructor Resources First (Prioritized) */}
                                {instructorMasterpieces.exercises?.map((resource, index) => (
                                  <motion.div
                                    key={`instructor-exercises-${index}-${
                                      resource.title || resource.name || index
                                    }`}
                                    variants={itemVariants}
                                  >
                                    <ResourceCard
                                      resource={resource}
                                      type="exercises"
                                      resourceIndex={index}
                                      isInstructorChoice={true}
                                    />
                                  </motion.div>
                                ))}
                                {/* Display AI Resources */}
                                {aiResources.exercises?.map((resource, index) => (
                                  <motion.div
                                    key={`ai-exercises-${index}-${
                                      resource.title || resource.name || index
                                    }`}
                                    variants={itemVariants}
                                  >
                                    <ResourceCard
                                      resource={resource}
                                      type="exercises"
                                      resourceIndex={index + (instructorMasterpieces.exercises?.length || 0)}
                                    />
                                  </motion.div>
                                ))}
                              </motion.div>
                            </TabsContent>
                          )}
                      </div>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* Interactive Programming Practice Section */}
            {module.content && detectVisualizableContent(module.content) && (
              <motion.div
                key={`programming-practice-${module.id}`}
                variants={itemVariants}
              >
                <GlassCard className="bg-gradient-to-br from-emerald-50/80 to-teal-50/80 border-emerald-200/50">
                  <CardContent className="p-8">
                    <motion.h3
                      className="font-bold text-2xl mb-6 flex items-center gap-3 text-emerald-800"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <motion.div
                        className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-lg"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <Code2 className="h-6 w-6 text-white" />
                      </motion.div>
                      Programming Practice
                      <EnhancedBadge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1 flex items-center gap-1">
                        <Cpu className="h-3 w-3" />
                        Interactive IDE
                      </EnhancedBadge>
                    </motion.h3>

                    {/* Programming Practice Section */}
                    <AnimatePresence mode="wait">
                      {loadingChallenges ? (
                        <EnhancedLoader text="Generating programming challenges..." />
                      ) : programmingChallenges.length > 0 ? (
                        <motion.div
                          className="space-y-8"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {/* Challenge Selection */}
                          <div>
                            <h4 className="font-semibold text-lg text-emerald-800 mb-4 flex items-center gap-2">
                              <Target className="h-5 w-5" />
                              Choose Your Challenge
                              <EnhancedBadge className="bg-emerald-100 text-emerald-700">
                                {programmingChallenges.length} challenges
                              </EnhancedBadge>
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {programmingChallenges.map((challenge) => (
                                <ProgrammingChallengeCard
                                  key={challenge.id}
                                  challenge={challenge}
                                  isActive={
                                    activeProgrammingChallenge?.id ===
                                    challenge.id
                                  }
                                  onClick={() => selectChallenge(challenge)}
                                  challengeProgress={challengeProgress}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Active Challenge Section */}
                          {activeProgrammingChallenge && (
                            <motion.div
                              className="space-y-6"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              {/* Challenge content goes here */}
                            </motion.div>
                          )}
                        </motion.div>
                      ) : (
                        <motion.div
                          className="text-center py-12"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <PremiumFeatureButton
                              feature="programmingChallenges"
                              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <Code2 className="h-4 w-4 mr-2" />
                              Generate Programming Challenges
                            </PremiumFeatureButton>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </GlassCard>
              </motion.div>
            )}

            {/* Action Section */}
            <motion.div
              key={`action-section-${module.id}`}
              variants={itemVariants}
            >
              <GlassCard className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 border-green-200/50">
                <CardContent className="p-8">
                  <div className="flex flex-wrap gap-4 justify-center">
                    {checkPremiumFeature(user, "quizGeneration") ? (
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          onClick={() => setShowQuiz(true)}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3"
                        >
                          <TestTube className="h-5 w-5 mr-2" />
                          Take Quiz
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <PremiumFeatureButton
                          feature="moduleCompletion"
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Complete
                        </PremiumFeatureButton>
                      </motion.div>
                    )}

                    {!moduleProgress.completed && (
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="outline"
                          onClick={handleMarkComplete}
                          className="border-green-300 text-green-700 hover:bg-green-50 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3 bg-transparent"
                        >
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Mark as Complete
                        </Button>
                      </motion.div>
                    )}

                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="outline"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3 bg-transparent"
                      >
                        <Share2 className="h-5 w-5 mr-2" />
                        Share Module
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </GlassCard>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Resource Modal */}
      <AnimatePresence>
        {editingResource && (
          <motion.div
            key="edit-modal"
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  Edit AI Curated Resource
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelEditingResource}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="edit-title"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Title
                  </Label>
                  <Input
                    id="edit-title"
                    value={editedResourceData.title || ""}
                    onChange={(e) =>
                      setEditedResourceData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="mt-1"
                    placeholder="Enter resource title"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="edit-url"
                    className="text-sm font-semibold text-slate-700"
                  >
                    URL
                  </Label>
                  <Input
                    id="edit-url"
                    value={editedResourceData.url || ""}
                    onChange={(e) =>
                      setEditedResourceData((prev) => ({
                        ...prev,
                        url: e.target.value,
                      }))
                    }
                    className="mt-1"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="edit-description"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Description
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={editedResourceData.description || ""}
                    onChange={(e) =>
                      setEditedResourceData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="mt-1"
                    placeholder="Describe this resource..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="edit-difficulty"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Difficulty
                    </Label>
                    <select
                      id="edit-difficulty"
                      value={editedResourceData.difficulty || "Beginner"}
                      onChange={(e) =>
                        setEditedResourceData((prev) => ({
                          ...prev,
                          difficulty: e.target.value,
                        }))
                      }
                      className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <Label
                      htmlFor="edit-author"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Author/Creator
                    </Label>
                    <Input
                      id="edit-author"
                      value={editedResourceData.author || ""}
                      onChange={(e) =>
                        setEditedResourceData((prev) => ({
                          ...prev,
                          author: e.target.value,
                        }))
                      }
                      className="mt-1"
                      placeholder="Author name"
                    />
                  </div>
                </div>

                {(editingResource?.type === "videos" ||
                  editingResource?.type === "courses") && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="edit-duration"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Duration
                      </Label>
                      <Input
                        id="edit-duration"
                        value={editedResourceData.duration || ""}
                        onChange={(e) =>
                          setEditedResourceData((prev) => ({
                            ...prev,
                            duration: e.target.value,
                          }))
                        }
                        className="mt-1"
                        placeholder="e.g., 2h 30m"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="edit-platform"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Platform/Source
                      </Label>
                      <Input
                        id="edit-platform"
                        value={editedResourceData.platform || ""}
                        onChange={(e) =>
                          setEditedResourceData((prev) => ({
                            ...prev,
                            platform: e.target.value,
                          }))
                        }
                        className="mt-1"
                        placeholder="e.g., YouTube, Coursera"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-8 pt-4 border-t border-slate-200">
                <Button
                  onClick={saveEditedResource}
                  disabled={isUpdatingResource}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isUpdatingResource ? (
                    <>
                      <motion.div
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={cancelEditingResource}
                  className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz Modal */}
      <AnimatePresence>
        {showQuiz && (
          <QuizModal
            key="quiz-modal"
            course={course}
            module={module}
            onClose={() => setShowQuiz(false)}
            onComplete={(score) => {
              onProgress(module.id, true, 0, score);
              setShowQuiz(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
