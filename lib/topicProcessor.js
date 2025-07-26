/**
 * Utility functions for processing topics and subtopics for test series generation
 */

/**
 * Process and normalize topic data for question generation
 * @param {Array} rawTopics - Raw topics from the frontend
 * @param {object} config - Configuration object with subject, difficulty, etc.
 * @returns {Array} - Processed topics with normalized structure
 */
export function processTopicsForGeneration(rawTopics, config) {
  return rawTopics.map((topic) => ({
    id: generateTopicId(topic.name),
    name: topic.name.trim(),
    weightage: parseFloat(topic.weightage) || 0,
    subtopics: processSubtopics(topic.subtopics || []),
    config: {
      subject: config.subject,
      difficulty: config.difficulty,
      marksPerQuestion: config.marksPerQuestion,
    },
    metadata: {
      originalData: topic,
      processedAt: new Date(),
    },
  }));
}

/**
 * Process and normalize subtopic data
 * @param {Array} rawSubtopics - Raw subtopics array
 * @returns {Array} - Processed subtopics with normalized structure
 */
export function processSubtopics(rawSubtopics) {
  return rawSubtopics
    .filter((subtopic) => subtopic && subtopic.trim())
    .map((subtopic, index) => ({
      id: generateSubtopicId(subtopic),
      name: subtopic.trim(),
      index: index,
      slug: createSlug(subtopic),
      keywords: extractKeywords(subtopic),
    }));
}

/**
 * Create atomic question generation tasks with intelligent batching
 * @param {Array} processedTopics - Topics processed by processTopicsForGeneration
 * @param {object} testConfig - Test configuration (totalQuestions, numericalPercentage, etc.)
 * @returns {Array} - Array of atomic question generation tasks
 */
export function createQuestionGenerationTasks(processedTopics, testConfig) {
  const tasks = [];
  const totalQuestionsNeeded =
    testConfig.totalTests * testConfig.questionsPerTest;

  // ATOMIC GENERATION CONFIG - Break into smallest possible units
  const ATOMIC_BATCH_SIZE = 2; // Generate 2 questions at a time for maximum success
  const MAX_BATCH_SIZE = 3; // Never exceed 3 questions per API call

  console.log(
    `🔬 ATOMIC GENERATION: Breaking ${totalQuestionsNeeded} questions into atomic units`
  );

  for (const topic of processedTopics) {
    const topicQuestionsCount = Math.ceil(
      (totalQuestionsNeeded * topic.weightage) / 100
    );
    const questionsPerSubtopic = Math.ceil(
      topicQuestionsCount / topic.subtopics.length
    );

    for (const subtopic of topic.subtopics) {
      const subtopicQuestionCount = Math.min(
        questionsPerSubtopic,
        Math.max(1, topicQuestionsCount)
      );

      // Split into numerical and theoretical
      const numericalCount = Math.round(
        (subtopicQuestionCount * testConfig.numericalPercentage) / 100
      );
      const theoreticalCount = subtopicQuestionCount - numericalCount;

      // Break numerical questions into atomic batches
      if (numericalCount > 0) {
        const numericalBatches = createAtomicBatches(
          numericalCount,
          ATOMIC_BATCH_SIZE,
          MAX_BATCH_SIZE
        );
        for (let i = 0; i < numericalBatches.length; i++) {
          tasks.push(
            createQuestionTask(
              topic,
              subtopic,
              "numerical",
              numericalBatches[i],
              testConfig,
              i + 1, // batch number
              numericalBatches.length // total batches
            )
          );
        }
      }

      // Break theoretical questions into atomic batches
      if (theoreticalCount > 0) {
        const theoreticalBatches = createAtomicBatches(
          theoreticalCount,
          ATOMIC_BATCH_SIZE,
          MAX_BATCH_SIZE
        );
        for (let i = 0; i < theoreticalBatches.length; i++) {
          tasks.push(
            createQuestionTask(
              topic,
              subtopic,
              "theoretical",
              theoreticalBatches[i],
              testConfig,
              i + 1, // batch number
              theoreticalBatches.length // total batches
            )
          );
        }
      }
    }
  }

  console.log(
    `🧪 Generated ${tasks.length} atomic tasks (avg ${(
      totalQuestionsNeeded / tasks.length
    ).toFixed(1)} questions per task)`
  );
  return tasks;
}

/**
 * Create atomic batches from a total count using intelligent distribution
 * @param {number} totalCount - Total questions needed
 * @param {number} preferredSize - Preferred atomic batch size
 * @param {number} maxSize - Maximum allowed batch size
 * @returns {Array} - Array of batch sizes
 */
function createAtomicBatches(totalCount, preferredSize, maxSize) {
  const batches = [];
  let remaining = totalCount;

  while (remaining > 0) {
    let batchSize;

    if (remaining <= maxSize) {
      // If remaining is small enough, take it all
      batchSize = remaining;
    } else if (remaining <= preferredSize * 2) {
      // If close to preferred size, split evenly
      batchSize = Math.ceil(remaining / 2);
    } else {
      // Use preferred size
      batchSize = preferredSize;
    }

    batches.push(batchSize);
    remaining -= batchSize;
  }

  return batches;
}

/**
 * Create a single atomic question generation task
 * @param {object} topic - Processed topic object
 * @param {object} subtopic - Processed subtopic object
 * @param {string} type - 'numerical' or 'theoretical'
 * @param {number} count - Number of questions to generate (atomic batch size)
 * @param {object} config - Test configuration
 * @param {number} batchNumber - Current batch number (1-based)
 * @param {number} totalBatches - Total number of batches for this subtopic/type
 * @returns {object} - Atomic question generation task
 */
function createQuestionTask(
  topic,
  subtopic,
  type,
  count,
  config,
  batchNumber = 1,
  totalBatches = 1
) {
  const atomicId = `${topic.id}_${subtopic.id}_${type}_batch${batchNumber}`;

  return {
    id: atomicId,
    topicName: topic.name,
    topicId: topic.id,
    subtopicName: subtopic.name,
    subtopicId: subtopic.id,
    questionType: type,
    questionCount: count,
    subject: topic.config.subject,
    difficulty: topic.config.difficulty,
    marksPerQuestion: topic.config.marksPerQuestion,

    // Atomic batch information
    batchInfo: {
      batchNumber: batchNumber,
      totalBatches: totalBatches,
      isAtomic: true,
      batchSize: count,
    },

    // Parameters for prompt generation
    promptParams: {
      subtopicQuestionCount: count,
      subject: topic.config.subject,
      topicName: topic.name,
      subtopic: subtopic.name,
      type: type,
      difficulty: topic.config.difficulty,
      marksPerQuestion: topic.config.marksPerQuestion,
      attempt: 1, // Will be updated during generation
    },

    // Metadata for tracking and reconstruction
    metadata: {
      createdAt: new Date(),
      topicWeightage: topic.weightage,
      subtopicIndex: subtopic.index,
      keywords: subtopic.keywords,
      atomicGeneration: true,
      batchContext: `${batchNumber}/${totalBatches}`,
      groupId: `${topic.id}_${subtopic.id}_${type}`, // For reconstruction
    },
  };
}

/**
 * Generate a unique ID for a topic
 * @param {string} topicName - Name of the topic
 * @returns {string} - Generated topic ID
 */
function generateTopicId(topicName) {
  return `topic_${createSlug(topicName)}_${Date.now()}`;
}

/**
 * Generate a unique ID for a subtopic
 * @param {string} subtopicName - Name of the subtopic
 * @returns {string} - Generated subtopic ID
 */
function generateSubtopicId(subtopicName) {
  return `subtopic_${createSlug(subtopicName)}_${Date.now()}`;
}

/**
 * Create a URL-friendly slug from text
 * @param {string} text - Text to convert to slug
 * @returns {string} - URL-friendly slug
 */
function createSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Extract keywords from subtopic name for better categorization
 * @param {string} subtopicName - Name of the subtopic
 * @returns {Array} - Array of keywords
 */
function extractKeywords(subtopicName) {
  // Common stop words to filter out
  const stopWords = [
    "and",
    "or",
    "the",
    "a",
    "an",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
  ];

  return subtopicName
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // Replace special chars with spaces
    .split(/\s+/) // Split on whitespace
    .filter((word) => word.length > 2 && !stopWords.includes(word))
    .slice(0, 5); // Limit to 5 keywords
}

/**
 * Validate processed topics before question generation
 * @param {Array} processedTopics - Processed topics array
 * @returns {object} - Validation result { isValid: boolean, errors: string[] }
 */
export function validateProcessedTopics(processedTopics) {
  const errors = [];

  if (!Array.isArray(processedTopics) || processedTopics.length === 0) {
    errors.push("No topics provided");
    return { isValid: false, errors };
  }

  // Validate total weightage
  const totalWeightage = processedTopics.reduce(
    (sum, topic) => sum + topic.weightage,
    0
  );
  if (Math.abs(totalWeightage - 100) > 0.01) {
    errors.push(`Total weightage is ${totalWeightage}%, must be 100%`);
  }

  // Validate individual topics
  processedTopics.forEach((topic, index) => {
    if (!topic.name || !topic.name.trim()) {
      errors.push(`Topic ${index + 1} has no name`);
    }

    if (topic.weightage <= 0) {
      errors.push(
        `Topic "${topic.name}" has invalid weightage: ${topic.weightage}`
      );
    }

    if (!topic.subtopics || topic.subtopics.length === 0) {
      errors.push(`Topic "${topic.name}" has no subtopics`);
    }

    // Validate subtopics
    topic.subtopics?.forEach((subtopic, subIndex) => {
      if (!subtopic.name || !subtopic.name.trim()) {
        errors.push(
          `Topic "${topic.name}" subtopic ${subIndex + 1} has no name`
        );
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get summary statistics for processed topics
 * @param {Array} processedTopics - Processed topics array
 * @returns {object} - Summary statistics
 */
export function getTopicsSummary(processedTopics) {
  const totalSubtopics = processedTopics.reduce(
    (sum, topic) => sum + topic.subtopics.length,
    0
  );
  const averageSubtopicsPerTopic = totalSubtopics / processedTopics.length;

  return {
    totalTopics: processedTopics.length,
    totalSubtopics,
    averageSubtopicsPerTopic: Math.round(averageSubtopicsPerTopic * 100) / 100,
    weightageDistribution: processedTopics.map((topic) => ({
      name: topic.name,
      weightage: topic.weightage,
    })),
  };
}
