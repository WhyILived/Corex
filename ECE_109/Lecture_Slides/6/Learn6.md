# Learn6: Hydrogen Atom Quantum States
> Estimated time: ~30 minutes

## The Hydrogenic Atom Potential

The electron in a hydrogen atom experiences a Coulomb potential:

$$V(r) = -\frac{Ze^2}{4\pi\varepsilon_0 r}$$

For hydrogen, $Z = 1$.

The 3D Schrödinger equation in spherical coordinates ($r, \theta, \phi$):

$$\left[-\frac{\hbar^2}{2m_e}\nabla^2 + V(r)\right]\psi = E\psi$$

Where the Laplacian in spherical coordinates is:
$$\nabla^2 = \frac{1}{r^2}\frac{\partial}{\partial r}\left(r^2\frac{\partial}{\partial r}\right) + \frac{1}{r^2\sin\theta}\frac{\partial}{\partial\theta}\left(\sin\theta\frac{\partial}{\partial\theta}\right) + \frac{1}{r^2\sin^2\theta}\frac{\partial^2}{\partial\phi^2}$$

## Wavefunction Separation

The wavefunction separates into radial and angular parts:

$$\psi_{n,\ell,m_\ell}(r, \theta, \phi) = R_{n,\ell}(r) \cdot Y_{\ell,m_\ell}(\theta, \phi)$$

Where:
- $R_{n,\ell}(r)$ = radial part (depends on principal and angular momentum quantum numbers)
- $Y_{\ell,m_\ell}(\theta, \phi)$ = spherical harmonics (angular part)

## Quantum Numbers

**Principal quantum number** $n = 1, 2, 3, ...$
- Determines the energy level and overall size of the orbital

**Orbital angular momentum quantum number** $\ell = 0, 1, 2, ..., (n-1)$
- Determines the shape of the orbital
- Often labeled as: $s$ ($\ell=0$), $p$ ($\ell=1$), $d$ ($\ell=2$), $f$ ($\ell=3$)

**Magnetic quantum number** $m_\ell = -\ell, -(\ell-1), ..., 0, ..., (\ell-1), \ell$
- Determines orientation of the orbital in space
- There are $2\ell + 1$ possible values for $m_\ell$

## Radial Probability Density

The radial probability density (probability per unit radial distance) is:

$$P(r)\,dr = |R_{n,\ell}(r)|^2 \cdot r^2\,dr$$

When averaged over all directions, the angular part $|Y_{\ell,m_\ell}|^2$ contributes a factor of $1/4\pi$, so the $m_\ell$ dependence vanishes in the radial probability.

This accounts for the increasing volume of spherical shells at larger radii ($4\pi r^2 dr$).

## Example Wavefunctions

| $n$ | $\ell$ | $m_\ell$ | Orbital |
|-----|--------|----------|---------|
| 1 | 0 | 0 | 1s |
| 2 | 0 | 0 | 2s |
| 2 | 1 | 0, ±1 | 2p |
| 3 | 0 | 0 | 3s |
| 3 | 1 | 0, ±1 | 3p |
| 3 | 2 | 0, ±1, ±2 | 3d |

The radial probability distribution shows where electrons are most likely to be found at each energy level.
