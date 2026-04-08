# Learn4: The Hydrogen Atom and Quantum Numbers
> Estimated time: ~30 minutes

## Section 1: The Schrödinger Equation
The time-independent Schrödinger equation describes quantum behavior:
$$-\frac{\hbar^2}{2m}\nabla^2\psi + V\psi = E\psi$$

Or equivalently:
$$\frac{\partial^2\psi}{\partial x^2} + \frac{\partial^2\psi}{\partial y^2} + \frac{\partial^2\psi}{\partial z^2} + \frac{2m}{\hbar^2}(E-V)\psi = 0$$

The wavefunction $\psi$ describes the electron, and $|\psi|^2$ is the probability density.

## Section 2: Quantum Numbers
For the hydrogen atom, three quantum numbers emerge:

**Principal quantum number ($n$)**:
- $n = 1, 2, 3, \ldots$
- Quantizes the electron's energy

**Orbital angular momentum quantum number ($\ell$)**:
- $\ell = 0, 1, 2, \ldots, (n-1)$
- Quantizes the magnitude of orbital angular momentum
- Notation: $\ell = 0$ (s), $\ell = 1$ (p), $\ell = 2$ (d), $\ell = 3$ (f)...

**Magnetic quantum number ($m_\ell$)**:
- $m_\ell = -\ell, -(\ell-1), \ldots, 0, \ldots, (\ell-1), +\ell$
- Quantizes the component of angular momentum along a magnetic field

## Section 3: Orbital Angular Momentum
The magnitude of orbital angular momentum:
$$L = \hbar\sqrt{\ell(\ell+1)}$$

The component along z (in a magnetic field):
$$L_z = m_\ell\hbar$$

## Section 4: Electron Energy in Hydrogen
$$E_n = -\frac{m_e e^4}{8\varepsilon_0^2 h^2}\frac{1}{n^2} = -\frac{13.6 \text{ eV}}{n^2}$$

For hydrogen (Z = 1):
$$E_n = -\frac{13.6 \text{ eV}}{n^2}$$

Ionization energy = $|E_1| = 13.6$ eV

## Section 5: Electron Spin
Electrons have intrinsic spin angular momentum, characterized by:

**Spin quantum number ($s$)**:
- $s = 1/2$ (always, for electrons)

**Spin magnetic quantum number ($m_s$)**:
- $m_s = +1/2$ (spin up) or $-1/2$ (spin down)

Spin angular momentum magnitude:
$$S = \hbar\sqrt{s(s+1)} = \hbar\sqrt{3}/2$$

Spin component along z:
$$S_z = m_s\hbar = \pm \hbar/2$$

## Section 6: Complete Quantum State
Four quantum numbers specify a complete state:
| Quantum Number | Symbol | Allowed Values | Quantizes |
|----------------|--------|----------------|-----------|
| Principal | $n$ | 1, 2, 3, ... | Energy |
| Orbital | $\ell$ | 0, 1, 2, ..., n-1 | Angular momentum magnitude |
| Magnetic | $m_\ell$ | $-\ell, ..., +\ell$ | Angular momentum z-component |
| Spin | $m_s$ | $\pm 1/2$ | Spin z-component |

## Section 7: Probability and Orbitals
The radial probability density for finding an electron at distance $r$:
$$P_{n,\ell}(r) = |R_{n,\ell}(r)|^2 r^2$$

Bohr radius ($n=1$, $\ell=0$): $a_0 = 0.0529$ nm

Maximum probability for 1s electron is at $r = a_0$.

## Section 8: Selection Rules
When a photon is absorbed or emitted, quantum numbers must change by:
$$\Delta \ell = \pm 1$$
$$\Delta m_\ell = 0, \pm 1$$

This explains why certain transitions are allowed and others are forbidden.

## Key Equations
$$E_n = -\frac{13.6 \text{ eV}}{n^2} \quad \text{(hydrogen energy levels)}$$
$$L = \hbar\sqrt{\ell(\ell+1)} \quad \text{(orbital angular momentum)}$$
$$L_z = m_\ell\hbar \quad \text{(angular momentum z-component)}$$
$$S_z = m_s\hbar = \pm \hbar/2 \quad \text{(spin z-component)}$$

## Key Definitions
- **Orbital**: Wavefunction describing electron behavior in an atom
- **Bohr radius**: $a_0 = 0.0529$ nm - most probable distance for 1s electron
- **Ionization energy**: Energy to remove electron from atom
- **Selection rules**: Constraints on allowed quantum transitions
- **s, p, d, f orbitals**: $\ell = 0, 1, 2, 3$ respectively
