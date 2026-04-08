# Learn2: Infinite Potential Well
> Estimated time: ~30 minutes

## The Infinite Potential Well

An electron confined in a 1D infinite potential well of width $a$ has potential energy:

$$V(x) = \begin{cases} 0 & 0 < x < a \\ \infty & \text{otherwise} \end{cases}$$

## Wavefunction and Energy Levels

The wavefunction for $0 < x < a$ is:

$$\Psi(x,t) = j\sqrt{\frac{2}{a}}\sin\left(\frac{n\pi x}{a}\right)e^{-j\omega t}$$

Where the coefficient $j\sqrt{2/a}$ ensures normalization.

The boundary conditions require that $\Psi = 0$ at $x = 0$ and $x = a$.

## Key Energy Equation

The allowed energy levels are:

$$E_n = \frac{\hbar^2 n^2 \pi^2}{2m_e a^2} = \frac{h^2 n^2}{8m_e a^2}$$

Where:
- $n = 1, 2, 3, ...$ is the principal quantum number
- $m_e$ = electron mass ($9.11 \times 10^{-31}$ kg)
- $a$ = width of the well (m)
- $h$ = Planck's constant ($6.63 \times 10^{-34}$ J·s)

## Energy Differences

The energy difference between consecutive levels:

$$\Delta E_n = E_{n+1} - E_n = \frac{h^2(2n+1)}{8m_e a^2}$$

## Normalization

The wavefunction satisfies the normalization condition:

$$\int_0^a \left|\Psi(x,t)\right|^2 dx = \int_0^a \frac{2}{a}\sin^2\left(\frac{n\pi x}{a}\right)dx = 1$$

Which requires $\int_0^a \sin^2\left(\frac{n\pi x}{a}\right)dx = \frac{a}{2}$

## Wavefunction Properties

- The wavefunction $\Psi(x,t) \propto \sin(n\pi x/a)$ satisfies boundary conditions $\Psi(0) = \Psi(a) = 0$
- The number of half-wavelengths fitting in the well equals $n$
- As $n$ increases, the energy increases proportionally to $n^2$
