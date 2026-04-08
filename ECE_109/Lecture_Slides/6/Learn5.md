# Learn5: Three-Dimensional Quantum Box
> Estimated time: ~30 minutes

## The 3D Infinite Potential Box

Consider an electron confined in a 3D rectangular box with dimensions $a$, $b$, and $c$:

$$V(x,y,z) = \begin{cases} 0 & 0 < x < a, 0 < y < b, 0 < z < c \\ \infty & \text{otherwise} \end{cases}$$

## Separable Solution

The 3D Schrödinger equation:

$$\frac{\partial^2\psi}{\partial x^2} + \frac{\partial^2\psi}{\partial y^2} + \frac{\partial^2\psi}{\partial z^2} + \frac{2m_e}{\hbar^2}(E - V)\psi = 0$$

Since $V = 0$ inside the box, the wavefunction can be separated:

$$\psi_{n_1 n_2 n_3}(x,y,z) = A\sin(k_x x)\sin(k_y y)\sin(k_z z)$$

With boundary conditions requiring $\psi = 0$ at all surfaces.

## Wave Numbers

$$k_x = \frac{n_1\pi}{a}, \quad k_y = \frac{n_2\pi}{b}, \quad k_z = \frac{n_3\pi}{c}$$

Where $n_1, n_2, n_3 = 1, 2, 3, ...$ are the three quantum numbers.

## Energy Levels

The total energy:

$$E = E(k_x, k_y, k_z) = \frac{\hbar^2}{2m_e}(k_x^2 + k_y^2 + k_z^2)$$

For a rectangular box:

$$E_{n_1 n_2 n_3} = \frac{h^2}{8m_e}\left(\frac{n_1^2}{a^2} + \frac{n_2^2}{b^2} + \frac{n_3^2}{c^2}\right)$$

## Special Case: Cube ($a = b = c$)

For a cube-shaped box:

$$E_{n_1 n_2 n_3} = \frac{h^2}{8m_e a^2}(n_1^2 + n_2^2 + n_3^2)$$

## Degeneracy

In 3D, different combinations of $(n_1, n_2, n_3)$ can give the same energy, leading to **degenerate states**.

For example, in a cube: $(2,1,1)$, $(1,2,1)$, and $(1,1,2)$ all have the same energy.

## Key Difference from 1D

In 1D: One quantum number $n$ → energy $E_n \propto n^2$

In 3D: Three quantum numbers $(n_1, n_2, n_3)$ → energy depends on the sum of squares, allowing multiple distinct states to share the same energy.
