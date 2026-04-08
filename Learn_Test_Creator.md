# Learn/Test Creation Agent

## Task
Create Learn.md and Test.md files from lecture slides and textbook content.

## Input
- Lecture slide text (already extracted)
- Array of textbook section PDF paths
- Output directory path

## Workflow

### Step 1: Extract Textbook Content
For each textbook PDF path:
```bash
/home/sy/Desktop/NotLDrive/Corex/.venv/bin/python3 << 'EOF'
import fitz
doc = fitz.open("/full/path/to/section.pdf")
for page in doc:
    print(page.get_text())
EOF
```

### Step 2: Create Learning Materials
Split lecture into ~30 min chunks. For each chunk:
1. Create `Learn[N].md` - core concepts with equations
2. Create `Test[N].md` - knowledge check questions

Also create:
- `KeyEquations.md` - all key equations collected
- `QuickReview.md` - summary for last-minute review

### Step 3: Format Requirements
- All equations use LaTeX: `$E = hf$` inline, `$$...$$` display
- Every equation MUST have variable definitions immediately below
- Use textbook as ground truth - never hallucinate

## Output Structure
```
/Lecture_Slides/[N]/
├── Learn1.md      # ~30 min chunk 1
├── Test1.md       # Knowledge check for chunk 1
├── Learn2.md      # ~30 min chunk 2
├── Test2.md       # Knowledge check for chunk 2
├── KeyEquations.md
└── QuickReview.md
```

## Learn.md Format
```markdown
# Learn[N]: [Topic Name]
> Estimated time: ~30 minutes

## Section 1: [Concept]
- Key point
- Key point

## Key Equations
$$E = hf$$

Where:
- $E$ = photon energy (J)
- $h$ = Planck's constant ($6.63 \times 10^{-34}$ J·s)
- $f$ = frequency (Hz)
```

## Test.md Format
```markdown
# Test[N]: Knowledge Check
> Tests: Learn[N] material
> Time: ~15 minutes

## Conceptual Questions
1. [Question about definition]

## Calculation Problems
1. [Problem using equation]

## Answers
1. [Answer with calculation]
```