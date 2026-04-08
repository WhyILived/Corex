# Learn1: Quantum Mechanics Formalism and Stationary States
> Estimated time: ~30 minutes

## Section 1: Wavefunction and Quantum State

The wavefunction $\Psi(\vec{r}, t)$ is a complex function that describes the quantum state of a particle.

- $\Psi$ itself is not directly observable, but $|\Psi|^2$ represents the probability density of finding the particle
- $|\Psi(\vec{r}, t)|^2 dV$ is the probability of finding the particle in volume $dV$ at position $\vec{r}$ and time $t$
- $\Psi$ and $\nabla\Psi$ must be continuous over $x, y, z$ and $t$

The wavefunction is **normed**: $\int_{-\infty}^{\infty} |\Psi|^2 dV = 1$

## Section 2: Expectation Values

Experimentally observable quantities ("observables") are calculated using **expectation values**:

$$\langle \hat{A} \rangle = \langle \psi | \hat{A} | \psi \rangle = \int \psi^*(\vec{r}, t) \hat{A} \psi(\vec{r}, t) dV$$

Where:
- $\hat{A}$ is the mathematical operator associated with the observable
- $\psi$ is the wavefunction (state vector $|\psi\rangle$)
- $\psi^*$ is the complex conjugate

For example, the expectation value of position $x$:
$$E[X] = \int_{-\infty}^{\infty} x |\psi(x, t)|^2 dx$$

## Section 3: Schrödinger Equation of Motion

The time evolution of the wavefunction is governed by the **Schrödinger equation**:

$$i\hbar \frac{\partial}{\partial t} |\psi\rangle = \hat{H} |\psi\rangle$$

Where $\hat{H}$ is the Hamiltonian operator (total energy operator).

From this, the **time evolution operator** is:
$$\hat{U}(t) = e^{-i\hat{H}t/\hbar}$$

And the time evolution of a state is:
$$|\psi(t)\rangle = e^{-i\hat{H}t/\hbar} |\psi(0)\rangle$$

## Section 4: Stationary States

**Stationary states** are eigenfunctions of the Hamiltonian operator:

$$\hat{H} |\psi_n\rangle = E_n |\psi_n\rangle$$

Where:
- $E_n$ is the energy of the stationary state (a number, not an operator)
- $\psi_n$ are the eigenfunctions (stationary states)

### Time Evolution of Stationary States

For a stationary state $|\psi_n\rangle$ with energy $E_n$:

$$|\psi_n(t)\rangle = e^{-iE_n t/\hbar} |\psi_n(t=0)\rangle$$

The probability distribution is **time-independent**:

$$|\psi_n(t)|^2 = |e^{-iE_n t/\hbar} \psi_n(t=0)|^2 = |\psi_n(t=0)|^2$$

This is why they are called "stationary" - the probability distribution does not change with time.

### General Solution as Superposition

Any solution to the Schrödinger equation can be expressed as a superposition of stationary states:

$$|\psi(t=0)\rangle = \sum_n c_n |\psi_n(t=0)\rangle$$

Where the coefficients are:
$$c_n = \langle \psi_n(t=0) | \psi(t=0) \rangle = \int \psi_n^*(x) \psi(x) dx$$

The time evolution is then:
$$|\psi(t)\rangle = \sum_n c_n e^{-iE_n t/\hbar} |\psi_n(0)\rangle$$

## Section 5: Three-Dimensional Potential Box

When an electron is confined in a 3D box with dimensions $a$, $b$, and $c$ along $x$, $y$, and $z$ directions, the potential is:

$$V(x,y,z) = \begin{cases} 0 & \text{for } 0 < x < a, 0 < y < b, 0 < z < c \\ \infty & \text{otherwise} \end{cases}$$

The time-independent Schrödinger equation in 3D is:

$$\frac{\partial^2\psi}{\partial x^2} + \frac{\partial^2\psi}{\partial y^2} + \frac{\partial^2\psi}{\partial z^2} + \frac{2m_e}{\hbar^2} E\psi = 0$$

Since the potential separates into $V(x) + V(y) + V(z)$, the wavefunction **separates into a product**:

$$\psi_{n_x n_y n_z}(x, y, z) = \sqrt{\frac{8}{abc}} \sin\left(\frac{n_x \pi x}{a}\right) \sin\left(\frac{n_y \pi y}{b}\right) \sin\left(\frac{n_z \pi z}{c}\right)$$

The energy is:

$$E_{n_x n_y n_z} = \frac{\hbar^2 \pi^2}{2m_e}\left[\left(\frac{n_x}{a}\right)^2 + \left(\frac{n_y}{b}\right)^2 + \left(\frac{n_z}{c}\right)^2\right]$$

Where $n_x, n_y, n_z = 1, 2, 3, ...$ are the **three quantum numbers**.

**Degeneracy:** Different combinations of quantum numbers can give the same energy. For example, in a cubic box ($a = b = c$), $E_{2,1,1} = E_{1,2,1} = E_{1,1,2}$.

## Key Equations

**Expectation value:**
$$\langle \hat{A} \rangle = \int \psi^*(\vec{r}, t) \hat{A} \psi(\vec{r}, t) dV$$

**Time evolution operator:**
$$\hat{U}(t) = e^{-i\hat{H}t/\hbar}$$

**Stationary state eigenvalue equation:**
$$\hat{H} |\psi_n\rangle = E_n |\psi_n\rangle$$

**Stationary state time evolution:**
$$|\psi_n(t)\rangle = e^{-iE_n t/\hbar} |\psi_n(t=0)\rangle$$

**3D potential box energy:**
$$E_{n_x n_y n_z} = \frac{\hbar^2 \pi^2}{2m_e}\left[\left(\frac{n_x}{a}\right)^2 + \left(\frac{n_y}{b}\right)^2 + \left(\frac{n_z}{c}\right)^2\right]$$

Where:
- $\hbar = h/2\pi = 1.055 \times 10^{-34}$ J·s (reduced Planck constant)
- $h = 6.63 \times 10^{-34}$ J·s (Planck constant)
- $\hat{H}$ = Hamiltonian operator (total energy)
- $E_n$ = energy eigenvalue for stationary state $n$
- $|\psi_n\rangle$ = stationary state wavefunction (eigenfunction)
- $n_x, n_y, n_z = 1, 2, 3, ...$ = quantum numbers in x, y, z directions