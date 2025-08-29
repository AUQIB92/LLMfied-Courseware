﻿﻿﻿﻿﻿﻿"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import enrollmentCache from "@/lib/enrollmentCache";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Clock,
  Trophy,
  TrendingUp,
  LogOut,
  User,
  Settings,
  Bell,
  ChevronDown,
  Star,
  Calendar,
  Target,
  Award,
  Zap,
  BookMarked,
  Play,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Camera,
  Upload,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Globe,
  Save,
  Shield,
  GraduationCap,
  Bookmark,
  FileQuestion,
} from "lucide-react";
import CourseLibrary from "./CourseLibrary";
import {
  AcademicCourseLibrary,
  AcademicCourseViewer,
} from "../Acadmeic-Course";
import TestSeriesLibrary from "./TestSeriesLibrary";
import TestSeriesViewer from "./TestSeriesViewer";
import CourseViewer from "./CourseViewer";
import ExamGeniusCourseViewer from "./ExamGeniusCourseViewer";
import ProfileSettingsForm from "@/components/profile/ProfileSettingsForm";
import PreferencesSettings from "@/components/profile/PreferencesSettings";
import NotificationsSettings from "@/components/profile/NotificationsSettings";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import LearnerAssignmentList from "@/components/learner/LearnerAssignmentList";
import LearnerAssignmentViewer from "@/components/learner/LearnerAssignmentViewer";

export default function LearnerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedAcademicCourse, setSelectedAcademicCourse] = useState(null);
  const [selectedTestSeries, setSelectedTestSeries] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [enrolledAcademicCourses, setEnrolledAcademicCourses] = useState([]);
  const [enrolledTestSeries, setEnrolledTestSeries] = useState([]);
  const [enrollmentDataLoaded, setEnrollmentDataLoaded] = useState(false); // Track if enrollment data is loaded
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [avatarKey, setAvatarKey] = useState(Date.now());
  const [hideHeader, setHideHeader] = useState(false); // For hiding header when viewing modules
  const [isHeaderVisible, setIsHeaderVisible] = useState(true); // For scroll-based header visibility (auto-hide on scroll down)
  const [lastScrollY, setLastScrollY] = useState(0); // Track scroll position for header visibility
  const [enrollmentUpdated, setEnrollmentUpdated] = useState(0); // Counter to trigger enrollment refresh
  const [stats, setStats] = useState({
    coursesEnrolled: 0,
    coursesCompleted: 0,
    totalTimeSpent: 0,
    averageScore: 0,
    streak: 7,
    certificates: 3,
  });
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const {
    user,
    getAuthHeaders,
    getAuthHeadersValidated,
    apiCall,
    logout,
    updateUser,
  } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchEnrolledCourses();
    fetchEnrolledAcademicCourses();
    fetchStats();
    fetchAssignments();
    fetchSubmissions();
  }, []);

  // Enhanced useEffect to instantly update enrolled courses when enrollment changes
  useEffect(() => {
    if (enrollmentUpdated > 0) {
      fetchEnrolledCourses();
      fetchEnrolledAcademicCourses();
      fetchAssignments(); // Also refresh assignments when enrollment changes
    }
  }, [enrollmentUpdated]);

  // Listen for enrollment events across the app
  useEffect(() => {
    const handleEnrollmentEvent = (event) => {
      console.log("Enrollment event detected:", event.detail);
      setEnrollmentUpdated((prev) => prev + 1);
    };

    const handleUserUpdate = (event) => {
      console.log("User update event detected:", event.detail);
      // Update avatar key to force re-render of avatar components
      setAvatarKey(Date.now());
    };

    // Listen for custom enrollment events
    window.addEventListener("courseEnrolled", handleEnrollmentEvent);
    window.addEventListener("courseUnenrolled", handleEnrollmentEvent);
    // Listen for user update events
    window.addEventListener("userUpdated", handleUserUpdate);

    return () => {
      window.removeEventListener("courseEnrolled", handleEnrollmentEvent);
      window.removeEventListener("courseUnenrolled", handleEnrollmentEvent);
      window.removeEventListener("userUpdated", handleUserUpdate);
    };
  }, []);

  // Subscribe to enrollment cache updates
  useEffect(() => {
    const unsubscribe = enrollmentCache.subscribe((event, data) => {
      console.log(
        `📡 LearnerDashboard received enrollment event:`,
        event,
        data
      );

      switch (event) {
        case "enrollment_updated":
          // Refresh enrolled courses when enrollment changes
          fetchEnrolledCourses();
          fetchEnrolledAcademicCourses();
          fetchAssignments(); // Also refresh assignments
          break;
        case "enrollments_synced":
          // Refresh when bulk sync completes
          fetchEnrolledCourses();
          fetchEnrolledAcademicCourses();
          fetchAssignments(); // Also refresh assignments
          break;
      }
    });

    return unsubscribe;
  }, []);

  // Scroll event listener for header visibility
  useEffect(() => {
    // Don't add scroll listener if header is already hidden due to module view
    if (hideHeader) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Show header when at the top of the page
          if (currentScrollY < 10) {
            setIsHeaderVisible(true);
          }
          // Hide header when scrolling down past threshold, show when scrolling up
          else if (currentScrollY > lastScrollY && currentScrollY > 120) {
            setIsHeaderVisible(false);
          } else if (currentScrollY < lastScrollY - 5) {
            // Small threshold to prevent jitter
            setIsHeaderVisible(true);
          }

          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    // Add scroll event listener with throttling
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Cleanup
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, hideHeader]);

  const fetchEnrolledCourses = async () => {
    try {
      console.log("🚀 Fetching enrolled courses using API...");
      setEnrollmentDataLoaded(false); // Mark as loading

      // Fetch enrolled courses directly from API using enhanced authentication
      const response = await apiCall("/api/enrollment", {
        method: "GET",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("📡 API Response:", data);

        // Handle different response formats
        let coursesArray = [];

        if (data && Array.isArray(data.courses)) {
          // API returns courses directly
          coursesArray = data.courses || [];
        } else if (data && Array.isArray(data.enrollments)) {
          // API returns enrollments, need to fetch course details
          const courseIds = data.enrollments
            .map((e) => e.courseId)
            .filter(Boolean);

          if (courseIds.length > 0) {
            // Fetch course details for each enrolled course
            const coursePromises = courseIds.map(async (courseId) => {
              try {
                const courseResponse = await apiCall(
                  `/api/courses/${courseId}`,
                  {
                    method: "GET",
                  }
                );
                if (courseResponse.ok) {
                  const courseData = await courseResponse.json();
                  // Find corresponding enrollment data
                  const enrollment = data.enrollments.find(
                    (e) => e.courseId === courseId
                  );
                  return {
                    ...courseData,
                    enrolledAt:
                      enrollment?.enrolledAt || new Date().toISOString(),
                    progress: enrollment?.progress || 0,
                    isEnrolled: true, // Explicitly mark as enrolled
                  };
                }
                return null;
              } catch (error) {
                console.error(`Failed to fetch course ${courseId}:`, error);
                return null;
              }
            });

            const courseResults = await Promise.all(coursePromises);
            coursesArray = courseResults.filter(Boolean); // Remove null results
          }
        }

        // Ensure all courses in enrolled list are marked as enrolled
        coursesArray = coursesArray.map((course) => ({
          ...course,
          isEnrolled: true,
          enrollmentVerified: true, // Add verification flag
        }));

        console.log(
          "✅ Setting enrolled courses:",
          coursesArray?.length || 0,
          "courses"
        );
        setEnrolledCourses(coursesArray || []);

        // Update stats based on enrolled courses
        setStats((prev) => ({
          ...prev,
          coursesEnrolled: coursesArray?.length || 0,
          coursesCompleted:
            coursesArray?.filter((c) => c.completionRate === 100).length || 0,
        }));
      } else {
        const errorText = await response.text();
        console.error("Failed to fetch enrollments:", errorText);
        setEnrolledCourses([]);
      }
    } catch (error) {
      console.error("Failed to fetch enrolled courses:", error);

      // Check if it's a session expiration error
      if (
        error.message.includes("expired") ||
        error.message.includes("Session")
      ) {
        console.log("Session expired - user will be redirected to login");
        return;
      }

      setEnrolledCourses([]);
    } finally {
      // Always mark as loaded, even if there are no courses
      setEnrollmentDataLoaded(true);
      console.log("📊 Enrollment data loading completed");
    }
  };

  const fetchEnrolledAcademicCourses = async () => {
    try {
      console.log("🚀 Fetching enrolled academic courses using API...");
      
      const response = await apiCall("/api/academic-enrollment", {
        method: "GET",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("📚 Academic enrollment response:", data);
        
        const academicCoursesArray = Array.isArray(data?.enrollments) ? data.enrollments : [];
        console.log("✅ Setting enrolled academic courses:", academicCoursesArray?.length || 0, "courses");
        setEnrolledAcademicCourses(academicCoursesArray || []);
      } else {
        const errorText = await response.text();
        console.error("Failed to fetch academic enrollments:", errorText);
        setEnrolledAcademicCourses([]);
      }
    } catch (error) {
      console.error("Failed to fetch enrolled academic courses:", error);
      setEnrolledAcademicCourses([]);
    }
  };

  const fetchStats = async () => {
    try {
      // Use the enhanced API call wrapper with automatic token handling
      const response = await apiCall("/api/stats?type=learner", {
        method: "GET",
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        const errorText = await response.text();
        console.error("Failed to fetch stats:", errorText);
        // Fallback to default stats if API fails
        setStats({
          coursesEnrolled: 0,
          coursesCompleted: 0,
          totalTimeSpent: 0,
          averageScore: 0,
          streak: 0,
          certificates: 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);

      // Check if it's a session expiration error
      if (
        error.message.includes("expired") ||
        error.message.includes("Session")
      ) {
        // The apiCall wrapper already handles this, so just log it
        console.log("Session expired - user will be redirected to login");
        return;
      }

      // Fallback to default stats if API fails
      setStats({
        coursesEnrolled: 0,
        coursesCompleted: 0,
        totalTimeSpent: 0,
        averageScore: 0,
        streak: 0,
        certificates: 0,
      });
    }
  };

  const fetchAssignments = async () => {
    try {
      console.log("🚀 Fetching published assignments for learner...");
      console.log("👥 Current user:", { id: user?.id || user?._id, role: user?.role, name: user?.name });
      console.log("🔑 Auth headers check:", getAuthHeaders ? 'getAuthHeaders available' : 'getAuthHeaders missing');
      
      // Check if user is authenticated and has valid token
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
      if (!user || !user.id || !token) {
        console.warn("⚠️ No authenticated user or token found, skipping assignment fetch");
        console.log("🔍 Debug info:", { 
          hasUser: !!user, 
          userId: user?.id || user?._id, 
          hasToken: !!token 
        });
        setAssignments([]);
        return;
      }
      
      const response = await apiCall("/api/assignments/published?learnerView=true", {
        method: "GET",
      });

      console.log("📊 Assignment fetch response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("📋 Assignment fetch successful:", {
          count: data.assignments?.length || 0,
          message: data.message,
          success: data.success
        });
        
        if (data.assignments && data.assignments.length > 0) {
          console.log("📋 Sample assignment data:", data.assignments[0]);
        }
        
        setAssignments(data.assignments || []);
      } else {
        let errorData = null;
        let errorText = '';
        
        try {
          errorData = await response.json();
          errorText = JSON.stringify(errorData);
        } catch (jsonError) {
          try {
            errorText = await response.text();
          } catch (textError) {
            errorText = `Unable to read response body - JSON error: ${jsonError.message}, Text error: ${textError.message}`;
          }
        }
        
        console.error("❌ Failed to fetch assignments:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText || 'No error message available',
          url: response.url,
          headers: Object.fromEntries(response.headers.entries())
        });
        setAssignments([]);
      }
    } catch (error) {
      console.error("❌ Assignment fetch error:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Handle authentication errors specifically
      if (error.message?.includes("No authentication token available") || 
          error.message?.includes("Session expired")) {
        console.warn("⚠️ Authentication issue detected - user may need to log in");
      }
      
      setAssignments([]);
    }
  };

  const fetchSubmissions = async () => {
    try {
      console.log("🚀 Fetching assignment submissions...");
      const response = await apiCall(`/api/assignments/submissions?studentId=${user?.id || user?._id}`, {
        method: "GET",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("📝 Submissions fetched:", data.submissions?.length || 0);
        setSubmissions(data.submissions || []);
      } else {
        const errorText = await response.text();
        console.error("Failed to fetch submissions:", errorText);
        setSubmissions([]);
      }
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
      setSubmissions([]);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const navigateToProfile = () => {
    setShowProfileSettings(true);
    setShowPreferences(false);
    setShowNotifications(false);
    setActiveTab("profile");
  };

  const navigateToPreferences = () => {
    setShowPreferences(true);
    setShowProfileSettings(false);
    setShowNotifications(false);
    setActiveTab("preferences");
  };

  const navigateToNotifications = () => {
    setShowNotifications(true);
    setShowProfileSettings(false);
    setShowPreferences(false);
    setActiveTab("notifications");
  };

  const handleSubmissionUpdate = async (submission) => {
    try {
      console.log("🚀 Updating assignment submission...");
      const response = await apiCall("/api/assignments/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...submission,
          studentName: user?.name,
          dueDate: selectedAssignment?.dueDate,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Submission updated:", data.submission);
        
        // Update local submissions state
        setSubmissions(prev => {
          const existingIndex = prev.findIndex(sub => 
            sub.assignmentId === submission.assignmentId && 
            sub.studentId === submission.studentId
          );
          
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = data.submission;
            return updated;
          } else {
            return [...prev, data.submission];
          }
        });

        toast.success(data.message || "Submission saved successfully!");
      } else {
        const errorData = await response.json();
        console.error("Failed to update submission:", errorData);
        toast.error(errorData.details || errorData.error || "Failed to save submission");
      }
    } catch (error) {
      console.error("Error updating submission:", error);
      toast.error("Error saving submission. Please try again.");
    }
  };

  const handleEnrollmentChange = async (courseId, isEnrolled) => {
    console.log("🔄 Enrollment change detected:", { courseId, isEnrolled });

    if (isEnrolled) {
      // Add the course to enrolled courses immediately
      try {
        const courseResponse = await fetch(`/api/courses/${courseId}`, {
          headers: getAuthHeaders(),
        });

        if (courseResponse.ok) {
          const courseData = await courseResponse.json();

          // Add to enrolled courses immediately with full verification flags
          setEnrolledCourses((prev) => {
            const prevCourses = Array.isArray(prev) ? prev : [];
            // Check if already enrolled to avoid duplicates
            const isAlreadyEnrolled = prevCourses.some(
              (course) => course._id === courseId
            );
            if (!isAlreadyEnrolled) {
              const newCourse = {
                ...courseData,
                enrolledAt: new Date().toISOString(),
                isEnrolled: true,
                enrollmentVerified: true,
                progress: 0,
              };
              console.log(
                "✅ Adding newly enrolled course to list:",
                newCourse.title
              );
              return [...prevCourses, newCourse];
            }
            console.log(
              "⚠️ Course already in enrolled list:",
              courseData.title
            );
            return prevCourses;
          });

          // Update stats immediately
          setStats((prev) => ({
            ...prev,
            coursesEnrolled: prev.coursesEnrolled + 1,
          }));

          console.log("✅ Successfully updated enrolled courses and stats");
        }
      } catch (error) {
        console.error(
          "❌ Error getting course data for immediate update:",
          error
        );
      }

      // Trigger enrollment update counter for additional refresh
      setEnrollmentUpdated((prev) => prev + 1);
    } else {
      // Handle unenrollment - immediate access revocation
      console.log("🗑️ Removing course from enrolled list:", courseId);
      setEnrolledCourses((prev) => {
        const prevCourses = Array.isArray(prev) ? prev : [];
        return prevCourses.filter((course) => course._id !== courseId);
      });
      setStats((prev) => ({
        ...prev,
        coursesEnrolled: Math.max(0, prev.coursesEnrolled - 1),
      }));

      // If user is currently viewing the unenrolled course, kick them out
      if (selectedCourse && selectedCourse._id === courseId) {
        console.log("🚪 Kicking user out of unenrolled course");
        setSelectedCourse(null);
        setActiveTab("overview");

        // Show immediate access revocation warning
        const warningNotification = document.createElement("div");
        warningNotification.className =
          "fixed top-8 right-8 bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 transform translate-x-full transition-transform duration-500";
        warningNotification.innerHTML = `
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <span class="font-semibold">Access revoked - You have been unenrolled from this course</span>
          </div>
        `;
        document.body.appendChild(warningNotification);

        setTimeout(() => {
          warningNotification.style.transform = "translateX(0)";
        }, 100);

        setTimeout(() => {
          warningNotification.style.transform = "translateX(100%)";
          setTimeout(() => {
            if (document.body.contains(warningNotification)) {
              document.body.removeChild(warningNotification);
            }
          }, 500);
        }, 5000);
      }

      // Trigger enrollment update
      setEnrollmentUpdated((prev) => prev + 1);
    }
  };

  const renderContent = () => {
    if (selectedAssignment) {
      return (
        <LearnerAssignmentViewer
          assignment={selectedAssignment}
          studentId={user?.id || user?._id}
          studentName={user?.name || 'Student'}
          existingSubmission={submissions.find(sub => 
            sub.assignmentId === selectedAssignment.id && 
            sub.studentId === (user?.id || user?._id)
          )}
          onSubmissionUpdate={handleSubmissionUpdate}
          onBack={() => {
            setSelectedAssignment(null);
            setHideHeader(false);
            setIsHeaderVisible(true);
            setLastScrollY(0);
          }}
        />
      );
    }

    if (selectedTestSeries) {
      return (
        <TestSeriesViewer
          testSeries={selectedTestSeries}
          onBack={() => {
            setSelectedTestSeries(null);
            setHideHeader(false);
            setIsHeaderVisible(true);
            setLastScrollY(0);
          }}
        />
      );
    }

    if (selectedAcademicCourse) {
      return (
        <AcademicCourseViewer
          course={selectedAcademicCourse}
          courseId={selectedAcademicCourse._id}
          onBack={() => {
            setSelectedAcademicCourse(null);
            setHideHeader(false);
            setIsHeaderVisible(true);
            setLastScrollY(0);
          }}
        />
      );
    }

    if (selectedCourse) {
      // Enhanced enrollment check with multiple verification layers
      const isEnrolledInList =
        Array.isArray(enrolledCourses) &&
        enrolledCourses.some(
          (enrolledCourse) =>
            enrolledCourse._id === selectedCourse._id ||
            enrolledCourse.id === selectedCourse.id
        );

      // Check if the course was passed with explicit enrollment verification
      const hasEnrollmentVerification =
        selectedCourse.enrollmentVerified === true ||
        selectedCourse.accessGranted === true;

      // Check if the course was passed with immediate enrollment status
      const hasImmediateEnrollment = selectedCourse.isEnrolled === true;

      // Final enrollment status - enrolled if ANY of the checks pass
      const finalEnrollmentStatus =
        isEnrolledInList || hasEnrollmentVerification || hasImmediateEnrollment;

      console.log("🔍 Course selection debug:", {
        courseId: selectedCourse._id,
        courseTitle: selectedCourse.title,
        isEnrolledInList,
        hasEnrollmentVerification,
        hasImmediateEnrollment,
        finalEnrollmentStatus,
        enrolledCoursesCount: Array.isArray(enrolledCourses)
          ? enrolledCourses.length
          : 0,
        enrollmentDataLoaded,
        courseFlags: {
          isEnrolled: selectedCourse.isEnrolled,
          enrollmentVerified: selectedCourse.enrollmentVerified,
          accessGranted: selectedCourse.accessGranted,
        },
      });

      // Check if this is an ExamGenius/Competitive Exam course
      const isExamGeniusCourse =
        selectedCourse.isExamGenius ||
        selectedCourse.examType ||
        selectedCourse.isCompetitiveExam;

      return isExamGeniusCourse ? (
        <ExamGeniusCourseViewer
          course={selectedCourse}
          onBack={() => {
            setSelectedCourse(null);
            setHideHeader(false);
            setIsHeaderVisible(true); // Reset scroll-based header visibility
            setLastScrollY(0); // Reset scroll position tracking
          }}
          onProgress={(progress) => {
            // Handle progress updates for exam courses
            console.log("Exam course progress:", progress);
          }}
        />
      ) : (
        <CourseViewer
          course={selectedCourse}
          isEnrolled={finalEnrollmentStatus}
          onBack={() => {
            setSelectedCourse(null);
            setHideHeader(false);
            setIsHeaderVisible(true); // Reset scroll-based header visibility
            setLastScrollY(0); // Reset scroll position tracking
          }}
          onModuleView={(isViewingModule) => setHideHeader(isViewingModule)}
          onEnrollmentChange={handleEnrollmentChange}
        />
      );
    }

    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-4 sm:p-8 text-white">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-white/10 rounded-full blur-3xl -translate-y-32 sm:-translate-y-48 translate-x-32 sm:translate-x-48"></div>
              <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-white/10 rounded-full blur-3xl translate-y-24 sm:translate-y-32 -translate-x-24 sm:-translate-x-32"></div>

              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="p-2 sm:p-3 bg-white/20 rounded-xl sm:rounded-2xl backdrop-blur-sm">
                    <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl sm:text-3xl font-bold leading-tight">
                      Welcome back, {user?.name}!
                    </h2>
                    <p className="text-white/80 text-sm sm:text-lg mt-1">
                      Ready to continue your learning journey?
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 mt-4 sm:mt-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-white/90 font-medium text-sm sm:text-base">
                      {stats.streak} day streak
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-300" />
                    <span className="text-white/90 font-medium text-sm sm:text-base">
                      {stats.certificates} certificates earned
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-indigo-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 touch-manipulation">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full blur-2xl -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3 relative z-10 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-semibold text-slate-700 leading-tight">
                    Courses
                    <br className="sm:hidden" /> Enrolled
                  </CardTitle>
                  <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg sm:rounded-xl group-hover:bg-blue-500/20 transition-colors duration-300">
                    <BookOpen className="h-3 w-3 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-xl sm:text-3xl font-bold text-slate-800 mb-1">
                    {stats.coursesEnrolled}
                  </div>
                  <p className="text-xs text-slate-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span className="hidden sm:inline">+2 this month</span>
                    <span className="sm:hidden">+2 month</span>
                  </p>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-green-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 touch-manipulation">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/30 rounded-full blur-2xl -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3 relative z-10 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-semibold text-slate-700 leading-tight">
                    Completed
                  </CardTitle>
                  <div className="p-1.5 sm:p-2 bg-emerald-500/10 rounded-lg sm:rounded-xl group-hover:bg-emerald-500/20 transition-colors duration-300">
                    <Trophy className="h-3 w-3 sm:h-5 sm:w-5 text-emerald-600" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-xl sm:text-3xl font-bold text-slate-800 mb-1">
                    {stats.coursesCompleted}
                  </div>
                  <p className="text-xs text-slate-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    <span className="hidden sm:inline">
                      {Math.round(
                        (stats.coursesCompleted /
                          Math.max(stats.coursesEnrolled, 1)) *
                          100
                      )}
                      % completion rate
                    </span>
                    <span className="sm:hidden">
                      {Math.round(
                        (stats.coursesCompleted /
                          Math.max(stats.coursesEnrolled, 1)) *
                          100
                      )}
                      %
                    </span>
                  </p>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-orange-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 touch-manipulation">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/30 rounded-full blur-2xl -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3 relative z-10 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-semibold text-slate-700 leading-tight">
                    Time
                    <br className="sm:hidden" /> Spent
                  </CardTitle>
                  <div className="p-1.5 sm:p-2 bg-amber-500/10 rounded-lg sm:rounded-xl group-hover:bg-amber-500/20 transition-colors duration-300">
                    <Clock className="h-3 w-3 sm:h-5 sm:w-5 text-amber-600" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-xl sm:text-3xl font-bold text-slate-800 mb-1">
                    {Math.floor(stats.totalTimeSpent / 60)}h
                  </div>
                  <p className="text-xs text-slate-600 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    <span className="hidden sm:inline">
                      {stats.totalTimeSpent % 60}m this week
                    </span>
                    <span className="sm:hidden">
                      {stats.totalTimeSpent % 60}m week
                    </span>
                  </p>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-pink-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 touch-manipulation">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 rounded-full blur-2xl -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3 relative z-10 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-semibold text-slate-700 leading-tight">
                    Average
                    <br className="sm:hidden" /> Score
                  </CardTitle>
                  <div className="p-1.5 sm:p-2 bg-purple-500/10 rounded-lg sm:rounded-xl group-hover:bg-purple-500/20 transition-colors duration-300">
                    <Star className="h-3 w-3 sm:h-5 sm:w-5 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-xl sm:text-3xl font-bold text-slate-800 mb-1">
                    {stats.averageScore}%
                  </div>
                  <p className="text-xs text-slate-600 flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    <span className="hidden sm:inline">
                      Excellent performance
                    </span>
                    <span className="sm:hidden">Excellent</span>
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* My Enrolled Courses Section */}
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-2xl px-4 sm:px-6 py-4 sm:py-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-xl">
                        <BookMarked className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                      </div>
                      My Enrolled Courses
                    </CardTitle>
                    <CardDescription className="text-slate-600 mt-2 text-sm sm:text-base">
                      {Array.isArray(enrolledCourses) &&
                      enrolledCourses.length > 0
                        ? `You're enrolled in ${enrolledCourses.length} course${
                            enrolledCourses.length > 1 ? "s" : ""
                          } - continue your learning journey`
                        : "Start your learning journey by exploring our course library"}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    className="hover:bg-blue-50 border-blue-200 w-full sm:w-auto touch-manipulation min-h-[44px]"
                    onClick={() => setActiveTab("library")}
                  >
                    Browse More Courses
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-8">
                <div className="space-y-6 sm:space-y-8">
                  {!enrollmentDataLoaded ? (
                    // Loading state for enrolled courses
                    <div className="space-y-4">
                      {[1, 2, 3].map((index) => (
                        <div
                          key={index}
                          className="animate-pulse p-6 border border-slate-200 rounded-2xl bg-gradient-to-r from-white to-slate-50/50"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="p-3 bg-slate-200 rounded-2xl">
                                <div className="h-6 w-6 bg-slate-300 rounded"></div>
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                                <div className="h-3 bg-slate-200 rounded w-full"></div>
                              </div>
                            </div>
                            <div className="h-12 w-24 bg-slate-200 rounded-2xl"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (Array.isArray(enrolledCourses) && enrolledCourses.length > 0) || 
                      (Array.isArray(enrolledAcademicCourses) && enrolledAcademicCourses.length > 0) ? (
                    (() => {
                      // Categorize courses
                      const technicalCourses = enrolledCourses.filter(
                        (course) =>
                          !course.isExamGenius &&
                          !course.examType &&
                          !course.isCompetitiveExam
                      );
                      const competitiveExamCourses = enrolledCourses.filter(
                        (course) =>
                          course.isExamGenius ||
                          course.examType ||
                          course.isCompetitiveExam
                      );

                      return (
                        <div className="space-y-8">
                          {/* Technical Courses Section */}
                          {technicalCourses.length > 0 && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-500/10 rounded-xl">
                                  <GraduationCap className="h-5 w-5 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">
                                  Technical Courses
                                </h3>
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 text-blue-700 border-blue-200"
                                >
                                  {technicalCourses.length} course
                                  {technicalCourses.length > 1 ? "s" : ""}
                                </Badge>
                              </div>
                              <div className="space-y-4">
                                {technicalCourses.map((course, index) => {
                                  const progress = Math.random() * 100;
                                  const timeLeft =
                                    Math.floor(Math.random() * 120) + 30;

                                  return (
                                    <div
                                      key={course._id}
                                      className="group relative overflow-hidden p-4 sm:p-6 border border-slate-200 rounded-2xl hover:shadow-xl transition-all duration-500 hover:border-blue-300 bg-gradient-to-r from-white to-slate-50/50 touch-manipulation"
                                    >
                                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/30 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between relative z-10 gap-4">
                                        <div className="flex-1 space-y-3 sm:space-y-4 w-full">
                                          <div className="flex items-start gap-3 sm:gap-4">
                                            <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-lg shrink-0">
                                              <BookMarked className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <h4 className="font-bold text-base sm:text-lg text-slate-800 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2">
                                                {course.title}
                                              </h4>
                                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                                                <span className="text-xs sm:text-sm text-slate-600 flex items-center gap-1">
                                                  <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                                                  {course.modules?.length || 0}{" "}
                                                  modules
                                                </span>
                                                <span className="text-xs sm:text-sm text-slate-600 flex items-center gap-1">
                                                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                                  ~{timeLeft} min left
                                                </span>
                                                <Badge
                                                  variant="outline"
                                                  className="bg-green-50 text-green-700 border-green-200 text-xs self-start"
                                                >
                                                  {Math.floor(progress)}%
                                                  complete
                                                </Badge>
                                              </div>
                                            </div>
                                          </div>

                                          <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                              <span className="text-slate-600 font-medium">
                                                Progress
                                              </span>
                                              <span className="text-slate-800 font-semibold">
                                                {Math.floor(progress)}%
                                              </span>
                                            </div>
                                            <Progress
                                              value={progress}
                                              className="h-3 bg-slate-100"
                                            />
                                          </div>
                                        </div>

                                        <Button
                                          onClick={() => {
                                            console.log(
                                              "🎯 Continue Learning clicked for technical course:",
                                              course.title
                                            );
                                            setSelectedCourse({
                                              ...course,
                                              isEnrolled: true,
                                              enrollmentVerified: true,
                                              accessGranted: true,
                                              fromContinueLearning: true,
                                            });
                                          }}
                                          disabled={!enrollmentDataLoaded}
                                          className="ml-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                        >
                                          {!enrollmentDataLoaded ? (
                                            <>
                                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                              Loading...
                                            </>
                                          ) : (
                                            <>
                                              Continue
                                              <Play className="h-4 w-4 ml-2" />
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Competitive Exam Courses Section */}
                          {competitiveExamCourses.length > 0 && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-orange-500/10 rounded-xl">
                                  <Trophy className="h-5 w-5 text-orange-600" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">
                                  Competitive Exams
                                </h3>
                                <Badge
                                  variant="outline"
                                  className="bg-orange-50 text-orange-700 border-orange-200"
                                >
                                  {competitiveExamCourses.length} course
                                  {competitiveExamCourses.length > 1 ? "s" : ""}
                                </Badge>
                              </div>
                              <div className="space-y-4">
                                {competitiveExamCourses.map((course, index) => {
                                  const progress = Math.random() * 100;
                                  const timeLeft =
                                    Math.floor(Math.random() * 120) + 30;

                                  return (
                                    <div
                                      key={course._id}
                                      className="group relative overflow-hidden p-4 sm:p-6 border border-slate-200 rounded-2xl hover:shadow-xl transition-all duration-500 hover:border-orange-300 bg-gradient-to-r from-orange-50/50 to-red-50/50 touch-manipulation"
                                    >
                                      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100/30 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between relative z-10 gap-4">
                                        <div className="flex-1 space-y-3 sm:space-y-4 w-full">
                                          <div className="flex items-start gap-3 sm:gap-4">
                                            <div className="p-2 sm:p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl sm:rounded-2xl shadow-lg shrink-0">
                                              <Trophy className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <h4 className="font-bold text-base sm:text-lg text-slate-800 group-hover:text-orange-600 transition-colors duration-300 line-clamp-2">
                                                {course.title}
                                              </h4>
                                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                                                {course.examType && (
                                                  <span className="text-xs sm:text-sm text-slate-600 flex items-center gap-1">
                                                    <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                                                    {course.examType}
                                                  </span>
                                                )}
                                                {course.subject && (
                                                  <span className="text-xs sm:text-sm text-slate-600 flex items-center gap-1">
                                                    <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                                                    {course.subject}
                                                  </span>
                                                )}
                                                <span className="text-xs sm:text-sm text-slate-600 flex items-center gap-1">
                                                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                                  ~{timeLeft} min left
                                                </span>
                                                <Badge
                                                  variant="outline"
                                                  className="bg-green-50 text-green-700 border-green-200 text-xs self-start"
                                                >
                                                  {Math.floor(progress)}%
                                                  complete
                                                </Badge>
                                              </div>
                                            </div>
                                          </div>

                                          <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                              <span className="text-slate-600 font-medium">
                                                Progress
                                              </span>
                                              <span className="text-slate-800 font-semibold">
                                                {Math.floor(progress)}%
                                              </span>
                                            </div>
                                            <Progress
                                              value={progress}
                                              className="h-3 bg-slate-100"
                                            />
                                          </div>
                                        </div>

                                        <Button
                                          onClick={() => {
                                            console.log(
                                              "🎯 Continue Learning clicked for competitive exam course:",
                                              course.title
                                            );
                                            setSelectedCourse({
                                              ...course,
                                              isEnrolled: true,
                                              enrollmentVerified: true,
                                              accessGranted: true,
                                              fromContinueLearning: true,
                                            });
                                          }}
                                          disabled={!enrollmentDataLoaded}
                                          className="ml-6 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                        >
                                          {!enrollmentDataLoaded ? (
                                            <>
                                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                              Loading...
                                            </>
                                          ) : (
                                            <>
                                              Continue
                                              <Play className="h-4 w-4 ml-2" />
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Academic Courses Section */}
                          {enrolledAcademicCourses.length > 0 && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-purple-500/10 rounded-xl">
                                  <GraduationCap className="h-5 w-5 text-purple-600" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">
                                  Academic Courses
                                </h3>
                                <Badge
                                  variant="outline"
                                  className="bg-purple-50 text-purple-700 border-purple-200"
                                >
                                  {enrolledAcademicCourses.length} course
                                  {enrolledAcademicCourses.length > 1 ? "s" : ""}
                                </Badge>
                              </div>
                              <div className="space-y-4">
                                {enrolledAcademicCourses.map((course, index) => {
                                  const progress = Math.random() * 100;
                                  const timeLeft = Math.floor(Math.random() * 120) + 30;

                                  return (
                                    <div
                                      key={course._id}
                                      className="group relative overflow-hidden p-4 sm:p-6 border border-slate-200 rounded-2xl hover:shadow-xl transition-all duration-500 hover:border-purple-300 bg-gradient-to-r from-white to-purple-50/50 touch-manipulation"
                                    >
                                      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100/30 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between relative z-10 gap-4">
                                        <div className="flex-1 space-y-3 sm:space-y-4 w-full">
                                          <div className="flex items-start gap-3 sm:gap-4">
                                            <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl sm:rounded-2xl shadow-lg shrink-0">
                                              <GraduationCap className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <h4 className="font-bold text-base sm:text-lg text-slate-800 group-hover:text-purple-600 transition-colors duration-300 line-clamp-2">
                                                {course.title}
                                              </h4>
                                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                                                <span className="text-xs sm:text-sm text-slate-600 flex items-center gap-1">
                                                  <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                                                  {course.modules?.length || 0} modules
                                                </span>
                                                <span className="text-xs sm:text-sm text-slate-600 flex items-center gap-1">
                                                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                                  ~{timeLeft} min left
                                                </span>
                                                <Badge
                                                  variant="outline"
                                                  className="bg-green-50 text-green-700 border-green-200 text-xs self-start"
                                                >
                                                  {Math.floor(progress)}% complete
                                                </Badge>
                                              </div>
                                            </div>
                                          </div>

                                          <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                              <span className="text-slate-600 font-medium">
                                                Progress
                                              </span>
                                              <span className="text-slate-800 font-semibold">
                                                {Math.floor(progress)}%
                                              </span>
                                            </div>
                                            <Progress
                                              value={progress}
                                              className="h-3 bg-slate-100"
                                            />
                                          </div>
                                        </div>

                                        <Button
                                          onClick={() => {
                                            console.log(
                                              "📖 Opening academic course:",
                                              course.title
                                            );
                                            setSelectedAcademicCourse({
                                              ...course,
                                              isEnrolled: true,
                                              enrolledAt: course.enrolledAt || new Date().toISOString(),
                                            });
                                            setHideHeader(true);
                                          }}
                                          className="flex-1 sm:flex-none bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 sm:w-auto w-full sm:min-w-[140px]"
                                        >
                                          <Play className="h-4 w-4 mr-2" />
                                          Continue Learning
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* If no courses in any category */}
                          {technicalCourses.length === 0 &&
                            competitiveExamCourses.length === 0 &&
                            enrolledAcademicCourses.length === 0 && (
                              <div className="text-center py-12">
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <BookOpen className="h-12 w-12 text-blue-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                                  No courses yet
                                </h3>
                                <p className="text-slate-600 mb-6">
                                  Start your learning journey by exploring our
                                  course library
                                </p>
                                <Button
                                  onClick={() => setActiveTab("library")}
                                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-2xl"
                                >
                                  Browse Courses
                                  <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                              </div>
                            )}
                        </div>
                      );
                    })()
                  ) : (
                    // Empty state when no enrolled courses and data is loaded
                    <div className="text-center py-12">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="h-12 w-12 text-blue-500" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-800 mb-2">
                        No courses yet
                      </h3>
                      <p className="text-slate-600 mb-6">
                        Start your learning journey by exploring our course
                        library
                      </p>
                      <Button
                        onClick={() => setActiveTab("library")}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-2xl"
                      >
                        Browse Courses
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <Card className="group border-0 bg-gradient-to-br from-indigo-50 to-blue-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 cursor-pointer">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-800 mb-1 sm:mb-2">
                    Study Schedule
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm">
                    Plan your learning sessions
                  </p>
                </CardContent>
              </Card>

              <Card className="group border-0 bg-gradient-to-br from-emerald-50 to-green-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 cursor-pointer">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Target className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-800 mb-1 sm:mb-2">
                    Learning Goals
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm">
                    Set and track your objectives
                  </p>
                </CardContent>
              </Card>

              <Card className="group border-0 bg-gradient-to-br from-purple-50 to-pink-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 cursor-pointer sm:col-span-2 lg:col-span-1">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Award className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-800 mb-1 sm:mb-2">
                    Achievements
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm">
                    View your badges and certificates
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "library":
        return (
          <CourseLibrary
            onCourseSelect={(course) => {
              console.log("🎯 Course selected from library:", course.title);

              // Check if it's an academic course
              if (course.isAcademicCourse || course.courseType === "academic") {
                console.log(
                  "🎓 Academic course detected, using Academic Course Viewer"
                );
                setSelectedAcademicCourse(course);
              } else {
                setSelectedCourse(course);
              }
              setHideHeader(true);
            }}
            enrolledCourses={enrolledCourses}
            enrollmentDataLoaded={enrollmentDataLoaded}
            onEnrollmentChange={handleEnrollmentChange}
          />
        );
      case "assignments":
        return (
          <div className="space-y-4">
            {/* Debug Information Panel */}
            {process.env.NODE_ENV === 'development' && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-blue-800">🔧 Debug Information</CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={fetchAssignments}
                      className="text-blue-600 border-blue-300"
                    >
                      🔄 Refresh Assignments
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        fetchEnrolledCourses();
                        fetchEnrolledAcademicCourses();
                        fetchAssignments();
                      }}
                      className="text-green-600 border-green-300"
                    >
                      🔄 Refresh All Data
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <strong>User Info:</strong>
                      <pre className="text-xs mt-1 bg-white p-2 rounded">
                        {JSON.stringify({
                          id: user?.id || user?._id,
                          role: user?.role,
                          name: user?.name
                        }, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <strong>Assignment Data:</strong>
                      <pre className="text-xs mt-1 bg-white p-2 rounded">
                        {JSON.stringify({
                          count: assignments?.length || 0,
                          hasData: !!assignments,
                          isArray: Array.isArray(assignments),
                          sample: assignments?.[0] ? {
                            id: assignments[0].id,
                            title: assignments[0].title,
                            courseTitle: assignments[0].courseTitle,
                            dueDate: assignments[0].dueDate
                          } : null
                        }, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <strong>Enrollment Data:</strong>
                      <pre className="text-xs mt-1 bg-white p-2 rounded">
                        {JSON.stringify({
                          enrolledCourses: enrolledCourses?.length || 0,
                          academicCourses: enrolledAcademicCourses?.length || 0,
                          testSeries: enrolledTestSeries?.length || 0,
                          dataLoaded: enrollmentDataLoaded
                        }, null, 2)}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <LearnerAssignmentList
              assignments={assignments}
              submissions={submissions}
              studentId={user?.id || user?._id}
              studentName={user?.name || 'Student'}
              onViewAssignment={(assignment) => {
                console.log("🎯 Assignment selected:", assignment.title);
                setSelectedAssignment(assignment);
                setHideHeader(true);
              }}
              onDownloadPDF={(assignment) => {
                console.log("📄 PDF download requested for:", assignment.title);
              }}
            />
          </div>
        );
      case "academic-courses":
        return (
          <AcademicCourseLibrary
            onCourseSelect={(course) => {
              console.log(
                "🎯 Academic course selected from library:",
                course.title
              );
              setSelectedAcademicCourse(course);
              setHideHeader(true);
            }}
            onEnrollmentChange={handleEnrollmentChange}
          />
        );
      case "test-series":
        return (
          <TestSeriesLibrary
            onTestSeriesSelect={(testSeries) => {
              console.log(
                "🎯 Test series selected from library:",
                testSeries.title
              );
              setSelectedTestSeries(testSeries);
              setHideHeader(true);
            }}
            onEnrollmentChange={handleEnrollmentChange}
          />
        );
      case "profile":
        return (
          <ProfileSettingsForm
            onBack={() => setActiveTab("overview")}
            isEducator={false}
            avatarKey={avatarKey}
            setAvatarKey={setAvatarKey}
          />
        );
      case "preferences":
        return (
          <PreferencesSettings
            onBack={() => setActiveTab("overview")}
            isEducator={false}
          />
        );
      case "notifications":
        return (
          <NotificationsSettings
            onBack={() => setActiveTab("overview")}
            isEducator={false}
          />
        );
      default:
        return null;
    }
  };

  const renderTabNavigation = () => (
    <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 space-y-4 sm:space-y-0">
          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 sm:gap-1 w-full sm:w-auto">
            {[
              { id: "overview", label: "Dashboard", icon: BookOpen },
              { id: "library", label: "Courses", icon: BookMarked },
              {
                id: "academic-courses",
                label: "Academic",
                icon: GraduationCap,
              },
              { id: "assignments", label: "Assignments", icon: FileText },
              { id: "test-series", label: "Test Series", icon: FileQuestion },
              { id: "profile", label: "Profile", icon: User },
              { id: "preferences", label: "Settings", icon: Settings },
              { id: "notifications", label: "Updates", icon: Bell },
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group flex items-center gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-medium transition-all duration-300 text-sm sm:text-base ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl"
                      : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline lg:inline">
                    {tab.label}
                  </span>
                  <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  // Enhanced Profile Components - Completely reimplemented
  const ProfileSettings = () => {
    // Initialize state only once with current user data
    const [profileForm, setProfileForm] = useState(() => ({
      name: user?.name || "",
      email: user?.email || "",
      bio: user?.bio || "",
      avatar: user?.avatar || "",
      phone: user?.phone || "",
      location: user?.location || "",
      website: user?.website || "",
      learningGoals: user?.learningGoals || "",
      interests: user?.interests || [],
    }));

    const [isUploading, setIsUploading] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [saveLoading, setSaveLoading] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Only update form if user data changes significantly (not on every render)
    const userDataRef = useRef();
    const profileInitialized = useRef(false);

    useEffect(() => {
      // Only initialize once when user data is first available
      if (user && !profileInitialized.current && !hasUnsavedChanges) {
        profileInitialized.current = true;
        setProfileForm({
          name: user?.name || "",
          email: user?.email || "",
          bio: user?.bio || "",
          avatar: user?.avatar || "",
          phone: user?.phone || "",
          location: user?.location || "",
          website: user?.website || "",
          learningGoals: user?.learningGoals || "",
          interests: user?.interests || [],
        });
      }
    }, [user?._id, hasUnsavedChanges]);

    // Reset profileInitialized when user changes (login/logout)
    useEffect(() => {
      if (!user) {
        profileInitialized.current = false;
      }
    }, [user]);

    const validateForm = () => {
      const errors = {};
      if (!profileForm.name?.trim()) {
        errors.name = "Name is required";
      }
      if (!profileForm.email?.trim()) {
        errors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) {
        errors.email = "Please enter a valid email address";
      }
      if (
        profileForm.website &&
        !/^https?:\/\/.+\..+/.test(profileForm.website)
      ) {
        errors.website =
          "Please enter a valid website URL (include http:// or https://)";
      }
      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    };

    const handleFieldChange = (fieldName, value) => {
      setProfileForm((prev) => ({
        ...prev,
        [fieldName]: value,
      }));
      setHasUnsavedChanges(true);

      // Clear specific field error when user starts typing
      if (formErrors[fieldName]) {
        setFormErrors((prev) => ({
          ...prev,
          [fieldName]: undefined,
        }));
      }
    };

    const handleFormSubmit = async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      setSaveLoading(true);
      try {
        const response = await fetch("/api/profile", {
          method: "PUT",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(profileForm),
        });

        if (response.ok) {
          const result = await response.json();
          updateUser(result.user);
          setHasUnsavedChanges(false);
          setAvatarKey(Date.now());

          // Show success notification
          toast({
            title: "Success!",
            description: "Profile updated successfully!",
            variant: "default",
          });
        } else {
          const errorData = await response.json();
          console.error("Profile update failed:", errorData);
          toast({
            title: "Error",
            description: `Failed to update profile: ${
              errorData.error || "Unknown error"
            }`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error updating profile:", error);
        toast({
          title: "Error",
          description: `Error updating profile: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        setSaveLoading(false);
      }
    };

    const showNotification = (message, type = "info") => {
      const notification = document.createElement("div");
      notification.className = `fixed top-8 right-8 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 transform translate-x-full transition-transform duration-500 ${
        type === "success"
          ? "bg-gradient-to-r from-emerald-500 to-green-600"
          : type === "error"
          ? "bg-gradient-to-r from-red-500 to-pink-600"
          : "bg-gradient-to-r from-blue-500 to-purple-600"
      }`;

      notification.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
            ${
              type === "success"
                ? '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>'
                : '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>'
            }
          </div>
          <span class="font-semibold">${message}</span>
        </div>
      `;

      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.transform = "translateX(0)";
      }, 100);

      setTimeout(() => {
        notification.style.transform = "translateX(100%)";
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 500);
      }, 3000);
    };

    const handleAvatarUpload = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      const formData = new FormData();
      formData.append("avatar", file);

      try {
        const response = await fetch("/api/upload/avatar", {
          method: "POST",
          headers: getAuthHeaders(),
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          const newAvatarUrl = data.avatarUrl;

          handleFieldChange("avatar", newAvatarUrl);
          updateUser({ ...user, avatar: newAvatarUrl });
          setAvatarKey(Date.now());
          showNotification("Avatar uploaded successfully!", "success");
        } else {
          showNotification("Failed to upload avatar", "error");
        }
      } catch (error) {
        console.error("Error uploading avatar:", error);
        showNotification("Error uploading avatar", "error");
      } finally {
        setIsUploading(false);
      }
    };

    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => setActiveTab("overview")}
            className="group flex items-center gap-2 hover:bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl font-medium transition-all duration-300"
          >
            <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform duration-300" />
            Back to Dashboard
          </Button>
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Profile Settings
            </h2>
            <p className="text-slate-600 text-lg mt-2">
              Manage your learning profile and personal information
            </p>
          </div>
        </div>

        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-t-2xl">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                <User className="h-6 w-6 text-white" />
              </div>
              Personal Information
            </CardTitle>
            <CardDescription className="text-slate-600 text-base mt-2">
              Update your profile details and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleFormSubmit} className="space-y-8">
              {/* Avatar Upload */}
              <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                <div className="relative group shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 scale-125"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-pink-400/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-700 scale-110 animate-pulse"></div>

                  <div className="relative">
                    <Avatar
                      key={`profile-${avatarKey}`}
                      className="h-28 w-28 sm:h-32 sm:w-32 lg:h-40 lg:w-40 ring-4 ring-blue-200 group-hover:ring-blue-300 group-hover:ring-8 transition-all duration-500 shadow-2xl"
                    >
                      <AvatarImage
                        src={profileForm.avatar || "/placeholder.svg"}
                        alt={profileForm.name}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 text-white text-3xl sm:text-4xl lg:text-5xl font-bold">
                        {profileForm.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>

                    {isUploading && (
                      <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <div className="text-center text-white">
                          <div className="animate-spin rounded-full h-10 w-10 border-3 border-white border-t-transparent mx-auto mb-2"></div>
                          <div className="text-sm font-medium">
                            Uploading...
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-full transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="text-white text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2" />
                        <div className="text-sm font-semibold">
                          Change Photo
                        </div>
                      </div>
                    </div>

                    <div className="absolute -bottom-2 -right-2 p-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full shadow-xl group-hover:scale-110 transition-transform duration-300 border-4 border-white">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-2xl blur-xl"></div>
                    <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/60">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                          <Camera className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-slate-800">
                            Profile Picture
                          </h3>
                          <p className="text-slate-600">
                            Express your learning journey visually
                          </p>
                        </div>
                      </div>

                      <p className="text-slate-600 mb-6 leading-relaxed">
                        Upload a clear, friendly photo that represents you as a
                        learner. This helps create connections with educators
                        and fellow students in the community.
                      </p>

                      <label className="block">
                        <Button
                          type="button"
                          variant="outline"
                          className="group cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 border-2 border-blue-200 hover:border-blue-400 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl w-full"
                          disabled={isUploading}
                          asChild
                        >
                          <span className="flex items-center justify-center gap-3">
                            {isUploading ? (
                              <>
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                                <span>Uploading Photo...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
                                <span>Choose New Photo</span>
                              </>
                            )}
                          </span>
                        </Button>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* Basic Information */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-2xl blur-xl"></div>
                  <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/60">
                    <h4 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                      <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                      Basic Information
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                      <div className="space-y-3">
                        <Label
                          htmlFor="name"
                          className="text-slate-700 font-semibold flex items-center gap-2 text-sm sm:text-base"
                        >
                          <div className="p-1 bg-blue-100 rounded-lg">
                            <User className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                          </div>
                          Full Name *
                        </Label>
                        <Input
                          id="name"
                          value={profileForm.name}
                          onChange={(e) =>
                            handleFieldChange("name", e.target.value)
                          }
                          className={`h-12 sm:h-14 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 text-sm sm:text-base ${
                            formErrors.name
                              ? "border-red-300 focus:border-red-500 bg-red-50/50"
                              : "border-slate-200 focus:border-blue-500 hover:border-slate-300"
                          }`}
                          placeholder="Enter your full name"
                        />
                        {formErrors.name && (
                          <p className="text-red-500 text-sm flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {formErrors.name}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <Label
                          htmlFor="email"
                          className="text-slate-700 font-semibold flex items-center gap-2"
                        >
                          <div className="p-1 bg-purple-100 rounded-lg">
                            <Mail className="h-4 w-4 text-purple-600" />
                          </div>
                          Email Address *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileForm.email}
                          onChange={(e) =>
                            handleFieldChange("email", e.target.value)
                          }
                          className={`h-14 rounded-2xl border-2 transition-all duration-300 ${
                            formErrors.email
                              ? "border-red-300 focus:border-red-500 bg-red-50/50"
                              : "border-slate-200 focus:border-purple-500 hover:border-slate-300"
                          }`}
                          placeholder="Enter your email address"
                        />
                        {formErrors.email && (
                          <p className="text-red-500 text-sm flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {formErrors.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-green-50/50 rounded-2xl blur-xl"></div>
                  <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/60">
                    <h4 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                      <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-green-600 rounded-full"></div>
                      Contact Information
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label
                          htmlFor="phone"
                          className="text-slate-700 font-semibold flex items-center gap-2"
                        >
                          <div className="p-1 bg-emerald-100 rounded-lg">
                            <Phone className="h-4 w-4 text-emerald-600" />
                          </div>
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) =>
                            handleFieldChange("phone", e.target.value)
                          }
                          placeholder="+1 (555) 123-4567"
                          className="h-14 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 hover:border-slate-300 transition-all duration-300"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label
                          htmlFor="location"
                          className="text-slate-700 font-semibold flex items-center gap-2"
                        >
                          <div className="p-1 bg-green-100 rounded-lg">
                            <MapPin className="h-4 w-4 text-green-600" />
                          </div>
                          Location
                        </Label>
                        <Input
                          id="location"
                          value={profileForm.location}
                          onChange={(e) =>
                            handleFieldChange("location", e.target.value)
                          }
                          placeholder="e.g., New York, USA"
                          className="h-14 rounded-2xl border-2 border-slate-200 focus:border-green-500 hover:border-slate-300 transition-all duration-300"
                        />
                      </div>
                    </div>

                    <div className="mt-8 space-y-3">
                      <Label
                        htmlFor="website"
                        className="text-slate-700 font-semibold flex items-center gap-2"
                      >
                        <div className="p-1 bg-teal-100 rounded-lg">
                          <Globe className="h-4 w-4 text-teal-600" />
                        </div>
                        Website
                      </Label>
                      <Input
                        id="website"
                        type="url"
                        value={profileForm.website}
                        onChange={(e) =>
                          handleFieldChange("website", e.target.value)
                        }
                        placeholder="https://yourwebsite.com"
                        className={`h-14 rounded-2xl border-2 transition-all duration-300 ${
                          formErrors.website
                            ? "border-red-300 focus:border-red-500 bg-red-50/50"
                            : "border-slate-200 focus:border-teal-500 hover:border-slate-300"
                        }`}
                      />
                      {formErrors.website && (
                        <p className="text-red-500 text-sm flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {formErrors.website}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Learning Profile */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-blue-50/50 rounded-2xl blur-xl"></div>
                  <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/60">
                    <h4 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                      <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-blue-600 rounded-full"></div>
                      Learning Profile
                    </h4>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label
                          htmlFor="bio"
                          className="text-slate-700 font-semibold flex items-center gap-2"
                        >
                          <div className="p-1 bg-indigo-100 rounded-lg">
                            <BookOpen className="h-4 w-4 text-indigo-600" />
                          </div>
                          About You
                        </Label>
                        <Textarea
                          id="bio"
                          value={profileForm.bio}
                          onChange={(e) =>
                            handleFieldChange("bio", e.target.value)
                          }
                          placeholder="Tell us about your background, interests, and learning style..."
                          rows={4}
                          className="rounded-2xl border-2 border-slate-200 focus:border-indigo-500 hover:border-slate-300 transition-all duration-300 resize-none"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label
                          htmlFor="learningGoals"
                          className="text-slate-700 font-semibold flex items-center gap-2"
                        >
                          <div className="p-1 bg-blue-100 rounded-lg">
                            <Target className="h-4 w-4 text-blue-600" />
                          </div>
                          Learning Goals
                        </Label>
                        <Textarea
                          id="learningGoals"
                          value={profileForm.learningGoals}
                          onChange={(e) =>
                            handleFieldChange("learningGoals", e.target.value)
                          }
                          placeholder="What are your learning objectives? What skills do you want to develop?"
                          rows={3}
                          className="rounded-2xl border-2 border-slate-200 focus:border-blue-500 hover:border-slate-300 transition-all duration-300 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-between pt-8">
                <div className="text-sm text-slate-500">
                  <span className="text-red-500">*</span> Required fields
                  {hasUnsavedChanges && (
                    <span className="ml-4 text-amber-600 font-medium">
                      You have unsaved changes
                    </span>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={saveLoading}
                  className="group relative bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 hover:from-blue-600 hover:via-purple-700 hover:to-indigo-700 text-white px-12 py-4 rounded-2xl text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative flex items-center gap-3">
                    {saveLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
                        Save Profile Changes
                      </>
                    )}
                  </div>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  };

  const Preferences = () => {
    const [preferences, setPreferences] = useState({
      emailNotifications: true,
      pushNotifications: false,
      darkMode: false,
      language: "en",
      studyReminders: true,
      weeklyGoal: 5,
      preferredStudyTime: "morning",
    });
    const [loading, setLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false);

    useEffect(() => {
      fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/preferences", {
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          const data = await response.json();
          setPreferences((prev) => ({ ...prev, ...data }));
        } else {
          console.error("Failed to fetch preferences");
        }
      } catch (error) {
        console.error("Error fetching preferences:", error);
      } finally {
        setLoading(false);
      }
    };

    const handlePreferenceUpdate = async () => {
      setSaveLoading(true);
      try {
        const response = await fetch("/api/preferences", {
          method: "PUT",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(preferences),
        });

        if (response.ok) {
          // Show beautiful success notification
          const successNotification = document.createElement("div");
          successNotification.className =
            "fixed top-8 right-8 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 transform translate-x-full transition-transform duration-500";
          successNotification.innerHTML = `
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
              </div>
              <span class="font-semibold">Preferences updated successfully!</span>
            </div>
          `;
          document.body.appendChild(successNotification);

          setTimeout(() => {
            successNotification.style.transform = "translateX(0)";
          }, 100);

          setTimeout(() => {
            successNotification.style.transform = "translateX(100%)";
            setTimeout(
              () => document.body.removeChild(successNotification),
              500
            );
          }, 3000);
        } else {
          const errorData = await response.json();
          alert(
            `Failed to update preferences: ${
              errorData.message || "Unknown error"
            }`
          );
        }
      } catch (error) {
        console.error("Error updating preferences:", error);
        alert(`Error updating preferences: ${error.message}`);
      } finally {
        setSaveLoading(false);
      }
    };

    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => setActiveTab("overview")}
            className="group flex items-center gap-2 hover:bg-purple-50 text-purple-600 px-6 py-3 rounded-2xl font-medium transition-all duration-300"
          >
            <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform duration-300" />
            Back to Dashboard
          </Button>
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Learning Preferences
            </h2>
            <p className="text-slate-600 text-lg mt-2">
              Customize your learning experience to match your style
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-2xl">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                Notification Settings
              </CardTitle>
              <CardDescription className="text-slate-600 mt-2">
                Control how you receive updates and reminders
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
                <div>
                  <p className="font-semibold text-slate-800">
                    Email Notifications
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Course updates and progress reports
                  </p>
                </div>
                <Switch
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({
                      ...prev,
                      emailNotifications: checked,
                    }))
                  }
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-600"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl">
                <div>
                  <p className="font-semibold text-slate-800">
                    Push Notifications
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Real-time browser notifications
                  </p>
                </div>
                <Switch
                  checked={preferences.pushNotifications}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({
                      ...prev,
                      pushNotifications: checked,
                    }))
                  }
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-emerald-500 data-[state=checked]:to-green-600"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl">
                <div>
                  <p className="font-semibold text-slate-800">
                    Study Reminders
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Daily learning session reminders
                  </p>
                </div>
                <Switch
                  checked={preferences.studyReminders}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({
                      ...prev,
                      studyReminders: checked,
                    }))
                  }
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-amber-500 data-[state=checked]:to-orange-600"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-t-2xl">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                Learning Settings
              </CardTitle>
              <CardDescription className="text-slate-600 mt-2">
                Personalize your study environment and goals
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                <Label className="text-slate-700 font-semibold">
                  Weekly Learning Goal
                </Label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={preferences.weeklyGoal}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev,
                        weeklyGoal: parseInt(e.target.value),
                      }))
                    }
                    className="flex-1 h-3 bg-gradient-to-r from-indigo-200 to-blue-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-2xl font-bold text-slate-800 min-w-[3rem]">
                    {preferences.weeklyGoal}h
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-slate-700 font-semibold">
                  Preferred Study Time
                </Label>
                <select
                  value={preferences.preferredStudyTime}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      preferredStudyTime: e.target.value,
                    }))
                  }
                  className="w-full h-14 px-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 transition-colors duration-300 bg-white"
                >
                  <option value="morning">Morning (6AM - 12PM)</option>
                  <option value="afternoon">Afternoon (12PM - 6PM)</option>
                  <option value="evening">Evening (6PM - 12AM)</option>
                  <option value="night">Night (12AM - 6AM)</option>
                </select>
              </div>

              <div className="space-y-4">
                <Label className="text-slate-700 font-semibold">Language</Label>
                <select
                  value={preferences.language}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      language: e.target.value,
                    }))
                  }
                  className="w-full h-14 px-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 transition-colors duration-300 bg-white"
                >
                  <option value="en">🇺🇸 English</option>
                  <option value="es">🇪🇸 Spanish</option>
                  <option value="fr">🇫🇷 French</option>
                  <option value="de">🇩🇪 German</option>
                  <option value="zh">🇨🇳 Chinese</option>
                  <option value="ja">🇯🇵 Japanese</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handlePreferenceUpdate}
            disabled={saveLoading}
            className="group relative bg-gradient-to-r from-purple-500 via-pink-600 to-indigo-600 hover:from-purple-600 hover:via-pink-700 hover:to-indigo-700 text-white px-12 py-4 rounded-2xl text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {/* Button background effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative flex items-center gap-3">
              {saveLoading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                  Saving Preferences...
                </>
              ) : (
                <>
                  <Save className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
                  Save Preferences
                </>
              )}
            </div>
          </Button>
        </div>
      </div>
    );
  };

  const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/notifications", {
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          const data = await response.json();
          setNotifications(Array.isArray(data) ? data : []);
        } else {
          console.error("Failed to fetch notifications");
          // Set default notifications
          setNotifications([
            {
              id: 1,
              type: "course",
              title: "Welcome to your learning journey!",
              message: "Start exploring our course library to begin learning.",
              time: "1 hour ago",
              read: false,
              icon: BookOpen,
              color: "blue",
            },
            {
              id: 2,
              type: "achievement",
              title: "First course enrolled!",
              message: "You successfully enrolled in your first course.",
              time: "2 days ago",
              read: true,
              icon: Trophy,
              color: "yellow",
            },
            {
              id: 3,
              type: "reminder",
              title: "Daily study reminder",
              message:
                "Keep up your learning streak! Study for 30 minutes today.",
              time: "3 days ago",
              read: false,
              icon: Clock,
              color: "green",
            },
          ]);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
        // Set default notifications on error
        setNotifications([
          {
            id: 1,
            type: "welcome",
            title: "Welcome to LLMfied!",
            message: "Your personalized learning platform is ready.",
            time: "Just now",
            read: false,
            icon: Sparkles,
            color: "purple",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    const markAsRead = async (id) => {
      try {
        const response = await fetch("/api/notifications", {
          method: "PUT",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "markAsRead",
            notificationId: id,
          }),
        });

        if (response.ok) {
          setNotifications((prev) =>
            prev.map((notif) =>
              notif.id === id ? { ...notif, read: true } : notif
            )
          );
        }
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    };

    const markAllAsRead = async () => {
      try {
        const response = await fetch("/api/notifications", {
          method: "PUT",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "markAllAsRead",
          }),
        });

        if (response.ok) {
          setNotifications((prev) =>
            prev.map((notif) => ({ ...notif, read: true }))
          );
        }
      } catch (error) {
        console.error("Error marking all notifications as read:", error);
      }
    };

    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => setActiveTab("overview")}
            className="group flex items-center gap-2 hover:bg-amber-50 text-amber-600 px-6 py-3 rounded-2xl font-medium transition-all duration-300"
          >
            <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform duration-300" />
            Back to Dashboard
          </Button>
          <div className="flex-1">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Notifications
            </h2>
            <p className="text-slate-600 text-lg mt-2">
              Stay updated with your learning progress and achievements
            </p>
          </div>
          <Button
            onClick={markAllAsRead}
            variant="outline"
            className="hover:bg-amber-50 border-2 border-amber-200 hover:border-amber-300 px-6 py-3 rounded-2xl font-medium"
          >
            Mark All as Read
            <CheckCircle className="h-4 w-4 ml-2" />
          </Button>
        </div>

        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-2xl">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl">
                <Bell className="h-6 w-6 text-white" />
              </div>
              Recent Activity
            </CardTitle>
            <CardDescription className="text-slate-600 text-base mt-2">
              Your latest updates and achievements
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => {
                const IconComponent = notification.icon;
                return (
                  <div
                    key={notification.id}
                    className={`group p-8 hover:bg-gradient-to-r ${
                      !notification.read ? "border-l-4 border-l-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-start gap-6">
                      <div
                        className={`p-4 rounded-2xl ${
                          notification.color === "blue"
                            ? "bg-blue-500"
                            : notification.color === "yellow"
                            ? "bg-yellow-500"
                            : notification.color === "green"
                            ? "bg-green-500"
                            : "bg-purple-500"
                        } shadow-lg group-hover:scale-110 transition-transform duration-300`}
                      >
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-lg text-slate-900 group-hover:text-slate-800 transition-colors duration-300">
                              {notification.title}
                            </h4>
                            <p className="text-slate-700 mt-2 leading-relaxed">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-3 mt-4">
                              <p className="text-sm text-slate-500 font-medium">
                                {notification.time}
                              </p>
                              {!notification.read && (
                                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                  New
                                </Badge>
                              )}
                            </div>
                          </div>
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(notification.id)}
                              className="text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl font-medium opacity-0 group-hover:opacity-100 transition-all duration-300"
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50">
      {/* Enhanced Header - Hide when viewing modules or scrolling */}
      {!hideHeader && (
        <div
          className={`bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50 transition-all duration-300 ease-in-out ${
            isHeaderVisible
              ? "translate-y-0 shadow-xl"
              : "-translate-y-full shadow-lg"
          } ${
            lastScrollY > 10 ? "shadow-2xl border-slate-300/50" : "shadow-xl"
          }`}
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 space-y-3 sm:space-y-0">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Learning Hub
                </h1>
                <div className="text-slate-600 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 sm:w-3 h-2 sm:h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse shadow-lg"></div>
                    <span className="text-sm sm:text-base lg:text-lg">
                      Welcome back,{" "}
                      <span className="font-semibold text-slate-800">
                        {user?.name}
                      </span>
                    </span>
                  </div>
                  <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200 self-start sm:self-auto text-xs sm:text-sm">
                    {stats.streak} day streak 🔥
                  </Badge>
                </div>
              </div>

              {/* Enhanced User Profile Menu */}
              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="group relative h-12 sm:h-14 lg:h-16 px-3 sm:px-4 lg:px-6 bg-gradient-to-r from-slate-50 to-blue-50 hover:from-slate-100 hover:to-blue-100 border-2 border-slate-200 hover:border-blue-300 transition-all duration-300 hover:scale-105 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                        <div className="relative">
                          <Avatar
                            key={`header-${avatarKey}`}
                            className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 ring-2 sm:ring-4 ring-slate-200 group-hover:ring-blue-300 transition-all duration-300 shadow-lg"
                          >
                            <AvatarImage
                              src={user?.avatar || "/placeholder.svg"}
                              alt={user?.name}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm sm:text-base lg:text-lg">
                              {user?.name?.charAt(0)?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-green-400 to-emerald-500 border-2 sm:border-3 border-white rounded-full shadow-lg"></div>
                        </div>
                        <div className="hidden sm:block text-left">
                          <p className="text-slate-800 font-bold text-sm lg:text-base leading-none truncate max-w-32 lg:max-w-none">
                            {user?.name || "Learner"}
                          </p>
                          <p className="text-slate-600 text-xs lg:text-sm mt-1 font-medium truncate max-w-32 lg:max-w-none">
                            {user?.email || "learner@example.com"}
                          </p>
                        </div>
                        <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 group-hover:text-slate-800 transition-all duration-300 group-data-[state=open]:rotate-180" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="w-72 sm:w-80 bg-white/95 backdrop-blur-xl border-2 border-slate-200 shadow-2xl rounded-2xl sm:rounded-3xl p-2 sm:p-3"
                  >
                    {/* Enhanced Profile Header */}
                    <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-xl sm:rounded-2xl mb-2 sm:mb-3">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <Avatar
                          key={`dropdown-${avatarKey}`}
                          className="h-12 w-12 sm:h-16 sm:w-16 ring-2 sm:ring-4 ring-blue-200 shadow-lg"
                        >
                          <AvatarImage
                            src={user?.avatar || "/placeholder.svg"}
                            alt={user?.name}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg sm:text-xl">
                            {user?.name?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 truncate text-base sm:text-lg">
                            {user?.name || "Learner Name"}
                          </p>
                          <p className="text-xs sm:text-sm text-slate-600 truncate font-medium">
                            {user?.email || "learner@example.com"}
                          </p>
                          <div className="flex items-center gap-2 mt-1 sm:mt-2">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-green-600 font-semibold">
                              Online
                            </span>
                            <Badge className="ml-1 sm:ml-2 bg-blue-100 text-blue-700 text-xs">
                              Level {Math.floor(stats.averageScore / 20)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <DropdownMenuSeparator className="bg-slate-200" />

                    {/* Enhanced Menu Items */}
                    <DropdownMenuItem
                      onClick={navigateToProfile}
                      className="group flex items-center gap-4 px-6 py-4 rounded-2xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 cursor-pointer"
                    >
                      <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 group-hover:from-blue-200 group-hover:to-blue-300 rounded-xl transition-all duration-300 group-hover:scale-110">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-base">
                          Profile Settings
                        </p>
                        <p className="text-sm text-slate-500">
                          Manage your account details
                        </p>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={navigateToPreferences}
                      className="group flex items-center gap-4 px-6 py-4 rounded-2xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 cursor-pointer"
                    >
                      <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 group-hover:from-purple-200 group-hover:to-purple-300 rounded-xl transition-all duration-300 group-hover:scale-110">
                        <Settings className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-base">
                          Learning Preferences
                        </p>
                        <p className="text-sm text-slate-500">
                          Customize your experience
                        </p>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={navigateToNotifications}
                      className="group flex items-center gap-4 px-6 py-4 rounded-2xl hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 transition-all duration-300 cursor-pointer"
                    >
                      <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-200 group-hover:from-amber-200 group-hover:to-amber-300 rounded-xl transition-all duration-300 group-hover:scale-110">
                        <Bell className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 text-base">
                          Notifications
                        </p>
                        <p className="text-sm text-slate-500">
                          View updates and alerts
                        </p>
                      </div>
                      <div className="w-3 h-3 bg-gradient-to-r from-red-400 to-pink-500 rounded-full animate-pulse shadow-lg"></div>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-slate-200 my-3" />

                    {/* Enhanced Logout Button */}
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="group flex items-center gap-4 px-6 py-4 rounded-2xl hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-300 cursor-pointer"
                    >
                      <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 group-hover:from-red-200 group-hover:to-red-300 rounded-xl transition-all duration-300 group-hover:scale-110">
                        <LogOut className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-base">
                          Sign Out
                        </p>
                        <p className="text-sm text-slate-500">
                          Logout from your account
                        </p>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Enhanced Navigation */}
            <nav className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pb-4 sm:pb-6">
              {[
                {
                  id: "overview",
                  label: "Dashboard",
                  icon: TrendingUp,
                  gradient: "from-blue-500 to-indigo-600",
                },
                {
                  id: "library",
                  label: "Course Library",
                  icon: BookOpen,
                  gradient: "from-emerald-500 to-green-600",
                },
                {
                  id: "test-series",
                  label: "Test Series",
                  icon: FileQuestion,
                  gradient: "from-purple-500 to-indigo-600",
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsHeaderVisible(true); // Show header when switching tabs
                    setLastScrollY(0); // Reset scroll tracking
                  }}
                  className={`group flex items-center justify-center sm:justify-start gap-2 sm:gap-3 py-3 sm:py-4 px-4 sm:px-6 lg:px-8 font-semibold text-sm transition-all duration-300 rounded-xl sm:rounded-2xl touch-manipulation ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${tab.gradient} text-white shadow-xl scale-105`
                      : "text-slate-600 hover:text-slate-800 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 hover:scale-105"
                  }`}
                >
                  <tab.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-xs sm:text-sm font-medium">
                    {tab.label}
                  </span>
                  {activeTab === tab.id && (
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Enhanced Content Area */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="animate-in fade-in-50 duration-700 slide-in-from-bottom-4">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
