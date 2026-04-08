# Test3: Knowledge Check
> Tests: Learn3 material (Finite Potential Well)
> Time: ~15 minutes

## Conceptual Questions

1. What is the "penetration depth" in the context of a finite potential well? Why does penetration occur?

2. In the finite potential well, why are the energy levels lower than those in an infinite well of the same width?

3. Explain the physical meaning of the parameter $\alpha$ in the wavefunction decay outside the well.

## Calculation Problems

1. For an electron in a finite well with $V_0 = 0.5$ eV and well width $a = 2$ nm, if the ground state energy is $E_1 = 0.057$ eV:
   - Calculate $\alpha$ for the ground state
   - Calculate the penetration depth $x_0 = 1/\alpha$
   
   Given: $m_e = 9.11 \times 10^{-31}$ kg, $\hbar = 1.055 \times 10^{-34}$ J·s

2. Explain why the boundary conditions at $x = a/2$ lead to a transcendental equation that must be solved graphically, rather than giving an exact analytical solution for the energy levels.

## Answers

1. 
   - $\alpha = \sqrt{\frac{2m_e(V_0 - E)}{\hbar^2}} = \sqrt{\frac{2(9.11 \times 10^{-31})(0.5 - 0.057)(1.60 \times 10^{-19})}{(1.055 \times 10^{-34})^2}}$
   
   First convert to joules: $V_0 - E = (0.5 - 0.057) \times 1.60 \times 10^{-19} = 7.09 \times 10^{-20}$ J
   
   $\alpha = \sqrt{\frac{2(9.11 \times 10^{-31})(7.09 \times 10^{-20})}{(1.11 \times 10^{-68})}} = \sqrt{1.16 \times 10^{19}} = 3.4 \times 10^9$ m$^{-1}$
   
   - $x_0 = \frac{1}{\alpha} = 2.9 \times 10^{-10}$ m $= 0.29$ nm

2. The boundary conditions lead to equations involving both $\tan$ or $\cot$ functions and the energy-dependent parameters $k$ and $\alpha$. These cannot be algebraically rearranged to isolate $E$; instead, one must plot $\alpha(E)$ against $k\tan(ka/2)$ or $-k\cot(ka/2)$ and find intersection points. This is why graphical or numerical methods are required.
