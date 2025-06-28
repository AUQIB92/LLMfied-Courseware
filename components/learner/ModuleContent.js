"use client"

import React from "react"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
} from "lucide-react"
import QuizModal from "./QuizModal"

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
}

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
}

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
}

const pulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Number.POSITIVE_INFINITY,
      ease: "easeInOut",
    },
  },
}

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
}

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
}

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
}

// Custom hooks
const useProgressAnimation = (progress) => {
  const [animatedProgress, setAnimatedProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress)
    }, 500)

    return () => clearTimeout(timer)
  }, [progress])

  return animatedProgress
}

const useInViewAnimation = () => {
  const ref = React.useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return { ref, isInView }
}

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
      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
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
)

// Enhanced Badge Component
const EnhancedBadge = ({ children, variant = "default", className = "", ...props }) => (
  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
    <Badge variant={variant} className={`backdrop-blur-sm shadow-lg border-0 ${className}`} {...props}>
      {children}
    </Badge>
  </motion.div>
)

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
)

// Enhanced Code Editor Component
const CodeEditor = ({ value, onChange, language, readOnly = false, theme = 'light', fontSize = 14 }) => {
  const editorRef = useRef(null)
  
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
          <span className="text-sm font-medium">{language}.{language === 'javascript' ? 'js' : language === 'python' ? 'py' : 'java'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs text-gray-300 border-gray-600">
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
          theme === 'dark' 
            ? 'bg-gray-900 text-green-400' 
            : 'bg-white text-gray-800'
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
            onClick={() => setFontSize(prev => Math.min(prev + 1, 20))}
            className="w-8 h-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            +
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFontSize(prev => Math.max(prev - 1, 10))}
            className="w-8 h-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            -
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}

// Programming Challenge Card Component
const ProgrammingChallengeCard = ({ challenge, isActive, onClick, challengeProgress }) => {
  const isCompleted = challengeProgress[challenge.id] === 100
  
  return (
    <motion.div
      className={`cursor-pointer transition-all duration-300 ${
        isActive 
          ? 'ring-2 ring-blue-500 ring-offset-2' 
          : 'hover:shadow-lg'
      }`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <GlassCard className={`h-full ${
        isActive 
          ? 'bg-gradient-to-br from-blue-50/90 to-indigo-50/90 border-blue-300/50' 
          : isCompleted
            ? 'bg-gradient-to-br from-green-50/90 to-emerald-50/90 border-green-300/50'
            : 'bg-white/70 border-gray-200/50'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <motion.div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isActive 
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                }`}
                whileHover={{ scale: 1.1 }}
              >
                {isCompleted ? <CheckCircle className="h-4 w-4" /> : challenge.id.split('-')[1]}
              </motion.div>
              <div>
                <h4 className="font-semibold text-sm text-gray-800">{challenge.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <EnhancedBadge 
                    className={`text-xs ${
                      challenge.difficulty === 'beginner' 
                        ? 'bg-green-100 text-green-700'
                        : challenge.difficulty === 'intermediate'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {challenge.difficulty}
                  </EnhancedBadge>
                  <span className="text-xs text-gray-500">{challenge.estimatedTime}</span>
                </div>
              </div>
            </div>
            {isCompleted && (
              <Trophy className="h-5 w-5 text-yellow-500" />
            )}
          </div>
          
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{challenge.description}</p>
          
          {challenge.concepts && (
            <div className="flex flex-wrap gap-1">
              {challenge.concepts.slice(0, 3).map((concept, index) => (
                <EnhancedBadge key={`challenge-concept-${index}-${concept}`} variant="outline" className="text-xs">
                  {concept}
                </EnhancedBadge>
              ))}
              {challenge.concepts.length > 3 && (
                <span className="text-xs text-gray-500">+{challenge.concepts.length - 3} more</span>
              )}
            </div>
          )}
        </CardContent>
      </GlassCard>
    </motion.div>
  )
}

export default function ModuleContent({ module, course, onProgressUpdate, moduleProgress }) {
  const [startTime, setStartTime] = useState(Date.now())
  const [showQuiz, setShowQuiz] = useState(false)
  const [simplifiedExplanations, setSimplifiedExplanations] = useState({})
  const [loadingExplanation, setLoadingExplanation] = useState({})
  const [activeVisualizer, setActiveVisualizer] = useState(null)
  const [visualizerData, setVisualizerData] = useState({})
  const [contentSubsections, setContentSubsections] = useState([])
  const [loadingSubsections, setLoadingSubsections] = useState(false)
  const [objectiveMappings, setObjectiveMappings] = useState({})
  const [loadingMappings, setLoadingMappings] = useState(false)
  const [codeSimulators, setCodeSimulators] = useState({})
  const [loadingSimulator, setLoadingSimulator] = useState({})
  const [activeSimulator, setActiveSimulator] = useState(null)
  const [expandedSubsections, setExpandedSubsections] = useState({})
  const [readingProgress, setReadingProgress] = useState(0)
  const [isBookmarked, setIsBookmarked] = useState(false)
  
  // Programming Practice Section State
  const [programmingChallenges, setProgrammingChallenges] = useState([])
  const [activeProgrammingChallenge, setActiveProgrammingChallenge] = useState(null)
  const [userCode, setUserCode] = useState("")
  const [codeOutput, setCodeOutput] = useState("")
  const [isRunningCode, setIsRunningCode] = useState(false)
  const [codeErrors, setCodeErrors] = useState("")
  const [testResults, setTestResults] = useState([])
  const [challengeScore, setChallengeScore] = useState(0)
  const [loadingChallenges, setLoadingChallenges] = useState(false)
  const [programmingLanguage, setProgrammingLanguage] = useState("javascript")
  const [savedCodes, setSavedCodes] = useState({})
  const [showHints, setShowHints] = useState(false)
  const [challengeProgress, setChallengeProgress] = useState({})
  const [showSolution, setShowSolution] = useState({})
  
  // IDE Features
  const [codeTheme, setCodeTheme] = useState("dark")
  const [fontSize, setFontSize] = useState(14)
  const [autoComplete, setAutoComplete] = useState(true)
  const [livePreview, setLivePreview] = useState(false)
  
  const { getAuthHeaders } = useAuth()
  const codeEditorRef = useRef(null)

  // Calculate reading progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = (scrollTop / docHeight) * 100
      setReadingProgress(Math.min(progress, 100))
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Animated progress value
  const animatedProgress = useProgressAnimation(readingProgress)

  // Helper function to extract JSON from AI responses
  const extractJsonFromResponse = useCallback((responseText) => {
    try {
      // First try direct parsing
      return JSON.parse(responseText)
    } catch (directParseError) {
      console.warn("Direct JSON parse failed, trying to extract JSON from response:", directParseError.message)
      
      try {
        // Try to find JSON in code blocks
        const jsonMatch =
          responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
          responseText.match(/```\s*([\s\S]*?)\s*```/) ||
          responseText.match(/\{[\s\S]*\}/)

        if (jsonMatch) {
          let jsonString = jsonMatch[1] || jsonMatch[0]
          
          // Clean up common JSON issues
          jsonString = jsonString
            .trim()
            .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
            .replace(/([{\[,]\s*)([\w-]+)(\s*:)/g, '$1"$2"$3') // Quote unquoted keys
            .replace(/:\s*([^",{\[\]}\s][^",{\[\]}\n]*?)(\s*[,}\]])/g, ': "$1"$2') // Quote unquoted string values
            .replace(/"\s*([^"]*?)\s*"/g, '"$1"') // Trim quoted strings
          
          console.log("Cleaned JSON string:", jsonString.substring(0, 200) + "...")
          
          return JSON.parse(jsonString)
        }

        throw new Error("No valid JSON pattern found in response")
      } catch (extractError) {
        console.error("JSON extraction failed:", extractError.message)
        console.error("Response text:", responseText.substring(0, 500) + "...")
        
        // Return a safe fallback structure
        return { error: "Failed to parse AI response", originalError: extractError.message }
      }
    }
  }, [])

  useEffect(() => {
    setStartTime(Date.now())
    if (module.content) {
      if (module.detailedSubsections && module.detailedSubsections.length > 0) {
        setContentSubsections(module.detailedSubsections)
      } else {
        generateContentSubsections()
      }
      generateObjectiveMappings()
    }
    return () => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000 / 60)
      if (timeSpent > 0) {
        onProgressUpdate(module.id, moduleProgress.completed, timeSpent)
      }
    }
  }, [module.id])

  // Extract important topics from module content
  const extractImportantTopics = useCallback((content) => {
    if (!content) return []

    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 20)
    const topics = []

    sentences.forEach((sentence, index) => {
      const trimmed = sentence.trim()
      if (trimmed.match(/\b(is|are|means|refers to|defined as|known as|called|represents)\b/i)) {
        const words = trimmed.split(" ")
        if (words.length > 5) {
          const topicName = words
            .slice(
              0,
              Math.min(
                5,
                words.indexOf(
                  words.find((w) => w.match(/\b(is|are|means|refers to|defined as|known as|called|represents)\b/i)),
                ),
              ),
            )
            .join(" ")

          if (topicName && topicName.length > 3) {
            topics.push({
              id: `topic-${index}`,
              name: topicName,
              content: trimmed,
              canVisualize: detectVisualizableContent(trimmed),
            })
          }
        }
      }
    })

    return topics.slice(0, 6)
  }, [])

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
    ]

    return visualKeywords.some((keyword) => content.toLowerCase().includes(keyword.toLowerCase()))
  }, [])

  // Generate simplified explanation using AI
  const generateSimplifiedExplanation = async (topic) => {
    setLoadingExplanation((prev) => ({ ...prev, [topic.id]: true }))

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Please provide a simplified, easy-to-understand explanation of this topic for a beginner. Use simple language, analogies, and real-world examples. Keep it under 150 words.

Topic: ${topic.name}
Original Content: ${topic.content}

Please structure your response as:
1. Simple Definition (1-2 sentences)
2. Easy Analogy (compare to something familiar)
3. Real-world Example
4. Why it matters (practical importance)`,
          courseId: course._id,
          moduleId: module.id,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSimplifiedExplanations((prev) => ({
          ...prev,
          [topic.id]: data.response,
        }))
      } else {
        throw new Error("Failed to generate explanation")
      }
    } catch (error) {
      console.error("Error generating simplified explanation:", error)
      setSimplifiedExplanations((prev) => ({
        ...prev,
        [topic.id]: "Sorry, I couldn't generate a simplified explanation at this time. Please try again later.",
      }))
    } finally {
      setLoadingExplanation((prev) => ({ ...prev, [topic.id]: false }))
    }
  }

  // Generate content subsections
  const generateContentSubsections = async () => {
    if (!module.content) return

    setLoadingSubsections(true)
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Analyze this module content and break it into logical subsections with beautiful explanations. Each subsection should:

1. Have a clear, descriptive title
2. Include simplified explanation with analogies
3. Show practical examples
4. Identify if it needs code simulation/visualization
5. Map to learning objectives if applicable

Module Content: ${module.content}
Learning Objectives: ${module.objectives ? module.objectives.join(", ") : "Not specified"}

Return a JSON array of subsections in this format:
[
  {
    "id": "subsection-1",
    "title": "Clear Subsection Title",
    "keyTerms": ["term1", "term2"],
    "explanation": "Beautiful, simplified explanation with analogies",
    "practicalExample": "Real-world example that demonstrates the concept",
    "needsCodeSimulation": true/false,
    "simulationType": "algorithm|data-structure|mathematical|visual|interactive",
    "relatedObjectives": [0, 1],
    "complexity": "beginner|intermediate|advanced",
    "estimatedTime": "5-10 minutes"
  }
]

Make explanations engaging and easy to understand.`,
          courseId: course._id,
          moduleId: module.id,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        try {
          const subsections = extractJsonFromResponse(data.response)
          
          // Validate the response structure
          if (Array.isArray(subsections)) {
            setContentSubsections(subsections)
          } else if (subsections && subsections.error) {
            console.error("AI response parsing failed:", subsections.originalError)
            // Create fallback subsection
            setContentSubsections([
              {
                id: "main-content",
                title: "Main Content",
                keyTerms: [],
                explanation: module.content || "Content temporarily unavailable",
                practicalExample: "Examples will be provided in the next update",
                needsCodeSimulation: false,
                simulationType: "visual",
                relatedObjectives: [0],
                complexity: "beginner",
                estimatedTime: "10-15 minutes"
              },
            ])
          } else {
            throw new Error("Invalid subsections structure")
          }
        } catch (parseError) {
          console.error("Error parsing subsections:", parseError)
          setContentSubsections([
            {
              id: "main-content",
              title: "Main Content",
              keyTerms: [],
              explanation: module.content || "Content available but processing failed",
              practicalExample: "Please reload to try again",
              needsCodeSimulation: false,
              simulationType: "visual",
              relatedObjectives: [0],
              complexity: "beginner",
              estimatedTime: "10-15 minutes"
            },
          ])
        }
      } else {
        console.error("Failed to generate subsections:", response.statusText)
        setContentSubsections([
          {
            id: "main-content",
            title: "Main Content",
            keyTerms: [],
            explanation: module.content || "Content temporarily unavailable",
            practicalExample: "Network error - please try again",
            needsCodeSimulation: false,
            simulationType: "visual",
            relatedObjectives: [0],
            complexity: "beginner",
            estimatedTime: "10-15 minutes"
          },
        ])
      }
    } catch (error) {
      console.error("Error generating subsections:", error)
    } finally {
      setLoadingSubsections(false)
    }
  }

  // Generate objective mappings
  const generateObjectiveMappings = async () => {
    if (!module.objectives || module.objectives.length === 0) return

    setLoadingMappings(true)
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Map the module content to specific learning objectives and provide detailed explanations for how each objective is achieved.

Learning Objectives:
${module.objectives.map((obj, index) => `${index + 1}. ${obj}`).join("\n")}

Module Content: ${module.content}

For each objective, provide:
1. How it's addressed in the content
2. Key concepts that support this objective
3. Practical applications
4. Assessment criteria

Return JSON in this format:
{
  "mappings": [
    {
      "objectiveIndex": 0,
      "objective": "The learning objective text",
      "howAddressed": "Detailed explanation of how content addresses this",
      "keyConcepts": ["concept1", "concept2"],
      "practicalApplications": ["application1", "application2"],
      "assessmentCriteria": "How to measure if objective is met"
    }
  ]
}`,
          courseId: course._id,
          moduleId: module.id,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        try {
          const mappings = extractJsonFromResponse(data.response)
          
          // Validate the structure
          if (mappings && mappings.mappings && Array.isArray(mappings.mappings)) {
            setObjectiveMappings(mappings)
          } else if (mappings && mappings.error) {
            console.error("AI response parsing failed:", mappings.originalError)
            // Create fallback mappings
            const fallbackMappings = {
              mappings: module.objectives.map((obj, index) => ({
                objectiveIndex: index,
                objective: obj,
                howAddressed: "Content analysis temporarily unavailable",
                keyConcepts: ["General concepts"],
                practicalApplications: ["To be determined"],
                assessmentCriteria: "Understanding of core concepts"
              }))
            }
            setObjectiveMappings(fallbackMappings)
          } else {
            throw new Error("Invalid response structure")
          }
        } catch (parseError) {
          console.error("Error parsing objective mappings:", parseError)
          
          // Create simple fallback mappings
          const fallbackMappings = {
            mappings: module.objectives.map((obj, index) => ({
              objectiveIndex: index,
              objective: obj,
              howAddressed: "Content addresses this objective through practical examples and explanations",
              keyConcepts: ["Core concepts"],
              practicalApplications: ["Real-world applications"],
              assessmentCriteria: "Student demonstrates understanding"
            }))
          }
          setObjectiveMappings(fallbackMappings)
        }
      } else {
        console.error("Failed to generate objective mappings:", response.statusText)
        // Create fallback mappings for network errors
        const fallbackMappings = {
          mappings: module.objectives.map((obj, index) => ({
            objectiveIndex: index,
            objective: obj,
            howAddressed: "Mapping temporarily unavailable",
            keyConcepts: ["Please retry"],
            practicalApplications: ["Content analysis pending"],
            assessmentCriteria: "Standard assessment criteria"
          }))
        }
        setObjectiveMappings(fallbackMappings)
      }
    } catch (error) {
      console.error("Error generating objective mappings:", error)
    } finally {
      setLoadingMappings(false)
    }
  }

  // Programming Practice Functions
  const generateProgrammingChallenges = async () => {
    setLoadingChallenges(true)
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
Objectives: ${module.objectives ? module.objectives.join(", ") : "Not specified"}

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
      })

      if (response.ok) {
        const data = await response.json()
        try {
          const challenges = extractJsonFromResponse(data.response)
          
          // Validate the structure
          if (challenges && challenges.challenges && Array.isArray(challenges.challenges)) {
            setProgrammingChallenges(challenges.challenges)
            if (challenges.challenges.length > 0) {
              setSelectedChallenge(challenges.challenges[0])
              setActiveProgrammingChallenge(challenges.challenges[0])
              setUserCode(challenges.challenges[0].starterCode[programmingLanguage] || "")
            }
          } else if (challenges && challenges.error) {
            console.error("AI response parsing failed:", challenges.originalError)
            setProgrammingChallenges([])
          } else {
            throw new Error("Invalid challenges structure")
          }
        } catch (parseError) {
          console.error("Error parsing programming challenges:", parseError)
          setProgrammingChallenges([])
        }
      } else {
        console.error("Failed to generate programming challenges:", response.statusText)
        setProgrammingChallenges([])
      }
    } catch (error) {
      console.error("Error generating programming challenges:", error)
    } finally {
      setLoadingChallenges(false)
    }
  }

  const runCode = async () => {
    if (!userCode.trim()) return

    setIsRunningCode(true)
    setCodeErrors("")
    setCodeOutput("")
    setTestResults([])

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

${activeProgrammingChallenge ? `
This code is for challenge: ${activeProgrammingChallenge.title}
Test cases: ${JSON.stringify(activeProgrammingChallenge.testCases)}
` : ""}

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
      })

      if (response.ok) {
        const data = await response.json()
        try {
          const result = extractJsonFromResponse(data.response)
          
          // Validate the structure
          if (result && !result.error) {
            setCodeOutput(result.output || "Code executed successfully")
            setCodeErrors(result.errors || "")
            setTestResults(result.testResults || [])
            
            if (result.testResults && Array.isArray(result.testResults)) {
              const passedTests = result.testResults.filter(test => test.passed).length
              const totalTests = result.testResults.length
              const score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
              setChallengeScore(score)
            }
          } else if (result && result.error) {
            console.error("AI response parsing failed:", result.originalError)
            setCodeErrors("Code analysis temporarily unavailable. Please try again.")
            setCodeOutput("")
          } else {
            throw new Error("Invalid code execution result structure")
          }
        } catch (parseError) {
          console.error("Error parsing code execution result:", parseError)
          setCodeErrors("Error analyzing code execution. Please check your syntax and try again.")
          setCodeOutput("")
        }
      } else {
        console.error("Failed to run code analysis:", response.statusText)
        setCodeErrors("Network error. Please check your connection and try again.")
        setCodeOutput("")
      }
    } catch (error) {
      setCodeErrors("Error running code: " + error.message)
    } finally {
      setIsRunningCode(false)
    }
  }

  const resetCode = () => {
    if (activeProgrammingChallenge) {
      setUserCode(activeProgrammingChallenge.starterCode[programmingLanguage] || "")
      setCodeOutput("")
      setCodeErrors("")
      setTestResults([])
      setChallengeScore(0)
    }
  }

  const saveCode = () => {
    if (activeProgrammingChallenge) {
      setSavedCodes(prev => ({
        ...prev,
        [activeProgrammingChallenge.id]: {
          code: userCode,
          timestamp: new Date().toISOString(),
          language: programmingLanguage
        }
      }))
    }
  }

  const loadSavedCode = () => {
    if (activeProgrammingChallenge && savedCodes[activeProgrammingChallenge.id]) {
      setUserCode(savedCodes[activeProgrammingChallenge.id].code)
    }
  }

  const switchProgrammingLanguage = (language) => {
    setProgrammingLanguage(language)
    if (activeProgrammingChallenge) {
      setUserCode(activeProgrammingChallenge.starterCode[language] || "")
      setCodeOutput("")
      setCodeErrors("")
      setTestResults([])
    }
  }

  const selectChallenge = (challenge) => {
    setActiveProgrammingChallenge(challenge)
    setUserCode(challenge.starterCode[programmingLanguage] || "")
    setCodeOutput("")
    setCodeErrors("")
    setTestResults([])
    setChallengeScore(0)
    setShowHints(false)
  }

  const toggleSolution = (challengeId) => {
    setShowSolution(prev => ({
      ...prev,
      [challengeId]: !prev[challengeId]
    }))
  }

  const handleMarkComplete = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000 / 60)
    onProgressUpdate(module.id, true, timeSpent)
  }

  const toggleSubsection = (subsectionId) => {
    setExpandedSubsections((prev) => ({
      ...prev,
      [subsectionId]: !prev[subsectionId],
    }))
  }

  // Memoized resource handling
  const { legacyResources, aiResources } = useMemo(() => {
    const legacy = Array.isArray(module.resources) ? module.resources : []
    const ai =
      module.resources && typeof module.resources === "object" && !Array.isArray(module.resources)
        ? {
            books: Array.isArray(module.resources.books) ? module.resources.books : [],
            courses: Array.isArray(module.resources.courses) ? module.resources.courses : [],
            articles: Array.isArray(module.resources.articles) ? module.resources.articles : [],
            videos: Array.isArray(module.resources.videos) ? module.resources.videos : [],
            tools: Array.isArray(module.resources.tools) ? module.resources.tools : [],
            websites: Array.isArray(module.resources.websites) ? module.resources.websites : [],
            exercises: Array.isArray(module.resources.exercises) ? module.resources.exercises : [],
          }
        : {
            books: [],
            courses: [],
            articles: [],
            videos: [],
            tools: [],
            websites: [],
            exercises: [],
          }

    return { legacyResources: legacy, aiResources: ai }
  }, [module.resources])

  // Enhanced Resource Card Component
  const ResourceCard = ({ resource, type }) => {
    const getIcon = () => {
      const iconMap = {
        books: <BookOpen className="h-5 w-5 text-blue-600" />,
        courses: <Video className="h-5 w-5 text-purple-600" />,
        videos: <Play className="h-5 w-5 text-red-600" />,
        articles: <FileText className="h-5 w-5 text-green-600" />,
        tools: <Wrench className="h-5 w-5 text-orange-600" />,
        websites: <Globe className="h-5 w-5 text-indigo-600" />,
        exercises: <Target className="h-5 w-5 text-pink-600" />,
      }
      return iconMap[type] || <ExternalLink className="h-4 w-4" />
    }

    const getGradient = () => {
      const gradientMap = {
        books: "from-blue-400/20 via-blue-500/10 to-blue-600/20",
        courses: "from-purple-400/20 via-purple-500/10 to-purple-600/20",
        videos: "from-red-400/20 via-red-500/10 to-red-600/20",
        articles: "from-green-400/20 via-green-500/10 to-green-600/20",
        tools: "from-orange-400/20 via-orange-500/10 to-orange-600/20",
        websites: "from-indigo-400/20 via-indigo-500/10 to-indigo-600/20",
        exercises: "from-pink-400/20 via-pink-500/10 to-pink-600/20",
      }
      return gradientMap[type] || "from-gray-400/20 via-gray-500/10 to-gray-600/20"
    }

    return (
      <motion.div variants={cardVariants} whileHover="hover" className="group">
        <GlassCard className={`h-full bg-gradient-to-br ${getGradient()} border-white/30`}>
          <CardContent className="p-6 h-full flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-1">
                <motion.div
                  className="p-3 rounded-2xl bg-white/90 shadow-lg backdrop-blur-sm"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  {getIcon()}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-lg text-gray-800 group-hover:text-gray-900 transition-colors leading-tight line-clamp-2">
                    {resource.title || resource.name}
                  </h4>
                  {resource.creator && <p className="text-sm text-gray-600 mt-1 font-medium">by {resource.creator}</p>}
                </div>
              </div>
            </div>

            {resource.description && (
              <div className="mb-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 flex-1">
                <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">{resource.description}</p>
              </div>
            )}

            <div className="space-y-3 mt-auto">
              {resource.difficulty && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Difficulty:</span>
                  <EnhancedBadge
                    variant="secondary"
                    className={`${
                      resource.difficulty === "Beginner"
                        ? "bg-green-100 text-green-800 border-green-200"
                        : resource.difficulty === "Intermediate"
                          ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                          : "bg-red-100 text-red-800 border-red-200"
                    }`}
                  >
                    {resource.difficulty}
                  </EnhancedBadge>
                </div>
              )}

              {resource.url && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    asChild
                  >
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Resource
                    </a>
                  </Button>
                </motion.div>
              )}
            </div>
          </CardContent>
        </GlassCard>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Reading Progress Bar with enhanced design */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-50 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 origin-left shadow-lg"
        style={{ scaleX: animatedProgress / 100 }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: animatedProgress / 100 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="absolute right-0 top-0 h-full w-8 bg-gradient-to-r from-transparent to-white/50 blur-sm"
          animate={{ x: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        />
      </motion.div>

      {/* Floating Quick Actions */}
      <motion.div
        className="fixed bottom-8 right-8 z-40 flex flex-col gap-3"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
      >
        {/* Quick Quiz Button */}
        <motion.button
          onClick={() => setShowQuiz(true)}
          className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:shadow-3xl transition-all duration-300"
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          variants={floatingVariants}
          animate="floating"
        >
          <TestTube className="h-6 w-6" />
        </motion.button>

        {/* Bookmark Button */}
        <motion.button
          onClick={() => setIsBookmarked(!isBookmarked)}
          className={`w-12 h-12 ${
            isBookmarked 
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
              : 'bg-gradient-to-r from-gray-400 to-gray-500'
          } rounded-full shadow-xl flex items-center justify-center text-white transition-all duration-300`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          variants={isBookmarked ? sparkleVariants : {}}
          animate={isBookmarked ? "sparkle" : ""}
        >
          <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
        </motion.button>

        {/* Progress Indicator */}
        <motion.div
          className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-xl flex items-center justify-center text-white text-xs font-bold relative overflow-hidden"
          whileHover={{ scale: 1.1 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            style={{ scaleY: animatedProgress / 100 }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: animatedProgress / 100 }}
            transition={{ duration: 0.3 }}
          />
          <span className="relative z-10">{Math.round(animatedProgress)}%</span>
        </motion.div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Enhanced Hero Section with Dynamic Background */}
        <motion.div key="hero-section" variants={itemVariants}>
          <GlassCard className="overflow-hidden bg-gradient-to-br from-blue-600/90 via-purple-600/90 to-indigo-600/90 text-white border-white/20 relative">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full blur-3xl"
                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              />
              <motion.div
                className="absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
                animate={{ rotate: -360, scale: [1.2, 1, 1.2] }}
                transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              />
              <motion.div
                className="absolute top-1/2 left-1/2 w-32 h-32 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-2xl"
                animate={{ 
                  x: [-50, 50, -50],
                  y: [-25, 25, -25],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              />
            </div>

            <CardHeader className="relative z-10">
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
                      className="text-5xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent leading-tight"
                      style={{ backgroundSize: "200% 200%" }}
                      variants={gradientTextVariants}
                      animate="animate"
                    >
                      {module.title}
                    </motion.h1>
                    {module.summary && (
                      <CardDescription className="text-blue-100 text-xl leading-relaxed max-w-4xl">
                        {module.summary}
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
                      {module.beautifulSummaryElements.difficultyLevel && (
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
                            <span className="text-sm font-medium block">Difficulty</span>
                            <span className="text-lg font-bold">{module.beautifulSummaryElements.difficultyLevel}</span>
                          </div>
                        </motion.div>
                      )}
                      {module.beautifulSummaryElements.estimatedStudyTime && (
                        <motion.div
                          className="group flex items-center gap-4 bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/30 hover:bg-white/30 transition-all duration-300"
                          whileHover={{ scale: 1.05, y: -5 }}
                          variants={floatingVariants}
                          animate="floating"
                        >
                          <Clock className="h-6 w-6 text-blue-200" />
                          <div>
                            <span className="text-sm font-medium block">Study Time</span>
                            <span className="text-lg font-bold">{module.beautifulSummaryElements.estimatedStudyTime}</span>
                          </div>
                        </motion.div>
                      )}
                      <motion.div
                        className="group flex items-center gap-4 bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/30 hover:bg-white/30 transition-all duration-300"
                        whileHover={{ scale: 1.05, y: -5 }}
                        variants={floatingVariants}
                        animate="floating"
                      >
                        <motion.div variants={sparkleVariants} animate="sparkle">
                          <Sparkles className="h-6 w-6 text-purple-200" />
                        </motion.div>
                        <div>
                          <span className="text-sm font-medium block">Content Type</span>
                          <span className="text-lg font-bold">Interactive</span>
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
                      transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                    >
                      <EnhancedBadge className="flex items-center gap-3 bg-green-500/90 hover:bg-green-600/90 text-white border-green-400/50 px-6 py-3 text-lg">
                        <motion.div variants={sparkleVariants} animate="sparkle">
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
          </GlassCard>
        </motion.div>

        {/* Learning Objectives */}
        {module.objectives && module.objectives.length > 0 && (
          <motion.div key={`learning-objectives-${module.id}`} variants={itemVariants}>
            <GlassCard className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border-blue-200/50">
              <CardContent className="p-8">
                <motion.h3
                  className="font-bold text-2xl mb-6 flex items-center gap-3 text-blue-800"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div
                    className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <Target className="h-6 w-6 text-white" />
                  </motion.div>
                  Learning Objectives
                  <motion.div
                    className="ml-auto text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                  >
                    {module.objectives.length} objectives
                  </motion.div>
                </motion.h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {module.objectives.map((objective, index) => (
                    <motion.div
                      key={`objective-${index}-${objective.substring(0, 30)}`}
                      className="group"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-start gap-4 p-6 bg-white/70 backdrop-blur-sm rounded-xl border border-blue-100 shadow-sm hover:shadow-lg transition-all duration-300 group-hover:border-blue-200">
                        <motion.div
                          className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-lg"
                          whileHover={{ scale: 1.1, rotate: 360 }}
                          transition={{ duration: 0.3 }}
                        >
                          {index + 1}
                        </motion.div>
                        <div className="flex-1">
                          <p className="text-gray-800 leading-relaxed group-hover:text-gray-900 transition-colors">
                            {objective}
                          </p>
                          <motion.div
                            className="mt-2 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full origin-left"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 0.3 + 0.1 * index, duration: 0.5 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </GlassCard>
          </motion.div>
        )}

        {/* Enhanced Module Content with Integrated Explanations */}
        {module.content && (
          <motion.div key={`module-content-${module.id}`} variants={itemVariants}>
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

                {/* Main Content Display - Syllabus content removed */}
                {/* Original syllabus/PDF content display removed as requested */}

                {/* Detailed Explanations & Simulators Section */}
                <div className="border-t border-gray-200 pt-8">
                  <motion.h4
                    className="font-bold text-xl mb-6 flex items-center gap-3 text-cyan-800"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <motion.div
                      className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <Layers className="h-5 w-5 text-white" />
                    </motion.div>
                    Detailed Explanations & Interactive Elements
                  </motion.h4>

                  <AnimatePresence mode="wait">
                    {loadingSubsections ? (
                      <EnhancedLoader key="loading-subsections" text="Generating beautiful explanations..." />
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
                            <GlassCard className="bg-white/70 border-cyan-200/50 overflow-hidden">
                              <motion.div
                                className="p-6 cursor-pointer hover:bg-cyan-50/50 transition-colors"
                                onClick={() => toggleSubsection(subsection.id)}
                                whileHover={{ backgroundColor: "rgba(6, 182, 212, 0.05)" }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4 flex-1">
                                    <motion.div
                                      className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                                      whileHover={{ scale: 1.1, rotate: 360 }}
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
                                              subsection.complexity === "beginner"
                                                ? "border-green-300 text-green-700 bg-green-50"
                                                : subsection.complexity === "intermediate"
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
                                    animate={{ rotate: expandedSubsections[subsection.id] ? 90 : 0 }}
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
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="overflow-hidden"
                                  >
                                    <div className="px-6 pb-6 border-t border-cyan-100 bg-gradient-to-r from-cyan-25 to-blue-25">
                                      <div className="pt-6 space-y-4">
                                        {/* Key Terms */}
                                        {subsection.keyTerms && subsection.keyTerms.length > 0 && (
                                          <div>
                                            <h5 className="font-medium text-cyan-800 text-sm mb-3 flex items-center gap-2">
                                              <Atom className="h-4 w-4" />
                                              Key Terms
                                            </h5>
                                            <div className="flex flex-wrap gap-2">
                                              {subsection.keyTerms.map((term, termIndex) => (
                                                <motion.div
                                                  key={`term-${termIndex}-${term}`}
                                                  initial={{ opacity: 0, scale: 0.8 }}
                                                  animate={{ opacity: 1, scale: 1 }}
                                                  transition={{ delay: 0.1 * termIndex }}
                                                >
                                                  <EnhancedBadge className="bg-cyan-100 text-cyan-800 hover:bg-cyan-200 border-cyan-200">
                                                    {term}
                                                  </EnhancedBadge>
                                                </motion.div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Explanation */}
                                        <motion.div
                                          className="p-6 bg-white/80 backdrop-blur-sm rounded-xl border border-cyan-100 shadow-sm"
                                          initial={{ opacity: 0, y: 10 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ delay: 0.2 }}
                                        >
                                          <h5 className="font-medium text-cyan-800 text-sm mb-3 flex items-center gap-2">
                                            <Lightbulb className="h-4 w-4" />
                                            Explanation
                                          </h5>
                                          <p className="text-cyan-700 leading-relaxed">{subsection.explanation}</p>
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
                                            <p className="text-yellow-700 leading-relaxed">
                                              {subsection.practicalExample}
                                            </p>
                                          </motion.div>
                                        )}

                                        {/* Action Buttons */}
                                        <motion.div
                                          className="flex flex-wrap gap-3 pt-4"
                                          initial={{ opacity: 0, y: 10 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ delay: 0.4 }}
                                        >
                                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                            <Button
                                              onClick={() =>
                                                generateSimplifiedExplanation({
                                                  id: subsection.id,
                                                  name: subsection.title,
                                                  content: subsection.explanation,
                                                })
                                              }
                                              disabled={loadingExplanation[subsection.id]}
                                              size="sm"
                                              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                                            >
                                              {loadingExplanation[subsection.id] ? (
                                                <>
                                                  <motion.div
                                                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                                    animate={{ rotate: 360 }}
                                                    transition={{
                                                      duration: 1,
                                                      repeat: Number.POSITIVE_INFINITY,
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
                                        </motion.div>

                                        {/* Enhanced Explanation Display */}
                                        <AnimatePresence>
                                          {simplifiedExplanations[subsection.id] && (
                                            <motion.div
                                              key={`explanation-${subsection.id}`}
                                              className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 shadow-sm"
                                              initial={{ opacity: 0, height: 0 }}
                                              animate={{ opacity: 1, height: "auto" }}
                                              exit={{ opacity: 0, height: 0 }}
                                              transition={{ duration: 0.3 }}
                                            >
                                              <h5 className="font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                                                <Zap className="h-4 w-4" />
                                                Enhanced Explanation
                                              </h5>
                                              <div className="prose prose-sm max-w-none">
                                                <div className="text-emerald-700 leading-relaxed whitespace-pre-wrap">
                                                  {simplifiedExplanations[subsection.id]}
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
                      <motion.div className="text-center py-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            onClick={generateContentSubsections}
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                          >
                            <Layers className="h-4 w-4 mr-2" />
                            Generate Detailed Explanations
                          </Button>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </GlassCard>
          </motion.div>
        )}

        {/* Complete Learning Resources Section */}
        {(
          (legacyResources && legacyResources.length > 0) ||
          (aiResources.books && aiResources.books.length > 0) ||
          (aiResources.courses && aiResources.courses.length > 0) ||
          (aiResources.videos && aiResources.videos.length > 0) ||
          (aiResources.articles && aiResources.articles.length > 0) ||
          (aiResources.tools && aiResources.tools.length > 0) ||
          (aiResources.websites && aiResources.websites.length > 0) ||
          (aiResources.exercises && aiResources.exercises.length > 0)
        ) && (
          <motion.div key={`learning-resources-${module.id}`} variants={itemVariants}>
            <GlassCard className="bg-gradient-to-br from-purple-50/80 to-pink-50/80 border-purple-200/50">
              <CardContent className="p-8">
                <motion.h3
                  className="font-bold text-2xl mb-6 flex items-center gap-3 text-purple-800"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <motion.div
                    className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <BookOpen className="h-6 w-6 text-white" />
                  </motion.div>
                  Complete Learning Resources
                  <EnhancedBadge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1">
                    AI Curated
                  </EnhancedBadge>
                </motion.h3>

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
                                : aiResources.exercises && aiResources.exercises.length > 0
                                  ? "exercises"
                                  : legacyResources && legacyResources.length > 0
                                    ? "legacy"
                                    : "books"
                  }
                  className="w-full"
                >
                  <TabsList className="grid w-full auto-cols-fr grid-flow-col mb-6 bg-white/70 backdrop-blur-sm p-2 rounded-xl border border-purple-200 shadow-sm overflow-x-auto">
                    {/* Legacy Resources Tab */}
                    {legacyResources && legacyResources.length > 0 && (
                      <TabsTrigger
                        value="legacy"
                        className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-500 data-[state=active]:to-gray-600 data-[state=active]:text-white rounded-lg px-4 py-2 transition-all duration-200"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline font-medium">Resources</span>
                        <EnhancedBadge variant="secondary" className="ml-1 bg-gray-100 text-gray-800">
                          {legacyResources.length}
                        </EnhancedBadge>
                      </TabsTrigger>
                    )}

                    {/* Books Tab */}
                    {aiResources.books && aiResources.books.length > 0 && (
                      <TabsTrigger
                        value="books"
                        className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg px-4 py-2 transition-all duration-200"
                      >
                        <BookOpen className="h-4 w-4" />
                        <span className="hidden sm:inline font-medium">Books</span>
                        <EnhancedBadge variant="secondary" className="ml-1 bg-blue-100 text-blue-800">
                          {aiResources.books.length}
                        </EnhancedBadge>
                      </TabsTrigger>
                    )}

                    {/* Courses Tab */}
                    {aiResources.courses && aiResources.courses.length > 0 && (
                      <TabsTrigger
                        value="courses"
                        className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg px-4 py-2 transition-all duration-200"
                      >
                        <Video className="h-5 w-5" />
                        <span className="hidden sm:inline font-medium">Courses</span>
                        <EnhancedBadge variant="secondary" className="ml-1 bg-purple-100 text-purple-800">
                          {aiResources.courses.length}
                        </EnhancedBadge>
                      </TabsTrigger>
                    )}

                    {/* Videos Tab */}
                    {aiResources.videos && aiResources.videos.length > 0 && (
                      <TabsTrigger
                        value="videos"
                        className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white rounded-lg px-4 py-2 transition-all duration-200"
                      >
                        <Play className="h-4 w-4" />
                        <span className="hidden sm:inline">Videos</span>
                        <EnhancedBadge variant="secondary" className="ml-1 bg-red-100 text-red-800">
                          {aiResources.videos.length}
                        </EnhancedBadge>
                      </TabsTrigger>
                    )}

                    {/* Articles Tab */}
                    {aiResources.articles && aiResources.articles.length > 0 && (
                      <TabsTrigger
                        value="articles"
                        className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white rounded-lg px-4 py-2 transition-all duration-200"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">Articles</span>
                        <EnhancedBadge variant="secondary" className="ml-1 bg-green-100 text-green-800">
                          {aiResources.articles.length}
                        </EnhancedBadge>
                      </TabsTrigger>
                    )}

                    {/* Tools Tab */}
                    {aiResources.tools && aiResources.tools.length > 0 && (
                      <TabsTrigger
                        value="tools"
                        className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white rounded-lg px-4 py-2 transition-all duration-200"
                      >
                        <Wrench className="h-4 w-4" />
                        <span className="hidden sm:inline">Tools</span>
                        <EnhancedBadge variant="secondary" className="ml-1 bg-orange-100 text-orange-800">
                          {aiResources.tools.length}
                        </EnhancedBadge>
                      </TabsTrigger>
                    )}

                    {/* Websites Tab */}
                    {aiResources.websites && aiResources.websites.length > 0 && (
                      <TabsTrigger
                        value="websites"
                        className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg px-4 py-2 transition-all duration-200"
                      >
                        <Globe className="h-4 w-4" />
                        <span className="hidden sm:inline">Websites</span>
                        <EnhancedBadge variant="secondary" className="ml-1 bg-indigo-100 text-indigo-800">
                          {aiResources.websites.length}
                        </EnhancedBadge>
                      </TabsTrigger>
                    )}

                    {/* Exercises Tab */}
                    {aiResources.exercises && aiResources.exercises.length > 0 && (
                      <TabsTrigger
                        value="exercises"
                        className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-lg px-4 py-2 transition-all duration-200"
                      >
                        <Target className="h-4 w-4" />
                        <span className="hidden sm:inline">Exercises</span>
                        <EnhancedBadge variant="secondary" className="ml-1 bg-pink-100 text-pink-800">
                          {aiResources.exercises.length}
                        </EnhancedBadge>
                      </TabsTrigger>
                    )}
                  </TabsList>

                  <AnimatePresence mode="wait">
                    {/* Legacy Resources Content */}
                    {legacyResources && legacyResources.length > 0 && (
                      <TabsContent key="legacy" value="legacy">
                        <motion.div
                          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {legacyResources.map((resource, index) => (
                            <motion.div key={`legacy-${index}-${resource.title || resource.name || index}`} variants={itemVariants}>
                              <ResourceCard resource={resource} type="legacy" />
                            </motion.div>
                          ))}
                        </motion.div>
                      </TabsContent>
                    )}

                    {/* Books Content */}
                    {aiResources.books && aiResources.books.length > 0 && (
                      <TabsContent key="books" value="books">
                        <motion.div
                          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {aiResources.books.map((resource, index) => (
                            <motion.div key={`books-${index}-${resource.title || resource.name || index}`} variants={itemVariants}>
                              <ResourceCard resource={resource} type="books" />
                            </motion.div>
                          ))}
                        </motion.div>
                      </TabsContent>
                    )}

                    {/* Courses Content */}
                    {aiResources.courses && aiResources.courses.length > 0 && (
                      <TabsContent key="courses" value="courses">
                        <motion.div
                          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {aiResources.courses.map((resource, index) => (
                            <motion.div key={`courses-${index}-${resource.title || resource.name || index}`} variants={itemVariants}>
                              <ResourceCard resource={resource} type="courses" />
                            </motion.div>
                          ))}
                        </motion.div>
                      </TabsContent>
                    )}

                    {/* Videos Content */}
                    {aiResources.videos && aiResources.videos.length > 0 && (
                      <TabsContent key="videos" value="videos">
                        <motion.div
                          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {aiResources.videos.map((resource, index) => (
                            <motion.div key={`videos-${index}-${resource.title || resource.name || index}`} variants={itemVariants}>
                              <ResourceCard resource={resource} type="videos" />
                            </motion.div>
                          ))}
                        </motion.div>
                      </TabsContent>
                    )}

                    {/* Articles Content */}
                    {aiResources.articles && aiResources.articles.length > 0 && (
                      <TabsContent key="articles" value="articles">
                        <motion.div
                          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {aiResources.articles.map((resource, index) => (
                            <motion.div key={`articles-${index}-${resource.title || resource.name || index}`} variants={itemVariants}>
                              <ResourceCard resource={resource} type="articles" />
                            </motion.div>
                          ))}
                        </motion.div>
                      </TabsContent>
                    )}

                    {/* Tools Content */}
                    {aiResources.tools && aiResources.tools.length > 0 && (
                      <TabsContent key="tools" value="tools">
                        <motion.div
                          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {aiResources.tools.map((resource, index) => (
                            <motion.div key={`tools-${index}-${resource.title || resource.name || index}`} variants={itemVariants}>
                              <ResourceCard resource={resource} type="tools" />
                            </motion.div>
                          ))}
                        </motion.div>
                      </TabsContent>
                    )}

                    {/* Websites Content */}
                    {aiResources.websites && aiResources.websites.length > 0 && (
                      <TabsContent key="websites" value="websites">
                        <motion.div
                          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {aiResources.websites.map((resource, index) => (
                            <motion.div key={`websites-${index}-${resource.title || resource.name || index}`} variants={itemVariants}>
                              <ResourceCard resource={resource} type="websites" />
                            </motion.div>
                          ))}
                        </motion.div>
                      </TabsContent>
                    )}

                    {/* Exercises Content */}
                    {aiResources.exercises && aiResources.exercises.length > 0 && (
                      <TabsContent key="exercises" value="exercises">
                        <motion.div
                          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {aiResources.exercises.map((resource, index) => (
                            <motion.div key={`exercises-${index}-${resource.title || resource.name || index}`} variants={itemVariants}>
                              <ResourceCard resource={resource} type="exercises" />
                            </motion.div>
                          ))}
                        </motion.div>
                      </TabsContent>
                    )}
                  </AnimatePresence>
                </Tabs>
              </CardContent>
            </GlassCard>
          </motion.div>
        )}

        {/* Interactive Programming Practice Section */}
        <motion.div key={`programming-practice-${module.id}`} variants={itemVariants}>
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
                            isActive={activeProgrammingChallenge?.id === challenge.id}
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
                        {/* Challenge Header */}
                        <GlassCard className="bg-gradient-to-r from-emerald-100/70 to-teal-100/70 border-emerald-300/50">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h4 className="font-bold text-xl text-emerald-900 mb-2">
                                  {activeProgrammingChallenge.title}
                                </h4>
                                <p className="text-emerald-700 leading-relaxed mb-4">
                                  {activeProgrammingChallenge.description}
                                </p>
                                
                                <div className="flex items-center gap-3 flex-wrap">
                                  <EnhancedBadge className={`${
                                    activeProgrammingChallenge.difficulty === 'beginner' 
                                      ? 'bg-green-100 text-green-700'
                                      : activeProgrammingChallenge.difficulty === 'intermediate'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-red-100 text-red-700'
                                  }`}>
                                    {activeProgrammingChallenge.difficulty}
                                  </EnhancedBadge>
                                  <EnhancedBadge className="bg-blue-100 text-blue-700">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {activeProgrammingChallenge.estimatedTime}
                                  </EnhancedBadge>
                                  {challengeScore > 0 && (
                                    <EnhancedBadge className="bg-green-100 text-green-700">
                                      <Trophy className="h-3 w-3 mr-1" />
                                      Score: {challengeScore}%
                                    </EnhancedBadge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex gap-2 ml-4">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setShowHints(!showHints)}
                                  className="p-2 rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors"
                                >
                                  <Lightbulb className="h-4 w-4" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => toggleSolution(activeProgrammingChallenge.id)}
                                  className="p-2 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                                >
                                  <Eye className="h-4 w-4" />
                                </motion.button>
                              </div>
                            </div>

                            {/* Concepts */}
                            {activeProgrammingChallenge.concepts && (
                              <div>
                                <h5 className="font-medium text-emerald-800 text-sm mb-2">Concepts:</h5>
                                <div className="flex flex-wrap gap-2">
                                  {activeProgrammingChallenge.concepts.map((concept, index) => (
                                    <EnhancedBadge key={`concept-${index}-${concept}`} variant="outline" className="text-xs border-emerald-300 text-emerald-700">
                                      {concept}
                                    </EnhancedBadge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </GlassCard>

                        {/* Hints Section */}
                        <AnimatePresence>
                          {showHints && activeProgrammingChallenge.hints && (
                            <motion.div
                              key={`hints-${activeProgrammingChallenge.id}`}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <GlassCard className="bg-gradient-to-r from-yellow-50/80 to-amber-50/80 border-yellow-200/50">
                                <CardContent className="p-6">
                                  <h5 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                                    <Lightbulb className="h-4 w-4" />
                                    Hints
                                  </h5>
                                  <div className="space-y-2">
                                    {activeProgrammingChallenge.hints.map((hint, index) => (
                                      <motion.div
                                        key={`hint-${index}-${hint.substring(0, 20)}`}
                                        className="flex items-start gap-3 p-3 bg-yellow-100/50 rounded-lg"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * index }}
                                      >
                                        <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                          {index + 1}
                                        </div>
                                        <p className="text-yellow-700 text-sm">{hint}</p>
                                      </motion.div>
                                    ))}
                                  </div>
                                </CardContent>
                              </GlassCard>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* IDE Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Code Editor */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h5 className="font-semibold text-emerald-800 flex items-center gap-2">
                                <Terminal className="h-4 w-4" />
                                Code Editor
                              </h5>
                              
                              <div className="flex items-center gap-2">
                                {/* Language Selector */}
                                <div className="flex bg-emerald-100 rounded-lg p-1">
                                  {['javascript', 'python', 'java'].map((lang) => (
                                    <button
                                      key={lang}
                                      onClick={() => switchProgrammingLanguage(lang)}
                                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                        programmingLanguage === lang
                                          ? 'bg-emerald-500 text-white'
                                          : 'text-emerald-700 hover:bg-emerald-200'
                                      }`}
                                    >
                                      {lang.toUpperCase()}
                                    </button>
                                  ))}
                                </div>
                                
                                {/* IDE Settings */}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setCodeTheme(codeTheme === 'dark' ? 'light' : 'dark')}
                                  className="p-2"
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <CodeEditor
                              value={userCode}
                              onChange={setUserCode}
                              language={programmingLanguage}
                              theme={codeTheme}
                              fontSize={fontSize}
                            />
                            
                            {/* Action Buttons */}
                            <div className="flex gap-2 flex-wrap">
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                  onClick={runCode}
                                  disabled={isRunningCode || !userCode.trim()}
                                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                                >
                                  {isRunningCode ? (
                                    <>
                                      <motion.div
                                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                      />
                                      Running...
                                    </>
                                  ) : (
                                    <>
                                      <PlayCircle className="h-4 w-4 mr-2" />
                                      Run Code
                                    </>
                                  )}
                                </Button>
                              </motion.div>
                              
                              <Button onClick={resetCode} variant="outline" className="border-gray-300">
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Reset
                              </Button>
                              
                              <Button onClick={saveCode} variant="outline" className="border-blue-300">
                                <Save className="h-4 w-4 mr-2" />
                                Save
                              </Button>
                              
                              {savedCodes[activeProgrammingChallenge.id] && (
                                <Button onClick={loadSavedCode} variant="outline" className="border-green-300">
                                  <Upload className="h-4 w-4 mr-2" />
                                  Load Saved
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Output Panel */}
                          <div className="space-y-4">
                            <h5 className="font-semibold text-emerald-800 flex items-center gap-2">
                              <Terminal className="h-4 w-4" />
                              Output & Results
                            </h5>
                            
                            {/* Console Output */}
                            <GlassCard className="bg-gray-900 text-green-400 border-gray-700">
                              <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  </div>
                                  <span className="text-xs text-gray-400">Console Output</span>
                                </div>
                                <div className="font-mono text-sm whitespace-pre-wrap min-h-[120px] max-h-[300px] overflow-y-auto">
                                  {codeOutput || (codeErrors ? codeErrors : "Output will appear here...")}
                                </div>
                              </CardContent>
                            </GlassCard>

                            {/* Test Results */}
                            {testResults.length > 0 && (
                              <GlassCard className="bg-white/80 border-gray-200/50">
                                <CardContent className="p-4">
                                  <h6 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                                    <TestTube className="h-4 w-4" />
                                    Test Results
                                  </h6>
                                  
                                  <div className="space-y-2">
                                    {testResults.map((test, index) => (
                                      <motion.div
                                        key={`test-${index}-${test.testCase || index}`}
                                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                                          test.passed 
                                            ? 'bg-green-50 border-green-200' 
                                            : 'bg-red-50 border-red-200'
                                        }`}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * index }}
                                      >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                          test.passed ? 'bg-green-500' : 'bg-red-500'
                                        }`}>
                                          {test.passed ? (
                                            <CheckCircle className="h-4 w-4 text-white" />
                                          ) : (
                                            <span className="text-white text-xs">✕</span>
                                          )}
                                        </div>
                                        <div className="flex-1">
                                          <p className={`text-sm font-medium ${
                                            test.passed ? 'text-green-800' : 'text-red-800'
                                          }`}>
                                            {test.testCase}
                                          </p>
                                          {!test.passed && (
                                            <p className="text-xs text-red-600 mt-1">
                                              Expected: {test.expected}, Got: {test.actual}
                                            </p>
                                          )}
                                        </div>
                                      </motion.div>
                                    ))}
                                  </div>
                                  
                                  {challengeScore > 0 && (
                                    <motion.div
                                      className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
                                      initial={{ scale: 0.9, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      transition={{ delay: 0.3 }}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium text-blue-800">Challenge Score:</span>
                                        <div className="flex items-center gap-2">
                                          <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                              <Star
                                                key={`challenge-star-${i}`}
                                                className={`h-4 w-4 ${
                                                  i < Math.floor(challengeScore / 20) 
                                                    ? 'text-yellow-500 fill-current' 
                                                    : 'text-gray-300'
                                                }`}
                                              />
                                            ))}
                                          </div>
                                          <span className="font-bold text-blue-800">{challengeScore}%</span>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </CardContent>
                              </GlassCard>
                            )}
                          </div>
                        </div>

                        {/* Solution Section */}
                        <AnimatePresence>
                          {showSolution[activeProgrammingChallenge.id] && (
                            <motion.div
                              key={`solution-${activeProgrammingChallenge.id}`}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <GlassCard className="bg-gradient-to-r from-purple-50/80 to-indigo-50/80 border-purple-200/50">
                                <CardContent className="p-6">
                                  <h5 className="font-semibold text-purple-800 mb-4 flex items-center gap-2">
                                    <Zap className="h-4 w-4" />
                                    Solution & Explanation
                                  </h5>
                                  
                                  <div className="space-y-4">
                                    <CodeEditor
                                      value={activeProgrammingChallenge.solution[programmingLanguage] || ""}
                                      onChange={() => {}}
                                      language={programmingLanguage}
                                      theme={codeTheme}
                                      fontSize={fontSize}
                                      readOnly={true}
                                    />
                                    
                                    {activeProgrammingChallenge.explanation && (
                                      <div className="p-4 bg-purple-100/50 rounded-xl">
                                        <h6 className="font-medium text-purple-800 mb-2">How it works:</h6>
                                        <p className="text-purple-700 leading-relaxed">
                                          {activeProgrammingChallenge.explanation}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </GlassCard>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div className="text-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={generateProgrammingChallenges}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Code2 className="h-4 w-4 mr-2" />
                        Generate Programming Challenges
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </GlassCard>
        </motion.div>

        {/* Action Section */}
        <motion.div key={`action-section-${module.id}`} variants={itemVariants}>
          <GlassCard className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 border-green-200/50">
            <CardContent className="p-8">
              <div className="flex flex-wrap gap-4 justify-center">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => setShowQuiz(true)}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3"
                  >
                    <TestTube className="h-5 w-5 mr-2" />
                    Take Quiz
                  </Button>
                </motion.div>

                {!moduleProgress.completed && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
      </div>

      {/* Quiz Modal */}
      <AnimatePresence>
        {showQuiz && (
          <QuizModal
            key="quiz-modal"
            course={course}
            module={module}
            onClose={() => setShowQuiz(false)}
            onComplete={(score) => {
              onProgressUpdate(module.id, true, 0, score)
              setShowQuiz(false)
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
