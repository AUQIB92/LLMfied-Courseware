# Flashcard Data Cleanup Instructions

## Issue Identified

Your screenshot shows "Quick Review Flashcards (1)" which indicates there's still legacy `flashCards` data in the database that's being displayed in the course viewer, even though we've updated the editor to ignore legacy data.

## Solution Options

### Option 1: Force Data Cleanup in the Course Viewer (Recommended)

We can update the course viewer to automatically convert or ignore legacy flashcard data, similar to what we did in the editor.

### Option 2: Database Migration (More Complete)

Run a script to clean up all legacy flashcard data in the database.

### Option 3: Regenerate Content (User Action)

Users can regenerate the subsection content to get the new categorized structure.

## Current Status

- **ExamModuleEditorEnhanced**: ✅ Updated to ignore legacy data and force categorized structure
- **ExamGeniusCourseViewer**: ⚠️ Still shows legacy data if it exists
- **Database**: ⚠️ Contains mixed legacy and categorized data

## Next Steps Needed

1. **Update Course Viewer**: Force categorized structure display like we did in the editor
2. **Test Results**: Verify the clean categorized display works
3. **User Guidance**: Provide instructions for regenerating content if needed

## Expected Result After Fix

- All subsections show: "Study Flashcards" with categorized structure
- No more "Quick Review Flashcards" legacy display
- Clean 🧠 Concept Cards + 🧮 Formula Cards experience
