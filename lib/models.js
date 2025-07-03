// Database schema definitions and helper functions
export const UserSchema = {
  _id: "ObjectId",
  email: "string",
  name: "string",
  role: "educator | learner",
  // Premium subscription fields
  subscription: {
    plan: "free | premium | pro", // Subscription tier
    status: "active | inactive | expired | trial", // Subscription status
    startDate: "Date", // When subscription started
    endDate: "Date", // When subscription expires (null for lifetime)
    features: {
      aiTutor: "boolean", // Access to AI tutor
      quizGeneration: "boolean", // Access to quiz generation
      getMoreDetails: "boolean", // Access to detailed content expansion
      unlimitedCourses: "boolean", // Unlimited course access
      prioritySupport: "boolean", // Priority customer support
    }
  },
  createdAt: "Date",
  updatedAt: "Date",
}

export const CourseSchema = {
  _id: "ObjectId",
  title: "string",
  description: "string",
  educatorId: "ObjectId",
  category: "string",
  level: "beginner | intermediate | advanced",
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
  enrollmentCount: "number",
  rating: "number",
  totalRatings: "number",
  createdAt: "Date",
  updatedAt: "Date",
}

export const EnrollmentSchema = {
  _id: "ObjectId",
  learnerId: "ObjectId",
  courseId: "ObjectId",
  enrolledAt: "Date",
  progress: "number",
  status: "active | completed | dropped",
  completedAt: "Date",
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

// Utility functions for premium feature checking
export const checkPremiumFeature = (user, feature) => {
  if (!user || !user.subscription) {
    return false // No subscription means no premium features
  }
  
  const { subscription } = user
  
  // Check if subscription is active
  if (subscription.status !== 'active' && subscription.status !== 'trial') {
    return false
  }
  
  // Check if subscription hasn't expired
  if (subscription.endDate && new Date() > new Date(subscription.endDate)) {
    return false
  }
  
  // Check specific feature access
  return subscription.features?.[feature] === true
}

export const getSubscriptionPlan = (user) => {
  if (!user || !user.subscription) {
    return 'free'
  }
  return user.subscription.plan || 'free'
}

export const isActiveSubscriber = (user) => {
  if (!user || !user.subscription) {
    return false
  }
  
  const { subscription } = user
  if (subscription.status !== 'active' && subscription.status !== 'trial') {
    return false
  }
  
  if (subscription.endDate && new Date() > new Date(subscription.endDate)) {
    return false
  }
  
  return true
}

// Default premium feature settings for different plans
export const PremiumPlans = {
  free: {
    plan: 'free',
    features: {
      aiTutor: false,
      quizGeneration: false,
      getMoreDetails: false,
      unlimitedCourses: false,
      prioritySupport: false,
    }
  },
  premium: {
    plan: 'premium',
    features: {
      aiTutor: true,
      quizGeneration: true,
      getMoreDetails: true,
      unlimitedCourses: true,
      prioritySupport: false,
    }
  },
  pro: {
    plan: 'pro',
    features: {
      aiTutor: true,
      quizGeneration: true,
      getMoreDetails: true,
      unlimitedCourses: true,
      prioritySupport: true,
    }
  }
}
