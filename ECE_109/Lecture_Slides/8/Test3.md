# Test3: Bonding Types in Solids
> Tests: Learn3 material
> Time: ~15 minutes

## Conceptual Questions

1. Why do atoms form bonds? What happens to the energy when two atoms form a bond compared to when they are separated?

2. In your own words, explain the difference between covalent and metallic bonding.

3. Why does ionic bonding typically result in electrical insulators at room temperature?

## Calculation Problems

1. **Ionic Bonding Lattice Energy**: For NaCl, the potential energy between ions is:
   
   $$E(r) = -\frac{M e^2}{4\pi\varepsilon_0 r} + \frac{B}{r^m}$$
   
   Given: $M = 1.748$, $m = 8$, $B = 6.972 \times 10^{-96}$ J·m⁸, $r_0 = 0.28$ nm, electron charge $e = 1.602 \times 10^{-19}$ C, $\varepsilon_0 = 8.854 \times 10^{-12}$ F/m
   
   Calculate the lattice energy $E_{min}$ (the attractive term only, at $r_0$) in eV.

2. **Cohesive Energy**: Using the data from problem 1 and knowing:
   - Ionization energy of Na = 5.14 eV
   - Electron affinity of Cl = 3.61 eV (released when electron added)
   
   Calculate the total cohesive energy per mole of NaCl in kJ/mol.

3. **Bond Type Identification**: Based on the table in Learn3:
   - Which bond type typically has the highest bond energy?
   - Which has the lowest?
   - Which bond types are typically electrical conductors?

## Answers

1. **Lattice Energy Calculation**:
   
   First, convert $r_0$ to meters: $r_0 = 0.28 \text{ nm} = 2.8 \times 10^{-10}$ m
   
   $$E_{attractive} = -\frac{M e^2}{4\pi\varepsilon_0 r_0} = -\frac{(1.748)(1.602 \times 10^{-19})^2}{4\pi(8.854 \times 10^{-12})(2.8 \times 10^{-10})}$$
   
   $$= -\frac{(1.748)(2.566 \times 10^{-38})}{4\pi(8.854 \times 10^{-12})(2.8 \times 10^{-10})}$$
   
   $$= -\frac{4.485 \times 10^{-38}}{3.12 \times 10^{-20}} = -1.44 \times 10^{-18} \text{ J}$$
   
   Converting to eV: $E = \frac{-1.44 \times 10^{-18}}{1.602 \times 10^{-19}} = -9.0 \text{ eV}$
   
   The full calculation including the repulsive term gives $E_{min} = -7.84$ eV at $r_0$.

2. **Cohesive Energy**:
   
   $$E_{bond} = |E_{min}| + \text{ionization energy} + |\text{electron affinity}|$$
   
   $$= 7.84 \text{ eV} + 5.14 \text{ eV} - 3.61 \text{ eV} = 6.31 \text{ eV per ion pair}$$
   
   Converting to per mole:
   $$E_{cohesive} = (6.31)(1.602 \times 10^{-19})(6.022 \times 10^{23}) = 6.09 \times 10^5 \text{ J/mol} = 609 \text{ kJ/mol}$$

3. **Bond Type Questions**:
   - Highest bond energy: Covalent (diamond) at 7.4 eV/atom
   - Lowest bond energy: van der Waals (argon) at 0.09 eV/atom
   - Electrical conductors: Metallic bonding only (Cu, Mg)