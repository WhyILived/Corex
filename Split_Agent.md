# Split Agent - Find Relevant Textbook Sections

## Task
Given a lecture slide, find all relevant textbook PDF sections needed to cover the material.

## Input
- Lecture slide directory path: `/home/sy/Desktop/NotLDrive/Corex/ECE_109/Lecture_Slides/[N]/`
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
- Key terms: quantum, photon, electron, wave, energy, band, crystal, dielectric
- Section titles, equations, phenomena
- Historical context (Planck, Einstein, etc.)

### Step 3: Map to Textbook Sections
Available chapters in `/home/sy/Desktop/NotLDrive/Corex/ECE_109/Chapters/`:
- Ch01_Materials_Science/ - atomic structure, bonding, crystals
- Ch03_Quantum_Physics/ - photons, electron waves, Schrödinger
- Ch04_Band_Theory_Solids/ - band theory, semiconductors
- Ch07_Dielectric_Materials/ - polarization, dielectric constant
- Ch09_Optical_Properties/ - light waves, refractive index

### Step 4: Return File Paths
Return paths to Section_Content.pdf files (required) and subsection PDFs (optional).

## Output Format
```json
{
  "sections": [
    "/home/sy/Desktop/NotLDrive/Corex/ECE_109/Chapters/Ch3_S01_Photons/Section_Content.pdf"
  ],
  "subsections": [
    "/home/sy/Desktop/NotLDrive/Corex/ECE_109/Chapters/Ch3_S01_Photons/SS3_1_2_The_Photoelectric_Effect.pdf"
  ],
  "coverage": [
    {"topic": "Photoelectric effect", "section": "Ch3_S01"}
  ]
}
```

## Rules
- Be thorough - missing sections = incomplete learning
- Use exact absolute paths
- When in doubt, include more sections