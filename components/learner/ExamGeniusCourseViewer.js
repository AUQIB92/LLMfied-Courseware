"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import MathMarkdownRenderer from "@/components/MathMarkdownRenderer";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Play,
  Trophy,
  Brain,
  Target,
  Clock,
  Star,
  Award,
  CheckCircle,
  Circle,
  FileText,
  Video,
  Globe,
  Wrench,
  GraduationCap,
  Lightbulb,
  ArrowRight,
  Zap,
  Timer,
  Medal,
  AlertCircle,
  AlertTriangle,
  Lock,
  Unlock,
  TrendingUp,
  BarChart3,
  Sparkles,
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  Crown,
  Settings,
  RefreshCw,
} from "lucide-react";

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

// Math rendering is now handled by MathMarkdownRenderer component

// Custom LaTeX formula renderer for specific cases
const LatexFormula = ({ formula }) => {
  // Replace common LaTeX issues specific to electrical engineering formulas
  const fixedFormula = formula
    .replace(/R_\{th\}/g, "R_{th}")
    .replace(/R_\{N\}/g, "R_{N}")
    .replace(/V_\{th\}/g, "V_{th}")
    .replace(/I_\{N\}/g, "I_{N}")
    .replace(/I_\{t\}/g, "I_{t}")
    .replace(/V_\{t\}/g, "V_{t}")
    .replace(/frac\{V_t\}\{I_t\}/g, "\\frac{V_t}{I_t}")
    .replace(/frac\{V_t\}\{L_t\}/g, "\\frac{V_t}{L_t}")
    .replace(/frac\{V_th\}\{I_t\}/g, "\\frac{V_{th}}{I_t}")
    .replace(/frac\{V_th\}\{L_t\}/g, "\\frac{V_{th}}{L_t}");

  return <MathMarkdownRenderer content={`$${fixedFormula}$`} />;
};

// Rich text formatting is now handled by MathMarkdownRenderer component

export default function ExamGeniusCourseViewer({ course, onBack, onProgress }) {
  const { getAuthHeaders } = useAuth();
  const [currentModule, setCurrentModule] = useState(0);
  const [currentSubsection, setCurrentSubsection] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [completedModules, setCompletedModules] = useState(new Set());
  const [completedSubsections, setCompletedSubsections] = useState(new Set());
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedQuizDifficulty, setSelectedQuizDifficulty] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [quizResults, setQuizResults] = useState({});
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [sidebarManuallyToggled, setSidebarManuallyToggled] = useState(false);
  const [showModuleList, setShowModuleList] = useState(true);
  const [detailedContent, setDetailedContent] = useState(null);
  const [loadingDetailedContent, setLoadingDetailedContent] = useState(false);
  const [currentPageTabs, setCurrentPageTabs] = useState({});

  const modules = course.modules || [];
  const currentModuleData = modules[currentModule];
  const subsections = currentModuleData?.detailedSubsections || [];
  const currentSubsectionData = subsections[currentSubsection];
  const pages = currentSubsectionData?.pages || [];

  useEffect(() => {
    console.log(
      "🔍 DEBUG: useEffect triggered for course:",
      course._id,
      course.title
    );
    console.log("🔍 DEBUG: Course properties:", {
      isExamGenius: course.isExamGenius,
      status: course.status,
      modules: course.modules?.length || 0,
    });

    // Initialize progress tracking
    const savedProgress = localStorage.getItem(`exam-progress-${course._id}`);
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      setCompletedModules(new Set(progress.completedModules || []));
      setCompletedSubsections(new Set(progress.completedSubsections || []));
    }

    // Fetch detailed content for ExamGenius courses
    if (course.isExamGenius) {
      console.log(
        "🔍 DEBUG: Fetching detailed content because course.isExamGenius is true"
      );
      fetchDetailedContent();
    } else {
      console.log(
        "🔍 DEBUG: NOT fetching detailed content because course.isExamGenius is",
        course.isExamGenius
      );
    }
  }, [course._id]);

  const fetchDetailedContent = async () => {
    try {
      setLoadingDetailedContent(true);
      console.log(
        "🔍 DEBUG: Fetching detailed content for ExamGenius course:",
        course._id,
        course.title
      );
      console.log("🔍 DEBUG: Course is ExamGenius:", course.isExamGenius);
      console.log("🔍 DEBUG: Course examType:", course.examType);

      const response = await fetch(
        `/api/courses/${course._id}/detailed-content`,
        {
          headers: getAuthHeaders(),
          // Add cache control to ensure we get fresh content
          cache: 'no-store'
        }
      );

      console.log(
        "🔍 DEBUG: Response status:",
        response.status,
        response.statusText
      );

      if (response.ok) {
        const data = await response.json();
        console.log("📚 DEBUG: Detailed content API response received");
        console.log("📚 DEBUG: Response message:", data.message);
        console.log("📚 DEBUG: Is fallback content:", data.isFallback);
        console.log(
          "📚 DEBUG: Detailed content structure:",
          Object.keys(data.detailedContent || {})
        );

        // Check if we have actual content or an empty structure
        if (
          data.detailedContent &&
          Object.keys(data.detailedContent).length > 0
        ) {
          // Log each module's content
          Object.keys(data.detailedContent).forEach((moduleIndex) => {
            console.log(
              `📚 DEBUG: Module ${moduleIndex} subsections:`,
              Object.keys(data.detailedContent[moduleIndex])
            );
            
            // Validate each subsection has pages
            Object.keys(data.detailedContent[moduleIndex]).forEach(
              (subsectionIndex) => {
                const subsectionContent =
                  data.detailedContent[moduleIndex][subsectionIndex];
                
                // Log subsection content details
                console.log(
                  `📚 DEBUG: Module ${moduleIndex}, Subsection ${subsectionIndex}:`,
                  {
                    pages: subsectionContent.pages?.length || 0,
                    hasContent: !!subsectionContent.pages,
                    subsectionTitle: subsectionContent.subsectionTitle,
                    firstPageTitle: subsectionContent.pages?.[0]?.pageTitle || "No page title",
                    hasSpeedSolvingTechniques: !!subsectionContent.pages?.[0]?.speedSolvingTechniques,
                    hasCommonTraps: !!subsectionContent.pages?.[0]?.commonTraps,
                  }
                );
                
                // Ensure each subsection has pages
                if (!subsectionContent.pages || !Array.isArray(subsectionContent.pages) || subsectionContent.pages.length === 0) {
                  console.log(`📚 DEBUG: Creating default pages for module ${moduleIndex}, subsection ${subsectionIndex}`);
                  
                  // Get the subsection from the module data
                  const module = modules[moduleIndex];
                  const subsection = module?.detailedSubsections?.[subsectionIndex];
                  const title = subsectionContent.subsectionTitle || subsection?.title || `Section ${subsectionIndex}`;
                  
                  // Create comprehensive default pages
                  subsectionContent.pages = [
                    {
                      pageNumber: 1,
                      pageTitle: "Introduction & Foundation",
                      content: subsection?.summary || `Introduction to ${title}. This section covers the fundamental concepts and provides necessary background knowledge.`,
                      keyTakeaway: "Understanding the basic concepts and principles",
                      speedSolvingTechniques: `Quick recognition techniques for ${title} problems in ${course.examType || 'competitive'} exams.`,
                      commonTraps: `Common mistakes students make when approaching ${title} problems in exams.`,
                      timeManagementTips: `For ${title} questions, allocate approximately 1-2 minutes per question.`,
                      examSpecificStrategies: `Exams frequently test ${title} concepts through multiple-choice questions.`
                    },
                    {
                      pageNumber: 2,
                      pageTitle: "Core Theory & Principles - Part 1",
                      content: `Core theoretical concepts of ${title}. This section covers the fundamental principles and key theoretical frameworks.`,
                      keyTakeaway: "Understanding the core theoretical principles",
                      speedSolvingTechniques: `When solving ${title} problems, first identify the core principle being tested.`,
                      commonTraps: `Examiners often create questions with subtle variations of standard ${title} problems.`,
                      timeManagementTips: `For theoretical questions on ${title}, spend 30 seconds identifying the concept being tested.`,
                      examSpecificStrategies: `Exams typically include 3-5 questions on ${title} fundamentals.`
                    },
                    {
                      pageNumber: 3,
                      pageTitle: "Core Theory & Principles - Part 2",
                      content: `Advanced theoretical concepts of ${title}. This section builds on the fundamental principles with more complex theoretical frameworks.`,
                      keyTakeaway: "Mastering advanced theoretical principles",
                      speedSolvingTechniques: `Advanced techniques for solving ${title} problems.`,
                      commonTraps: `Common pitfalls in solving ${title} problems.`,
                      timeManagementTips: `For ${title} problems, allocate 15-20 minutes for each problem.`,
                      examSpecificStrategies: `Exams often test ${title} concepts through complex problems.`
                    },
                    {
                      pageNumber: 4,
                      pageTitle: "Core Theory & Principles - Part 3",
                      content: `Specialized theoretical aspects of ${title}. This section explores specialized theoretical concepts and their implications.`,
                      keyTakeaway: "Understanding specialized theoretical aspects",
                      speedSolvingTechniques: `Techniques for solving ${title} problems that require specialized knowledge.`,
                      commonTraps: `Common issues with ${title} problems.`,
                      timeManagementTips: `For ${title} problems, allocate 15-20 minutes for each problem.`,
                      examSpecificStrategies: `Exams may test ${title} concepts through specialized problems.`
                    },
                    {
                      pageNumber: 5,
                      pageTitle: "Core Theory & Principles - Part 4",
                      content: `Theoretical applications of ${title}. This section demonstrates how theoretical principles apply to practical scenarios.`,
                      keyTakeaway: "Applying theoretical principles in practice",
                      speedSolvingTechniques: `Practical applications of ${title} concepts.`,
                      commonTraps: `Common pitfalls in applying ${title} principles.`,
                      timeManagementTips: `For ${title} problems, allocate 15-20 minutes for each problem.`,
                      examSpecificStrategies: `Exams may test ${title} concepts through practical applications.`
                    },
                    {
                      pageNumber: 6,
                      pageTitle: "Core Theory & Principles - Part 5",
                      content: `Advanced theoretical applications of ${title}. This section explores sophisticated applications of theoretical principles.`,
                      keyTakeaway: "Mastering advanced theoretical applications",
                      speedSolvingTechniques: `Advanced applications of ${title} concepts.`,
                      commonTraps: `Common issues in advanced ${title} applications.`,
                      timeManagementTips: `For ${title} problems, allocate 15-20 minutes for each problem.`,
                      examSpecificStrategies: `Exams may test ${title} concepts through complex applications.`
                    },
                    {
                      pageNumber: 7,
                      pageTitle: "Essential Formulas & Derivations - Part 1",
                      content: `Key formulas and derivations for ${title}. This section presents essential mathematical formulas and step-by-step derivations.`,
                      keyTakeaway: "Mastering essential formulas and derivations",
                      speedSolvingTechniques: `Practical applications of ${title} formulas.`,
                      commonTraps: `Common pitfalls in using ${title} formulas.`,
                      timeManagementTips: `For ${title} problems, allocate 10-15 minutes for each problem.`,
                      examSpecificStrategies: `Exams may test ${title} formulas through practical applications.`
                    },
                    {
                      pageNumber: 8,
                      pageTitle: "Essential Formulas & Derivations - Part 2",
                      content: `Advanced formulas and complex derivations for ${title}. This section covers more sophisticated mathematical approaches.`,
                      keyTakeaway: "Understanding advanced formulas and complex derivations",
                      speedSolvingTechniques: `Advanced techniques for solving ${title} problems.`,
                      commonTraps: `Common pitfalls in solving ${title} problems.`,
                      timeManagementTips: `For ${title} problems, allocate 15-20 minutes for each problem.`,
                      examSpecificStrategies: `Exams often test ${title} concepts through complex problems.`
                    },
                    {
                      pageNumber: 9,
                      pageTitle: "Concept Applications & Examples - Part 1",
                      content: `Practical applications and examples of ${title}. This section demonstrates real-world applications through worked examples.`,
                      keyTakeaway: "Applying concepts to practical examples",
                      speedSolvingTechniques: `Applying ${title} concepts to real-world problems.`,
                      commonTraps: `Common pitfalls in applying ${title} concepts.`,
                      timeManagementTips: `For ${title} problems, allocate 15-20 minutes for each problem.`,
                      examSpecificStrategies: `Exams may test ${title} concepts through practical applications.`
                    },
                    {
                      pageNumber: 10,
                      pageTitle: "Concept Applications & Examples - Part 2",
                      content: `Advanced applications and complex examples of ${title}. This section explores sophisticated real-world scenarios.`,
                      keyTakeaway: "Mastering advanced applications and complex examples",
                      speedSolvingTechniques: `Advanced applications of ${title} concepts.`,
                      commonTraps: `Common issues in advanced ${title} applications.`,
                      timeManagementTips: `For ${title} problems, allocate 15-20 minutes for each problem.`,
                      examSpecificStrategies: `Exams may test ${title} concepts through complex applications.`
                    },
                    {
                      pageNumber: 11,
                      pageTitle: "Conceptual Problem Solving",
                      content: `Problem-solving approaches for ${title}. This section provides strategies for tackling complex problems and exercises.`,
                      keyTakeaway: "Developing effective problem-solving strategies",
                      speedSolvingTechniques: `Strategies for solving complex ${title} problems.`,
                      commonTraps: `Common pitfalls in problem-solving.`,
                      timeManagementTips: `For ${title} problems, allocate 15-20 minutes for each problem.`,
                      examSpecificStrategies: `Exams may test ${title} concepts through problem-solving exercises.`
                    },
                    {
                      pageNumber: 12,
                      pageTitle: "Short Tricks & Speed Techniques",
                      content: `Time-saving techniques and shortcuts for ${title}. This section presents methods to solve problems quickly and efficiently.`,
                      keyTakeaway: "Mastering speed techniques and shortcuts",
                      speedSolvingTechniques: `Speed solving techniques for ${title} problems.`,
                      commonTraps: `Common pitfalls in speed solving.`,
                      timeManagementTips: `For ${title} problems, allocate 10-15 minutes for each problem.`,
                      examSpecificStrategies: `Exams may test ${title} concepts through speed-solving exercises.`
                    }
                  ];
                }
                
                // Ensure each page has required fields and competitive exam fields
                subsectionContent.pages.forEach((page, pageIndex) => {
                  if (!page.pageTitle) {
                    page.pageTitle = `Page ${pageIndex + 1}`;
                  }
                  if (!page.content) {
                    page.content = `Content for ${page.pageTitle}`;
                  }
                  if (!page.keyTakeaway) {
                    page.keyTakeaway = `Key learning from ${page.pageTitle}`;
                  }
                  
                  // Add competitive exam fields if missing
                  if (!page.speedSolvingTechniques) {
                    page.speedSolvingTechniques = `Speed solving techniques for ${subsectionContent.subsectionTitle || title} - ${page.pageTitle}`;
                  }
                  if (!page.commonTraps) {
                    page.commonTraps = `Common traps and pitfalls for ${subsectionContent.subsectionTitle || title} - ${page.pageTitle}`;
                  }
                  if (!page.timeManagementTips) {
                    page.timeManagementTips = `Time management tips for ${subsectionContent.subsectionTitle || title} - ${page.pageTitle}`;
                  }
                  if (!page.examSpecificStrategies) {
                    page.examSpecificStrategies = `Exam-specific strategies for ${subsectionContent.subsectionTitle || title} - ${page.pageTitle}`;
                  }
                });
              }
            );
          });
          
          console.log("📚 DEBUG: Setting detailed content with validated pages");
          setDetailedContent(data.detailedContent);
          
          // Reset page tabs to ensure we're starting from the first page
          setCurrentPageTabs({});
        } else {
          console.log(
            "📚 DEBUG: No detailed content available, creating comprehensive fallback content"
          );

          // Create comprehensive fallback content structure from modules and subsections
          const fallbackContent = {};

          modules.forEach((module, moduleIndex) => {
            fallbackContent[moduleIndex] = {};

            const subsections = module.detailedSubsections || [];
            subsections.forEach((subsection, subsectionIndex) => {
              // Create more comprehensive pages from subsection content
              let pages = [];
              
              // If subsection already has pages, use them
              if (subsection.pages && Array.isArray(subsection.pages) && subsection.pages.length > 0) {
                pages = subsection.pages;
                console.log(`📚 DEBUG: Using existing ${pages.length} pages for module ${moduleIndex}, subsection ${subsectionIndex}`);
              } else {
                // Create comprehensive default pages
                pages = [
                  {
                    pageNumber: 1,
                    pageTitle: "Introduction & Foundation",
                    content: subsection.summary || `Introduction to ${subsection.title}. This section covers the fundamental concepts and provides necessary background knowledge.`,
                    keyTakeaway: "Understanding the basic concepts and principles",
                  },
                  {
                    pageNumber: 2,
                    pageTitle: "Core Theory & Principles - Part 1",
                    content: `Core theoretical concepts of ${subsection.title}. This section covers the fundamental principles and key theoretical frameworks.`,
                    keyTakeaway: "Understanding the core theoretical principles",
                  },
                  {
                    pageNumber: 3,
                    pageTitle: "Core Theory & Principles - Part 2",
                    content: `Advanced theoretical concepts of ${subsection.title}. This section builds on the fundamental principles with more complex theoretical frameworks.`,
                    keyTakeaway: "Mastering advanced theoretical principles",
                  },
                  {
                    pageNumber: 4,
                    pageTitle: "Core Theory & Principles - Part 3",
                    content: `Specialized theoretical aspects of ${subsection.title}. This section explores specialized theoretical concepts and their implications.`,
                    keyTakeaway: "Understanding specialized theoretical aspects",
                  },
                  {
                    pageNumber: 5,
                    pageTitle: "Core Theory & Principles - Part 4",
                    content: `Theoretical applications of ${subsection.title}. This section demonstrates how theoretical principles apply to practical scenarios.`,
                    keyTakeaway: "Applying theoretical principles in practice",
                  },
                  {
                    pageNumber: 6,
                    pageTitle: "Core Theory & Principles - Part 5",
                    content: `Advanced theoretical applications of ${subsection.title}. This section explores sophisticated applications of theoretical principles.`,
                    keyTakeaway: "Mastering advanced theoretical applications",
                  },
                  {
                    pageNumber: 7,
                    pageTitle: "Essential Formulas & Derivations - Part 1",
                    content: `Key formulas and derivations for ${subsection.title}. This section presents essential mathematical formulas and step-by-step derivations.`,
                    keyTakeaway: "Mastering essential formulas and derivations",
                  },
                  {
                    pageNumber: 8,
                    pageTitle: "Essential Formulas & Derivations - Part 2",
                    content: `Advanced formulas and complex derivations for ${subsection.title}. This section covers more sophisticated mathematical approaches.`,
                    keyTakeaway: "Understanding advanced formulas and complex derivations",
                  },
                  {
                    pageNumber: 9,
                    pageTitle: "Concept Applications & Examples - Part 1",
                    content: `Practical applications and examples of ${subsection.title}. This section demonstrates real-world applications through worked examples.`,
                    keyTakeaway: "Applying concepts to practical examples",
                  },
                  {
                    pageNumber: 10,
                    pageTitle: "Concept Applications & Examples - Part 2",
                    content: `Advanced applications and complex examples of ${subsection.title}. This section explores sophisticated real-world scenarios.`,
                    keyTakeaway: "Mastering advanced applications and complex examples",
                  },
                  {
                    pageNumber: 11,
                    pageTitle: "Conceptual Problem Solving",
                    content: `Problem-solving approaches for ${subsection.title}. This section provides strategies for tackling complex problems and exercises.`,
                    keyTakeaway: "Developing effective problem-solving strategies",
                  },
                  {
                    pageNumber: 12,
                    pageTitle: "Short Tricks & Speed Techniques",
                    content: `Time-saving techniques and shortcuts for ${subsection.title}. This section presents methods to solve problems quickly and efficiently.`,
                    keyTakeaway: "Mastering speed techniques and shortcuts",
                  }
                ];
                console.log(`📚 DEBUG: Created ${pages.length} default pages for module ${moduleIndex}, subsection ${subsectionIndex}`);
              }

              fallbackContent[moduleIndex][subsectionIndex] = {
                subsectionTitle: subsection.title,
                summary: subsection.summary || `Comprehensive overview of ${subsection.title}`,
                pages: pages,
                practicalExample: subsection.practicalExample || `Practical example demonstrating ${subsection.title}`,
                commonPitfalls: subsection.commonPitfalls || [`Common issues with ${subsection.title}`, "Best practices to avoid problems"],
                difficulty: subsection.difficulty || "Intermediate",
                estimatedTime: subsection.estimatedTime || "15-20 minutes"
              };
            });
          });

          console.log("📚 DEBUG: Created fallback content structure:", Object.keys(fallbackContent));
          setDetailedContent(fallbackContent);
          
          // Reset page tabs to ensure we're starting from the first page
          setCurrentPageTabs({});
        }
      } else {
        const errorText = await response.text();
        console.error(
          "🔍 DEBUG: Failed to fetch detailed content:",
          response.status,
          response.statusText,
          errorText
        );

        // Create fallback content structure here as well
        const fallbackContent = {};
        modules.forEach((module, moduleIndex) => {
          fallbackContent[moduleIndex] = {};

          const subsections = module.detailedSubsections || [];
          subsections.forEach((subsection, subsectionIndex) => {
            // Create more comprehensive pages from subsection content
            let pages = [];
            
            // If subsection already has pages, use them
            if (subsection.pages && Array.isArray(subsection.pages) && subsection.pages.length > 0) {
              pages = subsection.pages;
            } else {
              // Create comprehensive default pages
              pages = [
                {
                  pageNumber: 1,
                  pageTitle: "Introduction & Foundation",
                  content: subsection.summary || `Introduction to ${subsection.title}. This section covers the fundamental concepts and provides necessary background knowledge.`,
                  keyTakeaway: "Understanding the basic concepts and principles",
                },
                {
                  pageNumber: 2,
                  pageTitle: "Core Theory & Principles - Part 1",
                  content: `Core theoretical concepts of ${subsection.title}. This section covers the fundamental principles and key theoretical frameworks.`,
                  keyTakeaway: "Understanding the core theoretical principles",
                },
                {
                  pageNumber: 3,
                  pageTitle: "Core Theory & Principles - Part 2",
                  content: `Advanced theoretical concepts of ${subsection.title}. This section builds on the fundamental principles with more complex theoretical frameworks.`,
                  keyTakeaway: "Mastering advanced theoretical principles",
                },
                {
                  pageNumber: 4,
                  pageTitle: "Core Theory & Principles - Part 3",
                  content: `Specialized theoretical aspects of ${subsection.title}. This section explores specialized theoretical concepts and their implications.`,
                  keyTakeaway: "Understanding specialized theoretical aspects",
                },
                {
                  pageNumber: 5,
                  pageTitle: "Core Theory & Principles - Part 4",
                  content: `Theoretical applications of ${subsection.title}. This section demonstrates how theoretical principles apply to practical scenarios.`,
                  keyTakeaway: "Applying theoretical principles in practice",
                },
                {
                  pageNumber: 6,
                  pageTitle: "Core Theory & Principles - Part 5",
                  content: `Advanced theoretical applications of ${subsection.title}. This section explores sophisticated applications of theoretical principles.`,
                  keyTakeaway: "Mastering advanced theoretical applications",
                },
                {
                  pageNumber: 7,
                  pageTitle: "Essential Formulas & Derivations - Part 1",
                  content: `Key formulas and derivations for ${subsection.title}. This section presents essential mathematical formulas and step-by-step derivations.`,
                  keyTakeaway: "Mastering essential formulas and derivations",
                },
                {
                  pageNumber: 8,
                  pageTitle: "Essential Formulas & Derivations - Part 2",
                  content: `Advanced formulas and complex derivations for ${subsection.title}. This section covers more sophisticated mathematical approaches.`,
                  keyTakeaway: "Understanding advanced formulas and complex derivations",
                },
                {
                  pageNumber: 9,
                  pageTitle: "Concept Applications & Examples - Part 1",
                  content: `Practical applications and examples of ${subsection.title}. This section demonstrates real-world applications through worked examples.`,
                  keyTakeaway: "Applying concepts to practical examples",
                },
                {
                  pageNumber: 10,
                  pageTitle: "Concept Applications & Examples - Part 2",
                  content: `Advanced applications and complex examples of ${subsection.title}. This section explores sophisticated real-world scenarios.`,
                  keyTakeaway: "Mastering advanced applications and complex examples",
                },
                {
                  pageNumber: 11,
                  pageTitle: "Conceptual Problem Solving",
                  content: `Problem-solving approaches for ${subsection.title}. This section provides strategies for tackling complex problems and exercises.`,
                  keyTakeaway: "Developing effective problem-solving strategies",
                },
                {
                  pageNumber: 12,
                  pageTitle: "Short Tricks & Speed Techniques",
                  content: `Time-saving techniques and shortcuts for ${subsection.title}. This section presents methods to solve problems quickly and efficiently.`,
                  keyTakeaway: "Mastering speed techniques and shortcuts",
                }
              ];
            }

            fallbackContent[moduleIndex][subsectionIndex] = {
              subsectionTitle: subsection.title,
              summary: subsection.summary || `Comprehensive overview of ${subsection.title}`,
              pages: pages,
              practicalExample: subsection.practicalExample || `Practical example demonstrating ${subsection.title}`,
              commonPitfalls: subsection.commonPitfalls || [`Common issues with ${subsection.title}`, "Best practices to avoid problems"],
              difficulty: subsection.difficulty || "Intermediate",
              estimatedTime: subsection.estimatedTime || "15-20 minutes"
            };
          });
        });

        setDetailedContent(fallbackContent);
        toast.error("Could not load detailed content. Using simplified view.");
      }
    } catch (error) {
      console.error("🔍 DEBUG: Error fetching detailed content:", error);
      toast.error("Error loading content. Please try again later.");
      
      // Create fallback content structure for error case too
      const fallbackContent = {};
      modules.forEach((module, moduleIndex) => {
        fallbackContent[moduleIndex] = {};

        const subsections = module.detailedSubsections || [];
        subsections.forEach((subsection, subsectionIndex) => {
          // Create more comprehensive pages from subsection content
          let pages = [];
          
          // If subsection already has pages, use them
          if (subsection.pages && Array.isArray(subsection.pages) && subsection.pages.length > 0) {
            pages = subsection.pages;
          } else {
            // Create comprehensive default pages
            pages = [
              {
                pageNumber: 1,
                pageTitle: "Introduction & Foundation",
                content: subsection.summary || `Introduction to ${subsection.title}. This section covers the fundamental concepts and provides necessary background knowledge.`,
                keyTakeaway: "Understanding the basic concepts and principles",
              },
              {
                pageNumber: 2,
                pageTitle: "Core Theory & Principles - Part 1",
                content: `Core theoretical concepts of ${subsection.title}. This section covers the fundamental principles and key theoretical frameworks.`,
                keyTakeaway: "Understanding the core theoretical principles",
              },
              {
                pageNumber: 3,
                pageTitle: "Core Theory & Principles - Part 2",
                content: `Advanced theoretical concepts of ${subsection.title}. This section builds on the fundamental principles with more complex theoretical frameworks.`,
                keyTakeaway: "Mastering advanced theoretical principles",
              },
              {
                pageNumber: 4,
                pageTitle: "Core Theory & Principles - Part 3",
                content: `Specialized theoretical aspects of ${subsection.title}. This section explores specialized theoretical concepts and their implications.`,
                keyTakeaway: "Understanding specialized theoretical aspects",
              },
              {
                pageNumber: 5,
                pageTitle: "Core Theory & Principles - Part 4",
                content: `Theoretical applications of ${subsection.title}. This section demonstrates how theoretical principles apply to practical scenarios.`,
                keyTakeaway: "Applying theoretical principles in practice",
              },
              {
                pageNumber: 6,
                pageTitle: "Core Theory & Principles - Part 5",
                content: `Advanced theoretical applications of ${subsection.title}. This section explores sophisticated applications of theoretical principles.`,
                keyTakeaway: "Mastering advanced theoretical applications",
              },
              {
                pageNumber: 7,
                pageTitle: "Essential Formulas & Derivations - Part 1",
                content: `Key formulas and derivations for ${subsection.title}. This section presents essential mathematical formulas and step-by-step derivations.`,
                keyTakeaway: "Mastering essential formulas and derivations",
              },
              {
                pageNumber: 8,
                pageTitle: "Essential Formulas & Derivations - Part 2",
                content: `Advanced formulas and complex derivations for ${subsection.title}. This section covers more sophisticated mathematical approaches.`,
                keyTakeaway: "Understanding advanced formulas and complex derivations",
              },
              {
                pageNumber: 9,
                pageTitle: "Concept Applications & Examples - Part 1",
                content: `Practical applications and examples of ${subsection.title}. This section demonstrates real-world applications through worked examples.`,
                keyTakeaway: "Applying concepts to practical examples",
              },
              {
                pageNumber: 10,
                pageTitle: "Concept Applications & Examples - Part 2",
                content: `Advanced applications and complex examples of ${subsection.title}. This section explores sophisticated real-world scenarios.`,
                keyTakeaway: "Mastering advanced applications and complex examples",
              },
              {
                pageNumber: 11,
                pageTitle: "Conceptual Problem Solving",
                content: `Problem-solving approaches for ${subsection.title}. This section provides strategies for tackling complex problems and exercises.`,
                keyTakeaway: "Developing effective problem-solving strategies",
              },
              {
                pageNumber: 12,
                pageTitle: "Short Tricks & Speed Techniques",
                content: `Time-saving techniques and shortcuts for ${subsection.title}. This section presents methods to solve problems quickly and efficiently.`,
                keyTakeaway: "Mastering speed techniques and shortcuts",
              }
            ];
          }

          fallbackContent[moduleIndex][subsectionIndex] = {
            subsectionTitle: subsection.title,
            summary: subsection.summary || `Comprehensive overview of ${subsection.title}`,
            pages: pages,
            practicalExample: subsection.practicalExample || `Practical example demonstrating ${subsection.title}`,
            commonPitfalls: subsection.commonPitfalls || [`Common issues with ${subsection.title}`, "Best practices to avoid problems"],
            difficulty: subsection.difficulty || "Intermediate",
            estimatedTime: subsection.estimatedTime || "15-20 minutes"
          };
        });
      });

      setDetailedContent(fallbackContent);
    } finally {
      setLoadingDetailedContent(false);
    }
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
      `exam-progress-${course._id}`,
      JSON.stringify(progress)
    );
    onProgress?.(progress);
  };

  const handleQuizStart = async (
    difficulty,
    subsectionData,
    subsectionIndex
  ) => {
    if (!subsectionData) {
      toast.error("No subsection data available");
      return;
    }

    // Check if quiz exists for this subsection and difficulty
    const quizKey = `${subsectionIndex}_${difficulty.toLowerCase()}`;
    const existingQuiz = currentModuleData?.subsectionQuizzes?.[quizKey];

    if (!existingQuiz) {
      toast.error(
        `No ${difficulty.toLowerCase()} quiz available for this subsection`
      );
      return;
    }

    console.log("🎯 Loading existing quiz:", {
      quizKey,
      subsectionTitle: subsectionData.title,
      difficulty: difficulty.toLowerCase(),
      totalQuestions:
        existingQuiz.totalQuestions || existingQuiz.questions?.length || 0,
    });

    try {
      // Use the existing quiz data
      setQuizData({
        questions: existingQuiz.questions || [],
        subsectionTitle: existingQuiz.subsectionTitle || subsectionData.title,
        difficulty: difficulty.toLowerCase(),
        totalQuestions:
          existingQuiz.totalQuestions || existingQuiz.questions?.length || 0,
        createdAt: existingQuiz.createdAt,
      });
      setSelectedQuizDifficulty(difficulty);
      setShowQuiz(true);
      toast.success(`${difficulty} quiz loaded successfully!`);
    } catch (error) {
      console.error("Quiz loading error:", error);
      toast.error(`Failed to load ${difficulty.toLowerCase()} quiz`);
    }
  };

  const getQuizForSubsection = (moduleIndex, subsectionIndex, difficulty) => {
    const module = modules[moduleIndex];
    const quizKey = `${subsectionIndex}_${difficulty.toLowerCase()}`;
    return module?.subsectionQuizzes?.[quizKey] || null;
  };

  const hasQuizForSubsection = (moduleIndex, subsectionIndex, difficulty) => {
    return (
      getQuizForSubsection(moduleIndex, subsectionIndex, difficulty) !== null
    );
  };

  const handleQuizCompletion = (results) => {
    const quizKey = `${currentModule}-${currentSubsection}-${selectedQuizDifficulty}`;
    setQuizResults((prev) => ({
      ...prev,
      [quizKey]: results,
    }));

    // Mark subsection as completed if quiz score is good
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

  const resourceCategories = {
    books: { icon: BookOpen, label: "Books", color: "blue" },
    courses: { icon: GraduationCap, label: "Courses", color: "green" },
    articles: { icon: FileText, label: "Articles", color: "purple" },
    videos: { icon: Video, label: "Videos", color: "red" },
    tools: { icon: Wrench, label: "Tools", color: "orange" },
    websites: { icon: Globe, label: "Websites", color: "cyan" },
    exercises: { icon: Target, label: "Exercises", color: "pink" },
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  // Enhanced Resource Card Component (same as technical courses)
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
                <p className="text-slate-700 text-sm leading-relaxed line-clamp-3">
                  {resource.description}
                </p>
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

  // Helper function to get detailed content for a specific subsection
  const getDetailedSubsectionContent = (moduleIndex, subsectionIndex) => {
    console.log(
      `🔍 DEBUG: Getting detailed content for module ${moduleIndex}, subsection ${subsectionIndex}:`,
      {
        hasDetailedContent: !!detailedContent,
        hasModule: !!detailedContent?.[moduleIndex],
        hasSubsection: !!detailedContent?.[moduleIndex]?.[subsectionIndex],
        availableModules: detailedContent ? Object.keys(detailedContent) : [],
        availableSubsections: detailedContent?.[moduleIndex]
          ? Object.keys(detailedContent[moduleIndex])
          : [],
      }
    );

    // Check if we have detailed content
    if (
      !detailedContent ||
      !detailedContent[moduleIndex] ||
      !detailedContent[moduleIndex][subsectionIndex]
    ) {
      console.log(
        `🔍 DEBUG: No detailed content found for module ${moduleIndex}, subsection ${subsectionIndex}, creating fallback`
      );

      // If we have modules data, try to create fallback content
      if (modules && modules[moduleIndex]) {
        const module = modules[moduleIndex];
        const subsections = module.detailedSubsections || [];

        if (subsections[subsectionIndex]) {
          const subsection = subsections[subsectionIndex];

          // Check if subsection has pages
          console.log(`🔍 DEBUG: Checking subsection pages:`, {
            hasPages: !!subsection.pages,
            pagesLength: subsection.pages?.length || 0,
            firstPage: subsection.pages?.[0],
          });

          // Create comprehensive fallback subsection content
          let pages = [];
          
          // If subsection already has pages, use them
          if (subsection.pages && Array.isArray(subsection.pages) && subsection.pages.length > 0) {
            // Deep clone the pages to avoid reference issues
            pages = JSON.parse(JSON.stringify(subsection.pages));
            
            // Ensure each page has required fields
            pages.forEach((page, pageIndex) => {
              if (!page.pageNumber) {
                page.pageNumber = pageIndex + 1;
              }
              if (!page.pageTitle) {
                page.pageTitle = `Page ${pageIndex + 1}`;
              }
              if (!page.content) {
                page.content = `Content for ${page.pageTitle}`;
              }
              if (!page.keyTakeaway) {
                page.keyTakeaway = `Key learning from ${page.pageTitle}`;
              }
            });
            
            console.log(`🔍 DEBUG: Using ${pages.length} existing pages from subsection with validation`);
          } else {
            // Create comprehensive default pages
            pages = [
              {
                pageNumber: 1,
                pageTitle: "Introduction & Foundation",
                content: subsection.summary || `Introduction to ${subsection.title}. This section covers the fundamental concepts and provides necessary background knowledge.`,
                keyTakeaway: "Understanding the basic concepts and principles",
              },
              {
                pageNumber: 2,
                pageTitle: "Core Theory & Principles - Part 1",
                content: `Core theoretical concepts of ${subsection.title}. This section covers the fundamental principles and key theoretical frameworks.`,
                keyTakeaway: "Understanding the core theoretical principles",
              },
              {
                pageNumber: 3,
                pageTitle: "Core Theory & Principles - Part 2",
                content: `Advanced theoretical concepts of ${subsection.title}. This section builds on the fundamental principles with more complex theoretical frameworks.`,
                keyTakeaway: "Mastering advanced theoretical principles",
              },
              {
                pageNumber: 4,
                pageTitle: "Core Theory & Principles - Part 3",
                content: `Specialized theoretical aspects of ${subsection.title}. This section explores specialized theoretical concepts and their implications.`,
                keyTakeaway: "Understanding specialized theoretical aspects",
              },
              {
                pageNumber: 5,
                pageTitle: "Core Theory & Principles - Part 4",
                content: `Theoretical applications of ${subsection.title}. This section demonstrates how theoretical principles apply to practical scenarios.`,
                keyTakeaway: "Applying theoretical principles in practice",
              },
              {
                pageNumber: 6,
                pageTitle: "Core Theory & Principles - Part 5",
                content: `Advanced theoretical applications of ${subsection.title}. This section explores sophisticated applications of theoretical principles.`,
                keyTakeaway: "Mastering advanced theoretical applications",
              },
              {
                pageNumber: 7,
                pageTitle: "Essential Formulas & Derivations - Part 1",
                content: `Key formulas and derivations for ${subsection.title}. This section presents essential mathematical formulas and step-by-step derivations.`,
                keyTakeaway: "Mastering essential formulas and derivations",
              },
              {
                pageNumber: 8,
                pageTitle: "Essential Formulas & Derivations - Part 2",
                content: `Advanced formulas and complex derivations for ${subsection.title}. This section covers more sophisticated mathematical approaches.`,
                keyTakeaway: "Understanding advanced formulas and complex derivations",
              },
              {
                pageNumber: 9,
                pageTitle: "Concept Applications & Examples - Part 1",
                content: `Practical applications and examples of ${subsection.title}. This section demonstrates real-world applications through worked examples.`,
                keyTakeaway: "Applying concepts to practical examples",
              },
              {
                pageNumber: 10,
                pageTitle: "Concept Applications & Examples - Part 2",
                content: `Advanced applications and complex examples of ${subsection.title}. This section explores sophisticated real-world scenarios.`,
                keyTakeaway: "Mastering advanced applications and complex examples",
              },
              {
                pageNumber: 11,
                pageTitle: "Conceptual Problem Solving",
                content: `Problem-solving approaches for ${subsection.title}. This section provides strategies for tackling complex problems and exercises.`,
                keyTakeaway: "Developing effective problem-solving strategies",
              },
              {
                pageNumber: 12,
                pageTitle: "Short Tricks & Speed Techniques",
                content: `Time-saving techniques and shortcuts for ${subsection.title}. This section presents methods to solve problems quickly and efficiently.`,
                keyTakeaway: "Mastering speed techniques and shortcuts",
              }
            ];
            console.log(`🔍 DEBUG: Created ${pages.length} enhanced default pages for fallback`);
          }

          // Create a complete subsection content structure
          const fallbackSubsectionContent = {
            subsectionTitle: subsection.title,
            summary: subsection.summary || `Comprehensive overview of ${subsection.title}`,
            pages: pages,
            practicalExample: subsection.practicalExample || `Practical example demonstrating ${subsection.title}`,
            commonPitfalls: subsection.commonPitfalls || [`Common issues with ${subsection.title}`, "Best practices to avoid problems"],
            difficulty: subsection.difficulty || "Intermediate",
            estimatedTime: subsection.estimatedTime || "15-20 minutes"
          };
          
          console.log(`🔍 DEBUG: Created comprehensive fallback content for module ${moduleIndex}, subsection ${subsectionIndex}`);
          return fallbackSubsectionContent;
        }
      }

      // If we couldn't create fallback content, return a minimal structure
      console.log(`🔍 DEBUG: Creating minimal fallback content structure`);
      return {
        subsectionTitle: `Section ${subsectionIndex + 1}`,
        summary: "Content is being prepared for this section.",
        pages: [
          {
            pageNumber: 1,
            pageTitle: "Introduction",
            content: "This content is being prepared. Please check back later.",
            keyTakeaway: "Content is coming soon",
          }
        ],
        practicalExample: "Examples will be available soon.",
        commonPitfalls: ["Content is being prepared"],
        difficulty: "Intermediate",
        estimatedTime: "10-15 minutes"
      };
    }

    // Return the actual detailed content with validation
    const content = detailedContent[moduleIndex][subsectionIndex];
    
    // Ensure pages is always an array with at least one page
    if (!content.pages || !Array.isArray(content.pages) || content.pages.length === 0) {
      console.log(`🔍 DEBUG: No pages found in detailed content, creating enhanced default pages`);
      
      const subsection = modules[moduleIndex]?.detailedSubsections?.[subsectionIndex];
      const title = content.subsectionTitle || subsection?.title || "Content Section";
      
      // Create comprehensive default pages
      content.pages = [
        {
          pageNumber: 1,
          pageTitle: "Introduction & Foundation",
          content: content.summary || subsection?.summary || `Introduction to ${title}. This section covers the fundamental concepts and provides necessary background knowledge.`,
          keyTakeaway: "Understanding the basic concepts and principles",
        },
        {
          pageNumber: 2,
          pageTitle: "Core Theory & Principles - Part 1",
          content: `Core theoretical concepts of ${title}. This section covers the fundamental principles and key theoretical frameworks.`,
          keyTakeaway: "Understanding the core theoretical principles",
        },
        {
          pageNumber: 3,
          pageTitle: "Core Theory & Principles - Part 2",
          content: `Advanced theoretical concepts of ${title}. This section builds on the fundamental principles with more complex theoretical frameworks.`,
          keyTakeaway: "Mastering advanced theoretical principles",
        },
        {
          pageNumber: 4,
          pageTitle: "Core Theory & Principles - Part 3",
          content: `Specialized theoretical aspects of ${title}. This section explores specialized theoretical concepts and their implications.`,
          keyTakeaway: "Understanding specialized theoretical aspects",
        },
        {
          pageNumber: 5,
          pageTitle: "Core Theory & Principles - Part 4",
          content: `Theoretical applications of ${title}. This section demonstrates how theoretical principles apply to practical scenarios.`,
          keyTakeaway: "Applying theoretical principles in practice",
        },
        {
          pageNumber: 6,
          pageTitle: "Core Theory & Principles - Part 5",
          content: `Advanced theoretical applications of ${title}. This section explores sophisticated applications of theoretical principles.`,
          keyTakeaway: "Mastering advanced theoretical applications",
        },
        {
          pageNumber: 7,
          pageTitle: "Essential Formulas & Derivations - Part 1",
          content: `Key formulas and derivations for ${title}. This section presents essential mathematical formulas and step-by-step derivations.`,
          keyTakeaway: "Mastering essential formulas and derivations",
        },
        {
          pageNumber: 8,
          pageTitle: "Essential Formulas & Derivations - Part 2",
          content: `Advanced formulas and complex derivations for ${title}. This section covers more sophisticated mathematical approaches.`,
          keyTakeaway: "Understanding advanced formulas and complex derivations",
        },
        {
          pageNumber: 9,
          pageTitle: "Concept Applications & Examples - Part 1",
          content: `Practical applications and examples of ${title}. This section demonstrates real-world applications through worked examples.`,
          keyTakeaway: "Applying concepts to practical examples",
        },
        {
          pageNumber: 10,
          pageTitle: "Concept Applications & Examples - Part 2",
          content: `Advanced applications and complex examples of ${title}. This section explores sophisticated real-world scenarios.`,
          keyTakeaway: "Mastering advanced applications and complex examples",
        },
        {
          pageNumber: 11,
          pageTitle: "Conceptual Problem Solving",
          content: `Problem-solving approaches for ${title}. This section provides strategies for tackling complex problems and exercises.`,
          keyTakeaway: "Developing effective problem-solving strategies",
        },
        {
          pageNumber: 12,
          pageTitle: "Short Tricks & Speed Techniques",
          content: `Time-saving techniques and shortcuts for ${title}. This section presents methods to solve problems quickly and efficiently.`,
          keyTakeaway: "Mastering speed techniques and shortcuts",
        }
      ];
    } else {
      // Validate existing pages
      content.pages.forEach((page, pageIndex) => {
        if (!page.pageNumber) {
          page.pageNumber = pageIndex + 1;
        }
        if (!page.pageTitle) {
          page.pageTitle = `Page ${pageIndex + 1}`;
        }
        if (!page.content) {
          page.content = `Content for ${page.pageTitle}`;
        }
        if (!page.keyTakeaway) {
          page.keyTakeaway = `Key learning from ${page.pageTitle}`;
        }
      });
    }
    
    // Ensure other required fields exist
    if (!content.practicalExample) {
      const title = content.subsectionTitle || "this topic";
      content.practicalExample = `Practical example demonstrating ${title}`;
    }
    
    if (!content.commonPitfalls || !Array.isArray(content.commonPitfalls) || content.commonPitfalls.length === 0) {
      const title = content.subsectionTitle || "this topic";
      content.commonPitfalls = [`Common issues with ${title}`, "Best practices to avoid problems"];
    }
    
    if (!content.difficulty) {
      content.difficulty = "Intermediate";
    }
    
    if (!content.estimatedTime) {
      content.estimatedTime = "15-20 minutes";
    }
    
    console.log(`🔍 DEBUG: Returning detailed content with ${content.pages.length} validated pages`);
    return content;
  };

  // Helper functions for page tab navigation
  const getCurrentPageTab = (moduleIndex, subsectionIndex) => {
    const key = `${moduleIndex}-${subsectionIndex}`;
    const currentTab = currentPageTabs[key] || 0;
    console.log(`🔍 DEBUG: Getting current page tab for ${key}: ${currentTab}`);
    return currentTab;
  };

  const setCurrentPageTab = (moduleIndex, subsectionIndex, pageIndex) => {
    const key = `${moduleIndex}-${subsectionIndex}`;
    console.log(`🔍 DEBUG: Setting page tab for ${key} to ${pageIndex}`);
    
    // Get the subsection content to check available pages
    const subsectionContent = getDetailedSubsectionContent(moduleIndex, subsectionIndex);
    
    // Ensure we have valid pages
    if (!subsectionContent || !subsectionContent.pages || !Array.isArray(subsectionContent.pages)) {
      console.log(`🔍 DEBUG: No valid pages found for module ${moduleIndex}, subsection ${subsectionIndex}`);
    setCurrentPageTabs((prev) => ({
      ...prev,
        [key]: 0,
      }));
      return;
    }
    
    const totalPages = subsectionContent.pages.length;
    console.log(`🔍 DEBUG: Total pages for module ${moduleIndex}, subsection ${subsectionIndex}: ${totalPages}`);
    
    // Ensure pageIndex is valid
    let validPageIndex = pageIndex;
    if (totalPages > 0) {
      // Clamp to valid range
      if (pageIndex < 0) {
        validPageIndex = 0;
        console.log(`🔍 DEBUG: Clamping page index to minimum: 0`);
      } else if (pageIndex >= totalPages) {
        validPageIndex = totalPages - 1;
        console.log(`🔍 DEBUG: Clamping page index to maximum: ${totalPages - 1}`);
      }
    } else {
      validPageIndex = 0;
      console.log(`🔍 DEBUG: No pages available, setting to 0`);
    }
    
    // Update the page tab
    setCurrentPageTabs((prev) => {
      const newTabs = {
        ...prev,
        [key]: validPageIndex,
      };
      console.log(`🔍 DEBUG: Updated page tabs:`, newTabs);
      return newTabs;
    });
    
    // Log the page we're navigating to
    const page = subsectionContent.pages[validPageIndex];
    if (page) {
      console.log(`🔍 DEBUG: Navigating to page ${validPageIndex + 1}: "${page.pageTitle}"`);
    }
    
    // Track progress when navigating to a new page
    saveProgress();
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    const newVisibility = !sidebarVisible;
    setSidebarVisible(newVisibility);
    setSidebarManuallyToggled(true);

    // If user manually hides it, allow hover to work again after a delay
    if (!newVisibility) {
      setTimeout(() => setSidebarManuallyToggled(false), 2000);
    }
  };

  // Handle mouse hover for sidebar
  const handleMouseEnter = () => {
    if (!sidebarManuallyToggled) {
      setSidebarVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (!sidebarManuallyToggled) {
      setSidebarVisible(false);
    }
  };

  const handleModuleSelect = (moduleIndex) => {
    setCurrentModule(moduleIndex);
    setCurrentSubsection(0);
    setCurrentPage(0);
    setShowModuleList(false);
    // Keep sidebar visible after module selection
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Hover trigger for sidebar */}
      <div
        className="fixed left-0 top-0 w-4 h-full z-50 bg-transparent"
        onMouseEnter={handleMouseEnter}
      />

      {/* Header */}
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
                <ChevronLeft className="h-5 w-5 mr-2" />
                Back to Library
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
                <h1 className="text-2xl font-bold">{course.title}</h1>
                <div className="text-orange-100 flex items-center gap-2 mt-1">
                  <Trophy className="h-4 w-4" />
                  {course.examType} • {course.subject}
                  <Badge className="bg-white/20 text-white border-white/30 ml-2">
                    {course.level || "Intermediate"}
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
          {/* Sidebar - Module Navigation */}
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
                  <BookOpen className="h-5 w-5" />
                  Course Modules
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

          {/* Main Content */}
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
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Complete
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
                      value="subsections"
                      className="flex items-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      Subsections
                    </TabsTrigger>
                    <TabsTrigger
                      value="resources"
                      className="flex items-center gap-2"
                    >
                      <BookOpen className="h-4 w-4" />
                      Resources
                    </TabsTrigger>
                    <TabsTrigger
                      value="progress"
                      className="flex items-center gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Progress
                    </TabsTrigger>
                  </TabsList>

                  {/* Content Tab */}
                  <TabsContent value="content" className="p-6">
                    <div className="space-y-6">
                      {/* Module Overview */}
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                          Module Overview
                        </h3>
                        <div className="prose max-w-none">
                          {currentModuleData?.content ? (
                            <MathMarkdownRenderer
                              content={currentModuleData.content}
                            />
                          ) : (
                            <p className="text-gray-500 italic">
                              No content available
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Learning Objectives */}
                      {currentModuleData?.objectives && (
                        <div className="bg-blue-50 p-6 rounded-xl">
                          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Target className="h-5 w-5 text-blue-600" />
                            Learning Objectives
                          </h3>
                          <ul className="space-y-2">
                            {currentModuleData.objectives.map(
                              (objective, index) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-3"
                                >
                                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                                    {index + 1}
                                  </div>
                                  <div className="text-gray-700 flex-1">
                                    <MathMarkdownRenderer content={objective} />
                                  </div>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                      {/* Key Examples */}
                      {currentModuleData?.examples && (
                        <div className="bg-green-50 p-6 rounded-xl">
                          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-green-600" />
                            Key Examples
                          </h3>
                          <div className="space-y-4">
                            {currentModuleData.examples.map(
                              (example, index) => (
                                <div
                                  key={index}
                                  className="bg-white p-4 rounded-lg shadow-sm"
                                >
                                  <div className="flex items-start gap-3">
                                    <Badge className="bg-green-100 text-green-800 mt-1">
                                      Example {index + 1}
                                    </Badge>
                                    <div className="flex-1">
                                      <div className="text-gray-700 whitespace-pre-wrap">
                                        <MathMarkdownRenderer
                                          content={example}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Subsections Tab */}
                  <TabsContent value="subsections" className="p-3 sm:p-6">
                    <div className="space-y-4 sm:space-y-6">
                      {subsections.length === 0 ? (
                        <div className="text-center py-8 sm:py-12">
                          <Sparkles className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 text-base sm:text-lg">
                            No detailed subsections available
                          </p>
                        </div>
                      ) : (
                        subsections.map((subsection, index) => {
                          const isCompleted = completedSubsections.has(
                            `${currentModule}-${index}`
                          );
                          const quizResults = getQuizResultsForSubsection(
                            currentModule,
                            index
                          );
                          const sectionKey = `subsection-${index}`;
                          const isExpanded = expandedSections.has(sectionKey);

                          return (
                            <Card
                              key={index}
                              className={`border-2 transition-all duration-300 ${
                                isCompleted
                                  ? "border-green-300 bg-green-50"
                                  : "border-gray-200 hover:border-orange-300"
                              }`}
                            >
                              <CardHeader className="pb-3 p-4 sm:p-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                    <div
                                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        isCompleted
                                          ? "bg-green-500 text-white"
                                          : "bg-orange-500 text-white"
                                      }`}
                                    >
                                      {isCompleted ? (
                                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                      ) : (
                                        <span className="font-bold text-sm sm:text-base">
                                          {index + 1}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <CardTitle className="text-base sm:text-lg truncate">
                                        {subsection.title}
                                      </CardTitle>
                                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                        {subsection.estimatedTime || 15} min •{" "}
                                        {subsection.difficulty || "medium"}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleSection(sectionKey)}
                                      className="w-8 h-8 sm:w-10 sm:h-10"
                                    >
                                      {isExpanded ? (
                                        <ChevronUp className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>

                              {isExpanded && (
                                <CardContent className="p-3 sm:p-4 lg:p-6">
                                  {/* Subsection Content Container */}
                                  <div className="space-y-4 sm:space-y-6">
                                    {loadingDetailedContent ? (
                                      <div className="flex items-center justify-center py-8 sm:py-12">
                                        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-orange-500"></div>
                                        <span className="ml-2 text-gray-600 text-sm sm:text-base">
                                          Loading detailed content...
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="w-full">
                                        {(() => {
                                          // Get detailed content for this subsection
                                          const detailedSubsectionContent =
                                            getDetailedSubsectionContent(
                                              currentModule,
                                              index
                                            );

                                          // Ensure we have a valid pages array
                                          let pages = [];

                                          if (
                                            detailedSubsectionContent?.pages &&
                                            Array.isArray(
                                              detailedSubsectionContent.pages
                                            ) &&
                                            detailedSubsectionContent.pages
                                              .length > 0
                                          ) {
                                            pages =
                                              detailedSubsectionContent.pages;
                                            console.log(
                                              `🔍 DEBUG: Found ${pages.length} pages for subsection ${index}`
                                            );
                                          } else {
                                            // Create default pages if none exist
                                            pages = [
                                              {
                                                pageNumber: 1,
                                                pageTitle: "Content",
                                                content:
                                                  "Content is being prepared for this section.",
                                                keyTakeaway:
                                                  "Content coming soon",
                                              },
                                            ];
                                          console.log(
                                              `🔍 DEBUG: Created default page for subsection ${index}`
                                            );
                                          }

                                          // Get current page index with safety check
                                          const currentPageIndex = Math.min(
                                            getCurrentPageTab(
                                              currentModule,
                                              index
                                            ),
                                            pages.length - 1
                                          );

                                          // Get current page with safety check
                                          const currentPageToDisplay = pages[currentPageIndex] || pages[0];
                                          
                                          console.log(
                                            `🔍 DEBUG: Rendering page ${currentPageIndex + 1}/${pages.length} for subsection ${index}:`,
                                            currentPageToDisplay?.pageTitle || "No title"
                                          );

                                            return (
                                            <div key={`subsection-${index}`}>
                                              {/* Page navigation tabs */}
                                              <div className="mb-6">
                                                <div className="flex items-center justify-between mb-2">
                                                  <h4 className="text-lg font-semibold text-gray-800">
                                                    Pages
                                                  </h4>
                                                  <div className="text-sm text-gray-500">
                                                    {currentPageIndex + 1} of {pages.length}
                                                  </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2 pb-2">
                                                  {pages.map((page, pageIdx) => (
                                                    <button
                                                      key={`page-${pageIdx}`}
                                                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                                                        pageIdx === currentPageIndex
                                                          ? "bg-orange-500 text-white"
                                                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                      }`}
                                                      onClick={() => setCurrentPageTab(currentModule, index, pageIdx)}
                                                      title={page.pageTitle || `Page ${pageIdx + 1}`}
                                                    >
                                                      {pageIdx + 1}
                                                    </button>
                                                  ))}
                                                </div>
                                              </div>

                                              {/* Page header */}
                                              <div className="flex items-center gap-4 mb-6 border-b-2 border-gray-100 pb-4">
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                  {currentPageToDisplay.pageNumber || currentPageIndex + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 line-clamp-2">
                                                    {currentPageToDisplay.pageTitle || `Page ${currentPageToDisplay.pageNumber || currentPageIndex + 1}`}
                                                  </h3>
                                                </div>
                                              </div>

                                              {/* Page Content */}
                                              <div className="bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6 lg:p-8 rounded-xl border border-gray-200 shadow-sm space-y-8">
                                                <MathMarkdownRenderer
                                                  content={
                                                    currentPageToDisplay.content ||
                                                    "No content available for this page."
                                                  }
                                                />

                                                {currentPageToDisplay.keyTakeaway && (
                                                  <section className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2 text-blue-800">
                                                      <Star className="h-5 w-5 text-blue-600" />
                                                      Key Takeaway
                                                    </h4>
                                                    <MathMarkdownRenderer content={currentPageToDisplay.keyTakeaway} />
                                                  </section>
                                                )}

                                                {currentPageToDisplay.speedSolvingTechniques && (
                                                  <section className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                                                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2 text-green-800">
                                                      <Zap className="h-5 w-5 text-green-600" />
                                                      Speed Solving Techniques
                                                    </h4>
                                                    <MathMarkdownRenderer content={currentPageToDisplay.speedSolvingTechniques} />
                                                  </section>
                                                )}

                                                {currentPageToDisplay.commonTraps && (
                                                  <section className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2 text-yellow-800">
                                                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                                      Common Traps & Pitfalls
                                                    </h4>
                                                    <MathMarkdownRenderer content={currentPageToDisplay.commonTraps} />
                                                  </section>
                                                )}

                                                {currentPageToDisplay.timeManagementTips && (
                                                  <section className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                                                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2 text-purple-800">
                                                      <Timer className="h-5 w-5 text-purple-600" />
                                                      Time Management Tips
                                                    </h4>
                                                    <MathMarkdownRenderer content={currentPageToDisplay.timeManagementTips} />
                                                  </section>
                                                )}

                                                {currentPageToDisplay.examSpecificStrategies && (
                                                  <section className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                                                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2 text-red-800">
                                                      <Medal className="h-5 w-5 text-red-600" />
                                                      Exam-Specific Strategies
                                                    </h4>
                                                    <MathMarkdownRenderer content={currentPageToDisplay.examSpecificStrategies} />
                                                  </section>
                                                )}
                                              </div>

                                              {/* Navigation between pages */}
                                              <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-200">
                                                <Button
                                                  onClick={() => setCurrentPageTab(currentModule, index, currentPageIndex - 1)}
                                                  disabled={currentPageIndex === 0}
                                                  variant="outline"
                                                >
                                                  <ChevronLeft className="h-4 w-4 mr-2" />
                                                  Previous
                                                </Button>
                                                <span className="text-sm font-medium text-gray-600">
                                                  Page {currentPageIndex + 1} of {pages.length}
                                                </span>
                                                <Button
                                                  onClick={() => setCurrentPageTab(currentModule, index, currentPageIndex + 1)}
                                                  disabled={currentPageIndex === pages.length - 1}
                                                >
                                                  Next
                                                  <ChevronRight className="h-4 w-4 ml-2" />
                                                </Button>
                                              </div>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    )}

                                    {/* Quiz Section */}
                                    <div className="mt-6 border-t border-gray-200 pt-6">
                                      <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Trophy className="h-5 w-5 text-orange-500" />
                                        Test Your Knowledge
                                      </h4>
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {["Easy", "Medium", "Hard"].map((difficulty) => (
                                          <Button
                                            key={difficulty}
                                            variant="outline"
                                            onClick={() => handleQuizStart(difficulty, subsection, index)}
                                            disabled={!hasQuizForSubsection(currentModule, index, difficulty)}
                                          >
                                            {difficulty} Quiz
                                          </Button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              )}
                            </Card>
                          );
                        })
                      )}
                    </div>
                  </TabsContent>

                  {/* Resources Tab */}
                  <TabsContent value="resources" className="p-3 sm:p-6">
                    <div className="space-y-6">
                      {Object.entries(resourceCategories).map(([key, value]) => {
                        const resources = currentModuleData?.resources?.[key];
                        if (resources && resources.length > 0) {
                          return (
                            <div key={key}>
                              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <value.icon className={`h-5 w-5 text-${value.color}-500`} />
                                {value.label}
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {resources.map((resource, index) => (
                                  <ResourceCard
                                    key={index}
                                    resource={resource}
                                    type={key}
                                    resourceIndex={index}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </TabsContent>

                  {/* Progress Tab */}
                  <TabsContent value="progress" className="p-3 sm:p-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">
                          Module Progress
                        </h3>
                        <div className="space-y-4">
                          {modules.map((module, index) => (
                            <div key={index}>
                              <div className="flex justify-between mb-1">
                                <span className="text-base font-medium text-gray-700">{module.title}</span>
                                <span className="text-sm font-medium text-gray-500">{getModuleProgress(index)}%</span>
                              </div>
                              <Progress value={getModuleProgress(index)} />
                            </div>
                          ))}
                        </div>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">
                          Quiz Results
                        </h3>
                        <div className="space-y-4">
                          {subsections.map((subsection, subIndex) => {
                            const results = getQuizResultsForSubsection(currentModule, subIndex);
                            return Object.keys(results).length > 0 ? (
                              <div key={subIndex}>
                                <h4 className="font-semibold text-gray-700">{subsection.title}</h4>
                                <ul className="list-disc list-inside mt-2">
                                  {Object.entries(results).map(([difficulty, result]) => (
                                    <li key={difficulty}>
                                      {difficulty}: {result.score}%
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quiz Interface Component
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
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));
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
    <div className="space-y-6">
      {/* Quiz Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge className="bg-orange-100 text-orange-800">
            Question {currentQuestion + 1} of {questions.length}
          </Badge>
          <Progress
            value={((currentQuestion + 1) / questions.length) * 100}
            className="w-32"
          />
        </div>
        <div className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-orange-600" />
          <span
            className={`font-mono text-lg ${
              timeLeft < 60 ? "text-red-600" : "text-orange-600"
            }`}
          >
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Question */}
      <Card className="border-2 border-orange-200">
        <CardHeader>
          <CardTitle className="text-lg">{currentQ?.question}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentQ?.options?.map((option, index) => (
              <Button
                key={index}
                variant={
                  selectedAnswers[currentQuestion] === option
                    ? "default"
                    : "outline"
                }
                className={`w-full justify-start text-left p-4 h-auto ${
                  selectedAnswers[currentQuestion] === option
                    ? "bg-orange-500 text-white border-orange-500"
                    : "hover:bg-orange-50 border-orange-200"
                }`}
                onClick={() => handleAnswerSelect(currentQuestion, option)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedAnswers[currentQuestion] === option
                        ? "border-white bg-white text-orange-500"
                        : "border-orange-300"
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span>{option}</span>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {questions.map((_, index) => (
            <Button
              key={index}
              variant={currentQuestion === index ? "default" : "outline"}
              size="sm"
              className={`w-8 h-8 p-0 ${
                selectedAnswers[index] ? "bg-green-100 border-green-300" : ""
              }`}
              onClick={() => setCurrentQuestion(index)}
            >
              {index + 1}
            </Button>
          ))}
        </div>

        {currentQuestion === questions.length - 1 ? (
          <Button
            onClick={handleSubmit}
            className="bg-green-500 hover:bg-green-600"
            disabled={Object.keys(selectedAnswers).length === 0}
          >
            Submit Quiz
            <CheckCircle className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={() =>
              setCurrentQuestion(
                Math.min(questions.length - 1, currentQuestion + 1)
              )
            }
            disabled={currentQuestion === questions.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
