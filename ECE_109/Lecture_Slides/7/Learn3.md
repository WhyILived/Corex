# Learn3: Hydrogen Atom and Atomic Structure
> Estimated time: ~30 minutes

## Section 1: Hydrogenic Atom - Stationary States

In a hydrogenic atom (hydrogen-like ion with nuclear charge +Ze), the electron has Coulombic potential energy:
$$V(r) = -\frac{Ze^2}{4\pi\varepsilon_o r}$$

The time-independent Schrödinger equation yields stationary states characterized by three quantum numbers.

The wavefunction separates into radial and angular parts:
$$\psi_{n,\ell,m_\ell}(r, \theta, \phi) = R_{n,\ell}(r) \cdot Y_{\ell,m_\ell}(\theta, \phi)$$

## Section 2: Quantum Numbers

**Principal quantum number** (n = 1, 2, 3, ...):
- Determines the energy level
- For hydrogen: $E_n = -\frac{13.6 \text{ eV}}{n^2}$

**Orbital angular momentum quantum number** ($\ell = 0, 1, 2, ..., n-1$):
- Determines the shape of the orbital
- ℓ = 0: s orbital (spherical)
- ℓ = 1: p orbital (dumbbell)
- ℓ = 2: d orbital ( cloverleaf)

**Magnetic quantum number** ($m_\ell = -\ell, -(\ell-1), ..., 0, ..., (\ell-1), \ell$):
- Determines orientation in space
- There are (2ℓ + 1) values of $m_\ell$ for each ℓ

## Section 3: Radial Probability Density

The probability of finding an electron at distance r within a thin spherical shell:
$$\delta P(r) = |R_{n,\ell}(r)|^2 r^2 \delta r$$

The radial probability density is $P_{n,\ell}(r) = r^2|R_{n,\ell}(r)|^2$

For the 1s state (n=1, ℓ=0), the maximum probability occurs at the Bohr radius:
$$r = a_o = 0.0529 \text{ nm}$$

## Section 4: Virial Theorem

For an electron in an atom, the virial theorem relates average kinetic and potential energies:
$$E = KE + PE \quad \text{and} \quad KE = -\frac{1}{2} PE$$

For hydrogen ground state (E = -13.6 eV):
- $PE = 2E = -27.2$ eV
- $KE = -PE/2 = 13.6$ eV

The Coulombic potential energy between electron and nucleus:
$$PE = \frac{Q_1 Q_2}{4\pi\varepsilon_o r_o} = \frac{(-e)(+e)}{4\pi\varepsilon_o r_o} = -\frac{e^2}{4\pi\varepsilon_o r_o}$$

At equilibrium (Bohr radius): $r_o = 5.29 \times 10^{-11}$ m = 0.0529 nm

## Section 5: Atomic Structure

**Atomic number Z**: number of protons in the nucleus

**Mass number A**: total number of protons and neutrons

**Ionization energy**: energy required to remove the outermost electron from a neutral atom

**Electron affinity**: energy released when adding an electron to a neutral atom

**Electronic configuration**: arrangement of electrons in shells and subshells
- Maximum electrons in shell n: $2n^2$
- Subshell capacity: $2(2\ell + 1)$

## Key Equations

Wavefunction:
$$\psi_{n,\ell,m_\ell}(r, \theta, \phi) = R_{n,\ell}(r) \cdot Y_{\ell,m_\ell}(\theta, \phi)$$

Hydrogen energy levels:
$$E_n = -\frac{13.6 \text{ eV}}{n^2}$$

Radial probability density:
$$P_{n,\ell}(r) = r^2|R_{n,\ell}(r)|^2$$

Virial theorem:
$$KE = -\frac{1}{2} PE$$

Coulombic PE:
$$PE = -\frac{e^2}{4\pi\varepsilon_o r}$$

Where:
- $n$ = principal quantum number (1, 2, 3, ...)
- $\ell$ = orbital quantum number (0 to n-1)
- $m_\ell$ = magnetic quantum number (-ℓ to +ℓ)
- $a_o$ = Bohr radius ($5.29 \times 10^{-11}$ m)
- $\varepsilon_o$ = vacuum permittivity ($8.85 \times 10^{-12}$ F/m)
