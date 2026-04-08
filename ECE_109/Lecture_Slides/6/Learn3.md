# Learn3: Finite Potential Well
> Estimated time: ~30 minutes

## Structure of the Finite Potential Well

The finite potential well has three regions:

$$V(x) = \begin{cases} V_0 & |x| > a/2 \text{ (regions I and III)} \\ 0 & |x| < a/2 \text{ (region II)} \end{cases}$$

Unlike the infinite well, the electron can penetrate into the classically forbidden regions.

## Wavefunctions in Each Region

**Region II (inside the well, $E > 0$):**
$$\frac{d^2\psi}{dx^2} = -\frac{2m_e}{\hbar^2}E\psi(x)$$
$$k^2 = \frac{2m_e E}{\hbar^2}$$
$$\psi_{II}(x) = B_1 e^{jkx} + B_2 e^{-jkx}$$

**Regions I and III (outside the well, $E < V_0$):**
$$\frac{d^2\psi}{dx^2} = -\frac{2m_e}{\hbar^2}(E - V_0)\psi(x)$$
Since $E - V_0 < 0$:
$$\alpha^2 = \frac{2m_e(V_0 - E)}{\hbar^2}$$
$$\psi_I(x) = A_1 e^{\alpha x} + A_2 e^{-\alpha x}$$
$$\psi_{III}(x) = C_1 e^{\alpha x} + C_2 e^{-\alpha x}$$

## Penetration Depth

The penetration depth (decay length) is defined as:

$$x_0 = \frac{1}{\alpha}$$

where:

$$\alpha = \sqrt{\frac{2m_e(V_0 - E)}{\hbar^2}}$$

This characterizes how deeply the wavefunction penetrates into the classically forbidden region.

## Boundary Conditions

At $x = \pm a/2$, the wavefunction and its derivative must be continuous:

$$\psi_{II}(a/2) = \psi_{III}(a/2)$$
$$\frac{d\psi_{II}}{dx}\bigg|_{x=a/2} = \frac{d\psi_{III}}{dx}\bigg|_{x=a/2}$$

## Graphical Solution

For even and odd parity solutions, we obtain the transcendental equation:

$$\alpha = k \tan\left(\frac{ka}{2}\right) \quad \text{(even parity)}$$

$$\alpha = -k \cot\left(\frac{ka}{2}\right) \quad \text{(odd parity)}$$

Where:
$$k = \frac{\sqrt{2m_e E}}{\hbar}$$
$$\alpha = \frac{\sqrt{2m_e(V_0 - E)}}{\hbar}$$

## Symmetry and Parity

When the potential energy function $V(x)$ exhibits symmetry about a center point $C$, the wavefunctions have either:
- **Even parity**: symmetric about $C$
- **Odd parity**: antisymmetric about $C$

This leads to solutions that are either even or odd functions.

## Key Difference from Infinite Well

$$E_n(\infty) > E_n(V_0)$$
$$k_n(\infty) > k_n(V_0)$$

The finite well has fewer bound states than the infinite well for the same dimensions, and the energy levels are lower.
