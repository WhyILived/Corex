# Learn3: Electron in an Infinite Potential Well
> Estimated time: ~30 minutes

## Section 1: The Infinite Potential Well
Consider an electron confined to a one-dimensional square potential well of width $a$, where:
- Inside the well ($0 \leq x \leq a$): $V = 0$
- Outside the well ($x < 0$ or $x > a$): $V = \infty$

Since the electron cannot exist inside the box walls, $\Psi = 0$ for $x \leq 0$ or $x \geq a$. Inside the well, $\Psi \neq 0$.

## Section 2: Boundary Conditions and Solutions
Inside the well (region II with $V = 0$), we solve the time-independent Schrödinger equation:

$$\frac{d^2\psi}{dx^2} + \frac{2m_e}{\hbar^2}E\psi = 0$$

The general solution is: $\psi(x) = A\sin(kx) + B\cos(kx)$

**Boundary conditions:**
1. $\psi(0) = 0$ and $\psi(a) = 0$ (wavefunction must be zero at walls)
2. $\psi$ and $d\psi/dx$ must be continuous

Applying $\psi(0) = 0$: $B = 0$, so $\psi(x) = A\sin(kx)$

Applying $\psi(a) = 0$: $A\sin(ka) = 0$

For non-trivial solutions ($A \neq 0$): $\sin(ka) = 0$, which requires $ka = n\pi$ where $n = 1, 2, 3, ...$

(Note: $n = 0$ gives $\psi = 0$ everywhere, meaning no electron)

Therefore: $k_n = \frac{n\pi}{a}$

## Section 3: Quantized Energy Levels
The energy of the electron (all kinetic, since $V = 0$ inside):

$$E_n = \frac{\hbar^2 k_n^2}{2m_e} = \frac{\hbar^2 n^2 \pi^2}{2m_e a^2} = \frac{h^2 n^2}{8m_e a^2}$$

Where:
- $E_n$ = energy of quantum state $n$ (J)
- $n$ = quantum number ($1, 2, 3, ...$)
- $m_e$ = electron mass ($9.11 \times 10^{-31}$ kg)
- $a$ = well width (m)
- $h$ = Planck's constant ($6.63 \times 10^{-34}$ J·s)

Key insight: Energy is quantized - only discrete values are allowed.

## Section 4: Normalized Wavefunctions
Using the normalization condition $\int_0^a |\psi_n|^2 dx = 1$:

$$\psi_n(x) = \sqrt{\frac{2}{a}}\sin\left(\frac{n\pi x}{a}\right)$$

The probability density is $|\psi_n|^2 \propto \sin^2(n\pi x/a)$.

**Parity:**
- For odd $n$ ($n = 1, 3, 5...$): wavefunctions are even parity (antisymmetric about $a/2$)
- For even $n$ ($n = 2, 4, 6...$): wavefunctions are odd parity (symmetric)

**Nodes:** The number of nodes within the well increases with $n$: $\psi_n$ has $(n-1)$ nodes.

## Section 5: Energy Differences
The separation between consecutive energy levels:

$$\Delta E = E_{n+1} - E_n = \frac{h^2(2n+1)}{8m_e a^2}$$

As $a \to \infty$ (free electron): $\Delta E \to 0$, energy becomes continuous.

As $a \to$ atomic dimensions: $\Delta E$ becomes significant (quantum effects dominate).

## Section 6: Key Characteristics
- Ground state ($n = 1$) has the lowest energy: $E_1 = h^2/(8m_e a^2)$
- The electron always has kinetic energy (zero-point energy), even at lowest state
- Energy increases with $n^2$: $E_2 = 4E_1$, $E_3 = 9E_1$, etc.
- Higher $n$ states have more nodes in their wavefunctions