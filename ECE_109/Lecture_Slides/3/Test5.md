# Test5: Schrödinger Equation and Quantum Mechanics
> Tests: Learn5 material
> Time: ~15 minutes

## Conceptual Questions

1. Explain why the wavefunction $\Psi$ is complex-valued in quantum mechanics, while the electric field $\vec{E}$ in classical physics is real-valued.

2. What is the physical interpretation of $|\Psi(x,y,z,t)|^2$? Why can't we observe $\Psi$ directly?

3. The time-dependent Schrödinger equation is often called the "equation of motion" for quantum systems. What does this mean?

4. For a stationary state, the probability density $|\Psi|^2$ is time-independent. Why does this make physical sense?

5. In the free electron example, the solution $\psi(x) = Ae^{jkx}$ represents a traveling wave. What physical quantity is "waving"?

## Calculation Problems

1. **Wavefunction Normalization**
   
   A wavefunction is given by $\psi(x) = A e^{ikx}$ for $-\infty < x < \infty$. Find the normalization constant $A$ such that $\int_{-\infty}^{\infty} |\psi|^2 dx = 1$.
   
   Expected answer: Plane waves are non-normalizable over infinite space—the integral diverges. In practice, use wave packets or periodic boundary conditions.

2. **Time Evolution Phase**
   
   A particle is in a stationary state with energy $E_n = 2.5$ eV. Calculate the phase factor $e^{-jE_n t/\hbar}$ at $t = 1$ ns.
   
   Given: $\hbar = 1.05 \times 10^{-34}$ J·s, $1$ eV $= 1.6 \times 10^{-19}$ J
   
   Expected answer: Phase $\approx 3.81 \times 10^{15} t$ rad (numerical at $t=10^{-9}$s is $\approx 3.81 \times 10^{6}$ rad)

3. **Free Electron Wavefunction**
   
   An electron has kinetic energy $E = 100$ eV. Calculate the wavenumber $k$ in the free electron solution.
   
   Given: $m_e = 9.11 \times 10^{-31}$ kg, $\hbar = 1.05 \times 10^{-34}$ J·s
   
   Expected answer: $k \approx 5.1 \times 10^{10}$ m$^{-1}$

4. **Time-Independent Schrödinger Equation**
   
   Show that $\psi(x) = e^{ikx}$ is a solution to the 1D time-independent Schrödinger equation for a free particle ($V = 0$), and find the relationship between $k$ and $E$.

## Answers

1. **Normalization**:
   
   $|\psi|^2 = |A|^2 e^{-ikx} e^{ikx} = |A|^2$
   
   $\int_{-\infty}^{\infty} |\psi|^2 dx = |A|^2 \int_{-\infty}^{\infty} dx = |A|^2 \cdot \infty$
   
   This diverges, so plane waves cannot be normalized over infinite space. In practice, we use wave packets or periodic boundary conditions.

2. **Phase factor**:
   
   $\frac{E_n}{\hbar} = \frac{(2.5 \text{ eV})(1.6 \times 10^{-19} \text{ J/eV})}{1.05 \times 10^{-34} \text{ J·s}} = 3.81 \times 10^{15}$ rad/s
   
   Phase $= \frac{E_n t}{\hbar} = (3.81 \times 10^{15})(10^{-9}) = 3.81 \times 10^{6}$ rad
   
   Or approximately $3.81 \times 10^{6} \approx 607,000$ revolutions.

3. **Wavenumber**:
   
   $E = \frac{\hbar^2 k^2}{2m}$
   
   $k = \sqrt{\frac{2mE}{\hbar^2}} = \frac{\sqrt{2mE}}{\hbar}$
   
   $E = 100$ eV $= 1.6 \times 10^{-17}$ J
   
   $k = \frac{\sqrt{2(9.11 \times 10^{-31})(1.6 \times 10^{-17})}}{1.05 \times 10^{-34}} = \frac{\sqrt{2.92 \times 10^{-47}}}{1.05 \times 10^{-34}} = \frac{5.40 \times 10^{-24}}{1.05 \times 10^{-34}}$
   
   $k \approx 5.14 \times 10^{10}$ m$^{-1}$

4. **Verification**:
   
   For $V = 0$: $\frac{d^2\psi}{dx^2} + \frac{2m}{\hbar^2}E\psi = 0$
   
   $\psi = e^{jkx}$
   
   $\frac{d\psi}{dx} = jke^{jkx} = jk\psi$
   
   $\frac{d^2\psi}{dx^2} = (jk)^2 e^{jkx} = -k^2 \psi$
   
   Substituting: $-k^2 \psi + \frac{2m}{\hbar^2}E\psi = 0$
   
   This requires: $k^2 = \frac{2mE}{\hbar^2}$, or $E = \frac{\hbar^2 k^2}{2m}$