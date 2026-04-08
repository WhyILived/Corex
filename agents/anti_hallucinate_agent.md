# Anti-Hallucination Agent - Content Verification

## Task
Verify Learn.md and Test.md are both factually accurate AND faithful to the lecture scope. Flag any factual hallucinations and any scope hallucinations.

## Input
- Learn.md file path
- Test.md file path
- Lecture slide PDF path (to check scope fidelity)
- Array of textbook PDF paths (ground truth for factual accuracy)

## Two-Part Verification
1. **Factual accuracy**: Content matches the textbook
2. **Scope fidelity**: Content was actually taught in the lecture

A file must pass BOTH checks.

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

### Step 2: Extract Textbook Content
For each PDF:
```bash
/home/sy/Desktop/NotLDrive/Corex/.venv/bin/python3 << 'EOF'
import fitz
doc = fitz.open("/full/path/to/textbook.pdf")
text = ""
for page in doc:
    text += page.get_text() + "\n"
print(text)
EOF
```

### Step 3: Read Learn.md and Test.md
Use Read tool on the markdown files.

### Step 4: Cross-Reference for Factual Accuracy
For each key claim:
- **Equations**: match form, variables, units
- **Facts**: quote supporting textbook passage
- **Definitions**: verify accuracy
- **Test questions**: ensure they test Learn content

### Step 5: Check Scope Fidelity
Compare every major section/question against the lecture:
- Was this topic actually taught in the lecture?
- Is this content faithful to what the lecture taught, or does it expand beyond it?
- Correct content that was not taught in the lecture is still a failure

### Step 6: Return Structured Result

```json
{
  "status": "PASS" | "NEEDS_REVISION" | "FAIL",
  "factual_accuracy_score": 0-10,
  "scope_fidelity_score": 0-10,
  "learn_issues": [
    {"type": "factual|scope", "claim": "...", "issue": "...", "textbook_quote": "...", "lecture_evidence": "..."}
  ],
  "test_issues": [
    {"question": "Q1", "type": "factual|scope", "issue": "...", "fix_required": "..."}
  ],
  "summary": "Brief explanation"
}
```

## Pass Criteria
- **PASS**: All content verified against textbook AND all content is faithful to lecture scope
- **NEEDS_REVISION**: Minor issues found, content is mostly accurate and mostly in scope
- **FAIL**: Major factual errors OR content that contradicts lecture scope

## Failure/Revision Conditions (any one triggers failure)
- Factual error: content does not match textbook
- Scope hallucination: content is factually correct but was not taught in the lecture
- Introduces textbook-only material that lecture did not cover
- Promotes examples into core topics
- Content accurate but out-of-scope is still a failure

## Rules
- Always cite exact textbook passages when flagging factual issues
- Cite lecture content when flagging scope issues
- Distinguish minor style (ok) from factual errors (must fix) and scope errors (must fix)
- Check equation variable names and units carefully
- Verify test problem numerical answers
- Accurate but out-of-scope content is still a failure