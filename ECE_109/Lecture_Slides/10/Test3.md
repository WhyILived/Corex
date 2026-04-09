# Test3: Crystalline Defects
> Tests: Learn3 material
> Time: ~15 minutes

## Conceptual Questions

1. Why do vacancies exist even at room temperature? What type of defect are they?

2. Compare substitutional and interstitial impurities in terms of:
   - Where they are located in the crystal
   - The type of lattice distortion they cause

3. What is meant by "dangling bonds" at a crystal surface? Why do they exist?

4. Explain why grain boundaries are high-energy regions.



## Calculation Problems

1. **Vacancy concentration in Ge**: The energy of vacancy formation in Ge is 2.2 eV. Calculate the fractional vacancy concentration at 938°C (1211 K).

2. **Vacancy concentration comparison**: If the vacancy formation energy for Al is 0.70 eV and for Ge is 2.2 eV:
   - At 300 K, which material has more vacancies and by approximately how much factor?

3. **Atomic concentration**: Calculate the atomic concentration N for Ge given:
   - Density ρ = 5.32 g/cm³
   - Atomic mass M = 72.64 g/mol
   - Avogadro's number Nₐ = 6.022 × 10²³ atoms/mol
   - Then calculate the vacancy concentration nv at 938°C.

## Answers

1. **Vacancies are thermodynamic defects** — they exist because the system reaches thermal equilibrium. The number of vacancies follows the Boltzmann distribution: $n_v/N = exp(-E_v/kT)$. At any finite temperature, some atoms have enough thermal energy to leave their lattice sites and create vacancies.

2. **Substitutional vs Interstitial**:
   - **Substitutional**: Atom replaces a host atom on a lattice site. Larger impurities cause lattice expansion; smaller impurities cause contraction.
   - **Interstitial**: Small atom occupies the void space between host atoms. Causes local lattice strain/distortion in all directions.

3. **Dangling bonds** are unsatisfied valence bonds at the crystal surface. Surface atoms cannot bond with as many neighbors as bulk atoms because the crystal ends at the surface. These incomplete bonds have only one electron (half-filled) instead of the usual two electrons in a covalent bond, making them chemically active.

4. **Grain boundaries are high-energy regions** because atoms cannot satisfy their normal bonding geometry when crystal orientation changes. There are voids, missing bonds, and strained bonds in the boundary region. Atoms here have higher potential energy than atoms within well-ordered grains.

6. **Ge vacancy calculation**:
   $n_v/N = exp(-2.2/(8.617 \times 10^{-5} \times 1211)) = exp(-2.2/0.104) = exp(-21.2) = 7.0 \times 10^{-10}$

7. **Al vs Ge vacancy comparison** at 300 K:
   - Al: $exp(-0.70/0.0259) = exp(-27.1) = 1.7 \times 10^{-12}$
   - Ge: $exp(-2.2/0.0259) = exp(-84.9) = 3.0 \times 10^{-37}$
   - Al has about **10²⁵ times more vacancies**. In covalent crystals (Ge), breaking bonds costs more energy because bonds are directional and strong; in metals (Al), metallic bonds are nondirectional and easier to break.

8. **Atomic concentration for Ge**:
   $N = \rho N_A/M = (5.32 \times 6.022 \times 10^{23})/72.64 = 4.41 \times 10^{22}$ atoms/cm³
   $n_v = N \times 7.0 \times 10^{-10} = 3.1 \times 10^{13}$ cm⁻³
