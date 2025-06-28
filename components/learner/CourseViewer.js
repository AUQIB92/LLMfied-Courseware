"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Brain, Upload, FileText, Download, Sparkles } from "lucide-react"
import ModuleContent from "./ModuleContent"
import AITutor from "./AITutor"

export default function CourseViewer({ course, onBack }) {
  const [selectedModule, setSelectedModule] = useState(null)
  const [showTutor, setShowTutor] = useState(false)
  const [progress, setProgress] = useState({ moduleProgress: [], overallProgress: 0 })
  const [uploadingContent, setUploadingContent] = useState(false)
  const [processedContent, setProcessedContent] = useState(null)
  const [showContentUpload, setShowContentUpload] = useState(false)
  const { getAuthHeaders } = useAuth()

  useEffect(() => {
    fetchProgress()
    if (course.modules && course.modules.length > 0) {
      setSelectedModule(course.modules[0])
    }
  }, [course])

  const fetchProgress = async () => {
    try {
      const response = await fetch(`/api/progress?courseId=${course._id}`, {
        headers: getAuthHeaders(),
      })
      const data = await response.json()
      setProgress(data)
    } catch (error) {
      console.error("Failed to fetch progress:", error)
    }
  }

  const updateProgress = async (moduleId, completed, timeSpent) => {
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          courseId: course._id,
          moduleId,
          completed,
          timeSpent,
        }),
      })
      fetchProgress()
    } catch (error) {
      console.error("Failed to update progress:", error)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingContent(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('courseId', course._id)
    formData.append('moduleId', selectedModule?.id || '')

    try {
      const response = await fetch('/api/upload/content', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setProcessedContent(data.processedContent)
        alert(`Successfully processed ${data.fileName}! The content has been analyzed and simplified explanations are now available.`)
      } else {
        const errorData = await response.json()
        alert(`Failed to process file: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error uploading content:', error)
      alert('Error uploading content. Please try again.')
    } finally {
      setUploadingContent(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const getModuleProgress = (moduleId) => {
    const moduleProgress = progress.moduleProgress.find((p) => p.moduleId === moduleId)
    return moduleProgress || { completed: false, timeSpent: 0, quizScores: [] }
  }

  if (!selectedModule) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{course.title}</CardTitle>
            <CardDescription>{course.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Loading course content...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar */}
      <div className="lg:col-span-1 space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{course.title}</CardTitle>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{Math.round(progress.overallProgress || 0)}%</span>
              </div>
              <Progress value={progress.overallProgress || 0} />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {course.modules?.map((module, index) => {
              const moduleProgress = getModuleProgress(module.id)
              return (
                <button
                  key={module.id}
                  onClick={() => setSelectedModule(module)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedModule?.id === module.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">
                        Module {index + 1}: {module.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {moduleProgress.completed && (
                          <Badge variant="default" className="text-xs">
                            Completed
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">{Math.floor(moduleProgress.timeSpent / 60)}min</span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </CardContent>
        </Card>

        <Button onClick={() => setShowTutor(!showTutor)} className="w-full" variant={showTutor ? "default" : "outline"}>
          <Brain className="h-4 w-4 mr-2" />
          AI Tutor
        </Button>

        {/* Content Upload Section */}
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-purple-800">
              <Sparkles className="h-5 w-5" />
              AI Content Processor
            </CardTitle>
            <CardDescription className="text-purple-600 text-sm">
              Upload MD/PDF files to get simplified explanations of all concepts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <label className="block">
                <Button
                  variant="outline"
                  className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 cursor-pointer"
                  disabled={uploadingContent}
                  asChild
                >
                  <span>
                    {uploadingContent ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Learning Material
                      </>
                    )}
                    <input
                      type="file"
                      accept=".md,.txt,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploadingContent}
                    />
                  </span>
                </Button>
              </label>
              <p className="text-xs text-purple-600 text-center">
                Supports: .md, .txt files (PDF coming soon)
              </p>
              <div className="text-center">
                <a 
                  href="/sample-ml-content.md" 
                  download
                  className="text-xs text-purple-500 hover:text-purple-700 underline block mb-2"
                >
                  📄 Download basic ML content sample
                </a>
                <a 
                  href="/comprehensive-ml-guide.md" 
                  download
                  className="text-xs text-purple-500 hover:text-purple-700 underline block"
                >
                  📚 Download comprehensive ML guide
                </a>
              </div>
            </div>

            {processedContent && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Content Processed Successfully!</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-green-700">
                    <span className="font-medium">{processedContent.concepts?.length || 0}</span> concepts identified
                    {processedContent.estimatedTotalTime && (
                      <span className="ml-2">• <span className="font-medium">{processedContent.estimatedTotalTime}</span> study time</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {processedContent.overallDifficulty && (
                      <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                        {processedContent.overallDifficulty}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-green-300 text-green-700 hover:bg-green-50"
                  onClick={() => setShowContentUpload(!showContentUpload)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  {showContentUpload ? 'Hide' : 'View'} Processed Content
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="lg:col-span-3 space-y-6">
        {/* Processed Content Display */}
        {showContentUpload && processedContent && (
          <ProcessedContentDisplay content={processedContent} />
        )}
        
        <ModuleContent
          module={selectedModule}
          course={course}
          onProgressUpdate={updateProgress}
          moduleProgress={getModuleProgress(selectedModule.id)}
        />

        {showTutor && <AITutor course={course} module={selectedModule} onClose={() => setShowTutor(false)} />}
      </div>
    </div>
  )
}

// Processed Content Display Component
function ProcessedContentDisplay({ content }) {
  const [expandedConcept, setExpandedConcept] = useState(null)
  const [showVisualizer, setShowVisualizer] = useState({})

  if (!content || content.error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">⚠</span>
            </div>
            <div>
              <h4 className="font-semibold text-red-800">Processing Error</h4>
              <p className="text-red-600 text-sm">
                {content?.error || 'Error displaying processed content'}
              </p>
            </div>
          </div>
          {content?.rawResponse && (
            <details className="mt-4">
              <summary className="text-red-700 text-sm cursor-pointer hover:text-red-800">
                View raw response for debugging
              </summary>
              <pre className="mt-2 p-3 bg-red-100 rounded text-xs text-red-800 overflow-x-auto">
                {content.rawResponse}
              </pre>
            </details>
          )}
          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-blue-800 text-sm">
              <strong>💡 Tip:</strong> Try uploading the content again, or use one of our sample files to test the feature.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const toggleVisualizer = (conceptId) => {
    setShowVisualizer(prev => ({
      ...prev,
      [conceptId]: !prev[conceptId]
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-3">
            <Sparkles className="h-6 w-6" />
            {content.title}
          </CardTitle>
          <CardDescription className="text-purple-100 text-lg">
            {content.summary}
          </CardDescription>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="secondary" className="bg-white/20 text-white">
              <Sparkles className="h-3 w-3 mr-1" />
              {content.concepts?.length || 0} Concepts
            </Badge>
            {content.overallDifficulty && (
              <Badge variant="secondary" className="bg-white/20 text-white">
                📊 {content.overallDifficulty} Level
              </Badge>
            )}
            {content.estimatedTotalTime && (
              <Badge variant="secondary" className="bg-white/20 text-white">
                ⏱️ {content.estimatedTotalTime} Study Time
              </Badge>
            )}
            {content.processingMethod && (
              <Badge variant="secondary" className="bg-white/10 text-purple-100 text-xs">
                🤖 AI Enhanced
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Learning Objectives */}
      {content.learningObjectives && content.learningObjectives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Brain className="h-5 w-5" />
              Learning Objectives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {content.learningObjectives.map((objective, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <span className="text-blue-800 leading-relaxed">{objective}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Concepts */}
      {content.concepts && content.concepts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="h-6 w-6 text-purple-600" />
            Simplified Concept Explanations
          </h3>
          
          {content.concepts.map((concept, index) => (
            <Card 
              key={concept.id || index} 
              className={`transition-all duration-300 hover:shadow-lg ${
                concept.importance === 'high' ? 'border-red-200 bg-red-50/30' :
                concept.importance === 'medium' ? 'border-yellow-200 bg-yellow-50/30' :
                'border-gray-200'
              }`}
            >
              <CardHeader className="cursor-pointer" onClick={() => 
                setExpandedConcept(expandedConcept === concept.id ? null : concept.id)
              }>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      concept.importance === 'high' ? 'bg-red-500' :
                      concept.importance === 'medium' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{concept.name}</CardTitle>
                      <div className="flex gap-2 mt-1">
                        <Badge variant={concept.difficulty === 'beginner' ? 'default' : 
                                     concept.difficulty === 'intermediate' ? 'secondary' : 'destructive'}>
                          {concept.difficulty}
                        </Badge>
                        <Badge variant="outline">{concept.category}</Badge>
                        <Badge variant="outline">{concept.estimatedStudyTime}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {concept.visualizable && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleVisualizer(concept.id)
                        }}
                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        <Brain className="h-4 w-4 mr-1" />
                        {showVisualizer[concept.id] ? 'Hide' : 'Visualize'}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        // TODO: Implement concept regeneration
                        console.log('Regenerate concept:', concept.id)
                      }}
                      className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      title="Regenerate this concept explanation"
                    >
                      <span className="text-sm">🔄</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {expandedConcept === concept.id && (
                <CardContent className="space-y-6">
                  {/* Simplified Explanation */}
                  {concept.simplifiedExplanation && (
                    <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                      <h4 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Simple Explanation
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-semibold text-green-700 mb-2">Definition:</h5>
                          <p className="text-green-800">{concept.simplifiedExplanation.definition}</p>
                        </div>
                        {concept.simplifiedExplanation.analogy && (
                          <div>
                            <h5 className="font-semibold text-green-700 mb-2">Think of it like:</h5>
                            <p className="text-green-800 italic">{concept.simplifiedExplanation.analogy}</p>
                          </div>
                        )}
                        {concept.simplifiedExplanation.example && (
                          <div>
                            <h5 className="font-semibold text-green-700 mb-2">Example:</h5>
                            <p className="text-green-800">{concept.simplifiedExplanation.example}</p>
                          </div>
                        )}
                        {concept.simplifiedExplanation.whyItMatters && (
                          <div>
                            <h5 className="font-semibold text-green-700 mb-2">Why it matters:</h5>
                            <p className="text-green-800">{concept.simplifiedExplanation.whyItMatters}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Detailed Explanation */}
                  {concept.detailedExplanation && (
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                      <h4 className="font-bold text-blue-800 mb-3">Detailed Explanation:</h4>
                      <p className="text-blue-800 leading-relaxed">{concept.detailedExplanation}</p>
                    </div>
                  )}

                  {/* Code Example */}
                  {concept.codeExample && (
                    <div className="bg-gray-900 p-6 rounded-xl">
                      <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Code Example:
                      </h4>
                      <pre className="text-green-400 text-sm overflow-x-auto">
                        <code>{concept.codeExample}</code>
                      </pre>
                    </div>
                  )}

                  {/* Key Points */}
                  {concept.keyPoints && concept.keyPoints.length > 0 && (
                    <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                      <h4 className="font-bold text-yellow-800 mb-3">Key Points:</h4>
                      <ul className="space-y-2">
                        {concept.keyPoints.map((point, pointIndex) => (
                          <li key={pointIndex} className="flex items-start gap-2 text-yellow-800">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Common Mistakes */}
                  {concept.commonMistakes && concept.commonMistakes.length > 0 && (
                    <div className="bg-red-50 p-6 rounded-xl border border-red-200">
                      <h4 className="font-bold text-red-800 mb-3">Common Mistakes to Avoid:</h4>
                      <ul className="space-y-2">
                        {concept.commonMistakes.map((mistake, mistakeIndex) => (
                          <li key={mistakeIndex} className="flex items-start gap-2 text-red-800">
                            <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                            {mistake}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Practice Questions */}
                  {concept.practiceQuestions && concept.practiceQuestions.length > 0 && (
                    <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                      <h4 className="font-bold text-purple-800 mb-3">Practice Questions:</h4>
                      <ol className="space-y-2">
                        {concept.practiceQuestions.map((question, questionIndex) => (
                          <li key={questionIndex} className="flex items-start gap-3 text-purple-800">
                            <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {questionIndex + 1}
                            </span>
                            {question}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Visualizer */}
                  {showVisualizer[concept.id] && (
                    <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200">
                      <h4 className="font-bold text-indigo-800 mb-3 flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Interactive Visualizer
                      </h4>
                      <p className="text-indigo-700 text-center py-8">
                        🎨 Visualizer for "{concept.name}" would be generated here based on the concept type and content.
                      </p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Additional Resources */}
      {content.additionalResources && content.additionalResources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <FileText className="h-5 w-5" />
              Additional Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {content.additionalResources.map((resource, index) => (
                <div key={index} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h5 className="font-semibold text-purple-800">{resource.title}</h5>
                  <p className="text-purple-700 text-sm mt-1">{resource.description}</p>
                  <Badge variant="outline" className="mt-2">{resource.type}</Badge>
                  {resource.url && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2 w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                      asChild
                    >
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        Open Resource
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
