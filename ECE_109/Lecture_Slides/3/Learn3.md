# Learn3: Blackbody Radiation and Planck's Law
> Estimated time: ~30 minutes

## Section 1: Blackbody Radiation Fundamentals

### What is a Blackbody?
A blackbody is an ideal object that absorbs all incident electromagnetic radiation and re-emits it based on its temperature. A small hole in a hollow object acts as a nearly perfect blackbody.

### Thermal Radiation Origin
Thermal motion of particles in an object generates radiation at various wavelengths. As temperature increases, the radiation intensity and peak wavelength change.

### Spectral Irradiance
Spectral irradiance $I_\lambda$ is the emitted radiation intensity (power per unit area) per unit wavelength. It represents the intensity of light at each wavelength.

### Classical Theory Failure
Classical physics (Rayleigh-Jeans law) predicted that radiation intensity would increase without bound at short wavelengths—the "ultraviolet catastrophe." This was experimentally wrong.

## Section 2: Planck's Blackbody Radiation Formula

### Planck's Law
$$I_\lambda = \frac{2\pi hc^2}{\lambda^5 \left[ \exp\left(\frac{hc}{\lambda kT}\right) - 1 \right]}$$

Where:
- $I_\lambda$ = spectral irradiance (W/m²/m)
- $h$ = Planck's constant ($6.6 \times 10^{-34}$ J·s)
- $c$ = speed of light ($3 \times 10^8$ m/s)
- $\lambda$ = wavelength (m)
- $k$ = Boltzmann constant ($1.38 \times 10^{-23}$ J/K)
- $T$ = absolute temperature (K)

### Stefan-Boltzmann Law
The total radiative power emitted per unit surface area:
$$P_S = \int_0^\infty I_\lambda \, d\lambda = \frac{2\pi^5 k^4}{15c^2 h^3} T^4 = \sigma T^4$$

Where $\sigma = 5.67 \times 10^{-8}$ W/m²/K⁴ is the Stefan-Boltzmann constant.

### Wien's Displacement Law
The wavelength at which spectral irradiance is maximum:
$$\lambda_{max} \approx \frac{2.89 \times 10^{-3} \text{ m·K}}{T}$$

This shows that as temperature increases, the peak emission wavelength shifts to shorter wavelengths (bluer).

## Key Equations Summary

| Equation | Description |
|----------|-------------|
| $I_\lambda = \frac{2\pi hc^2}{\lambda^5 [exp(hc/\lambda kT) - 1]}$ | Planck's radiation law |
| $P_S = \sigma T^4$ | Stefan-Boltzmann law |
| $\lambda_{max} = \frac{2.89 \times 10^{-3}}{T}$ m·K | Wien's displacement law |