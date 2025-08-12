# HTML Editor Feature for Academic Course Content

## Overview
The Academic Module Editor now includes a powerful HTML editor that allows educators to create rich, formatted content for their course pages. This feature provides a user-friendly interface for editing content with both HTML and Markdown support.

## Features

### 🎨 Rich Text Editing
- **Bold, Italic, Underline**: Format text with toolbar buttons or keyboard shortcuts
- **Headings**: Create H1, H2, H3 headings for better content structure
- **Lists**: Create bullet points and numbered lists
- **Quotes**: Add blockquotes for important information
- **Code Blocks**: Insert code snippets with proper formatting
- **Links & Images**: Add hyperlinks and images to your content
- **Text Alignment**: Align text left, center, or right

### ⌨️ Keyboard Shortcuts
- `Ctrl+B` (or `Cmd+B` on Mac): Bold text
- `Ctrl+I` (or `Cmd+I` on Mac): Italic text
- `Ctrl+U` (or `Cmd+U` on Mac): Underline text
- `Ctrl+Z` (or `Cmd+Z` on Mac): Undo
- `Ctrl+Shift+Z` (or `Cmd+Shift+Z` on Mac): Redo

### 🔄 Dual Mode Support
- **HTML Mode**: Use the rich text toolbar for visual editing
- **Markdown Mode**: Use traditional markdown syntax
- **Toggle Between Modes**: Switch between HTML and Markdown anytime during editing

### 👀 Live Preview
- See exactly how your content will appear to students
- Real-time preview updates as you type
- Different preview rendering for HTML vs Markdown content

## How to Use

### Opening the Editor
1. Navigate to your academic course module
2. Click the "Edit" button on any page content
3. The edit modal will open with the HTML editor

### HTML Mode
1. Select "HTML" from the edit mode toggle
2. Use the toolbar buttons to format your content:
   - Click the **B** button for bold text
   - Click the **I** button for italic text
   - Click the **U** button for underlined text
   - Use heading buttons (H1, H2, H3) for titles
   - Use list buttons for bullet points and numbered lists
   - Use the quote button for blockquotes
   - Use the code button for code blocks
   - Use link and image buttons to add external content

### Markdown Mode
1. Select "Markdown" from the edit mode toggle
2. Use traditional markdown syntax:
   - `**bold**` for bold text
   - `*italic*` for italic text
   - `# Heading 1`, `## Heading 2`, `### Heading 3` for headings
   - `- item` or `* item` for bullet lists
   - `1. item` for numbered lists
   - `> quote` for blockquotes
   - `[link text](url)` for links
   - `![alt text](image url)` for images

### Preview
- The preview section shows exactly how your content will appear
- HTML mode shows rendered HTML content
- Markdown mode shows rendered markdown content
- Preview updates in real-time as you edit

### Saving Changes
1. Review your content in the preview section
2. Click "Save Changes" to apply your edits
3. Your content will be saved and displayed to students

## Best Practices

### Content Structure
- Use headings (H1, H2, H3) to organize your content hierarchically
- Break up long paragraphs with proper spacing
- Use lists to present information clearly
- Include key takeaways for important concepts

### Formatting
- Use bold text sparingly for emphasis
- Use italic text for definitions or foreign terms
- Use blockquotes for important notes or examples
- Use code blocks for code snippets or technical content

### Accessibility
- Provide alt text for images
- Use descriptive link text
- Maintain good contrast ratios
- Structure content with proper headings

## Technical Details

### Content Storage
- HTML content is stored as HTML markup
- Markdown content is stored as markdown text
- Both formats are supported by the content renderer
- Content is automatically sanitized for security

### Browser Compatibility
- Works in all modern browsers
- Supports keyboard shortcuts across platforms
- Responsive design for mobile devices
- Graceful fallbacks for older browsers

### Performance
- Lightweight implementation using native browser APIs
- No external dependencies for core functionality
- Efficient content processing and rendering
- Optimized for real-time editing

## Troubleshooting

### Common Issues
1. **Content not saving**: Make sure to click "Save Changes" before closing
2. **Formatting not working**: Check that you're in the correct edit mode
3. **Preview not updating**: Try switching between HTML and Markdown modes
4. **Keyboard shortcuts not working**: Ensure the editor is focused

### Getting Help
- Check the editing tips in the modal
- Try switching between HTML and Markdown modes
- Use the preview section to verify your content
- Contact support if issues persist

## Future Enhancements
- Advanced formatting options (tables, colors, fonts)
- Image upload and management
- Collaborative editing features
- Version history and rollback
- Advanced markdown extensions
- Math equation support
- Code syntax highlighting
