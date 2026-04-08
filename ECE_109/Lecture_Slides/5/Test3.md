# Test3: Electron in a Finite Potential Well
> Tests: Learn3 material
> Time: ~15 minutes

## Conceptual Questions

1. What is the key difference between the wavefunction in a finite potential well versus an infinite potential well outside the well region?

2. What is the physical meaning of the "penetration depth"?

3. Why are the energy levels in a finite well **lower** than the corresponding energy levels in an infinite well of the same width?

4. Why must the energy levels in a finite well be solved graphically (or numerically) rather than from an exact formula?

5. How does the number of bound states in a finite well depend on the barrier height $V_0$ and width $a$?

## Calculation Problems

1. **Penetration depth calculation**
   
   For a finite well with $V_0 = 0.5$ eV and an electron with energy $E = 0.1$ eV:
   - Calculate the decay constant $\alpha$
   - Calculate the penetration depth $\delta$

2. **Energy comparison**
   
   Consider a 2 nm infinite well and a 2 nm finite well with $V_0 = 0.5$ eV.
   - What is $E_1$ for the infinite well?
   - Given that $E_1 = 0.057$ eV for the finite well, explain why it is lower.

3. **Graphical solution reasoning**
   
   The transcendental equations $\alpha = k\tan(ka/2)$ and $\alpha = -k\cot(ka/2)$ must be solved graphically.
   - Sketch roughly how you would plot these equations
   - Why can there be multiple solutions?

## Answers

1. **Wavefunction difference:** In an infinite well, $\psi = 0$ for $x \leq 0$ and $x \geq a$ (the wavefunction abruptly becomes zero). In a finite well, the wavefunction decays exponentially into the barrier region but is **non-zero** outside the well.

2. **Penetration depth** $\delta = 1/\alpha$ is the characteristic distance over which the wavefunction decays to $1/e$ of its value at the boundary. It represents how far the electron can "tunnel" into the classically forbidden region.

3. The finite well has a **larger uncertainty in position** $\Delta x$ because the wavefunction extends into the barrier. From the Heisenberg uncertainty principle $\Delta x \Delta p \geq \hbar/2$, a larger $\Delta x$ means a smaller $\Delta p$. Smaller momentum uncertainty means smaller kinetic energy. Therefore, for the same quantum number $n$, the finite well energy is lower.

4. The equations $\alpha = k\tan(ka/2)$ and $\alpha = -k\cot(ka/2)$ are **transcendental equations** that cannot be solved algebraically for $E$ (or $k$). They arise from the boundary conditions and involve trigonometric and square root functions mixed together.

5. The number of bound states increases when:
   - The well width $a$ increases (more room for wavefunctions)
   - The barrier height $V_0$ decreases (less confinement)
   
   For a given $a$ and $V_0$, there are only a finite number of bound states because each additional state requires more energy, eventually exceeding $V_0$.

## Calculation Problem Answers

1. **Penetration depth:**
   
   First convert to SI units:
   $E = 0.1$ eV $\times 1.602 \times 10^{-19}$ J/eV $= 1.602 \times 10^{-20}$ J
   $V_0 - E = (0.5 - 0.1)$ eV $\times 1.602 \times 10^{-19}$ J/eV $= 6.408 \times 10^{-20}$ J
   
   $\alpha = \frac{\sqrt{2m_e(V_0 - E)}}{\hbar} = \frac{\sqrt{2(9.11 \times 10^{-31})(6.408 \times 10^{-20})}}{1.055 \times 10^{-34}}$
   
   $= \frac{\sqrt{1.167 \times 10^{-49}}}{1.055 \times 10^{-34}} = \frac{3.416 \times 10^{-25}}{1.055 \times 10^{-34}} = 3.24 \times 10^9$ m$^{-1}$
   
   $\delta = \frac{1}{\alpha} = \frac{1}{3.24 \times 10^9} = 3.09 \times 10^{-10}$ m $= 0.309$ nm

2. **Energy comparison:**
   
   For infinite well: $E_1 = \frac{h^2}{8m_e a^2} = \frac{(6.63 \times 10^{-34})^2}{8(9.11 \times 10^{-31})(2 \times 10^{-9})^2}$
   
   $= \frac{4.40 \times 10^{-67}}{2.92 \times 10^{-47}} = 1.51 \times 10^{-20}$ J $= 0.094$ eV
   
   For finite well: $E_1 = 0.057$ eV (given).
   
   The finite well energy is lower because the wavefunction penetrates into the barrier, increasing $\Delta x$, which decreases $\Delta p$ and thus the kinetic energy contribution to the total energy.

3. **Graphical solution:**
   
   To solve graphically, plot two curves vs. energy $E$:
   - Left side: $\alpha(E) = \sqrt{2m_e(V_0 - E)}/\hbar$ (decreases with $E$, starts at $\alpha_0 = \sqrt{2m_e V_0}/\hbar$ when $E=0$, goes to 0 when $E = V_0$)
   - Right side: $k\tan(ka/2)$ and $-k\cot(ka/2)$ where $k = \sqrt{2m_e E}/\hbar$
   
   The intersections give the allowed energies. There can be multiple intersections because:
   - $\tan(ka/2)$ oscillates between $-\infty$ and $+\infty$
   - Each oscillation (each "branch") can intersect the $\alpha$ curve once
   - The number of intersections depends on $V_0$, $a$, and $m_e$