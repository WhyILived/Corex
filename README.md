# Exam Preparation Pipeline

An automated multi-agent system that generates personalized Learn/Test study materials for any university course.

## Overview

This project uses a pipeline of specialized AI agents to:
1. Analyze lecture slides and identify relevant textbook sections
2. Generate structured learning materials with equations and examples
3. Create knowledge-check tests aligned with the lecture content
4. Ensure complete coverage of all lecture topics (coverage evaluation)
5. Verify accuracy against the textbook (anti-hallucination)

## Project Structure

```
Corex/
├── Teacher.md              # Main pipeline orchestrator
├── agents/
│   ├── split_agent.md      # Finds relevant textbook sections
│   ├── coverage_eval_agent.md  # Checks coverage completeness
│   └── anti_hallucinate_agent.md  # Verifies content accuracy
├── CourseData/             # Course-specific content (textbooks, slides)
│   ├── Chapters/          # Split textbook PDFs (by chapter/section)
│   └── Lecture_Slides/     # Original slides + generated materials
└── Docs/
    └── Source_Books/       # Original textbook PDFs (not committed)
```

## Pipeline Flow

```
Lecture Slides → [Split Agent] → Textbook Sections
                                      ↓
                         [Teacher Agent creates Learn/Test]
                                      ↓
                    [Coverage Evaluation - single agent]
                                      ↓ (loop until PASS)
              [Anti-Hallucination - parallel agents per pair]
                                      ↓ (loop until all PASS)
                              Final Materials
```

## Setup

1. **Python Environment**:
   ```bash
   cd /path/to/Corex
   # Create venv if needed:
   python3 -m venv .venv
   .venv/bin/pip install pymupdf
   ```

2. **Update Python paths**: When running agents, replace `/path/to/venv/bin/python3` in the Python commands with your actual venv path.

## Key Features

- **Dynamic chunking**: Creates Learn/Test pairs based on ~30 min content chunks
- **LaTeX equations**: All equations rendered with proper notation and variable definitions
- **Ground truth verification**: All content sourced from textbook, never hallucinated
- **Coverage first**: Coverage evaluation checks all content is present before accuracy verification
- **Parallel validation**: Anti-hallucination checks run concurrently for efficiency
- **Iterative refinement**: Loops until all accuracy and coverage checks pass

## Agent Roles

| Agent | Purpose |
|-------|---------|
| **Teacher** | Orchestrates pipeline, creates Learn/Test files, coordinates all agents |
| **Split Agent** | Analyzes lecture and identifies relevant textbook sections |
| **Coverage Evaluation** | Confirms all lecture topics are covered (single agent) |
| **Anti-Hallucination** | Verifies Learn/Test content matches textbook exactly (parallel per pair) |

## Usage

The pipeline is designed to be run by a parent agent. To process a lecture:

1. Provide the lecture slide PDF path to the Teacher agent
2. Teacher runs through the pipeline steps automatically
3. Final Learn/Test materials are output to `CourseData/Lecture_Slides/[N]/`

## Notes

- PDF files are excluded from git (too large, proprietary content)
- Generated materials can be regenerated from lecture slides + textbook
- Python venv is excluded - recreate with `python3 -m venv .venv && .venv/bin/pip install pymupdf`