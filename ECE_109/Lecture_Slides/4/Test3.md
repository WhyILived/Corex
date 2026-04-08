# Test3: Electron in an Infinite Potential Well
> Tests: Learn3 material
> Time: ~15 minutes

## Conceptual Questions

1. Why is the wavefunction $\psi = 0$ for $x \leq 0$ and $x \geq a$ in an infinite potential well?

2. State two boundary conditions that the wavefunction must satisfy.

3. Why does $n = 0$ not give a valid solution?

4. How does the energy of level $n$ depend on $n$? On the well width $a$?

5. Explain why the ground state energy is not zero even though the potential is zero inside the well.

## Calculation Problems

1. An electron is confined to a 1D infinite potential well of width $a = 0.1$ nm (atomic scale).
   - Calculate the ground state energy $E_1$ in eV.
   - Calculate the energy of the second level $E_2$.
   - What wavelength photon would excite the electron from $E_1$ to $E_2$?

2. Two electrons are in infinite potential wells of widths $a_1 = 1$ nm and $a_2 = 2$ nm. Compare their ground state energies.

3. For the infinite well with $a = 2$ nm, calculate $\Delta E = E_2 - E_1$.

Constants: $m_e = 9.11 \times 10^{-31}$ kg, $h = 6.63 \times 10^{-34}$ J·s, $\hbar = 1.055 \times 10^{-34}$ J·s, $1 \text{ eV} = 1.602 \times 10^{-19}$ J

## Answers

1. For $x \leq 0$ or $x \geq a$, $V = \infty$. An electron cannot have finite energy in a region of infinite potential, so it cannot exist there. Therefore $\psi = 0$ in these regions.

2. The boundary conditions are:
   - $\psi(0) = 0$ and $\psi(a) = 0$ (wavefunction must vanish at infinite potential walls)
   - $\psi$ and $d\psi/dx$ must be continuous everywhere

3. If $n = 0$, then $k = 0$ and $\psi(x) = A\sin(0 \cdot x) = 0$ everywhere. This means no electron exists at all, so $n = 0$ is not a valid quantum state.

4. Energy depends on $n^2$: $E_n \propto n^2$, so $E_n = n^2 E_1$.
   Energy depends inversely on $a^2$: $E_n \propto 1/a^2$, so narrower wells have higher energies.

5. The ground state has non-zero energy because the electron is confined to a finite region. Confining a particle to a finite region requires a minimum kinetic energy due to the uncertainty principle ($\Delta x \Delta p \geq \hbar/2$). A narrower well requires larger $\Delta p$, hence larger minimum kinetic energy.

**Calculation Answers**:

1. 
   - $E_1 = \frac{h^2}{8m_e a^2} = \frac{(6.63 \times 10^{-34})^2}{8(9.11 \times 10^{-31})(0.1 \times 10^{-9})^2} = 6.03 \times 10^{-18}$ J $= 37.6$ eV
   - $E_2 = 4E_1 = 150.4$ eV
   - $\Delta E = E_2 - E_1 = 112.8$ eV. The photon wavelength: $\lambda = \frac{hc}{\Delta E} = \frac{(6.63 \times 10^{-34})(3 \times 10^8)}{112.8 \times 1.602 \times 10^{-19}} = 11.0$ nm

2. $E_1 \propto 1/a^2$, so $\frac{E_{1,a_1}}{E_{1,a_2}} = \left(\frac{a_2}{a_1}\right)^2 = \left(\frac{2}{1}\right)^2 = 4$
   The electron in the 1 nm well has 4 times the ground state energy of the one in the 2 nm well.

3. $E_1 = \frac{h^2}{8m_e a^2} = \frac{(6.63 \times 10^{-34})^2}{8(9.11 \times 10^{-31})(2 \times 10^{-9})^2} = 1.51 \times 10^{-19}$ J $= 0.094$ eV
   $E_2 = 4 \times 0.094 = 0.376$ eV
   $\Delta E = 0.376 - 0.094 = 0.282$ eV