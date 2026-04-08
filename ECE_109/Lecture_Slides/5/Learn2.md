# Learn2: Electron in an Infinite Potential Well
> Estimated time: ~30 minutes

## Section 1: Setting Up the Problem

Consider an electron confined to a one-dimensional region $0 < x < a$ where the potential energy is zero (inside the well), and infinite outside:

$$V(x) = \begin{cases} 0 & \text{for } 0 < x < a \\ \infty & \text{for } x \leq 0 \text{ or } x \geq a \end{cases}$$

Since $V = \infty$ outside the well, the electron **cannot exist** there, meaning $\psi = 0$ at $x \leq 0$ and $x \geq a$.

## Section 2: Solving the Schrödinger Equation

Inside the well ($V = 0$), the **time-independent Schrödinger equation** is:

$$\frac{d^2\psi}{dx^2} + \frac{2m_e}{\hbar^2} E\psi = 0$$

This has the general solution form of a traveling wave:

$$\psi(x) = Ae^{jkx} + Be^{-jkx}$$

Where:
$$k^2 = \frac{2m_e E}{\hbar^2}$$

## Section 3: Applying Boundary Conditions

**Boundary condition 1:** $\psi(0) = 0$

This gives: $A + B = 0$, so $B = -A$

The wavefunction becomes: $\psi(x) = A(e^{jkx} - e^{-jkx}) = 2jA\sin(kx)$

**Boundary condition 2:** $\psi(a) = 0$

This gives: $2jA\sin(ka) = 0$

For a non-trivial solution ($A \neq 0$): $\sin(ka) = 0$

This requires: $ka = n\pi$ where $n = 1, 2, 3, ...$

**Key result:** $k_n = \frac{n\pi}{a}$ — only discrete values are allowed!

## Section 4: Energy Quantization

Since $E = \frac{\hbar^2 k^2}{2m_e}$:

$$E_n = \frac{\hbar^2 k_n^2}{2m_e} = \frac{\hbar^2 \pi^2 n^2}{2m_e a^2} = \frac{h^2 n^2}{8m_e a^2}$$

Where:
- $n = 1, 2, 3, ...$ is the **quantum number**
- $E_n$ are the **eigenenergies** (allowed energy levels)

## Section 5: Wavefunctions

The normalized wavefunctions are:

$$\psi_n(x) = \sqrt{\frac{2}{a}} \sin\left(\frac{n\pi x}{a}\right) \quad \text{for } 0 < x < a$$

The **total time-dependent wavefunction** is:

$$\Psi_n(x, t) = \psi_n(x) e^{-iE_n t/\hbar} = \sqrt{\frac{2}{a}} \sin\left(\frac{n\pi x}{a}\right) e^{-iE_n t/\hbar}$$

## Section 6: Key Properties

- **Ground state** ($n=1$): Lowest energy, no nodes in the well
- **Excited states** ($n>1$): Higher energy, $n-1$ nodes inside the well
- **Energy separation:**
$$\Delta E_n = E_{n+1} - E_n = \frac{h^2(2n+1)}{8m_e a^2}$$

- **Parity**: $\psi_1, \psi_3, \psi_5, ...$ are even; $\psi_2, \psi_4, \psi_6, ...$ are odd (about the center $x=a/2$)

## Key Equations

**Time-independent Schrödinger equation (inside well, V=0):**
$$\frac{d^2\psi}{dx^2} + \frac{2m_e}{\hbar^2} E\psi = 0$$

**Allowed wavenumbers:**
$$k_n = \frac{n\pi}{a}$$

**Energy eigenvalues:**
$$E_n = \frac{h^2 n^2}{8m_e a^2} = \frac{\hbar^2 \pi^2 n^2}{2m_e a^2}$$

**Normalized wavefunctions:**
$$\psi_n(x) = \sqrt{\frac{2}{a}} \sin\left(\frac{n\pi x}{a}\right)$$

**Energy separation:**
$$\Delta E_n = \frac{h^2(2n+1)}{8m_e a^2}$$

Where:
- $h = 6.63 \times 10^{-34}$ J·s (Planck constant)
- $\hbar = h/2\pi = 1.055 \times 10^{-34}$ J·s (reduced Planck constant)
- $m_e = 9.11 \times 10^{-31}$ kg (electron mass)
- $a$ = width of the potential well (m)
- $n = 1, 2, 3, ...$ (quantum number)