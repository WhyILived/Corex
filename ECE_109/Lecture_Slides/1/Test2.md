# Test2: Knowledge Check
> Tests: Learn2 material (Monochromatic Plane Waves and Light Properties)
> Time: ~15 minutes

## Conceptual Questions

1. Write the general form of a 1D monochromatic plane wave solution to the wave equation, and define each parameter: $E_0$, $k$, $\omega$, $\phi_0$, and $z$.

2. If the period $T$ of a wave is $2 \times 10^{-15}$ seconds, calculate the angular frequency $\omega$.

3. Explain the difference between:
   - Wavefront
   - Ray
   - Beam
   Include a sketch showing their relationship (describe in words if needed).

4. Light in vacuum travels at $c = 3 \times 10^8$ m/s with wavelength $\lambda = 600$ nm. Calculate:
   - The wavenumber $k$
   - The frequency $f$
   - The angular frequency $\omega$

## Calculation Problems

1. A light wave has frequency $f = 5 \times 10^{14}$ Hz. What is its period $T$?

2. Show that $k = \frac{2\pi}{\lambda} = \frac{\omega}{c}$ by starting from the relationship between wavelength, frequency, and speed.

3. For a monochromatic plane wave with $E_0 = 100$ V/m, $k = 10^7$ rad/m, $\omega = 3 \times 10^{15}$ rad/s, and $\phi_0 = 0$:
   - Calculate the wavelength $\lambda$
   - Calculate the period $T$
   - Write the complete wave function
   - Calculate the phase at $z = 0.5 \times 10^{-6}$ m and $t = 10^{-15}$ s

4. The speed of light in a material with refractive index $n$ is $v = c/n$. If light enters a material with $n = 1.5$, by what factor does the wavelength change?

## Answers

1. $E(z,t) = E_0\cos(kz - \omega t + \phi_0)$
   - $E_0$ = amplitude (maximum electric field strength)
   - $k$ = wavenumber = $2\pi/\lambda$ (spatial angular frequency, radians per meter)
   - $\omega$ = angular frequency = $2\pi f$ (temporal angular frequency, radians per second)
   - $\phi_0$ = initial phase (constant phase offset at $z=0, t=0$)
   - $z$ = position along propagation direction

2. $\omega = \frac{2\pi}{T} = \frac{2\pi}{2 \times 10^{-15}} = \pi \times 10^{16}$ rad/s $\approx 3.14 \times 10^{16}$ rad/s

3.
   - **Wavefront**: A surface or curve connecting all points with the same phase (constant displacement)
   - **Ray**: A line drawn perpendicular to wavefronts, pointing in the direction of energy propagation
   - **Beam**: A collection of parallel or nearly parallel rays forming a narrow shaft of light
   - A plane wave has planar wavefronts, parallel rays, and can be considered a beam.

4.
   - $k = \frac{2\pi}{\lambda} = \frac{2\pi}{600 \times 10^{-9}} = \frac{2\pi}{6 \times 10^{-7}} \approx 1.05 \times 10^7$ rad/m
   - $f = \frac{c}{\lambda} = \frac{3 \times 10^8}{600 \times 10^{-9}} = 5 \times 10^{14}$ Hz
   - $\omega = 2\pi f = 2\pi \times 5 \times 10^{14} = 3.14 \times 10^{15}$ rad/s

**Calculation Answers:**

1. $T = \frac{1}{f} = \frac{1}{5 \times 10^{14}} = 2 \times 10^{-15}$ s

2. Starting from $c = f\lambda$ and $f = \frac{\omega}{2\pi}$ and $\lambda = \frac{2\pi}{k}$:
   - $c = (\frac{\omega}{2\pi})(\frac{2\pi}{k}) = \frac{\omega}{k}$
   - Therefore: $k = \frac{\omega}{c}$

   Or alternatively:
   - From $c = f\lambda$: substitute $f = \frac{\omega}{2\pi}$ and $\lambda = \frac{2\pi}{k}$
   - $c = \frac{\omega}{2\pi} \cdot \frac{2\pi}{k} = \frac{\omega}{k}$
   - Rearranging: $k = \frac{\omega}{c} = \frac{2\pi}{\lambda}$

3.
   - $\lambda = \frac{2\pi}{k} = \frac{2\pi}{10^7} = 6.28 \times 10^{-7}$ m $= 628$ nm
   - $T = \frac{2\pi}{\omega} = \frac{2\pi}{3 \times 10^{15}} = 2.09 \times 10^{-15}$ s
   - Wave function: $E(z,t) = 100\cos(10^7 z - 3 \times 10^{15} t)$ V/m
   - Phase $\phi = kz - \omega t + \phi_0 = (10^7)(0.5 \times 10^{-6}) - (3 \times 10^{15})(10^{-15}) + 0 = 5 - 3 = 2$ rad

4. Since $v = \frac{c}{n}$ and $v = f\lambda$, we have $\lambda_{material} = \frac{v}{f} = \frac{c}{nf} = \frac{\lambda_{vacuum}}{n}$
   
   Therefore, the wavelength decreases by a factor of $n = 1.5$. The wavelength in the material is $\frac{2}{3}$ of the vacuum wavelength.