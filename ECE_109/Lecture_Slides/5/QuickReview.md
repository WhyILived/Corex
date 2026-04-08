# QuickReview: Quantum Mechanics and Potential Wells

## Wavefunction Interpretation
- $\Psi(\vec{r}, t)$ is a complex wavefunction; $|\Psi|^2$ is probability density
- Observables calculated via expectation values: $\langle A \rangle = \int \Psi^*\hat{A}\Psi dV$

## Schrödinger Equation
- **Time-dependent**: $i\hbar \frac{d}{dt}|\psi\rangle = \hat{H}|\psi\rangle$
- **Stationary states**: $\hat{H}|\psi_n\rangle = E_n|\psi_n\rangle$ (eigenvalue equation)

## Infinite Potential Well (0 < x < a)
- Energy: $E_n = \frac{h^2 n^2}{8m_e a^2}$ (quantized, $n = 1, 2, 3, ...$)
- Wavefunction: $\psi_n(x) = \sqrt{\frac{2}{a}}\sin(\frac{n\pi x}{a})$
- $\psi = 0$ outside well; boundary condition $\psi(0) = \psi(a) = 0$

## Finite Potential Well (0 < x < a, barrier height $V_0$)
- Inside: oscillatory wavefunction, $k = \sqrt{2m_e E}/\hbar$
- Outside: exponential decay, $\alpha = \sqrt{2m_e(V_0 - E)}/\hbar$
- Penetration depth: $\delta = 1/\alpha$
- Energy solved graphically from transcendental equations:
  - Even: $\alpha = k\tan(ka/2)$
  - Odd: $\alpha = -k\cot(ka/2)$
- Energies **lower** than infinite well due to wavefunction penetration

## Three-Dimensional Potential Box (a × b × c)
- Wavefunction separates: $\psi_{n_x n_y n_z} = \psi_{n_x}(x)\psi_{n_y}(y)\psi_{n_z}(z)$
- Energy: $E_{n_x n_y n_z} = \frac{\hbar^2\pi^2}{2m_e}[(n_x/a)^2 + (n_y/b)^2 + (n_z/c)^2]$
- Three quantum numbers ($n_x, n_y, n_z = 1, 2, 3, ...$)

## Key Insight
Confined electrons have **quantized energy levels**. The discrete energies arise from boundary conditions requiring standing waves in the confinement region.