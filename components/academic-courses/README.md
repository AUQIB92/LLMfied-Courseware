# Academic Courses Components

This folder contains all components related to **Academic Courses** - university/college level educational content with assignments, grading, and structured academic content.

## Components Overview

### For Educators (Course Creation)

#### `AcademicCourseCreator.js`

- Main component for creating and managing academic courses
- Handles file upload (PDF, Markdown, Text) processing WITHOUT AI calls during initial processing
- Follows ExamGenius pattern: extract structure first, generate detailed content on-demand
- Supports academic content structure with Units, Sections, and Subsections
- **Key Features:**
  - File processing without immediate AI calls
  - Debounced saving to prevent constant draft saves
  - Academic content structure enhancement
  - Module management and editing

#### `AcademicModuleEditor.js`

- Dedicated module editor specifically for academic courses
- **Always uses debounced updates** to prevent constant saving while editing
- Focused on academic content with proper markdown hierarchy
- **Key Features:**
  - Smooth editing experience with debounced saves
  - Academic-specific content guidelines
  - Module content structure (# Units, ## Sections, ### Subsections)
  - Auto-save disabled to prevent conflicts with parent component

### For Learners (Course Consumption)

#### `AcademicCourseLibrary.js`

- Library view for browsing available academic courses
- Academic-specific filtering and search
- Course enrollment and progress tracking

#### `AcademicCourseViewer.js`

- Course viewing component for students
- Progress tracking, assignments, and module navigation
- Academic-specific features like assignments and grading

## Key Differences from ExamGenius

### 1. **Debounced Editing**

- Academic courses use debounced updates (1-second delay) to prevent constant saving
- Provides smooth editing experience without interrupting user typing
- Visual indicators for save status (Editing, Saving, Saved)

### 2. **Content Structure**

- Focus on academic hierarchy: Units → Sections → Subsections
- Support for assignments and grading
- University/college level content organization

### 3. **File Processing**

- Initial file upload only extracts structure (no AI calls)
- Detailed content generation happens on-demand
- Follows ExamGenius pattern of deferred AI processing

## Usage

```javascript
// Import components
import {
  AcademicCourseCreator,
  AcademicModuleEditor,
  AcademicCourseLibrary,
  AcademicCourseViewer
} from '../academic-courses';

// Use in educator dashboard
<AcademicCourseCreator onCourseCreated={refreshData} />

// Use in learner dashboard
<AcademicCourseLibrary onCourseSelect={handleCourseSelect} />
```

## API Integration

- Uses `/api/academic-courses/process-file` for file processing
- Uses `/api/exam-genius/save-course` for saving (shared with ExamGenius)
- Uses `/api/exam-genius/generate-subsection-content` for on-demand content generation

## File Structure

```
components/academic-courses/
├── README.md                    # This documentation
├── index.js                     # Export all components
├── AcademicCourseCreator.js     # Main course creation component
├── AcademicModuleEditor.js      # Dedicated academic module editor
├── AcademicCourseLibrary.js     # Course library for learners
└── AcademicCourseViewer.js      # Course viewing for learners
```

## Best Practices

1. **Always use the dedicated `AcademicModuleEditor`** for editing academic modules
2. **Content should follow markdown hierarchy**: `#` Units, `##` Sections, `###` Subsections
3. **Let debounced saving handle saves** - don't trigger manual saves frequently
4. **Use the "Enhance Structure" button** to automatically format content with proper hierarchy
5. **Generate detailed content on-demand** rather than during initial file processing
