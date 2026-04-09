# Test1: Crystal Structure and Bravais Lattices
> Tests: Learn1 material
> Time: ~15 minutes

## Conceptual Questions

1. Define: lattice, basis, and unit cell. Explain how these three concepts relate to each other in describing crystal structure.

2. What is the key characteristic that distinguishes crystalline solids from amorphous solids?

3. List the 7 crystal systems and their defining geometric conditions.

4. Why does the diamond cubic structure require 8 atoms per unit cell while the FCC structure only requires 4?

## Calculation Problems

1. **FCC Copper**: Copper has an FCC structure with lattice parameter a = 0.362 nm and atomic radius R = 0.128 nm.
   - Verify that $a = 2R\sqrt{2}$ holds for this FCC crystal.
   - Calculate the atomic packing factor for copper.

2. **Vacancy Concentration**: The energy of vacancy formation in aluminum is 0.70 eV. Calculate the fractional vacancy concentration at:
   - Room temperature (300 K)
   - Just below the melting temperature (660°C = 933 K)
   - Given k = 8.617 × 10⁻⁵ eV/K

3. **Atom Count**: How many atoms are there per unit cell in:
   - Simple cubic
   - BCC
   - FCC

## Answers

1. **Lattice**: An infinite periodic array of geometric points in space without atoms. **Basis**: The identical group of atoms placed at each lattice point. **Unit cell**: The small repeating volume that generates the crystal when copied in 3D. Crystal = Lattice + Basis at each lattice point.

2. Crystalline solids have **long-range order** — the periodic arrangement of atoms repeats throughout the entire crystal. Amorphous solids only have **short-range order** — local bonding geometry may be satisfied but periodicity is lost at larger distances.

3. **Cubic** (a=b=c, α=β=γ=90°), **Tetragonal** (a=b≠c, α=β=γ=90°), **Orthorhombic** (a≠b≠c, α=β=γ=90°), **Rhombohedral** (a=b=c, α=β=γ≠90°), **Hexagonal** (a=b≠c, α=β=90°, γ=120°), **Monoclinic** (a≠b≠c, α=β=90°, γ≠90°), **Triclinic** (a≠b≠c, α≠β≠γ≠90°)

4. Diamond has an FCC lattice with a **basis of 2 atoms** at each lattice point (one at the lattice point, one displaced by a/4 along cube edges), giving 4×2 = 8 atoms per unit cell. FCC with a single-atom basis only gives 4 atoms per unit cell.

5. **FCC verification**:
   - $2R\sqrt{2} = 2(0.128)\sqrt{2} = 0.362$ nm = a ✓
   - $APF = \frac{4 \times \frac{4}{3}\pi R^3}{a^3} = \frac{4 \times \frac{4}{3}\pi (0.128)^3}{(0.362)^3} = 0.74$ ✓

6. **Vacancy concentration**: $n_v/N = exp(-E_v/kT)$
   - At 300 K: $exp(-0.70/(8.617 \times 10^{-5} \times 300)) = exp(-27,060) \approx 1.7 \times 10^{-12}$
   - At 933 K: $exp(-0.70/(8.617 \times 10^{-5} \times 933)) = exp(-8,695) \approx 1.7 \times 10^{-4}$

7. **Atoms per unit cell**: Simple cubic = 1, BCC = 2, FCC = 4
