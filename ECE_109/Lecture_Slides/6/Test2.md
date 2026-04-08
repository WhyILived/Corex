# Test2: Knowledge Check
> Tests: Learn2 material (Infinite Potential Well)
> Time: ~15 minutes

## Conceptual Questions

1. Why does the infinite potential well have discrete (quantized) energy levels, while a free electron has continuous energy?

2. The wavefunction for an infinite well is $\psi_n(x) \propto \sin(n\pi x/a)$. Explain why this satisfies the boundary conditions at $x = 0$ and $x = a$.

## Calculation Problems

1. An electron is confined in a 1D infinite potential well of width $a = 2$ nm. Calculate:
   - The ground state energy ($n = 1$) in electron volts (eV)
   - The energy of the first excited state ($n = 2$)
   - The energy difference between these two states
   
   Given: $h = 6.63 \times 10^{-34}$ J·s, $m_e = 9.11 \times 10^{-31}$ kg, $1 \text{ eV} = 1.60 \times 10^{-19}$ J

2. Show that $\int_0^a \sin^2(n\pi x/a) dx = a/2$ for any positive integer $n$.

## Answers

1. 
   - $E_1 = \frac{h^2}{8m_e a^2} = \frac{(6.63 \times 10^{-34})^2}{8(9.11 \times 10^{-31})(2 \times 10^{-9})^2} = 1.51 \times 10^{-20}$ J $= 0.094$ eV
   - $E_2 = \frac{4h^2}{8m_e a^2} = 4E_1 = 0.376$ eV
   - $\Delta E = E_2 - E_1 = 3E_1 = 0.282$ eV

2. Using the identity $\sin^2\theta = (1 - \cos 2\theta)/2$:
   $\int_0^a \sin^2(n\pi x/a) dx = \frac{1}{2}\int_0^a (1 - \cos(2n\pi x/a))dx = \frac{a}{2} - \frac{\sin(2n\pi)}{4n\pi/a} = \frac{a}{2} - 0 = \frac{a}{2}$
