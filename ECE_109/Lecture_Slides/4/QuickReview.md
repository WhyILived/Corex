# QuickReview.md - Lecture 4 Summary

## Topics Covered
1. **Blackbody Radiation** - Planck's quantum hypothesis
2. **Quantum Mechanics Formalism** - Wavefunction, operators, expectation values
3. **Schrödinger Equation** - Time-dependent and time-independent forms
4. **Electron in Potential Wells** - Infinite and finite

---

## Key Concepts

### Blackbody Radiation
- Classical physics failed (Rayleigh-Jeans: $I_\lambda \propto 1/\lambda^4$ gives ultraviolet catastrophe)
- Planck's quantum hypothesis: energy emitted/absorbed in discrete quanta $E = hf$
- Wien's law: $\lambda_{max}T \approx 2.89 \times 10^{-3}$ m·K
- Stefan's law: total power $P = \sigma_S T^4$

### Quantum Mechanics
- Wavefunction $\Psi$ is complex; $|\Psi|^2$ is probability density
- Schrödinger equation governs particle dynamics: $i\hbar\frac{d|\psi\rangle}{dt} = \hat{H}|\psi\rangle$
- Observables are operators acting on wavefunctions
- Expectation value: $\langle A \rangle = \int \psi^* \hat{A} \psi dV$
- Stationary states: $\hat{H}|\psi_n\rangle = E_n|\psi_n\rangle$ (eigenvalue problem)
- Time-independent SE: $[-\frac{\hbar^2}{2m}\nabla^2 + V]\psi = E\psi$

### Infinite Potential Well
- Energy quantized: $E_n = \frac{h^2 n^2}{8m_e a^2}$ ($n = 1, 2, 3, ...$)
- Wavefunction: $\psi_n(x) = \sqrt{\frac{2}{a}}\sin(\frac{n\pi x}{a})$
- Boundaries: $\psi = 0$ at $x = 0$ and $x = a$
- $E_1$ is non-zero (zero-point energy due to confinement)

### Finite Potential Well
- Wavefunction penetrates barriers exponentially: $\psi \propto e^{-\alpha x}$
- Penetration depth: $\delta = 1/\alpha$
- Energy levels lower than infinite well (wavefunction extends into barriers)
- Solutions found graphically from boundary conditions
- Even/odd parity based on symmetry about $x = a/2$

---

## Quick Reference

| Topic | Key Equation |
|-------|--------------|
| Planck's law | $I_\lambda = \frac{2\pi hc^2}{\lambda^5}[\exp(\frac{hc}{\lambda kT})-1]^{-1}$ |
| Wien's law | $\lambda_{max}T = 2.89 \times 10^{-3}$ m·K |
| Time-dependent SE | $i\hbar\frac{d|\psi\rangle}{dt} = \hat{H}|\psi\rangle$ |
| Time-independent SE | $[-\frac{\hbar^2}{2m}\nabla^2 + V]\psi = E\psi$ |
| Infinite well energy | $E_n = \frac{h^2 n^2}{8m_e a^2}$ |
| Finite well (in well) | $k^2 = 2m_eE/\hbar^2$ |
| Finite well (barrier) | $\alpha^2 = 2m_e(V_0-E)/\hbar^2$ |