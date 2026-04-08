# Learn1: Light as a Wave and Wave-Particle Duality
> Estimated time: ~30 minutes

## Section 1: Brief History of the Science of Light

### Newton's Particle Theory (17th-18th century)
Sir Isaac Newton proposed that light consists of particles (corpuscles) that bounce around and get reflected from objects. This explained reflection but struggled with refraction.

### Maxwell's Wave Theory (19th century)
James Clerk Maxwell introduced Maxwell Equations - the basic theory of electromagnetism. He showed that light is an electromagnetic wave. This explained interference, diffraction, and refraction phenomena.

### Planck and Einstein's Quantum Theory (early 20th century)
Max Planck and Albert Einstein proposed that light is both a wave and a set of particles called photons. This is the **wave-particle duality** - light exhibits both wave and particle properties depending on the experiment.

### Key Historical Discoveries
- **William Herschel (1800)**: Discovered infrared light ("heating" radiation)
- **Johann Wilhelm Ritter (1801)**: Discovered ultraviolet light (1801) ("chemical/oxidizing" rays)
- **Joseph von Fraunhofer (1787-1826)**: Developed transparent glass, spectrometer, and discovered spectral lines

## Section 2: Light as an Electromagnetic Wave

Light is an electromagnetic (EM) wave that propagates through space. The electric field Ey at position x at time t is described by:

$$E_y(x, t) = E_0 \sin(kx - \omega t)$$

Where:
- $E_0$ = amplitude of the electric field
- $k = 2\pi/\lambda$ = wavenumber (propagation constant)
- $\lambda$ = wavelength
- $\omega = 2\pi f$ = angular frequency
- $f$ = frequency

The velocity of the wave (phase velocity) is:

$$c = \frac{\omega}{k} = f\lambda$$

The intensity of the wave is:

$$I = \frac{1}{2}c\epsilon_0 E_0^2$$

Where:
- $c = 3 \times 10^8$ m/s (speed of light)
- $\epsilon_0 = 8.85 \times 10^{-12}$ F/m (permittivity of free space)

## Section 3: The Wave Equation

Light as an EM wave satisfies the wave equation:

$$\nabla^2u - \frac{1}{c^2}\frac{\partial^2}{\partial t^2}u = 0$$

In one dimension (for the E-field):
$$\frac{\partial^2}{\partial z^2}E(z,t) - \frac{1}{c^2}\frac{\partial^2}{\partial t^2}E(z,t) = 0$$

Where $\nabla^2$ is the Laplacian operator. This is a linear differential equation, meaning if $f(x,y,z,t)$ and $g(x,y,z,t)$ are solutions, then $h(x,y,z,t) = f(x,y,z,t) + g(x,y,z,t)$ is also a solution (superposition principle).

### Vector Calculus Operators

- **Gradient ($\nabla\phi$)**: Measures the rate and direction of change in a scalar field. Maps scalar → vector.
- **Divergence ($\nabla \cdot \vec{A}$)**: Measures the magnitude of a source or sink at a point in a vector field. Maps vector → scalar.
- **Curl ($\nabla \times \vec{A}$)**: Measures the tendency to rotate about a point in a vector field. Maps vector → vector.
- **Laplacian ($\nabla^2$)**: Divergence of the gradient. For a scalar: $\nabla^2\phi = \frac{\partial^2\phi}{\partial x^2} + \frac{\partial^2\phi}{\partial y^2} + \frac{\partial^2\phi}{\partial z^2}$

## Section 4: Young's Double-Slit Experiment - Light as a Wave

When light passes through two slits S1 and S2, it creates an interference pattern of bright and dark fringes (Young's fringes) on a screen.

Constructive interference (bright fringes):
$$S_1P - S_2P = n\lambda$$

Destructive interference (dark fringes):
$$S_1P - S_2P = \left(n + \frac{1}{2}\right)\lambda$$

Where:
- $n$ = integer (0, 1, 2, 3, ...)

## Section 5: Bragg's Law - X-ray Diffraction

When X-rays strike a crystalline material, they produce diffraction patterns. The condition for constructive interference is:

$$2d\sin\theta = n\lambda \quad n = 1, 2, 3, \ldots$$

Where:
- $d$ = separation between atomic planes
- $\theta$ = angle of incidence
- $\lambda$ = wavelength of X-rays

This is known as **Bragg's law** and is fundamental to crystallography.

## Section 6: Photons - Light as Particles

Light can also behave as a stream of particles called **photons**. Each photon carries a quantum of energy:

$$E_{ph} = hf = \frac{hc}{\lambda}$$

Where:
- $E_{ph}$ = energy of a photon (J)
- $h = 6.6 \times 10^{-34}$ J·s (Planck's constant)
- $f$ = frequency of light (Hz)
- $c = 3 \times 10^8$ m/s (speed of light)

The momentum of a photon is:

$$p = \frac{h}{\lambda}$$

## Section 7: The Photoelectric Effect

When light strikes a metal surface, electrons can be emitted. This is the **photoelectric effect**. Key observations:

1. Electrons are emitted only when light frequency exceeds a threshold frequency $f_0$
2. The kinetic energy of emitted electrons depends on light frequency, not intensity
3. Increasing light intensity increases the number of electrons emitted, but not their energy

The maximum kinetic energy of emitted electrons is:

$$KEm = hf - \Phi$$

Where:
- $KEm$ = maximum kinetic energy of emitted electron (J)
- $h$ = Planck's constant
- $f$ = frequency of incident light
- $\Phi$ = work function of the metal (minimum energy needed to release an electron)

The stopping voltage $V_0$ relates to kinetic energy by:

$$eV_0 = KEm$$

Where:
- $e = 1.6 \times 10^{-19}$ C (elementary charge)

## Section 8: Wave-Particle Duality

Light exhibits both wave-like and particle-like properties:

- **Wave properties**: Interference, diffraction (explain with wave model)
- **Particle properties**: Photoelectric effect, Compton scattering (explain with photon model)

Light intensity relates to photon flux density:

$$I = \Gamma_{ph}hf$$

Where:
- $\Gamma_{ph} = \frac{\Delta N_{ph}}{A\Delta t}$ = photon flux density (photons per unit area per second)

The energy and momentum of a photon can also be written as:

$$E = \hbar\omega \quad p = \hbar k$$

## Section 9: Monochromatic Plane Waves, Wavefronts, Rays, and Beams

### Monochromatic Plane Wave
The general solution to the wave equation in one dimension is:

$$E(z,t) = E_0\cos(kz - \omega t + \phi_0)$$

Where:
- $\phi_0$ = initial phase
- $k = 2\pi/\lambda$ = wavenumber (spatial angular frequency)
- $\omega = 2\pi/T$ = angular frequency (temporal)

The wavelength $\lambda$ and temporal period $T$ relate to speed:

$$v = \frac{\lambda}{T} = \frac{\omega}{k} = f\lambda$$

### Wavefronts, Rays, and Beams

- **Wavefront**: The locus (curve or surface) of points with identical wave displacement. In a plane wave, wavefronts are planar surfaces perpendicular to the direction of propagation.

- **Ray**: A line perpendicular to a series of successive wavefronts. It specifies the energy flow direction in the wave.

- **Beam**: A bundle of rays traveling together.

### Light as EM Waves with Specific Wavelength Range

Light = electromagnetic waves with wavelength range approximately 400-700 nm (visible spectrum)
Photons = indivisible units of light (particles of light)

$$E = \hbar\omega$$

Where:
- $\hbar = h/2\pi = 1.05 \times 10^{-34}$ J·s (reduced Planck's constant)
- $\omega = 2\pi f$ (angular frequency)

Where:
- $\hbar = h/2\pi = 1.05 \times 10^{-34}$ J·s (reduced Planck's constant)
- $k = 2\pi/\lambda$ = wave number