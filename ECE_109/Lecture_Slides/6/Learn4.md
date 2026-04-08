# Learn4: Tunneling Phenomenon
> Estimated time: ~30 minutes

## Classical vs Quantum Behavior

In classical mechanics, a particle with energy $E < V_0$ cannot surmount a potential barrier—it would be completely reflected.

In quantum mechanics, even when $E < V_0$, there is a non-zero probability of finding the particle on the other side of the barrier. This is called **tunneling**.

## Tunneling Setup

Consider a rectangular potential barrier:

$$V(x) = \begin{cases} 0 & x < 0 \text{ (region I)} \\ V_0 & 0 \leq x \leq a \text{ (region II)} \\ 0 & x > a \text{ (region III)} \end{cases}$$

With $E < V_0$.

## Wavefunctions in Each Region

**Region I (incident and reflected):**
$$\psi_I(x) = A_1 e^{jkx} + A_2 e^{-jkx}$$

**Region II (inside barrier, decaying):**
$$\psi_{II}(x) = B_1 e^{\alpha x} + B_2 e^{-\alpha x}$$

where:
$$\alpha = \sqrt{\frac{2m_e(V_0 - E)}{\hbar^2}}$$

**Region III (transmitted):**
$$\psi_{III}(x) = C_1 e^{jkx}$$

## Transmission and Reflection Coefficients

The **transmission coefficient** (probability of tunneling through):

$$T = \frac{|\psi_{III}(x)|^2}{|\psi_I(\text{incident})|^2} = \frac{C_1^2}{A_1^2} = \frac{1}{1 + D\sinh^2(\alpha a)}$$

Where:
$$D = \frac{V_0^2}{4E(V_0 - E)}$$

The **reflection coefficient**:

$$R = \frac{A_2^2}{A_1^2} = 1 - T$$

## Physical Interpretation

- Tunneling probability decreases exponentially with barrier width $a$
- Tunneling probability increases as the mass of the particle decreases
- Tunneling is more likely when $E$ is closer to $V_0$

## Application: Scanning Tunneling Microscope (STM)

The STM exploits quantum tunneling to image surfaces at atomic resolution.

When a metal tip is brought close to a conducting surface (separated by vacuum):
1. Electrons in the metal have energy $E < V_0$ (work function barrier)
2. The wavefunction decays exponentially in the vacuum region
3. If a second metal is brought close, electrons can tunnel into it
4. The tunneling current $I_{\text{tunnel}}$ is exponentially sensitive to the gap distance

This allows STM to achieve atomic-scale spatial resolution.
