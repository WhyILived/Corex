# Test1: Blackbody Radiation
> Tests: Learn1 material
> Time: ~15 minutes

## Conceptual Questions

1. What is a blackbody and why does a cavity with a small aperture behave like one?

2. Why did classical physics (Rayleigh-Jeans law) fail to describe blackbody radiation at short wavelengths?

3. What assumption did Max Planck make to correctly derive the blackbody radiation formula?

4. State Wien's displacement law. If a star's peak emission is at 500 nm, what is its surface temperature?

5. Stefan's law states that radiated power is proportional to $T^4$. If the temperature of an object doubles, by what factor does the radiated power increase?

## Calculation Problems

1. A blackbody radiates at 3000 K with $\lambda_{max} \approx 966$ nm. Verify this satisfies Wien's displacement law.

2. Using Planck's law, calculate the spectral irradiance at $\lambda = 500$ nm and $T = 3000$ K. (Constants: $h = 6.63 \times 10^{-34}$ J·s, $c = 3 \times 10^8$ m/s, $k = 1.38 \times 10^{-23}$ J/K)

3. A 100 W incandescent bulb filament has emissivity $\varepsilon = 0.35$ and operates at 2570 K. Calculate the surface area of the filament using Stefan-Boltzmann law ($P = S\varepsilon\sigma_S T^4$).

## Answers

1. A blackbody is an idealized perfect emitter and absorber. A cavity with a small hole appears black because any radiation entering through the aperture is trapped inside and absorbed by the walls before it can escape.

2. Classical physics predicted $I_\lambda \propto T$ and $I_\lambda \propto 1/\lambda^4$, which gives infinite intensity at short wavelengths (ultraviolet catastrophe). The experimental curve peaks and then falls to zero.

3. Planck assumed that oscillators in the cavity walls emit and absorb energy in discrete quanta of $E = hf$, not continuously.

4. $\lambda_{max}T = 2.89 \times 10^{-3}$ m·K, so $T = (2.89 \times 10^{-3})/(500 \times 10^{-9}) = 5780$ K

5. Since $P \propto T^4$, if $T$ doubles: $P_2/P_1 = (2T)^4/T^4 = 16$. The power increases by a factor of 16.

**Calculation Answers**:
1. $\lambda_{max}T = (966 \times 10^{-9})(3000) = 2.898 \times 10^{-3}$ m·K ≈ $2.89 \times 10^{-3}$ m·K ✓

2. $hc/(\lambda kT) = (6.63 \times 10^{-34} \times 3 \times 10^8)/(500 \times 10^{-9} \times 1.38 \times 10^{-23} \times 3000) \approx 9.6$, then $I_\lambda \approx 8.06 \times 10^{11}$ W·m⁻²·m⁻¹

3. $S = P/(\varepsilon\sigma_S T^4) = 100/(0.35 \times 5.67 \times 10^{-8} \times 2570^4) \approx 1.16 \times 10^{-4}$ m²