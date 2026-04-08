# Test2: Quantum Mechanics Formalism
> Tests: Learn2 material
> Time: ~15 minutes

## Conceptual Questions

1. According to the Born interpretation, what does $|\Psi|^2$ represent?

2. What is the mathematical form of the time-dependent Schrödinger equation?

3. Explain the difference between a wavefunction $\Psi$ and its squared magnitude $|\Psi|^2$.

4. What are stationary states and how do they time-evolve?

5. For a free electron (V = 0), what form do the wavefunction solutions take?

## Calculation Problems

1. Given the momentum operator $\hat{p} = -i\hbar \nabla$, calculate the expectation value of momentum for a particle in state $\psi(x) = Ae^{ikx}$.

2. Starting from the time-dependent Schrödinger equation $i\hbar\frac{\partial}{\partial t}|\psi\rangle = \hat{H}|\psi\rangle$, show that $|\psi(t)\rangle = e^{-i\hat{H}t/\hbar}|\psi(0)\rangle$.

3. For a free electron with kinetic energy $E = 100$ eV, calculate the wavenumber $k$ (Given: $m_e = 9.11 \times 10^{-31}$ kg, $\hbar = 1.055 \times 10^{-34}$ J·s, $1 \text{ eV} = 1.602 \times 10^{-19}$ J)

## Answers

1. $|\Psi|^2$ represents the probability density function - the probability per unit volume of finding the particle at a given point in space and time. Specifically, $|\Psi(x,y,z,t)|^2 dx dy dz$ gives the probability of finding the particle in volume $dxdydz$ at $(x,y,z)$ and time $t$.

2. The time-dependent Schrödinger equation is: $i\hbar\frac{\partial}{\partial t}|\psi\rangle = \hat{H}|\psi\rangle$ where $\hat{H}$ is the Hamiltonian operator.

3. $\Psi$ is a complex-valued wavefunction that contains phase information and itself has no direct physical meaning. Only $|\Psi|^2 = \Psi^*\Psi$ (the squared magnitude) is physically observable - it represents the probability density. This allows wavefunctions to have imaginary components and interference effects.

4. Stationary states are eigenstates of the Hamiltonian: $\hat{H}|\psi_n\rangle = E_n|\psi_n\rangle$. They time-evolve with a simple phase factor: $|\psi_n(t)\rangle = e^{-iE_n t/\hbar}|\psi_n\rangle$. The probability density $|\psi_n|^2$ is time-independent.

5. For a free electron (V = 0), the solutions are traveling waves: $\psi_1(x) = Ae^{+ikx}$ and $\psi_2(x) = Ae^{-ikx}$, representing motion in the +x and -x directions respectively.

**Calculation Answers**:

1. $\langle \hat{p} \rangle = \int \psi^*(-i\hbar d/dx)\psi dx = \int A^*e^{-ikx}(-i\hbar)(ik)Ae^{ikx} dx = \int |A|^2 \hbar k dx = \hbar k$ (normalized)

2. Dividing by $i\hbar$: $\frac{d}{dt}|\psi\rangle = -\frac{i}{\hbar}\hat{H}|\psi\rangle$. Integrating: $\int_{|\psi(0)\rangle}^{|\psi(t)\rangle} \frac{d|\psi\rangle}{|\psi\rangle} = -i\int_0^t \frac{\hat{H}}{\hbar}dt'$. This gives $\ln(|\psi(t)\rangle/|\psi(0)\rangle) = -i\hat{H}t/\hbar$, so $|\psi(t)\rangle = e^{-i\hat{H}t/\hbar}|\psi(0)\rangle$.

3. $E = 100$ eV $= 1.602 \times 10^{-17}$ J. Then $k = \sqrt{2mE}/\hbar = \sqrt{2(9.11 \times 10^{-31})(1.602 \times 10^{-17})}/(1.055 \times 10^{-34}) = 5.12 \times 10^{10}$ m$^{-1}$