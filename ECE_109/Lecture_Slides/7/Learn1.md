# Learn1: Finite Potential Well and Quantum Tunneling
> Estimated time: ~30 minutes

## Section 1: Finite Potential Well - Boundary Conditions

When an electron is confined in a finite potential well, the wavefunction penetrates into the barriers rather than being zero at the boundaries.

The potential energy V(x) is:
- V = 0 inside the well (region II, 0 < x < a)
- V = Vo outside the well (regions I and III)

The Schrödinger equation solutions in each region:
- Region II (inside): $\psi_{II}(x) = A \cos k(x - \frac{a}{2})$ (even parity)
- Region III (right barrier): $\psi_{III}(x) = C_3 \exp[-\alpha(x - a)]$ (exponential decay)

Where:
$$k^2 = \frac{2m_eE}{\hbar^2}$$
$$\alpha^2 = \frac{2m_e(V_o - E)}{\hbar^2}$$

Boundary conditions at x = a require:
$$\psi_{II}(a) = \psi_{III}(a)$$
$$\frac{d\psi_{II}}{dx} = \frac{d\psi_{III}}{dx}$$

The penetration depth $x_0 = \frac{1}{\alpha}$ measures how far the wavefunction extends into the barrier.

## Section 2: Energy Quantization in Finite Well

Applying boundary conditions leads to quantization conditions:
$$\alpha = k \tan\left(\frac{ka}{2}\right) \quad \text{(even states)}$$
$$\alpha = -k \cot\left(\frac{ka}{2}\right) \quad \text{(odd states)}$$

Key difference from infinite well: E_n(V0) < E_n(∞) and k_n(V0) < k_n(∞)

The finite well has fewer bound states than an infinite well of the same dimensions.

## Section 3: Quantum Tunneling

When an electron with energy E < Vo encounters a potential barrier, classical physics predicts complete reflection. Quantum mechanics allows a finite probability that the electron "tunnels" through.

The wavefunctions in three regions:
- Region I (before barrier): $\psi_I(x) = A_1 \exp(jkx) + A_2 \exp(-jkx)$
- Region II (inside barrier): $\psi_{II}(x) = B_1 \exp(\alpha x) + B_2 \exp(-\alpha x)$
- Region III (after barrier): $\psi_{III}(x) = C_1 \exp(jkx) + C_2 \exp(-jkx)$

The transmission coefficient for a wide barrier (αa >> 1):
$$T = T_o \exp(-2\alpha a)$$

Where:
$$T_o = \frac{16E(V_o - E)}{V_o^2}$$

The tunneling probability depends sensitively on barrier width a and height Vo.

## Key Equations

Finite well relationships:
$$k^2 = \frac{2m_eE}{\hbar^2}$$
$$\alpha^2 = \frac{2m_e(V_o - E)}{\hbar^2}$$
$$x_0 = \frac{1}{\alpha}$$

Tunneling transmission:
$$T = T_o \exp(-2\alpha a)$$
$$T_o = \frac{16E(V_o - E)}{V_o^2}$$

Where:
- $m_e$ = electron mass ($9.11 \times 10^{-31}$ kg)
- $\hbar$ = reduced Planck's constant ($1.055 \times 10^{-34}$ J·s)
- $E$ = electron energy
- $V_o$ = barrier height
- $a$ = barrier width
- $\alpha$ = decay constant
