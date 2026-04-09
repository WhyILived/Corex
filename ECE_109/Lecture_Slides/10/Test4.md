# Test4: Single-Crystal Silicon and Czochralski Growth
> Tests: Learn4 material
> Time: ~15 minutes

## Conceptual Questions

1. Why is the Czochralski method used for growing semiconductor crystals rather than other methods?

2. What is the purpose of the "seed crystal" in Czochralski growth? Why must it be dislocation-free?

3. Why does amorphous silicon (a-Si) have dangling bonds while crystalline silicon does not?

4. What is the role of hydrogen in hydrogenated amorphous silicon (a-Si:H)?

5. Why must the substrate temperature be controlled at ~250°C during a-Si:H deposition by CVD?

## Calculation Problems

1. **Wafer count**: A Czochralski Si ingot is 2 meters long and 300 mm in diameter.
   - If wafers are cut 0.5 mm thick, how many wafers can be obtained from one ingot?
   - What fraction of the ingot is wasted in cutting (slicing)?

2. **PECVD process**: In plasma-enhanced CVD of a-Si:H, silane (SiH₄) decomposes. If the silane gas contains:
   - 1 silicon atom per molecule
   - 4 hydrogen atoms per molecule
   - The deposited a-Si:H film contains 10 at.% H
   - Calculate the Si:H atomic ratio in the film.

3. **Comparison**: Calculate the density of amorphous Si if it is 5% less dense than crystalline Si (ρ_c-Si = 2.33 g/cm³).

## Answers

1. **Czochralski advantages for semiconductors**:
   - Produces large, single-crystal ingots
   - Crystal orientation can be precisely controlled using a seed
   - Relatively simple process for Si (compatible with quartz crucible)
   - Used for most IC-grade Si wafers

2. **Seed crystal requirements**: The seed provides a template for the growing crystal. It must be dislocation-free so that dislocations are not propagated into the growing crystal. Starting with a perfect seed allows production of large defect-free single crystals.

3. **Dangling bonds in a-Si**: In crystalline Si, every Si atom forms exactly 4 bonds in a tetrahedral arrangement with a well-defined bond length and angle. In amorphous Si, the bonds around each atom deviate from the ideal geometry due to rapid freezing. Some bonds are strained, some are missing — these missing bonds are "dangling bonds" with only one electron instead of the usual two.

4. **Hydrogen passivation**: H atoms terminate (passivate) the dangling bonds in a-Si. Since H has only one electron, it can form one covalent bond with a dangling Si bond, satisfying the Si atom's bonding requirement and reducing the density of defects.

5. **Temperature control at ~250°C**: If the substrate is too hot, Si atoms have enough kinetic energy to rearrange into the crystalline structure during deposition. If too cold, the film may have too many defects. The 250°C temperature is optimized to allow sufficient mobility for good film quality while preventing crystallization.

6. **Wafer calculation**:
   - Number of wafers = 2m / 0.5mm = 2000mm / 0.5mm = 4000 wafers
   - Saw blade thickness causes kerf loss (not calculated here)

7. **Si:H ratio in a-Si:H**:
   - Film is 10 at.% H, 90 at.% Si
   - Si:H ratio = 90:10 = 9:1

8. **Density of a-Si**:
   - ρ_a-Si = 2.33 × 0.95 = 2.21 g/cm³
