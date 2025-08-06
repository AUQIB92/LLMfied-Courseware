"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  BookOpen,
  Video,
  FileText,
  Globe,
  Wrench,
  Target,
  Lightbulb,
  Sparkles,
  Wand2,
  GraduationCap,
  Brain,
  Zap,
  Trophy,
  Timer,
  Award,
  CheckCircle,
  AlertCircle,
  Edit,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Settings,
  Users,
  Clock,
  Layers,
  Network,
  Calculator,
  RefreshCw,
  Eye,
  Download,
  Share2,
  BarChart3,
  TrendingUp,
  ExternalLink,
  Loader2,
} from "lucide-react";
import MathMarkdownRenderer from "@/components/MathMarkdownRenderer";
import UniversalContentRenderer from "@/components/UniversalContentRenderer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AIProviderSelector from "@/components/educator/AIProviderSelector";

// Add CSS for 3D flip cards
const flipCardStyles = `
  .perspective-1000 {
    perspective: 1000px;
  }
  
  .transform-style-preserve-3d {
    transform-style: preserve-3d;
  }
  
  .backface-hidden {
    backface-visibility: hidden;
  }
  
  .rotate-y-180 {
    transform: rotateY(180deg);
  }
  
  .group:hover .hover\\:rotate-y-180 {
    transform: rotateY(180deg);
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.textContent = flipCardStyles;
  document.head.appendChild(styleElement);
}

// Helper function to handle academic flashcard content
function getAcademicSubsectionData(subsection) {
  console.log("🔍 getAcademicSubsectionData called with:", {
    hasPages: !!subsection.pages,
    pagesLength: subsection.pages?.length || 0,
    hasFlashcards: !!subsection.pages?.[0]?.flashcards,
    isFlashcardContent: subsection.pages?.[0]?.isFlashcardContent,
    subsectionKeys: Object.keys(subsection),
  });

  // Handle both flashcards and multipage content for academic courses
  console.log(
    "📚 Processing academic content (flashcards or pages) for:",
    subsection.title
  );

  // Check if we have generated multipage content (prioritize multipage for user's request)
  if (
    subsection.pages &&
    Array.isArray(subsection.pages) &&
    subsection.pages.length > 0 &&
    !subsection.pages[0].flashcards // If no flashcards, treat as multipage
  ) {
    console.log(
      "✅ Using multipage content for academic subsection:",
      subsection.pages.length,
      "pages"
    );
    return {
      type: "pages",
      data: {
        pages: subsection.pages.map((page) => ({
          ...page,
          title: page.title || page.pageTitle || "Page Content",
          content: page.content || "Content will be available after generation",
        })),
        title: subsection.title || "Academic Subsection",
        summary: subsection.summary || "Academic multipage content",
        difficulty: subsection.difficulty || "Intermediate",
        estimatedTime: subsection.estimatedTime || "15-20 minutes",
      },
    };
  }

  // Check if we have generated flashcard content
  if (
    subsection.pages &&
    Array.isArray(subsection.pages) &&
    subsection.pages.length > 0 &&
    subsection.pages[0].flashcards &&
    Array.isArray(subsection.pages[0].flashcards)
  ) {
    const flashcards = subsection.pages[0].flashcards;
    console.log(
      "✅ Using existing flashcard content for academic subsection:",
      flashcards.length,
      "flashcards"
    );
    return {
      type: "flashcards",
      data: {
        ...subsection,
        flashcards: flashcards,
        title: subsection.title || "Academic Subsection",
        summary:
          subsection.pages[0].content ||
          "Academic flashcards for study and review",
        difficulty: "Intermediate",
        estimatedTime: "10-15 minutes",
        // Remove page data since we're using flashcards
        pages: undefined,
        conceptFlashCards: undefined,
        formulaFlashCards: undefined,
        conceptGroups: undefined,
      },
    };
  }

  // Check for legacy pages structure (fallback to convert to flashcards)
  if (
    subsection.pages &&
    Array.isArray(subsection.pages) &&
    subsection.pages.length > 0
  ) {
    console.log("🔄 Converting legacy pages to flashcard structure");
    // Create basic flashcards from page content
    const basicFlashcards = [
      {
        id: 1,
        question: `What is ${subsection.title}?`,
        answer:
          subsection.pages[0].content?.substring(0, 200) ||
          "Academic concept to be studied",
        category: "definition",
        difficulty: "basic",
      },
      {
        id: 2,
        question: `Why is ${subsection.title} important?`,
        answer:
          subsection.pages[0].keyTakeaway ||
          "Important for academic understanding",
        category: "concept",
        difficulty: "intermediate",
      },
      {
        id: 3,
        question: `How does ${subsection.title} apply in practice?`,
        answer: "Practical applications will be covered in detailed study",
        category: "application",
        difficulty: "intermediate",
      },
      {
        id: 4,
        question: `What should students remember about ${subsection.title}?`,
        answer: "Key concepts and principles for academic success",
        category: "concept",
        difficulty: "intermediate",
      },
      {
        id: 5,
        question: `How does ${subsection.title} connect to broader topics?`,
        answer: "Connects theoretical knowledge with practical applications",
        category: "analysis",
        difficulty: "advanced",
      },
    ];

    return {
      type: "flashcards",
      data: {
        ...subsection,
        flashcards: basicFlashcards,
        title: subsection.title || "Academic Subsection",
        summary: "Converted legacy content to flashcard format",
        difficulty: "Intermediate",
        estimatedTime: "10-15 minutes",
        pages: undefined,
        conceptFlashCards: undefined,
        formulaFlashCards: undefined,
        conceptGroups: undefined,
      },
    };
  }

  // Create empty multipage structure for academic content (user requested multipage)
  console.log("📄 Creating empty multipage structure for academic content");
  return {
    type: "pages",
    data: {
      pages: [
        {
          title: "Introduction",
          pageTitle: "Introduction",
          content:
            "Content will be generated for this academic topic. Click 'Generate Enhanced Academic Content' to create detailed multipage content.",
          keyTakeaway:
            "This section will contain key learning objectives and important concepts.",
        },
      ],
      title: subsection.title || "Academic Subsection",
      summary:
        "Generate detailed content to see multipage academic content with comprehensive explanations and examples",
      difficulty: "Intermediate",
      estimatedTime: "15-20 minutes",
    },
  };
}

function parseMarkdownToPages(markdown) {
  if (!markdown || typeof markdown !== "string") {
    return [];
  }

  // Split by newline followed by "####" and any whitespace
  const sections = markdown.split(/\\n####\\s+/);
  const pages = [];

  // The first element of split() is the content before the first delimiter
  const introContent = sections.shift()?.trim();

  // If there's content before the first "####", add it as an "Introduction" page
  if (introContent) {
    pages.push({ title: "Introduction", content: introContent });
  }

  sections.forEach((section) => {
    const lines = section.split("\\n");
    const title = lines.shift()?.trim() || "Untitled Section";
    const content = lines.join("\\n").trim();
    if (title && content) {
      pages.push({ title, content });
    }
  });

  // If, after all that, we have no pages but there was intro content,
  // it means there were no "####" delimiters. Treat the whole thing as one page.
  if (pages.length === 0 && introContent) {
    return [{ title: "Content", content: introContent }];
  }

  return pages;
}

function parseMarkdownToSubsections(markdownContent) {
  if (!markdownContent) {
    return [];
  }

  const subsections = [];
  const lines = markdownContent.split("\n");
  let currentSubsection = null;

  lines.forEach((line) => {
    // Match ###, ####, etc. but NOT ##
    const match = line.match(/^(###+)\s+(.*)/);
    if (match) {
      if (currentSubsection) {
        subsections.push(currentSubsection);
      }
      currentSubsection = {
        title: match[2].trim(),
        content: "",
      };
    } else if (currentSubsection && !line.match(/^##\s+.*/)) {
      // Ignore module titles
      currentSubsection.content += line + "\n";
    }
  });

  if (currentSubsection) {
    subsections.push(currentSubsection);
  }

  return subsections.map((sub) => ({ ...sub, content: sub.content.trim() }));
}

export default function AcademicModuleEditorEnhanced({
  module,
  onUpdate,
  academicLevel,
  subject,
  semester,
  course,
  courseId,
  onSaveSuccess,
}) {
  const { getAuthHeaders, user, apiCall, isTokenValid } = useAuth();

  // Safety check for required props
  if (!module) {
    console.error("AcademicModuleEditorEnhanced: module prop is required");
    return (
      <div className="p-4 text-center text-red-600">
        Error: Module data is required
      </div>
    );
  }

  // Helper function to safely render content
  const safeContent = (content) => {
    if (typeof content === "string") return content;
    if (content == null) return "";
    return JSON.stringify(content);
  };

  // Helper function to ensure proper page structure
  const ensurePageStructure = (subsection, pageIndex) => {
    if (!subsection.pages) {
      subsection.pages = [];
    }
    
    if (!subsection.pages[pageIndex]) {
      subsection.pages[pageIndex] = {
        content: subsection.explanation || subsection.content || subsection.generatedMarkdown || "",
        pageTitle: subsection.title || "Academic Content",
        title: subsection.title || "Academic Content",
        keyTakeaway: subsection.keyTakeaway || "",
        pageNumber: pageIndex + 1
      };
    }
    
    return subsection.pages[pageIndex];
  };

  // Initialize local module state for editing
  const [localModule, setLocalModule] = useState(() => {
    const initialState = {
      ...module,
      // Ensure required fields are initialized
      title: module.title || "",
      content: module.content || "",
      summary: module.summary || "",
      objectives: module.objectives || [],
      examples: module.examples || [],
      detailedSubsections: module.detailedSubsections || [],
      // Academic course specific fields
      isAcademicCourse: course?.isAcademicCourse || true,
      courseType: course?.courseType || "academic",
      academicLevel: academicLevel || course?.academicLevel || "undergraduate",
      semester: semester || course?.semester || 1,
      hasUnits: module.hasUnits || false,
      unitStructure: module.unitStructure || {},
    };

    console.log("📝 Initializing localModule state:", {
      moduleTitle: initialState.title,
      hasContent: !!initialState.content,
      contentLength: initialState.content?.length,
      hasDetailedSubsections: !!initialState.detailedSubsections?.length,
      isAcademicCourse: initialState.isAcademicCourse,
      originalModule: module,
    });

    return initialState;
  });

  // Track if module has been modified
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState("saved"); // "saved", "editing", "saving"

  // Debounced parent update to prevent constant saving while editing
  const [updateTimeout, setUpdateTimeout] = useState(null);

  // Page editing state
  const [editingPage, setEditingPage] = useState(null); // { subsectionIndex, pageIndex }
  const [editingContent, setEditingContent] = useState("");
  const [editingTitle, setEditingTitle] = useState("");
  const [editingTakeaway, setEditingTakeaway] = useState("");
  
  // Use ref to persist editing state across re-renders
  const editingStateRef = useRef(null);

  // Debug render cycles and editing state
  console.log("🔄 AcademicModuleEditorEnhanced render", {
    moduleTitle: module.title,
    timestamp: new Date().toISOString(),
    editingPage,
    hasDetailedSubsections: !!localModule.detailedSubsections?.length,
    detailedSubsectionsCount: localModule.detailedSubsections?.length || 0
  });

  // Debug subsection structure when editing
  if (editingPage) {
    const subsection = localModule.detailedSubsections[editingPage.subsectionIndex];
    console.log("🔍 Current subsection structure:", {
      subsectionTitle: subsection?.title,
      hasPages: !!subsection?.pages,
      pagesLength: subsection?.pages?.length || 0,
      pageData: subsection?.pages?.[editingPage.pageIndex],
      allFields: Object.keys(subsection || {})
    });
  }

  // Ensure editing state is always in sync
  useEffect(() => {
    if (editingPage) {
      editingStateRef.current = editingPage;
    } else {
      editingStateRef.current = null;
    }
  }, [editingPage]);

  // Monitor editing content changes
  useEffect(() => {
    if (editingPage) {
      console.log("📝 Editing content changed:", {
        editingPage,
        contentLength: editingContent.length,
        titleLength: editingTitle.length,
        takeawayLength: editingTakeaway.length,
        contentPreview: editingContent.substring(0, 100)
      });
    }
  }, [editingContent, editingTitle, editingTakeaway, editingPage]);

  // Sync local module state when module prop changes (important for Academic courses)
  useEffect(() => {
    console.log("🔄 Module prop changed, updating localModule:", {
      moduleTitle: module.title,
      hasContent: !!module.content,
      hasDetailedSubsections: !!module.detailedSubsections?.length,
      isAcademicCourse: module.isAcademicCourse,
      editingPageState: editingPage,
    });

    // IMPORTANT: Skip module updates if we're currently editing to prevent losing edit state
    if (editingPage || editingStateRef.current) {
      console.log("⚠️ Skipping module update - currently editing page", {
        editingPage,
        editingRef: editingStateRef.current
      });
      return;
    }

    setLocalModule((prev) => ({
      ...module,
      // Ensure required fields are initialized
      title: module.title || "",
      content: module.content || "",
      summary: module.summary || "",
      objectives: module.objectives || [],
      examples: module.examples || [],
      detailedSubsections: module.detailedSubsections || [],
      // Academic course specific fields
      isAcademicCourse: course?.isAcademicCourse || false,
      courseType: course?.courseType || academicLevel,
      hasUnits: module.hasUnits || false,
      unitStructure: module.unitStructure || {},
    }));

    // Reset changes flag when module prop changes
    setHasChanges(false);
  }, [module, course?.isAcademicCourse, course?.courseType, academicLevel]);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
    };
  }, [updateTimeout]);

  // Page editing functions
  const startEditingPage = (subsectionIndex, pageIndex) => {
    console.log("🖊️ Starting page edit:", { subsectionIndex, pageIndex });
    
    // Ensure we have a valid subsection
    if (!localModule.detailedSubsections || !localModule.detailedSubsections[subsectionIndex]) {
      console.error("❌ Invalid subsection index:", subsectionIndex);
      toast.error("Invalid subsection selected");
      return;
    }
    
    const subsection = localModule.detailedSubsections[subsectionIndex];
    
    // Get the processed subsection data to understand the structure
    const subsectionPages = getAcademicSubsectionData(subsection);
    console.log("🔍 Subsection pages structure:", {
      type: subsectionPages.type,
      hasData: !!subsectionPages.data,
      hasPages: !!subsectionPages.data?.pages,
      pagesLength: subsectionPages.data?.pages?.length || 0,
      directPagesLength: subsection.pages?.length || 0
    });
    
    // Ensure pages array exists
    if (!subsection.pages) {
      subsection.pages = [];
    }
    
    // Handle basic subsections that might not have proper pages structure
    let page = null;
    
    // First, try to get the page from the processed data structure
    let availablePages = [];
    if (subsectionPages.type === "pages" && subsectionPages.data?.pages) {
      availablePages = subsectionPages.data.pages;
    } else if (subsection.pages && Array.isArray(subsection.pages)) {
      availablePages = subsection.pages;
    }
    
    if (availablePages[pageIndex]) {
      page = availablePages[pageIndex];
      console.log("📄 Found existing page from processed data:", {
        pageTitle: page.pageTitle || page.title,
        contentLength: page.content?.length || 0,
        pageNumber: page.pageNumber,
        source: subsectionPages.type === "pages" ? "processed" : "direct"
      });
    } else {
      // Create a basic page structure from subsection data
      let content = "";
      
      // Try to find content in various possible fields
      if (subsection.explanation) {
        content = subsection.explanation;
      } else if (subsection.content) {
        content = subsection.content;
      } else if (subsection.generatedMarkdown) {
        content = subsection.generatedMarkdown;
      } else if (subsection.markdown) {
        content = subsection.markdown;
      } else if (subsection.text) {
        content = subsection.text;
      } else if (subsection.description) {
        content = subsection.description;
      }
      
      console.log("🔍 Content retrieval:", {
        subsectionTitle: subsection.title,
        hasPages: !!subsection.pages,
        pagesLength: subsection.pages?.length || 0,
        hasExplanation: !!subsection.explanation,
        hasContent: !!subsection.content,
        hasGeneratedMarkdown: !!subsection.generatedMarkdown,
        hasMarkdown: !!subsection.markdown,
        hasText: !!subsection.text,
        hasDescription: !!subsection.description,
        finalContentLength: content.length,
        contentPreview: content.substring(0, 100)
      });
      
      page = {
        content: content,
        pageTitle: subsection.title || "Academic Content",
        title: subsection.title || "Academic Content",
        keyTakeaway: subsection.keyTakeaway || "",
        pageNumber: pageIndex + 1
      };
      
      // Ensure pages array exists
      if (!subsection.pages) {
        subsection.pages = [];
      }
      
      // Ensure the page exists in the array
      if (pageIndex >= subsection.pages.length) {
        // Fill any gaps with empty pages
        while (subsection.pages.length <= pageIndex) {
          subsection.pages.push({
            content: "",
            pageTitle: `Page ${subsection.pages.length + 1}`,
            title: `Page ${subsection.pages.length + 1}`,
            keyTakeaway: "",
            pageNumber: subsection.pages.length + 1
          });
        }
      }
      subsection.pages[pageIndex] = page;
    }

    console.log("📄 Page data:", {
      hasPage: !!page,
      hasPages: !!subsection.pages,
      pagesLength: subsection.pages?.length || 0,
      pageTitle: page?.pageTitle || page?.title,
      contentLength: page?.content?.length || 0,
      subsectionFields: Object.keys(subsection),
      pageIndex,
      actualPage: page,
      subsectionContent: {
        explanation: subsection.explanation?.substring(0, 100),
        content: subsection.content?.substring(0, 100),
        generatedMarkdown: subsection.generatedMarkdown?.substring(0, 100),
        markdown: subsection.markdown?.substring(0, 100)
      }
    });

    const editingData = { subsectionIndex, pageIndex };
    
    // Set editing state immediately
    setEditingPage(editingData);
    setEditingContent(page.content || "");
    setEditingTitle(page.pageTitle || page.title || "");
    setEditingTakeaway(page.keyTakeaway || "");
    
    console.log("✅ Edit state set successfully", { 
      stateSet: editingData, 
      contentLength: page.content?.length || 0,
      title: page.pageTitle || page.title,
      contentPreview: page.content?.substring(0, 100)
    });
  };

  const savePageEdit = () => {
    if (!editingPage) {
      console.error("❌ No editing page state found");
      toast.error("No page is currently being edited");
      return;
    }

    const { subsectionIndex, pageIndex } = editingPage;
    console.log("💾 Saving page edit:", { subsectionIndex, pageIndex, contentLength: editingContent.length });
    
    const updatedModule = { ...localModule };
    const subsection = updatedModule.detailedSubsections[subsectionIndex];

    // Ensure pages array exists
    if (!subsection.pages) {
      subsection.pages = [];
    }

    // Ensure the specific page exists
    if (!subsection.pages[pageIndex]) {
      subsection.pages[pageIndex] = {
        content: "",
        pageTitle: subsection.title || "Academic Content",
        title: subsection.title || "Academic Content",
        keyTakeaway: "",
        pageNumber: pageIndex + 1
      };
    }

    // Update the page
    subsection.pages[pageIndex] = {
      ...subsection.pages[pageIndex],
      content: editingContent,
      pageTitle: editingTitle,
      keyTakeaway: editingTakeaway,
      pageNumber: pageIndex + 1
    };

    console.log("📝 Updated page data:", {
      pageTitle: subsection.pages[pageIndex].pageTitle,
      contentLength: subsection.pages[pageIndex].content.length,
      hasTakeaway: !!subsection.pages[pageIndex].keyTakeaway
    });

    setLocalModule(updatedModule);
    
    // Show success notification
    toast.success("Page content updated successfully!");

    // Clear editing state
    setEditingPage(null);
    setEditingContent("");
    setEditingTitle("");
    setEditingTakeaway("");
    setHasChanges(true);
    setSaveStatus("editing");

    // Trigger parent update immediately
      if (onUpdate) {
        onUpdate(updatedModule);
      }
  };

  const cancelPageEdit = () => {
    console.log("❌ Canceling page edit");
    setEditingPage(null);
    setEditingContent("");
    setEditingTitle("");
    setEditingTakeaway("");
  };

  const [toast] = useState(() => ({
    success: (message) => console.log("✅", message),
    error: (message) => console.error("❌", message),
    info: (message) => console.log("ℹ️", message),
  }));

  // Main tabs state
  const [activeMainTab, setActiveMainTab] = useState("overview");

  // Save/publish state
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Detailed explanations pagination
  const [currentExplanationPage, setCurrentExplanationPage] = useState(0);
  const [explanationsPerPage] = useState(3);

  // Individual explanation pagination
  const [explanationPages, setExplanationPages] = useState({});
  const [wordsPerExplanationPage] = useState(200);

  // Quiz generation state
  const [generatingQuiz, setGeneratingQuiz] = useState({});
  const [quizProgress, setQuizProgress] = useState({});
  const [subsectionQuizzes, setSubsectionQuizzes] = useState(
    module.subsectionQuizzes || {}
  );

  // Academic detailed content generation state
  const [generatingDetailedContent, setGeneratingDetailedContent] =
    useState(false);

  // Function to generate detailed academic subsections with multipage content
  const generateDetailedAcademicContent = async () => {
    if (!courseId || !localModule.content) {
      toast.error("Course ID and module content are required");
      return;
    }

    setGeneratingDetailedContent(true);

    try {
      console.log("🎓 Generating detailed academic content...");

      const response = await fetch(
        "/api/academic-courses/generate-detailed-content",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            courseId: courseId,
            moduleIndex: localModule.order - 1, // Convert to 0-based index
            academicLevel:
              course?.academicLevel || learnerLevel || "undergraduate",
            subject: course?.subject || subject || "General Studies",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate detailed content");
      }

      console.log("✅ Detailed academic content generated successfully:", data);

      // Update the local module with the new detailed subsections
      const updatedModule = {
        ...localModule,
        detailedSubsections: data.detailedSubsections,
        hasDetailedContent: true,
        lastUpdated: new Date(),
      };

      setLocalModule(updatedModule);

      // Update parent immediately for this important change
      if (onUpdate) {
        onUpdate(updatedModule);
      }

      toast.success(
        `Generated ${data.totalSubsections} detailed subsections with ${data.totalPages} pages!`
      );
    } catch (error) {
      console.error("❌ Error generating detailed content:", error);
      toast.error(error.message || "Failed to generate detailed content");
    } finally {
      setGeneratingDetailedContent(false);
    }
  };

  // Resource management
  const [showManualResourceForm, setShowManualResourceForm] = useState(false);
  const [newResource, setNewResource] = useState(() => ({
    title: "",
    url: "",
    description: "",
    type: "article",
  }));
  const [editingResource, setEditingResource] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Edit states
  const [editingObjective, setEditingObjective] = useState(null);
  const [editingExample, setEditingExample] = useState(null);
  const [editingSubsection, setEditingSubsection] = useState(null);
  const [newObjective, setNewObjective] = useState("");
  const [newExample, setNewExample] = useState("");

  // AI Provider selection state
  const [selectedProviders, setSelectedProviders] = useState({
    content: "gemini",
    quiz: "gemini",
    resources: "perplexity",
  });
  const [showProviderSelector, setShowProviderSelector] = useState(false);

  // Handle provider selection changes
  const handleProviderChange = (newProviders) => {
    setSelectedProviders(newProviders);
    // Show a toast indicating the change
    toast.success(
      `Quiz provider updated to ${
        newProviders.quiz === "gemini" ? "Google Gemini" : "Perplexity AI"
      }`
    );
  };

  // Enhanced subsection processing for academic courses
  const detailedSubsections = useMemo(() => {
    const content = localModule.content || "";
    const lines = content.split("\n");
    const sections = {}; // "1.1" -> "Basic concepts"
    const unitSections = {}; // Store unit information

    // Enhanced detection for academic content
    lines.forEach((line) => {
      // Detect Units (various formats for academic content)
      const unitMatch = line.match(
        /^#+\s*(?:Unit|UNIT|Chapter|CHAPTER)\s*(\d+)[:\s]*(.*)$/i
      );
      if (unitMatch) {
        const unitNumber = unitMatch[1];
        const unitTitle = unitMatch[2].trim();
        unitSections[unitNumber] = unitTitle;
      }

      // First pass: find all section headers (###)
      const sectionMatch = line.match(/^###\s+([\d.]+)\s+(.*)/);
      if (sectionMatch) {
        sections[sectionMatch[1]] = sectionMatch[2].trim();
      }
    });

    const subsectionsFromMarkdown = [];
    // Second pass: find all subsection headers (####) with enhanced academic parsing
    lines.forEach((line) => {
      const subsectionMatch = line.match(/^####\s+([\d.]+)\s+(.*)/);
      if (subsectionMatch) {
        const number = subsectionMatch[1]; // "1.1.1"
        const name = subsectionMatch[2].trim(); // "Resistance"

        // Determine unit context for academic content
        let unitContext = "";
        let unitNumber = "1";
        const numberParts = number.split(".");
        if (numberParts.length > 0) {
          unitNumber = numberParts[0];
          if (unitSections[unitNumber]) {
            unitContext = `Unit ${unitNumber}: ${unitSections[unitNumber]}`;
          }
        }

        subsectionsFromMarkdown.push({
          title: `${number} ${name}`,
          number: number,
          name: name,
          unit: unitNumber,
          unitTitle: unitSections[unitNumber] || "",
          unitContext: unitContext,
          isAcademicContent: true,
        });
      }
    });

    const aiSubsections = localModule.detailedSubsections || [];

    // Now, map over the markdown subsections, and enrich with AI data.
    return subsectionsFromMarkdown.map((mdSub) => {
      // Find the corresponding AI subsection. Match by number.
      const aiSub =
        aiSubsections.find((ai) => {
          if (!ai.title) return false;
          const aiMatch = ai.title.match(/^([\d.]+)/);
          return aiMatch && aiMatch[1] === mdSub.number;
        }) || {};

      const parentNumber = mdSub.number.split(".").slice(0, 2).join(".");
      const parentName = sections[parentNumber] || "";

      const formattedTitle = parentName
        ? `${parentName}:${mdSub.name}`
        : mdSub.name;

      return {
        ...aiSub, // a lot of rich content
        title: mdSub.title, // overwrite with the one from markdown for consistency
        formattedTitle: formattedTitle,
        unitContext: mdSub.unitContext, // Add unit context
        isAcademicContent: true, // Force academic content for academic courses
        // Pre-parse the pages here, outside the render loop
        subsectionPages: getAcademicSubsectionData(aiSub),
      };
    });
  }, [localModule.content, localModule.detailedSubsections]);

  // Enhanced local module field update function
  const updateLocalModuleField = (field, value) => {
    console.log("🔄 Updating local module field:", {
      field,
      value:
        typeof value === "string" ? value?.substring(0, 100) + "..." : value,
      hasChanges,
    });
    setLocalModule((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
    setSaveStatus("editing");
  };

  const debouncedParentUpdate = (updatedModule) => {
    // Skip updates while editing to prevent interference
    if (editingPage || editingStateRef.current) {
      console.log("⚠️ Skipping debounced update - currently editing page", {
        editingPage,
        editingRef: editingStateRef.current
      });
      return;
    }

    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }

    const newTimeout = setTimeout(() => {
      if (onUpdate && !editingPage) {
        setSaveStatus("saving");
        console.log("🔄 Debounced parent update with module changes");
        onUpdate(updatedModule);

        // Set status back to saved after a brief delay
        setTimeout(() => {
          setSaveStatus("saved");
        }, 500);
      }
    }, 1000); // Wait 1 second after user stops typing

    setUpdateTimeout(newTimeout);
  };

  // Helper function to update module with appropriate method (debounced for academic courses)
  const updateModule = (updatedModule) => {
    // For ALL academic courses, use debounced updates to prevent constant saving
    if (localModule.isAcademicCourse || course?.isAcademicCourse) {
      console.log("🔄 Using debounced update for academic course");
      debouncedParentUpdate(updatedModule);
    } else {
      // For non-academic courses, update immediately
      if (onUpdate) {
        console.log("🔄 Immediate parent update for non-academic course");
        onUpdate(updatedModule);
      }
    }
  };

  // Enhanced update module fields for academic content
  const updateModuleField = (field, value) => {
    console.log("📝 updateModuleField called:", {
      field,
      valueLength: value?.length,
      isAcademicCourse: localModule.isAcademicCourse,
    });

    // Update local state immediately for responsive UI
    updateLocalModuleField(field, value);

    // Use the helper function for consistent behavior
    const updatedModule = {
      ...localModule,
      [field]: value,
    };
    updateModule(updatedModule);
  };

  // Enhanced save function that preserves academic course structure
  const saveModuleChanges = async () => {
    if (!hasChanges) {
      toast.info("No changes to save");
      return;
    }

    try {
      setSaving(true);
      toast.info("💾 Saving module changes...");

      // Ensure academic course properties are maintained
      const moduleToSave = {
        ...localModule,
        lastUpdated: new Date().toISOString(),
        // Preserve academic course specific properties
        isAcademicCourse: course?.isAcademicCourse || false,
        courseType: course?.courseType || "academic",
        isTechnicalCourse: true, // Enable technical features
        moduleType: "academic",
      };

      // Update parent component
      updateModule(moduleToSave);

      // For academic courses, don't make direct API calls - let parent handle saving
      if (courseId && !localModule.isAcademicCourse) {
        const response = await fetch(
          `/api/academic-courses/${courseId}/modules/${localModule.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeaders(),
            },
            body: JSON.stringify(moduleToSave),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to save module to backend");
        }
      }

      setHasChanges(false);
      toast.success("✅ Module changes saved successfully!");
    } catch (error) {
      console.error("Save error:", error);
      toast.error(`Failed to save changes: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Enhanced content structure function for academic courses
  const enhanceContentStructure = () => {
    if (!localModule.content) {
      toast.error("No content to enhance");
      return;
    }

    console.log("🎨 Enhancing academic content structure");

    const enhanceAcademicContentStructure = (content) => {
      if (!content) return content;

      const lines = content.split("\n");
      let enhancedContent = [];
      let currentUnit = 0;
      let currentSection = 0;
      let currentSubsection = 0;

      lines.forEach((line) => {
        const trimmedLine = line.trim();

        // Skip empty lines initially
        if (!trimmedLine) {
          enhancedContent.push("");
          return;
        }

        // Check if it's already a markdown heading
        if (trimmedLine.match(/^#+\s/)) {
          enhancedContent.push(line);
          return;
        }

        // Detect unit patterns
        const unitMatch = trimmedLine.match(
          /^(?:Unit|UNIT|Chapter|CHAPTER)\s*(\d+|[IVX]+)[:\s]*(.*)$/i
        );
        if (unitMatch) {
          currentUnit++;
          currentSection = 0;
          currentSubsection = 0;
          enhancedContent.push(
            `# Unit ${currentUnit}: ${unitMatch[2] || "Academic Unit"}`
          );
          enhancedContent.push("");
          return;
        }

        // Detect section-like patterns (numbered items, topics)
        const sectionMatch = trimmedLine.match(/^-\s*(.+)$/);
        if (sectionMatch) {
          const sectionContent = sectionMatch[1].trim();

          // Check if this looks like a major topic (longer, more descriptive)
          if (
            sectionContent.length > 30 ||
            sectionContent.includes(" and ") ||
            sectionContent.includes(" of ")
          ) {
            currentSection++;
            currentSubsection = 0;
            enhancedContent.push(`## ${currentSection}. ${sectionContent}`);
            enhancedContent.push("");
            enhancedContent.push(
              "*This section covers the fundamental concepts and practical applications. Students will learn:*"
            );
            enhancedContent.push("- Core principles and definitions");
            enhancedContent.push("- Real-world applications and examples");
            enhancedContent.push("- Problem-solving strategies and techniques");
            enhancedContent.push("");
          } else {
            // Smaller topics become subsections
            currentSubsection++;
            enhancedContent.push(
              `### ${currentSection}.${currentSubsection} ${sectionContent}`
            );
            enhancedContent.push("");
            enhancedContent.push(
              "**Overview:** This subsection provides comprehensive coverage of the topic."
            );
            enhancedContent.push("");
            enhancedContent.push("**Key Learning Points:**");
            enhancedContent.push("- Fundamental concepts and terminology");
            enhancedContent.push(
              "- Practical applications in academic contexts"
            );
            enhancedContent.push("- Common problem-solving approaches");
            enhancedContent.push("");
            enhancedContent.push(
              "**Practice Exercises:** Students should work through examples and apply the concepts learned."
            );
            enhancedContent.push("");
          }
          return;
        }

        // Regular content - add as is
        enhancedContent.push(line);
      });

      return enhancedContent.join("\n");
    };

    const enhancedContent = enhanceAcademicContentStructure(
      localModule.content
    );
    updateModuleField("content", enhancedContent);

    toast.success(
      "✨ Content structure enhanced with proper markdown formatting!"
    );
  };

  // Auto-save function for academic courses (disabled to prevent conflicts)
  useEffect(() => {
    if (hasChanges && localModule.isAcademicCourse) {
      // For academic courses, let the parent AcademicCourseCreator handle saving
      // Don't auto-save individual modules to prevent API conflicts
      console.log(
        "📝 Academic course module has changes, but auto-save is disabled to prevent conflicts"
      );
      return;
    }

    // Keep auto-save for non-academic courses
    if (hasChanges && !localModule.isAcademicCourse) {
      const autoSaveTimer = setTimeout(() => {
        saveModuleChanges();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(autoSaveTimer);
    }
  }, [hasChanges, localModule]);

  const totalExplanationPages = Math.ceil(
    detailedSubsections.length / explanationsPerPage
  );
  const startExplanationIndex = currentExplanationPage * explanationsPerPage;
  const endExplanationIndex = startExplanationIndex + explanationsPerPage;
  const currentPageExplanations = detailedSubsections.slice(
    startExplanationIndex,
    endExplanationIndex
  );

  // Get current page for a specific explanation
  const getCurrentExplanationPage = (subsectionIndex) => {
    return explanationPages[subsectionIndex] || 0;
  };

  // Set current page for a specific explanation
  const setCurrentExplanationPageForSubsection = (
    subsectionIndex,
    pageIndex
  ) => {
    setExplanationPages((prev) => ({
      ...prev,
      [subsectionIndex]: pageIndex,
    }));
  };

  // Generate quiz for subsection with difficulty level
  const generateSubsectionQuiz = async (
    subsection,
    subsectionIndex,
    difficulty = "medium"
  ) => {
    // Check authentication first
    if (!user || user.role !== "educator") {
      toast.error(
        "Authentication error: You must be logged in as an educator to generate quizzes."
      );
      console.error("Auth check failed:", {
        userExists: !!user,
        userRole: user?.role,
        expectedRole: "educator",
      });
      return;
    }

    // Check if token is still valid
    if (!isTokenValid()) {
      toast.error("Your session has expired. Please log in again.");
      console.error("Token validation failed");
      return;
    }

    // Build comprehensive content from all available fields
    const contentParts = [];

    // Add basic subsection information
    if (subsection.title) {
      contentParts.push(`Topic: ${subsection.title}`);
    }

    if (subsection.summary) contentParts.push(`Summary: ${subsection.summary}`);
    if (subsection.keyPoints && Array.isArray(subsection.keyPoints)) {
      contentParts.push(`Key Points: ${subsection.keyPoints.join(", ")}`);
    }
    if (subsection.generatedMarkdown) {
      contentParts.push(subsection.generatedMarkdown);
    }

    // Extract content from pages
    if (subsection.pages && Array.isArray(subsection.pages)) {
      subsection.pages.forEach((page, index) => {
        if (page.content && page.content.trim()) {
          contentParts.push(`Page ${index + 1}: ${page.content}`);
        }
        if (page.keyTakeaway && page.keyTakeaway.trim()) {
          contentParts.push(`Key Takeaway ${index + 1}: ${page.keyTakeaway}`);
        }
      });
    }

    // Extract from concept/formula flashcards if available
    if (
      subsection.conceptFlashCards &&
      Array.isArray(subsection.conceptFlashCards)
    ) {
      const conceptContent = subsection.conceptFlashCards
        .map((card) => `${card.question} ${card.answer}`)
        .join(" ");
      if (conceptContent.trim()) {
        contentParts.push(`Concepts: ${conceptContent}`);
      }
    }

    if (
      subsection.formulaFlashCards &&
      Array.isArray(subsection.formulaFlashCards)
    ) {
      const formulaContent = subsection.formulaFlashCards
        .map((card) => `${card.question} ${card.answer}`)
        .join(" ");
      if (formulaContent.trim()) {
        contentParts.push(`Formulas: ${formulaContent}`);
      }
    }

    if (subsection.practicalExample)
      contentParts.push(`Practical Example: ${subsection.practicalExample}`);
    if (subsection.commonPitfalls)
      contentParts.push(`Common Pitfalls: ${subsection.commonPitfalls}`);
    if (subsection.explanation)
      contentParts.push(`Explanation: ${subsection.explanation}`);
    if (subsection.content) contentParts.push(`Content: ${subsection.content}`);
    if (subsection.details) contentParts.push(`Details: ${subsection.details}`);

    let subsectionContent = contentParts.join("\n\n");

    // Fallback: If still insufficient content, create a basic content from module context
    if (!subsectionContent || subsectionContent.trim().length < 10) {
      console.log(
        "🔄 Using fallback content generation for subsection:",
        subsection.title
      );
      subsectionContent = `
        Topic: ${subsection.title || "Unknown Topic"}
        Subject: ${subject || "General"}
        Academic Level: ${academicLevel || "Undergraduate"}
        Semester: ${semester || "1"}
        
        This subsection covers important concepts related to ${
          subsection.title || "the topic"
        } 
        in the context of ${subject || "the subject area"} for ${
        academicLevel || "academic courses"
      }.
        
        Key areas of focus include fundamental principles, practical applications, 
        and academic strategies for mastering this topic.
        
        Students should understand the fundamental concepts, learn problem-solving techniques,
        and practice applying knowledge in academic scenarios.
      `.trim();
    }

    console.log("🔍 Quiz generation debug:", {
      subsection: subsection,
      title: subsection.title,
      hasExplanation: !!subsection.explanation,
      hasContent: !!subsection.content,
      hasDetails: !!subsection.details,
      hasSummary: !!subsection.summary,
      hasPages: !!(subsection.pages && subsection.pages.length > 0),
      hasFlashCards: !!(
        subsection.flashCards && subsection.flashCards.length > 0
      ),
      hasConceptFlashCards: !!(
        subsection.conceptFlashCards && subsection.conceptFlashCards.length > 0
      ),
      hasFormulaFlashCards: !!(
        subsection.formulaFlashCards && subsection.formulaFlashCards.length > 0
      ),
      contentLength: subsectionContent.length,
      contentPreview: subsectionContent.substring(0, 200) + "...",
      academicLevel: academicLevel,
      subject: subject,
      difficulty: difficulty,
      allFields: Object.keys(subsection),
    });

    if (!subsection.title) {
      toast.error("❌ Subsection title is required for quiz generation");
      console.log("Missing title:", { subsection });
      return;
    }

    if (!subsectionContent || subsectionContent.trim().length < 10) {
      toast.error(
        "❌ Unable to generate quiz: This subsection needs content first. Please add detailed content, explanations, or flashcards before generating a quiz."
      );
      console.log("Missing/insufficient content:", {
        contentLength: subsectionContent.length,
        content: subsectionContent,
        subsection,
        availableFields: Object.keys(subsection),
        suggestion:
          "Add content via 'Generate with AI' button or manually edit the subsection",
      });
      return;
    }

    const quizKey = `${subsectionIndex}_${difficulty}`;
    setGeneratingQuiz((prev) => ({ ...prev, [quizKey]: true }));
    setQuizProgress((prev) => ({ ...prev, [quizKey]: 0 }));

    try {
      toast.info(`🎯 Creating ${difficulty} quiz for: ${subsection.title}`);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setQuizProgress((prev) => {
          const current = prev[quizKey] || 0;
          const next = Math.min(current + 20, 90);
          return { ...prev, [quizKey]: next };
        });
      }, 500);

      const requestPayload = {
        moduleContent: subsectionContent.trim(),
        difficulty: difficulty,
        context: {
          concept: subsection.title,
          academicLevel: academicLevel,
          subject: subject,
          semester: difficulty, // Use difficulty as learner level
        },
        provider: selectedProviders.quiz, // Include selected provider
      };

      console.log("📤 Sending quiz generation request:", {
        url: "/api/academic-courses/generate-quiz",
        payload: requestPayload,
        contentLength: subsectionContent.length,
        headers: getAuthHeaders(),
        userRole: user?.role,
        userId: user?.id,
        isAuthenticated: !!user,
      });

      const response = await apiCall("/api/academic-courses/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      clearInterval(progressInterval);
      setQuizProgress((prev) => ({ ...prev, [quizKey]: 100 }));

      console.log(
        "📥 Quiz generation response:",
        response.status,
        response.statusText
      );

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Quiz generation successful:", data);

        // Store quiz in subsection quizzes
        const updatedQuizzes = {
          ...subsectionQuizzes,
          [quizKey]: {
            questions: data.questions || [],
            difficulty: difficulty,
            subsectionTitle: subsection.title,
            formattedSubsectionTitle: subsection.formattedTitle,
            createdAt: new Date().toISOString(),
            totalQuestions: data.questions?.length || 0,
            generatedWith:
              data.metadata?.generatedWith || selectedProviders.quiz,
          },
        };

        setSubsectionQuizzes(updatedQuizzes);

        // Update module with quizzes
        updateModule({
          ...localModule,
          subsectionQuizzes: updatedQuizzes,
        });

        const providerName = data.metadata?.generatedWith?.includes("gemini")
          ? "Gemini"
          : data.metadata?.generatedWith?.includes("perplexity")
          ? "Perplexity"
          : selectedProviders.quiz === "gemini"
          ? "Gemini"
          : "Perplexity";

        toast.success(
          `🏆 ${
            difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
          } quiz created successfully with ${providerName}!`
        );
      } else {
        const errorText = await response.text();
        console.error(
          "Quiz generation failed:",
          response.status,
          response.statusText,
          errorText
        );

        let errorMessage = "Failed to create quiz";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;

          // Special handling for auth errors
          if (response.status === 403) {
            errorMessage = `Authentication error: ${errorMessage}. Please check your login status.`;
            console.error("Auth Debug Info:", {
              userExists: !!user,
              userRole: user?.role,
              userId: user?.id,
              token: localStorage.getItem("token") ? "Present" : "Missing",
              headers: getAuthHeaders(),
            });

            // Suggest refresh if auth failed
            toast.error(
              "Authentication failed. Please refresh the page and try again."
            );
            return;
          }
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Quiz creation error:", error);
      toast.error(`Failed to create quiz: ${error.message}`);
    } finally {
      setTimeout(() => {
        setGeneratingQuiz((prev) => ({ ...prev, [quizKey]: false }));
        setQuizProgress((prev) => ({ ...prev, [quizKey]: 0 }));
      }, 1000);
    }
  };

  // Delete quiz
  const deleteSubsectionQuiz = (subsectionIndex, difficulty) => {
    const quizKey = `${subsectionIndex}_${difficulty}`;
    const updatedQuizzes = { ...subsectionQuizzes };
    delete updatedQuizzes[quizKey];

    setSubsectionQuizzes(updatedQuizzes);
    updateModule({
      ...localModule,
      subsectionQuizzes: updatedQuizzes,
    });

    toast.success("Quiz deleted successfully");
  };

  // Add objective
  const addObjective = () => {
    if (!newObjective.trim()) return;
    const updatedObjectives = [
      ...(localModule.objectives || []),
      newObjective.trim(),
    ];
    updateModuleField("objectives", updatedObjectives);
    setNewObjective("");
    toast.success("Objective added");
  };

  // Update objective
  const updateObjective = (index, value) => {
    const updatedObjectives = localModule.objectives.map((obj, i) =>
      i === index ? value : obj
    );
    updateModuleField("objectives", updatedObjectives);
  };

  // Remove objective
  const removeObjective = (index) => {
    const updatedObjectives = localModule.objectives.filter(
      (_, i) => i !== index
    );
    updateModuleField("objectives", updatedObjectives);
    toast.success("Objective removed");
  };

  // Add example
  const addExample = () => {
    if (!newExample.trim()) return;
    const updatedExamples = [
      ...(localModule.examples || []),
      newExample.trim(),
    ];
    updateModuleField("examples", updatedExamples);
    setNewExample("");
    toast.success("Example added");
  };

  // Update example
  const updateExample = (index, value) => {
    const updatedExamples = localModule.examples.map((ex, i) =>
      i === index ? value : ex
    );
    updateModuleField("examples", updatedExamples);
  };

  // Remove example
  const removeExample = (index) => {
    const updatedExamples = localModule.examples.filter((_, i) => i !== index);
    updateModuleField("examples", updatedExamples);
    toast.success("Example removed");
  };

  // Update subsection - handle both explanation and content fields
  const updateSubsection = (index, updates) => {
    // Skip updates while editing to prevent interference
    if (editingPage || editingStateRef.current) {
      console.log("⚠️ Skipping subsection update - currently editing page", {
        editingPage,
        editingRef: editingStateRef.current
      });
      return;
    }

    const updatedSubsections = detailedSubsections.map((sub, i) =>
      i === index ? { ...sub, ...updates } : sub
    );
    updateModuleField("detailedSubsections", updatedSubsections);
  };

  // Resource management functions
  const resourceCategories = {
    books: { icon: BookOpen, label: "Books", color: "blue" },
    courses: { icon: GraduationCap, label: "Courses", color: "green" },
    articles: { icon: FileText, label: "Articles", color: "purple" },
    videos: { icon: Video, label: "Videos", color: "red" },
    tools: { icon: Wrench, label: "Tools", color: "orange" },
    websites: { icon: Globe, label: "Websites", color: "cyan" },
    exercises: { icon: Target, label: "Exercises", color: "pink" },
  };

  const addResource = (category, resource) => {
    // Validate resource before adding
    if (!resource || typeof resource !== "object") {
      console.warn("Invalid resource object:", resource);
      return;
    }

    // Ensure resource has required properties
    if (!resource.title && !resource.name) {
      console.warn("Resource missing title/name:", resource);
      return;
    }

    const updatedResources = {
      ...localModule.resources,
      [category]: [...(localModule.resources[category] || []), resource],
    };
    updateModuleField("resources", updatedResources);
  };

  const removeResource = (category, index) => {
    const updatedResources = {
      ...localModule.resources,
      [category]: localModule.resources[category].filter((_, i) => i !== index),
    };
    updateModuleField("resources", updatedResources);
  };

  // Navigation helpers
  const goToNextExplanationPage = () => {
    if (currentExplanationPage < totalExplanationPages - 1) {
      setCurrentExplanationPage(currentExplanationPage + 1);
    }
  };

  const goToPrevExplanationPage = () => {
    if (currentExplanationPage > 0) {
      setCurrentExplanationPage(currentExplanationPage - 1);
    }
  };

  // Save/Publish handlers
  const handleSaveDraft = async () => {
    console.log("🔍 Save Draft Debug:", {
      hasEntryCourse: !!course,
      courseId: courseId,
      courseTitle: course?.title,
      courseAcademicLevel: course?.academicLevel,
      courseSubject: course?.subject,
    });

    if (!course) {
      toast.error("❌ Course object missing. Cannot save changes.");
      console.error("Course object is missing:", { course, courseId });
      return;
    }

    // Note: courseId can be null for new courses that haven't been saved yet
    if (!courseId) {
      console.log("ℹ️ No courseId provided - this will create a new course");
    }

    setSaving(true);

    try {
      console.log("Saving course as draft:", {
        courseId,
        moduleCount: course.modules?.length,
        currentModule: localModule.title,
      });

      const response = await fetch("/api/academic-courses/save-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          course: {
            ...course,
            _id: courseId,
            status: "draft",
            isAcademicCourse: true,
            courseType: "academic",
            modules: course.modules, // Include all modules with current changes
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Create detailed draft success message
        const moduleCount = course.modules?.length || 0;
        const subsectionCount =
          course.modules?.reduce(
            (total, module) =>
              total + (module.detailedSubsections?.length || 0),
            0
          ) || 0;

        toast.success(
          `📝 Draft Saved Successfully! 🎯 "${course.title}" • 📚 ${
            course.academicLevel
          } • �� ${course.subject} • 📋 ${moduleCount} modules${
            subsectionCount > 0 ? ` • 🔍 ${subsectionCount} subsections` : ""
          } • ✨ Continue editing or publish when ready!`,
          {
            duration: 6000,
          }
        );

        if (onSaveSuccess) onSaveSuccess(data.course, "draft");
      } else {
        const errorText = await response.text();
        console.error(
          "Save draft failed:",
          response.status,
          response.statusText,
          errorText
        );

        let errorMessage = "Failed to save draft";
        if (response.status === 403) {
          errorMessage = "❌ You need educator permissions to save courses.";
        } else if (response.status === 401) {
          errorMessage = "❌ Authentication failed. Please log in again.";
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error(`Failed to save: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePublishCourse = async () => {
    // Enhanced validation
    console.log("🔍 Publish validation:", {
      hasCourse: !!course,
      hasTitle: !!course?.title,
      hasCourseId: !!courseId,
      moduleCount: course?.modules?.length || 0,
      academicLevel: course?.academicLevel,
      subject: course?.subject,
    });

    if (!course) {
      toast.error("❌ Course information missing. Cannot publish.");
      console.error("Missing course data:", course);
      return;
    }

    // If no courseId, we're creating a new course (not updating)
    if (!courseId) {
      console.log(
        "⚠️  No courseId found, will create new course instead of updating"
      );
    }

    if (!course.title || !course.academicLevel || !course.subject) {
      toast.error(
        "❌ Course must have title, academic level, and subject before publishing"
      );
      console.error("Missing required fields:", {
        title: course.title,
        academicLevel: course.academicLevel,
        subject: course.subject,
      });
      return;
    }

    // Validate course has required content
    if (!course.modules || course.modules.length === 0) {
      toast.error("❌ Course must have at least one module before publishing");
      return;
    }

    const hasContentModules = course.modules.some(
      (module) =>
        module.content ||
        module.summary ||
        (module.detailedSubsections && module.detailedSubsections.length > 0)
    );

    if (!hasContentModules) {
      toast.error("❌ At least one module must have content before publishing");
      return;
    }

    setPublishing(true);

    try {
      const publishPayload = {
        course: {
          ...course,
          status: "published",
          isPublished: true,
          isAcademicCourse: true,
          isAcademicCourse: true,
          modules: course.modules,
        },
      };

      // Only include _id if we have a courseId (for updates)
      if (courseId) {
        publishPayload.course._id = courseId;
      }

      console.log("🚀 Publishing course:", {
        courseId,
        moduleCount: course.modules?.length,
        title: course.title,
        hasAuth: !!getAuthHeaders()?.authorization,
        payload: {
          ...publishPayload.course,
          _id: publishPayload.course._id,
          status: publishPayload.course.status,
          isPublished: publishPayload.course.isPublished,
        },
      });

      const response = await fetch("/api/academic-courses/save-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(publishPayload),
      });

      console.log("📥 Publish response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Course published successfully:", data);

        // Create detailed publish success message
        const moduleCount = course.modules?.length || 0;
        const subsectionCount =
          course.modules?.reduce(
            (total, module) =>
              total + (module.detailedSubsections?.length || 0),
            0
          ) || 0;
        const quizCount =
          course.modules?.reduce((total, module) => {
            if (module.subsectionQuizzes) {
              return total + Object.keys(module.subsectionQuizzes).length;
            }
            return total + (module.quiz ? 1 : 0);
          }, 0) || 0;

        toast.success(
          `🎉 Course Published Successfully! 🏆 "${
            course.title
          }" is now live • 📚 ${course.academicLevel} • 📖 ${
            course.subject
          } • 📋 ${moduleCount} modules${
            subsectionCount > 0 ? ` • 🔍 ${subsectionCount} subsections` : ""
          }${
            quizCount > 0 ? ` • 🎯 ${quizCount} quizzes` : ""
          } • 🚀 Students can now enroll and learn!`,
          {
            duration: 8000,
          }
        );

        // Make sure we pass the updated course with the published status
        const publishedCourse = {
          ...data.course,
          _id: courseId || data.courseId,
          status: "published",
          isPublished: true,
        };

        if (onSaveSuccess) onSaveSuccess(publishedCourse, "published");
      } else {
        const errorText = await response.text();
        console.error("❌ Publish failed:", {
          status: response.status,
          statusText: response.statusText,
          errorText,
          url: response.url,
        });

        let errorMessage = "Failed to publish course";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;

          if (response.status === 403) {
            errorMessage =
              "❌ You need educator permissions to publish courses.";
          } else if (response.status === 401) {
            errorMessage = "❌ Authentication failed. Please log in again.";
          } else if (response.status === 400) {
            errorMessage = `❌ ${
              errorData.error ||
              "Invalid course data. Please check all required fields."
            }`;
          } else if (response.status === 500) {
            errorMessage = "❌ Server error. Please try again later.";
          }

          console.error("Error details:", errorData);
        } catch (e) {
          console.error("Failed to parse error response:", e);
          errorMessage = `❌ Server error: ${response.status} ${response.statusText}`;
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("💥 Publish error:", error);
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        toast.error(
          "❌ Network error. Please check your connection and try again."
        );
      } else {
        toast.error(`Failed to publish: ${error.message}`);
      }
    } finally {
      setPublishing(false);
    }
  };

  // Resource editing handlers
  const startEditingResource = (type, index) => {
    const resource = localModule.resources?.[type]?.[index];
    if (resource) {
      setEditingResource({ type, index });
      setEditForm({ ...resource });
    }
  };

  const cancelEditingResource = () => {
    setEditingResource(null);
    setEditForm({});
  };

  const saveResourceEdit = () => {
    if (!editingResource) return;

    const { type, index } = editingResource;
    const updatedResources = {
      ...localModule.resources,
      [type]: localModule.resources[type]
        .filter((resource) => resource != null)
        .map((resource, i) => (i === index ? { ...editForm } : resource)),
    };

    updateModuleField("resources", updatedResources);
    setEditingResource(null);
    setEditForm({});
  };

  const updateEditForm = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  // Add manual resource
  const handleAddManualResource = () => {
    if (!newResource?.title || !newResource?.type) return;

    const resourceWithId = {
      ...newResource,
      id: Date.now().toString(),
    };

    addResource(newResource?.type + "s", resourceWithId);
    setNewResource({
      title: "",
      url: "",
      description: "",
      type: "article",
    });
    setShowManualResourceForm(false);
  };

  // DISABLED FUNCTION - Academic courses should not use individual subsection generation
  const generateSubsectionContent = async (subsection, subsectionIndex) => {
    console.error(
      "🚨 BLOCKED: generateSubsectionContent should not be called for academic courses!"
    );
    console.error("Subsection:", subsection?.title);
    console.error(
      "Please use the 'Generate Detailed Subsections' button instead."
    );

    // Show user-friendly error
    if (typeof toast !== "undefined" && toast.error) {
      toast.error(
        "Please use the 'Generate Detailed Subsections' button to create academic content."
      );
    }

    return; // Exit immediately

    // Debug: Log all course information to understand what we're working with
    console.log("🔍 generateSubsectionContent called with:", {
      subsectionTitle: subsection.title,
      subsectionIndex,
      courseData: course,
      moduleData: {
        isAcademicCourse: localModule.isAcademicCourse,
        courseType: localModule.courseType,
        moduleType: localModule.moduleType,
      },
    });

    // For academic courses, use the new multipage content generation instead
    // Check multiple indicators for academic courses
    const isAcademic =
      course?.isAcademicCourse ||
      course?.courseType === "academic" ||
      localModule.isAcademicCourse ||
      localModule.courseType === "academic" ||
      localModule.moduleType === "academic" ||
      // Also check if we're in the Academic Course component (safety check)
      true; // Since this is AcademicModuleEditorEnhanced, it should always be academic

    if (isAcademic) {
      console.log(
        "🎓 Academic course detected - BLOCKED old flashcard generation"
      );
      console.log("Academic indicators:", {
        courseIsAcademic: course?.isAcademicCourse,
        courseCourseType: course?.courseType,
        moduleIsAcademic: localModule.isAcademicCourse,
        moduleCourseType: localModule.courseType,
        moduleType: localModule.moduleType,
        subsectionTitle: subsection.title,
      });
      console.trace("Call stack for blocked generateSubsectionContent");
      toast.info(
        "🎓 Academic courses use multipage content. Please use the 'Generate Detailed Subsections' button above."
      );
      return;
    }

    console.log(
      "⚠️ Non-academic course detected, proceeding with flashcard generation"
    );

    try {
      // Show loading state
      setEditingSubsection(subsectionIndex);
      const updatedSubsection = { ...subsection, isGenerating: true };
      updateSubsection(subsectionIndex, updatedSubsection);

      console.log(`Generating content for subsection: ${subsection.title}`);

      // Prepare the context for the API
      const context = {
        subject: subject || "General",
        academicLevel: academicLevel || "General",
        moduleTitle: localModule.title,
        subsectionTitle: subsection.title,
      };

      // Extract content for this subsection from the module content
      const subsectionRegex = new RegExp(
        `####\\s*${subsection.title.replace(
          /[-\/\\^$*+?.()|[\]{}]/g,
          "\\$&"
        )}[\\s\\S]*?(?=####|###|##|#|$)`
      );
      const subsectionContentMatch = localModule.content.match(subsectionRegex);
      const focusedContent = subsectionContentMatch
        ? subsectionContentMatch[0]
        : `#### ${subsection.title}\n\nThis is a subsection of the module "${localModule.title}" for ${academicLevel} academic learning in ${subject}.`;

      // Add module context to help the AI
      const moduleContext = `Module: ${localModule.title}\nSubject: ${subject}\nAcademic Level: ${academicLevel}\nSemester: ${semester}\n\n${focusedContent}`;

      // COMPLETELY BLOCK API call for academic courses - this should NEVER happen
      console.error(
        "🚨 CRITICAL: Academic course trying to call exam-genius API!"
      );
      console.error("This should be blocked by the guard clause above!");
      console.error("Context:", {
        context,
        moduleContext: moduleContext.substring(0, 200),
      });

      throw new Error(
        "Academic courses should use the 'Generate Detailed Subsections' button, not individual flashcard generation!"
      );

      return; // Exit immediately for academic courses

      // OLD CODE - DISABLED FOR ACADEMIC COURSES
      // const response = await fetch(
      //   "/api/exam-genius/generate-subsection-content",
      //   {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //       ...getAuthHeaders(),
      //     },
      //     body: JSON.stringify({
      //       content: moduleContext,
      //       context: {
      //         ...context,
      //         type: "academic",
      //         semester: semester,
      //         courseType: "academic",
      //       },
      //       type: "subsection",
      //     }),
      //   }
      // );

      if (!response.ok) {
        let errorMessage = "Failed to generate content";
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          console.error("Failed to parse error response:", e);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        const responseText = await response.text();
        if (!responseText.trim()) {
          throw new Error("Empty response from server");
        }
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse JSON response:", e);
        throw new Error("Invalid response format from server");
      }

      // Add debug logging to see what we received
      console.log("🔍 API Response data.content:", data.content);
      console.log("🔍 Type of data.content:", typeof data.content);
      if (typeof data.content === "object") {
        console.log("🔍 Content properties:", Object.keys(data.content));
        console.log("🔍 Has conceptGroups:", !!data.content.conceptGroups);
        console.log(
          "🔍 ConceptGroups length:",
          data.content.conceptGroups?.length || 0
        );
      }

      // Handle new categorized flashcard format FIRST (highest priority)
      if (
        typeof data.content === "object" &&
        (data.content.conceptFlashCards || data.content.formulaFlashCards)
      ) {
        console.log("✅ Processing new categorized flashcard structure");
        console.log(
          "🔍 Concept cards:",
          data.content.conceptFlashCards?.length || 0
        );
        console.log(
          "🔍 Formula cards:",
          data.content.formulaFlashCards?.length || 0
        );

        // NEW: Categorized flashcard format
        const newSubsectionData = {
          conceptFlashCards: data.content.conceptFlashCards || [],
          formulaFlashCards: data.content.formulaFlashCards || [],
          summary:
            data.content.summary ||
            `Important concepts and formulas for ${subsection.title}`,
          difficulty: data.content.difficulty || "Intermediate",
          estimatedTime: data.content.estimatedTime || "5-10 minutes",
          isGenerating: false,
          // Clear any legacy data to force categorized display
          conceptGroups: undefined,
          flashCards: undefined,
          pages: undefined,
        };

        console.log("🔍 About to update subsection with:", newSubsectionData);
        updateSubsection(subsectionIndex, newSubsectionData);

        console.log("🔍 Update completed for subsection:", subsection.title);
      } else if (
        typeof data.content === "object" &&
        data.content.conceptGroups
      ) {
        console.log("✅ Processing legacy JSON structure with conceptGroups");
        // Legacy enhanced JSON format with conceptGroups
        updateSubsection(subsectionIndex, {
          conceptGroups: data.content.conceptGroups,
          problemSolvingWorkflows: data.content.problemSolvingWorkflows || [],
          flashCards: data.content.flashCards || [],
          conceptBullets: data.content.conceptBullets || [],
          practicalUseCase: data.content.practicalUseCase,
          summary: data.content.summary,
          difficulty: data.content.difficulty || "Intermediate",
          estimatedTime: data.content.estimatedTime || "15-20 minutes",
          isGenerating: false,
        });
      } else if (typeof data.content === "object" && data.content.pages) {
        // Legacy JSON format with pages - keep for backward compatibility
        updateSubsection(subsectionIndex, {
          pages: data.content.pages,
          summary: data.content.summary,
          keyPoints: data.content.keyPoints || [],
          practicalExample: data.content.practicalExample,
          commonPitfalls: data.content.commonPitfalls || [],
          refresherBoost: data.content.refresherBoost,
          isGenerating: false,
        });
      } else if (typeof data.content === "string") {
        // Legacy markdown format - keep for backward compatibility
        updateSubsection(subsectionIndex, {
          generatedMarkdown: data.content,
          isGenerating: false,
        });
      } else {
        // Fallback - treat any content as markdown
        updateSubsection(subsectionIndex, {
          generatedMarkdown: JSON.stringify(data.content, null, 2),
          isGenerating: false,
        });
      }

      toast.success(
        `Content generated successfully for subsection: ${subsection.title}`
      );
    } catch (error) {
      console.error(
        `Error generating content for subsection: ${subsection.title}`,
        error
      );
      // Reset the generating state
      updateSubsection(subsectionIndex, { isGenerating: false });
      // Show error toast
      toast.error(
        error.message || "Failed to generate content. Please try again."
      );
    } finally {
      setEditingSubsection(null);
    }
  };

  // Individual Academic Subsection Generation - No courseData references
  const generateIndividualAcademicSubsection = async (
    subsection,
    subsectionIndex
  ) => {
    console.log(
      "🎓 Generating individual academic subsection:",
      subsection?.title
    );

    try {
      updateSubsection(subsectionIndex, { isGenerating: true });

      const response = await fetch(
        "/api/academic-courses/generate-detailed-content",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: localModule._id || "individual-generation",
            moduleIndex: 0,
            subsectionTitle: subsection.title,
            moduleTitle: localModule.title,
            academicLevel: academicLevel || "undergraduate",
            subject: subject || "General Studies",
            singleSubsection: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to generate content: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Enhanced individual academic content generated:", result);

      if (result.success && result.content && result.content.pages) {
        // Enhanced update with all the new metadata
        const enhancedSubsectionData = {
          pages: result.content.pages,
          summary: result.content.summary,
          difficulty:
            result.content.difficulty ||
            result.content.beautifulSummaryElements?.difficultyLevel,
          estimatedTime:
            result.content.estimatedTime ||
            result.content.beautifulSummaryElements?.estimatedStudyTime,
          isAcademicContent: true,
          type: "pages",
          isGenerating: false,
          // New enhanced fields
          objectives: result.content.objectives || [],
          examples: result.content.examples || [],
          resources: result.content.resources || {
            books: [],
            courses: [],
            articles: [],
            videos: [],
            tools: [],
            websites: [],
            exercises: [],
          },
          visualizationSuggestions: result.content.visualizationSuggestions || {
            hasFlowcharts: false,
            hasComparisons: false,
            hasTimelines: false,
            hasFormulas: false,
            hasProcessSteps: false,
            hasCyclicalProcesses: false,
            hasHierarchies: false,
            hasRelationships: false,
            codeSimulationTopics: [],
            interactiveElements: [],
          },
          beautifulSummaryElements: result.content.beautifulSummaryElements || {
            keyInsights: [],
            practicalApplications: [],
            whyItMatters: "This topic is important for academic understanding.",
            careerRelevance:
              "Understanding this topic enhances academic and professional skills.",
            difficultyLevel: "Intermediate",
            prerequisites: [],
            estimatedStudyTime: "2-3 hours",
          },
        };

        updateSubsection(subsectionIndex, enhancedSubsectionData);

        // Enhanced success message with more details
        const pageCount = result.content.pages.length;
        const resourceCount = Object.values(
          result.content.resources || {}
        ).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);

        toast.success(
          `✅ Generated ${pageCount} pages of enhanced academic content with ${resourceCount} learning resources for "${subsection.title}"`
        );
      } else {
        throw new Error(
          "Invalid response format from enhanced academic content API"
        );
      }
    } catch (error) {
      console.error(
        "❌ Error generating individual academic subsection:",
        error
      );
      updateSubsection(subsectionIndex, { isGenerating: false });
      toast.error(`Failed to generate academic content: ${error.message}`);
    }
  };

  // Add this function after generateSubsectionContent
  const generateResources = async () => {
    try {
      setIsGeneratingResources(true);

      // Get module content
      const moduleContent = localModule.content || "";
      const subsectionsContent =
        localModule.subsections?.map((s) => s.explanation || "").join("\n\n") ||
        "";
      const fullContent = `${moduleContent}\n\n${subsectionsContent}`;

      const response = await fetch("/api/academic-courses/generate-resources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          moduleTitle: localModule.title,
          moduleContent: fullContent,
          academicLevel,
          subject,
          semester,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate resources");
      }

      const data = await response.json();

      if (data.success && data.resources) {
        // Update module with new resources
        const updatedModule = { ...localModule };

        // Map the API response to our resource structure
        if (data.resources.videos && data.resources.videos.length > 0) {
          updatedModule.resources = updatedModule.resources || {};
          updatedModule.resources.videos = [
            ...(updatedModule.resources.videos || []),
            ...(data.resources.videos || [])
              .filter((video) => video && video.title)
              .map((video) => ({
                title: video.title,
                url: video.url,
                description: video.description,
                creator: video.author || video.creator,
                isAIGenerated: true,
              })),
          ];
        }

        if (data.resources.articles && data.resources.articles.length > 0) {
          updatedModule.resources = updatedModule.resources || {};
          updatedModule.resources.articles = [
            ...(updatedModule.resources.articles || []),
            ...(data.resources.articles || [])
              .filter((article) => article && article.title)
              .map((article) => ({
                title: article.title,
                url: article.url,
                description: article.description,
                author: article.author || article.creator,
                isAIGenerated: true,
              })),
          ];
        }

        if (data.resources.books && data.resources.books.length > 0) {
          updatedModule.resources = updatedModule.resources || {};
          updatedModule.resources.books = [
            ...(updatedModule.resources.books || []),
            ...(data.resources.books || [])
              .filter((book) => book && book.title)
              .map((book) => ({
                title: book.title,
                url: book.url,
                description: book.description,
                author: book.author || book.creator,
                isAIGenerated: true,
              })),
          ];
        }

        if (data.resources.courses && data.resources.courses.length > 0) {
          updatedModule.resources = updatedModule.resources || {};
          updatedModule.resources.courses = [
            ...(updatedModule.resources.courses || []),
            ...(data.resources.courses || [])
              .filter((course) => course && course.title)
              .map((course) => ({
                title: course.title,
                url: course.url,
                description: course.description,
                platform: course.platform || course.author || course.creator,
                isAIGenerated: true,
              })),
          ];
        }

        if (data.resources.tools && data.resources.tools.length > 0) {
          updatedModule.resources = updatedModule.resources || {};
          updatedModule.resources.tools = [
            ...(updatedModule.resources.tools || []),
            ...(data.resources.tools || [])
              .filter((tool) => tool && tool.title)
              .map((tool) => ({
                title: tool.title,
                url: tool.url,
                description: tool.description,
                creator: tool.creator || tool.author,
                isAIGenerated: true,
              })),
          ];
        }

        if (data.resources.websites && data.resources.websites.length > 0) {
          updatedModule.resources = updatedModule.resources || {};
          updatedModule.resources.websites = [
            ...(updatedModule.resources.websites || []),
            ...(data.resources.websites || [])
              .filter((website) => website && website.title)
              .map((website) => ({
                title: website.title,
                url: website.url,
                description: website.description,
                creator: website.creator || website.author,
                isAIGenerated: true,
              })),
          ];
        }

        if (
          data.resources.githubRepos &&
          data.resources.githubRepos.length > 0
        ) {
          updatedModule.resources = updatedModule.resources || {};
          updatedModule.resources.websites = [
            ...(updatedModule.resources.websites || []),
            ...(data.resources.githubRepos || [])
              .filter((repo) => repo && repo.title)
              .map((repo) => ({
                title: repo.title,
                url: repo.url,
                description: repo.description,
                creator: repo.creator || repo.author,
                isAIGenerated: true,
                isGithub: true,
              })),
          ];
        }

        if (data.resources.exercises && data.resources.exercises.length > 0) {
          updatedModule.resources = updatedModule.resources || {};
          updatedModule.resources.exercises = [
            ...(updatedModule.resources.exercises || []),
            ...(data.resources.exercises || [])
              .filter((exercise) => exercise && exercise.title)
              .map((exercise) => ({
                title: exercise.title,
                url: exercise.url,
                description: exercise.description,
                creator: exercise.creator || exercise.author,
                isAIGenerated: true,
              })),
          ];
        }

        // Update the module
        updateModule(updatedModule);

        toast.success("Learning resources have been added to your module.");
      }
    } catch (error) {
      console.error("Error generating resources:", error);
      toast.error("Failed to generate resources. Please try again.");
    } finally {
      setIsGeneratingResources(false);
    }
  };

  // ResourceSection component
  const ResourceSection = ({
    title,
    icon: Icon,
    resources,
    type,
    isInstructorContent = false,
  }) => {
    // Debug logging to identify problematic resources
    console.log(`ResourceSection Debug - ${type}:`, {
      resourcesCount: resources?.length,
      resources: resources,
      hasNullResources: resources?.some((r) => r === null || r === undefined),
      hasInvalidResources: resources?.some((r) => r && typeof r !== "object"),
      hasResourcesWithoutTitle: resources?.some(
        (r) => r && typeof r === "object" && !r.title && !r.name
      ),
    });
    if (!resources || resources.length === 0) return null;

    const getTypeGradient = () => {
      const baseGradients = {
        books:
          "from-blue-500/10 via-indigo-500/10 to-purple-500/10 border-blue-200/50",
        courses:
          "from-purple-500/10 via-pink-500/10 to-rose-500/10 border-purple-200/50",
        videos:
          "from-red-500/10 via-orange-500/10 to-yellow-500/10 border-red-200/50",
        articles:
          "from-green-500/10 via-emerald-500/10 to-teal-500/10 border-green-200/50",
        tools:
          "from-orange-500/10 via-amber-500/10 to-yellow-500/10 border-orange-200/50",
        websites:
          "from-indigo-500/10 via-blue-500/10 to-cyan-500/10 border-indigo-200/50",
        exercises:
          "from-pink-500/10 via-rose-500/10 to-red-500/10 border-pink-200/50",
      };

      return (
        baseGradients[type] ||
        "from-gray-500/10 via-slate-500/10 to-zinc-500/10 border-gray-200/50"
      );
    };

    const getIconColor = () => {
      switch (type) {
        case "books":
          return "text-blue-600";
        case "courses":
          return "text-purple-600";
        case "videos":
          return "text-red-600";
        case "articles":
          return "text-green-600";
        case "tools":
          return "text-orange-600";
        case "websites":
          return "text-indigo-600";
        case "exercises":
          return "text-pink-600";
        default:
          return "text-gray-600";
      }
    };

    return (
      <Card
        className={`bg-gradient-to-br ${getTypeGradient()} backdrop-blur-sm border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group`}
      >
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl font-bold">
            <div
              className={`p-2 rounded-xl bg-white/80 ${getIconColor()} group-hover:scale-110 transition-transform duration-300`}
            >
              <Icon className="h-6 w-6" />
            </div>
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {title}
            </span>
            <Badge
              variant="secondary"
              className="ml-auto bg-white/80 text-gray-700 font-semibold"
            >
              {resources.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {resources
              .filter((resource) => {
                // More robust filtering
                if (resource == null || resource === undefined) return false;
                if (typeof resource !== "object") return false;
                if (!resource.title && !resource.name) return false;
                return true;
              })
              .map((resource, index) => {
                // Additional safety check
                if (!resource || typeof resource !== "object") {
                  console.warn(
                    "Invalid resource object after filter:",
                    resource
                  );
                  return null;
                }

                const isEditing =
                  editingResource?.type === type &&
                  editingResource?.index === index;

                return (
                  <div
                    key={resource.id || index}
                    className="group/item bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl p-4 hover:bg-white/80 hover:shadow-md transition-all duration-300 hover:scale-[1.01]"
                  >
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-gray-900">
                            Edit Resource
                          </h4>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={saveResourceEdit}
                              className="bg-green-500 hover:bg-green-600 text-white"
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditingResource}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">
                              Title
                            </Label>
                            <Input
                              value={editForm.title || editForm.name || ""}
                              onChange={(e) =>
                                updateEditForm("title", e.target.value)
                              }
                              className="mt-1"
                              placeholder="Resource title"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">
                              URL
                            </Label>
                            <Input
                              value={editForm.url || ""}
                              onChange={(e) =>
                                updateEditForm("url", e.target.value)
                              }
                              className="mt-1"
                              placeholder="https://..."
                            />
                          </div>
                          <div className="col-span-full">
                            <Label className="text-sm font-medium text-gray-700">
                              Description
                            </Label>
                            <Textarea
                              value={editForm.description || ""}
                              onChange={(e) =>
                                updateEditForm("description", e.target.value)
                              }
                              className="mt-1"
                              placeholder="Resource description"
                              rows={3}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 mb-1">
                              {resource?.title ||
                                resource?.name ||
                                "Untitled Resource"}
                            </h4>
                            {resource?.description && (
                              <p className="text-sm text-gray-600 mb-2">
                                {resource.description}
                              </p>
                            )}
                            {resource?.url && (
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Visit Resource
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditingResource(type, index)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeResource(type, index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const [isGeneratingResources, setIsGeneratingResources] = useState(false);

  return (
    <div className="space-y-6">
      {/* Action Bar - Save/Publish */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 sticky top-4 z-10 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800">Course Actions</h3>
                <p className="text-sm text-green-600">
                  Save your changes or publish the course
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleSaveDraft}
                disabled={saving || publishing}
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Save Draft
                  </>
                )}
              </Button>

              <Button
                onClick={handlePublishCourse}
                disabled={saving || publishing}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                {publishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Trophy className="h-4 w-4 mr-2" />
                    Publish Course
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Module Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-800">
                  {localModule.title || "Untitled Module"}
                </CardTitle>
                <p className="text-gray-600">
                  {academicLevel} • {subject} • {semester}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
                <Trophy className="h-4 w-4 mr-1" />
                Academic Course
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Tabs */}
      <Tabs
        value={activeMainTab}
        onValueChange={setActiveMainTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="subsections" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Subsections
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Quizzes
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Resources
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Module Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="title" className="text-sm font-semibold">
                  Module Title
                </Label>
                <Input
                  id="title"
                  value={localModule.title || ""}
                  onChange={(e) => updateModuleField("title", e.target.value)}
                  placeholder="Enter module title..."
                  className="border-2 border-gray-200 focus:border-blue-500"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="summary" className="text-sm font-semibold">
                  AI Summary
                </Label>
                <Textarea
                  id="summary"
                  value={localModule.summary || ""}
                  onChange={(e) => updateModuleField("summary", e.target.value)}
                  placeholder="AI-generated summary will appear here..."
                  rows={4}
                  className="border-2 border-gray-200 focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Estimated Time
                  </Label>
                  <Input
                    value={localModule.estimatedTime || "45-60 mins"}
                    onChange={(e) =>
                      updateModuleField("estimatedTime", e.target.value)
                    }
                    placeholder="e.g., 45-60 mins"
                    className="border-2 border-gray-200 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Difficulty</Label>
                  <Select
                    value={localModule.difficulty || semester}
                    onValueChange={(value) =>
                      updateModuleField("difficulty", value)
                    }
                  >
                    <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Time Allocation
                  </Label>
                  <Input
                    value={localModule.timeAllocation || "45-60 minutes"}
                    onChange={(e) =>
                      updateModuleField("timeAllocation", e.target.value)
                    }
                    placeholder="e.g., 45-60 minutes"
                    className="border-2 border-gray-200 focus:border-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Learning Objectives */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Learning Objectives
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {localModule.objectives?.map((objective, index) => (
                <div
                  key={`objective-${index}`}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    {editingObjective === index ? (
                      <div className="flex items-center gap-2">
                        <Textarea
                          value={objective}
                          onChange={(e) =>
                            updateObjective(index, e.target.value)
                          }
                          rows={2}
                          className="flex-1 border-2 border-blue-300 focus:border-blue-500"
                        />
                        <Button
                          size="sm"
                          onClick={() => setEditingObjective(null)}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <p
                        className="text-sm cursor-pointer hover:text-blue-600"
                        onClick={() => setEditingObjective(index)}
                      >
                        {objective}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingObjective(index)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeObjective(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-2">
                <Textarea
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  placeholder="Add a new learning objective..."
                  rows={2}
                  className="flex-1 border-2 border-gray-200 focus:border-green-500"
                />
                <Button
                  onClick={addObjective}
                  disabled={!newObjective.trim()}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Examples */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Examples & Practice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {localModule.examples?.map((example, index) => (
                <div
                  key={`example-${index}`}
                  className="flex items-start gap-3"
                >
                  <div className="flex-1">
                    {editingExample === index ? (
                      <div className="flex items-center gap-2">
                        <Textarea
                          value={example}
                          onChange={(e) => updateExample(index, e.target.value)}
                          rows={3}
                          className="flex-1 border-2 border-blue-300 focus:border-blue-500"
                        />
                        <Button
                          size="sm"
                          onClick={() => setEditingExample(null)}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                        onClick={() => setEditingExample(index)}
                      >
                        <p className="text-sm">{example}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingExample(index)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeExample(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-2">
                <Textarea
                  value={newExample}
                  onChange={(e) => setNewExample(e.target.value)}
                  placeholder="Add a new example..."
                  rows={2}
                  className="flex-1 border-2 border-gray-200 focus:border-green-500"
                />
                <Button
                  onClick={addExample}
                  disabled={!newExample.trim()}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Module Content
                  {localModule.isAcademicCourse && (
                    <div className="flex items-center ml-3">
                      {saveStatus === "editing" && (
                        <Badge
                          variant="outline"
                          className="text-orange-600 border-orange-300 bg-orange-50"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editing...
                        </Badge>
                      )}
                      {saveStatus === "saving" && (
                        <Badge
                          variant="outline"
                          className="text-blue-600 border-blue-300 bg-blue-50"
                        >
                          <Timer className="h-3 w-3 mr-1" />
                          Saving...
                        </Badge>
                      )}
                      {saveStatus === "saved" && hasChanges && (
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-300 bg-green-50"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Saved
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                {localModule.isAcademicCourse && (
                  <div className="flex items-center gap-2">
                    {hasChanges && (
                      <Button
                        onClick={() => {
                          setSaveStatus("saving");
                          updateModule(localModule);
                          setTimeout(() => {
                            setSaveStatus("saved");
                          }, 500);
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white"
                        size="sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Save Now
                      </Button>
                    )}
                    <Button
                      onClick={enhanceContentStructure}
                      disabled={!localModule.content}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                      size="sm"
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      Enhance Structure
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {localModule.isAcademicCourse && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">
                    Academic Content Structure Guidelines:
                  </h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div>
                      <code className="bg-blue-100 px-1 rounded">#</code>{" "}
                      Module/Unit headings
                    </div>
                    <div>
                      <code className="bg-blue-100 px-1 rounded">##</code>{" "}
                      Section headings
                    </div>
                    <div>
                      <code className="bg-blue-100 px-1 rounded">###</code>{" "}
                      Subsection headings with detailed content
                    </div>
                  </div>
                </div>
              )}
              <Textarea
                value={localModule.content || ""}
                onChange={(e) => updateModuleField("content", e.target.value)}
                placeholder="Enter detailed module content using markdown structure:
# Unit 1: Introduction
## 1. Fundamental Concepts
### 1.1 Definition and Overview
Detailed explanation here...

### 1.2 Key Principles  
Detailed content with examples...

## 2. Advanced Topics
### 2.1 Complex Applications
Detailed discussion here..."
                rows={20}
                className="border-2 border-gray-200 focus:border-blue-500 resize-none font-mono text-sm"
              />
            </CardContent>
          </Card>

          {/* Debug Section - Show module structure */}
          {process.env.NODE_ENV === "development" && (
            <Card className="bg-gray-50 border-dashed">
              <CardHeader>
                <CardTitle className="text-sm text-gray-600">
                  Debug: Module Data Structure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs">
                  <div>
                    <strong>Module keys:</strong>{" "}
                    {Object.keys(localModule).join(", ")}
                  </div>
                  <div>
                    <strong>Detailed subsections count:</strong>{" "}
                    {detailedSubsections.length}
                  </div>
                  {detailedSubsections.length > 0 && (
                    <>
                      <div>
                        <strong>First subsection keys:</strong>{" "}
                        {Object.keys(detailedSubsections[0]).join(", ")}
                      </div>
                      <div>
                        <strong>First subsection title:</strong>{" "}
                        {detailedSubsections[0].title || "No title"}
                      </div>
                      <div>
                        <strong>First subsection has pages:</strong>{" "}
                        {
                          !!(
                            detailedSubsections[0].pages &&
                            detailedSubsections[0].pages.length > 0
                          )
                        }
                      </div>
                      <div>
                        <strong>First subsection page count:</strong>{" "}
                        {(detailedSubsections[0].pages || []).length}
                      </div>
                      <div>
                        <strong>First subsection raw data:</strong>{" "}
                        {JSON.stringify(detailedSubsections[0], null, 2).slice(
                          0,
                          200
                        )}
                        ...
                      </div>
                    </>
                  )}
                  <div>
                    <strong>Subsection quizzes:</strong>{" "}
                    {Object.keys(subsectionQuizzes).length}
                  </div>
                  <div>
                    <strong>Current page explanations count:</strong>{" "}
                    {currentPageExplanations.length}
                  </div>
                  <div>
                    <strong>Academic Level:</strong> {academicLevel}
                  </div>
                  <div>
                    <strong>Subject:</strong> {subject}
                  </div>
                  <div>
                    <strong>Semester:</strong> {semester}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Subsections Tab */}
        <TabsContent value="subsections" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Detailed Subsections
                  {detailedSubsections.length > 0 && (
                    <Badge variant="outline" className="ml-2">
                      {detailedSubsections.length} subsections,{" "}
                      {detailedSubsections.length * 8} pages
                    </Badge>
                  )}
                </CardTitle>
                {detailedSubsections.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={generateDetailedAcademicContent}
                    disabled={generatingDetailedContent}
                    className="ml-auto"
                  >
                    {generatingDetailedContent ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate Content
                      </>
                    )}
                  </Button>
                )}
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Page {currentExplanationPage + 1} of {totalExplanationPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={goToPrevExplanationPage}
                      disabled={currentExplanationPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={goToNextExplanationPage}
                      disabled={
                        currentExplanationPage === totalExplanationPages - 1
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {detailedSubsections.length === 0 ? (
                <div className="text-center py-8">
                  <Layers className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No detailed subsections generated yet.
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Generate detailed multipage subsections like technical
                    courses, or add `###` headings to your module content.
                  </p>
                  <div className="mt-6">
                    <Button
                      onClick={generateDetailedAcademicContent}
                      disabled={
                        generatingDetailedContent || !localModule.content
                      }
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    >
                      {generatingDetailedContent ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating Detailed Content...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Detailed Subsections
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      Creates 8-page detailed content for each subsection, just
                      like technical courses
                    </p>
                  </div>
                </div>
              ) : (
                currentPageExplanations.map((subsection, pageIndex) => {
                  const globalIndex = startExplanationIndex + pageIndex;

                  // Pages are now pre-parsed in the detailedSubsections memo
                  const subsectionPages = subsection.subsectionPages || {};
                  const currentSubsectionPage =
                    getCurrentExplanationPage(globalIndex);

                  // Handle academic multipage structure
                  let pages = [];
                  if (subsectionPages.type === "pages") {
                    pages = subsectionPages.data?.pages || [];
                  } else if (subsectionPages.data) {
                    pages = subsectionPages.data;
                  } else {
                    // Fallback: try to get pages directly from subsection
                    pages = subsection.pages || [];
                  }
                  
                  const currentPageData = pages[currentSubsectionPage];
                  
                  console.log("📄 Page retrieval debug:", {
                    subsectionTitle: subsection.title,
                    subsectionPagesType: subsectionPages.type,
                    hasDataPages: !!subsectionPages.data?.pages,
                    dataPagesLength: subsectionPages.data?.pages?.length || 0,
                    directPagesLength: subsection.pages?.length || 0,
                    currentSubsectionPage,
                    hasCurrentPageData: !!currentPageData,
                    currentPageContentLength: currentPageData?.content?.length || 0
                  });

                  // Ensure currentPageData is valid
                  if (!currentPageData) {
                    console.warn(
                      "Current page data is undefined for subsection:",
                      {
                        currentSubsectionPage,
                        totalPages: pages.length,
                        subsectionPages,
                      }
                    );
                  }

                  return (
                    <Card
                      key={globalIndex}
                      className="border-2 hover:border-blue-300 transition-colors"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold">
                              {globalIndex + 1}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">
                                {subsection.formattedTitle}
                              </h3>
                              <div className="flex items-center gap-4 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {subsection.estimatedTime || "15-20 mins"}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {subsection.difficulty || "Medium"}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setEditingSubsection(
                                  editingSubsection === globalIndex
                                    ? null
                                    : globalIndex
                                )
                              }
                            >
                              {editingSubsection === globalIndex ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Content Display */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700">
                            Content
                          </Label>
                          {editingSubsection === globalIndex ? (
                            <div className="space-y-4">
                              {/* Categorized Flashcards Editor */}
                              {(subsection.conceptFlashCards &&
                                Array.isArray(subsection.conceptFlashCards) &&
                                subsection.conceptFlashCards.length > 0) ||
                              (subsection.formulaFlashCards &&
                                Array.isArray(subsection.formulaFlashCards) &&
                                subsection.formulaFlashCards.length > 0) ? (
                                <div className="space-y-6">
                                  <div className="text-sm text-green-600 font-medium">
                                    🧠 Categorized Flashcards Editor (Concept +
                                    Formula)
                                  </div>

                                  {/* Summary */}
                                  <div className="space-y-2">
                                    <Label className="font-semibold">
                                      📝 Summary
                                    </Label>
                                    <Textarea
                                      value={subsection.summary || ""}
                                      onChange={(e) =>
                                        updateSubsection(globalIndex, {
                                          summary: e.target.value,
                                        })
                                      }
                                      placeholder="Enter subsection summary..."
                                      className="border-2 border-gray-300 focus:border-gray-500"
                                      rows={3}
                                    />
                                  </div>

                                  {/* Concept Flashcards Editor */}
                                  {subsection.conceptFlashCards &&
                                    subsection.conceptFlashCards.length > 0 && (
                                      <div className="space-y-4">
                                        <Label className="font-semibold text-lg flex items-center gap-2">
                                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                            🧠
                                          </div>
                                          Concept Cards (
                                          {subsection.conceptFlashCards.length})
                                        </Label>

                                        {/* Edit Mode for Concept Cards */}
                                        <div className="space-y-3">
                                          <Label className="font-semibold text-blue-700">
                                            Edit Concept Cards
                                          </Label>
                                          {subsection.conceptFlashCards.filter(card => card).map(
                                            (card, cardIndex) => (
                                              <Card
                                                key={`edit-concept-${cardIndex}`}
                                                className="p-4 border-blue-200 bg-blue-50/30"
                                              >
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                  <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-blue-700">
                                                      Question
                                                    </Label>
                                                    <Textarea
                                                      value={
                                                        card.question || ""
                                                      }
                                                      onChange={(e) => {
                                                        const updatedCards = [
                                                          ...subsection.conceptFlashCards,
                                                        ];
                                                        updatedCards[
                                                          cardIndex
                                                        ] = {
                                                          ...updatedCards[
                                                            cardIndex
                                                          ],
                                                          question:
                                                            e.target.value,
                                                        };
                                                        updateSubsection(
                                                          globalIndex,
                                                          {
                                                            conceptFlashCards:
                                                              updatedCards,
                                                          }
                                                        );
                                                      }}
                                                      rows={3}
                                                      placeholder="Enter concept question with LaTeX support..."
                                                      className="border-2 border-blue-300 focus:border-blue-500 bg-white/80"
                                                    />
                                                  </div>
                                                  <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-blue-700">
                                                      Answer
                                                    </Label>
                                                    <Textarea
                                                      value={card.answer || ""}
                                                      onChange={(e) => {
                                                        const updatedCards = [
                                                          ...subsection.conceptFlashCards,
                                                        ];
                                                        updatedCards[
                                                          cardIndex
                                                        ] = {
                                                          ...updatedCards[
                                                            cardIndex
                                                          ],
                                                          answer:
                                                            e.target.value,
                                                        };
                                                        updateSubsection(
                                                          globalIndex,
                                                          {
                                                            conceptFlashCards:
                                                              updatedCards,
                                                          }
                                                        );
                                                      }}
                                                      rows={3}
                                                      placeholder="Enter concept answer with LaTeX support..."
                                                      className="border-2 border-blue-300 focus:border-blue-500 bg-white/80"
                                                    />
                                                  </div>
                                                </div>
                                                <div className="flex justify-end mt-3">
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                      const updatedCards =
                                                        subsection.conceptFlashCards.filter(
                                                          (_, idx) =>
                                                            idx !== cardIndex
                                                        );
                                                      updateSubsection(
                                                        globalIndex,
                                                        {
                                                          conceptFlashCards:
                                                            updatedCards,
                                                        }
                                                      );
                                                    }}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              </Card>
                                            )
                                          )}

                                          {/* Add New Concept Card */}
                                          <Button
                                            size="sm"
                                            onClick={() => {
                                              const updatedCards = [
                                                ...(subsection.conceptFlashCards ||
                                                  []),
                                                { question: "", answer: "" },
                                              ];
                                              updateSubsection(globalIndex, {
                                                conceptFlashCards: updatedCards,
                                              });
                                            }}
                                            className="bg-blue-500 hover:bg-blue-600 text-white"
                                          >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Concept Card
                                          </Button>
                                        </div>
                                      </div>
                                    )}

                                  {/* Formula Flashcards Editor */}
                                  {subsection.formulaFlashCards &&
                                    subsection.formulaFlashCards.length > 0 && (
                                      <div className="space-y-4">
                                        <Label className="font-semibold text-lg flex items-center gap-2">
                                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                            🧮
                                          </div>
                                          Formula Cards (
                                          {subsection.formulaFlashCards.length})
                                        </Label>

                                        {/* Edit Mode for Formula Cards */}
                                        <div className="space-y-3">
                                          <Label className="font-semibold text-green-700">
                                            Edit Formula Cards
                                          </Label>
                                          {subsection.formulaFlashCards.filter(card => card).map(
                                            (card, cardIndex) => (
                                              <Card
                                                key={`edit-formula-${cardIndex}`}
                                                className="p-4 border-green-200 bg-green-50/30"
                                              >
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                  <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-green-700">
                                                      Question
                                                    </Label>
                                                    <Textarea
                                                      value={
                                                        card.question || ""
                                                      }
                                                      onChange={(e) => {
                                                        const updatedCards = [
                                                          ...subsection.formulaFlashCards,
                                                        ];
                                                        updatedCards[
                                                          cardIndex
                                                        ] = {
                                                          ...updatedCards[
                                                            cardIndex
                                                          ],
                                                          question:
                                                            e.target.value,
                                                        };
                                                        updateSubsection(
                                                          globalIndex,
                                                          {
                                                            formulaFlashCards:
                                                              updatedCards,
                                                          }
                                                        );
                                                      }}
                                                      rows={3}
                                                      placeholder="Enter formula question with LaTeX support ($E = mc^2$)..."
                                                      className="border-2 border-green-300 focus:border-green-500 bg-white/80"
                                                    />
                                                  </div>
                                                  <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-green-700">
                                                      Answer
                                                    </Label>
                                                    <Textarea
                                                      value={card.answer || ""}
                                                      onChange={(e) => {
                                                        const updatedCards = [
                                                          ...subsection.formulaFlashCards,
                                                        ];
                                                        updatedCards[
                                                          cardIndex
                                                        ] = {
                                                          ...updatedCards[
                                                            cardIndex
                                                          ],
                                                          answer:
                                                            e.target.value,
                                                        };
                                                        updateSubsection(
                                                          globalIndex,
                                                          {
                                                            formulaFlashCards:
                                                              updatedCards,
                                                          }
                                                        );
                                                      }}
                                                      rows={3}
                                                      placeholder="Enter formula answer with LaTeX support..."
                                                      className="border-2 border-green-300 focus:border-green-500 bg-white/80"
                                                    />
                                                  </div>
                                                </div>
                                                <div className="flex justify-end mt-3">
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                      const updatedCards =
                                                        subsection.formulaFlashCards.filter(
                                                          (_, idx) =>
                                                            idx !== cardIndex
                                                        );
                                                      updateSubsection(
                                                        globalIndex,
                                                        {
                                                          formulaFlashCards:
                                                            updatedCards,
                                                        }
                                                      );
                                                    }}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              </Card>
                                            )
                                          )}

                                          {/* Add New Formula Card */}
                                          <Button
                                            size="sm"
                                            onClick={() => {
                                              const updatedCards = [
                                                ...(subsection.formulaFlashCards ||
                                                  []),
                                                { question: "", answer: "" },
                                              ];
                                              updateSubsection(globalIndex, {
                                                formulaFlashCards: updatedCards,
                                              });
                                            }}
                                            className="bg-green-500 hover:bg-green-600 text-white"
                                          >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Formula Card
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                </div>
                              ) : subsection.conceptGroups &&
                                Array.isArray(subsection.conceptGroups) ? (
                                <div className="space-y-6">
                                  <div className="text-sm text-purple-600 font-medium">
                                    🧠 Enhanced Learning Content (JSON Format)
                                  </div>

                                  {/* Summary */}
                                  <div className="space-y-2">
                                    <Label className="font-semibold">
                                      Summary
                                    </Label>
                                    <Textarea
                                      value={subsection.summary || ""}
                                      onChange={(e) =>
                                        updateSubsection(globalIndex, {
                                          summary: e.target.value,
                                        })
                                      }
                                      placeholder="Brief overview of the subsection..."
                                      rows={2}
                                      className="border-2 border-purple-300 focus:border-purple-500"
                                    />
                                  </div>

                                  {/* Concept Groups */}
                                  <div className="space-y-4">
                                    <Label className="font-semibold">
                                      📚 Concept Groups
                                    </Label>
                                    {subsection.conceptGroups.filter(group => group).map(
                                      (group, groupIndex) => (
                                        <Card
                                          key={groupIndex}
                                          className="p-4 border-blue-200"
                                        >
                                          <div className="space-y-3">
                                            <Input
                                              value={group.title || ""}
                                              onChange={(e) => {
                                                const updatedGroups = [
                                                  ...subsection.conceptGroups,
                                                ];
                                                updatedGroups[groupIndex] = {
                                                  ...updatedGroups[groupIndex],
                                                  title: e.target.value,
                                                };
                                                updateSubsection(globalIndex, {
                                                  conceptGroups: updatedGroups,
                                                });
                                              }}
                                              placeholder="Concept Group Title"
                                              className="font-medium"
                                            />
                                            <Textarea
                                              value={group.description || ""}
                                              onChange={(e) => {
                                                const updatedGroups = [
                                                  ...subsection.conceptGroups,
                                                ];
                                                updatedGroups[groupIndex] = {
                                                  ...updatedGroups[groupIndex],
                                                  description: e.target.value,
                                                };
                                                updateSubsection(globalIndex, {
                                                  conceptGroups: updatedGroups,
                                                });
                                              }}
                                              rows={4}
                                              placeholder="Concept description with LaTeX support..."
                                              className="border-2 border-blue-300 focus:border-blue-500"
                                            />
                                          </div>
                                        </Card>
                                      )
                                    )}
                                  </div>

                                  {/* Concept Bullets */}
                                  {subsection.conceptBullets &&
                                    subsection.conceptBullets.length > 0 && (
                                      <div className="space-y-2">
                                        <Label className="font-semibold">
                                          ⚡ Concept Bullets
                                        </Label>
                                        {subsection.conceptBullets.map(
                                          (bullet, bulletIndex) => (
                                            <Input
                                              key={bulletIndex}
                                              value={bullet || ""}
                                              onChange={(e) => {
                                                const updatedBullets = [
                                                  ...subsection.conceptBullets,
                                                ];
                                                updatedBullets[bulletIndex] =
                                                  e.target.value;
                                                updateSubsection(globalIndex, {
                                                  conceptBullets:
                                                    updatedBullets,
                                                });
                                              }}
                                              placeholder="Concept bullet with emoji and LaTeX..."
                                              className="border-2 border-yellow-300 focus:border-yellow-500"
                                            />
                                          )
                                        )}
                                      </div>
                                    )}

                                  {/* Practical Use Case */}
                                  {subsection.practicalUseCase && (
                                    <div className="space-y-2">
                                      <Label className="font-semibold">
                                        🎯 Practical Use Case
                                      </Label>
                                      <Textarea
                                        value={
                                          subsection.practicalUseCase || ""
                                        }
                                        onChange={(e) =>
                                          updateSubsection(globalIndex, {
                                            practicalUseCase: e.target.value,
                                          })
                                        }
                                        rows={3}
                                        placeholder="Real-world application example..."
                                        className="border-2 border-indigo-300 focus:border-indigo-500"
                                      />
                                    </div>
                                  )}

                                  {/* Metadata */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm">
                                        Difficulty
                                      </Label>
                                      <Select
                                        value={
                                          subsection.difficulty ||
                                          "Intermediate"
                                        }
                                        onValueChange={(value) =>
                                          updateSubsection(globalIndex, {
                                            difficulty: value,
                                          })
                                        }
                                      >
                                        <SelectTrigger className="border-2 border-gray-300">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Beginner">
                                            Beginner
                                          </SelectItem>
                                          <SelectItem value="Intermediate">
                                            Intermediate
                                          </SelectItem>
                                          <SelectItem value="Advanced">
                                            Advanced
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label className="text-sm">
                                        Estimated Time
                                      </Label>
                                      <Input
                                        value={subsection.estimatedTime || ""}
                                        onChange={(e) =>
                                          updateSubsection(globalIndex, {
                                            estimatedTime: e.target.value,
                                          })
                                        }
                                        placeholder="e.g., 15-20 minutes"
                                        className="border-2 border-gray-300 focus:border-gray-500"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : subsection.pages &&
                                Array.isArray(subsection.pages) ? (
                                // Legacy pages structure display
                                <>
                                  {currentPageData &&
                                  typeof currentPageData === "object" ? (
                                    <div className="prose prose-sm max-w-none">
                                      <h4 className="font-semibold text-md mb-2">
                                        {currentPageData.title ||
                                          currentPageData.pageTitle ||
                                          "Page Content"}
                                      </h4>
                                      <UniversalContentRenderer
                                        content={
                                          typeof currentPageData.content ===
                                          "string"
                                            ? currentPageData.content
                                            : JSON.stringify(
                                                currentPageData.content
                                              )
                                        }
                                        className="page-content"
                                        enableAnalytics={false}
                                        accessibilityLabel="Academic page content with mathematical expressions"
                                      />
                                      {currentPageData.keyTakeaway && (
                                        <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                                          <p className="text-sm text-blue-800 italic">
                                            💡 Key Takeaway:{" "}
                                            {currentPageData.keyTakeaway}
                                          </p>
                                        </div>
                                      )}

                                      {/* Enhanced Content Elements */}
                                      {subsection.beautifulSummaryElements && (
                                        <div className="mt-4 space-y-3">
                                          {subsection.beautifulSummaryElements
                                            .keyInsights &&
                                            subsection.beautifulSummaryElements
                                              .keyInsights.length > 0 && (
                                              <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                                                <h5 className="font-semibold text-purple-800 mb-2">
                                                  🧠 Key Insights
                                                </h5>
                                                <ul className="text-sm text-purple-700 space-y-1">
                                                  {subsection.beautifulSummaryElements.keyInsights.map(
                                                    (insight, idx) => (
                                                      <li
                                                        key={idx}
                                                        className="flex items-start"
                                                      >
                                                        <span className="mr-2">
                                                          •
                                                        </span>
                                                        <span>{insight}</span>
                                                      </li>
                                                    )
                                                  )}
                                                </ul>
                                              </div>
                                            )}

                                          {subsection.beautifulSummaryElements
                                            .practicalApplications &&
                                            subsection.beautifulSummaryElements
                                              .practicalApplications.length >
                                              0 && (
                                              <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                                                <h5 className="font-semibold text-green-800 mb-2">
                                                  🎯 Practical Applications
                                                </h5>
                                                <ul className="text-sm text-green-700 space-y-1">
                                                  {subsection.beautifulSummaryElements.practicalApplications.map(
                                                    (app, idx) => (
                                                      <li
                                                        key={idx}
                                                        className="flex items-start"
                                                      >
                                                        <span className="mr-2">
                                                          •
                                                        </span>
                                                        <span>{app}</span>
                                                      </li>
                                                    )
                                                  )}
                                                </ul>
                                              </div>
                                            )}

                                          {subsection.beautifulSummaryElements
                                            .whyItMatters && (
                                            <div className="p-3 bg-amber-50 rounded-lg border-l-4 border-amber-400">
                                              <h5 className="font-semibold text-amber-800 mb-2">
                                                💡 Why This Matters
                                              </h5>
                                              <p className="text-sm text-amber-700">
                                                {
                                                  subsection
                                                    .beautifulSummaryElements
                                                    .whyItMatters
                                                }
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="prose prose-sm max-w-none">
                                      <h4 className="font-semibold text-md mb-2">
                                        {subsectionPages.data?.[0]?.title ||
                                          subsectionPages.data?.[0]
                                            ?.pageTitle ||
                                          "Content"}
                                      </h4>
                                      <MathMarkdownRenderer
                                        content={
                                          subsectionPages.data?.[0]?.content ||
                                          "No content available"
                                        }
                                      />
                                    </div>
                                  )}
                                  {Array.isArray(subsectionPages.data) &&
                                    subsectionPages.data.length > 1 && (
                                      <div className="flex items-center justify-end gap-2 mt-4">
                                        <span className="text-xs text-gray-500">
                                          Page {currentSubsectionPage + 1} of{" "}
                                          {subsectionPages.data.length}
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentExplanationPageForSubsection(
                                              globalIndex,
                                              Math.max(
                                                0,
                                                currentSubsectionPage - 1
                                              )
                                            );
                                          }}
                                          disabled={currentSubsectionPage === 0}
                                        >
                                          <ChevronLeft className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentExplanationPageForSubsection(
                                              globalIndex,
                                              Math.min(
                                                subsectionPages.data.length - 1,
                                                currentSubsectionPage + 1
                                              )
                                            );
                                          }}
                                          disabled={
                                            currentSubsectionPage >=
                                            subsectionPages.data.length - 1
                                          }
                                        >
                                          <ChevronRight className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    )}

                                  {/* Enhanced Learning Resources */}
                                  {subsection.resources && (
                                    <div className="mt-6 space-y-4">
                                      <h5 className="font-semibold text-gray-800 border-b border-gray-200 pb-2">
                                        📚 Learning Resources
                                      </h5>

                                      {/* Books */}
                                      {subsection.resources?.books &&
                                        Array.isArray(
                                          subsection.resources.books
                                        ) &&
                                        subsection.resources.books.length >
                                          0 && (
                                          <div className="space-y-2">
                                            <h6 className="font-medium text-sm text-blue-700 flex items-center">
                                              📖 Recommended Books
                                            </h6>
                                            <div className="grid gap-2">
                                              {subsection.resources.books
                                                .slice(0, 3)
                                                .filter(
                                                  (book) => book && book.title
                                                )
                                                .map((book, idx) => (
                                                  <div
                                                    key={idx}
                                                    className="p-2 bg-blue-50 rounded border-l-2 border-blue-300"
                                                  >
                                                    <a
                                                      href={book.url}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-sm font-medium text-blue-800 hover:text-blue-900 hover:underline"
                                                    >
                                                      {book.title}
                                                    </a>
                                                    {book.author && (
                                                      <p className="text-xs text-blue-600">
                                                        by {book.author}
                                                      </p>
                                                    )}
                                                    {book.description && (
                                                      <p className="text-xs text-blue-700 mt-1">
                                                        {book.description}
                                                      </p>
                                                    )}
                                                  </div>
                                                ))}
                                            </div>
                                          </div>
                                        )}

                                      {/* Courses */}
                                      {subsection.resources?.courses &&
                                        Array.isArray(
                                          subsection.resources.courses
                                        ) &&
                                        subsection.resources.courses.length >
                                          0 && (
                                          <div className="space-y-2">
                                            <h6 className="font-medium text-sm text-green-700 flex items-center">
                                              🎓 Online Courses
                                            </h6>
                                            <div className="grid gap-2">
                                              {subsection.resources.courses
                                                .slice(0, 3)
                                                .filter(
                                                  (course) =>
                                                    course && course.title
                                                )
                                                .map((course, idx) => (
                                                  <div
                                                    key={idx}
                                                    className="p-2 bg-green-50 rounded border-l-2 border-green-300"
                                                  >
                                                    <a
                                                      href={course.url}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-sm font-medium text-green-800 hover:text-green-900 hover:underline"
                                                    >
                                                      {course.title}
                                                    </a>
                                                    {course.platform && (
                                                      <p className="text-xs text-green-600">
                                                        on {course.platform}
                                                      </p>
                                                    )}
                                                    {course.description && (
                                                      <p className="text-xs text-green-700 mt-1">
                                                        {course.description}
                                                      </p>
                                                    )}
                                                  </div>
                                                ))}
                                            </div>
                                          </div>
                                        )}

                                      {/* Videos */}
                                      {subsection.resources?.videos &&
                                        Array.isArray(
                                          subsection.resources.videos
                                        ) &&
                                        subsection.resources.videos.length >
                                          0 && (
                                          <div className="space-y-2">
                                            <h6 className="font-medium text-sm text-red-700 flex items-center">
                                              🎥 Video Resources
                                            </h6>
                                            <div className="grid gap-2">
                                              {subsection.resources.videos
                                                .slice(0, 3)
                                                .filter(
                                                  (video) =>
                                                    video && video.title
                                                )
                                                .map((video, idx) => (
                                                  <div
                                                    key={idx}
                                                    className="p-2 bg-red-50 rounded border-l-2 border-red-300"
                                                  >
                                                    <a
                                                      href={video.url}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-sm font-medium text-red-800 hover:text-red-900 hover:underline"
                                                    >
                                                      {video.title}
                                                    </a>
                                                    {video.creator && (
                                                      <p className="text-xs text-red-600">
                                                        by {video.creator}
                                                      </p>
                                                    )}
                                                    {video.description && (
                                                      <p className="text-xs text-red-700 mt-1">
                                                        {video.description}
                                                      </p>
                                                    )}
                                                  </div>
                                                ))}
                                            </div>
                                          </div>
                                        )}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="space-y-4 text-center py-4">
                                  <p className="text-sm text-gray-500 italic">
                                    This subsection has no detailed content yet.
                                  </p>
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      generateIndividualAcademicSubsection(
                                        subsection,
                                        globalIndex
                                      );
                                    }}
                                    disabled={subsection.isGenerating}
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                                  >
                                    {subsection.isGenerating ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Generating Academic Content...
                                      </>
                                    ) : (
                                      <>
                                        <BookOpen className="h-4 w-4 mr-2" />
                                        Generate Academic Content
                                      </>
                                    )}
                                  </Button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div
                              className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 min-h-[100px]"
                              onClick={() => setEditingSubsection(globalIndex)}
                            >
                              {/* Handle different content structure types */}
                              {/* Force academic courses to use pages, not flashcards */}
                              {subsectionPages.type ===
                                "categorizedFlashCards" &&
                              !subsection.isAcademicContent ? (
                                // Categorized flashcard structure display (concept + formula cards)
                                <div className="space-y-4">
                                  <div className="prose prose-sm max-w-none">
                                    <h4 className="font-semibold text-lg mb-2 text-green-700">
                                      🧠 Concept & Formula Cards
                                    </h4>
                                    <p className="text-gray-700 mb-3">
                                      {subsectionPages.data.summary ||
                                        "Important concepts and formulas organized for better learning."}
                                    </p>
                                  </div>

                                  {/* Show message when no cards exist yet */}
                                  {(!subsectionPages.data.conceptFlashCards ||
                                    subsectionPages.data.conceptFlashCards
                                      .length === 0) &&
                                    (!subsectionPages.data.formulaFlashCards ||
                                      subsectionPages.data.formulaFlashCards
                                        .length === 0) && (
                                      <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-xl border-2 border-dashed border-gray-300 text-center">
                                        <div className="flex items-center justify-center mb-3">
                                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-lg">
                                              🧠
                                            </span>
                                          </div>
                                        </div>
                                        <h5 className="font-semibold text-gray-700 mb-2">
                                          No Flashcards Generated Yet
                                        </h5>
                                        <p className="text-gray-600 text-sm mb-3">
                                          Generate content for this subsection
                                          to see concept and formula cards.
                                        </p>
                                        <div className="text-xs text-gray-500">
                                          Expected: 🧠 Concept Cards + 🧮
                                          Formula Cards
                                        </div>
                                      </div>
                                    )}

                                  {/* Concept Flashcards Preview */}
                                  {subsectionPages.data.conceptFlashCards &&
                                    subsectionPages.data.conceptFlashCards
                                      .length > 0 && (
                                      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-xl border-2 border-blue-200">
                                        <h5 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                            🧠
                                          </div>
                                          Concept Cards (
                                          {
                                            subsectionPages.data
                                              .conceptFlashCards.length
                                          }
                                          )
                                        </h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {subsectionPages.data.conceptFlashCards
                                            .slice(0, 4)
                                            .filter(card => card)
                                            .map((card, idx) => (
                                              <div
                                                key={idx}
                                                className="group perspective-1000"
                                              >
                                                <div className="relative w-full h-32 transform-style-preserve-3d transition-transform duration-500 hover:rotate-y-180">
                                                  {/* Front of card - Question */}
                                                  <div className="absolute inset-0 w-full h-full backface-hidden bg-white rounded-lg p-4 flex flex-col justify-center items-center shadow-md hover:shadow-lg transition-all duration-300 border border-blue-200 editor-flashcard">
                                                    <div className="w-full text-center">
                                                      <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
                                                        Concept
                                                      </div>
                                                      <div className="text-gray-800 text-sm font-medium leading-snug">
                                                        <UniversalContentRenderer
                                                          content={
                                                            card.question
                                                          }
                                                          className="text-center"
                                                          enableTelemetry={
                                                            false
                                                          }
                                                        />
                                                      </div>
                                                    </div>
                                                  </div>
                                                  {/* Back of card - Answer */}
                                                  <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 flex flex-col justify-center items-center shadow-md border border-blue-200 editor-flashcard">
                                                    <div className="w-full text-center">
                                                      <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
                                                        Answer
                                                      </div>
                                                      <div className="text-gray-800 text-sm font-medium leading-snug">
                                                        <UniversalContentRenderer
                                                          content={card.answer}
                                                          className="text-center"
                                                          enableTelemetry={
                                                            false
                                                          }
                                                        />
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                        </div>
                                        {subsectionPages.data.conceptFlashCards
                                          .length > 4 && (
                                          <p className="text-sm text-blue-600 italic mt-4 text-center">
                                            +
                                            {subsectionPages.data
                                              .conceptFlashCards.length -
                                              4}{" "}
                                            more concept cards
                                          </p>
                                        )}
                                      </div>
                                    )}

                                  {/* Formula Flashcards Preview */}
                                  {subsectionPages.data.formulaFlashCards &&
                                    subsectionPages.data.formulaFlashCards
                                      .length > 0 && (
                                      <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6 rounded-xl border-2 border-green-200">
                                        <h5 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                            🧮
                                          </div>
                                          Formula Cards (
                                          {
                                            subsectionPages.data
                                              .formulaFlashCards.length
                                          }
                                          )
                                        </h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {subsectionPages.data.formulaFlashCards
                                            .slice(0, 4)
                                            .filter(card => card)
                                            .map((card, idx) => (
                                              <div
                                                key={idx}
                                                className="group perspective-1000"
                                              >
                                                <div className="relative w-full h-32 transform-style-preserve-3d transition-transform duration-500 hover:rotate-y-180">
                                                  {/* Front of card - Question */}
                                                  <div className="absolute inset-0 w-full h-full backface-hidden bg-white rounded-lg p-4 flex flex-col justify-center items-center shadow-md hover:shadow-lg transition-all duration-300 border border-green-200 editor-flashcard">
                                                    <div className="w-full text-center">
                                                      <div className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">
                                                        Formula
                                                      </div>
                                                      <div className="text-gray-800 text-sm font-medium leading-snug">
                                                        <UniversalContentRenderer
                                                          content={
                                                            card.question
                                                          }
                                                          className="text-center"
                                                          enableTelemetry={
                                                            false
                                                          }
                                                        />
                                                      </div>
                                                    </div>
                                                  </div>
                                                  {/* Back of card - Answer */}
                                                  <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 flex flex-col justify-center items-center shadow-md border border-green-200 editor-flashcard">
                                                    <div className="w-full text-center">
                                                      <div className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">
                                                        Formula
                                                      </div>
                                                      <div className="text-gray-800 text-sm font-medium leading-snug">
                                                        <UniversalContentRenderer
                                                          content={card.answer}
                                                          className="text-center"
                                                          enableTelemetry={
                                                            false
                                                          }
                                                        />
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                        </div>
                                        {subsectionPages.data.formulaFlashCards
                                          .length > 4 && (
                                          <p className="text-sm text-green-600 italic mt-4 text-center">
                                            +
                                            {subsectionPages.data
                                              .formulaFlashCards.length -
                                              4}{" "}
                                            more formula cards
                                          </p>
                                        )}
                                      </div>
                                    )}

                                  {/* Metadata */}
                                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-200">
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                      🧠{" "}
                                      {subsectionPages.data.conceptFlashCards
                                        ?.length || 0}{" "}
                                      Concept Cards
                                    </span>
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                      🧮{" "}
                                      {subsectionPages.data.formulaFlashCards
                                        ?.length || 0}{" "}
                                      Formula Cards
                                    </span>
                                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                      📊{" "}
                                      {subsectionPages.data.difficulty ||
                                        "Intermediate"}
                                    </span>
                                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                      ⏱️{" "}
                                      {subsectionPages.data.estimatedTime ||
                                        "5-10 min"}
                                    </span>
                                  </div>
                                </div>
                              ) : subsectionPages.type === "flashcards" &&
                                subsectionPages.data.flashcards &&
                                Array.isArray(
                                  subsectionPages.data.flashcards
                                ) ? (
                                // Academic flashcard content display (exactly 5 cards)
                                <div className="space-y-4">
                                  <div className="prose prose-sm max-w-none">
                                    <h4 className="font-semibold text-lg mb-2 text-blue-700">
                                      🃏 Academic Study Cards
                                    </h4>
                                    <p className="text-gray-700 mb-3">
                                      {subsectionPages.data.summary ||
                                        "5 essential flashcards for academic study and review."}
                                    </p>
                                  </div>

                                  {/* Show message when no cards exist yet */}
                                  {subsectionPages.data.flashcards.length ===
                                    0 && (
                                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-dashed border-gray-300 text-center">
                                      <div className="flex items-center justify-center mb-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                          <span className="text-white text-lg">
                                            🃏
                                          </span>
                                        </div>
                                      </div>
                                      <h5 className="font-semibold text-gray-700 mb-2">
                                        No Flashcards Generated Yet
                                      </h5>
                                      <p className="text-gray-600 text-sm mb-3">
                                        Generate content for this subsection to
                                        see 5 academic flashcards.
                                      </p>
                                      <div className="text-xs text-gray-500">
                                        Expected: 5 Academic Study Cards
                                      </div>
                                    </div>
                                  )}

                                  {/* Flashcards Display */}
                                  {subsectionPages.data.flashcards.length >
                                    0 && (
                                    <div className="grid gap-3">
                                      {subsectionPages.data.flashcards
                                        .slice(0, 5)
                                        .filter((card) => card)
                                        .map((card, cardIndex) => (
                                          <div
                                            key={card.id || cardIndex}
                                            className="perspective-1000"
                                          >
                                            <div className="group relative w-full h-32 transform-style-preserve-3d transition-transform duration-500 hover:rotate-y-180">
                                              {/* Front of card */}
                                              <div className="absolute inset-0 w-full h-full backface-hidden rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
                                                <div className="text-center">
                                                  <div className="text-xs text-blue-600 mb-1">
                                                    Q{cardIndex + 1} •{" "}
                                                    {card.category || "concept"}{" "}
                                                    •{" "}
                                                    {card.difficulty ||
                                                      "intermediate"}
                                                  </div>
                                                  <p className="text-sm font-medium text-blue-900 leading-relaxed">
                                                    {card.question}
                                                  </p>
                                                </div>
                                              </div>
                                              {/* Back of card */}
                                              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-lg border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
                                                <div className="text-center">
                                                  <div className="text-xs text-green-600 mb-1">
                                                    Answer
                                                  </div>
                                                  <p className="text-sm text-green-900 leading-relaxed">
                                                    {card.answer}
                                                  </p>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                  )}

                                  {/* Metadata */}
                                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-200">
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                      🃏{" "}
                                      {subsectionPages.data.flashcards
                                        ?.length || 0}{" "}
                                      Study Cards
                                    </span>
                                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                      📊{" "}
                                      {subsectionPages.data.difficulty ||
                                        "Intermediate"}
                                    </span>
                                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                      ⏱️{" "}
                                      {subsectionPages.data.estimatedTime ||
                                        "10-15 min"}
                                    </span>
                                  </div>
                                </div>
                              ) : (subsectionPages.type === "pages" &&
                                  pages.length > 0) ||
                                (subsection.isAcademicContent &&
                                  pages.length > 0) ? (
                                // Academic multipage content display
                                <>
                                  {currentPageData ? (
                                    <div className="prose prose-sm max-w-none">
                                      <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-semibold text-md">
                                          {currentPageData.pageTitle ||
                                            currentPageData.title}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              startEditingPage(
                                                globalIndex,
                                                currentSubsectionPage
                                              );
                                            }}
                                            className="text-xs"
                                          >
                                            <Edit className="h-3 w-3 mr-1" />
                                            Edit Page
                                          </Button>
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            Page{" "}
                                            {currentPageData.pageNumber ||
                                              currentSubsectionPage + 1}{" "}
                                            of {pages.length}
                                          </Badge>
                                        </div>
                                      </div>

                                      {(editingPage &&
                                      editingPage.subsectionIndex ===
                                        globalIndex &&
                                      editingPage.pageIndex ===
                                        currentSubsectionPage) ? (
                                        // Edit mode
                                        <div className="space-y-4 border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
                                          <div className="flex items-center justify-between">
                                            <h5 className="font-medium text-blue-800">
                                              Editing Page Content
                                            </h5>
                                            <div className="flex gap-2">
                                              <Button
                                                size="sm"
                                                onClick={savePageEdit}
                                              >
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Save
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={cancelPageEdit}
                                              >
                                                <X className="h-3 w-3 mr-1" />
                                                Cancel
                                              </Button>
                                            </div>
                                          </div>

                                          <div className="space-y-3">
                                            <div>
                                              <Label
                                                htmlFor="edit-page-title"
                                                className="text-sm font-medium"
                                              >
                                                Page Title
                                              </Label>
                                              <Input
                                                id="edit-page-title"
                                                key={`edit-title-${editingPage?.subsectionIndex}-${editingPage?.pageIndex}`}
                                                value={editingTitle}
                                                onChange={(e) =>
                                                  setEditingTitle(
                                                    e.target.value
                                                  )
                                                }
                                                className="mt-1"
                                                placeholder="Enter page title"
                                              />
                                            </div>

                                            <div>
                                              <Label
                                                htmlFor="edit-page-content"
                                                className="text-sm font-medium"
                                              >
                                                Content (Markdown supported)
                                              </Label>
                                              <Textarea
                                                id="edit-page-content"
                                                key={`edit-content-${editingPage?.subsectionIndex}-${editingPage?.pageIndex}`}
                                                value={editingContent}
                                                onChange={(e) =>
                                                  setEditingContent(
                                                    e.target.value
                                                  )
                                                }
                                                rows={15}
                                                className="mt-1 font-mono text-sm"
                                                placeholder="Enter page content using Markdown formatting..."
                                              />
                                            </div>

                                            <div>
                                              <Label
                                                htmlFor="edit-page-takeaway"
                                                className="text-sm font-medium"
                                              >
                                                Key Takeaway
                                              </Label>
                                              <Input
                                                id="edit-page-takeaway"
                                                key={`edit-takeaway-${editingPage?.subsectionIndex}-${editingPage?.pageIndex}`}
                                                value={editingTakeaway}
                                                onChange={(e) =>
                                                  setEditingTakeaway(
                                                    e.target.value
                                                  )
                                                }
                                                className="mt-1"
                                                placeholder="Enter key takeaway for this page"
                                              />
                                            </div>
                                          </div>

                                          {/* Preview */}
                                          <div className="border-t pt-3">
                                            <Label className="text-sm font-medium mb-2 block">
                                              Preview:
                                            </Label>
                                            <div className="bg-white rounded border p-3 max-h-40 overflow-y-auto">
                                              <UniversalContentRenderer
                                                content={
                                                  editingContent ||
                                                  "No content to preview"
                                                }
                                                className="text-sm"
                                                enableAnalytics={false}
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        // View mode
                                        <>
                                          <UniversalContentRenderer
                                            content={
                                              typeof currentPageData.content ===
                                              "string"
                                                ? currentPageData.content
                                                : JSON.stringify(
                                                    currentPageData.content
                                                  )
                                            }
                                            className="page-content"
                                            enableAnalytics={false}
                                          />
                                          {currentPageData.keyTakeaway && (
                                            <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                                              <p className="text-sm text-blue-800 italic">
                                                💡 Key Takeaway:{" "}
                                                {currentPageData.keyTakeaway}
                                              </p>
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="prose prose-sm max-w-none">
                                      <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-semibold text-md">
                                          {pages[0]?.pageTitle ||
                                            pages[0]?.title ||
                                            "Academic Content"}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              alert(`Edit button clicked! Subsection: ${globalIndex}, Page: 0`);
                                              console.log("🔴 EDIT BUTTON CLICKED", { globalIndex, pageIndex: 0 });
                                              startEditingPage(
                                                globalIndex,
                                                0
                                              );
                                            }}
                                            className="text-xs"
                                          >
                                            <Edit className="h-3 w-3 mr-1" />
                                            Edit Page
                                          </Button>
                                        </div>
                                      </div>

                                      {(editingPage &&
                                      editingPage.subsectionIndex ===
                                        globalIndex &&
                                      editingPage.pageIndex === 0) ? (
                                        // Edit mode
                                        <div className="space-y-4 border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
                                          <div className="flex items-center justify-between">
                                            <h5 className="font-medium text-blue-800">
                                              Editing Page Content
                                            </h5>
                                            <div className="flex gap-2">
                                              <Button
                                                size="sm"
                                                onClick={savePageEdit}
                                              >
                                                Save
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={cancelPageEdit}
                                              >
                                                Cancel
                                              </Button>
                                            </div>
                                          </div>

                                          <div className="space-y-4">
                                            <div>
                                              <Label
                                                htmlFor="edit-page-title"
                                                className="text-sm font-medium"
                                              >
                                                Page Title
                                              </Label>
                                              <Input
                                                id="edit-page-title"
                                                value={editingTitle}
                                                onChange={(e) =>
                                                  setEditingTitle(e.target.value)
                                                }
                                                className="mt-1"
                                                placeholder="Enter page title"
                                              />
                                            </div>

                                            <div>
                                              <Label
                                                htmlFor="edit-page-content"
                                                className="text-sm font-medium"
                                              >
                                                Content (Markdown supported)
                                              </Label>
                                              <Textarea
                                                id="edit-page-content"
                                                value={editingContent}
                                                onChange={(e) =>
                                                  setEditingContent(
                                                    e.target.value
                                                  )
                                                }
                                                rows={15}
                                                className="mt-1 font-mono text-sm"
                                                placeholder="Enter page content using Markdown..."
                                              />
                                            </div>

                                            <div>
                                              <Label
                                                htmlFor="edit-page-takeaway"
                                                className="text-sm font-medium"
                                              >
                                                Key Takeaway
                                              </Label>
                                              <Input
                                                id="edit-page-takeaway"
                                                value={editingTakeaway}
                                                onChange={(e) =>
                                                  setEditingTakeaway(
                                                    e.target.value
                                                  )
                                                }
                                                className="mt-1"
                                                placeholder="Enter key takeaway"
                                              />
                                            </div>

                                            <Label className="text-sm font-medium">
                                              Preview:
                                            </Label>
                                            <div className="bg-white rounded border p-3 max-h-40 overflow-y-auto">
                                              <UniversalContentRenderer
                                                content={
                                                  editingContent ||
                                                  "No content to preview"
                                                }
                                                className="text-sm"
                                                enableAnalytics={false}
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        // View mode
                                        <MathMarkdownRenderer
                                          content={
                                            pages[0]?.content ||
                                            "No content available"
                                          }
                                        />
                                      )}
                                    </div>
                                  )}
                                  {pages.length > 1 && (
                                    <div className="flex items-center justify-end gap-2 mt-4">
                                      <span className="text-xs text-gray-500">
                                        Page {currentSubsectionPage + 1} of{" "}
                                        {pages.length}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setCurrentExplanationPageForSubsection(
                                            globalIndex,
                                            Math.max(
                                              0,
                                              currentSubsectionPage - 1
                                            )
                                          );
                                        }}
                                        disabled={currentSubsectionPage === 0}
                                      >
                                        <ChevronLeft className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setCurrentExplanationPageForSubsection(
                                            globalIndex,
                                            Math.min(
                                              pages.length - 1,
                                              currentSubsectionPage + 1
                                            )
                                          );
                                        }}
                                        disabled={
                                          currentSubsectionPage >=
                                          pages.length - 1
                                        }
                                      >
                                        <ChevronRight className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </>
                              ) : subsection.isAcademicContent ? (
                                <div className="space-y-4 text-center py-4">
                                  <p className="text-sm text-gray-500 italic">
                                    This subsection has no detailed multipage
                                    content yet.
                                  </p>
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      generateIndividualAcademicSubsection(
                                        subsection,
                                        globalIndex
                                      );
                                    }}
                                    disabled={subsection.isGenerating}
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                                  >
                                    {subsection.isGenerating ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Generating Academic Content...
                                      </>
                                    ) : (
                                      <>
                                        <BookOpen className="h-4 w-4 mr-2" />
                                        Generate Academic Content
                                      </>
                                    )}
                                  </Button>
                                </div>
                              ) : (
                                <div className="space-y-4 text-center py-4">
                                  <p className="text-sm text-gray-500 italic">
                                    This subsection has no detailed content yet.
                                  </p>
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      generateIndividualAcademicSubsection(
                                        subsection,
                                        globalIndex
                                      );
                                    }}
                                    disabled={subsection.isGenerating}
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                                  >
                                    {subsection.isGenerating ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Generating Academic Content...
                                      </>
                                    ) : (
                                      <>
                                        <BookOpen className="h-4 w-4 mr-2" />
                                        Generate Academic Content
                                      </>
                                    )}
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Quiz Generation for Subsection */}
                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <Label className="text-sm font-medium text-gray-700">
                              Quiz Generation
                            </Label>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  selectedProviders.quiz === "gemini"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-purple-50 text-purple-700 border-purple-200"
                                }`}
                              >
                                {selectedProviders.quiz === "gemini"
                                  ? "🧠 Gemini"
                                  : "🔍 Perplexity"}
                              </Badge>
                              <Dialog
                                open={showProviderSelector}
                                onOpenChange={setShowProviderSelector}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    <Settings className="h-3 w-3 mr-1" />
                                    Provider
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>
                                      AI Provider Selection
                                    </DialogTitle>
                                    <DialogDescription>
                                      Choose which AI provider to use for
                                      generating quizzes. Each provider has
                                      different strengths.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <AIProviderSelector
                                    selectedProviders={selectedProviders}
                                    onProviderChange={handleProviderChange}
                                  />
                                </DialogContent>
                              </Dialog>
                              <Badge variant="outline" className="text-xs">
                                3 Difficulty Levels
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {["easy", "medium", "hard"].map((difficulty) => {
                              const quizKey = `${globalIndex}_${difficulty}`;
                              const hasQuiz = subsectionQuizzes[quizKey];
                              const isGenerating = generatingQuiz[quizKey];
                              const progress = quizProgress[quizKey] || 0;

                              return (
                                <div key={difficulty} className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium capitalize">
                                      {difficulty}
                                    </span>
                                    {hasQuiz && (
                                      <Badge className="bg-green-100 text-green-800 text-xs">
                                        Ready
                                      </Badge>
                                    )}
                                  </div>

                                  {isGenerating ? (
                                    <div className="space-y-2">
                                      <Progress
                                        value={progress}
                                        className="h-2"
                                      />
                                      <p className="text-xs text-gray-600">
                                        Generating...
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant={
                                          hasQuiz ? "outline" : "default"
                                        }
                                        onClick={async (e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          console.log(
                                            "🔘 Quiz button clicked:",
                                            {
                                              difficulty,
                                              globalIndex,
                                              subsection: subsection.title,
                                            }
                                          );
                                          await generateSubsectionQuiz(
                                            subsection,
                                            globalIndex,
                                            difficulty
                                          );
                                        }}
                                        disabled={isGenerating}
                                        className="flex-1"
                                      >
                                        {hasQuiz ? (
                                          <>
                                            <RefreshCw className="h-3 w-3 mr-1" />
                                            Update
                                          </>
                                        ) : (
                                          <>
                                            <Trophy className="h-3 w-3 mr-1" />
                                            Create
                                          </>
                                        )}
                                      </Button>

                                      {hasQuiz && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() =>
                                            deleteSubsectionQuiz(
                                              globalIndex,
                                              difficulty
                                            )
                                          }
                                          className="text-red-500 hover:text-red-700"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  )}

                                  {hasQuiz && (
                                    <div className="text-xs text-gray-600">
                                      <div>
                                        {hasQuiz.totalQuestions || 15} questions
                                      </div>
                                      {hasQuiz.generatedWith && (
                                        <div className="text-xs text-blue-600">
                                          via{" "}
                                          {hasQuiz.generatedWith.includes(
                                            "gemini"
                                          )
                                            ? "Gemini"
                                            : hasQuiz.generatedWith.includes(
                                                "perplexity"
                                              )
                                            ? "Perplexity"
                                            : hasQuiz.generatedWith}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Generated Quizzes Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(subsectionQuizzes).length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No quizzes generated yet.</p>
                  <div className="text-sm text-gray-400 mt-2">
                    Go to the Subsections tab to create quizzes for each
                    section.
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(subsectionQuizzes).map(([quizKey, quiz]) => {
                    const [subsectionIndex, difficulty] = quizKey.split("_");
                    const difficultyColors = {
                      easy: "bg-green-100 text-green-800",
                      medium: "bg-yellow-100 text-yellow-800",
                      hard: "bg-red-100 text-red-800",
                    };

                    return (
                      <Card
                        key={quizKey}
                        className="border-l-4 border-l-blue-500"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">
                                {quiz.formattedSubsectionTitle ||
                                  quiz.subsectionTitle}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={difficultyColors[difficulty]}>
                                  {difficulty.charAt(0).toUpperCase() +
                                    difficulty.slice(1)}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {quiz.totalQuestions || 15} questions
                                </span>
                                <span className="text-sm text-gray-600">
                                  Created:{" "}
                                  {new Date(
                                    quiz.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  deleteSubsectionQuiz(
                                    parseInt(subsectionIndex),
                                    difficulty
                                  )
                                }
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          <div className="space-y-6">
            {/* Resource Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(resourceCategories).map(
                ([category, categoryData]) => {
                  // Safety check for resourceCategories entries
                  if (
                    !category ||
                    !categoryData ||
                    typeof categoryData !== "object"
                  ) {
                    console.warn("Invalid resourceCategories entry:", {
                      category,
                      categoryData,
                    });
                    return null;
                  }

                  const { icon: Icon, label, color } = categoryData;

                  if (!Icon || !label || !color) {
                    console.warn(
                      "Invalid resourceCategories entry properties:",
                      {
                        category,
                        Icon,
                        label,
                        color,
                      }
                    );
                    return null;
                  }

                  return (
                    <div key={category}>
                      {localModule.resources?.[category]?.length > 0 ? (
                        <ResourceSection
                          title={label}
                          icon={Icon}
                          resources={localModule.resources[category]}
                          type={category}
                        />
                      ) : (
                        <Card className="border-dashed border-2 border-gray-200 hover:border-gray-300 transition-colors">
                          <CardContent className="text-center py-8">
                            <Icon
                              className={`h-12 w-12 text-gray-300 mx-auto mb-4`}
                            />
                            <h3 className="text-lg font-medium text-gray-500 mb-2">
                              No {label} Added Yet
                            </h3>
                            <div className="text-gray-400 mb-4">
                              Add your first {label.toLowerCase()} resource
                            </div>
                            <Button
                              onClick={() => {
                                setNewResource((prev) => ({
                                  ...prev,
                                  type: category.slice(0, -1),
                                }));
                                setShowManualResourceForm(true);
                              }}
                              variant="outline"
                              className={`border-${color}-300 text-${color}-700 hover:bg-${color}-50`}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add First {label.slice(0, -1)}
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  );
                }
              )}
            </div>

            {/* Add Resource Button */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-green-800 mb-2">
                      Add New Resource
                    </h3>
                    <div className="text-green-600">
                      Enhance your module with additional learning resources
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Button
                      onClick={generateResources}
                      disabled={isGeneratingResources}
                      className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto"
                    >
                      {isGeneratingResources ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Best Resources
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowManualResourceForm(true)}
                      className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Manually
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Manual Resource Form */}
            {showManualResourceForm && newResource && (
              <Card className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-amber-200 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl text-amber-800">
                    <Plus className="h-6 w-6" />
                    Add New Resource
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-amber-800">
                      Resource Type
                    </Label>
                    <Select
                      value={newResource?.type || "article"}
                      onValueChange={(value) =>
                        setNewResource((prev) => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger className="h-12 border-2 border-amber-200 focus:border-amber-500 transition-colors duration-300 bg-white/80">
                        <SelectValue placeholder="Select resource type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="article">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-green-600" />
                            Article
                          </div>
                        </SelectItem>
                        <SelectItem value="video">
                          <div className="flex items-center gap-2">
                            <Video className="h-4 w-4 text-red-600" />
                            Video
                          </div>
                        </SelectItem>
                        <SelectItem value="book">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                            Book
                          </div>
                        </SelectItem>
                        <SelectItem value="course">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-purple-600" />
                            Course
                          </div>
                        </SelectItem>
                        <SelectItem value="tool">
                          <div className="flex items-center gap-2">
                            <Wrench className="h-4 w-4 text-orange-600" />
                            Tool
                          </div>
                        </SelectItem>
                        <SelectItem value="website">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-indigo-600" />
                            Website
                          </div>
                        </SelectItem>
                        <SelectItem value="exercise">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-pink-600" />
                            Exercise
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-amber-800">
                      Title
                    </Label>
                    <Input
                      value={newResource?.title || ""}
                      onChange={(e) =>
                        setNewResource((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Resource title"
                      className="h-12 border-2 border-amber-200 focus:border-amber-500 transition-colors duration-300 bg-white/80"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-amber-800">
                      URL (optional)
                    </Label>
                    <Input
                      value={newResource?.url || ""}
                      onChange={(e) =>
                        setNewResource((prev) => ({
                          ...prev,
                          url: e.target.value,
                        }))
                      }
                      placeholder="https://..."
                      className="h-12 border-2 border-amber-200 focus:border-amber-500 transition-colors duration-300 bg-white/80"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-amber-800">
                      Description
                    </Label>
                    <Textarea
                      value={newResource?.description || ""}
                      onChange={(e) =>
                        setNewResource((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Resource description"
                      rows={3}
                      className="border-2 border-amber-200 focus:border-amber-500 transition-colors duration-300 bg-white/80"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <Button
                      onClick={handleAddManualResource}
                      disabled={!newResource?.title || !newResource?.type}
                      className="bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Resource
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowManualResourceForm(false)}
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
