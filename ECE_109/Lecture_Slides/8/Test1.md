# Test1: Quantum States of the Hydrogen Atom
> Tests: Learn1 material
> Time: ~15 minutes

## Conceptual Questions

1. What are the allowed values of the three quantum numbers n, ℓ, and mℓ for the hydrogen atom?

2. Why doesn't the electron in a hydrogen atom simply merge with the proton?

3. The wavefunction for the hydrogen atom is written as $\psi_{n,\ell,m_\ell}(r, \theta, \phi) = R_{n,\ell}(r) \cdot Y_{\ell,m_\ell}(\theta, \phi)$. What physical meaning does each component have?

4. How many distinct orbitals (wavefunctions) exist for n = 3? List them by their quantum numbers.

## Calculation Problems

1. **Quantum Number Counting**: For the n = 2 shell:
   - What values can ℓ take?
   - For each ℓ, what values can mℓ take?
   - Calculate the total number of orbitals in the n = 2 shell.

2. **Uncertainty Principle Application**: If an electron's position is known to within Δx = 0.1 nm, what is the minimum uncertainty in its momentum? Express your answer in kg·m/s.

Given: $\hbar = 1.055 \times 10^{-34}$ J·s

3. **Probability Concept**: For the 1s orbital, the radial probability density has a maximum at the Bohr radius $a_0 = 0.0529$ nm. Explain physically why the probability does not increase monotonically as r decreases toward zero.

## Answers

1. **Quantum Number Counting**:
   - ℓ can be: 0, 1 (since ℓ = 0 to n-1)
   - For ℓ = 0: mℓ = 0
   - For ℓ = 1: mℓ = -1, 0, +1
   - Total orbitals: 1 + 3 = **4 orbitals in n = 2**

2. **Uncertainty Principle**:
   $$\Delta p_x \gtrsim \frac{\hbar}{\Delta x} = \frac{1.055 \times 10^{-34} \text{ J·s}}{0.1 \times 10^{-9} \text{ m}} = 1.055 \times 10^{-24} \text{ kg·m/s}$$

3. **Probability Explanation**: 
   The probability density $|R_{1,0}(r)|^2$ actually peaks at r = 0, but the radial probability $P(r) = |R|^2 \cdot 4\pi r^2$ includes the $4\pi r^2$ geometric factor. Near r = 0, this geometric factor is very small because there is very little volume in a thin spherical shell close to the nucleus. As r increases from 0, both $|R|^2$ decreases AND $4\pi r^2$ increases, leading to a maximum at some intermediate distance (the Bohr radius).