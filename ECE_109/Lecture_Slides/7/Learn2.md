# Learn2: Infinite Potential Box - Three Quantum Numbers
> Estimated time: ~30 minutes

## Section 1: Three-Dimensional Confinement

Consider a particle confined in a 3D box with dimensions a, b, and c along x, y, z axes. The potential energy is zero inside and infinite at the boundaries.

The 3D Schrödinger equation:
$$\frac{\partial^2\psi}{\partial x^2} + \frac{\partial^2\psi}{\partial y^2} + \frac{\partial^2\psi}{\partial z^2} + \frac{2m_e}{\hbar^2}(E - V)\psi = 0$$

With V = 0 inside the box and infinite outside.

## Section 2: Wavefunction and Quantum Numbers

The wavefunction is a product of three 1D solutions:
$$\psi_{n_1n_2n_3}(x, y, z) = A \sin\left(\frac{n_1\pi x}{a}\right) \sin\left(\frac{n_2\pi y}{b}\right) \sin\left(\frac{n_3\pi z}{c}\right)$$

Boundary conditions require ψ = 0 at x=0, x=a, y=0, y=b, z=0, z=c.

The quantized wave numbers:
$$k_x = \frac{n_1\pi}{a} \quad k_y = \frac{n_2\pi}{b} \quad k_z = \frac{n_3\pi}{c}$$

Where $n_1, n_2, n_3 = 1, 2, 3, ...$ (positive integers only, not zero)

## Section 3: Energy Quantization

The energy depends on all three quantum numbers:
$$E = E(k_x, k_y, k_z) = \frac{\hbar^2}{2m_e}(k_x^2 + k_y^2 + k_z^2)$$

For a rectangular box:
$$E_{n_1n_2n_3} = \frac{h^2}{8m_e}\left(\frac{n_1^2}{a^2} + \frac{n_2^2}{b^2} + \frac{n_3^2}{c^2}\right)$$

For a cube (a = b = c):
$$E_{n_1n_2n_3} = \frac{h^2(n_1^2 + n_2^2 + n_3^2)}{8m_ea^2}$$

## Key Equations

Wavefunction:
$$\psi_{n_1n_2n_3}(x, y, z) = A \sin\left(\frac{n_1\pi x}{a}\right) \sin\left(\frac{n_2\pi y}{b}\right) \sin\left(\frac{n_3\pi z}{c}\right)$$

Energy (rectangular box):
$$E_{n_1n_2n_3} = \frac{h^2}{8m_e}\left(\frac{n_1^2}{a^2} + \frac{n_2^2}{b^2} + \frac{n_3^2}{c^2}\right)$$

Energy (cube):
$$E_{n_1n_2n_3} = \frac{h^2(n_1^2 + n_2^2 + n_3^2)}{8m_ea^2}$$

Where:
- $n_1, n_2, n_3$ = quantum numbers (positive integers 1, 2, 3, ...)
- $a, b, c$ = box dimensions (m)
- $m_e$ = electron mass ($9.11 \times 10^{-31}$ kg)
- $h$ = Planck's constant ($6.63 \times 10^{-34}$ J·s)
