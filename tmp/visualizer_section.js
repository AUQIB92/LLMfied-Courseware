{/* Interactive Visualizers Section */}
{module.visualizers && module.visualizers.length > 0 && (
  <motion.div key={`interactive-visualizers-${module.id}`} variants={itemVariants}>
    <div className="relative">
      {/* Enhanced background blur effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-pink-600/10 rounded-3xl blur-3xl"></div>
      
      <Card className="relative border-0 bg-gradient-to-br from-indigo-50/90 via-purple-50/90 to-pink-50/90 shadow-2xl overflow-hidden backdrop-blur-sm">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/30 to-purple-100/30"></div>
          <motion.div
            className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-2xl"
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
          <motion.div
            className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-2xl"
            animate={{ rotate: -360, scale: [1.1, 1, 1.1] }}
            transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
        </div>

        <CardHeader className="relative z-10 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-b border-indigo-200/50 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                className="w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <BarChart3 className="h-8 w-8 text-white" />
              </motion.div>
              
              <div>
                <CardTitle className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 bg-clip-text text-transparent mb-2">
                  Interactive Visualizers
                </CardTitle>
                <CardDescription className="text-indigo-700 text-lg font-medium">
                  Visual learning tools to help you understand complex concepts
                </CardDescription>
              </div>
            </div>
            
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-lg px-4 py-2 text-sm font-bold">
                <Sparkles className="h-4 w-4 mr-2" />
                {module.visualizers.length} Visualizer{module.visualizers.length !== 1 ? 's' : ''}
              </Badge>
            </motion.div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 p-8">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {module.visualizers.map((visualizer, index) => (
              <motion.div
                key={`visualizer-${visualizer.id || index}`}
                variants={itemVariants}
                className="group"
              >
                <Card className="bg-gradient-to-br from-white/80 via-indigo-50/50 to-purple-50/50 border-2 border-indigo-200/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between text-lg">
                      <div className="flex items-center gap-3">
                        <motion.div
                          className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white group-hover:scale-110 transition-transform duration-300"
                          whileHover={{ rotate: 5 }}
                        >
                          {visualizer.type === 'flowchart' && <GitBranch className="h-5 w-5" />}
                          {visualizer.type === 'comparison' && <BarChart3 className="h-5 w-5" />}
                          {visualizer.type === 'timeline' && <Clock className="h-5 w-5" />}
                          {visualizer.type === 'formula' && <Calculator className="h-5 w-5" />}
                          {visualizer.type === 'process' && <TrendingUp className="h-5 w-5" />}
                          {visualizer.type === 'hierarchy' && <Layers className="h-5 w-5" />}
                          {visualizer.type === 'relationship' && <Network className="h-5 w-5" />}
                          {visualizer.type === 'simulation' && <Zap className="h-5 w-5" />}
                          {!visualizer.type && <BarChart3 className="h-5 w-5" />}
                        </motion.div>
                        <div>
                          <span className="text-indigo-800 font-semibold group-hover:text-indigo-900 transition-colors">
                            {visualizer.title || `${visualizer.type || 'Interactive'} Visualizer`}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs bg-white/80 border-indigo-300 text-indigo-700">
                              {visualizer.type || 'interactive'}
                            </Badge>
                            {visualizer.difficulty && (
                              <Badge variant="outline" className="text-xs bg-white/80 border-purple-300 text-purple-700">
                                {visualizer.difficulty}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Concept Display */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-indigo-800">Concept:</p>
                      <p className="text-sm text-gray-700 bg-white/60 p-3 rounded-lg border border-indigo-100">
                        {visualizer.concept}
                      </p>
                    </div>
                    
                    {/* Description */}
                    {visualizer.description && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-indigo-800">What you'll learn:</p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {visualizer.description}
                        </p>
                      </div>
                    )}

                    {/* Learning Objectives */}
                    {visualizer.learningObjectives && visualizer.learningObjectives.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-indigo-800 flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          Learning Goals:
                        </p>
                        <div className="space-y-1">
                          {visualizer.learningObjectives.slice(0, 2).map((objective, objIndex) => (
                            <div key={objIndex} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0"></div>
                              <p className="text-xs text-gray-600 leading-relaxed">{objective}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Interactive Elements Preview */}
                    {visualizer.interactiveElements && visualizer.interactiveElements.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-indigo-800 flex items-center gap-1">
                          <Sparkles className="h-4 w-4" />
                          Interactive Features:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {visualizer.interactiveElements.slice(0, 3).map((element, elemIndex) => (
                            <Badge
                              key={elemIndex}
                              className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200"
                            >
                              {element.element || element}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Time Estimate */}
                    {visualizer.estimatedTime && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span>{visualizer.estimatedTime}</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t border-indigo-100">
                      <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium text-sm"
                          onClick={() => {
                            // TODO: Open visualizer in modal or new section
                            alert(`🎯 Opening ${visualizer.title || 'Interactive Visualizer'}!\n\nThis will display the interactive visualization to help you understand:\n"${visualizer.concept}"\n\n✨ Feature coming soon!`)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Open Visualizer
                        </Button>
                      </motion.div>
                      
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                          onClick={() => {
                            if (visualizer.explanation) {
                              alert(`📚 About this visualizer:\n\n${visualizer.explanation}`)
                            } else {
                              alert(`ℹ️ This ${visualizer.type || 'interactive'} visualizer helps you understand "${visualizer.concept}" through visual and interactive learning.`)
                            }
                          }}
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </div>
  </motion.div>
)} 