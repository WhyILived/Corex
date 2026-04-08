# KeyEquations.md - Lecture 4 Equations

## Blackbody Radiation

**Planck's Radiation Law:**
$$I_\lambda = \frac{2\pi hc^2}{\lambda^5}\left[\exp\left(\frac{hc}{\lambda kT}\right) - 1\right]^{-1}$$
- $I_\lambda$ = spectral irradiance (W·m⁻²·m⁻¹)
- $h = 6.63 \times 10^{-34}$ J·s (Planck's constant)
- $c = 3 \times 10^8$ m/s (speed of light)
- $k = 1.38 \times 10^{-23}$ J·K⁻¹ (Boltzmann constant)
- $T$ = temperature (K)
- $\lambda$ = wavelength (m)

**Wien's Displacement Law:**
$$\lambda_{max}T \approx 2.89 \times 10^{-3} \text{ m·K}$$

**Stefan's Law:**
$$P_S = \sigma_S T^4 = \frac{2\pi^5k^4}{15c^2h^3}T^4$$
- $\sigma_S = 5.670 \times 10^{-8}$ W·m⁻²·K⁻⁴ (Stefan constant)

---

## Quantum Mechanics Formalism

**Time-Dependent Schrödinger Equation:**
$$i\hbar\frac{d}{dt}|\psi\rangle = \hat{H}|\psi\rangle$$

**Expectation Value:**
$$\langle \hat{A} \rangle = \langle \psi|\hat{A}|\psi\rangle = \int \psi^* \hat{A} \psi dV$$

**Stationary States (Eigenvalue Equation):**
$$\hat{H}|\psi_n\rangle = E_n|\psi_n\rangle$$

**Time-Independent Schrödinger Equation:**
$$\left[-\frac{\hbar^2}{2m}\nabla^2 + V(\vec{r})\right]|\psi_n\rangle = E_n|\psi_n\rangle$$

**In 1D:**
$$\frac{d^2\psi}{dx^2} + \frac{2m}{\hbar^2}(E - V)\psi = 0$$

**Free Electron (V = 0):**
$$k^2 = \frac{2mE}{\hbar^2}$$
$$\psi_1(x) = Ae^{ikx}, \quad \psi_2(x) = Ae^{-ikx}$$

---

## Infinite Potential Well

**Energy Quantization:**
$$E_n = \frac{\hbar^2 n^2 \pi^2}{2m_e a^2} = \frac{h^2 n^2}{8m_e a^2}$$
- $n = 1, 2, 3, ...$ (quantum number)
- $a$ = well width (m)
- $m_e = 9.11 \times 10^{-31}$ kg

**Wavefunction:**
$$\psi_n(x) = \sqrt{\frac{2}{a}}\sin\left(\frac{n\pi x}{a}\right)$$
(for $0 < x < a$)

**Energy Separation:**
$$\Delta E = E_{n+1} - E_n = \frac{h^2(2n+1)}{8m_e a^2}$$

---

## Finite Potential Well

**Inside Well (Region II, V = 0):**
$$k^2 = \frac{2m_e E}{\hbar^2}$$
$$\psi_{II}(x) = B_1 e^{ikx} + B_2 e^{-ikx}$$

**In Barrier (Regions I and III, E < V₀):**
$$\alpha^2 = \frac{2m_e(V_0 - E)}{\hbar^2}$$
$$\psi_I(x) = A_1 e^{\alpha x} + A_2 e^{-\alpha x}$$
$$\psi_{III}(x) = C_1 e^{\alpha x} + C_2 e^{-\alpha x}$$

**Penetration Depth:**
$$\delta = \frac{1}{\alpha}$$

**Boundary Condition Equations:**
$$\alpha = k\tan\left(\frac{ka}{2}\right) \quad \text{(even parity)}$$
$$\alpha = -k\cot\left(\frac{ka}{2}\right) \quad \text{(odd parity)}$$

---

## Physical Constants
| Constant | Symbol | Value |
|----------|--------|-------|
| Electron mass | $m_e$ | $9.11 \times 10^{-31}$ kg |
| Planck's constant | $h$ | $6.63 \times 10^{-34}$ J·s |
| Reduced Planck | $\hbar$ | $1.055 \times 10^{-34}$ J·s |
| Boltzmann constant | $k$ | $1.38 \times 10^{-23}$ J·K⁻¹ |
| Speed of light | $c$ | $3 \times 10^8$ m/s |
| Stefan constant | $\sigma_S$ | $5.670 \times 10^{-8}$ W·m⁻²·K⁻⁴ |
| Electron-volt | 1 eV | $1.602 \times 10^{-19}$ J |