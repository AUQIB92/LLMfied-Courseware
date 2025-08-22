import { NextResponse } from 'next/server';

// In a real application, this would connect to your database
// For now, we'll use in-memory storage (this will reset on server restart)
let submissions = [];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const assignmentId = searchParams.get('assignmentId');

    let filteredSubmissions = submissions;

    // Filter by student ID if provided
    if (studentId) {
      filteredSubmissions = filteredSubmissions.filter(sub => sub.studentId === studentId);
    }

    // Filter by assignment ID if provided
    if (assignmentId) {
      filteredSubmissions = filteredSubmissions.filter(sub => sub.assignmentId === assignmentId);
    }

    return NextResponse.json({
      success: true,
      submissions: filteredSubmissions
    });

  } catch (error) {
    console.error("❌ Error fetching submissions:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch submissions",
        details: error.message,
        success: false
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      assignmentId,
      studentId,
      studentName,
      googleDriveLink,
      comments,
      dueDate
    } = body;

    // Validate required fields
    if (!assignmentId || !studentId || !googleDriveLink) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: "assignmentId, studentId, and googleDriveLink are required",
          success: false
        },
        { status: 400 }
      );
    }

    // Validate Google Drive link format
    const googleDrivePatterns = [
      /^https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/view/,
      /^https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
      /^https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/,
      /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
      /^https:\/\/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/
    ];

    const isValidGoogleDriveLink = googleDrivePatterns.some(pattern => 
      pattern.test(googleDriveLink)
    );

    if (!isValidGoogleDriveLink) {
      return NextResponse.json(
        {
          error: "Invalid Google Drive link",
          details: "Please provide a valid Google Drive sharing link",
          success: false
        },
        { status: 400 }
      );
    }

    // Check if assignment is still accepting submissions
    if (dueDate) {
      const now = new Date();
      const dueDateObj = new Date(dueDate);
      
      if (now > dueDateObj) {
        return NextResponse.json(
          {
            error: "Assignment deadline has passed",
            details: "Submissions are no longer accepted for this assignment",
            success: false
          },
          { status: 403 }
        );
      }
    }

    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const submittedAt = new Date();
    const isLate = dueDate ? submittedAt > new Date(dueDate) : false;

    // Check if submission already exists
    const existingSubmissionIndex = submissions.findIndex(
      sub => sub.assignmentId === assignmentId && sub.studentId === studentId
    );

    const submission = {
      id: submissionId,
      assignmentId,
      studentId,
      studentName: studentName || 'Unknown Student',
      googleDriveLink,
      comments: comments || '',
      submittedAt,
      isLate,
      updatedAt: submittedAt
    };

    if (existingSubmissionIndex >= 0) {
      // Update existing submission
      submission.id = submissions[existingSubmissionIndex].id;
      submission.createdAt = submissions[existingSubmissionIndex].createdAt || submittedAt;
      submissions[existingSubmissionIndex] = submission;
      
      console.log("📝 Submission updated:", {
        id: submission.id,
        assignmentId,
        studentId,
        isLate
      });
    } else {
      // Create new submission
      submission.createdAt = submittedAt;
      submissions.push(submission);
      
      console.log("✅ New submission created:", {
        id: submission.id,
        assignmentId,
        studentId,
        isLate
      });
    }

    return NextResponse.json({
      success: true,
      submission,
      message: existingSubmissionIndex >= 0 ? "Submission updated successfully" : "Submission created successfully"
    });

  } catch (error) {
    console.error("❌ Error processing submission:", error);
    return NextResponse.json(
      {
        error: "Failed to process submission",
        details: error.message,
        success: false
      },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      submissionId,
      googleDriveLink,
      comments,
      dueDate
    } = body;

    if (!submissionId) {
      return NextResponse.json(
        {
          error: "Missing submission ID",
          success: false
        },
        { status: 400 }
      );
    }

    // Check if assignment is still accepting submissions
    if (dueDate) {
      const now = new Date();
      const dueDateObj = new Date(dueDate);
      
      if (now > dueDateObj) {
        return NextResponse.json(
          {
            error: "Assignment deadline has passed",
            details: "Submissions can no longer be updated for this assignment",
            success: false
          },
          { status: 403 }
        );
      }
    }

    const submissionIndex = submissions.findIndex(sub => sub.id === submissionId);

    if (submissionIndex === -1) {
      return NextResponse.json(
        {
          error: "Submission not found",
          success: false
        },
        { status: 404 }
      );
    }

    // Update submission
    const updatedSubmission = {
      ...submissions[submissionIndex],
      googleDriveLink: googleDriveLink || submissions[submissionIndex].googleDriveLink,
      comments: comments !== undefined ? comments : submissions[submissionIndex].comments,
      updatedAt: new Date()
    };

    submissions[submissionIndex] = updatedSubmission;

    console.log("📝 Submission updated:", {
      id: submissionId,
      assignmentId: updatedSubmission.assignmentId,
      studentId: updatedSubmission.studentId
    });

    return NextResponse.json({
      success: true,
      submission: updatedSubmission,
      message: "Submission updated successfully"
    });

  } catch (error) {
    console.error("❌ Error updating submission:", error);
    return NextResponse.json(
      {
        error: "Failed to update submission",
        details: error.message,
        success: false
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');
    const dueDate = searchParams.get('dueDate');

    if (!submissionId) {
      return NextResponse.json(
        {
          error: "Missing submission ID",
          success: false
        },
        { status: 400 }
      );
    }

    // Check if assignment is still accepting modifications
    if (dueDate) {
      const now = new Date();
      const dueDateObj = new Date(dueDate);
      
      if (now > dueDateObj) {
        return NextResponse.json(
          {
            error: "Assignment deadline has passed",
            details: "Submissions can no longer be deleted for this assignment",
            success: false
          },
          { status: 403 }
        );
      }
    }

    const submissionIndex = submissions.findIndex(sub => sub.id === submissionId);

    if (submissionIndex === -1) {
      return NextResponse.json(
        {
          error: "Submission not found",
          success: false
        },
        { status: 404 }
      );
    }

    const deletedSubmission = submissions[submissionIndex];
    submissions.splice(submissionIndex, 1);

    console.log("🗑️ Submission deleted:", {
      id: submissionId,
      assignmentId: deletedSubmission.assignmentId,
      studentId: deletedSubmission.studentId
    });

    return NextResponse.json({
      success: true,
      message: "Submission deleted successfully"
    });

  } catch (error) {
    console.error("❌ Error deleting submission:", error);
    return NextResponse.json(
      {
        error: "Failed to delete submission",
        details: error.message,
        success: false
      },
      { status: 500 }
    );
  }
}