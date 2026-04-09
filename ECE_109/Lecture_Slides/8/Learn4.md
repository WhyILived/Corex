# Learn4: Crystalline State and Bravais Lattices
> Estimated time: ~30 minutes

## Section 1: Crystal Structure Fundamentals

### Definitions
- **Crystalline solid**: A periodic collection of atoms with long-range order
- **Lattice**: An infinite periodic array of geometric points in space (without atoms)
- **Basis**: An identical group of atoms (or molecules) associated with each lattice point
- **Crystal**: Lattice + Basis

The relationship: **Lattice + Basis = Crystal**

Different crystals can have the same lattice but different bases.

## Section 2: Unit Cells

### Definition
A **unit cell** is the smallest portion of a crystal that can be used to reproduce the entire crystal by translation.

### Primitive Unit Cells
- Smallest possible unit cell
- Contains one lattice point (at each corner)
- Can be described by primitive lattice vectors $\vec{a}$, $\vec{b}$, $\vec{c}$

### Lattice Vectors
Any lattice point can be reached from another by a **lattice vector**:
$$\vec{R} = h\hat{a} + k\hat{b} + l\hat{c}$$

Where h, k, l are integers.

### Wigner-Seitz Cell
A special type of primitive cell constructed by:
1. Drawing lines to connect a lattice point to all nearby points
2. Drawing perpendicular bisectors to these lines
3. The smallest enclosed volume is the Wigner-Seitz cell

The Wigner-Seitz cell can be translated to fill all space without gaps.

## Section 3: Unit Cell Geometry

The geometry of a unit cell is described by **lattice parameters**:
- **a, b, c**: lengths of the three primitive vectors
- **α**: angle between b and c
- **β**: angle between a and c  
- **γ**: angle between a and b

## Section 4: The 14 Bravais Lattices

Bravais lattices are the distinct lattice types that can fill 3D space. There are **14 Bravais lattices** organized into **7 crystal systems**.

### Cubic System (a = b = c, α = β = γ = 90°)
1. **Simple Cubic (SC)**
2. **Body-Centered Cubic (BCC)**
3. **Face-Centered Cubic (FCC)**

### Tetragonal System (a = b ≠ c, α = β = γ = 90°)
4. **Simple Tetragonal**
5. **Body-Centered Tetragonal**

### Orthorhombic System (a ≠ b ≠ c, α = β = γ = 90°)
6. **Simple Orthorhombic**
7. **Body-Centered Orthorhombic**
8. **Base-Centered Orthorhombic**
9. **Face-Centered Orthorhombic**

### Hexagonal System (a = b ≠ c, α = β = 90°, γ = 120°)
10. **Simple Hexagonal**

### Rhombohedral System (a = b = c, α = β = γ ≠ 90°)
11. **Rhombohedral** (also called trigonal)

### Monoclinic System (a ≠ b ≠ c, α = β = 90°, γ ≠ 90°)
12. **Simple Monoclinic**
13. **Base-Centered Monoclinic**

### Triclinic System (a ≠ b ≠ c, α ≠ β ≠ γ ≠ 90°)
14. **Triclinic**

## Section 5: Common Crystal Structures

### Face-Centered Cubic (FCC)
- Atoms at each corner and at center of each face
- Coordination number: 12
- Examples: Al, Cu, Fe (at high T), Pb, Ni

### Body-Centered Cubic (BCC)
- Atoms at each corner and one at body center
- Coordination number: 8
- Examples: Fe (at room temperature), Cr, W

### Simple Hexagonal
- Atoms at corners of hexagonal prism
- Layer arrangement: ABAB...
- Examples: Mg, Cd, Zn

## Section 6: Diamond Structure

The **diamond structure** is a special case of FCC with a **two-atom basis**.

Key features:
- FCC lattice with two atoms per primitive cell
- Each atom has 4 nearest neighbors (tetrahedral coordination)
- The two atoms are separated by (1/4, 1/4, 1/4) of the cell dimension
- Examples: Si, Ge, C (diamond)

The diamond structure results from covalent bonding, where each atom shares electrons with four neighbors in a tetrahedral arrangement.

## Section 7: 2D Bravais Lattices

In two dimensions, there are only **6 Bravais lattices** (4 systems):
1. Oblique
2. Rectangular
3. Centered Rectangular
4. Square
5. Hexagonal
6. Parallelogram