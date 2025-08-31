"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Plus,
  Trash2,
  ExternalLink,
  BookOpen,
  Video,
  Play,
  FileText,
  Globe,
  Wrench,
  Target,
  Lightbulb,
  Sparkles,
  GraduationCap,
  Brain,
  Zap,
  Crown,
  Star,
  Loader2,
  Eye,
  Download,
  Share2,
  BarChart3,
  GitBranch,
  Clock,
  TrendingUp,
  Layers,
  Network,
  Calculator,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText as DocumentIcon,
  Settings,
  Users,
  Edit,
  Save,
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useContentValidation, useContentProcessor } from "@/lib/contentDisplayHooks";
import ContentDisplay from "@/components/ContentDisplay";

// Validated Input Component for Module Editor
function ValidatedModuleField({ 
  field, 
  value, 
  onChange, 
  placeholder, 
  className = "", 
  rows, 
  multiline = false,
  label,
  description 
}) {
  const { isValid, errors, warnings, isValidating } = useContentValidation(value);
  const { processedContent, processed, hasErrors, hasMath } = useContentProcessor(value);
  
  const Component = multiline ? Textarea : Input;
  
  const getValidationColor = () => {
    if (!value) return "border-gray-200";
    if (errors.length > 0) return "border-red-500";
    if (isValid) return "border-green-500";
    return "border-yellow-500";
  };

  const getValidationIcon = () => {
    if (!value) return null;
    if (errors.length > 0) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (isValid) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <Info className="h-4 w-4 text-yellow-500" />;
  };

  return (
    <div className="space-y-3">
      {label && (
        <Label htmlFor={field} className="text-base font-semibold text-gray-700">
          {label}
        </Label>
      )}
      
      <div className="relative">
        <Component
          id={field}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${className} border-2 ${getValidationColor()} transition-colors duration-300`}
          rows={rows}
        />
        {value && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {getValidationIcon()}
          </div>
        )}
      </div>
      
      {/* Validation Messages */}
      {value && (
        <div className="space-y-1">
          {errors.length > 0 && (
            <Alert className="py-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {errors.join(", ")}
              </AlertDescription>
            </Alert>
          )}
          
          {warnings.length > 0 && (
            <Alert className="py-2 border-yellow-200 bg-yellow-50">
              <Info className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-sm text-yellow-700">
                {warnings.join(", ")}
              </AlertDescription>
            </Alert>
          )}
          
          {isValid && processed && (
            <div className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Content validated • Ready for display
              {hasMath && " • LaTeX equations detected"}
            </div>
          )}
        </div>
      )}
      
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
    </div>
  );
}

export default function ModuleEditor({ module, onUpdate, onSave }) {
  const { getAuthHeaders } = useAuth();
  const [showManualResourceForm, setShowManualResourceForm] = useState(false);
  const [newResource, setNewResource] = useState({
    title: "",
    url: "",
    description: "",
    type: "article", // Default type for categorization
  });

  // Visualizer generation state
  const [showVisualizerGenerator, setShowVisualizerGenerator] = useState(false);
  const [generatingVisualizer, setGeneratingVisualizer] = useState(false);
  const [visualizerProgress, setVisualizerProgress] = useState(0);
  const [generatedVisualizers, setGeneratedVisualizers] = useState(
    module.visualizers || []
  );
  const [visualizerForm, setVisualizerForm] = useState({
    concept: "",
    type: "flowchart",
    learnerLevel: "intermediate",
  });

  // Enhanced intelligent concept identification
  const [analyzingConcepts, setAnalyzingConcepts] = useState(false);
  const [identifiedConcepts, setIdentifiedConcepts] = useState([]);
  const [selectedConceptIndex, setSelectedConceptIndex] = useState(0);

  // NEW: Detailed Explanations pagination state
  const [currentExplanationPage, setCurrentExplanationPage] = useState(0);
  const [explanationsPerPage] = useState(3); // Show 3 detailed subsections per page

  // NEW: Main tabs state
  const [activeMainTab, setActiveMainTab] = useState("overview");

  // NEW: Individual explanation pagination state
  const [explanationPages, setExplanationPages] = useState({}); // Track current page for each explanation
  const [wordsPerExplanationPage] = useState(200); // Words per page for individual explanations

  // NEW: Concept-specific visualizer generation state
  const [generatingConceptVisualizer, setGeneratingConceptVisualizer] =
    useState({}); // Track which concepts are generating
  const [conceptVisualizerProgress, setConceptVisualizerProgress] = useState(
    {}
  ); // Track progress per concept

  // NEW: Pagination logic for detailed explanations
  const detailedSubsections = module.detailedSubsections || [];
  const totalExplanationPages = Math.ceil(
    detailedSubsections.length / explanationsPerPage
  );
  const startExplanationIndex = currentExplanationPage * explanationsPerPage;
  const endExplanationIndex = startExplanationIndex + explanationsPerPage;
  const currentPageExplanations = detailedSubsections.slice(
    startExplanationIndex,
    endExplanationIndex
  );

  // NEW: Helper function to split explanation into pages
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

  // NEW: Get current page for a specific explanation
  const getCurrentExplanationPage = (subsectionIndex) => {
    return explanationPages[subsectionIndex] || 0;
  };

  // NEW: Set current page for a specific explanation
  const setCurrentExplanationPageForSubsection = (
    subsectionIndex,
    pageIndex
  ) => {
    setExplanationPages((prev) => ({
      ...prev,
      [subsectionIndex]: pageIndex,
    }));
  };

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

  const goToExplanationPage = (pageIndex) => {
    if (pageIndex >= 0 && pageIndex < totalExplanationPages) {
      setCurrentExplanationPage(pageIndex);
    }
  };

  // NEW: Detect if concept is algorithmic for code simulator vs other visualizer types
  const isAlgorithmicConcept = (title, content, keyPoints = []) => {
    const algorithmicKeywords = [
      "algorithm",
      "sorting",
      "searching",
      "traversal",
      "recursive",
      "iteration",
      "loop",
      "binary",
      "tree",
      "graph",
      "dynamic programming",
      "greedy",
      "divide and conquer",
      "backtracking",
      "breadth-first",
      "depth-first",
      "quicksort",
      "mergesort",
      "hash",
      "heap",
      "stack",
      "queue",
      "linked list",
      "array",
      "string manipulation",
      "pattern matching",
      "optimization",
      "complexity",
      "time complexity",
      "space complexity",
      "big o",
      "o(n)",
      "implementation",
      "code",
      "function",
      "method",
      "procedure",
      "steps",
    ];

    const textToAnalyze = `${title} ${content} ${keyPoints.join(
      " "
    )}`.toLowerCase();
    return algorithmicKeywords.some((keyword) =>
      textToAnalyze.includes(keyword)
    );
  };

  // NEW: Smart visualizer type detection for concepts
  const detectVisualizerType = (title, content, keyPoints = []) => {
    const textToAnalyze = `${title} ${content} ${keyPoints.join(
      " "
    )}`.toLowerCase();

    // Check for algorithmic concepts first
    if (isAlgorithmicConcept(title, content, keyPoints)) {
      return "simulation"; // Code simulator for algorithmic concepts
    }

    // Check for other specific types
    if (
      textToAnalyze.includes("process") ||
      textToAnalyze.includes("step") ||
      textToAnalyze.includes("workflow")
    ) {
      return "flowchart";
    }
    if (
      textToAnalyze.includes("compare") ||
      textToAnalyze.includes("vs") ||
      textToAnalyze.includes("difference")
    ) {
      return "comparison";
    }
    if (
      textToAnalyze.includes("timeline") ||
      textToAnalyze.includes("history") ||
      textToAnalyze.includes("chronology")
    ) {
      return "timeline";
    }
    if (
      textToAnalyze.includes("formula") ||
      textToAnalyze.includes("equation") ||
      textToAnalyze.includes("calculation")
    ) {
      return "formula";
    }
    if (
      textToAnalyze.includes("hierarchy") ||
      textToAnalyze.includes("structure") ||
      textToAnalyze.includes("levels")
    ) {
      return "hierarchy";
    }
    if (
      textToAnalyze.includes("relationship") ||
      textToAnalyze.includes("connection") ||
      textToAnalyze.includes("network")
    ) {
      return "relationship";
    }

    // Default to flowchart for general concepts
    return "flowchart";
  };

  // NEW: Generate visualizer for specific concept
  const generateConceptVisualizer = async (subsection, globalIndex) => {
    if (!subsection.title) return;

    setGeneratingConceptVisualizer((prev) => ({
      ...prev,
      [globalIndex]: true,
    }));
    setConceptVisualizerProgress((prev) => ({ ...prev, [globalIndex]: 0 }));

    try {
      // Detect visualizer type intelligently
      const detectedType = detectVisualizerType(
        subsection.title,
        subsection.explanation ||
          (subsection.explanationPages || []).map((p) => p.content).join(" "),
        subsection.keyPoints || []
      );

      // Progress simulation
      const progressInterval = setInterval(() => {
        setConceptVisualizerProgress((prev) => ({
          ...prev,
          [globalIndex]: Math.min((prev[globalIndex] || 0) + 15, 90),
        }));
      }, 300);

      const concept = subsection.title;
      const isAlgorithmic = isAlgorithmicConcept(
        subsection.title,
        subsection.explanation ||
          (subsection.explanationPages || []).map((p) => p.content).join(" "),
        subsection.keyPoints || []
      );

      const response = await fetch("/api/visualizers/generate", {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          concept: concept,
          type: detectedType,
          learnerLevel: module.learnerLevel || "intermediate",
          moduleContent:
            subsection.explanation ||
            (subsection.explanationPages || []).map((p) => p.content).join(" "),
          keyPoints: subsection.keyPoints || [],
          isAlgorithmic: isAlgorithmic,
          practicalExample: subsection.practicalExample,
        }),
      });

      clearInterval(progressInterval);
      setConceptVisualizerProgress((prev) => ({ ...prev, [globalIndex]: 100 }));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      const newVisualizer = {
        id: Date.now() + Math.random(),
        title: `${concept} - ${
          detectedType.charAt(0).toUpperCase() + detectedType.slice(1)
        }`,
        concept: concept,
        type: detectedType,
        description:
          result.description || `Interactive ${detectedType} for ${concept}`,
        isAlgorithmic: isAlgorithmic,
        sourceSubsection: subsection.title,
        ...result,
      };

      const updatedVisualizers = [...generatedVisualizers, newVisualizer];
      setGeneratedVisualizers(updatedVisualizers);
      onUpdate({ visualizers: updatedVisualizers });

      // Clear generation state after delay
      setTimeout(() => {
        setGeneratingConceptVisualizer((prev) => ({
          ...prev,
          [globalIndex]: false,
        }));
        setConceptVisualizerProgress((prev) => ({ ...prev, [globalIndex]: 0 }));
      }, 1000);
    } catch (error) {
      console.error("Error generating concept visualizer:", error);
      setGeneratingConceptVisualizer((prev) => ({
        ...prev,
        [globalIndex]: false,
      }));
      setConceptVisualizerProgress((prev) => ({ ...prev, [globalIndex]: 0 }));
    }
  };

  // Handle legacy resources (manual ones) - organized by type
  const legacyResources = useMemo(() => {
    if (Array.isArray(module.resources)) {
      // Legacy array format
      return module.resources;
    } else if (
      module.resources &&
      typeof module.resources === "object" &&
      module.resources.manual
    ) {
      // New object format with manual resources
      return Array.isArray(module.resources.manual)
        ? module.resources.manual
        : [];
    }
    return [];
  }, [module.resources]);

  // Debug logging
  console.log("Module resources:", module.resources);
  console.log("Legacy resources:", legacyResources);

  // Organize manual resources by type for the instructor masterpieces section
  const instructorMasterpieces = {
    articles: legacyResources.filter((r) => r.type === "article" || !r.type), // Default to article for legacy
    videos: legacyResources.filter((r) => r.type === "video"),
    books: legacyResources.filter((r) => r.type === "book"),
    tools: legacyResources.filter((r) => r.type === "tool"),
    websites: legacyResources.filter((r) => r.type === "website"),
    exercises: legacyResources.filter((r) => r.type === "exercise"),
    courses: legacyResources.filter((r) => r.type === "course"),
  };

  console.log("Instructor masterpieces:", instructorMasterpieces);

  // Handle new structured resources from AI with safer property access
  const aiResources =
    module.resources &&
    typeof module.resources === "object" &&
    !Array.isArray(module.resources)
      ? {
          books: Array.isArray(module.resources.books)
            ? module.resources.books
            : [],
          courses: Array.isArray(module.resources.courses)
            ? module.resources.courses
            : [],
          articles: Array.isArray(module.resources.articles)
            ? module.resources.articles
            : [],
          videos: Array.isArray(module.resources.videos)
            ? module.resources.videos
            : [],
          tools: Array.isArray(module.resources.tools)
            ? module.resources.tools
            : [],
          websites: Array.isArray(module.resources.websites)
            ? module.resources.websites
            : [],
          exercises: Array.isArray(module.resources.exercises)
            ? module.resources.exercises
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

  // Auto-save AI resources when they exist but aren't persisted
  useEffect(() => {
    const hasAIResources = Object.values(aiResources).some(
      (categoryResources) => Array.isArray(categoryResources) && categoryResources.length > 0
    );

    // Check if AI resources exist but might not be properly saved
    if (hasAIResources && onSave) {
      console.log("🔍 Checking if AI resources need persistence...");
      
      // Always ensure AI resources are saved to module content
      const resourcesStructure = {
        ...aiResources,
        manual: legacyResources,
      };

      // Update the module with current AI resources structure
      onUpdate({
        resources: resourcesStructure,
      });

      // Auto-save to ensure AI resources are persisted
      const saveAIResources = async () => {
        try {
          await onSave();
          console.log("✓ Auto-saved AI resources to ensure persistence");
        } catch (error) {
          console.error("✗ Failed to auto-save AI resources:", error);
        }
      };

      // Use setTimeout to avoid blocking the UI and prevent infinite loops
      setTimeout(saveAIResources, 500);
    }
  }, [JSON.stringify(aiResources), JSON.stringify(legacyResources), onSave, onUpdate]);

  const handleAddManualResource = async () => {
    if (newResource.title) {
      const resourceWithId = {
        ...newResource,
        id: Date.now(),
        type: newResource.type || "article", // Ensure type is set
      };
      const updatedLegacyResources = [...legacyResources, resourceWithId];

      console.log("Adding new resource:", resourceWithId);
      console.log("Updated legacy resources:", updatedLegacyResources);

      // If module already has AI resources structure, merge properly
      if (
        module.resources &&
        typeof module.resources === "object" &&
        !Array.isArray(module.resources)
      ) {
        onUpdate({
          resources: {
            ...aiResources,
            manual: updatedLegacyResources,
          },
        });
      } else {
        // If module only has legacy array format, keep as array
        onUpdate({
          resources: updatedLegacyResources,
        });
      }

      // Auto-save the course after adding resource
      if (onSave) {
        try {
          await onSave();
          console.log("✓ Auto-saved course after adding resource:", resourceWithId.title);
          // Could add toast notification here if toast system is available
        } catch (error) {
          console.error("✗ Failed to auto-save after adding resource:", error);
          // Could add error toast notification here
        }
      }

      setNewResource({ title: "", url: "", description: "", type: "article" });
      setShowManualResourceForm(false);
    }
  };

  const handleRemoveManualResource = async (resourceId) => {
    const updatedLegacyResources = legacyResources.filter(
      (r) => r.id !== resourceId
    );

    console.log("Removing resource:", resourceId);
    console.log(
      "Updated legacy resources after removal:",
      updatedLegacyResources
    );

    // If module already has AI resources structure, merge properly
    if (
      module.resources &&
      typeof module.resources === "object" &&
      !Array.isArray(module.resources)
    ) {
      onUpdate({
        resources: {
          ...aiResources,
          manual: updatedLegacyResources,
        },
      });
    } else {
      // If module only has legacy array format, keep as array
      onUpdate({
        resources: updatedLegacyResources,
      });
    }

    // Auto-save the course after removing resource
    if (onSave) {
      try {
        await onSave();
        console.log("✓ Auto-saved course after removing resource:", resourceId);
      } catch (error) {
        console.error("✗ Failed to auto-save after removing resource:", error);
      }
    }
  };

  // Intelligent concept identification from module content
  const identifyVisualizableConcepts = (content) => {
    if (!content) return [];

    const concepts = [];

    // Enhanced concept detection patterns with visualizer type recommendations
    const conceptPatterns = [
      // Algorithms and Processes (Flowchart)
      {
        patterns: [
          /algorithm/gi,
          /process/gi,
          /procedure/gi,
          /steps/gi,
          /method/gi,
          /workflow/gi,
          /pipeline/gi,
        ],
        type: "flowchart",
        priority: "high",
        description: "Step-by-step processes and decision flows",
      },
      // Comparisons (Comparison)
      {
        patterns: [
          /vs\b/gi,
          /versus/gi,
          /compare/gi,
          /comparison/gi,
          /difference/gi,
          /advantage/gi,
          /disadvantage/gi,
          /better than/gi,
          /worse than/gi,
        ],
        type: "comparison",
        priority: "high",
        description: "Side-by-side analysis and contrasts",
      },
      // Hierarchies and Structures (Hierarchy)
      {
        patterns: [
          /hierarchy/gi,
          /structure/gi,
          /organization/gi,
          /levels/gi,
          /layers/gi,
          /inheritance/gi,
          /classification/gi,
          /taxonomy/gi,
        ],
        type: "hierarchy",
        priority: "medium",
        description: "Organizational structures and levels",
      },
      // Mathematical concepts (Formula)
      {
        patterns: [
          /formula/gi,
          /equation/gi,
          /calculation/gi,
          /mathematical/gi,
          /theorem/gi,
          /proof/gi,
          /derivative/gi,
          /integral/gi,
        ],
        type: "formula",
        priority: "high",
        description: "Mathematical relationships and calculations",
      },
      // Networks and Relationships (Relationship)
      {
        patterns: [
          /network/gi,
          /relationship/gi,
          /connection/gi,
          /interaction/gi,
          /communication/gi,
          /dependency/gi,
          /association/gi,
        ],
        type: "relationship",
        priority: "medium",
        description: "Connections and interdependencies",
      },
      // Timelines and History (Timeline)
      {
        patterns: [
          /timeline/gi,
          /history/gi,
          /evolution/gi,
          /development/gi,
          /progression/gi,
          /chronology/gi,
          /sequence/gi,
          /era/gi,
        ],
        type: "timeline",
        priority: "medium",
        description: "Chronological progression and historical development",
      },
      // Simulations and Models (Simulation)
      {
        patterns: [
          /simulation/gi,
          /model/gi,
          /behavior/gi,
          /dynamics/gi,
          /interaction/gi,
          /scenario/gi,
          /experiment/gi,
        ],
        type: "simulation",
        priority: "high",
        description: "Interactive models and behavioral demonstrations",
      },
      // Data and Analytics (Comparison - for charts/graphs)
      {
        patterns: [
          /data/gi,
          /statistics/gi,
          /analysis/gi,
          /chart/gi,
          /graph/gi,
          /trend/gi,
          /distribution/gi,
          /correlation/gi,
        ],
        type: "comparison",
        priority: "medium",
        description: "Data visualization and statistical analysis",
      },
    ];

    // Split content into sentences for analysis
    const sentences = content
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 20);

    sentences.forEach((sentence, index) => {
      const trimmed = sentence.trim();

      // Check each pattern category
      conceptPatterns.forEach((patternGroup) => {
        const matchCount = patternGroup.patterns.reduce((count, pattern) => {
          return count + (trimmed.match(pattern) || []).length;
        }, 0);

        if (matchCount > 0) {
          // Extract the main concept from the sentence
          const words = trimmed.split(" ");
          let conceptPhrase = "";

          // Try to extract a meaningful concept phrase
          for (let i = 0; i < words.length - 2; i++) {
            const phrase = words.slice(i, i + 3).join(" ");
            if (
              patternGroup.patterns.some((pattern) => phrase.match(pattern))
            ) {
              // Extend the phrase to capture more context
              const extendedPhrase = words
                .slice(Math.max(0, i - 2), Math.min(words.length, i + 5))
                .join(" ");
              conceptPhrase = extendedPhrase;
              break;
            }
          }

          if (!conceptPhrase) {
            conceptPhrase = words.slice(0, Math.min(8, words.length)).join(" ");
          }

          // Clean up the concept phrase
          conceptPhrase = conceptPhrase.replace(
            /^(the|a|an|and|or|but|in|on|at|to|for|with|by)\s+/i,
            ""
          );
          conceptPhrase = conceptPhrase.replace(
            /\s+(the|a|an|and|or|but|in|on|at|to|for|with|by)$/i,
            ""
          );

          if (conceptPhrase.length > 10 && conceptPhrase.length < 100) {
            const existingConcept = concepts.find(
              (c) =>
                Math.abs(c.phrase.length - conceptPhrase.length) < 10 &&
                c.phrase
                  .toLowerCase()
                  .includes(conceptPhrase.toLowerCase().split(" ")[0])
            );

            if (!existingConcept) {
              concepts.push({
                id: `concept-${Date.now()}-${index}`,
                phrase: conceptPhrase,
                fullSentence: trimmed,
                type: patternGroup.type,
                priority: patternGroup.priority,
                description: patternGroup.description,
                confidence: Math.min(matchCount * 0.3 + 0.4, 1.0),
                estimatedTime: getVisualizerTimeEstimate(patternGroup.type),
                learningObjectives: generateLearningObjectives(
                  conceptPhrase,
                  patternGroup.type
                ),
              });
            }
          }
        }
      });
    });

    // Sort by priority and confidence
    return concepts
      .sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityWeight[a.priority] || 1;
        const bPriority = priorityWeight[b.priority] || 1;

        if (aPriority !== bPriority) return bPriority - aPriority;
        return b.confidence - a.confidence;
      })
      .slice(0, 8); // Limit to top 8 concepts
  };

  // Helper function to estimate visualizer completion time
  const getVisualizerTimeEstimate = (type) => {
    const timeEstimates = {
      flowchart: "5-8 minutes",
      comparison: "3-5 minutes",
      hierarchy: "4-6 minutes",
      formula: "6-10 minutes",
      relationship: "5-7 minutes",
      timeline: "4-6 minutes",
      simulation: "8-12 minutes",
      process: "5-7 minutes",
    };
    return timeEstimates[type] || "5-8 minutes";
  };

  // Helper function to generate learning objectives
  const generateLearningObjectives = (concept, type) => {
    const objectiveTemplates = {
      flowchart: [
        `Understand the step-by-step process of ${concept}`,
        `Identify decision points and flow branches`,
        `Apply the process to solve similar problems`,
      ],
      comparison: [
        `Compare and contrast key aspects of ${concept}`,
        `Analyze advantages and disadvantages`,
        `Make informed decisions based on comparisons`,
      ],
      hierarchy: [
        `Understand the organizational structure of ${concept}`,
        `Identify relationships between different levels`,
        `Navigate and utilize hierarchical information`,
      ],
      formula: [
        `Comprehend the mathematical relationship in ${concept}`,
        `Apply the formula to real-world problems`,
        `Understand the variables and their interactions`,
      ],
      relationship: [
        `Visualize connections within ${concept}`,
        `Understand interdependencies and interactions`,
        `Analyze network effects and relationships`,
      ],
      timeline: [
        `Trace the chronological development of ${concept}`,
        `Understand cause-and-effect relationships over time`,
        `Identify key milestones and turning points`,
      ],
      simulation: [
        `Interact with dynamic model of ${concept}`,
        `Observe behavioral patterns and outcomes`,
        `Experiment with different scenarios and parameters`,
      ],
    };

    return (
      objectiveTemplates[type] || [
        `Gain deeper understanding of ${concept}`,
        `Apply knowledge through interactive visualization`,
        `Connect concepts to real-world applications`,
      ]
    );
  };

  // Analyze module content when generator is opened
  const handleShowVisualizerGenerator = () => {
    setShowVisualizerGenerator(true);

    if (
      module.content &&
      !analyzingConcepts &&
      identifiedConcepts.length === 0
    ) {
      setAnalyzingConcepts(true);

      // Simulate analysis time for better UX
      setTimeout(() => {
        const concepts = identifyVisualizableConcepts(module.content);
        setIdentifiedConcepts(concepts);
        setAnalyzingConcepts(false);

        // Auto-select the first concept if available
        if (concepts.length > 0) {
          setSelectedConceptIndex(0);
          setVisualizerForm((prev) => ({
            ...prev,
            concept: concepts[0].phrase,
            type: concepts[0].type,
          }));
        }
      }, 2000);
    }
  };

  // Visualizer generation functions
  const generateVisualizer = async () => {
    if (!visualizerForm.concept.trim()) {
      alert("Please enter a concept to visualize");
      return;
    }

    setGeneratingVisualizer(true);
    setVisualizerProgress(0);

    try {
      // Simulate progress
      const progressSteps = [
        { step: "Analyzing concept...", progress: 20 },
        { step: "Generating visualization logic...", progress: 40 },
        { step: "Creating interactive elements...", progress: 60 },
        { step: "Optimizing for learning...", progress: 80 },
        { step: "Finalizing visualizer...", progress: 95 },
      ];

      let currentStep = 0;
      const progressInterval = setInterval(() => {
        if (currentStep < progressSteps.length) {
          setVisualizerProgress(progressSteps[currentStep].progress);
          currentStep++;
        }
      }, 1000);

      const response = await fetch("/api/visualizers/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          concept: visualizerForm.concept,
          type: visualizerForm.type,
          learnerLevel: visualizerForm.learnerLevel,
          moduleContent: module.content,
        }),
      });

      clearInterval(progressInterval);
      setVisualizerProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate visualizer");
      }

      const data = await response.json();

      // The API returns the visualizer data directly
      const newVisualizers = [...generatedVisualizers, data];
      setGeneratedVisualizers(newVisualizers);

      // Update module with new visualizers
      onUpdate({
        visualizers: newVisualizers,
      });

      // Reset form and close generator
      setVisualizerForm({
        concept: "",
        type: "flowchart",
        learnerLevel: "intermediate",
      });
      setShowVisualizerGenerator(false);

      alert(
        `🎉 Visualizer Generated Successfully!\n\nType: ${data.type}\nConcept: ${data.concept}\n\nThe visualizer has been added to your module and is ready for students to use!`
      );
    } catch (error) {
      console.error("Visualizer generation error:", error);
      alert(`❌ Failed to generate visualizer: ${error.message}`);
    } finally {
      setTimeout(() => {
        setGeneratingVisualizer(false);
        setVisualizerProgress(0);
      }, 1000);
    }
  };

  const removeVisualizer = (visualizerId) => {
    const updatedVisualizers = generatedVisualizers.filter(
      (v) => v.id !== visualizerId
    );
    setGeneratedVisualizers(updatedVisualizers);
    onUpdate({
      visualizers: updatedVisualizers,
    });
  };

  const duplicateVisualizer = (visualizer) => {
    const duplicatedVisualizer = {
      ...visualizer,
      id: `visualizer-${Date.now()}`,
      title: `${visualizer.title} (Copy)`,
      createdAt: new Date().toISOString(),
    };
    const updatedVisualizers = [...generatedVisualizers, duplicatedVisualizer];
    setGeneratedVisualizers(updatedVisualizers);
    onUpdate({
      visualizers: updatedVisualizers,
    });
  };

  const ResourceSection = ({
    title,
    icon: Icon,
    resources,
    type,
    isInstructorContent = false,
  }) => {
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

      // Special styling for instructor content
      if (isInstructorContent) {
        return baseGradients[type]
          ? baseGradients[type].replace("/10", "/20").replace("/50", "") +
              " border-amber-300/70 shadow-amber-100/50"
          : "from-amber-500/20 via-orange-500/20 to-yellow-500/20 border-amber-300/70 shadow-amber-100/50";
      }

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
            {resources.map((resource, index) => {
              const isEditing =
                editingResource?.type === type &&
                editingResource?.index === index;

              return (
                <div
                  key={resource.id || index}
                  className="group/item bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl p-4 hover:bg-white/80 hover:shadow-md transition-all duration-300 hover:scale-[1.01]"
                >
                  {isEditing ? (
                    // Edit Form
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

                        {type === "books" && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700">
                              Author
                            </Label>
                            <Input
                              value={editForm.author || ""}
                              onChange={(e) =>
                                updateEditForm("author", e.target.value)
                              }
                              className="mt-1"
                              placeholder="Author name"
                            />
                          </div>
                        )}

                        {type === "videos" && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700">
                              Creator
                            </Label>
                            <Input
                              value={editForm.creator || ""}
                              onChange={(e) =>
                                updateEditForm("creator", e.target.value)
                              }
                              className="mt-1"
                              placeholder="Channel or creator name"
                            />
                          </div>
                        )}

                        {type === "courses" && (
                          <>
                            <div>
                              <Label className="text-sm font-medium text-gray-700">
                                Platform
                              </Label>
                              <Input
                                value={editForm.platform || ""}
                                onChange={(e) =>
                                  updateEditForm("platform", e.target.value)
                                }
                                className="mt-1"
                                placeholder="e.g., Coursera, edX, Udemy"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700">
                                Duration
                              </Label>
                              <Input
                                value={editForm.duration || ""}
                                onChange={(e) =>
                                  updateEditForm("duration", e.target.value)
                                }
                                className="mt-1"
                                placeholder="e.g., 4 weeks, 20 hours"
                              />
                            </div>
                          </>
                        )}

                        {type === "articles" && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700">
                              Source
                            </Label>
                            <Input
                              value={editForm.source || ""}
                              onChange={(e) =>
                                updateEditForm("source", e.target.value)
                              }
                              className="mt-1"
                              placeholder="Journal or publication"
                            />
                          </div>
                        )}

                        {type === "videos" && (
                          <>
                            <div>
                              <Label className="text-sm font-medium text-gray-700">
                                Duration
                              </Label>
                              <Input
                                value={editForm.duration || ""}
                                onChange={(e) =>
                                  updateEditForm("duration", e.target.value)
                                }
                                className="mt-1"
                                placeholder="e.g., 10 min, 1 hour"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700">
                                Source Platform
                              </Label>
                              <Input
                                value={editForm.source_platform || ""}
                                onChange={(e) =>
                                  updateEditForm(
                                    "source_platform",
                                    e.target.value
                                  )
                                }
                                className="mt-1"
                                placeholder="e.g., YouTube, Vimeo"
                              />
                            </div>
                          </>
                        )}

                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            Difficulty
                          </Label>
                          <Select
                            value={editForm.difficulty || ""}
                            onValueChange={(value) =>
                              updateEditForm("difficulty", value)
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Beginner">Beginner</SelectItem>
                              <SelectItem value="Intermediate">
                                Intermediate
                              </SelectItem>
                              <SelectItem value="Advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Description
                        </Label>
                        <Textarea
                          value={editForm.description || ""}
                          onChange={(e) =>
                            updateEditForm("description", e.target.value)
                          }
                          className="mt-1"
                          rows={3}
                          placeholder="Describe what learners will gain from this resource"
                        />
                      </div>
                    </div>
                  ) : (
                    // Display Mode
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-base mb-2 group-hover/item:text-gray-800">
                          {resource.title || resource.name}
                        </h4>

                        {/* Type-specific metadata */}
                        <div className="space-y-2 mb-3">
                          {resource.author && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                              <p className="text-sm text-gray-700">
                                <span className="font-semibold">Author:</span>{" "}
                                {resource.author}
                              </p>
                            </div>
                          )}
                          {resource.creator && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                              <p className="text-sm text-gray-700">
                                <span className="font-semibold">Creator:</span>{" "}
                                {resource.creator}
                              </p>
                            </div>
                          )}
                          {resource.platform && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-400"></div>
                              <p className="text-sm text-gray-700">
                                <span className="font-semibold">Platform:</span>{" "}
                                {resource.platform}
                              </p>
                            </div>
                          )}
                          {resource.source && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                              <p className="text-sm text-gray-700">
                                <span className="font-semibold">Source:</span>{" "}
                                {resource.source}
                              </p>
                            </div>
                          )}
                          {resource.duration && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-400"></div>
                              <p className="text-sm text-gray-700">
                                <span className="font-semibold">Duration:</span>{" "}
                                {resource.duration}
                              </p>
                            </div>
                          )}
                          {resource.estimatedTime && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-pink-400"></div>
                              <p className="text-sm text-gray-700">
                                <span className="font-semibold">Time:</span>{" "}
                                {resource.estimatedTime}
                              </p>
                            </div>
                          )}
                        </div>

                        <p className="text-sm text-gray-700 leading-relaxed mb-3">
                          {resource.description}
                        </p>

                        <div className="flex gap-2 flex-wrap">
                          {resource.difficulty && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-white/80 border-gray-300"
                            >
                              {resource.difficulty}
                            </Badge>
                          )}
                          {resource.category && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-white/80 border-gray-300"
                            >
                              {resource.category}
                            </Badge>
                          )}
                          {resource.cost && (
                            <Badge
                              variant={
                                resource.cost === "Free" ? "default" : "outline"
                              }
                              className={`text-xs ${
                                resource.cost === "Free"
                                  ? "bg-green-500 text-white"
                                  : "bg-white/80 border-gray-300"
                              }`}
                            >
                              {resource.cost}
                            </Badge>
                          )}
                          {isInstructorContent && (
                            <Badge
                              variant="default"
                              className="text-xs bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                            >
                              <Crown className="h-3 w-3 mr-1" />
                              Instructor's Choice
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {/* Edit Button for AI-generated resources */}
                        {!isInstructorContent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingResource(type, index)}
                            className="hover:bg-blue-100 hover:text-blue-600 transition-all duration-300"
                            title="Edit this resource"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        )}
                        {resource.url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="hover:bg-white/80 hover:scale-110 transition-all duration-300"
                          >
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {isInstructorContent && resource.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRemoveManualResource(resource.id)
                            }
                            className="hover:bg-red-100 hover:text-red-600 transition-all duration-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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

  // NEW: Resource editing state
  const [editingResource, setEditingResource] = useState(null); // { type: 'books', index: 0 }
  const [editForm, setEditForm] = useState({});

  // NEW: Resource editing handlers
  const startEditingResource = (type, index) => {
    const resource = module.resources?.[type]?.[index];
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
    const updatedModule = {
      ...module,
      resources: {
        ...module.resources,
        [type]: module.resources[type].map((resource, i) =>
          i === index ? { ...editForm } : resource
        ),
      },
    };

    onUpdate(updatedModule);
    setEditingResource(null);
    setEditForm({});
  };

  const updateEditForm = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <GraduationCap className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Module Editor
            </h1>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white">
              <Brain className="h-8 w-8" />
            </div>
          </div>
          <p className="text-gray-600 text-lg">
            Create and customize your learning modules with AI-powered resources
          </p>
        </div>

        {/* Main Tabbed Interface */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/40 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Settings className="h-6 w-6 text-blue-600" />
              Module Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs
              value={activeMainTab}
              onValueChange={setActiveMainTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-blue-50 to-purple-50 p-2 rounded-none border-b">
                <TabsTrigger
                  value="overview"
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md"
                >
                  <Sparkles className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="explanations"
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md"
                >
                  <DocumentIcon className="h-4 w-4" />
                  Detailed Explanations
                  {detailedSubsections.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {detailedSubsections.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="visualizers"
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md"
                >
                  <BarChart3 className="h-4 w-4" />
                  Visualizers
                  {generatedVisualizers.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {generatedVisualizers.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="resources"
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md"
                >
                  <Users className="h-4 w-4" />
                  Resources
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="p-8 space-y-8">
                {/* Basic Information */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <ValidatedModuleField
                      field="title"
                      value={module.title}
                      onChange={(value) => onUpdate({ title: value })}
                      placeholder="Enter module title..."
                      className="h-12 text-lg focus:border-blue-500"
                      label="Module Title"
                    />

                    <div className="space-y-3">
                      <Label
                        htmlFor="order"
                        className="text-base font-semibold text-gray-700"
                      >
                        Order
                      </Label>
                      <Input
                        id="order"
                        type="number"
                        value={module.order}
                        onChange={(e) =>
                          onUpdate({ order: Number.parseInt(e.target.value) })
                        }
                        className="h-12 text-lg border-2 border-gray-200 focus:border-blue-500 transition-colors duration-300"
                      />
                    </div>
                  </div>

                  <ValidatedModuleField
                    field="content"
                    value={module.content}
                    onChange={(value) => onUpdate({ content: value })}
                    placeholder="Enter module content with markdown and LaTeX support..."
                    className="text-base focus:border-blue-500 resize-none"
                    label="Content"
                    multiline={true}
                    rows={8}
                    description="Supports markdown formatting and LaTeX math expressions. Use $$....$$ for display math and $....$ for inline math."
                  />

                  <ValidatedModuleField
                    field="summary"
                    value={module.summary}
                    onChange={(value) => onUpdate({ summary: value })}
                    placeholder="AI will generate a summary..."
                    className="text-base focus:border-purple-500 resize-none bg-gradient-to-r from-purple-50/50 to-pink-50/50"
                    label={
                      <span className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        AI-Generated Summary
                      </span>
                    }
                    multiline={true}
                    rows={4}
                    description="AI-generated summary of the module content. Can be edited and refined."
                  />
                </div>

                {/* Learning Objectives and Examples */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="bg-white/60 border-gray-200 shadow-md">
                    <CardHeader className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <Target className="h-6 w-6 text-blue-600" />
                        Learning Objectives
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {(module.objectives || []).map((objective, index) => (
                          <div key={index} className="flex gap-3 group">
                            <div className="p-2 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors duration-300">
                              <Target className="h-4 w-4" />
                            </div>
                            <Input
                              value={objective}
                              onChange={(e) => {
                                const newObjectives = [
                                  ...(module.objectives || []),
                                ];
                                newObjectives[index] = e.target.value;
                                onUpdate({ objectives: newObjectives });
                              }}
                              placeholder="Learning objective"
                              className="flex-1 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-300"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newObjectives = module.objectives.filter(
                                  (_, i) => i !== index
                                );
                                onUpdate({ objectives: newObjectives });
                              }}
                              className="hover:bg-red-100 hover:text-red-600 transition-colors duration-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          onClick={() =>
                            onUpdate({
                              objectives: [...(module.objectives || []), ""],
                            })
                          }
                          className="w-full border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Objective
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/60 border-gray-200 shadow-md">
                    <CardHeader className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <Lightbulb className="h-6 w-6 text-yellow-600" />
                        Real-World Examples
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {(module.examples || []).map((example, index) => (
                          <div key={index} className="flex gap-3 group">
                            <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600 group-hover:bg-yellow-200 transition-colors duration-300">
                              <Lightbulb className="h-4 w-4" />
                            </div>
                            <Input
                              value={example}
                              onChange={(e) => {
                                const newExamples = [
                                  ...(module.examples || []),
                                ];
                                newExamples[index] = e.target.value;
                                onUpdate({ examples: newExamples });
                              }}
                              placeholder="Real-world example"
                              className="flex-1 border-2 border-gray-200 focus:border-yellow-500 transition-colors duration-300"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newExamples = module.examples.filter(
                                  (_, i) => i !== index
                                );
                                onUpdate({ examples: newExamples });
                              }}
                              className="hover:bg-red-100 hover:text-red-600 transition-colors duration-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          onClick={() =>
                            onUpdate({
                              examples: [...(module.examples || []), ""],
                            })
                          }
                          className="w-full border-2 border-dashed border-yellow-300 hover:border-yellow-500 hover:bg-yellow-50 transition-all duration-300"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Example
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* NEW: Detailed Explanations Tab with Pagination */}
              <TabsContent value="explanations" className="p-8">
                <div className="space-y-6">
                  {/* Save Reminder */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                        <Save className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-amber-800">
                          💡 Remember to Save Your Changes
                        </h4>
                        <p className="text-amber-700 text-sm">
                          After editing subsections, click "Save Draft" or
                          "Publish Course" to make your changes visible to
                          learners.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <DocumentIcon className="h-6 w-6 text-indigo-600" />
                        Detailed Explanations
                      </h2>
                      <p className="text-gray-600 mt-1">
                        Edit AI-generated detailed subsections for comprehensive
                        learning
                      </p>
                    </div>
                    <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                      {detailedSubsections.length} Sections
                    </Badge>
                  </div>

                  {detailedSubsections.length === 0 ? (
                    <div className="text-center py-16">
                      <DocumentIcon className="h-20 w-20 text-gray-300 mx-auto mb-6" />
                      <h3 className="text-xl font-medium text-gray-500 mb-2">
                        No Detailed Explanations Available
                      </h3>
                      <p className="text-gray-400 mb-6 max-w-md mx-auto">
                        Detailed explanations are generated automatically during
                        curriculum processing. This content should be available
                        from the course creation process.
                      </p>
                      <Badge
                        variant="outline"
                        className="text-amber-600 border-amber-300"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Generated during processing
                      </Badge>
                    </div>
                  ) : (
                    <>
                      {/* Paginated Content */}
                      <div className="space-y-6">
                        {currentPageExplanations.map((subsection, index) => {
                          const globalIndex = startExplanationIndex + index;
                          // Use AI-generated explanation pages or fallback to splitting single explanation
                          const explanationPages =
                            subsection.explanationPages &&
                            subsection.explanationPages.length > 0
                              ? subsection.explanationPages.map(
                                  (page) => page.content
                                )
                              : splitExplanationIntoPages(
                                  subsection.explanation || ""
                                );
                          const currentPageIndex =
                            getCurrentExplanationPage(globalIndex);
                          const totalPages = explanationPages.length;
                          const currentPageContent =
                            explanationPages[currentPageIndex] ||
                            subsection.explanation ||
                            "";

                          // Get page details from AI-generated structure if available
                          const currentPageDetails =
                            subsection.explanationPages &&
                            subsection.explanationPages[currentPageIndex];
                          const pageTitle =
                            currentPageDetails?.pageTitle ||
                            `Page ${currentPageIndex + 1}`;
                          const keyTakeaway = currentPageDetails?.keyTakeaway;

                          return (
                            <Card
                              key={globalIndex}
                              className="bg-gradient-to-br from-white to-indigo-50/30 border-indigo-200 shadow-lg"
                            >
                              <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                                <CardTitle className="flex items-center gap-3 text-xl">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                    {globalIndex + 1}
                                  </div>
                                  <Input
                                    value={subsection.title || ""}
                                    onChange={(e) => {
                                      const updatedSubsections = [
                                        ...detailedSubsections,
                                      ];
                                      updatedSubsections[globalIndex] = {
                                        ...updatedSubsections[globalIndex],
                                        title: e.target.value,
                                      };
                                      onUpdate({
                                        detailedSubsections: updatedSubsections,
                                      });
                                    }}
                                    className="flex-1 border-2 border-indigo-200 focus:border-indigo-500 transition-colors duration-300 bg-white/80"
                                    placeholder="Subsection title..."
                                  />
                                  {subsection.difficulty && (
                                    <Badge
                                      variant="outline"
                                      className="ml-auto"
                                    >
                                      {subsection.difficulty}
                                    </Badge>
                                  )}
                                </CardTitle>
                                {subsection.summary && (
                                  <p className="text-gray-600 mt-2">
                                    {subsection.summary}
                                  </p>
                                )}
                              </CardHeader>
                              <CardContent className="p-6 space-y-4">
                                {subsection.keyPoints &&
                                  subsection.keyPoints.length > 0 && (
                                    <div>
                                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <Target className="h-4 w-4 text-blue-600" />
                                        Key Points (Editable)
                                      </h4>
                                      <div className="space-y-2">
                                        {subsection.keyPoints.map(
                                          (point, pointIndex) => (
                                            <div
                                              key={pointIndex}
                                              className="flex items-start gap-2"
                                            >
                                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-1 flex-shrink-0">
                                                {pointIndex + 1}
                                              </div>
                                              <Input
                                                value={point}
                                                onChange={(e) => {
                                                  const updatedSubsections = [
                                                    ...detailedSubsections,
                                                  ];
                                                  const updatedKeyPoints = [
                                                    ...(updatedSubsections[
                                                      globalIndex
                                                    ].keyPoints || []),
                                                  ];
                                                  updatedKeyPoints[pointIndex] =
                                                    e.target.value;
                                                  updatedSubsections[
                                                    globalIndex
                                                  ] = {
                                                    ...updatedSubsections[
                                                      globalIndex
                                                    ],
                                                    keyPoints: updatedKeyPoints,
                                                  };
                                                  onUpdate({
                                                    detailedSubsections:
                                                      updatedSubsections,
                                                  });
                                                }}
                                                className="flex-1 border-2 border-blue-200 focus:border-blue-500 transition-colors duration-300"
                                                placeholder="Key point..."
                                              />
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                  const updatedSubsections = [
                                                    ...detailedSubsections,
                                                  ];
                                                  const updatedKeyPoints = (
                                                    updatedSubsections[
                                                      globalIndex
                                                    ].keyPoints || []
                                                  ).filter(
                                                    (_, i) => i !== pointIndex
                                                  );
                                                  updatedSubsections[
                                                    globalIndex
                                                  ] = {
                                                    ...updatedSubsections[
                                                      globalIndex
                                                    ],
                                                    keyPoints: updatedKeyPoints,
                                                  };
                                                  onUpdate({
                                                    detailedSubsections:
                                                      updatedSubsections,
                                                  });
                                                }}
                                                className="hover:bg-red-100 hover:text-red-600 transition-colors duration-300 mt-1"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          )
                                        )}
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const updatedSubsections = [
                                              ...detailedSubsections,
                                            ];
                                            const updatedKeyPoints = [
                                              ...(updatedSubsections[
                                                globalIndex
                                              ].keyPoints || []),
                                              "",
                                            ];
                                            updatedSubsections[globalIndex] = {
                                              ...updatedSubsections[
                                                globalIndex
                                              ],
                                              keyPoints: updatedKeyPoints,
                                            };
                                            onUpdate({
                                              detailedSubsections:
                                                updatedSubsections,
                                            });
                                          }}
                                          className="w-full border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300"
                                        >
                                          <Plus className="h-4 w-4 mr-2" />
                                          Add Key Point
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                {/* Add Key Points section if none exist */}
                                {(!subsection.keyPoints ||
                                  subsection.keyPoints.length === 0) && (
                                  <div className="p-4 border-2 border-dashed border-blue-300 rounded-lg">
                                    <div className="text-center">
                                      <Target className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                                      <p className="text-gray-600 mb-3">
                                        No key points yet
                                      </p>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const updatedSubsections = [
                                            ...detailedSubsections,
                                          ];
                                          updatedSubsections[globalIndex] = {
                                            ...updatedSubsections[globalIndex],
                                            keyPoints: [""],
                                          };
                                          onUpdate({
                                            detailedSubsections:
                                              updatedSubsections,
                                          });
                                        }}
                                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                      >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add First Key Point
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {(subsection.explanation ||
                                  subsection.explanationPages) && (
                                  <div>
                                    <div className="flex items-center justify-between mb-3">
                                      <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                        <Brain className="h-4 w-4 text-purple-600" />
                                        {pageTitle}
                                        {totalPages > 1 && (
                                          <Badge
                                            variant="outline"
                                            className="ml-2 text-xs"
                                          >
                                            Page {currentPageIndex + 1} of{" "}
                                            {totalPages}
                                          </Badge>
                                        )}
                                      </h4>
                                      {totalPages > 1 && (
                                        <div className="flex items-center gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              setCurrentExplanationPageForSubsection(
                                                globalIndex,
                                                Math.max(
                                                  0,
                                                  currentPageIndex - 1
                                                )
                                              )
                                            }
                                            disabled={currentPageIndex === 0}
                                            className="h-8 w-8 p-0"
                                          >
                                            <ChevronLeft className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              setCurrentExplanationPageForSubsection(
                                                globalIndex,
                                                Math.min(
                                                  totalPages - 1,
                                                  currentPageIndex + 1
                                                )
                                              )
                                            }
                                            disabled={
                                              currentPageIndex ===
                                              totalPages - 1
                                            }
                                            className="h-8 w-8 p-0"
                                          >
                                            <ChevronRight className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                    <div className="prose prose-sm max-w-none text-gray-700 bg-white/50 p-4 rounded-lg border border-gray-200">
                                      {currentPageContent}
                                      {keyTakeaway && (
                                        <div className="mt-4 p-3 bg-indigo-50 rounded-lg border-l-4 border-indigo-400">
                                          <p className="text-sm font-medium text-indigo-800 flex items-center gap-2">
                                            <Star className="h-4 w-4" />
                                            Key Takeaway: {keyTakeaway}
                                          </p>
                                        </div>
                                      )}
                                    </div>

                                    {/* NEW: Editable Explanation Section */}
                                    <div className="mt-6 p-4 bg-amber-50/50 rounded-lg border border-amber-200">
                                      <div className="flex items-center justify-between mb-3">
                                        <h5 className="font-semibold text-amber-800 flex items-center gap-2">
                                          <Edit className="h-4 w-4" />
                                          Edit Explanation Content
                                        </h5>
                                        <Badge
                                          variant="outline"
                                          className="text-amber-700 border-amber-300"
                                        >
                                          Instructor Editable
                                        </Badge>
                                      </div>
                                      <Textarea
                                        value={subsection.explanation || ""}
                                        onChange={(e) => {
                                          const updatedSubsections = [
                                            ...detailedSubsections,
                                          ];
                                          updatedSubsections[globalIndex] = {
                                            ...updatedSubsections[globalIndex],
                                            explanation: e.target.value,
                                          };
                                          onUpdate({
                                            detailedSubsections:
                                              updatedSubsections,
                                          });
                                        }}
                                        rows={6}
                                        placeholder="Edit or add detailed explanation for this subsection..."
                                        className="text-sm border-2 border-amber-200 focus:border-amber-500 transition-colors duration-300 resize-none bg-white"
                                      />
                                      <p className="text-xs text-amber-600 mt-2">
                                        💡 This content will be visible to
                                        learners when they expand this
                                        subsection
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* NEW: Generate Visualizer Section for Each Concept */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                  <div className="flex items-center gap-4">
                                    {subsection.needsVisualization && (
                                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                                        <BarChart3 className="h-3 w-3 mr-1" />
                                        Visualizable (
                                        {subsection.visualizationType})
                                      </Badge>
                                    )}
                                    {subsection.needsCodeSimulation && (
                                      <Badge className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
                                        <Star className="h-3 w-3 mr-1" />
                                        Simulation ({subsection.simulationType})
                                      </Badge>
                                    )}
                                    {totalPages > 1 && (
                                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                                        <DocumentIcon className="h-3 w-3 mr-1" />
                                        {totalPages} Pages
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3">
                                    {/* Generate Visualizer Button for Each Concept */}
                                    {generatingConceptVisualizer[
                                      globalIndex
                                    ] ? (
                                      <div className="flex items-center gap-2">
                                        <div className="relative">
                                          <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
                                        </div>
                                        <Badge
                                          variant="outline"
                                          className="text-xs bg-indigo-50 border-indigo-200 text-indigo-700"
                                        >
                                          {conceptVisualizerProgress[
                                            globalIndex
                                          ] || 0}
                                          %
                                        </Badge>
                                      </div>
                                    ) : (
                                      <Button
                                        onClick={() =>
                                          generateConceptVisualizer(
                                            subsection,
                                            globalIndex
                                          )
                                        }
                                        size="sm"
                                        className={`${
                                          isAlgorithmicConcept(
                                            subsection.title,
                                            subsection.explanation ||
                                              (
                                                subsection.explanationPages ||
                                                []
                                              )
                                                .map((p) => p.content)
                                                .join(" "),
                                            subsection.keyPoints || []
                                          )
                                            ? "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                                            : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                                        } text-white shadow-md hover:shadow-lg transition-all duration-300`}
                                      >
                                        {isAlgorithmicConcept(
                                          subsection.title,
                                          subsection.explanation ||
                                            (subsection.explanationPages || [])
                                              .map((p) => p.content)
                                              .join(" "),
                                          subsection.keyPoints || []
                                        ) ? (
                                          <>
                                            <Zap className="h-3 w-3 mr-1" />
                                            Code Simulator
                                          </>
                                        ) : (
                                          <>
                                            <BarChart3 className="h-3 w-3 mr-1" />
                                            Generate Visualizer
                                          </>
                                        )}
                                      </Button>
                                    )}

                                    {subsection.estimatedTime && (
                                      <Badge
                                        variant="outline"
                                        className="text-gray-600"
                                      >
                                        <Clock className="h-3 w-3 mr-1" />
                                        {subsection.estimatedTime}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>

                      {/* Pagination Controls */}
                      {totalExplanationPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={goToPrevExplanationPage}
                            disabled={currentExplanationPage === 0}
                            className="flex items-center gap-2"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>

                          <div className="flex items-center gap-1">
                            {Array.from(
                              { length: totalExplanationPages },
                              (_, index) => (
                                <Button
                                  key={index}
                                  variant={
                                    currentExplanationPage === index
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() => goToExplanationPage(index)}
                                  className="w-8 h-8 p-0"
                                >
                                  {index + 1}
                                </Button>
                              )
                            )}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={goToNextExplanationPage}
                            disabled={
                              currentExplanationPage ===
                              totalExplanationPages - 1
                            }
                            className="flex items-center gap-2"
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>

                          <div className="ml-4 text-sm text-gray-500">
                            Page {currentExplanationPage + 1} of{" "}
                            {totalExplanationPages}({detailedSubsections.length}{" "}
                            total sections)
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>

              {/* Visualizers Tab */}
              <TabsContent value="visualizers" className="p-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Eye className="h-5 w-5 text-indigo-600" />
                    Generated Visualizers ({generatedVisualizers.length})
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {generatedVisualizers.map((visualizer) => (
                      <Card
                        key={visualizer.id}
                        className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center justify-between text-lg">
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                                {visualizer.type === "flowchart" && (
                                  <GitBranch className="h-4 w-4" />
                                )}
                                {visualizer.type === "comparison" && (
                                  <BarChart3 className="h-4 w-4" />
                                )}
                                {visualizer.type === "timeline" && (
                                  <Clock className="h-4 w-4" />
                                )}
                                {visualizer.type === "formula" && (
                                  <Calculator className="h-4 w-4" />
                                )}
                                {visualizer.type === "process" && (
                                  <TrendingUp className="h-4 w-4" />
                                )}
                                {visualizer.type === "hierarchy" && (
                                  <Layers className="h-4 w-4" />
                                )}
                                {visualizer.type === "relationship" && (
                                  <Network className="h-4 w-4" />
                                )}
                                {visualizer.type === "simulation" && (
                                  <Zap className="h-4 w-4" />
                                )}
                              </div>
                              <span className="text-indigo-800 font-semibold">
                                {visualizer.title}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-xs bg-white/80 border-indigo-300 text-indigo-700"
                            >
                              {visualizer.type}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-indigo-800">
                              Concept:
                            </p>
                            <p className="text-sm text-gray-700 bg-white/60 p-2 rounded border">
                              {visualizer.concept}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm font-medium text-indigo-800">
                              Description:
                            </p>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {visualizer.description}
                            </p>
                          </div>

                          {visualizer.estimatedTime && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Clock className="h-3 w-3" />
                              <span>{visualizer.estimatedTime}</span>
                            </div>
                          )}

                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-xs hover:bg-indigo-50 border-indigo-200"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Preview
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => duplicateVisualizer(visualizer)}
                              className="text-xs hover:bg-green-50 border-green-200 text-green-700"
                            >
                              <Share2 className="h-3 w-3 mr-1" />
                              Duplicate
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeVisualizer(visualizer.id)}
                              className="text-xs hover:bg-red-50 border-red-200 text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Resources Tab */}
              <TabsContent value="resources" className="p-8">
                <Tabs
                  defaultValue={
                    aiResources.books && aiResources.books.length > 0
                      ? "books"
                      : aiResources.courses && aiResources.courses.length > 0
                      ? "courses"
                      : aiResources.videos && aiResources.videos.length > 0
                      ? "videos"
                      : aiResources.articles && aiResources.articles.length > 0
                      ? "articles"
                      : aiResources.tools && aiResources.tools.length > 0
                      ? "tools"
                      : aiResources.websites && aiResources.websites.length > 0
                      ? "websites"
                      : aiResources.exercises &&
                        aiResources.exercises.length > 0
                      ? "exercises"
                      : "books"
                  }
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 h-auto p-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl">
                    <TabsTrigger
                      value="books"
                      className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                    >
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <span className="text-xs font-medium">Books</span>
                      {aiResources.books && aiResources.books.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {aiResources.books.length}
                        </Badge>
                      )}
                    </TabsTrigger>

                    <TabsTrigger
                      value="courses"
                      className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                    >
                      <Video className="h-5 w-5 text-purple-600" />
                      <span className="text-xs font-medium">Courses</span>
                      {aiResources.courses &&
                        aiResources.courses.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {aiResources.courses.length}
                          </Badge>
                        )}
                    </TabsTrigger>

                    <TabsTrigger
                      value="videos"
                      className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                    >
                      <Play className="h-5 w-5 text-red-600" />
                      <span className="text-xs font-medium">Videos</span>
                      {aiResources.videos && aiResources.videos.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {aiResources.videos.length}
                        </Badge>
                      )}
                    </TabsTrigger>

                    <TabsTrigger
                      value="articles"
                      className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                    >
                      <FileText className="h-5 w-5 text-green-600" />
                      <span className="text-xs font-medium">Articles</span>
                      {aiResources.articles &&
                        aiResources.articles.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {aiResources.articles.length}
                          </Badge>
                        )}
                    </TabsTrigger>

                    <TabsTrigger
                      value="tools"
                      className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                    >
                      <Wrench className="h-5 w-5 text-orange-600" />
                      <span className="text-xs font-medium">Tools</span>
                      {aiResources.tools && aiResources.tools.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {aiResources.tools.length}
                        </Badge>
                      )}
                    </TabsTrigger>

                    <TabsTrigger
                      value="websites"
                      className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                    >
                      <Globe className="h-5 w-5 text-indigo-600" />
                      <span className="text-xs font-medium">Websites</span>
                      {aiResources.websites &&
                        aiResources.websites.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {aiResources.websites.length}
                          </Badge>
                        )}
                    </TabsTrigger>

                    <TabsTrigger
                      value="exercises"
                      className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                    >
                      <Target className="h-5 w-5 text-pink-600" />
                      <span className="text-xs font-medium">Exercises</span>
                      {aiResources.exercises &&
                        aiResources.exercises.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {aiResources.exercises.length}
                          </Badge>
                        )}
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-8">
                    <TabsContent value="books" className="space-y-6">
                      <ResourceSection
                        title="Recommended Books"
                        icon={BookOpen}
                        resources={aiResources.books}
                        type="books"
                      />
                    </TabsContent>

                    <TabsContent value="courses" className="space-y-6">
                      <ResourceSection
                        title="Online Courses"
                        icon={Video}
                        resources={aiResources.courses}
                        type="courses"
                      />
                    </TabsContent>

                    <TabsContent value="videos" className="space-y-6">
                      <ResourceSection
                        title="Video Tutorials"
                        icon={Play}
                        resources={aiResources.videos}
                        type="videos"
                      />
                    </TabsContent>

                    <TabsContent value="articles" className="space-y-6">
                      <ResourceSection
                        title="Articles & Papers"
                        icon={FileText}
                        resources={aiResources.articles}
                        type="articles"
                      />
                    </TabsContent>

                    <TabsContent value="tools" className="space-y-6">
                      <ResourceSection
                        title="Tools & Software"
                        icon={Wrench}
                        resources={aiResources.tools}
                        type="tools"
                      />
                    </TabsContent>

                    <TabsContent value="websites" className="space-y-6">
                      <ResourceSection
                        title="Useful Websites"
                        icon={Globe}
                        resources={aiResources.websites}
                        type="websites"
                      />
                    </TabsContent>

                    <TabsContent value="exercises" className="space-y-6">
                      <ResourceSection
                        title="Practice Exercises"
                        icon={Target}
                        resources={aiResources.exercises}
                        type="exercises"
                      />
                    </TabsContent>
                  </div>
                </Tabs>

                {/* Masterpieces from the Instructor */}
                <Card className="bg-white/80 backdrop-blur-sm border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 rounded-t-lg">
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                        <Crown className="h-6 w-6" />
                      </div>
                      Masterpieces from the Instructor
                      <Badge
                        variant="secondary"
                        className="bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold"
                      >
                        <Star className="h-3 w-3 mr-1" />
                        Your Curated Content
                      </Badge>
                      <Button
                        onClick={() =>
                          setShowManualResourceForm(!showManualResourceForm)
                        }
                        variant="outline"
                        size="sm"
                        className="ml-auto border-amber-300 text-amber-700 hover:bg-amber-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Masterpiece
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
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
                      <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 h-auto p-2 bg-gradient-to-r from-amber-100 to-orange-200 rounded-xl">
                        <TabsTrigger
                          value="articles"
                          className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                        >
                          <FileText className="h-5 w-5 text-green-600" />
                          <span className="text-xs font-medium">Articles</span>
                          {instructorMasterpieces.articles.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {instructorMasterpieces.articles.length}
                            </Badge>
                          )}
                        </TabsTrigger>

                        <TabsTrigger
                          value="videos"
                          className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                        >
                          <Play className="h-5 w-5 text-red-600" />
                          <span className="text-xs font-medium">Videos</span>
                          {instructorMasterpieces.videos.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {instructorMasterpieces.videos.length}
                            </Badge>
                          )}
                        </TabsTrigger>

                        <TabsTrigger
                          value="books"
                          className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                        >
                          <BookOpen className="h-5 w-5 text-blue-600" />
                          <span className="text-xs font-medium">Books</span>
                          {instructorMasterpieces.books.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {instructorMasterpieces.books.length}
                            </Badge>
                          )}
                        </TabsTrigger>

                        <TabsTrigger
                          value="courses"
                          className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                        >
                          <Video className="h-5 w-5 text-purple-600" />
                          <span className="text-xs font-medium">Courses</span>
                          {instructorMasterpieces.courses.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {instructorMasterpieces.courses.length}
                            </Badge>
                          )}
                        </TabsTrigger>

                        <TabsTrigger
                          value="tools"
                          className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                        >
                          <Wrench className="h-5 w-5 text-orange-600" />
                          <span className="text-xs font-medium">Tools</span>
                          {instructorMasterpieces.tools.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {instructorMasterpieces.tools.length}
                            </Badge>
                          )}
                        </TabsTrigger>

                        <TabsTrigger
                          value="websites"
                          className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                        >
                          <Globe className="h-5 w-5 text-indigo-600" />
                          <span className="text-xs font-medium">Websites</span>
                          {instructorMasterpieces.websites.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {instructorMasterpieces.websites.length}
                            </Badge>
                          )}
                        </TabsTrigger>

                        <TabsTrigger
                          value="exercises"
                          className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                        >
                          <Target className="h-5 w-5 text-pink-600" />
                          <span className="text-xs font-medium">Exercises</span>
                          {instructorMasterpieces.exercises.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {instructorMasterpieces.exercises.length}
                            </Badge>
                          )}
                        </TabsTrigger>
                      </TabsList>

                      <div className="mt-8">
                        <TabsContent value="articles" className="space-y-6">
                          {instructorMasterpieces.articles.length > 0 ? (
                            <ResourceSection
                              title="Articles & Papers"
                              icon={FileText}
                              resources={instructorMasterpieces.articles}
                              type="articles"
                              isInstructorContent={true}
                            />
                          ) : (
                            <div className="text-center py-12">
                              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-500 mb-2">
                                No Articles Added Yet
                              </h3>
                              <p className="text-gray-400 mb-4">
                                Share your favorite articles and papers with
                                students
                              </p>
                              <Button
                                onClick={() => {
                                  setNewResource((prev) => ({
                                    ...prev,
                                    type: "article",
                                  }));
                                  setShowManualResourceForm(true);
                                }}
                                variant="outline"
                                className="border-green-300 text-green-700 hover:bg-green-50"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Article
                              </Button>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="videos" className="space-y-6">
                          {instructorMasterpieces.videos.length > 0 ? (
                            <ResourceSection
                              title="Video Tutorials"
                              icon={Play}
                              resources={instructorMasterpieces.videos}
                              type="videos"
                              isInstructorContent={true}
                            />
                          ) : (
                            <div className="text-center py-12">
                              <Play className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-500 mb-2">
                                No Videos Added Yet
                              </h3>
                              <p className="text-gray-400 mb-4">
                                Share your recommended video tutorials
                              </p>
                              <Button
                                onClick={() => {
                                  setNewResource((prev) => ({
                                    ...prev,
                                    type: "video",
                                  }));
                                  setShowManualResourceForm(true);
                                }}
                                variant="outline"
                                className="border-red-300 text-red-700 hover:bg-red-50"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Video
                              </Button>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="books" className="space-y-6">
                          {instructorMasterpieces.books.length > 0 ? (
                            <ResourceSection
                              title="Recommended Books"
                              icon={BookOpen}
                              resources={instructorMasterpieces.books}
                              type="books"
                              isInstructorContent={true}
                            />
                          ) : (
                            <div className="text-center py-12">
                              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-500 mb-2">
                                No Books Added Yet
                              </h3>
                              <p className="text-gray-400 mb-4">
                                Recommend essential books for deeper learning
                              </p>
                              <Button
                                onClick={() => {
                                  setNewResource((prev) => ({
                                    ...prev,
                                    type: "book",
                                  }));
                                  setShowManualResourceForm(true);
                                }}
                                variant="outline"
                                className="border-blue-300 text-blue-700 hover:bg-blue-50"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Book
                              </Button>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="courses" className="space-y-6">
                          {instructorMasterpieces.courses.length > 0 ? (
                            <ResourceSection
                              title="Online Courses"
                              icon={Video}
                              resources={instructorMasterpieces.courses}
                              type="courses"
                              isInstructorContent={true}
                            />
                          ) : (
                            <div className="text-center py-12">
                              <Video className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-500 mb-2">
                                No Courses Added Yet
                              </h3>
                              <p className="text-gray-400 mb-4">
                                Share complementary online courses
                              </p>
                              <Button
                                onClick={() => {
                                  setNewResource((prev) => ({
                                    ...prev,
                                    type: "course",
                                  }));
                                  setShowManualResourceForm(true);
                                }}
                                variant="outline"
                                className="border-purple-300 text-purple-700 hover:bg-purple-50"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Course
                              </Button>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="tools" className="space-y-6">
                          {instructorMasterpieces.tools.length > 0 ? (
                            <ResourceSection
                              title="Tools & Software"
                              icon={Wrench}
                              resources={instructorMasterpieces.tools}
                              type="tools"
                              isInstructorContent={true}
                            />
                          ) : (
                            <div className="text-center py-12">
                              <Wrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-500 mb-2">
                                No Tools Added Yet
                              </h3>
                              <p className="text-gray-400 mb-4">
                                Recommend useful tools and software
                              </p>
                              <Button
                                onClick={() => {
                                  setNewResource((prev) => ({
                                    ...prev,
                                    type: "tool",
                                  }));
                                  setShowManualResourceForm(true);
                                }}
                                variant="outline"
                                className="border-orange-300 text-orange-700 hover:bg-orange-50"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Tool
                              </Button>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="websites" className="space-y-6">
                          {instructorMasterpieces.websites.length > 0 ? (
                            <ResourceSection
                              title="Useful Websites"
                              icon={Globe}
                              resources={instructorMasterpieces.websites}
                              type="websites"
                              isInstructorContent={true}
                            />
                          ) : (
                            <div className="text-center py-12">
                              <Globe className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-500 mb-2">
                                No Websites Added Yet
                              </h3>
                              <p className="text-gray-400 mb-4">
                                Share valuable websites and resources
                              </p>
                              <Button
                                onClick={() => {
                                  setNewResource((prev) => ({
                                    ...prev,
                                    type: "website",
                                  }));
                                  setShowManualResourceForm(true);
                                }}
                                variant="outline"
                                className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Website
                              </Button>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="exercises" className="space-y-6">
                          {instructorMasterpieces.exercises.length > 0 ? (
                            <ResourceSection
                              title="Practice Exercises"
                              icon={Target}
                              resources={instructorMasterpieces.exercises}
                              type="exercises"
                              isInstructorContent={true}
                            />
                          ) : (
                            <div className="text-center py-12">
                              <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-500 mb-2">
                                No Exercises Added Yet
                              </h3>
                              <p className="text-gray-400 mb-4">
                                Add practice exercises and challenges
                              </p>
                              <Button
                                onClick={() => {
                                  setNewResource((prev) => ({
                                    ...prev,
                                    type: "exercise",
                                  }));
                                  setShowManualResourceForm(true);
                                }}
                                variant="outline"
                                className="border-pink-300 text-pink-700 hover:bg-pink-50"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Exercise
                              </Button>
                            </div>
                          )}
                        </TabsContent>
                      </div>
                    </Tabs>

                    {showManualResourceForm && (
                      <Card className="mb-8 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-amber-200 shadow-xl">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center gap-3 text-xl text-amber-800">
                            <Plus className="h-6 w-6" />
                            Add New Masterpiece
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="space-y-3">
                            <Label className="text-base font-semibold text-amber-800">
                              Resource Type
                            </Label>
                            <Select
                              value={newResource.type}
                              onValueChange={(value) =>
                                setNewResource((prev) => ({
                                  ...prev,
                                  type: value,
                                }))
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
                                    <Play className="h-4 w-4 text-red-600" />
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
                                    <Video className="h-4 w-4 text-purple-600" />
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
                                <SelectItem value="github">
                                  <div className="flex items-center gap-2">
                                    <GitBranch className="h-4 w-4 text-gray-800" />
                                    GitHub
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
                              value={newResource.title}
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
                              value={newResource.url}
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
                              value={newResource.description}
                              onChange={(e) =>
                                setNewResource((prev) => ({
                                  ...prev,
                                  description: e.target.value,
                                }))
                              }
                              placeholder="Brief description of the resource and why you recommend it"
                              rows={3}
                              className="border-2 border-amber-200 focus:border-amber-500 transition-colors duration-300 resize-none bg-white/80"
                            />
                          </div>

                          <div className="flex gap-3">
                            <Button
                              onClick={handleAddManualResource}
                              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold px-6 py-2 transition-all duration-300 shadow-lg"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Masterpiece
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setShowManualResourceForm(false)}
                              className="border-2 border-amber-300 hover:border-amber-500 transition-colors duration-300"
                            >
                              Cancel
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
