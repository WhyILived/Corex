# Test1: Knowledge Check
> Tests: Learn1 material (Schrödinger Equation and Stationary States)
> Time: ~15 minutes

## Conceptual Questions

1. State the time-dependent Schrödinger equation and explain what each term represents.

2. Why are the eigenstates of the Hamiltonian called "stationary" states? What property makes them special in terms of time evolution?

3. Given a general quantum state $|\psi(t=0)\rangle$, explain how you would express it as a superposition of stationary states. What determines the coefficients $c_n$?

## Calculation Problems

1. If the energy of a stationary state is $E_n = 4.2 \times 10^{-19}$ J, calculate the angular frequency $\omega = E_n/\hbar$ of the time-dependent phase factor. (Given: $\hbar = 1.055 \times 10^{-34}$ J·s)

2. Show that the probability density $|\psi_n(t)|^2$ for a stationary state is independent of time.

## Answers

1. $\omega = \frac{E_n}{\hbar} = \frac{4.2 \times 10^{-19}}{1.055 \times 10^{-34}} = 3.98 \times 10^{15}$ rad/s

2. Since $|\psi_n(t)\rangle = e^{-iE_n t/\hbar}|\psi_n(0)\rangle$, we have $|\psi_n(t)|^2 = |e^{-iE_n t/\hbar}|^2 |\psi_n(0)\rangle|^2 = 1 \cdot |\psi_n(0)\rangle|^2$. The phase factor has magnitude 1, so the probability density equals the initial probability density and is therefore constant in time.
