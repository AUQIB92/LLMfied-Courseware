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
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  BookOpen,
  GraduationCap,
  Target,
  Lightbulb,
  Layers,
  Wand2,
  CheckCircle,
  Edit,
  Timer,
} from "lucide-react";

export default function AcademicModuleEditor({
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

  // Initialize local module state for editing (Academic Course specific)
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
      // Force academic course specific fields - this is ALWAYS an academic course
      isAcademicCourse: true,
      courseType: "academic",
      hasUnits: module.hasUnits || false,
      unitStructure: module.unitStructure || {},
      academicLevel: course?.academicLevel || learnerLevel || "undergraduate",
      isTechnicalCourse: true,
      moduleType: "academic",
    };

    console.log("📝 Initializing Academic Module Editor:", {
      moduleTitle: initialState.title,
      hasContent: !!initialState.content,
      contentLength: initialState.content?.length,
      hasDetailedSubsections: !!initialState.detailedSubsections?.length,
      isAcademicCourse: initialState.isAcademicCourse,
    });

    return initialState;
  });

  // Track if module has been modified
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState("saved"); // "saved", "editing", "saving"

  // Processing state for subsection generation
  const [processingStep, setProcessingStep] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);

  // Sync local module state when module prop changes (important for Academic courses)
  useEffect(() => {
    console.log("🔄 Module prop changed, updating localModule:", {
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
      hasUnits: module.hasUnits || false,
      unitStructure: module.unitStructure || {},
      academicLevel: course?.academicLevel || learnerLevel || "undergraduate",
      isTechnicalCourse: true,
      moduleType: "academic",
    }));

    // Reset changes flag when module prop changes
    setHasChanges(false);
  }, [module, learnerLevel]);

  // States for tabs and editing
  const [activeMainTab, setActiveMainTab] = useState("overview");
  const [editingObjective, setEditingObjective] = useState(null);
  const [editingExample, setEditingExample] = useState(null);
  const [newObjective, setNewObjective] = useState("");
  const [newExample, setNewExample] = useState("");

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

  // Helper function for Academic Module Editor - ALWAYS use debounced updates
  const updateModule = (updatedModule) => {
    console.log(
      "🎓 Academic Module Editor: Using debounced update for smooth editing"
    );
    debouncedParentUpdate(updatedModule);
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

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
    };
  }, [updateTimeout]);

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

  return (
    <div className="space-y-6">
      {/* Academic Module Editor - No course-level actions, only module editing */}

      {/* Module Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-800">
                  {localModule.title || "Untitled Module"}
                </CardTitle>
                <p className="text-gray-600">
                  {examType} • {subject} • {learnerLevel}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <GraduationCap className="h-4 w-4 mr-1" />
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
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
          <TabsTrigger value="examples" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Examples
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
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
                  Module Summary
                </Label>
                <Textarea
                  id="summary"
                  value={localModule.summary || ""}
                  onChange={(e) => updateModuleField("summary", e.target.value)}
                  placeholder="Brief overview of the module content..."
                  rows={4}
                  className="border-2 border-gray-200 focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Input
                    value={localModule.difficulty || learnerLevel}
                    onChange={(e) =>
                      updateModuleField("difficulty", e.target.value)
                    }
                    placeholder="e.g., Intermediate"
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
                        debouncedParentUpdate(localModule);
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
        </TabsContent>

        {/* Subsections Tab */}
        <TabsContent value="subsections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Detailed Subsections
              </CardTitle>
              <p className="text-sm text-gray-600">
                Generate and manage detailed content for each subsection of your
                module.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {!localModule.detailedSubsections ||
              localModule.detailedSubsections.length === 0 ? (
                <div className="text-center py-8">
                  <Layers className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    No detailed subsections generated yet.
                  </p>
                  <Button
                    onClick={async () => {
                      try {
                        setProcessingStep("Generating detailed subsections...");
                        setProcessingProgress(10);

                        const response = await fetch(
                          "/api/exam-genius/generate-subsection-content",
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              ...getAuthHeaders(),
                            },
                            body: JSON.stringify({
                              content: localModule.content,
                              context: {
                                moduleTitle: localModule.title,
                                subject: course?.subject || "Academic",
                                difficulty: course?.academicLevel || "graduate",
                                examType: "academic",
                                subsectionTitle: "Module Subsections",
                              },
                            }),
                          }
                        );

                        setProcessingProgress(70);

                        if (response.ok) {
                          const data = await response.json();

                          // The API returns { content: subsectionData }, so we need to process it
                          let detailedSubsections = [];

                          if (data.content) {
                            // If it's a single subsection object, wrap it in an array
                            if (
                              typeof data.content === "object" &&
                              !Array.isArray(data.content)
                            ) {
                              detailedSubsections = [
                                {
                                  title: localModule.title || "Module Content",
                                  content:
                                    data.content.explanation ||
                                    data.content.summary ||
                                    "Generated content",
                                  examples: data.content.examples || [],
                                  level: 1,
                                },
                              ];
                            }
                            // If it's already an array of subsections
                            else if (Array.isArray(data.content)) {
                              detailedSubsections = data.content;
                            }
                          }

                          const updatedModule = {
                            ...localModule,
                            detailedSubsections: detailedSubsections,
                          };

                          updateLocalModuleField(
                            "detailedSubsections",
                            detailedSubsections
                          );
                          updateModule(updatedModule);

                          setProcessingProgress(100);
                          toast.success(
                            "✅ Detailed subsections generated successfully!"
                          );
                        } else {
                          throw new Error("Failed to generate subsections");
                        }
                      } catch (error) {
                        console.error("Error generating subsections:", error);
                        toast.error(
                          "❌ Failed to generate subsections: " + error.message
                        );
                      } finally {
                        setProcessingStep("");
                        setProcessingProgress(0);
                      }
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                    disabled={!localModule.content || processingStep}
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Detailed Subsections
                  </Button>
                  <p className="text-xs text-gray-400 mt-2">
                    Make sure your module content has proper headings (##, ###)
                    for best results.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Generated Subsections (
                      {localModule.detailedSubsections.length})
                    </h3>
                    <Button
                      onClick={async () => {
                        try {
                          setProcessingStep(
                            "Regenerating detailed subsections..."
                          );
                          setProcessingProgress(10);

                          const response = await fetch(
                            "/api/exam-genius/generate-subsection-content",
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                ...getAuthHeaders(),
                              },
                              body: JSON.stringify({
                                content: localModule.content,
                                context: {
                                  moduleTitle: localModule.title,
                                  subject: course?.subject || "Academic",
                                  difficulty:
                                    course?.academicLevel || "graduate",
                                  examType: "academic",
                                  subsectionTitle: "Module Subsections",
                                },
                              }),
                            }
                          );

                          setProcessingProgress(70);

                          if (response.ok) {
                            const data = await response.json();

                            // The API returns { content: subsectionData }, so we need to process it
                            let detailedSubsections = [];

                            if (data.content) {
                              // If it's a single subsection object, wrap it in an array
                              if (
                                typeof data.content === "object" &&
                                !Array.isArray(data.content)
                              ) {
                                detailedSubsections = [
                                  {
                                    title:
                                      localModule.title || "Module Content",
                                    content:
                                      data.content.explanation ||
                                      data.content.summary ||
                                      "Generated content",
                                    examples: data.content.examples || [],
                                    level: 1,
                                  },
                                ];
                              }
                              // If it's already an array of subsections
                              else if (Array.isArray(data.content)) {
                                detailedSubsections = data.content;
                              }
                            }

                            const updatedModule = {
                              ...localModule,
                              detailedSubsections: detailedSubsections,
                            };

                            updateLocalModuleField(
                              "detailedSubsections",
                              detailedSubsections
                            );
                            updateModule(updatedModule);

                            setProcessingProgress(100);
                            toast.success(
                              "✅ Detailed subsections regenerated successfully!"
                            );
                          } else {
                            throw new Error("Failed to regenerate subsections");
                          }
                        } catch (error) {
                          console.error(
                            "Error regenerating subsections:",
                            error
                          );
                          toast.error(
                            "❌ Failed to regenerate subsections: " +
                              error.message
                          );
                        } finally {
                          setProcessingStep("");
                          setProcessingProgress(0);
                        }
                      }}
                      variant="outline"
                      size="sm"
                      disabled={processingStep}
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                  </div>

                  {localModule.detailedSubsections.map((subsection, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <h4 className="font-semibold text-lg text-blue-700">
                          {subsection.title}
                        </h4>
                        {subsection.level && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            Level {subsection.level}
                          </span>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm max-w-none">
                          <div
                            dangerouslySetInnerHTML={{
                              __html:
                                subsection.content?.replace(/\n/g, "<br/>") ||
                                subsection.explanation ||
                                "No content available",
                            }}
                          />
                        </div>
                        {subsection.examples &&
                          subsection.examples.length > 0 && (
                            <div className="mt-4">
                              <h5 className="font-medium text-gray-700 mb-2">
                                Examples:
                              </h5>
                              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                {subsection.examples.map((example, exIndex) => (
                                  <li key={exIndex}>{example}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Examples Tab */}
        <TabsContent value="examples" className="space-y-6">
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
      </Tabs>
    </div>
  );
}
