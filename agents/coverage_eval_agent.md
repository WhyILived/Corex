# Coverage Evaluation Agent - Content Coverage Check

## Task
Verify that Learn/Test materials faithfully cover the lecture-taught material without expanding into out-of-scope content. The lecture defines scope.

## Input
- Lecture slide PDF path
- Array of Learn.md file paths
- Array of Test.md file paths
- KeyEquations.md path (if exists)
- QuickReview.md path (if exists)

## Scope Rules
- Lecture slides are the authoritative source for scope
- Textbook is for clarification and verification only
- Coverage means faithful coverage of lecture-taught material, not maximal related content
- Learn/Test files must not contain substantial out-of-scope expansion

## Workflow

### Step 1: Extract Lecture Slide Content
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

### Step 2: Read Learn/Test Files
Use Read tool on all markdown files (not PDFs).

### Step 3: Extract Topics from Slides (using Python for PDF extraction)
Classify each topic:
- **Core taught topic**: Primary focus of the lecture
- **Supporting point**: Minor point that supports a core topic
- **Example/application**: Illustrative example, not a main topic
- **Bonus/enrichment**: Extra material not required for exam
- **Textbook-only adjacent**: Related but not taught in lecture

### Step 4: Check Coverage AND Scope Fidelity
For each topic, determine:
1. Is it covered in Learn/Test? (coverage check)
2. Does Learn/Test contain substantial content beyond what the lecture teaches? (scope fidelity check)

### Step 5: Return Structured Result
```json
{
  "status": "PASS" | "NEEDS_REVISION" | "FAIL",
  "failure_mode": "none" | "missing_content" | "out_of_scope" | "both",
  "coverage_score": "X/Y",
  "fully_covered": ["topic1", "topic2", ...],
  "partially_covered": [
    {"topic": "...", "missing": "..."}
  ],
  "missing": ["topic1", ...],
  "out_of_scope_expansion": ["LearnX.md contains textbook-only material: ..."],
  "recommendations": ["...", "..."]
}
```

`failure_mode` must be one of:
- `"missing_content"`: Core lecture topics are not covered
- `"out_of_scope"`: Learn/Test contains substantial expansion beyond lecture scope
- `"both"`: Both missing content AND out-of-scope expansion present
- `"none"`: No failure (status is not FAIL)

## Pass Criteria
- **PASS**: ≥90% of core lecture topics covered AND no substantial out-of-scope expansion
- **NEEDS_REVISION**: 70-90% coverage, OR minor out-of-scope content present
- **FAIL**: <70% coverage, OR significant out-of-scope expansion detected

## Failure/Revision Conditions (any one triggers failure)
- Introduces textbook-only material that the lecture did not teach
- Promotes examples into full topics
- Expands bonus/enrichment into core content
- Includes plausible but lecture-unsupported material
- Accurate but out-of-scope content is still a failure

## Rules
- Focus on conceptual coverage, not page matching
- Prioritize equations, definitions, key phenomena
- Check scope fidelity - out-of-scope content counts against PASS
- Don't flag minor sidebar content