"use client";

import { useState, useMemo, useEffect } from "react";
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

// Helper function to handle the academic flashcard structure
function getAcademicSubsectionData(subsection) {
  console.log("🔍 getAcademicSubsectionData called with:", {
    hasConceptFlashCards: !!subsection.conceptFlashCards,
    conceptFlashCardsLength: subsection.conceptFlashCards?.length || 0,
    hasFormulaFlashCards: !!subsection.formulaFlashCards,
    formulaFlashCardsLength: subsection.formulaFlashCards?.length || 0,
    hasLegacyFlashCards: !!subsection.flashCards,
    legacyFlashCardsLength: subsection.flashCards?.length || 0,
    subsectionKeys: Object.keys(subsection),
  });

  // FORCE categorized structure for ALL academic subsections
  console.log(
    "🔄 Converting to categorized flashcard structure for academic subsection:",
    subsection.title
  );

  // If we have categorized data, use it
  if (
    (subsection.conceptFlashCards &&
      Array.isArray(subsection.conceptFlashCards) &&
      subsection.conceptFlashCards.length > 0) ||
    (subsection.formulaFlashCards &&
      Array.isArray(subsection.formulaFlashCards) &&
      subsection.formulaFlashCards.length > 0)
  ) {
    console.log(
      "✅ Using existing categorized flashCards for academic content"
    );
    return {
      type: "categorizedFlashCards",
      data: {
        ...subsection,
        // Remove any legacy data to prevent confusion
        flashCards: undefined,
        conceptGroups: undefined,
        pages: undefined,
      },
    };
  }

  // Create empty categorized structure (ignore any legacy data)
  console.log(
    "📋 Creating empty categorized structure for academic content - legacy data ignored"
  );
  return {
    type: "categorizedFlashCards",
    data: {
      title: subsection.title || "Academic Subsection",
      summary:
        subsection.summary ||
        "Generate content to see concept and formula cards for academic learning",
      conceptFlashCards: [],
      formulaFlashCards: [],
      difficulty: subsection.difficulty || "Intermediate",
      estimatedTime: subsection.estimatedTime || "5-10 minutes",
      // Explicitly remove legacy data
      flashCards: undefined,
      conceptGroups: undefined,
      pages: undefined,
    },
  };
}

function parseAcademicMarkdownToPages(markdown) {
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
    const title = lines.shift()?.trim() || "Untitled Academic Section";
    const content = lines.join("\\n").trim();
    if (title && content) {
      pages.push({ title, content });
    }
  });

  // If, after all that, we have no pages but there was intro content,
  // it means there were no "####" delimiters. Treat the whole thing as one page.
  if (pages.length === 0 && introContent) {
    return [{ title: "Academic Content", content: introContent }];
  }

  return pages;
}

function parseAcademicMarkdownToSubsections(markdownContent) {
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
  examType,
  subject,
  learnerLevel,
  course,
  courseId,
  onSaveSuccess,
}) {
  const { getAuthHeaders, user, apiCall, isTokenValid } = useAuth();

  // Initialize local module state for academic editing
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
      // Force academic course specific fields
      isAcademicCourse: true,
      courseType: "academic",
      moduleType: "academic",
      hasUnits: module.hasUnits || false,
      unitStructure: module.unitStructure || {},
      academicLevel: course?.academicLevel || learnerLevel || "undergraduate",
      isTechnicalCourse: true,
    };

    console.log("📝 Initializing Academic Module Editor:", {
      moduleTitle: initialState.title,
      hasContent: !!initialState.content,
      contentLength: initialState.content?.length,
      hasDetailedSubsections: !!initialState.detailedSubsections?.length,
      isAcademicCourse: initialState.isAcademicCourse,
      academicLevel: initialState.academicLevel,
      originalModule: module,
    });

    return initialState;
  });

  // Track if module has been modified
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState("saved"); // "saved", "editing", "saving"

  // Sync local module state when module prop changes (important for Academic courses)
  useEffect(() => {
    console.log("🔄 Academic Module prop changed, updating localModule:", {
      moduleTitle: module.title,
      hasContent: !!module.content,
      hasDetailedSubsections: !!module.detailedSubsections?.length,
      isAcademicCourse: module.isAcademicCourse,
    });

    setLocalModule((prev) => ({
      ...module,
      // Ensure required fields are initialized
      title: module.title || "",
      content: module.content || "",
      summary: module.summary || "",
      objectives: module.objectives || [],
      examples: module.examples || [],
      detailedSubsections: module.detailedSubsections || [],
      // Force academic course specific fields - ALWAYS academic in this component
      isAcademicCourse: true,
      courseType: "academic",
      moduleType: "academic",
      hasUnits: module.hasUnits || false,
      unitStructure: module.unitStructure || {},
      academicLevel: course?.academicLevel || learnerLevel || "undergraduate",
      isTechnicalCourse: true,
    }));

    // Reset changes flag when module prop changes
    setHasChanges(false);
  }, [module, course?.academicLevel, learnerLevel]);

  // Main tabs state
  const [activeMainTab, setActiveMainTab] = useState("overview");

  // Save/publish state
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Academic explanations pagination
  const [currentExplanationPage, setCurrentExplanationPage] = useState(0);
  const [explanationsPerPage] = useState(3);

  // Individual explanation pagination
  const [explanationPages, setExplanationPages] = useState({});
  const [wordsPerExplanationPage] = useState(200);

  // Academic quiz generation state
  const [generatingQuiz, setGeneratingQuiz] = useState({});
  const [quizProgress, setQuizProgress] = useState({});
  const [subsectionQuizzes, setSubsectionQuizzes] = useState(
    module.subsectionQuizzes || {}
  );

  // Academic resource management
  const [showManualResourceForm, setShowManualResourceForm] = useState(false);
  const [newResource, setNewResource] = useState({
    title: "",
    url: "",
    description: "",
    type: "article",
  });
  const [editingResource, setEditingResource] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Edit states
  const [editingObjective, setEditingObjective] = useState(null);
  const [editingExample, setEditingExample] = useState(null);
  const [editingSubsection, setEditingSubsection] = useState(null);
  const [newObjective, setNewObjective] = useState("");
  const [newExample, setNewExample] = useState("");

  // AI Provider selection state for academic content
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
      `Academic quiz provider updated to ${
        newProviders.quiz === "gemini" ? "Google Gemini" : "Perplexity AI"
      }`
    );
  };

  // Debounced parent update to prevent constant saving while editing
  const [updateTimeout, setUpdateTimeout] = useState(null);

  const debouncedParentUpdate = (updatedModule) => {
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }

    const newTimeout = setTimeout(() => {
      if (onUpdate) {
        setSaveStatus("saving");
        console.log("🔄 Academic Module: Debounced parent update");
        onUpdate(updatedModule);

        // Set status back to saved after a brief delay
        setTimeout(() => {
          setSaveStatus("saved");
          setHasChanges(false); // Reset changes flag after successful save
        }, 500);
      }
    }, 2000); // Wait 2 seconds after user stops typing (increased for better UX)

    setUpdateTimeout(newTimeout);
  };

  // Helper function for Academic Module Editor - ALWAYS use debounced updates
  const updateModule = (updatedModule) => {
    console.log(
      "🎓 Academic Module Editor: Using debounced update for smooth editing"
    );
    debouncedParentUpdate(updatedModule);
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
        ? `${parentName}: ${mdSub.name}`
        : mdSub.name;

      return {
        ...aiSub, // a lot of rich content
        title: mdSub.title, // overwrite with the one from markdown for consistency
        formattedTitle: formattedTitle,
        unitContext: mdSub.unitContext, // Add unit context
        isAcademicContent: mdSub.isAcademicContent,
        // Pre-parse the pages here, outside the render loop
        subsectionPages: getAcademicSubsectionData(aiSub),
      };
    });
  }, [localModule.content, localModule.detailedSubsections]);

  // Enhanced local module field update function
  const updateLocalModuleField = (field, value) => {
    const valuePreview =
      typeof value === "string"
        ? value.length > 100
          ? value.substring(0, 100) + "..."
          : value
        : Array.isArray(value)
        ? `Array(${value.length})`
        : typeof value;

    console.log("🔄 Academic Module: Updating field:", {
      field,
      valuePreview,
      hasChanges,
    });

    setLocalModule((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };
      return updated;
    });
    setHasChanges(true);
    setSaveStatus("editing");
  };

  // Enhanced update module fields for academic content
  const updateModuleField = (field, value) => {
    console.log("📝 Academic Module: updateModuleField called:", {
      field,
      valueLength: typeof value === "string" ? value?.length : typeof value,
      isAcademicCourse: localModule.isAcademicCourse,
    });

    // Update local state immediately for responsive UI
    updateLocalModuleField(field, value);

    // Create updated module with the new value for parent update
    const updatedModule = {
      ...localModule,
      [field]: value,
    };

    // Always use debounced updates for smooth editing
    updateModule(updatedModule);
  };

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
    };
  }, [updateTimeout]);

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

  const [toast] = useState(() => ({
    success: (message) => console.log("✅", message),
    error: (message) => console.error("❌", message),
    info: (message) => console.log("ℹ️", message),
  }));

  return (
    <div className="space-y-6">
      {/* Academic Module Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-800">
                  {localModule.title || "Untitled Academic Module"}
                </CardTitle>
                <p className="text-gray-600">
                  {examType} • {subject} •{" "}
                  {learnerLevel || course?.academicLevel}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <GraduationCap className="h-4 w-4 mr-1" />
                Academic Course
              </Badge>
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
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Academic Tabs */}
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
                <Target className="h-5 w-5" />
                Academic Module Overview
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
                  placeholder="Enter academic module title..."
                  className="border-2 border-gray-200 focus:border-blue-500"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="summary" className="text-sm font-semibold">
                  Module Summary
                </Label>
                <Textarea
                  id="summary"
                  value={localModule.summary || ""}
                  onChange={(e) => updateModuleField("summary", e.target.value)}
                  placeholder="Brief overview of the academic module content..."
                  rows={4}
                  className="border-2 border-gray-200 focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Estimated Study Time
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
                  <Label className="text-sm font-semibold">
                    Academic Level
                  </Label>
                  <Select
                    value={localModule.academicLevel || learnerLevel}
                    onValueChange={(value) =>
                      updateModuleField("academicLevel", value)
                    }
                  >
                    <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="undergraduate">
                        Undergraduate
                      </SelectItem>
                      <SelectItem value="graduate">Graduate</SelectItem>
                      <SelectItem value="postgraduate">Postgraduate</SelectItem>
                      <SelectItem value="doctoral">Doctoral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Course Credits
                  </Label>
                  <Input
                    value={localModule.credits || course?.credits || "3"}
                    onChange={(e) =>
                      updateModuleField("credits", e.target.value)
                    }
                    placeholder="e.g., 3"
                    className="border-2 border-gray-200 focus:border-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Learning Objectives for Academic */}
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
                  key={`academic-objective-${index}`}
                  className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    {editingObjective === index ? (
                      <div className="flex items-center gap-2">
                        <Textarea
                          value={objective}
                          onChange={(e) => {
                            const updatedObjectives =
                              localModule.objectives.map((obj, i) =>
                                i === index ? e.target.value : obj
                              );
                            updateModuleField("objectives", updatedObjectives);
                          }}
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
                      onClick={() => {
                        const updatedObjectives = localModule.objectives.filter(
                          (_, i) => i !== index
                        );
                        updateModuleField("objectives", updatedObjectives);
                        toast.success("Objective removed");
                      }}
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
                  onClick={() => {
                    if (!newObjective.trim()) return;
                    const updatedObjectives = [
                      ...(localModule.objectives || []),
                      newObjective.trim(),
                    ];
                    updateModuleField("objectives", updatedObjectives);
                    setNewObjective("");
                    toast.success("Objective added");
                  }}
                  disabled={!newObjective.trim()}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Academic Examples */}
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
                  key={`academic-example-${index}`}
                  className="flex items-start gap-3"
                >
                  <div className="flex-1">
                    {editingExample === index ? (
                      <div className="flex items-center gap-2">
                        <Textarea
                          value={example}
                          onChange={(e) => {
                            const updatedExamples = localModule.examples.map(
                              (ex, i) => (i === index ? e.target.value : ex)
                            );
                            updateModuleField("examples", updatedExamples);
                          }}
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
                      onClick={() => {
                        const updatedExamples = localModule.examples.filter(
                          (_, i) => i !== index
                        );
                        updateModuleField("examples", updatedExamples);
                        toast.success("Example removed");
                      }}
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
                  placeholder="Add a new academic example..."
                  rows={2}
                  className="flex-1 border-2 border-gray-200 focus:border-green-500"
                />
                <Button
                  onClick={() => {
                    if (!newExample.trim()) return;
                    const updatedExamples = [
                      ...(localModule.examples || []),
                      newExample.trim(),
                    ];
                    updateModuleField("examples", updatedExamples);
                    setNewExample("");
                    toast.success("Example added");
                  }}
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
                  Academic Module Content
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
                </div>
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
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    <code className="bg-blue-100 px-1 rounded">##</code> Section
                    headings
                  </div>
                  <div>
                    <code className="bg-blue-100 px-1 rounded">###</code>{" "}
                    Subsection headings with detailed content
                  </div>
                </div>
              </div>
              <Textarea
                value={localModule.content || ""}
                onChange={(e) => updateModuleField("content", e.target.value)}
                placeholder="Enter detailed academic module content using markdown structure:
# Unit 1: Introduction to Academic Concepts
## 1. Fundamental Principles
### 1.1 Definition and Overview
Detailed explanation here...

### 1.2 Key Theories  
Detailed content with examples...

## 2. Advanced Topics
### 2.1 Complex Applications
Detailed academic discussion here..."
                rows={20}
                className="border-2 border-gray-200 focus:border-blue-500 resize-none font-mono text-sm"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Placeholder for other tabs */}
        <TabsContent value="subsections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Academic Subsections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Academic subsections functionality will be implemented here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Academic Quizzes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Academic quiz functionality will be implemented here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Academic Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Academic resources functionality will be implemented here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
