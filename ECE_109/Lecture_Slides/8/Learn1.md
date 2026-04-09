# Learn1: Quantum States of the Hydrogen Atom
> Estimated time: ~30 minutes

## Section 1: The Schrödinger Equation for Hydrogen

The hydrogen atom consists of a single electron bound to a proton by the Coulomb potential:

$$V(r) = -\frac{Ze^2}{4\pi\varepsilon_0 r}$$

Where:
- $Z = 1$ for hydrogen
- $e$ = elementary charge
- $\varepsilon_0$ = permittivity of free space
- $r$ = distance from nucleus

The time-independent Schrödinger equation in three dimensions is:

$$\frac{\partial^2\psi}{\partial x^2} + \frac{\partial^2\psi}{\partial y^2} + \frac{\partial^2\psi}{\partial z^2} + \frac{2m_e}{\hbar^2}(E - V)\psi = 0$$

## Section 2: Quantum Numbers

Solutions to the Schrödinger equation for hydrogen yield three quantum numbers:

### Principal Quantum Number (n)
$$n = 1, 2, 3, \ldots$$

Determines the energy level and overall size of the orbital.

### Orbital Angular Momentum Quantum Number (ℓ)
$$\ell = 0, 1, 2, \ldots, (n-1)$$

Determines the shape of the orbital. Common notations:
- ℓ = 0: s orbital (spherical)
- ℓ = 1: p orbital (dumbbell)
- ℓ = 2: d orbital (cloverleaf)

### Magnetic Quantum Number (mℓ)
$$m_\ell = -\ell, -(\ell-1), \ldots, 0, \ldots, (\ell-1), \ell$$

Or equivalently: $|m_\ell| \leq \ell$

Determines the orientation of the orbital in space.

## Section 3: Wavefunction Separation

The complete wavefunction separates into radial and angular parts:

$$\psi_{n,\ell,m_\ell}(r, \theta, \phi) = R_{n,\ell}(r) \cdot Y_{\ell,m_\ell}(\theta, \phi)$$

Where:
- $R_{n,\ell}(r)$ = radial wavefunction (depends on n and ℓ)
- $Y_{\ell,m_\ell}(\theta, \phi)$ = spherical harmonic (depends on ℓ and mℓ)

## Section 4: Quantum Numbers Table

| n | ℓ | mℓ | Orbital |
|---|---|---|---------|
| 1 | 0 | 0 | 1s |
| 2 | 0 | 0 | 2s |
| 2 | 1 | -1, 0, +1 | 2p |
| 3 | 0 | 0 | 3s |
| 3 | 1 | -1, 0, +1 | 3p |
| 3 | 2 | -2, -1, 0, +1, +2 | 3d |

## Section 5: Heisenberg Uncertainty Principle

The Heisenberg uncertainty principle states:

$$\Delta x \cdot \Delta p_x \gtrsim \hbar$$

Where:
- $\Delta x$ = uncertainty in position
- $\Delta p_x$ = uncertainty in momentum
- $\hbar = \frac{h}{2\pi}$ = reduced Planck's constant

This principle explains why the electron does not merge with the proton - the electron cannot have a precisely defined position (which would be required for merger) because it also has a well-defined momentum.

### Standard Deviation Form
$$\Delta x = \sqrt{\langle \hat{x}^2 \rangle - \langle \hat{x} \rangle^2}$$
$$\Delta p_x = \sqrt{\langle \hat{p}_x^2 \rangle - \langle \hat{p}_x \rangle^2}$$

## Section 6: Radial Probability Density

The probability of finding the electron between r and r + dr is:

$$P(r) \, dr = |R_{n,\ell}(r)|^2 \cdot |Y_{\ell,m_\ell}(\theta, \phi)|^2 \cdot 4\pi r^2 \, dr$$

The factor $4\pi r^2$ accounts for the increasing volume of a spherical shell as radius increases.

Key radial probability features:
- For 1s: maximum at $r = a_0$ (Bohr radius = 0.0529 nm)
- Nodes occur where $R_{n,\ell}(r) = 0$