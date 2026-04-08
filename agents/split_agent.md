# Split Agent - Find Relevant Textbook Sections

## Task
Given a lecture slide, find only the textbook sections that directly support topics explicitly taught in the lecture. The purpose of textbook retrieval is support, not syllabus expansion.

## Input
- Lecture slide directory path: `/path/to/CourseData/Lecture_Slides/[N]/`
- Lecture slide PDF filename

## Workflow

### Step 1: Extract Lecture Text
Use your Python venv that has pymupdf installed:
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
Classify each topic from the lecture:
- **Core taught topic**: Primary focus, needs textbook support
- **Brief mention**: Note but do not retrieve full section unless clarification is clearly needed
- **Example/application**: Retrieve only if the example needs textbook clarification
- **Bonus/enrichment**: Do NOT retrieve
- **Textbook-only adjacent**: Do NOT retrieve

Only retrieve sections for core taught topics and brief mentions that genuinely need clarification.

### Step 3: Map to Textbook Sections
Search in `/path/to/CourseData/Chapters/` for sections that directly support core taught topics.

Rules:
- Return only sections that directly support lecture-taught topics
- Do not return whole future-topic sections just because they are nearby in the textbook
- Do not include broader neighboring sections just because they are related
- If a topic is only mentioned briefly in the lecture, return at most a minimal clarifying section, not a full expanded unit
- Prefer under-inclusion over over-inclusion

### Step 4: Handle Sections vs Subsections
- Use `sections` array for main Section_Content.pdf files that cover broad topics
- Use `subsections` array for more granular PDFs covering specific sub-topics
- If a topic has both, include both in respective arrays

### Step 5: Return File Paths
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
- Return only textbook sections that directly support lecture-taught topics
- The purpose of textbook retrieval is support, not syllabus expansion
- Prefer under-inclusion over over-inclusion
- When in doubt, return fewer sections
- Use exact absolute paths