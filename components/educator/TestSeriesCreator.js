"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  Brain, 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  Sparkles, 
  BookOpen, 
  Settings, 
  Target,
  Clock,
  Calculator,
  CheckCircle,
  AlertCircle,
  Search,
  Upload,
  FileText,
  Download
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export default function TestSeriesCreator({ onTestSeriesCreated }) {
  const [activeStep, setActiveStep] = useState("basic")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [currentGenerationStep, setCurrentGenerationStep] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [uploadedFileName, setUploadedFileName] = useState("")
  const [isParsingFile, setIsParsingFile] = useState(false)
  
  const [testSeriesData, setTestSeriesData] = useState({
    title: "",
    description: "",
    subject: "",
    difficulty: "Medium",
    totalTests: 5,
    questionsPerTest: 100,
    timePerTest: 180,
    marksPerQuestion: 4,
    negativeMarking: 1,
    numericalPercentage: 35,
    theoreticalPercentage: 65,
    topics: [],
    tags: [],
    isPublic: true,
    targetAudience: "",
    prerequisites: ""
  })

  const { user, getAuthHeaders } = useAuth()

  // Markdown parser function
  const parseMarkdownFile = (content) => {
    const lines = content.split('\n')
    const topics = []
    let documentTitle = ""
    let documentDescription = ""
    let detectedSubject = ""
    let targetAudience = ""
    let prerequisites = ""

    // Extract document title from first # heading
    const titleLine = lines.find(line => line.trim().startsWith('# '))
    if (titleLine) {
      documentTitle = titleLine.trim().replace(/^#\s*/, '').trim()
    }

    let currentModule = ''
    let currentMarks = 0
    let currentSubtopics = []
    let currentSubtopicGroup = ''

    for (const line of lines) {
      const trimmed = line.trim()

      // Match Module/Topic headers (##) with marks
      const moduleMatch = trimmed.match(/^## (.+?) \((\d+)\s*(marks?|%|percent)?\)/i) ||
                          trimmed.match(/^## (.+?)$/i)
      
      if (moduleMatch) {
        // Push previous module
        if (currentModule && currentSubtopics.length) {
          topics.push({
            name: currentModule,
            marks: currentMarks,
            weightage: 0, // Will be calculated later
            subtopics: [...currentSubtopics]
          })
        }
        
        currentModule = moduleMatch[1].trim()
        // Extract marks if present
        if (moduleMatch[2]) {
          currentMarks = parseInt(moduleMatch[2])
        } else {
          // If no marks specified, try to extract from context or set to 0
          currentMarks = 0
        }
        currentSubtopics = []
        currentSubtopicGroup = ''
        continue
      }

      // Match subtopic group headers (###)
      const subtopicGroupMatch = trimmed.match(/^### (.+)/)
      if (subtopicGroupMatch && currentModule) {
        currentSubtopicGroup = subtopicGroupMatch[1].trim()
        // Add the group as a subtopic
        if (!currentSubtopics.includes(currentSubtopicGroup)) {
          currentSubtopics.push(currentSubtopicGroup)
        }
        continue
      }

      // Match individual subtopics under ### groups (bullet points or direct lines)
      const subtopicMatch = trimmed.match(/^- (.+)/) ||
                           trimmed.match(/^\* (.+)/) ||
                           trimmed.match(/^\+ (.+)/)
      
      if (subtopicMatch && currentModule) {
        let subtopic = subtopicMatch[1].trim()
        // Remove any marks notation from subtopic
        subtopic = subtopic.replace(/\s*\(\d+\s*(marks?|%|percent)\)/i, '').trim()
        
        if (subtopic && !currentSubtopics.includes(subtopic)) {
          // If we have a current group, prefix the subtopic with group name for context
          if (currentSubtopicGroup && !subtopic.includes(currentSubtopicGroup)) {
            subtopic = `${currentSubtopicGroup}: ${subtopic}`
          }
          currentSubtopics.push(subtopic)
        }
        continue
      }

      // Extract metadata
      if (trimmed.toLowerCase().includes('description:') || trimmed.toLowerCase().includes('about:')) {
        documentDescription = trimmed.replace(/^[^:]*:\s*/, '').trim()
      }
      else if (trimmed.toLowerCase().includes('target audience:') || trimmed.toLowerCase().includes('for:')) {
        targetAudience = trimmed.replace(/^[^:]*:\s*/, '').trim()
      }
      else if (trimmed.toLowerCase().includes('prerequisites:') || trimmed.toLowerCase().includes('requirements:')) {
        prerequisites = trimmed.replace(/^[^:]*:\s*/, '').trim()
      }
    }

    // Push the last module
    if (currentModule && currentSubtopics.length) {
      topics.push({
        name: currentModule,
        marks: currentMarks,
        weightage: 0,
        subtopics: [...currentSubtopics]
      })
    }

    // Calculate weightages based on total marks
    const totalMarks = topics.reduce((sum, topic) => sum + (topic.marks || 0), 0)
    
    if (totalMarks > 0) {
      // Calculate based on marks distribution
      topics.forEach(topic => {
        topic.weightage = parseFloat(((topic.marks / totalMarks) * 100).toFixed(2))
      })
    } else {
      // Equal distribution if no marks specified
      const equalWeight = topics.length > 0 ? parseFloat((100 / topics.length).toFixed(2)) : 0
      topics.forEach((topic, index) => {
        if (index === topics.length - 1) {
          // Last topic gets the remainder to ensure total is 100%
          const otherTotal = topics.slice(0, -1).reduce((sum, t) => sum + equalWeight, 0)
          topic.weightage = parseFloat((100 - otherTotal).toFixed(2))
        } else {
          topic.weightage = equalWeight
        }
      })
    }

    // Auto-detect subject based on topics
    detectedSubject = detectSubjectFromTopics(topics, documentTitle)

    // Generate description if not found
    if (!documentDescription && topics.length > 0) {
      const topicNames = topics.map(t => t.name).join(', ')
      documentDescription = `Comprehensive test series covering ${topicNames}. Designed to provide thorough practice and assessment across all major topics.`
    }

    // Ensure each topic has at least one subtopic
    topics.forEach(topic => {
      if (topic.subtopics.length === 0) {
        topic.subtopics = [topic.name]
      }
    })

    return {
      topics,
      basicInfo: {
        title: documentTitle,
        description: documentDescription,
        subject: detectedSubject,
        targetAudience,
        prerequisites
      }
    }
  }

  // Subject detection function
  const detectSubjectFromTopics = (topics, title) => {
    const topicNames = topics.map(t => t.name.toLowerCase()).join(' ')
    const titleLower = title.toLowerCase()
    const combinedText = `${topicNames} ${titleLower}`

    // Subject detection patterns
    const subjectPatterns = {
      'Physics': ['mechanics', 'thermodynamics', 'electromagnetism', 'optics', 'waves', 'quantum', 'nuclear', 'kinematics', 'dynamics'],
      'Chemistry': ['organic', 'inorganic', 'physical chemistry', 'chemical bonding', 'periodic table', 'acids', 'bases', 'molecules'],
      'Mathematics': ['algebra', 'calculus', 'geometry', 'trigonometry', 'statistics', 'probability', 'differential', 'integral', 'matrices'],
      'Biology': ['botany', 'zoology', 'genetics', 'ecology', 'evolution', 'cell biology', 'molecular biology', 'physiology'],
      'Computer Science Engineering': ['programming', 'algorithms', 'data structures', 'software engineering', 'databases', 'networks', 'operating systems'],
      'Economics': ['microeconomics', 'macroeconomics', 'demand', 'supply', 'market', 'fiscal', 'monetary'],
      'Business Administration': ['management', 'marketing', 'finance', 'operations', 'strategy', 'human resources'],
      'English': ['grammar', 'literature', 'comprehension', 'writing', 'poetry', 'prose'],
      'History': ['ancient', 'medieval', 'modern', 'world war', 'civilization', 'independence'],
      'Geography': ['physical geography', 'human geography', 'climate', 'population', 'resources']
    }

    for (const [subject, keywords] of Object.entries(subjectPatterns)) {
      const matchCount = keywords.filter(keyword => combinedText.includes(keyword)).length
      if (matchCount >= 2) {
        return subject
      }
    }

    // Fallback: check for subject names in title or topics
    for (const subject of Object.keys(subjectPatterns)) {
      if (combinedText.includes(subject.toLowerCase())) {
        return subject
      }
    }

    return "" // No subject detected
  }

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.name.endsWith('.md')) {
      setError("Please upload a valid .md (Markdown) file")
      return
    }

    setIsParsingFile(true)
    setError("")
    setUploadedFileName(file.name)

    try {
      const content = await file.text()
      const parsedData = parseMarkdownFile(content)
      
      if (parsedData.topics.length === 0) {
        setError("No topics found in the markdown file. Please ensure your file has proper headings (# or ##)")
        return
      }

      // Update the test series data with parsed topics and basic info
      setTestSeriesData(prev => ({
        ...prev,
        topics: parsedData.topics,
        title: parsedData.basicInfo.title || prev.title,
        description: parsedData.basicInfo.description || prev.description,
        subject: parsedData.basicInfo.subject || prev.subject,
        targetAudience: parsedData.basicInfo.targetAudience || prev.targetAudience,
        prerequisites: parsedData.basicInfo.prerequisites || prev.prerequisites
      }))

      setSuccess(`Successfully parsed ${parsedData.topics.length} topics and auto-populated basic information from ${file.name}`)
      
      // Auto-switch to basic info tab first, then user can review and go to syllabus
      setActiveStep("basic")
      
    } catch (error) {
      console.error("Error parsing markdown file:", error)
      setError("Failed to parse the markdown file. Please check the file format.")
    } finally {
      setIsParsingFile(false)
      // Clear the file input
      event.target.value = ''
    }
  }

  // Download sample markdown template
  const downloadSampleTemplate = () => {
    const sampleContent = `# JEE Main Mathematics Complete Test Series

Description: Comprehensive test series designed for JEE Main aspirants covering all essential mathematics topics with balanced theoretical and numerical questions.

Target Audience: JEE Main aspirants, Class 11-12 students preparing for engineering entrance exams

Prerequisites: Basic understanding of Class 10 mathematics, familiarity with algebraic operations and geometric concepts

## Algebra (25 Marks)

### Basic Concepts
- Linear Equations in One and Two Variables
- Quadratic Equations and Expressions
- Polynomials and Rational Functions

### Advanced Topics
- Matrices and Determinants
- Sequences and Series
- Binomial Theorem
- Complex Numbers

## Calculus (30 Marks)

### Differential Calculus
- Limits and Continuity
- Differentiation and Applications
- Applications of Derivatives

### Integral Calculus
- Integration Techniques
- Definite Integrals
- Area Under Curves
- Differential Equations

## Coordinate Geometry (20 Marks)

### Two Dimensional Geometry
- Straight Lines and Pair of Lines
- Circles and System of Circles

### Conic Sections
- Parabola Properties and Equations
- Ellipse Standard Forms
- Hyperbola and Rectangular Hyperbola

### Three Dimensional Geometry
- Points, Lines and Planes
- Direction Cosines and Ratios

## Trigonometry (15 Marks)

### Basic Trigonometry
- Trigonometric Functions and Identities
- Trigonometric Equations
- Inverse Trigonometric Functions

### Applications
- Heights and Distances
- Solution of Triangles

## Statistics and Probability (10 Marks)

### Statistics
- Measures of Central Tendency
- Standard Deviation and Variance

### Probability
- Probability Theory and Rules
- Binomial and Normal Distribution
- Conditional Probability
- Mathematical Expectation
`

    const blob = new Blob([sampleContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'test-series-syllabus-template.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const addTopic = () => {
    setTestSeriesData((prev) => {
      const newTopics = [...prev.topics, { name: "", weightage: 0, subtopics: [""] }]
      
      // If this is the first topic, set its weightage to 100%
      if (newTopics.length === 1) {
        newTopics[0].weightage = 100
      } else if (newTopics.length >= 2) {
                 // Auto-adjust the last topic when adding a new one
         const lastTopicIndex = newTopics.length - 1
         const totalExceptLast = newTopics.slice(0, -1).reduce((sum, topic) => sum + (parseFloat(topic.weightage) || 0), 0)
         const lastTopicWeightage = Math.max(0, parseFloat((100 - totalExceptLast).toFixed(2)))
        newTopics[lastTopicIndex].weightage = lastTopicWeightage
      }
      
      return {
        ...prev,
        topics: newTopics
      }
    })
  }

  const updateTopic = (index, field, value) => {
    setTestSeriesData((prev) => {
      const updatedTopics = prev.topics.map((topic, i) => (i === index ? { ...topic, [field]: value } : topic))
      
      // If updating weightage and there are at least 2 topics, auto-adjust the last topic's weightage
      if (field === 'weightage' && updatedTopics.length >= 2) {
        const lastTopicIndex = updatedTopics.length - 1
        
        // Only auto-adjust if we're not updating the last topic itself
        if (index !== lastTopicIndex) {
          // Calculate total weightage of all topics except the last one
          const totalExceptLast = updatedTopics.slice(0, -1).reduce((sum, topic) => sum + (parseFloat(topic.weightage) || 0), 0)
          
                     // Set the last topic's weightage to make total 100%, rounded to 2 decimal places
           const lastTopicWeightage = Math.max(0, parseFloat((100 - totalExceptLast).toFixed(2)))
          updatedTopics[lastTopicIndex] = {
            ...updatedTopics[lastTopicIndex],
            weightage: lastTopicWeightage
          }
        }
      }
      
      return {
        ...prev,
        topics: updatedTopics
      }
    })
  }

  const removeTopic = (index) => {
    setTestSeriesData((prev) => {
      const newTopics = prev.topics.filter((_, i) => i !== index)
      
      // If only one topic remains, set it to 100%
      if (newTopics.length === 1) {
        newTopics[0].weightage = 100
      } else if (newTopics.length >= 2) {
                 // Auto-adjust the last topic after removal
         const lastTopicIndex = newTopics.length - 1
         const totalExceptLast = newTopics.slice(0, -1).reduce((sum, topic) => sum + (parseFloat(topic.weightage) || 0), 0)
         const lastTopicWeightage = Math.max(0, parseFloat((100 - totalExceptLast).toFixed(2)))
        newTopics[lastTopicIndex].weightage = lastTopicWeightage
      }
      
      return {
        ...prev,
        topics: newTopics
      }
    })
  }

  const addSubtopic = (topicIndex) => {
    setTestSeriesData((prev) => ({
      ...prev,
      topics: prev.topics.map((topic, i) =>
        i === topicIndex ? { ...topic, subtopics: [...topic.subtopics, ""] } : topic,
      ),
    }))
  }

  const updateSubtopic = (topicIndex, subtopicIndex, value) => {
    setTestSeriesData((prev) => ({
      ...prev,
      topics: prev.topics.map((topic, i) =>
        i === topicIndex
          ? {
              ...topic,
              subtopics: topic.subtopics.map((sub, j) => (j === subtopicIndex ? value : sub)),
            }
          : topic,
      ),
    }))
  }

  const removeSubtopic = (topicIndex, subtopicIndex) => {
    setTestSeriesData((prev) => ({
      ...prev,
      topics: prev.topics.map((topic, i) =>
        i === topicIndex ? { ...topic, subtopics: topic.subtopics.filter((_, j) => j !== subtopicIndex) } : topic,
      ),
    }))
  }

  const normalizeWeightages = (topics) => {
    if (topics.length === 0) return topics
    
    // Create a deep copy to avoid mutating the original
    const normalizedTopics = topics.map(topic => ({
      ...topic,
      weightage: parseFloat(topic.weightage) || 0
    }))
    
    if (normalizedTopics.length === 1) {
      // Single topic should be 100%
      normalizedTopics[0].weightage = 100
      return normalizedTopics
    }
    
    // For multiple topics, ensure the last one makes the total exactly 100
    const lastIndex = normalizedTopics.length - 1
    const otherTopicsTotal = normalizedTopics.slice(0, -1).reduce((sum, topic) => sum + topic.weightage, 0)
    normalizedTopics[lastIndex].weightage = 100 - otherTopicsTotal
    
    // Ensure no negative weightages
    if (normalizedTopics[lastIndex].weightage < 0) {
      normalizedTopics[lastIndex].weightage = 0
    }
    
    return normalizedTopics
  }

  const generateTestSeries = async () => {
    setIsGenerating(true)
    setGenerationProgress(0)
    setError("")
    setCurrentGenerationStep("Initializing test series generation...")

    try {
      // Normalize weightages before sending to API
      const normalizedTopics = normalizeWeightages(testSeriesData.topics)
      
      // Debug: Log the normalized topics and their total
      const debugTotal = normalizedTopics.reduce((sum, topic) => sum + (parseFloat(topic.weightage) || 0), 0)
      console.log("Normalized topics:", normalizedTopics)
      console.log("Debug total weightage:", debugTotal)
      
      // Final safety check: ensure all weightages are integers and total is exactly 100
      const finalTopics = normalizedTopics.map((topic, index) => {
        if (index === normalizedTopics.length - 1) {
          // Calculate last topic to make total exactly 100
          const otherTotal = normalizedTopics.slice(0, -1).reduce((sum, t) => sum + Math.round(parseFloat(t.weightage) || 0), 0)
          return {
            ...topic,
            weightage: Math.max(0, 100 - otherTotal)
          }
        }
        return {
          ...topic,
          weightage: Math.round(parseFloat(topic.weightage) || 0)
        }
      })
      
      const finalTotal = finalTopics.reduce((sum, topic) => sum + topic.weightage, 0)
      console.log("Final topics:", finalTopics)
      console.log("Final total:", finalTotal)
      
      const response = await fetch("/api/test-series/generate", {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...testSeriesData,
          topics: finalTopics,
          educatorId: user.id,
          educatorName: user.name
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate test series")
      }

      const data = await response.json()
      
      if (data.success) {
        setSuccess("Test series generated successfully!")
        setGenerationProgress(100)
        setCurrentGenerationStep("Test series generated successfully!")
        
        // Call the callback if provided
        if (onTestSeriesCreated) {
          onTestSeriesCreated(data.testSeries)
        }
      } else {
        throw new Error(data.error || "Failed to generate test series")
      }

    } catch (error) {
      console.error("Error generating test series:", error)
      setError(error.message || "Failed to generate test series")
    } finally {
      setTimeout(() => {
        setIsGenerating(false)
        setGenerationProgress(0)
        setCurrentGenerationStep("")
      }, 2000)
    }
  }

  const handleSaveDraft = async () => {
    try {
      const response = await fetch("/api/test-series/draft", {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...testSeriesData,
          educatorId: user.id,
          status: "draft"
        })
      })

      if (response.ok) {
        setSuccess("Draft saved successfully!")
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to save draft")
      }
    } catch (error) {
      console.error("Error saving draft:", error)
      setError("Failed to save draft")
    }
  }

     const totalWeightage = parseFloat(testSeriesData.topics.reduce((sum, topic) => sum + (parseFloat(topic.weightage) || 0), 0).toFixed(2))
  const totalQuestions = testSeriesData.totalTests * testSeriesData.questionsPerTest
  const numericalCount = Math.round((totalQuestions * testSeriesData.numericalPercentage) / 100)
  const theoreticalCount = totalQuestions - numericalCount

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Brain className="w-5 h-5" />
            Create New Test Series
          </CardTitle>
          <CardDescription>
            Design and generate comprehensive test series with AI-powered question creation using Perplexity AI
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Alert Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeStep} onValueChange={setActiveStep}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          {/* Auto-populated notification */}
          {uploadedFileName && (
            <Alert className="border-blue-200 bg-blue-50">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Auto-populated from {uploadedFileName}:</strong> Review and modify the information below as needed. 
                {testSeriesData.subject && <span className="ml-2">Subject detected: <strong>{testSeriesData.subject}</strong></span>}
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Enter the basic details for your test series</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Test Series Title</Label>
                  <Input
                    id="title"
                    value={testSeriesData.title}
                    onChange={(e) => setTestSeriesData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., JEE Main Physics Complete"
                  />
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Select
                    value={testSeriesData.subject}
                    onValueChange={(value) => setTestSeriesData((prev) => ({ ...prev, subject: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Core Sciences */}
                      <SelectItem value="Physics">Physics</SelectItem>
                      <SelectItem value="Chemistry">Chemistry</SelectItem>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="Biology">Biology</SelectItem>
                      
                      {/* Engineering Disciplines */}
                      <SelectItem value="Computer Science Engineering">Computer Science Engineering</SelectItem>
                      <SelectItem value="Information Technology">Information Technology</SelectItem>
                      <SelectItem value="Electronics & Communication">Electronics & Communication</SelectItem>
                      <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
                      <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                      <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                      <SelectItem value="Chemical Engineering">Chemical Engineering</SelectItem>
                      <SelectItem value="Aerospace Engineering">Aerospace Engineering</SelectItem>
                      <SelectItem value="Biomedical Engineering">Biomedical Engineering</SelectItem>
                      <SelectItem value="Industrial Engineering">Industrial Engineering</SelectItem>
                      <SelectItem value="Environmental Engineering">Environmental Engineering</SelectItem>
                      <SelectItem value="Materials Science">Materials Science</SelectItem>
                      <SelectItem value="Petroleum Engineering">Petroleum Engineering</SelectItem>
                      <SelectItem value="Mining Engineering">Mining Engineering</SelectItem>
                      <SelectItem value="Nuclear Engineering">Nuclear Engineering</SelectItem>
                      <SelectItem value="Agricultural Engineering">Agricultural Engineering</SelectItem>
                      <SelectItem value="Automobile Engineering">Automobile Engineering</SelectItem>
                      <SelectItem value="Robotics Engineering">Robotics Engineering</SelectItem>
                      <SelectItem value="Software Engineering">Software Engineering</SelectItem>
                      <SelectItem value="Data Science & Engineering">Data Science & Engineering</SelectItem>
                      <SelectItem value="Artificial Intelligence">Artificial Intelligence</SelectItem>
                      <SelectItem value="Machine Learning">Machine Learning</SelectItem>
                      <SelectItem value="Cybersecurity">Cybersecurity</SelectItem>
                      
                      {/* Management & Business */}
                      <SelectItem value="Business Administration">Business Administration</SelectItem>
                      <SelectItem value="Marketing Management">Marketing Management</SelectItem>
                      <SelectItem value="Financial Management">Financial Management</SelectItem>
                      <SelectItem value="Human Resource Management">Human Resource Management</SelectItem>
                      <SelectItem value="Operations Management">Operations Management</SelectItem>
                      <SelectItem value="Strategic Management">Strategic Management</SelectItem>
                      <SelectItem value="Project Management">Project Management</SelectItem>
                      <SelectItem value="Supply Chain Management">Supply Chain Management</SelectItem>
                      <SelectItem value="International Business">International Business</SelectItem>
                      <SelectItem value="Entrepreneurship">Entrepreneurship</SelectItem>
                      <SelectItem value="Digital Marketing">Digital Marketing</SelectItem>
                      <SelectItem value="E-commerce">E-commerce</SelectItem>
                      <SelectItem value="Business Analytics">Business Analytics</SelectItem>
                      
                      {/* Medical & Health Sciences */}
                      <SelectItem value="Medicine">Medicine</SelectItem>
                      <SelectItem value="Dentistry">Dentistry</SelectItem>
                      <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                      <SelectItem value="Nursing">Nursing</SelectItem>
                      <SelectItem value="Physiotherapy">Physiotherapy</SelectItem>
                      <SelectItem value="Medical Laboratory Technology">Medical Laboratory Technology</SelectItem>
                      <SelectItem value="Radiology">Radiology</SelectItem>
                      <SelectItem value="Public Health">Public Health</SelectItem>
                      <SelectItem value="Nutrition & Dietetics">Nutrition & Dietetics</SelectItem>
                      
                      {/* Social Sciences & Humanities */}
                      <SelectItem value="Economics">Economics</SelectItem>
                      <SelectItem value="Political Science">Political Science</SelectItem>
                      <SelectItem value="Sociology">Sociology</SelectItem>
                      <SelectItem value="Psychology">Psychology</SelectItem>
                      <SelectItem value="History">History</SelectItem>
                      <SelectItem value="Geography">Geography</SelectItem>
                      <SelectItem value="Philosophy">Philosophy</SelectItem>
                      <SelectItem value="Literature">Literature</SelectItem>
                      <SelectItem value="Linguistics">Linguistics</SelectItem>
                      <SelectItem value="Anthropology">Anthropology</SelectItem>
                      <SelectItem value="Archaeology">Archaeology</SelectItem>
                      
                      {/* Languages */}
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Hindi">Hindi</SelectItem>
                      <SelectItem value="Sanskrit">Sanskrit</SelectItem>
                      <SelectItem value="French">French</SelectItem>
                      <SelectItem value="German">German</SelectItem>
                      <SelectItem value="Spanish">Spanish</SelectItem>
                      <SelectItem value="Japanese">Japanese</SelectItem>
                      <SelectItem value="Chinese">Chinese</SelectItem>
                      <SelectItem value="Arabic">Arabic</SelectItem>
                      
                      {/* Law & Legal Studies */}
                      <SelectItem value="Constitutional Law">Constitutional Law</SelectItem>
                      <SelectItem value="Criminal Law">Criminal Law</SelectItem>
                      <SelectItem value="Corporate Law">Corporate Law</SelectItem>
                      <SelectItem value="International Law">International Law</SelectItem>
                      <SelectItem value="Intellectual Property Law">Intellectual Property Law</SelectItem>
                      <SelectItem value="Environmental Law">Environmental Law</SelectItem>
                      <SelectItem value="Cyber Law">Cyber Law</SelectItem>
                      
                      {/* Architecture & Design */}
                      <SelectItem value="Architecture">Architecture</SelectItem>
                      <SelectItem value="Interior Design">Interior Design</SelectItem>
                      <SelectItem value="Urban Planning">Urban Planning</SelectItem>
                      <SelectItem value="Landscape Architecture">Landscape Architecture</SelectItem>
                      <SelectItem value="Industrial Design">Industrial Design</SelectItem>
                      <SelectItem value="Fashion Design">Fashion Design</SelectItem>
                      <SelectItem value="Graphic Design">Graphic Design</SelectItem>
                      
                      {/* Agriculture & Food Science */}
                      <SelectItem value="Agriculture">Agriculture</SelectItem>
                      <SelectItem value="Horticulture">Horticulture</SelectItem>
                      <SelectItem value="Food Technology">Food Technology</SelectItem>
                      <SelectItem value="Agricultural Economics">Agricultural Economics</SelectItem>
                      <SelectItem value="Forestry">Forestry</SelectItem>
                      <SelectItem value="Veterinary Science">Veterinary Science</SelectItem>
                      <SelectItem value="Fisheries Science">Fisheries Science</SelectItem>
                      
                      {/* Education & Teaching */}
                      <SelectItem value="Elementary Education">Elementary Education</SelectItem>
                      <SelectItem value="Secondary Education">Secondary Education</SelectItem>
                      <SelectItem value="Special Education">Special Education</SelectItem>
                      <SelectItem value="Educational Psychology">Educational Psychology</SelectItem>
                      <SelectItem value="Curriculum Development">Curriculum Development</SelectItem>
                      
                      {/* Mass Communication & Media */}
                      <SelectItem value="Journalism">Journalism</SelectItem>
                      <SelectItem value="Mass Communication">Mass Communication</SelectItem>
                      <SelectItem value="Film Studies">Film Studies</SelectItem>
                      <SelectItem value="Animation">Animation</SelectItem>
                      <SelectItem value="Photography">Photography</SelectItem>
                      <SelectItem value="Broadcasting">Broadcasting</SelectItem>
                      
                      {/* Fine Arts & Performing Arts */}
                      <SelectItem value="Fine Arts">Fine Arts</SelectItem>
                      <SelectItem value="Music">Music</SelectItem>
                      <SelectItem value="Dance">Dance</SelectItem>
                      <SelectItem value="Theatre Arts">Theatre Arts</SelectItem>
                      <SelectItem value="Visual Arts">Visual Arts</SelectItem>
                      
                      {/* Sports & Physical Education */}
                      <SelectItem value="Physical Education">Physical Education</SelectItem>
                      <SelectItem value="Sports Science">Sports Science</SelectItem>
                      <SelectItem value="Sports Management">Sports Management</SelectItem>
                      <SelectItem value="Yoga & Naturopathy">Yoga & Naturopathy</SelectItem>
                      
                      {/* Competitive Exam Subjects */}
                      <SelectItem value="General Knowledge">General Knowledge</SelectItem>
                      <SelectItem value="Current Affairs">Current Affairs</SelectItem>
                      <SelectItem value="Reasoning">Reasoning</SelectItem>
                      <SelectItem value="Quantitative Aptitude">Quantitative Aptitude</SelectItem>
                      <SelectItem value="Data Interpretation">Data Interpretation</SelectItem>
                      <SelectItem value="Verbal Ability">Verbal Ability</SelectItem>
                      <SelectItem value="Logical Reasoning">Logical Reasoning</SelectItem>
                      <SelectItem value="Reading Comprehension">Reading Comprehension</SelectItem>
                      <SelectItem value="General Awareness">General Awareness</SelectItem>
                      
                      {/* Other Professional Courses */}
                      <SelectItem value="Hotel Management">Hotel Management</SelectItem>
                      <SelectItem value="Tourism & Travel">Tourism & Travel</SelectItem>
                      <SelectItem value="Event Management">Event Management</SelectItem>
                      <SelectItem value="Aviation">Aviation</SelectItem>
                      <SelectItem value="Maritime Studies">Maritime Studies</SelectItem>
                      <SelectItem value="Library Science">Library Science</SelectItem>
                      <SelectItem value="Social Work">Social Work</SelectItem>
                      <SelectItem value="Retail Management">Retail Management</SelectItem>
                      <SelectItem value="Fashion Technology">Fashion Technology</SelectItem>
                      <SelectItem value="Textile Technology">Textile Technology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={testSeriesData.description}
                  onChange={(e) => setTestSeriesData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your test series, target audience, and key features..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select
                    value={testSeriesData.difficulty}
                    onValueChange={(value) => setTestSeriesData((prev) => ({ ...prev, difficulty: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                      <SelectItem value="Mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Input
                    id="targetAudience"
                    value={testSeriesData.targetAudience}
                    onChange={(e) => setTestSeriesData((prev) => ({ ...prev, targetAudience: e.target.value }))}
                    placeholder="e.g., JEE Aspirants, Class 12 Students"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="prerequisites">Prerequisites</Label>
                <Textarea
                  id="prerequisites"
                  value={testSeriesData.prerequisites}
                  onChange={(e) => setTestSeriesData((prev) => ({ ...prev, prerequisites: e.target.value }))}
                  placeholder="What should students know before taking this test series?"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="syllabus" className="space-y-6">
          {/* File Upload Section */}
          <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Upload className="w-5 h-5" />
                Quick Import from Markdown
              </CardTitle>
              <CardDescription>
                Upload a .md file to automatically parse topics, subtopics, marks distribution, and basic information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="mdFile" className="cursor-pointer">
                    <div className="flex items-center gap-2 p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-400 hover:bg-green-50/50 transition-colors">
                      <FileText className="w-5 h-5 text-green-600" />
                      <span className="text-green-700">
                        {isParsingFile ? "Parsing file..." : uploadedFileName || "Click to upload .md file or drag & drop"}
                      </span>
                      {isParsingFile && <div className="ml-2 w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />}
                    </div>
                  </Label>
                  <Input
                    id="mdFile"
                    type="file"
                    accept=".md,.markdown"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isParsingFile}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadSampleTemplate}
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
              
                             <div className="mt-4 text-sm text-green-600">
                 <p><strong>Supported formats:</strong></p>
                 <ul className="list-disc list-inside space-y-1 mt-2">
                   <li><strong>Title:</strong> First # heading becomes the test series title</li>
                   <li><strong>Topics:</strong> Use "## Topic Name (X Marks)" format</li>
                   <li><strong>Subtopic Groups:</strong> Use "### Group Name" for subtopic categories</li>
                   <li><strong>Subtopics:</strong> Use bullet points (-,*,+) under ### groups</li>
                   <li><strong>Marks:</strong> Include in parentheses after topic name (e.g., "## Algebra (25 Marks)")</li>
                   <li><strong>Description:</strong> Add "Description: your text"</li>
                   <li><strong>Target Audience:</strong> Add "Target Audience: your text"</li>
                   <li><strong>Prerequisites:</strong> Add "Prerequisites: your text"</li>
                 </ul>
               </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Syllabus & Topics
                </span>
                                 <div className="flex items-center gap-2">
                   <Badge variant={totalWeightage === 100 ? "default" : "destructive"}>Total: {totalWeightage}%</Badge>
                   {totalWeightage !== 100 && testSeriesData.topics.length > 1 && (
                     <Button 
                       onClick={() => {
                         const normalizedTopics = normalizeWeightages(testSeriesData.topics)
                         setTestSeriesData(prev => ({ ...prev, topics: normalizedTopics }))
                       }} 
                       size="sm" 
                       variant="outline"
                     >
                       Fix 100%
                     </Button>
                   )}
                   <Button onClick={addTopic} size="sm">
                     <Plus className="w-4 h-4 mr-1" />
                     Add Topic
                   </Button>
                 </div>
              </CardTitle>
              <CardDescription>
                Define topics with their weightage and subtopics for comprehensive coverage. The last topic's weightage is automatically calculated to ensure the total equals 100%.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {testSeriesData.topics.map((topic, topicIndex) => (
                <Card key={topicIndex} className="border-l-4 border-l-indigo-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-1">
                        <Label>Topic Name</Label>
                        <Input
                          value={topic.name}
                          onChange={(e) => updateTopic(topicIndex, "name", e.target.value)}
                          placeholder="e.g., Mechanics, Thermodynamics"
                        />
                      </div>
                                             <div className="w-32">
                                                   <Label>
                            Weightage (%)
                            {topicIndex === testSeriesData.topics.length - 1 && testSeriesData.topics.length > 1 && (
                              <span className="text-xs text-muted-foreground ml-1">(Auto)</span>
                            )}
                          </Label>
                                                     <Input
                             type="number"
                             step="0.01"
                             value={topic.weightage}
                            onChange={(e) => updateTopic(topicIndex, "weightage", parseFloat(e.target.value) || 0)}
                            placeholder={testSeriesData.topics.length === 1 ? "100" : "25.5"}
                            disabled={topicIndex === testSeriesData.topics.length - 1 && testSeriesData.topics.length > 1}
                            className={topicIndex === testSeriesData.topics.length - 1 && testSeriesData.topics.length > 1 ? "bg-muted" : ""}
                          />
                       </div>
                      <Button variant="outline" size="sm" onClick={() => removeTopic(topicIndex)} className="mt-6">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Subtopics</Label>
                        <Button variant="outline" size="sm" onClick={() => addSubtopic(topicIndex)}>
                          <Plus className="w-3 h-3 mr-1" />
                          Add Subtopic
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {topic.subtopics.map((subtopic, subtopicIndex) => (
                          <div key={subtopicIndex} className="flex items-center gap-2">
                            <Input
                              value={subtopic}
                              onChange={(e) => updateSubtopic(topicIndex, subtopicIndex, e.target.value)}
                              placeholder="e.g., Newton's Laws, Kinematics"
                              className="flex-1"
                            />
                            {topic.subtopics.length > 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeSubtopic(topicIndex, subtopicIndex)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Test Configuration
              </CardTitle>
              <CardDescription>Configure test parameters and marking scheme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="totalTests">Number of Tests</Label>
                  <Input
                    id="totalTests"
                    type="number"
                    value={testSeriesData.totalTests}
                    onChange={(e) =>
                      setTestSeriesData((prev) => ({ ...prev, totalTests: parseInt(e.target.value) || 1 }))
                    }
                    min="1"
                    max="50"
                  />
                </div>
                <div>
                  <Label htmlFor="questionsPerTest">Questions per Test</Label>
                  <Input
                    id="questionsPerTest"
                    type="number"
                    value={testSeriesData.questionsPerTest}
                    onChange={(e) =>
                      setTestSeriesData((prev) => ({ ...prev, questionsPerTest: parseInt(e.target.value) || 1 }))
                    }
                    min="10"
                    max="200"
                  />
                </div>
                <div>
                  <Label htmlFor="timePerTest">Time per Test (minutes)</Label>
                  <Input
                    id="timePerTest"
                    type="number"
                    value={testSeriesData.timePerTest}
                    onChange={(e) =>
                      setTestSeriesData((prev) => ({ ...prev, timePerTest: parseInt(e.target.value) || 60 }))
                    }
                    min="30"
                    max="300"
                  />
                </div>
                <div>
                  <Label htmlFor="marksPerQuestion">Marks per Question</Label>
                  <Input
                    id="marksPerQuestion"
                    type="number"
                    value={testSeriesData.marksPerQuestion}
                    onChange={(e) =>
                      setTestSeriesData((prev) => ({ ...prev, marksPerQuestion: parseInt(e.target.value) || 1 }))
                    }
                    min="1"
                    max="10"
                  />
                </div>
                <div>
                  <Label htmlFor="negativeMarking">Negative Marking</Label>
                  <Input
                    id="negativeMarking"
                    type="number"
                    step="0.25"
                    value={testSeriesData.negativeMarking}
                    onChange={(e) =>
                      setTestSeriesData((prev) => ({
                        ...prev,
                        negativeMarking: parseFloat(e.target.value) || 0,
                      }))
                    }
                    min="0"
                    max="5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numericalPercentage">Numerical Questions (%)</Label>
                  <Input
                    id="numericalPercentage"
                    type="number"
                    value={testSeriesData.numericalPercentage}
                    onChange={(e) => {
                      const numerical = parseInt(e.target.value) || 0
                      setTestSeriesData((prev) => ({
                        ...prev,
                        numericalPercentage: numerical,
                        theoreticalPercentage: 100 - numerical
                      }))
                    }}
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <Label htmlFor="theoreticalPercentage">Theoretical Questions (%)</Label>
                  <Input
                    id="theoreticalPercentage"
                    type="number"
                    value={testSeriesData.theoreticalPercentage}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Test Series Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Tests:</span>
                    <div className="font-medium">{testSeriesData.totalTests}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Questions:</span>
                    <div className="font-medium">{totalQuestions}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Numerical Questions:</span>
                    <div className="font-medium">{numericalCount}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Theoretical Questions:</span>
                    <div className="font-medium">{theoreticalCount}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate" className="space-y-6">
          <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-800">
                <Brain className="w-5 h-5" />
                AI Test Series Generator
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Powered by Perplexity AI
                </Badge>
              </CardTitle>
              <CardDescription>
                Advanced AI research and question generation with extensive validation and market-leading features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-white rounded-lg border">
                  <Search className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-800">Extensive Research</h4>
                  <p className="text-sm text-gray-600">Real-time web search for current information</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <Calculator className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-800">{testSeriesData.numericalPercentage}% Numerical</h4>
                  <p className="text-sm text-gray-600">{numericalCount} numerical questions</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <BookOpen className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-800">{testSeriesData.theoreticalPercentage}% Theoretical</h4>
                  <p className="text-sm text-gray-600">{theoreticalCount} theoretical questions</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <CheckCircle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-800">AI Validated</h4>
                  <p className="text-sm text-gray-600">AI-verified accuracy and relevance</p>
                </div>
              </div>

              {!isGenerating && (
                <div className="flex justify-center">
                  <Button 
                    onClick={generateTestSeries} 
                    size="lg" 
                    className="px-8 bg-indigo-600 hover:bg-indigo-700"
                    disabled={totalWeightage !== 100 || testSeriesData.topics.length === 0 || !testSeriesData.title}
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Start AI Generation
                  </Button>
                </div>
              )}

              {isGenerating && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 animate-pulse" />
                      Generating Test Series...
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{currentGenerationStep}</span>
                        <span>{Math.round(generationProgress)}%</span>
                      </div>
                      <Progress value={generationProgress} className="h-3" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveDraft}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
        </div>

        <div className="flex gap-2">
          {activeStep !== "generate" && (
            <Button
              onClick={() => setActiveStep("generate")}
              disabled={totalWeightage !== 100 || testSeriesData.topics.length === 0}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Go to Generation
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 