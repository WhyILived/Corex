# Test6: Energy Bands in Solids
> Tests: Learn6 material
> Time: ~15 minutes

## Conceptual Questions

1. Why does the 2s energy level in Li split into a band of N finely separated levels when N Li atoms form a solid?

2. In a metal, what does it mean for a band to be "half full"?

3. Why is the energy separation between adjacent levels in a metal's energy band essentially zero from a practical standpoint?

4. What prevents electrical conduction in a material where all energy bands are either completely full or completely empty?

5. What is the Fermi level at absolute zero? What is the Fermi energy?

## Calculation Problems

1. **Band filling**: Consider a metal with N atoms, where each atom contributes 1 valence electron.
   - If the 2s band can hold 2N electrons (2 per level × N levels), how many levels are filled at T = 0 K?
   - What fraction of the band is filled?

2. **Li metal**: For lithium metal:
   - Fermi energy EFO = 4.7 eV
   - Work function Φ = 2.9 eV
   - Draw the energy band diagram showing EB, EFO, and the vacuum level
   - What is the energy difference between EB and the vacuum level?

3. **Band overlap in Li**: Lithium has electronic structure 1s²2s¹.
   - When N Li atoms form a solid, what happens to the 2s energy level?
   - Why does Li metal have electrical conductivity despite the 2s band being only half full?

## Answers

1. **N levels from N orbitals**: When N atoms come together, each of the N atomic orbitals can combine in different ways (in phase, out of phase, various phases in between). There are N distinct ways to combine them, giving N distinct energy levels. The energy splitting occurs because adjacent atoms' orbitals interact/overlap. The more atoms that interact, the more finely split the levels become.

2. **Half full band**: A band being "half full" means exactly half of the available states in that band are occupied by electrons at 0 K. For the 2s band with 2N states (N levels × 2 spin states), if there are N electrons (1 per Li atom), they fill the N lowest energy levels — exactly half the states.

3. **Essentially zero separation**: For N ~ 10²³ atoms, the energy band width is only ~10 eV but divided among 10²³ levels. The spacing is ~10⁻²³ eV between adjacent levels, far smaller than any thermal energy or measurement resolution. The band is effectively continuous.

4. **Conduction requirement**: For electrical conduction to occur, a band must be partially filled or overlap with another band. When bands are completely full or separated by a gap, electrons cannot gain energy to move because there are no empty states nearby for them to transition to.

5. **Fermi level**: The Fermi level EFO at 0 K is the highest energy level occupied by electrons. All levels below EFO are completely filled; all levels above are empty. Fermi energy is the energy of electrons at EFO measured from the bottom of the band.

6. **Band filling calculation**:
   - N electrons fill N/2 lowest levels (2 electrons per level due to spin)
   - Fraction filled = (N/2) / N = 1/2 = 50% = half full

7. **Li energy diagram**:
   - EB is at the bottom of the 2s band
   - EFO = 4.7 eV above EB
   - Vacuum level is at EFO + Φ = 4.7 + 2.9 = 7.6 eV above EB

8. **Li band formation**: In solid Li:
   - The 2s energy level splits into N finely separated levels when N atoms come together
   - With N electrons filling N/2 lowest levels (2 electrons per level), the band is half full
   - Empty levels above allow electrons to gain energy and move when an electric field is applied
   - This is why Li is a conductor despite only having one electron per atom

9. **Conductivity mechanism**: In partially filled bands:
   - Electrons can easily move to nearby empty states within the same band
   - Even a small electric field can give electrons at the Fermi level enough energy to move into empty states
   - Electrons near the Fermi level contribute most to conduction because they can easily change their momentum state
