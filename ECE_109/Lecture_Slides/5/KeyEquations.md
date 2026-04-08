# KeyEquations: Lecture 5

## Quantum Mechanics Formalism

**Expectation value:**
$$\langle \hat{A} \rangle = \langle \psi | \hat{A} | \psi \rangle = \int \psi^*(\vec{r}, t) \hat{A} \psi(\vec{r}, t) dV$$

**Time evolution operator:**
$$\hat{U}(t) = e^{-i\hat{H}t/\hbar}$$

**Stationary state eigenvalue equation:**
$$\hat{H} |\psi_n\rangle = E_n |\psi_n\rangle$$

**Stationary state time evolution:**
$$|\psi_n(t)\rangle = e^{-iE_n t/\hbar} |\psi_n(t=0)\rangle$$

## Time-Independent Schrödinger Equation

**General form (one dimension):**
$$\frac{d^2\psi}{dx^2} + \frac{2m_e}{\hbar^2}(E - V)\psi = 0$$

**Three dimensions:**
$$\nabla^2\psi + \frac{2m_e}{\hbar^2}(E - V)\psi = 0$$

## Free Electron

**Wavefunction:**
$$\psi(x) = Ae^{jkx} + Be^{-jkx}$$

**Relation to de Broglie:**
$$p = \hbar k = \frac{h}{\lambda}$$

## Infinite Potential Well

**Allowed wavenumbers:**
$$k_n = \frac{n\pi}{a}$$

**Energy eigenvalues:**
$$E_n = \frac{\hbar^2 k_n^2}{2m_e} = \frac{h^2 n^2}{8m_e a^2} = \frac{\hbar^2 \pi^2 n^2}{2m_e a^2}$$

**Normalized wavefunctions:**
$$\psi_n(x) = \sqrt{\frac{2}{a}} \sin\left(\frac{n\pi x}{a}\right)$$

**Energy separation:**
$$\Delta E_n = E_{n+1} - E_n = \frac{h^2(2n+1)}{8m_e a^2}$$

## Three-Dimensional Potential Box

**Wavefunction (product form):**
$$\psi_{n_x n_y n_z}(x, y, z) = \sqrt{\frac{8}{abc}} \sin\left(\frac{n_x \pi x}{a}\right) \sin\left(\frac{n_y \pi y}{b}\right) \sin\left(\frac{n_z \pi z}{c}\right)$$

**Energy eigenvalues:**
$$E_{n_x n_y n_z} = \frac{\hbar^2 \pi^2}{2m_e}\left[\left(\frac{n_x}{a}\right)^2 + \left(\frac{n_y}{b}\right)^2 + \left(\frac{n_z}{c}\right)^2\right]$$

## Finite Potential Well

**Wavevector inside well:**
$$k = \frac{\sqrt{2m_e E}}{\hbar}$$

**Decay constant in barrier:**
$$\alpha = \frac{\sqrt{2m_e(V_0 - E)}}{\hbar}$$

**Penetration depth:**
$$\delta = \frac{1}{\alpha} = \frac{\hbar}{\sqrt{2m_e(V_0 - E)}}$$

**Even parity condition:**
$$\alpha = k \tan\left(\frac{ka}{2}\right)$$

**Odd parity condition:**
$$\alpha = -k \cot\left(\frac{ka}{2}\right)$$

## Variable Definitions

| Symbol | Definition | Units |
|--------|------------|-------|
| $\hbar$ | Reduced Planck constant $= h/2\pi$ | J·s |
| $h$ | Planck constant | J·s |
| $m_e$ | Electron mass $= 9.11 \times 10^{-31}$ | kg |
| $a$ | Potential well width | m |
| $V_0$ | Potential barrier height | J or eV |
| $E$ | Electron energy | J or eV |
| $k$ | Wavevector inside well | rad/m |
| $\alpha$ | Decay constant in barrier | 1/m |
| $n$ | Quantum number $= 1, 2, 3, ...$ | dimensionless |
| $\psi$ | Wavefunction (spatial part) | 1/√m |
| $\Psi$ | Total wavefunction $= \psi e^{-iEt/\hbar}$ | 1/√m |