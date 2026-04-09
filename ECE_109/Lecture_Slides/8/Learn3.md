# Learn3: Bonding Types in Solids
> Estimated time: ~30 minutes

## Section 1: Force and Energy Curves

When two atoms approach each other, they experience:
- **Attractive force ($F_A$)**: electrostatic attraction at long range
- **Repulsive force ($F_R$)**: electron cloud overlap at short range
- **Net force ($F_N = F_A + F_R$)**: minimum at equilibrium distance $r_0$

Similarly for potential energy:
- **Attractive potential ($E_A$)**: negative (stabilizing)
- **Repulsive potential ($E_R$)**: positive (destabilizing)
- **Net energy ($E = E_A + E_R$)**: minimum at $r_0$ is the bond energy $E_{bond}$

At $r = r_0$: the system is in equilibrium - molecules form when this energy is lower than the energy of separated atoms.

## Section 2: Covalent Bonding

### Mechanism
Electrons are shared between two atoms, forming molecular orbitals. Each shared pair constitutes one covalent bond.

### Example: H₂ Molecule
- Two hydrogen atoms share their 1s electrons
- Bond angle in H₂: (not directly relevant since it's diatomic)

### Example: Diamond Structure
- Each carbon atom forms 4 covalent bonds
- **Coordination number**: 4 (number of nearest neighbors)
- Tetrahedral arrangement (109.5° bond angles)
- Results in very hard, high melting point material

### Properties of Covalently Bonded Solids
- Generally hard
- High melting temperatures
- Poor electrical conductors (Si, diamond)
- Good thermal conductors (diamond exception)

## Section 3: Metallic Bonding

### Mechanism
Valence electrons become delocalized and form an "electron gas" that is shared by all atoms in the metal.

Positive metal ion cores are held together by the negatively charged electron gas.

### Examples
- Copper (Cu): metallic bonding with free electrons
- Magnesium (Mg)

### Properties
- Good electrical conductors
- Good thermal conductors
- High ductility (can be shaped)
- Generally high elastic modulus

## Section 4: Ionic Bonding

### Mechanism
Complete transfer of electrons from one atom to another, creating oppositely charged ions that attract each other via Coulombic forces.

### Example: NaCl
- Na loses electron → Na⁺ (cation)
- Cl gains electron → Cl⁻ (anion)
- Attraction is due to Coulombic forces between oppositely charged ions

### Potential Energy of Ionic Bonding

$$E(r) = -\frac{M e^2}{4\pi\varepsilon_0 r} + \frac{B}{r^m}$$

Where:
- $M$ = Madelung constant (depends on crystal structure; for NaCl, M = 1.748)
- $B$ = repulsive constant
- $m$ = exponent (typically 8-10)

### Finding Equilibrium Separation

At $r = r_0$ (equilibrium):
$$\frac{dE}{dr} = \frac{M e^2}{4\pi\varepsilon_0 r_0^2} - \frac{mB}{r_0^{m+1}} = 0$$

Solving for $r_0$:
$$r_0 = \left(\frac{4\pi\varepsilon_0 B m}{M e^2}\right)^{1/(m-1)}$$

### Cohesive Energy Calculation
The cohesive energy per ion pair includes:
1. Lattice energy (minimum of E(r) curve): $E_{min}$
2. Ionization energy of Na: 5.14 eV
3. Electron affinity of Cl: -3.61 eV (released)

$$E_{bond} = |E_{min}| + \text{ionization energy} + |\text{electron affinity}|$$

For NaCl: $E_{bond} = 7.84 \text{ eV} + 5.14 \text{ eV} - 3.61 \text{ eV} = 6.31 \text{ eV per pair}$

Converting to per mole:
$$E_{cohesive} = (6.31 \text{ eV}) \times (1.6022 \times 10^{-19} \text{ J/eV}) \times (6.022 \times 10^{23} \text{ mol}^{-1}) = 608 \text{ kJ/mol}$$

## Section 5: van der Waals Bonding

### Mechanism
Arises from electrostatic interactions between molecules that have permanent dipole moments or induced dipole moments.

### Dipole-Dipole Interaction
- Some molecules (like HCl) have permanent electric dipole moments
- Dipoles can attract or repel depending on relative orientation
- Suitably oriented dipoles attract each other

### van der Waals Forces
- Weakest type of bonding
- Example: crystalline argon, ice (H₂O)
- Results in low melting points
- Electrical insulators

## Section 6: Bond Type Comparison

| Bond Type | Example | Bond Energy (eV/atom) | Melting Temp (°C) | Electrical Conductivity |
|------------|---------|----------------------|-------------------|------------------------|
| Ionic | NaCl | 3.2 | 801 | Insulator (high T: conductor) |
| Covalent | Si | 4 | 1410 | Insulator |
| Covalent | C (diamond) | 7.4 | 3550 | Insulator |
| Metallic | Cu | 3.1 | 1083 | Conductor |
| Metallic | Mg | 1.1 | 650 | Conductor |
| van der Waals | H₂O (ice) | 0.52 | 0 | Insulator |
| van der Waals | Ar (crystal) | 0.09 | -189 | Insulator |