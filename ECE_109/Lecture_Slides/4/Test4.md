# Test4: Electron in a Finite Potential Well
> Tests: Learn4 material
> Time: ~15 minutes

## Conceptual Questions

1. What is the key difference between the wavefunction in a finite vs. infinite potential well?

2. Explain what is meant by "penetration depth" in the context of a finite potential well.

3. Why does the finite well have fewer energy levels than the infinite well of the same dimensions?

4. What role does the center of symmetry play in determining the wavefunction solutions?

5. State the boundary conditions that must be satisfied at the interface between regions in a finite potential well.

## Calculation Problems

1. A finite potential well has $a = 2$ nm and $V_0 = 0.5$ eV. The first energy level is $E_1 = 0.057$ eV.
   - Calculate $\alpha_1$ for this level
   - Calculate the penetration depth $\delta_1$
   - Compare to the infinite well ground state ($E_1^\infty = 0.094$ eV)

2. For a finite well, the boundary condition gives $\alpha = k\tan(ka/2)$ for even parity states. Why does this lead to quantized energies?

3. Consider two finite wells with the same $V_0 = 0.5$ eV but different widths: $a_1 = 1$ nm and $a_2 = 3$ nm. Which would have more bound states? Explain your reasoning.

Constants: $m_e = 9.11 \times 10^{-31}$ kg, $\hbar = 1.055 \times 10^{-34}$ J·s, $1 \text{ eV} = 1.602 \times 10^{-19}$ J

## Answers

1. In an infinite well, $\psi = 0$ at and beyond the walls. In a finite well, the wavefunction penetrates into the barrier region and decays exponentially rather than being zero.

2. Penetration depth $\delta = 1/\alpha$ is the characteristic distance over which the wavefunction decays to $1/e$ of its value at the barrier interface. It characterizes how deeply the electron can penetrate into a region where its energy is below the potential barrier.

3. In a finite well, the wavefunction can extend beyond the well boundaries into classically forbidden regions. This increases the uncertainty in position $\Delta x$, which by the Heisenberg uncertainty principle decreases the uncertainty in momentum $\Delta p$, resulting in lower kinetic energy. Therefore, for the same well width, finite well energies are lower than infinite well energies, and fewer bound states exist.

4. The center of symmetry at $x = a/2$ means wavefunctions must have definite parity: either even (symmetric, $\psi(x) = \psi(a-x)$) or odd (antisymmetric, $\psi(x) = -\psi(a-x)$). This splits solutions into two classes: even parity solutions involve $\cos[k(x-a/2)]$ and odd parity solutions involve $\sin[k(x-a/2)]$.

5. The boundary conditions at $x = 0$ and $x = a$:
   - $\psi$ must be continuous across the interface
   - $d\psi/dx$ must be continuous across the interface
   
   These ensure physically valid wavefunctions with no discontinuities in probability density or probability current.

**Calculation Answers**:

1. 
   - $\alpha_1 = \sqrt{2m_e(V_0 - E_1)}/\hbar = \sqrt{2(9.11 \times 10^{-31})(0.5 - 0.057)(1.602 \times 10^{-19})}/(1.055 \times 10^{-34}) = 1.16 \times 10^9$ m$^{-1}$
   - $\delta_1 = 1/\alpha_1 = 0.29$ nm
   - The finite well energy (0.057 eV) is lower than the infinite well (0.094 eV) because the electron's wavefunction extends into the barrier, increasing $\Delta x$ and decreasing kinetic energy.

2. Both $k = \sqrt{2m_e E}/\hbar$ and $\alpha = \sqrt{2m_e(V_0 - E)}/\hbar$ depend on energy $E$. The equation $\alpha = k\tan(ka/2)$ relates these two quantities. Only specific energies allow both $k$ and $\alpha$ to satisfy this equation simultaneously while maintaining continuity of $\psi$ and $d\psi/dx$. Graphically, this corresponds to intersection points when plotting both sides vs. $E$.

3. The wider well ($a_2 = 3$ nm) would have more bound states. The condition for bound states depends on $ka$ and $\alpha a$. Larger $a$ means more wavelengths fit in the well, allowing more quantized energy levels before reaching $E = V_0$. Additionally, the energy spacing $\Delta E \propto 1/a^2$ decreases with larger $a$, so more levels fit below $V_0$.