# Learn3: Electron in a Finite Potential Well
> Estimated time: ~30 minutes

## Section 1: Setting Up the Problem

A finite potential well has zero potential energy ($V = 0$) inside the well ($0 < x < a$) and a finite potential energy ($V = V_0$) outside:

$$V(x) = \begin{cases} V_0 & \text{for } x < 0 \text{ (region I)} \\ 0 & \text{for } 0 \leq x \leq a \text{ (region II)} \\ V_0 & \text{for } x > a \text{ (region III)} \end{cases}$$

The electron is confined to the well but can **penetrate into the barriers** (unlike the infinite well where $\psi = 0$ outside).

## Section 2: Schrödinger Equation in Each Region

**Region II (inside the well, $V = 0$):**

$$\frac{d^2\psi}{dx^2} + \frac{2m_e}{\hbar^2} E\psi = 0$$

Let $k^2 = \frac{2m_e E}{\hbar^2}$, giving solutions:

$$\psi_{II}(x) = B_1 e^{jkx} + B_2 e^{-jkx}$$

**Regions I and III (outside the well, $V = V_0$):**

Since $E < V_0$ (electron is bound), define $\alpha^2 = \frac{2m_e(V_0 - E)}{\hbar^2}$:

$$\frac{d^2\psi}{dx^2} - \frac{2m_e}{\hbar^2}(V_0 - E)\psi = 0$$

$$\psi_I(x) = A_1 e^{\alpha x} + A_2 e^{-\alpha x}$$
$$\psi_{III}(x) = C_1 e^{\alpha x} + C_2 e^{-\alpha x}$$

## Section 3: Boundary Conditions and Wavefunction Behavior

The wavefunction must satisfy:
1. $\psi$ is continuous at boundaries
2. $d\psi/dx$ is continuous at boundaries
3. Normalization: $\int |\psi|^2 dx = 1$

**As $x \to -\infty$:** $\psi_I$ must be finite, so $A_2 = 0$:
$$\psi_I(x) = A_1 e^{\alpha x}$$

**As $x \to +\infty$:** $\psi_{III}$ must be finite, so $C_1 = 0$:
$$\psi_{III}(x) = C_2 e^{-\alpha x}$$

The wavefunction **decays exponentially** in the barrier regions!

## Section 4: Penetration Depth

The **penetration depth** is defined as:

$$\delta = \frac{1}{\alpha} = \frac{\hbar}{\sqrt{2m_e(V_0 - E)}}$$

This is the characteristic distance over which the wavefunction decays into the barrier.

Higher energy $E$ (closer to $V_0$) means **deeper penetration**.
Lower energy $E$ (closer to 0) means **shallower penetration**.

## Section 5: Quantized Energy Levels

Due to the boundary conditions at $x = 0$ and $x = a$, only **discrete energy values** are allowed.

For a symmetric finite well, the solutions split into two families based on parity:

**Even parity (cosine-like solutions):**
$$\alpha = k \tan\left(\frac{ka}{2}\right)$$

**Odd parity (sine-like solutions):**
$$\alpha = -k \cot\left(\frac{ka}{2}\right)$$

These equations must be solved **graphically** (or numerically) since they involve transcendental functions.

## Section 6: Comparison with Infinite Well

| Property | Infinite Well | Finite Well |
|----------|---------------|-------------|
| Wavefunction outside | $\psi = 0$ | Exponential decay |
| Energy levels | $E_n = \frac{h^2 n^2}{8m_e a^2}$ | Lower, solved graphically |
| Number of levels | Infinite | Finite (depends on $V_0$ and $a$) |
| Penetration depth | N/A | $\delta = 1/\alpha$ |

**Key insight:** The finite well energies $E_n$ are **always lower** than the corresponding infinite well energies because the wavefunction extends into the barrier region, increasing the uncertainty in position $\Delta x$, which decreases the uncertainty in momentum $\Delta p$, resulting in lower kinetic energy.

## Example: 2 nm Well with 0.5 eV Barrier

For a finite well with width $a = 2$ nm and barrier height $V_0 = 0.5$ eV:

- **Infinite well energies:** $E_1^\infty = 0.094$ eV, $E_2^\infty = 0.38$ eV, $E_3^\infty = 0.85$ eV
- **Finite well energies (actual):** $E_1 = 0.057$ eV, $E_2 = 0.22$ eV, $E_3 = 0.45$ eV

The finite well has **fewer energy levels** (only 3 bound states for these parameters).

Penetration depths:
- For $E_1 = 0.057$ eV: $\delta_1 \approx 0.29$ nm
- For $E_2 = 0.22$ eV: $\delta_2 \approx 0.37$ nm
- For $E_3 = 0.45$ eV: $\delta_3 \approx 0.87$ nm

## Key Equations

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

Where:
- $m_e = 9.11 \times 10^{-31}$ kg (electron mass)
- $\hbar = 1.055 \times 10^{-34}$ J·s
- $a$ = well width (m)
- $V_0$ = barrier height (J or eV)
- $E$ = electron energy ($E < V_0$ for bound states)
- $k$ = wavevector inside well (rad/m)
- $\alpha$ = decay constant in barrier (1/m)