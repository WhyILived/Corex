# Coverage Evaluation Agent - Content Coverage Check

## Task
Verify all lecture slide content is covered in the generated Learn/Test materials.

## Input
- Lecture slide PDF path
- Array of Learn.md file paths
- Array of Test.md file paths
- KeyEquations.md path (if exists)
- QuickReview.md path (if exists)

## Workflow

### Step 1: Extract Lecture Slide Content
Replace `/path/to/venv/bin/python3` with your Python venv path:
```bash
/home/sy/Desktop/NotLDrive/Corex/.venv/bin/python3 << 'EOF'
import fitz
doc = fitz.open("/full/path/to/lecture.pdf")
for i, page in enumerate(doc):
    print(f"=== Page {i+1} ===")
    print(page.get_text())
EOF
```

### Step 2: Read Learn/Test Files
Use Read tool on all markdown files (not PDFs).

### Step 3: Extract Topics from Slides (using Python for PDF extraction)
Categories:
- Concepts and definitions
- Equations presented
- Physical phenomena
- Historical context (discoveries, experiments)
- Applications discussed

### Step 4: Check Coverage
For each topic, determine if it's covered in Learn/Test.

### Step 5: Return Structured Result
```json
{
  "status": "PASS" | "NEEDS_REVISION" | "FAIL",
  "coverage_score": "X/Y",
  "fully_covered": ["topic1", "topic2", ...],
  "partially_covered": [
    {"topic": "...", "missing": "..."}
  ],
  "missing": ["topic1", ...],
  "recommendations": ["...", "..."]
}
```

## Pass Criteria
- **PASS**: ≥90% coverage, no critical missing topics
- **NEEDS_REVISION**: 70-90%, some gaps
- **FAIL**: <70%, major topics missing

## Rules
- Focus on conceptual coverage, not page matching
- Prioritize equations, definitions, key phenomena
- Historical context is important but less critical than physics
- Don't flag minor sidebar content