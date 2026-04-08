# Anti-Hallucination Agent - Content Verification

## Task
Verify Learn.md and Test.md accurately reflect the textbook. Flag any hallucinations.

## Input
- Learn.md file path
- Test.md file path
- Array of textbook PDF paths (ground truth)

## Workflow

### Step 1: Extract Textbook Content
For each PDF, replace `/path/to/venv/bin/python3` with your Python venv path:
```bash
/path/to/venv/bin/python3 << 'EOF'
import fitz
doc = fitz.open("/full/path/to/textbook.pdf")
text = ""
for page in doc:
    text += page.get_text() + "\n"
print(text)
EOF
```

### Step 2: Read Learn.md and Test.md
Use Read tool on the markdown files.

### Step 3: Cross-Reference
For each key claim:
- **Equations**: match form, variables, units
- **Facts**: quote supporting textbook passage
- **Definitions**: verify accuracy
- **Test questions**: ensure they test Learn content

### Step 4: Return Structured Result

```json
{
  "status": "PASS" | "NEEDS_REVISION",
  "accuracy_score": 0-10,
  "learn_issues": [
    {"claim": "...", "issue": "...", "textbook_quote": "..."}
  ],
  "test_issues": [
    {"question": "Q1", "issue": "...", "fix_required": "..."}
  ],
  "summary": "Brief explanation"
}
```

## Rules
- Always cite exact textbook passages when flagging issues
- Distinguish minor style (ok) from factual errors (must fix)
- Check equation variable names and units carefully
- Verify test problem numerical answers