"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  Loader2,
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
  Brain,
  Download,
  FileText,
  Zap,
  Trophy,
  Target,
  Timer,
  Award,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Edit,
  AlertTriangle,
  Info,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import AcademicModuleEditorEnhanced from "./AcademicModuleEditorEnhanced";
import {
  useContentValidation,
  useContentProcessor,
} from "@/lib/contentDisplayHooks";
import ContentDisplay from "@/components/ContentDisplay";

// Add new import for the improved field validator component
const AcademicCourseFieldValidator = ({
  field,
  value,
  onChange,
  placeholder,
  multiline = false,
  rows = 3,
  className = "",
}) => {
  if (multiline) {
    return (
      <Textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={className}
      />
    );
  }

  return (
    <Input
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
};

export default function AcademicCourseCreator({ onCourseCreated }) {
  const [step, setStep] = useState(1);
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    modules: [],
    subject: "",
    academicLevel: "undergraduate",
    semester: "",
    credits: 3,
    duration: "",
    objectives: [],
    isAcademicCourse: true,
    courseType: "academic",
  });
  const [loading, setLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [file, setFile] = useState(null);
  const [generationType, setGenerationType] = useState("upload");
  const [curriculumTopic, setCurriculumTopic] = useState("");
  const [generatedCurriculum, setGeneratedCurriculum] = useState("");
  const [showCurriculumPreview, setShowCurriculumPreview] = useState(false);
  const [currentCourseId, setCurrentCourseId] = useState(null);
  const [numberOfModules, setNumberOfModules] = useState(8);
  const [moduleTopics, setModuleTopics] = useState("");
  const [teachingNotes, setTeachingNotes] = useState("");
  const [selectedModule, setSelectedModule] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalJobs, setTotalJobs] = useState(0);
  const { getAuthHeaders } = useAuth();

  const academicLevels = [
    { id: "undergraduate", name: "Undergraduate", icon: "🎓" },
    { id: "graduate", name: "Graduate", icon: "📚" },
    { id: "postgraduate", name: "Postgraduate", icon: "🔬" },
    { id: "doctoral", name: "Doctoral", icon: "🏆" },
  ];

  const subjects = [
    "Computer Science",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Engineering",
    "Business",
    "Psychology",
    "History",
    "Literature",
    "Economics",
    "Political Science",
    "Sociology",
    "Philosophy",
    "Art",
    "Music",
    "Other",
  ];

  // Enhanced handleModuleUpdate function that properly processes academic content structure
  const handleModuleUpdate = (updatedModule) => {
    // Process the module content to detect Units and create proper subsections
    const processedModule = processAcademicModuleContent(updatedModule);

    setCourseData((prev) => ({
      ...prev,
      modules: prev.modules.map((module) =>
        module.id === processedModule.id ? processedModule : module
      ),
    }));
    setSelectedModule(null);
    toast.success("📚 Module updated successfully!");
  };

  // Enhanced function to properly structure academic content
  const enhanceAcademicContentStructure = (content) => {
    if (!content) return content;

    const lines = content.split("\n");
    let enhancedContent = [];
    let currentUnit = 0;
    let currentSection = 0;
    let currentSubsection = 0;

    lines.forEach((line, index) => {
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
            "*Detailed content for this section will be added here. This section covers the fundamental concepts and practical applications.*"
          );
          enhancedContent.push("");
        } else {
          // Smaller topics become subsections
          currentSubsection++;
          enhancedContent.push(
            `### ${currentSection}.${currentSubsection} ${sectionContent}`
          );
          enhancedContent.push("");
          enhancedContent.push(
            "*This subsection provides detailed explanation of the concept, including:*"
          );
          enhancedContent.push("- Key definitions and terminology");
          enhancedContent.push("- Practical examples and applications");
          enhancedContent.push("- Problem-solving techniques");
          enhancedContent.push("");
        }
        return;
      }

      // Regular content - add as is
      enhancedContent.push(line);
    });

    return enhancedContent.join("\n");
  };

  // EXAMGENIUS PATTERN: Process academic module content to match ExamGenius structure
  const processAcademicModuleContent = (module) => {
    // EXAMGENIUS FLOW: Extract structure from content (no enhancedMarkdown during file processing)
    const content = module.enhancedMarkdown || module.content || "";

    if (!content) {
      console.log("No content found, creating basic structure");
      return {
        ...module,
        detailedSubsections: [],
        hasUnits: false,
        unitStructure: {},
        isAcademicCourse: true,
        courseType: "academic",
        isTechnicalCourse: true,
        moduleType: "academic",
      };
    }

    // EXAMGENIUS PATTERN: Extract subsections from content (works with both content and enhancedMarkdown)
    const lines = content.split("\n");
    const subsections = [];
    const unitSections = {}; // Store unit information

    lines.forEach((line, index) => {
      // Detect Units (various formats)
      const unitMatch = line.match(
        /^#+\s*(?:Unit|UNIT|Chapter|CHAPTER)\s*(\d+)[:\s]*(.*)$/i
      );
      if (unitMatch) {
        const unitNumber = unitMatch[1];
        const unitTitle = unitMatch[2].trim();
        unitSections[unitNumber] = unitTitle;
      }

      // Detect sections and subsections (###, ####, etc.) - EXAMGENIUS PATTERN
      const sectionMatch = line.match(/^(#{3,4})\s+(.*)/);
      if (sectionMatch) {
        const level = sectionMatch[1].length;
        const title = sectionMatch[2].trim();

        // EXAMGENIUS STRUCTURE: Create subsection without detailed content (generated later)
        let unitContext = "";
        const titleParts = title.match(/^(\d+)\.(\d+)(?:\.(\d+))?\s+(.*)/);
        if (titleParts) {
          const unitNum = titleParts[1];
          const sectionNum = titleParts[2];
          const subsectionNum = titleParts[3];
          const sectionTitle = titleParts[4];

          if (unitSections[unitNum]) {
            unitContext = `Unit ${unitNum}: ${unitSections[unitNum]}`;
          }

          subsections.push({
            title: title,
            number: `${unitNum}.${sectionNum}${
              subsectionNum ? `.${subsectionNum}` : ""
            }`,
            name: sectionTitle,
            unit: unitNum,
            unitTitle: unitSections[unitNum] || "",
            unitContext: unitContext,
            level: level,
            // EXAMGENIUS PATTERN: No detailed content here - generated individually later
            summary: `Academic content for ${title}`,
            isAcademicContent: true,
          });
        } else {
          // Fallback for non-numbered sections
          subsections.push({
            title: title,
            number: `${subsections.length + 1}`,
            name: title,
            unit: "1",
            unitTitle: "General",
            unitContext: "General Academic Content",
            level: level,
            summary: `Academic content for ${title}`,
            isAcademicContent: true,
          });
        }
      }
    });

    // EXAMGENIUS STRUCTURE: Return module with subsection structure but no detailed content
    return {
      ...module,
      detailedSubsections: subsections,
      hasUnits: Object.keys(unitSections).length > 0,
      unitStructure: unitSections,
      lastUpdated: new Date().toISOString(),
      // EXAMGENIUS PROPERTIES
      isAcademicCourse: true,
      courseType: "academic",
      isTechnicalCourse: true, // Enable technical features in the editor
      moduleType: "academic",
    };
  };

  const handleFileSelection = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success(`✅ File selected: ${selectedFile.name}`);
    }
  };

  // Process uploaded file - FOLLOWS EXAMGENIUS PATTERN EXACTLY
  const handleProcessFile = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setLoading(true);
    setProcessingStep("📄 Processing uploaded content...");
    setProcessingProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("learnerLevel", courseData.academicLevel);
      formData.append("subject", courseData.subject);
      formData.append("title", courseData.title);
      formData.append("description", courseData.description);
      formData.append("duration", courseData.duration || "16 weeks");
      formData.append("examType", "academic");
      formData.append("isAcademicCourse", "true");

      // EXAMGENIUS STYLE: Progress stages with academic focus
      const progressStages = [
        { step: "📖 Reading and analyzing academic content...", progress: 20 },
        { step: "🧠 Extracting key academic concepts...", progress: 40 },
        { step: "🎯 Creating module structure...", progress: 60 },
        { step: "📚 Adding academic learning elements...", progress: 80 },
        { step: "✨ Finalizing academic course structure...", progress: 95 },
      ];

      let currentStage = 0;
      const progressInterval = setInterval(() => {
        if (currentStage < progressStages.length) {
          setProcessingStep(progressStages[currentStage].step);
          setProcessingProgress(progressStages[currentStage].progress);
          currentStage++;
        }
      }, 3000);

      // EXAMGENIUS PATTERN: Use academic file processing API (NO AI calls during file processing)
      const response = await fetch("/api/academic-courses/process-file", {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      const data = await response.json();

      if (data.success) {
        // EXAMGENIUS PATTERN: File processing only extracts structure, no AI content yet
        let structuredModules = data.modules || [];

        console.log(
          `📄 File processing extracted ${structuredModules.length} modules WITHOUT AI calls`
        );

        // EXAMGENIUS PATTERN: Only extract structure during file upload - NO AI CALLS
        structuredModules = structuredModules.map((module) => {
          // First enhance the content structure
          const enhancedContent = enhanceAcademicContentStructure(
            module.content
          );

          const enhancedModule = {
            ...module,
            content: enhancedContent,
            enhancedMarkdown: enhancedContent, // Use enhanced content as enhanced markdown
            // Add academic course properties
            isAcademicCourse: true,
            courseType: "academic",
            academicLevel: courseData.academicLevel,
          };

          // Process for Unit detection from enhanced content
          return {
            ...enhancedModule,
            ...processAcademicModuleContent(enhancedModule),
          };
        });

        console.log(
          `📄 File structure extracted - detailed subsections UI will be created from content structure`
        );

        // EXAMGENIUS PATTERN: No AI calls during file upload - enhancedMarkdown will be generated later when user clicks "Generate with AI"

        const updatedCourseData = {
          ...courseData,
          modules: structuredModules,
          isAcademicCourse: true,
          courseType: "academic",
        };

        setCourseData(updatedCourseData);

        // Auto-save as draft
        await handleSaveDraft(updatedCourseData, true);

        setProcessingStep("✅ Academic course created successfully!");

        setTimeout(() => {
          setStep(3);
          toast.success(
            `🎉 Course Structure Imported Successfully!\n\n✨ Created ${structuredModules.length} modules with structure extracted from file\n\n🎓 Your academic course template is ready for content generation!`
          );
        }, 1000);
      } else {
        throw new Error(data.error || "Failed to process file");
      }
    } catch (error) {
      console.error("Processing error:", error);
      toast.error(`Failed to process content: ${error.message}`);
      setProcessingStep("❌ Processing failed");
    } finally {
      setTimeout(() => {
        setLoading(false);
        setProcessingStep("");
        setProcessingProgress(0);
      }, 2000);
    }
  };

  // Generate curriculum - FOLLOWS EXAMGENIUS PATTERN EXACTLY
  const handleGenerateCurriculum = async () => {
    if (
      !curriculumTopic.trim() ||
      !courseData.subject ||
      !courseData.academicLevel
    ) {
      toast.error("Please enter a topic, select subject, and academic level");
      return;
    }

    setLoading(true);
    setProcessingStep("🧠 AI is creating your academic curriculum...");
    setProcessingProgress(0);

    try {
      // EXAMGENIUS STYLE: Progress stages
      const progressStages = [
        { step: "🔍 Analyzing academic requirements...", progress: 25 },
        { step: "📚 Creating comprehensive module structure...", progress: 50 },
        { step: "🎯 Organizing learning objectives...", progress: 75 },
        {
          step: "⚡ Adding academic resources and assessments...",
          progress: 90,
        },
      ];

      let currentStage = 0;
      const progressInterval = setInterval(() => {
        if (currentStage < progressStages.length) {
          setProcessingStep(progressStages[currentStage].step);
          setProcessingProgress(progressStages[currentStage].progress);
          currentStage++;
        }
      }, 2000);

      // EXAMGENIUS PATTERN: Use exam-genius curriculum API with academic focus
      const response = await fetch("/api/exam-genius/generate-curriculum", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          title: curriculumTopic,
          topic: curriculumTopic,
          examType: "academic",
          subject: courseData.subject,
          learnerLevel: courseData.academicLevel,
          duration: courseData.duration,
          description: courseData.description,
          numberOfModules: numberOfModules,
          moduleTopics: moduleTopics,
          teachingNotes: teachingNotes,
        }),
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      const data = await response.json();

      if (data.success) {
        setGeneratedCurriculum(data.curriculum);

        // EXAMGENIUS PATTERN: Process the curriculum using exam-genius API
        const processResponse = await fetch(
          "/api/exam-genius/process-curriculum",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeaders(),
            },
            body: JSON.stringify({
              curriculum: data.curriculum,
              courseData: {
                ...courseData,
                title: curriculumTopic,
                isAcademicCourse: true,
                examType: "academic",
              },
            }),
          }
        );

        if (processResponse.ok) {
          const processData = await processResponse.json();
          let processedModules = processData.modules || [];

          // Enhance with academic properties while keeping ExamGenius structure
          processedModules = processedModules.map((module) => ({
            ...module,
            // Preserve ExamGenius fields
            enhancedMarkdown: module.enhancedMarkdown,
            detailedSubsections: module.detailedSubsections || [],
            // Add academic course properties
            isAcademicCourse: true,
            courseType: "academic",
            academicLevel: courseData.academicLevel,
            // Process for Unit detection while preserving ExamGenius structure
            ...processAcademicModuleContent(module),
          }));

          setCourseData((prev) => ({ ...prev, modules: processedModules }));
          setStep(3);
          toast.success(
            "Academic curriculum generated and processed successfully!"
          );

          // Automatically save as draft after generating and processing
          await handleSaveDraft(
            { ...courseData, modules: processedModules },
            true
          );
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate curriculum");
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(`Failed to generate curriculum: ${error.message}`);
    } finally {
      setLoading(false);
      setProcessingStep("");
      setProcessingProgress(0);
    }
  };

  const handleCreateAssignment = async (module, assignmentIndex) => {
    // Validate required data
    if (!module.title) {
      toast.error("❌ Module title is required to create an assignment");
      return;
    }

    if (!module.content && !module.summary) {
      toast.error("❌ Module content is required to create an assignment");
      return;
    }

    try {
      setLoading(true);
      toast.info("📝 Creating academic assignment...");

      const assignmentPayload = {
        concept: module.title,
        content:
          module.content ||
          module.summary ||
          `Module content for ${module.title}`,
        subject: courseData.subject,
        academicLevel: courseData.academicLevel,
        assignmentType:
          assignmentIndex === 0 ? "Research Paper" : "Problem Solving",
      };

      const response = await fetch(
        "/api/academic-courses/generate-assignment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify(assignmentPayload),
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success("📋 Assignment created successfully!");

        const updatedModules = courseData.modules.map((m) => {
          if (m.id === module.id) {
            const updatedAssignments = [...(m.assignments || [])];
            updatedAssignments[assignmentIndex] = data.assignment;
            return { ...m, assignments: updatedAssignments };
          }
          return m;
        });
        setCourseData((prev) => ({ ...prev, modules: updatedModules }));
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to create assignment");
      }
    } catch (error) {
      console.error("Assignment creation error:", error);
      toast.error(`Failed to create assignment: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = async (module) => {
    // Validate required data
    if (!module.title) {
      toast.error("❌ Module title is required to create a quiz");
      return;
    }

    if (!module.content && !module.summary) {
      toast.error("❌ Module content is required to create a quiz");
      return;
    }

    try {
      setLoading(true);
      toast.info("🎯 Creating academic quiz...");

      const quizPayload = {
        concept: module.title,
        content:
          module.content ||
          module.summary ||
          `Module content for ${module.title}`,
        subject: courseData.subject,
        academicLevel: courseData.academicLevel,
      };

      const response = await fetch("/api/academic-courses/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(quizPayload),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("🏆 Quiz created successfully!");

        const updatedModules = courseData.modules.map((m) =>
          m.id === module.id ? { ...m, quiz: data.quiz } : m
        );
        setCourseData((prev) => ({ ...prev, modules: updatedModules }));
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to create quiz");
      }
    } catch (error) {
      console.error("Quiz creation error:", error);
      toast.error(`Failed to create quiz: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async (
    currentCourseData = courseData,
    isAutoSave = false
  ) => {
    try {
      if (!isAutoSave) setLoading(true);

      toast.info(
        isAutoSave ? "🔄 Automatically saving draft..." : "🔍 Saving draft..."
      );

      if (
        !currentCourseData.title ||
        !currentCourseData.subject ||
        !currentCourseData.academicLevel
      ) {
        toast.error(
          "❌ Please fill in all required fields (Title, Subject, Academic Level)"
        );
        return;
      }

      if (
        !currentCourseData.modules ||
        currentCourseData.modules.length === 0
      ) {
        toast.error("❌ Course must have at least one module before saving");
        return;
      }

      const payload = {
        ...currentCourseData,
        status: "draft",
        isPublished: false, // Explicitly set for draft
        isAcademicCourse: true,
        courseType: "academic",
        examType: "academic", // EXAMGENIUS COMPATIBILITY
        isExamGenius: false, // Distinguish from exam genius courses
      };

      // Add courseId if we have one for updates
      if (currentCourseId) {
        payload._id = currentCourseId;
      }

      console.log("🔍 DEBUG Academic Course Save Draft:", {
        hasStatus: payload.hasOwnProperty("status"),
        status: payload.status,
        isPublished: payload.isPublished,
        title: payload.title,
        courseId: currentCourseId,
        isAcademicCourse: payload.isAcademicCourse,
      });

      // ACADEMIC COURSE: Use dedicated Academic course save API
      const response = await fetch("/api/academic-courses/save-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload), // Direct payload, not wrapped in course object
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentCourseId(data.courseId);

        if (!isAutoSave) {
          toast.success("✅ Academic course draft saved successfully!");
        }

        return data;
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to save draft");
      }
    } catch (error) {
      console.error("Save draft error:", error);
      toast.error(`Failed to save draft: ${error.message}`);
    } finally {
      if (!isAutoSave) setLoading(false);
    }
  };

  const handlePublishCourse = async () => {
    try {
      setLoading(true);

      if (
        !courseData.title ||
        !courseData.subject ||
        !courseData.academicLevel
      ) {
        toast.error("❌ Please fill in all required fields before publishing");
        return;
      }

      if (!courseData.modules || courseData.modules.length === 0) {
        toast.error(
          "❌ Course must have at least one module before publishing"
        );
        return;
      }

      const payload = {
        ...courseData,
        status: "published",
        isPublished: true, // Explicitly set for published
        isAcademicCourse: true,
        courseType: "academic",
        examType: "academic", // EXAMGENIUS COMPATIBILITY
        isExamGenius: false, // Distinguish from exam genius courses
      };

      // Add courseId if we have one for updates
      if (currentCourseId) {
        payload._id = currentCourseId;
      }

      console.log("🔍 DEBUG Academic Course Publish:", {
        hasStatus: payload.hasOwnProperty("status"),
        status: payload.status,
        isPublished: payload.isPublished,
        title: payload.title,
        courseId: currentCourseId,
        isAcademicCourse: payload.isAcademicCourse,
      });

      // ACADEMIC COURSE: Use dedicated Academic course save API
      const response = await fetch("/api/academic-courses/save-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload), // Direct payload, not wrapped in course object
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("🎉 Academic course published successfully!");

        if (onCourseCreated) {
          onCourseCreated(data);
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to publish course");
      }
    } catch (error) {
      console.error("Publish course error:", error);
      toast.error(`Failed to publish course: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditModule = (module) => {
    // Process the module before editing to ensure it has the latest structure
    const processedModule = processAcademicModuleContent(module);
    setSelectedModule(processedModule);
  };

  const resetForm = () => {
    setCourseData({
      title: "",
      description: "",
      modules: [],
      subject: "",
      academicLevel: "undergraduate",
      semester: "",
      credits: 3,
      duration: "",
      objectives: [],
      isAcademicCourse: true,
      courseType: "academic",
    });
    setStep(1);
    setFile(null);
    setCurriculumTopic("");
    setGeneratedCurriculum("");
    setShowCurriculumPreview(false);
    setCurrentCourseId(null);
    setSelectedModule(null);
    toast.success("Form reset successfully");
  };

  if (selectedModule) {
    return (
      <AcademicModuleEditorEnhanced
        module={selectedModule}
        onUpdate={handleModuleUpdate}
        examType="academic"
        subject={courseData.subject}
        learnerLevel={courseData.academicLevel}
        course={{
          ...courseData,
          isAcademicCourse: true,
          courseType: "academic",
          examType: "academic", // EXAMGENIUS COMPATIBILITY
          isExamGenius: false,
          isTechnicalCourse: true, // Enable all ExamGenius features
        }}
        courseId={currentCourseId}
        onSaveSuccess={() => {
          setSelectedModule(null);
          toast.success("📚 Module saved successfully!");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Academic Course Creator
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Create comprehensive academic courses with AI-powered content
                generation and Unit-based organization
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Award className="h-3 w-3" />
              Academic Standards
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Unit Detection
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Brain className="h-3 w-3" />
              AI-Powered
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              Editable Content
            </Badge>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-8 mb-8">
          <div
            className={`flex items-center space-x-2 ${
              step >= 1 ? "text-blue-600" : "text-gray-400"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              1
            </div>
            <span className="font-medium">Course Info</span>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400" />
          <div
            className={`flex items-center space-x-2 ${
              step >= 2 ? "text-blue-600" : "text-gray-400"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              2
            </div>
            <span className="font-medium">Upload Content</span>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400" />
          <div
            className={`flex items-center space-x-2 ${
              step >= 3 ? "text-blue-600" : "text-gray-400"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= 3 ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              3
            </div>
            <span className="font-medium">Review & Publish</span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-800">
                    {processingStep}
                  </h3>
                  <Progress value={processingProgress} className="mt-2 h-3" />
                  <p className="text-sm text-blue-600 mt-1">
                    {processingProgress}% complete
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Course Information */}
        {step === 1 && (
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="flex items-center justify-center gap-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
                Academic Course Information
              </CardTitle>
              <CardDescription>
                Enter the essential details for your academic course
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title *</Label>
                <AcademicCourseFieldValidator
                  field="title"
                  value={courseData.title}
                  onChange={(value) =>
                    setCourseData((prev) => ({ ...prev, title: value }))
                  }
                  placeholder="e.g., Advanced Data Structures and Algorithms"
                  className="border-2 border-gray-200 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Course Description *</Label>
                <AcademicCourseFieldValidator
                  field="description"
                  value={courseData.description}
                  onChange={(value) =>
                    setCourseData((prev) => ({ ...prev, description: value }))
                  }
                  placeholder="Provide a comprehensive description of what students will learn in this course..."
                  multiline={true}
                  rows={4}
                  className="border-2 border-gray-200 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Select
                    value={courseData.subject}
                    onValueChange={(value) =>
                      setCourseData((prev) => ({ ...prev, subject: value }))
                    }
                  >
                    <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Academic Level *</Label>
                  <Select
                    value={courseData.academicLevel}
                    onValueChange={(value) =>
                      setCourseData((prev) => ({
                        ...prev,
                        academicLevel: value,
                      }))
                    }
                  >
                    <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicLevels.map((level) => (
                        <SelectItem key={level.id} value={level.id}>
                          <div className="flex items-center gap-2">
                            <span>{level.icon}</span>
                            <span>{level.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="credits">Credits</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={courseData.credits}
                    onChange={(e) =>
                      setCourseData((prev) => ({
                        ...prev,
                        credits: parseInt(e.target.value) || 3,
                      }))
                    }
                    className="border-2 border-gray-200 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="semester">Semester/Term</Label>
                  <AcademicCourseFieldValidator
                    field="semester"
                    value={courseData.semester}
                    onChange={(value) =>
                      setCourseData((prev) => ({ ...prev, semester: value }))
                    }
                    placeholder="e.g., Fall 2024"
                    className="border-2 border-gray-200 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <AcademicCourseFieldValidator
                    field="duration"
                    value={courseData.duration}
                    onChange={(value) =>
                      setCourseData((prev) => ({ ...prev, duration: value }))
                    }
                    placeholder="e.g., 16 weeks"
                    className="border-2 border-gray-200 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={
                    !courseData.title ||
                    !courseData.subject ||
                    !courseData.academicLevel
                  }
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  Next: Upload Content
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Content Upload */}
        {step === 2 && (
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="text-center bg-gradient-to-r from-green-50 to-blue-50">
              <CardTitle className="flex items-center justify-center gap-2">
                <Upload className="h-6 w-6 text-green-600" />
                Content Upload & Generation
              </CardTitle>
              <CardDescription>
                Upload existing content or generate academic curriculum with AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="flex justify-center gap-4">
                <Button
                  variant={generationType === "upload" ? "default" : "outline"}
                  onClick={() => setGenerationType("upload")}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Content
                </Button>
                <Button
                  variant={
                    generationType === "generate" ? "default" : "outline"
                  }
                  onClick={() => setGenerationType("generate")}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate Curriculum
                </Button>
              </div>

              {generationType === "upload" && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Upload Your Academic Content
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Support PDF, Markdown, or Text files (max 25MB). The
                      system will automatically detect Units and create
                      subsections.
                    </p>
                    <Input
                      type="file"
                      accept=".pdf,.md,.txt,.markdown"
                      onChange={handleFileSelection}
                      className="max-w-xs mx-auto"
                    />
                    {file && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800 font-medium">
                          ✅ File selected: {file.name}
                        </p>
                      </div>
                    )}
                  </div>

                  {file && (
                    <div className="flex justify-center">
                      <Button
                        onClick={handleProcessFile}
                        disabled={loading}
                        className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Brain className="h-4 w-4 mr-2" />
                            Process for {courseData.academicLevel}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {generationType === "generate" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="curriculum-topic">Curriculum Topic *</Label>
                    <AcademicCourseFieldValidator
                      field="curriculum-topic"
                      value={curriculumTopic}
                      onChange={(value) => setCurriculumTopic(value)}
                      placeholder={`e.g., ${courseData.subject} Complete Academic Course`}
                      className="border-2 border-gray-200 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="modules-count">Number of Modules</Label>
                      <Input
                        type="number"
                        min="4"
                        max="20"
                        value={numberOfModules}
                        onChange={(e) =>
                          setNumberOfModules(parseInt(e.target.value) || 8)
                        }
                        className="border-2 border-gray-200 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="module-topics">Specific Topics</Label>
                      <AcademicCourseFieldValidator
                        field="module-topics"
                        value={moduleTopics}
                        onChange={(value) => setModuleTopics(value)}
                        placeholder="e.g., Theory, Practice, Research..."
                        className="border-2 border-gray-200 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teaching-notes">
                      Teaching Notes & Focus Areas
                    </Label>
                    <AcademicCourseFieldValidator
                      field="teaching-notes"
                      value={teachingNotes}
                      onChange={(value) => setTeachingNotes(value)}
                      placeholder="Special instructions for content generation..."
                      multiline={true}
                      rows={3}
                      className="border-2 border-gray-200 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex justify-center">
                    <Button
                      onClick={handleGenerateCurriculum}
                      disabled={loading || !curriculumTopic}
                      className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Academic Curriculum
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review & Publish */}
        {step === 3 && (
          <Card className="w-full max-w-6xl mx-auto">
            <CardHeader className="text-center bg-gradient-to-r from-purple-50 to-blue-50">
              <CardTitle className="flex items-center justify-center gap-2">
                <Trophy className="h-6 w-6 text-purple-600" />
                Review & Publish Academic Course
              </CardTitle>
              <CardDescription>
                Review your course modules and publish when ready
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {/* Course Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">
                  {courseData.title}
                </h3>
                <p className="text-gray-600 mb-2">{courseData.description}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{courseData.subject}</Badge>
                  <Badge variant="secondary">{courseData.academicLevel}</Badge>
                  <Badge variant="secondary">
                    {courseData.modules.length} modules
                  </Badge>
                  <Badge variant="secondary">
                    {courseData.modules.reduce(
                      (acc, mod) =>
                        acc + (mod.detailedSubsections?.length || 0),
                      0
                    )}{" "}
                    subsections
                  </Badge>
                  <Badge variant="secondary">
                    {courseData.modules.length * 2} assignments
                  </Badge>
                  <Badge variant="secondary">
                    {courseData.modules.length} quizzes
                  </Badge>
                </div>
              </div>

              {/* Modules List */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">
                  Course Modules ({courseData.modules.length})
                </h3>
                {courseData.modules.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      No Modules Available
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Please go back and upload content or generate curriculum.
                    </p>
                    <Button onClick={() => setStep(2)} variant="outline">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Upload
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {courseData.modules.map((module, index) => (
                      <Card
                        key={module.id || index}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-lg">
                              Module {index + 1}:{" "}
                              {module.title || `Untitled Module`}
                            </h4>
                            <Button
                              onClick={() => handleEditModule(module)}
                              size="sm"
                              variant="outline"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit Content
                            </Button>
                          </div>

                          <p className="text-gray-600 mb-3 text-sm">
                            {module.summary || "No summary available"}
                          </p>

                          {/* Show Unit structure if detected */}
                          {module.hasUnits && module.unitStructure && (
                            <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                              <h5 className="font-medium text-sm text-blue-800 mb-1">
                                Units Detected:
                              </h5>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(module.unitStructure).map(
                                  ([num, title]) => (
                                    <Badge
                                      key={num}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Unit {num}: {title}
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {/* Subsections info */}
                          {module.detailedSubsections &&
                            module.detailedSubsections.length > 0 && (
                              <div className="mb-3 p-2 bg-purple-50 rounded-lg">
                                <h5 className="font-medium text-sm text-purple-800 mb-1">
                                  Subsections (
                                  {module.detailedSubsections.length}):
                                </h5>
                                <div className="flex flex-wrap gap-1">
                                  {module.detailedSubsections
                                    .slice(0, 3)
                                    .map((sub, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {sub.number} {sub.name}
                                      </Badge>
                                    ))}
                                  {module.detailedSubsections.length > 3 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      +{module.detailedSubsections.length - 3}{" "}
                                      more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Assignments */}
                            <div className="space-y-2">
                              <h5 className="font-medium text-sm text-blue-600">
                                Assignments (2)
                              </h5>
                              {module.assignments?.map((assignment, idx) => (
                                <div
                                  key={idx}
                                  className="p-2 bg-blue-50 rounded text-xs"
                                >
                                  <p className="font-medium">
                                    {assignment.title}
                                  </p>
                                  <p className="text-gray-600">
                                    {assignment.type} - {assignment.points}{" "}
                                    points
                                  </p>
                                </div>
                              )) || (
                                <div className="space-y-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleCreateAssignment(module, 0)
                                    }
                                    className="w-full text-xs"
                                  >
                                    Create Assignment 1
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleCreateAssignment(module, 1)
                                    }
                                    className="w-full text-xs"
                                  >
                                    Create Assignment 2
                                  </Button>
                                </div>
                              )}
                            </div>

                            {/* Quiz */}
                            <div className="space-y-2">
                              <h5 className="font-medium text-sm text-green-600">
                                Quiz (1)
                              </h5>
                              {module.quiz ? (
                                <div className="p-2 bg-green-50 rounded text-xs">
                                  <p className="font-medium">
                                    {module.quiz.title}
                                  </p>
                                  <p className="text-gray-600">
                                    {module.quiz.questions} questions -{" "}
                                    {module.quiz.points} points
                                  </p>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCreateQuiz(module)}
                                  className="w-full text-xs"
                                >
                                  Create Quiz
                                </Button>
                              )}
                            </div>

                            {/* Module Info */}
                            <div className="space-y-2">
                              <h5 className="font-medium text-sm text-gray-600">
                                Module Info
                              </h5>
                              <div className="text-xs text-gray-500 space-y-1">
                                <p>Subject: {courseData.subject}</p>
                                <p>Level: {courseData.academicLevel}</p>
                                <p>
                                  Study Time:{" "}
                                  {module.estimatedStudyTime || "3-4 hours"}
                                </p>
                                {module.hasUnits && (
                                  <p className="text-purple-600 font-medium">
                                    ✓ Unit-based structure
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {courseData.modules.length > 0 && (
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Upload
                  </Button>

                  <div className="space-x-2">
                    <Button
                      onClick={handleSaveDraft}
                      variant="outline"
                      disabled={loading}
                    >
                      Save Draft
                    </Button>
                    <Button
                      onClick={handlePublishCourse}
                      disabled={loading}
                      className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      Publish Course
                    </Button>
                  </div>
                </div>
              )}

              {/* New Course Button */}
              <div className="flex justify-center pt-6 border-t">
                <Button onClick={resetForm} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Course
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
