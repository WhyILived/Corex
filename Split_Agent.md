# Split Agent - Find Relevant Textbook Sections

## Task
Given a lecture slide, find all relevant textbook PDF sections needed to cover the material.

## Input
- Lecture slide directory path: `/path/to/CourseData/Lecture_Slides/[N]/`
- Lecture slide PDF filename

## Workflow

### Step 1: Extract Lecture Text
```bash
/home/sy/Desktop/NotLDrive/Corex/.venv/bin/python3 << 'EOF'
import fitz
doc = fitz.open("/full/path/to/lecture.pdf")
for i, page in enumerate(doc):
    print(f"=== Page {i+1} ===")
    print(page.get_text())
EOF
```

### Step 2: Identify Topics
Look for:
- Key terms relevant to the course subject
- Section titles, equations, phenomena
- Historical context if applicable

### Step 3: Map to Textbook Sections
Search in `/path/to/CourseData/Chapters/` for relevant sections:
- Look for chapter and section directories containing textbook content
- Find Section_Content.pdf files (main content) and subsection PDFs (granular topics)

### Step 4: Return File Paths
Return paths to Section_Content.pdf files (required) and subsection PDFs (optional).

## Output Format
```json
{
  "sections": [
    "/path/to/CourseData/Chapters/Some_Section/Section_Content.pdf"
  ],
  "subsections": [
    "/path/to/CourseData/Chapters/Some_Section/SS1_2_Topic_Name.pdf"
  ],
  "coverage": [
    {"topic": "Topic name", "section": "Some_Section"}
  ]
}
```

## Rules
- Be thorough - missing sections = incomplete learning
- Use exact absolute paths
- When in doubt, include more sections