# Learn3: Heisenberg's Uncertainty Principle
> Estimated time: ~30 minutes

## Section 1: Introduction
The Heisenberg Uncertainty Principle is a fundamental limit to what we can simultaneously know about certain pairs of physical quantities.

Unlike measurement errors, this is a **theoretical limit** inherent to quantum mechanics - not about instrument precision.

## Section 2: Position-Momentum Uncertainty
For a particle, we cannot simultaneously know exact values of position $x$ and momentum $p_x$ along the same direction:

$$\Delta x \cdot \Delta p_x \gtrsim \frac{\hbar}{2}$$

Where:
- $\Delta x$ = uncertainty in position
- $\Delta p_x$ = uncertainty in momentum
- $\hbar = \frac{h}{2\pi} = 1.055 \times 10^{-34}$ J·s

More precisely: $\Delta x \Delta p_x \geq \frac{\hbar}{2}$ (some texts use $\hbar$ or even $h$)

## Section 3: Understanding the Principle
**For a free electron** (wave with single wavelength $\lambda$):
- The wave extends infinitely in space → $\Delta x = \infty$
- Momentum is exactly defined: $p = h/\lambda$ → $\Delta p_x = 0$
- Product: $\Delta x \cdot \Delta p_x = \infty \cdot 0 > \frac{\hbar}{2}$ ✓

**For electron in a box** (confined to region width $a$):
- $\Delta x \approx a$ (uncertainty in position)
- Momentum can be in two directions → $\Delta p_x \sim h/a$
- Product: $\Delta x \cdot \Delta p_x \sim a \cdot (h/a) = h \geq \frac{\hbar}{2}$ ✓

## Section 4: Energy-Time Uncertainty
There is also an uncertainty relationship between energy and time:

$$\Delta E \cdot \Delta t \gtrsim \frac{\hbar}{2}$$

Where:
- $\Delta E$ = uncertainty in energy
- $\Delta t$ = time during which energy is measured

Physical meaning: A quantum state that exists for only a short time $\Delta t$ has an uncertainty $\Delta E$ in its energy.

## Section 5: Consequences
1. **Particles cannot be localized to arbitrarily small regions** without increasing their momentum uncertainty
2. **The ground state of a confined particle** has non-zero momentum due to confinement
3. **Natural linewidth broadening**: Excited states have finite lifetimes, leading to energy uncertainty

## Section 6: Applications
**Atomic scale**: Electron confined to ~0.1 nm (typical atom size):
$$\Delta p_x \approx \frac{\hbar}{\Delta x} = \frac{1.055 \times 10^{-34}}{10^{-10}} = 1.055 \times 10^{-24} \text{ kg·m/s}$$

This gives kinetic energy of several eV - explaining why electrons in atoms have significant energy!

**Macroscopic scale**: 100 g apple in 1 m crate:
$$\Delta v_x \approx \frac{\hbar}{m \Delta x} = \frac{1.055 \times 10^{-34}}{(0.1)(1)} = 1.055 \times 10^{-33} \text{ m/s}$$

Negligible for everyday objects - quantum effects only matter at small scales.

## Key Equations
$$\Delta x \cdot \Delta p_x \gtrsim \frac{\hbar}{2} \quad \text{(position-momentum)}$$
$$\Delta E \cdot \Delta t \gtrsim \frac{\hbar}{2} \quad \text{(energy-time)}$$

## Key Definitions
- **Uncertainty principle**: Fundamental limit on simultaneous knowledge of certain paired observables
- **$\Delta x$**: Spread in position measurements
- **$\Delta p_x$**: Spread in momentum measurements  
- **Ground state**: Lowest energy state of a confined particle
