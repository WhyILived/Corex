# Test5: Knowledge Check
> Tests: Learn5 material (Three-Dimensional Quantum Box)
> Time: ~15 minutes

## Conceptual Questions

1. Why does a particle in a 3D box have three quantum numbers instead of one?

2. Explain the concept of degeneracy. In a cubic box ($a = b = c$), what is the degeneracy of the state with $n_1^2 + n_2^2 + n_3^2 = 6$?

3. How does the energy of a 3D box scale with the quantum numbers differently than in the 1D case?

## Calculation Problems

1. An electron is confined in a cubic box with side length $a = 1$ nm. Calculate the ground state energy and the energy of the first excited state.

Given: $h = 6.63 \times 10^{-34}$ J·s, $m_e = 9.11 \times 10^{-31}$ kg

2. For the same cubic box, list all the quantum number combinations $(n_1, n_2, n_3)$ that give the second excited state energy (third lowest energy level), and calculate the degeneracy.

## Answers

1. Ground state ($n_1 = n_2 = n_3 = 1$):
   $E_{111} = \frac{h^2}{8m_e a^2}(1^2 + 1^2 + 1^2) = \frac{3h^2}{8m_e a^2}$

   $E_{111} = \frac{3(6.63 \times 10^{-34})^2}{8(9.11 \times 10^{-31})(10^{-9})^2} = 1.81 \times 10^{-19}$ J $= 1.13$ eV

   First excited state: There are three degenerate states with one quantum number = 2 and the others = 1:
   $(2,1,1)$, $(1,2,1)$, $(1,1,2)$
   
   $E_{211} = \frac{h^2}{8m_e a^2}(2^2 + 1^2 + 1^2) = \frac{6h^2}{8m_e a^2} = 2 \times 1.81 \times 10^{-19}$ J $= 2.26$ eV

2. Second excited state: $n_1^2 + n_2^2 + n_3^2 = 9$
   
   Possible combinations:
   - $(3,1,1)$, $(1,3,1)$, $(1,1,3)$ → sum = 11 ≠ 9, not this one
   - $(2,2,1)$, $(2,1,2)$, $(1,2,2)$ → sum = 9 ✓
   
   Degeneracy = 3 (three permutations)
   
   Actually let me recalculate:
   $2^2 + 2^2 + 1^2 = 4 + 4 + 1 = 9$ ✓
   
   So the second excited state has degeneracy 3.
