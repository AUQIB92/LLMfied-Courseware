// Database schema definitions and helper functions
export const UserSchema = {
  _id: "ObjectId",
  email: "string",
  name: "string",
  role: "educator | learner",
  createdAt: "Date",
  updatedAt: "Date",
}

export const CourseSchema = {
  _id: "ObjectId",
  title: "string",
  description: "string",
  educatorId: "ObjectId",
  modules: [
    {
      id: "string",
      title: "string",
      content: "string",
      summary: "string",
      resources: [
        {
          type: "video | article | pdf | note",
          title: "string",
          url: "string",
          description: "string",
        },
      ],
      order: "number",
    },
  ],
  status: "draft | published",
  createdAt: "Date",
  updatedAt: "Date",
}

export const ProgressSchema = {
  _id: "ObjectId",
  learnerId: "ObjectId",
  courseId: "ObjectId",
  moduleProgress: [
    {
      moduleId: "string",
      completed: "boolean",
      timeSpent: "number",
      quizScores: ["number"],
      lastAccessed: "Date",
    },
  ],
  overallProgress: "number",
  createdAt: "Date",
  updatedAt: "Date",
}

export const ChatSessionSchema = {
  _id: "ObjectId",
  learnerId: "ObjectId",
  courseId: "ObjectId",
  moduleId: "string",
  messages: [
    {
      role: "user | assistant",
      content: "string",
      timestamp: "Date",
    },
  ],
  createdAt: "Date",
  updatedAt: "Date",
}
