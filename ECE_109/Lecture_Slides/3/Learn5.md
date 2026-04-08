# Learn5: Schrödinger Equation and Quantum Mechanics
> Estimated time: ~30 minutes

## Section 1: Quantum Mechanics Formalism

### The Wavefunction
In quantum mechanics, particles are described by a complex wavefunction $\Psi(\vec{r}, t)$. This is a fundamental postulate of quantum mechanics.

### Properties of the Wavefunction

1. **Normed**: The total probability must equal 1
   $$\int |\Psi|^2 \, dV = 1$$

2. **Complex**: $\Psi$ is a complex-valued function (unlike classical fields which are real)

3. **Continuous**: $\Psi$ and $\nabla\Psi$ must be continuous over $x, y, z,$ and $t$

4. **Probability interpretation**: $|\Psi(x,y,z,t)|^2 \, dx \, dy \, dz$ is the probability of finding the particle at time $t$ in the volume element $dx \, dy \, dz$ located at $(x,y,z)$

### What the Wavefunction Is NOT
- $\Psi$ itself is not directly observable
- Only $|\Psi|^2$ (the probability density) has physical meaning

## Section 2: Probability Density

### Definition
For a continuous random variable $X$ with probability density function $f(x)$:
- $f(x) \geq 0$ everywhere in the support
- $\int_{-\infty}^{\infty} f(x) \, dx = 1$
- $P(a < X < b) = \int_a^b f(x) \, dx$

### Expected Value (Average)
The expected value of $X$:
$$E[X] = \int_{-\infty}^{\infty} x \, f(x) \, dx$$

For a discrete distribution: $E[X] = \sum_i x_i p_i$

## Section 3: Classical Mechanics Review

### Hamiltonian
For an object with mass $m$, momentum $p$, position $x$, and potential energy $V(x)$:

The total energy (Hamiltonian):
$$H = \frac{p^2}{2m} + V(x)$$

### Newton's Second Law
$$F = \frac{dp}{dt} = -\frac{dV}{dx}$$

### Quantum Mechanical Operators
- Momentum: $p \rightarrow -j\hbar\nabla$ (note: in engineering convention)
- Kinetic energy: $\frac{p^2}{2m} \rightarrow -\frac{\hbar^2}{2m}\nabla^2$
- Hamiltonian: $\hat{H} = -\frac{\hbar^2}{2m}\nabla^2 + V(\vec{r})$

## Section 4: Time-Dependent Schrödinger Equation

### The Fundamental Equation
$$j\hbar\frac{d}{dt}|\psi\rangle = \hat{H}|\psi\rangle$$

This is the equation of motion for the wavefunction—how quantum states evolve in time.

### Time Evolution Operator
The formal solution:
$$|\psi(t)\rangle = e^{-j\hat{H}t/\hbar}|\psi(0)\rangle = \hat{U}(t)|\psi(0)\rangle$$

Where $\hat{U}(t) = e^{-j\hat{H}t/\hbar}$ is the time evolution operator.

### Infinitesimal Evolution
$$|\psi(t + dt)\rangle = \left(1 - \frac{j\,dt}{\hbar}\hat{H}\right)|\psi(t)\rangle$$

## Section 5: Stationary States

### Eigenvalue Equation
The stationary states satisfy:
$$\hat{H}|\psi_n\rangle = E_n|\psi_n\rangle$$

Where:
- $|\psi_n\rangle$ = eigenfunction of the Hamiltonian
- $E_n$ = energy eigenvalue (a number)

### Time Evolution of Stationary States
For stationary states, the time evolution is simple:
$$|\psi_n(t)\rangle = e^{-jE_n t/\hbar}|\psi_n\rangle$$

This is a phase factor only—the probability distribution $|\psi_n|^2$ is time-independent.

## Section 6: Time-Independent Schrödinger Equation

### Derivation
Starting from the time-dependent equation and assuming separable solutions $\Psi(\vec{r}, t) = \psi(\vec{r})f(t)$:

$$[-\frac{\hbar^2}{2m}\nabla^2 + V(\vec{r})]\psi_n(\vec{r}) = E_n\psi_n(\vec{r})$$

Or in operator form:
$$\hat{H}\psi_n = E_n\psi_n$$

### In One Dimension
$$\frac{d^2\psi}{dx^2} + \frac{2m}{\hbar^2}(E - V)\psi = 0$$

### Full Time-Dependent Wavefunction
For stationary states:
$$\Psi(x, t) = \psi(x) \exp\left(-\frac{jEt}{\hbar}\right)$$

## Section 7: Example - Free Electron

### Problem
Solve the Schrödinger equation for a free electron with energy $E$ (potential $V = 0$).

### Solution
With $V = 0$, the Schrödinger equation becomes:
$$\frac{d^2\psi}{dx^2} + \frac{2m_e}{\hbar^2}E\psi = 0$$

Define $k^2 = \frac{2m_e E}{\hbar^2}$, giving:
$$\frac{d^2\psi}{dx^2} + k^2\psi = 0$$

The general solution:
$$\psi(x) = A e^{jkx} \quad \text{or} \quad B e^{-jkx}$$

### Full Wavefunction
$$\Psi(x, t) = A \exp[j(kx - \omega t)]$$

This is a traveling wave! The free electron behaves as a wave.

## Key Equations Summary

| Equation | Description |
|----------|-------------|
| $j\hbar\frac{d}{dt}\|\psi\rangle = \hat{H}\|\psi\rangle$ | Time-dependent Schrödinger equation |
| $\hat{H} = -\frac{\hbar^2}{2m}\nabla^2 + V$ | Hamiltonian operator |
| $\hat{H}\|\psi_n\rangle = E_n\|\psi_n\rangle$ | Time-independent Schrödinger equation (eigenvalue form) |
| $[-\frac{\hbar^2}{2m}\nabla^2 + V]\psi = E\psi$ | Time-independent Schrödinger equation |
| $\frac{d^2\psi}{dx^2} + \frac{2m}{\hbar^2}(E-V)\psi = 0$ | 1D time-independent Schrödinger equation |
| $\Psi(x,t) = \psi(x)e^{-jEt/\hbar}$ | Separable solution |
| $\psi(x) = Ae^{jkx}$ | Free particle solution (traveling wave) |