# Learn1: Blackbody Radiation
> Estimated time: ~30 minutes

## Section 1: Electromagnetic Radiation
Electromagnetic (EM) radiation is created by oscillating charges or oscillating electric dipoles. The oscillations can be driven by thermal motion, electric current, or other radiation.

Light is EM waves with a particular range of wavelengths. Photons are indivisible units of light (particles of light). Faster oscillation means shorter wavelength.

## Section 2: Blackbody Radiation
A blackbody is an idealized object that absorbs all radiation incident upon it and emits radiation based on its temperature alone. A cavity with a small hole acts as a blackbody - radiation entering the small aperture is trapped and absorbed.

**Spectral irradiance** $I_\lambda$ is the emitted radiation intensity (power per unit area) per unit wavelength. It represents the intensity in a small range of wavelengths $\delta\lambda$.

## Section 3: Planck's Radiation Law
Classical physics predicted that $I_\lambda \propto 1/\lambda^4$ and $I_\lambda \propto T$ (Rayleigh-Jeans law), which failed at short wavelengths (the "ultraviolet catastrophe").

Max Planck (1900) showed that experimental results could be explained by assuming that radiation involves emission and absorption of discrete energy quanta $hf$, where $f$ is frequency and $h$ is Planck's constant.

Planck's blackbody radiation formula:

$$I_\lambda = \frac{2\pi hc^2}{\lambda^5}\left[\exp\left(\frac{hc}{\lambda kT}\right) - 1\right]^{-1}$$

Where:
- $I_\lambda$ = spectral irradiance (W·m⁻²·m⁻¹)
- $h$ = Planck's constant ($6.63 \times 10^{-34}$ J·s)
- $c$ = speed of light ($3 \times 10^8$ m/s)
- $k$ = Boltzmann constant ($1.38 \times 10^{-23}$ J·K⁻¹)
- $T$ = absolute temperature (K)
- $\lambda$ = wavelength (m)

## Section 4: Wien's Displacement Law
The peak spectral intensity occurs at wavelength $\lambda_{max}$, which depends on temperature:

$$\lambda_{max}T \approx 2.89 \times 10^{-3} \text{ m·K}$$

As temperature increases, the peak emission shifts to lower wavelengths.

## Section 5: Stefan's Law
The total radiative power emitted by a black body per unit surface area at temperature $T$:

$$P_S = \int_0^\infty I_\lambda d\lambda = \frac{2\pi^5k^4}{15c^2h^3}T^4 = \sigma_S T^4$$

Where $\sigma_S = 5.670 \times 10^{-8}$ W·m⁻²·K⁻⁴ is Stefan's constant.

## Section 6: Applications
- Non-contact thermometers (infrared thermometers/pyrometers)
- Thermal cameras
- Incandescent light bulbs (tungsten filament at ~2570 K)

Key insight: The study of blackbody radiation led to the quantum revolution - energy is quantized in multiples of $hf$.