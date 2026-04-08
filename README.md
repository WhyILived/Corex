# Exam Preparation Pipeline

An automated multi-agent system that generates personalized Learn/Test study materials for any university course.

## Overview

This project uses a pipeline of specialized AI agents to:
1. Analyze lecture slides and identify relevant textbook sections
2. Generate structured learning materials with equations and examples
3. Create knowledge-check tests aligned with the lecture content
4. Verify accuracy against the textbook (anti-hallucination)
5. Ensure complete coverage of all lecture topics

## Project Structure

```
Corex/
├── Teacher.md           # Main pipeline orchestrator
├── Split_Agent.md       # Finds relevant textbook sections
├── Anti_Hallucinate.md  # Verifies content accuracy
├── Final_Eval.md        # Checks coverage completeness
├── CourseData/          # Course-specific content (textbooks, slides)
│   ├── Chapters/        # Split textbook PDFs (by chapter/section)
│   └── Lecture_Slides/  # Original slides + generated materials
└── Docs/
    └── Source_Books/    # Original textbook PDFs (not committed)
```

## Pipeline Flow

```
Lecture Slides → [Split Agent] → Textbook Sections
                                      ↓
                           [Teacher Agent creates Learn/Test]
                                      ↓
                           [Anti-Hallucination Check] ← Textbook
                                      ↓ (loop until PASS)
                           [Final Evaluation] ← Lecture Slides
                                      ↓ (loop until PASS)
                              Final Materials
```

## Setup

1. **Python Environment** (already configured):
   ```bash
   cd /path/to/Corex
   source .venv/bin/activate  # or use .venv/bin/python3
   ```

2. **PDF Extraction** uses pymupdf - already installed in `.venv`

## Key Features

- **Dynamic chunking**: Creates Learn/Test pairs based on ~30 min content chunks
- **LaTeX equations**: All equations rendered with proper notation and variable definitions
- **Ground truth verification**: All content sourced from textbook, never hallucinated
- **Parallel validation**: Multiple content checks run concurrently for efficiency
- **Iterative refinement**: Loops until all accuracy and coverage checks pass

## Agent Roles

| Agent | Purpose |
|-------|---------|
| **Teacher** | Orchestrates pipeline, creates Learn/Test files, coordinates all agents |
| **Split Agent** | Analyzes lecture and identifies relevant textbook sections |
| **Anti-Hallucination** | Verifies Learn/Test content matches textbook exactly |
| **Final Evaluation** | Confirms all lecture topics are covered |

## Usage

The pipeline is designed to be run by a parent agent. To process a lecture:

1. Provide the lecture slide PDF path to the Teacher agent
2. Teacher runs through the pipeline steps automatically
3. Final Learn/Test materials are output to `CourseData/Lecture_Slides/[N]/`

## Notes

- PDF files are excluded from git (too large, proprietary content)
- Generated materials can be regenerated from lecture slides + textbook
- The `.venv/` directory is also excluded - recreate with `python3 -m venv .venv && .venv/bin/pip install pymupdf`