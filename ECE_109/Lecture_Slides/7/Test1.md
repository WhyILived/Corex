# Test1: Finite Potential Well and Quantum Tunneling
> Tests: Learn1 material
> Time: ~15 minutes

## Conceptual Questions

1. In a finite potential well, why does the wavefunction not go to zero exactly at the boundaries?

2. What is the physical meaning of the "penetration depth"? How does it relate to the decay constant α?

3. Why does a finite potential well have fewer energy levels than an infinite well of the same width?

4. In quantum tunneling, why does the transmission coefficient decrease exponentially with barrier width?

## Calculation Problems

1. **Finite Well Energy Levels**
   A finite potential well has width a = 2 nm and depth Vo = 0.50 eV.
   - If the infinite well energy for this width is E₁(∞) = 0.094 eV, explain why E₁(V₀) < 0.094 eV.
   - The actual ground state energy is E₁ = 0.057 eV. Calculate the ratio E₁(V₀)/E₁(∞).

2. **Penetration Depth**
   For an electron with energy E = 0.38 eV in a well with Vo = 0.50 eV, calculate the decay constant α using:
   $$\alpha = \sqrt{\frac{2m_e(V_o - E)}{\hbar^2}}$$
   Then find the penetration depth x₀ = 1/α.
   Given: $m_e = 9.11 \times 10^{-31}$ kg, $\hbar = 1.055 \times 10^{-34}$ J·s

3. **Tunneling Probability**
   A barrier has α = 5 × 10⁹ m⁻¹ and width a = 1 nm.
   - Calculate the transmission coefficient T if T₀ = 0.5.
   - If the barrier width doubles to 2 nm, by what factor does T change?

## Answers

1. Because boundary conditions require continuity of ψ AND dψ/dx, the wavefunction can extend exponentially into the barrier region.

2. Penetration depth x₀ = 1/α is the distance over which the wavefunction amplitude decreases by a factor of 1/e. Larger α means shorter penetration depth.

3. The finite well allows wavefunction penetration into barriers, which reduces the effective confinement and lowers energy levels compared to infinite well where ψ = 0 at boundaries.

4. T = (0.5) × exp(-2 × 5×10⁹ × 10⁻⁹) = 0.5 × exp(-10) ≈ 0.5 × 4.5×10⁻⁵ ≈ 2.3×10⁻⁵
   When width doubles: new T ∝ exp(-2×2) = exp(-4) = e² ≈ 7.4 times smaller than original.
