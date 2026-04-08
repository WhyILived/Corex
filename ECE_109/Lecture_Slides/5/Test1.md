# Test1: Quantum Mechanics Formalism and Stationary States
> Tests: Learn1 material
> Time: ~15 minutes

## Conceptual Questions

1. What is the physical interpretation of $|\Psi(\vec{r}, t)|^2$?

2. Why must the wavefunction $\Psi$ and its spatial derivative $\nabla\Psi$ be continuous?

3. Why are the eigenfunctions of the Hamiltonian called "stationary states"?

4. If $|\psi_n\rangle$ is a stationary state with energy $E_n$, what happens to $|\psi_n(t)|^2$ as time evolves?

5. What is the general procedure for expressing an arbitrary wavefunction as a superposition of stationary states?

6. In a 3D potential box with dimensions $a$, $b$, and $c$, why are three quantum numbers ($n_x$, $n_y$, $n_z$) needed instead of one?

## Calculation Problems

1. **Expectation value calculation**
   
   For a particle in state $\psi(x) = \sqrt{\frac{2}{a}} \sin(\frac{\pi x}{a})$ in region $0 \leq x \leq a$ (and 0 elsewhere), calculate the expectation value $\langle x \rangle$.

2. **Stationary state verification**
   
   Show that if $\hat{H}|\psi_n\rangle = E_n|\psi_n\rangle$, then $|\psi_n(t)\rangle = e^{-iE_n t/\hbar}|\psi_n\rangle$ satisfies the Schrödinger equation $i\hbar \frac{\partial}{\partial t}|\psi\rangle = \hat{H}|\psi\rangle$.

3. **Superposition coefficients**
   
   If $|\psi(t=0)\rangle = c_1|\psi_1\rangle + c_2|\psi_2\rangle$ where $|\psi_1\rangle$ and $|\psi_2\rangle$ are orthonormal stationary states, show that $|c_1|^2 + |c_2|^2 = 1$ (normalization condition).

## Answers

1. $|\Psi(\vec{r}, t)|^2$ represents the **probability density** of finding the particle at position $\vec{r}$ at time $t$. The probability of finding the particle in a small volume $dV$ at $\vec{r}$ is $|\Psi(\vec{r}, t)|^2 dV$.

2. $\Psi$ must be continuous because a discontinuity would imply infinite momentum uncertainty. $\nabla\Psi$ must be continuous because a discontinuity would imply infinite force (since $F = -\nabla V$ and the potential must be finite for physical systems).

3. They are called "stationary" because the probability distribution $|\psi_n(\vec{r}, t)|^2$ does not change with time. While the phase evolves as $e^{-iE_n t/\hbar}$, the observable probability density remains constant.

4. $|\psi_n(t)|^2 = |e^{-iE_n t/\hbar} \psi_n(t=0)|^2 = e^{-iE_n t/\hbar} e^{+iE_n t/\hbar} |\psi_n(t=0)|^2 = |\psi_n(t=0)|^2$. The probability distribution is time-independent.

5. First, solve the eigenvalue equation $\hat{H}|\psi_n\rangle = E_n|\psi_n\rangle$ to find all stationary states. Then calculate the coefficients $c_n = \langle \psi_n | \psi(t=0) \rangle = \int \psi_n^* \psi(t=0) dV$. The general solution is $|\psi(t)\rangle = \sum_n c_n e^{-iE_n t/\hbar} |\psi_n(0)\rangle$.

## Calculation Problem Answers

1. **Expectation value:**
   
   $\langle x \rangle = \int_0^a x |\psi(x)|^2 dx = \int_0^a x \frac{2}{a} \sin^2(\frac{\pi x}{a}) dx$
   
   Using $\sin^2\theta = \frac{1}{2}(1 - \cos 2\theta)$:
   
   $\langle x \rangle = \frac{2}{a} \int_0^a x \cdot \frac{1}{2}(1 - \cos\frac{2\pi x}{a}) dx = \frac{1}{a} \left[\frac{x^2}{2} - \frac{a x}{2\pi}\sin\frac{2\pi x}{a} - \frac{a^2}{4\pi^2}\cos\frac{2\pi x}{a}\right]_0^a$
   
   $\langle x \rangle = \frac{a}{2}$

2. **Verification:**
   
   Given $|\psi_n(t)\rangle = e^{-iE_n t/\hbar}|\psi_n\rangle$:
   
   $i\hbar \frac{\partial}{\partial t}|\psi_n(t)\rangle = i\hbar \cdot (-iE_n/\hbar) e^{-iE_n t/\hbar}|\psi_n\rangle = E_n e^{-iE_n t/\hbar}|\psi_n\rangle$
   
   And $\hat{H}|\psi_n(t)\rangle = e^{-iE_n t/\hbar}\hat{H}|\psi_n\rangle = e^{-iE_n t/\hbar}E_n|\psi_n\rangle$
   
   Therefore $i\hbar \frac{\partial}{\partial t}|\psi_n\rangle = \hat{H}|\psi_n\rangle$ is satisfied.

3. **Normalization:**
   
   $1 = \langle \psi(t=0) | \psi(t=0) \rangle = (c_1^*\langle\psi_1| + c_2^*\langle\psi_2|)(c_1|\psi_1\rangle + c_2|\psi_2\rangle)$
   
   $= |c_1|^2\langle\psi_1|\psi_1\rangle + c_1^*c_2\langle\psi_1|\psi_2\rangle + c_2^*c_1\langle\psi_2|\psi_1\rangle + |c_2|^2\langle\psi_2|\psi_2\rangle$
   
   Since stationary states are orthonormal ($\langle\psi_m|\psi_n\rangle = \delta_{mn}$):
   
   $1 = |c_1|^2 + |c_2|^2$

4. **3D cubic box**
   
   An electron is confined in a cubic box with sides $a = b = c = 0.5$ nm. Calculate the ground state energy $E_{111}$ in eV.

## Conceptual Question Answers

6. Three quantum numbers are needed because the electron is confined in three independent spatial directions. Each quantum number $n_i$ corresponds to the quantization condition in that direction: $k_i = n_i\pi/L_i$. The total energy is the sum of energies from each dimension: $E_{n_x n_y n_z} = \frac{\hbar^2\pi^2}{2m_e}[(n_x/a)^2 + (n_y/b)^2 + (n_z/c)^2]$.

## Calculation Problem Answers

4. **3D cubic box ground state:**
   
   $E_{111} = \frac{\hbar^2\pi^2}{2m_e}\left[3\left(\frac{1}{a}\right)^2\right] = \frac{3\hbar^2\pi^2}{2m_e a^2}$
   
   $\hbar = 1.055 \times 10^{-34}$ J·s, $m_e = 9.11 \times 10^{-31}$ kg, $a = 0.5 \times 10^{-9}$ m
   
   $E_{111} = \frac{3(1.055 \times 10^{-34})^2(3.14)^2}{2(9.11 \times 10^{-31})(0.5 \times 10^{-9})^2}$
   
   $= \frac{3(1.113 \times 10^{-68})(9.86)}{2(9.11 \times 10^{-31})(2.5 \times 10^{-19})}$
   
   $= \frac{3.29 \times 10^{-67}}{4.56 \times 10^{-49}} = 7.22 \times 10^{-19}$ J
   
   $E_{111} = \frac{7.22 \times 10^{-19}}{1.602 \times 10^{-19}}$ eV $= 4.51$ eV