# Learn4: Electron in a Finite Potential Well
> Estimated time: ~30 minutes

## Section 1: The Finite Potential Well
Consider an electron in a one-dimensional finite potential well:
- Region I ($x < 0$): $V = V_0$
- Region II ($0 \leq x \leq a$): $V = 0$ (inside the well)
- Region III ($x > a$): $V = V_0$

Unlike the infinite well, the electron can penetrate into the barrier regions (I and III), though with exponentially decaying amplitude.

## Section 2: Schrödinger Equation in Each Region
**Inside the well (Region II, $V = 0$, $E > 0$):**
$$k^2 = \frac{2m_e E}{\hbar^2}$$

The solution is oscillatory: $\psi_{II}(x) = B_1 e^{ikx} + B_2 e^{-ikx}$ or equivalently $\psi_{II}(x) = A\cos k(x - a/2)$ (even) or $B\sin k(x - a/2)$ (odd)

**In the barrier (Regions I and III, $E < V_0$):**
$$\alpha^2 = \frac{2m_e(V_0 - E)}{\hbar^2}$$

The solution is exponential: $\psi_I(x) = A_1 e^{\alpha x} + A_2 e^{-\alpha x}$ and $\psi_{III}(x) = C_1 e^{\alpha x} + C_2 e^{-\alpha x}$

For physically normalizable solutions: $A_2 = 0$ in Region I and $C_1 = 0$ in Region III (otherwise the wavefunction would diverge).

## Section 3: Boundary Conditions
The wavefunction must satisfy:
1. $\psi$ is continuous at $x = 0$ and $x = a$
2. $d\psi/dx$ is continuous at $x = 0$ and $x = a$

At $x = a$: $\psi_{II}(a) = \psi_{III}(a)$ and $\frac{d\psi_{II}}{dx}\bigg|_a = \frac{d\psi_{III}}{dx}\bigg|_a$

## Section 4: Wavefunction Behavior
Inside the well: wavefunction resembles free electron (sinusoidal)

In the barrier: wavefunction decays exponentially as $e^{-\alpha x}$ or $e^{-\alpha(x-a)}$

**Penetration depth**: $\delta = 1/\alpha$ is the characteristic depth to which the wavefunction penetrates into the barrier. Higher energy states penetrate more deeply.

The potential well has a center of symmetry at $x = a/2$, leading to:
- **Even parity states**: $\psi \propto \cos[k(x - a/2)]$ (symmetric)
- **Odd parity states**: $\psi \propto \sin[k(x - a/2)]$ (antisymmetric)

## Section 5: Energy Quantization
Energy quantization is found by solving the boundary condition equations:

For even parity: $\alpha = k\tan(ka/2)$

For odd parity: $\alpha = -k\cot(ka/2)$

Where:
$$k^2 = \frac{2m_e E}{\hbar^2} \quad \text{and} \quad \alpha^2 = \frac{2m_e(V_0 - E)}{\hbar^2}$$

These equations can only be satisfied for certain discrete values of $E$ - hence quantized energy levels.

The solutions are found graphically by plotting $\alpha$ and $k\tan(ka/2)$ (or $-k\cot(ka/2)$) vs $E$ and finding intersections.

## Section 6: Comparison to Infinite Well
Key differences from infinite well:

| Property | Infinite Well | Finite Well |
|----------|---------------|-------------|
| Wavefunction outside | $\psi = 0$ | Exponential decay |
| Number of bound states | Infinite | Finite (depends on $V_0$ and $a$) |
| Energy levels | $E_n = h^2 n^2/(8ma^2)$ | Lower than infinite well values |
| Boundary condition | $\psi = 0$ at walls | $\psi$ continuous with decaying tail |

The finite well has fewer energy levels than an infinite well of the same width and depth.

Example: For $a = 2$ nm, $V_0 = 0.5$ eV:
- Infinite well would have $E_1 = 0.094$ eV, $E_2 = 0.38$ eV, $E_3 = 0.85$ eV
- Finite well has $E_1 = 0.057$ eV, $E_2 = 0.22$ eV, $E_3 = 0.45$ eV (all lower)

## Section 7: Applications
Finite potential wells are important in:
- Quantum well devices (semiconductor heterostructures)
- Terahertz emitters (electrons transitioning between levels emit THz radiation)
- Modulation of electron energy levels through well width and depth design