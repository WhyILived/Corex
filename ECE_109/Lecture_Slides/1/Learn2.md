# Learn2: The Electron as a Wave and de Broglie Relationship
> Estimated time: ~30 minutes

## Section 1: Wave-Particle Duality for Matter

Just as light exhibits both wave and particle properties, electrons (and other matter) can also exhibit wave-like properties. When electron beams are used in Young's double-slit experiment, they produce interference fringes just like light.

When an energetic electron beam hits a polycrystalline aluminum sheet, it produces diffraction rings similar to X-ray diffraction patterns. The electrons obey the **Bragg diffraction condition**:

$$2d\sin\theta = n\lambda$$

Where:
- $d$ = separation between atomic planes
- $\theta$ = diffraction angle
- $\lambda$ = wavelength of electron wave

## Section 2: The de Broglie Relationship

French physicist Louis de Broglie hypothesized that particles of momentum $p$ have an associated wavelength:

$$\lambda = \frac{h}{p}$$

Or equivalently:

$$p = \frac{h}{\lambda}$$

Where:
- $h = 6.63 \times 10^{-34}$ J·s (Planck's constant)
- $p$ = momentum of the particle (kg·m/s)

For a particle with mass $m$ and velocity $v$:
$$p = mv$$
$$\lambda = \frac{h}{mv}$$

## Section 3: Electron Wavelength and Accelerating Voltage

For an electron accelerated by voltage $V$, its kinetic energy is:
$$KE = eV = \frac{p^2}{2m_e}$$

Where:
- $e = 1.6 \times 10^{-19}$ C (elementary charge)
- $m_e = 9.1 \times 10^{-31}$ kg (electron mass)
- $V$ = accelerating voltage (volts)

Solving for momentum:
$$p = \sqrt{2m_e eV}$$

The de Broglie wavelength:
$$\lambda = \frac{h}{\sqrt{2m_e eV}}$$

Example calculations:
- 50 g golf ball at 20 m/s: $\lambda = 6.63 \times 10^{-34}$ m (too small to observe)
- Proton at 2200 m/s: $\lambda ≈ 0.18$ nm (comparable to interatomic distances)
- Electron accelerated by 100 V: $\lambda = 0.123$ nm (visible diffraction effects)

## Section 4: Electron Diffraction Confirmation

Electron diffraction experiments confirm de Broglie's hypothesis. In experiments with aluminum foil:
- Electrons accelerated by anode voltage V produce diffraction rings
- The Bragg condition is satisfied: $2d\sin\theta = n\lambda$
- Plotting $\sin\theta$ vs $1/\sqrt{V}$ yields a straight line through the origin
- This confirms $\lambda \propto 1/\sqrt{V}$ as predicted by de Broglie's equation

For FCC aluminum crystal with lattice parameter $a = 0.4049$ nm:
$$\sin\theta_1 = \frac{\sqrt{3}h}{2a(2m_e e)^{1/2}}\frac{1}{\sqrt{V}}$$

Experimental values give $h = 6.67 \times 10^{-34}$ J·s, within 0.7% of the accepted value.

## Key Equations

| Equation | Description |
|----------|-------------|
| $\lambda = h/p$ | de Broglie wavelength |
| $p = \sqrt{2m_e eV}$ | Electron momentum from accelerating voltage |
| $\lambda = h/\sqrt{2m_e eV}$ | Electron wavelength from accelerating voltage |
| $2d\sin\theta = n\lambda$ | Bragg's law (diffraction condition) |