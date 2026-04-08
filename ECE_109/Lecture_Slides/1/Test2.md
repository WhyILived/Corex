# Test2: Wave Equation & Electromagnetic Waves
> Tests: Learn2 material
> Time: ~15 minutes

## Conceptual Questions

1. State whether each operation is gradient, divergence, or curl, and what it maps to:
   (a) scalar → vector
   (b) vector → scalar
   (c) vector → vector

2. What is the mathematical property of the wave equation that allows two waves to pass through each other without disturbing each other?

3. For a plane wave propagating in the z-direction, describe the relationship between the electric field, magnetic field, and direction of propagation.

4. Define: wavefront, ray, wavenumber.

## Calculation Problems

1. **Wave Parameters**
   - A light wave in vacuum has frequency $f = 5 \times 10^{14}$ Hz.
   - Find: (a) angular frequency $\omega$, (b) wavelength $\lambda$, (c) wavenumber $k$

2. **Wave Equation Verification**
   - Show that $E(z,t) = E_0 \cos(kz - \omega t)$ satisfies the 1D wave equation
   - Find the second derivatives $\frac{\partial^2 E}{\partial z^2}$ and $\frac{\partial^2 E}{\partial t^2}$

3. **Vector Calculus**
   - Given $\phi(x,y,z) = 3x^2y + 2yz^2$, find $\nabla \phi$
   - Given $\vec{A} = x^2\hat{x} + 2yz\hat{y} + z^2\hat{z}$, find $\nabla \cdot \vec{A}$

4. **Phase Calculation**
   - Light of wavelength 600 nm travels through vacuum.
   - (a) What is the phase of the wave at position $z = 1.5\,\mu m$ and time $t = 10^{-15}$ s?
   - (b) At this point, is the wave at a maximum, minimum, or in between?

## Answers

1. **Wave Parameters:**
   - $\omega = 2\pi f = 2\pi(5 \times 10^{14}) = 3.14 \times 10^{15}$ rad/s
   - $\lambda = c/f = (3 \times 10^8)/(5 \times 10^{14}) = 600$ nm
   - $k = 2\pi/\lambda = 2\pi/(600 \times 10^{-9}) = 1.05 \times 10^7$ m$^{-1}$

2. **Wave Equation Verification:**
   - $\frac{\partial^2 E}{\partial z^2} = -k^2 E_0 \cos(kz - \omega t)$
   - $\frac{\partial^2 E}{\partial t^2} = -\omega^2 E_0 \cos(kz - \omega t)$
   - Substituting: $-k^2 E + \frac{1}{c^2}(-\omega^2 E) = -E(k^2 - \omega^2/c^2) = 0$ when $\omega = ck$

3. **Vector Calculus:**
   - $\nabla \phi = (6xy)\hat{x} + (3x^2 + 2z^2)\hat{y} + (4yz)\hat{z}$
   - $\nabla \cdot \vec{A} = 2x + 2z$

4. **Phase:**
   - $k = 2\pi/\lambda = 2\pi/(600 \times 10^{-9}) = 1.05 \times 10^7$ m$^{-1}$
   - $\omega = 2\pi c/\lambda = 2\pi(3 \times 10^8)/(600 \times 10^{-9}) = 3.14 \times 10^{15}$ rad/s
   - Phase $\phi = kz - \omega t = (1.05 \times 10^7)(1.5 \times 10^{-6}) - (3.14 \times 10^{15})(10^{-15}) = 15.75 - 3.14 = 12.6$ rad $\approx 2\pi(2)$
   - Since phase $\approx 4\pi$ (multiple of 2$\pi$), this is a maximum
