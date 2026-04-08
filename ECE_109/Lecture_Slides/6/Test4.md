# Test4: Knowledge Check
> Tests: Learn4 material (Tunneling Phenomenon)
> Time: ~15 minutes

## Conceptual Questions

1. In classical physics, a particle with energy less than the barrier height cannot pass through the barrier. Explain how quantum mechanics allows tunneling to occur.

2. The tunneling current in an STM depends exponentially on the tip-sample distance. Why is this the case?

3. What is the relationship between the reflection coefficient $R$ and transmission coefficient $T$? Why must this relationship hold?

## Calculation Problems

1. Estimate the transmission coefficient for an electron with $E = 0.1$ eV tunneling through a barrier with $V_0 = 0.5$ eV and width $a = 1$ nm.

Given: $m_e = 9.11 \times 10^{-31}$ kg, $\hbar = 1.055 \times 10^{-34}$ J·s

Calculate $\alpha$ and $\alpha a$, then evaluate:
$$T = \frac{1}{1 + D\sinh^2(\alpha a)}$$

where $D = \frac{V_0^2}{4E(V_0 - E)}$

2. If the barrier width in an STM doubles, what happens to the tunneling probability (assuming other parameters remain constant)? Explain using the form of the transmission coefficient.

## Answers

1. First, convert energies to joules:
   $E = 0.1 \times 1.60 \times 10^{-19} = 1.6 \times 10^{-20}$ J
   $V_0 = 0.5 \times 1.60 \times 10^{-19} = 8.0 \times 10^{-20}$ J
   $V_0 - E = 6.4 \times 10^{-20}$ J

   $\alpha = \sqrt{\frac{2m_e(V_0 - E)}{\hbar^2}} = \sqrt{\frac{2(9.11 \times 10^{-31})(6.4 \times 10^{-20})}{(1.055 \times 10^{-34})^2}} = \sqrt{1.04 \times 10^{20}} = 1.02 \times 10^{10}$ m$^{-1}$

   $\alpha a = (1.02 \times 10^{10})(1 \times 10^{-9}) = 10.2$

   $D = \frac{(8.0 \times 10^{-20})^2}{4(1.6 \times 10^{-20})(6.4 \times 10^{-20})} = \frac{6.4 \times 10^{-39}}{4.1 \times 10^{-39}} = 1.56$

   $\sinh(10.2) \approx 2.7 \times 10^4$

   $T = \frac{1}{1 + 1.56 \times (2.7 \times 10^4)^2} \approx \frac{1}{1.1 \times 10^9} \approx 9 \times 10^{-10}$

   This is a very small probability, but non-zero.

2. Since $\alpha a$ appears in $\sinh(\alpha a)$, doubling $a$ increases $\alpha a$ by a factor of 2. For large $\alpha a$, $\sinh(\alpha a) \approx \frac{1}{2}e^{\alpha a}$, so $T \approx \frac{1}{D\sinh^2(\alpha a)} \propto e^{-2\alpha a}$. Doubling $a$ makes the exponent twice as negative, so the tunneling probability decreases by a factor of $e^{-2\alpha a}$ (approximately exponential decrease).
