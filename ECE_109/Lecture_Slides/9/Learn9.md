# Learn9: Crystal Structure Fundamentals
> Estimated time: ~30 minutes

## Crystal Structures: Lattice, Basis, and Unit Cell

A **crystalline solid** is a periodic collection of atoms with long-range order. The key concepts are:

- **Lattice**: An infinite periodic array of geometric points in space, without any atoms. It is a purely imaginary geometric concept.
- **Basis**: An identical group of atoms (or molecules) placed at each lattice point to generate the actual crystal structure.
- **Crystal** = Lattice + Basis at each lattice point

Example: In copper (FCC), each lattice point has one Cu atom as the basis. In diamond, each lattice point has two atoms displaced by a quarter of the lattice distance.

### Unit Cells

A **unit cell** is the smallest portion of a crystal that can be used to reproduce the entire crystal by translation along lattice vectors.

**Lattice vectors** connect two lattice points: R = ha + kb + lc, where a, b, c are primitive vectors.

**Primitive unit cells** contain only one lattice point and represent the smallest possible cell volume.

### Wigner-Seitz Unit Cell

The Wigner-Seitz (WS) cell is a type of primitive cell with special properties:
1. Choose a reference lattice point
2. Connect to all neighboring lattice points with straight lines
3. Draw perpendicular planes at the midpoints of each line
4. The smallest enclosed volume is the WS cell

The WS cell is powerful because it can fill all space in a lattice without gaps when translated along lattice vectors. It provides a unique primitive unit cell for any given lattice.

## Lattice Parameters

The geometry of a unit cell is described by six parameters:
- **a, b, c**: lengths of the three edges
- **α, β, γ**: angles between edges (α between b and c, β between a and c, γ between a and b)

These six parameters define the **unit cell geometry** and are called the **lattice parameters**.

## Bravais Lattices and Crystal Systems

A **Bravais lattice** is a distinct lattice pattern that can fill space by translation. There are **14 Bravais lattices** organized into **7 crystal systems**.

### The 7 Crystal Systems

| Crystal System | Lattice Parameters | Examples |
|----------------|-------------------|----------|
| **Cubic** | a = b = c, α = β = γ = 90° | Cu, Fe, NaCl, Si, GaAs |
| **Tetragonal** | a = b ≠ c, α = β = γ = 90° | In, Sn, TiO₂ |
| **Orthorhombic** | a ≠ b ≠ c, α = β = γ = 90° | S, U, iodine |
| **Rhombohedral** | a = b = c, α = β = γ ≠ 90° | As, Bi, Sb |
| **Hexagonal** | a = b ≠ c, α = β = 90°, γ = 120° | Cd, Mg, Zn, graphite |
| **Monoclinic** | a ≠ b ≠ c, α = β = 90°, γ ≠ 90° | Se, P |
| **Triclinic** | a ≠ b ≠ c, α ≠ β ≠ γ ≠ 90° | K₂Cr₂O₇ |

### The 14 Bravais Lattices

The cubic system has three Bravais lattices:
- **Simple Cubic (SC)**: atoms at corners only
- **Body-Centered Cubic (BCC)**: atoms at corners + one at body center
- **Face-Centered Cubic (FCC)**: atoms at corners + one at each face center

The tetragonal system has two Bravais lattices (simple and body-centered tetragonal).

The orthorhombic system has four Bravais lattices (simple, body-centered, base-centered, and face-centered orthorhombic).

The remaining three crystal systems (rhombohedral, hexagonal, monoclinic, triclinic) each have one Bravais lattice.

### Tiling Space

Only certain unit cell geometries can fill (tile) 3D space without gaps. For example, octagonal shapes cannot tile 3D space by themselves - we need the 14 Bravais lattice types to do this.

## Common Crystal Structures

### Face-Centered Cubic (FCC)

In the FCC structure:
- Atoms located at each corner (1/8 each) and center of each face (1/2 each)
- **4 atoms per unit cell**
- **Coordination number**: 12 (each atom has 12 nearest neighbors)
- **Atomic Packing Factor (APF)**: 0.74 (74%)

The relationship between lattice parameter a and atomic radius R for FCC is:

$$a = \frac{4R}{\sqrt{2}} = R \cdot 2\sqrt{2}$$

This comes from the face diagonal: 4R = a√2

### Body-Centered Cubic (BCC)

In the BCC structure:
- Atoms located at each corner and body center
- **2 atoms per unit cell**
- **Coordination number**: 8
- **APF**: 0.68 (68%)

The relationship between lattice parameter a and atomic radius R for BCC is:

$$a = \frac{4R}{\sqrt{3}}$$

### Diamond Cubic Structure

The diamond structure is found in C (diamond), Si, and Ge:
- Based on FCC lattice with **two-atom basis**
- Atoms at (0,0,0) and (a/4, a/4, a/4)
- **8 atoms per unit cell**
- **Coordination number**: 4 (tetrahedral bonding)
- **APF**: 0.34

### Zinc Blende Structure

The zinc blende (ZnS) structure:
- Same as diamond but neighboring atoms are different elements
- Many III-V compound semiconductors have this structure (GaAs, InP, etc.)
- Also has 8 atoms per unit cell and coordination number 4

## Crystal Properties: Atomic Packing Factor

The **Atomic Packing Factor (APF)** is the fraction of volume in a unit cell occupied by atoms:

$$APF = \frac{\text{Volume of atoms in unit cell}}{\text{Volume of unit cell}}$$

For FCC with 4 atoms of radius R:

$$APF = \frac{4 \times \frac{4}{3}\pi R^3}{a^3} = \frac{4 \times \frac{4}{3}\pi R^3}{(R \cdot 2\sqrt{2})^3} = \frac{42\pi}{3(2\sqrt{2})^3} = 0.74$$

### Atomic Concentration

The number of atoms per unit volume (atomic concentration):

$$n_{at} = \frac{\text{Number of atoms in unit cell}}{a^3}$$

For copper (FCC): nₐₜ = 4 / (0.3620 × 10⁻⁷ cm)³ = 8.43 × 10²² cm⁻³

### Density Calculation

The density of a crystal can be calculated from atomic mass and concentration:

$$\rho = \frac{n_{at} \cdot M_{at}}{N_A}$$

Where Mₐₜ is atomic mass and Nₐ is Avogadro's number (6.022 × 10²³ mol⁻¹).

## Polymorphism (Allotropy)

Many substances can exist in more than one crystal structure. This is called **polymorphism** or **allotropy**.

### Carbon Allotropes

Carbon has three important crystalline allotropes:

**Diamond**:
- Covalent bonding within a cubic crystal structure
- Very hard, excellent thermal conductor
- Electrical insulator
- Used in cutting tools, jewelry, heat conductors

**Graphite**:
- Covalently bonded layers in hexagonal structure
- Layers held together by van der Waals forces
- Good electrical conductor, lubricating agent
- Y ≈ 27 GPa, ρ = 2.25 g/cm³

**Buckminsterfullerene (C₆₀)**:
- Spherical molecule with 12 pentagons and 20 hexagons
- FCC crystal structure
- Semiconductor; K₃C₆₀ exhibits superconductivity
- Soft material

## Crystalline Defects

Real crystals are never perfect. Defects play a crucial role in determining material properties.

### Point Defects

**Vacancies** are missing atoms from lattice sites. They are thermodynamic defects that exist at equilibrium:

$$n_v = N \exp\left(\frac{-E_v}{kT}\right)$$

Where:
- nᵥ = vacancy concentration
- N = total number of atomic sites
- Eᵥ = energy required to create a vacancy
- k = Boltzmann constant
- T = temperature

Vacancies form when an atom on the surface gains enough energy to break bonds and move to a new position on the surface, leaving behind a vacancy that can diffuse into the bulk.

**Substitutional impurities** are foreign atoms that replace host atoms in the lattice. They can be larger or smaller than the host atom.

**Interstitial impurities** are foreign atoms that occupy empty spaces (interstices) between host atoms.

### Line Defects (Dislocations)

**Edge dislocation**: An extra half-plane of atoms inserted into the crystal lattice. The dislocation line is perpendicular to the direction of motion.

**Screw dislocation**: Atoms are displaced in a helical pattern along the dislocation line. The dislocation line is parallel to the direction of Burgers vector.

**Misfit and threading dislocations**: Arise from lattice mismatch at boundaries, such as in epitaxial layers grown on substrates.

### Planar Defects

**Grain boundaries**: Interfaces between crystalline grains with different orientations. They form during solidification when nuclei grow with different orientations.

**Surfaces**: The surface of a crystal has special features:
- **Terrace**: Flat surface region
- **Step**: Edge where surface orientation changes
- **Ledge**: Step edge
- **Kink**: Corner on a step
- **Adatom**: Atom adsorbed on the surface
- **Vacancy**: Empty site on the surface

### Czochralski Growth Method

Single-crystal silicon wafers are produced using the Czochralski (CZ) method:

1. Polycrystalline silicon is melted in a quartz crucible (held in graphite susceptor)
2. A small single-crystal seed crystal is lowered to touch the melt
3. The seed is slowly pulled upward while rotating
4. Atoms from the melt attach to the seed, forming a single-crystal ingot
5. The ingot is then sliced into wafers

The process occurs in argon gas atmosphere to prevent contamination.

## Crystal Directions and Planes

### Miller Indices for Directions

Crystal directions are labeled using **Miller indices** in square brackets **[uvw]**.

To find the indices:
1. Express coordinates of a point on the direction in terms of lattice parameters a, b, c
2. Obtain coordinates (x₁, y₁, z₁) in terms of a, b, c
3. Take reciprocals: (1/x₁, 1/y₁, 1/z₁)
4. Multiply or divide to get smallest integers u, v, w
5. Write as [uvw]

Negative indices are written with a bar over the number.

**Examples**:
- x-direction: [100]
- y-direction: [010]
- z-direction: [001]
- body diagonal: [111]

### Family of Directions

A **family of directions** (equivalent directions) is denoted by triangular brackets **⟨uvw⟩**.

For example, the ⟨100⟩ family includes [100], [010], [001], [100], [010], [001] (6 directions in cubic crystals).

### Miller Indices for Planes

Crystal planes are labeled using **Miller indices** in parentheses **(hkl)**.

To find Miller indices of a plane:
1. Find intercepts of the plane on x, y, z axes in terms of a, b, c (x₁, y₁, z₁)
2. Take reciprocals: (1/x₁, 1/y₁, 1/z₁)
3. Clear fractions (multiply to get smallest integers)
4. Write as (hkl)

**Important property**: In cubic crystals, the **[hkl] direction is perpendicular to the (hkl) plane**.

### Family of Planes

A **family of planes** is denoted by curly brackets **{hkl}**.

For example, {100} includes (100), (010), (001) and their equivalents.

### Planar Concentration

The **planar concentration** n(hkl) is the number of atoms per unit area on a given (hkl) plane.

For FCC crystals:
- (100) plane: n = 2/a² = 15.3 atoms/nm²
- (110) plane: n = 2/(a²√2) = 10.8 atoms/nm²
- (111) plane: n = 17.0 atoms/nm²

The (111) planes are most densely packed and (110) are least densely packed in FCC crystals.