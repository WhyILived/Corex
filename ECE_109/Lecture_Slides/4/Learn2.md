# Learn2: Quantum Mechanics Formalism
> Estimated time: ~30 minutes

## Section 1: Wavefunction and Probability
Particles are described by a normed, complex "wavefunction" $\Psi(x, y, z, t)$.

The Born interpretation states that $|\Psi|^2$ represents the probability density of finding the particle. Specifically:
- $|\Psi(x,y,z,t)|^2 dx dy dz$ is the probability of finding the particle at time $t$ in the volume element $dxdydz$ at position $(x,y,z)$
- $\Psi$ and $\nabla\Psi$ must be continuous over $x, y, z$ and $t$
- Only $|\Psi|^2$ has physical meaning, not $\Psi$ itself

## Section 2: Quantum Mechanics Postulates
The five fundamental postulates of quantum mechanics:

1. **Particles as wavefunctions**: Particles are described by normed, complex wavefunctions $\Psi(\vec{r}, t)$

2. **Schrödinger equation**: The Schrödinger equation (SE) describes particle dynamics:
$$i\hbar\frac{\partial}{\partial t}|\psi\rangle = \hat{H}|\psi\rangle$$

3. **Continuity**: $\Psi$ and $\nabla\Psi$ must be continuous over all space and time

4. **Probability interpretation**: $|\Psi|^2$ gives the probability distribution, not $\Psi$ itself

5. **Operators and expectation values**: Experimentally observable quantities ("observables") are calculated by applying an associated mathematical operator to $\Psi$ and calculating the expectation value

## Section 3: Expectation Values
For a continuous variable $x$ with probability density $f(x)$:
$$E[X] = \int_a^b xf(x)dx$$

In quantum mechanics, the expectation value of an observable $\hat{A}$ is:
$$\langle \hat{A} \rangle = \langle \psi|\hat{A}|\psi\rangle = \int_{-\infty}^{+\infty} \psi^*(\vec{r}, t) \hat{A} \psi(\vec{r}, t) dV$$

Where $|\psi\rangle$ (called a "ket") represents the quantum state vector.

Example: The momentum operator is $\hat{p} = -i\hbar\nabla$, so:
$$\langle \hat{p} \rangle = \int \psi^*(-i\hbar\nabla)\psi dV$$

## Section 4: Time-Dependent Schrödinger Equation
The time-dependent Schrödinger equation:
$$i\hbar\frac{\partial}{\partial t}|\psi\rangle = \hat{H}|\psi\rangle$$

Where $\hat{H}$ is the Hamiltonian operator (total energy of the particle).

**Time evolution operator**: Solving gives $\hat{U}(t) = e^{-i\hat{H}t/\hbar}$, so:
$$|\psi(t)\rangle = e^{-i\hat{H}t/\hbar}|\psi(0)\rangle = \hat{U}(t)|\psi(0)\rangle$$

## Section 5: Stationary States
Stationary states satisfy the eigenvalue equation:
$$\hat{H}|\psi_n\rangle = E_n|\psi_n\rangle$$

Where $E_n$ is the energy eigenvalue. Stationary states time-evolve as:
$$|\psi_n(t)\rangle = e^{-iE_n t/\hbar}|\psi_n\rangle$$

## Section 6: Time-Independent Schrödinger Equation
For time-independent potentials, we can separate variables: $\Psi(\vec{r}, t) = \psi(\vec{r})e^{-iEt/\hbar}$

The time-independent Schrödinger equation:
$$\left[-\frac{\hbar^2}{2m}\nabla^2 + V(\vec{r})\right]|\psi_n\rangle = E_n|\psi_n\rangle$$

In one dimension:
$$\frac{d^2\psi}{dx^2} + \frac{2m}{\hbar^2}(E - V)\psi = 0$$

The Hamiltonian $\hat{H} = \frac{\hat{p}^2}{2m} + V = -\frac{\hbar^2}{2m}\nabla^2 + V$ represents:
- Kinetic energy: $\frac{p^2}{2m} \rightarrow \frac{1}{2m}(-i\hbar\nabla)^2$
- Potential energy: $V(\vec{r})$

## Section 7: Free Electron (V = 0)
For a free electron with $V = 0$:
$$\frac{d^2\psi}{dx^2} = -\frac{2mE}{\hbar^2}\psi(x)$$

This has solutions $\psi_1(x) = Ae^{ikx}$ and $\psi_2(x) = Ae^{-ikx}$ (traveling waves), where:
$$k^2 = \frac{2mE}{\hbar^2}$$

This leads naturally to the de Broglie relationship $p = \hbar k = h/\lambda$