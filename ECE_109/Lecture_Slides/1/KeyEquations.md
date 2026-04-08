# KeyEquations: Lecture 1

## Wave Equation
$$\nabla^2 u - \frac{1}{c^2}\frac{\partial^2}{\partial t^2}u = 0$$

1D form:
$$\frac{\partial^2}{\partial z^2}E(z,t) - \frac{1}{c^2}\frac{\partial^2}{\partial t^2}E(z,t) = 0$$

## Vector Calculus
$$\nabla \phi = \frac{\partial \phi}{\partial x}\hat{x} + \frac{\partial \phi}{\partial y}\hat{y} + \frac{\partial \phi}{\partial z}\hat{z} \quad \text{(gradient: scalar → vector)}$$
$$\nabla \cdot \vec{A} = \frac{\partial A_x}{\partial x} + \frac{\partial A_y}{\partial y} + \frac{\partial A_z}{\partial z} \quad \text{(divergence: vector → scalar)}$$
$$\nabla \times \vec{A} \quad \text{(curl: vector → vector)}$$
$$\nabla^2 \phi = \frac{\partial^2 \phi}{\partial x^2} + \frac{\partial^2 \phi}{\partial y^2} + \frac{\partial^2 \phi}{\partial z^2} \quad \text{(scalar Laplacian: scalar → scalar)}$$

## Monochromatic Plane Wave
$$E(z,t) = E_0\cos(kz - \omega t + \phi_0)$$
$$\vec{k} = \hat{x}k_x + \hat{y}k_y + \hat{z}k_z, \quad |\vec{k}| = \frac{2\pi}{\lambda} = \frac{\omega}{c}$$
$$\omega = \frac{2\pi}{T}$$

## Photoelectric Effect
$$KE_{max} = eV_0 = hf - \Phi_{metal}$$
Where:
- $KE_{max}$ = maximum kinetic energy of emitted electron
- $e = 1.6 \times 10^{-19}$ C = electron charge
- $V_0$ = stopping voltage
- $h = 6.6 \times 10^{-34}$ J·s = Planck's constant
- $f$ = frequency of light
- $\Phi$ = work function of the metal

## Photon Properties
$$E_{photon} = hf = \hbar\omega$$
$$\hbar = \frac{h}{2\pi} = 1.05 \times 10^{-34} \text{ J·s}$$
$$p = \frac{h}{\lambda} = \frac{E_{photon}}{c}$$
$$\Gamma_{ph} = \frac{\Delta N_{ph}}{A \Delta t} \quad \text{(photon flux density)}$$
$$I = \frac{1}{2}c\varepsilon_0 E_0^2 = \Gamma_{ph}hf \quad \text{(light intensity)}$$

## Constants
- $c = 3 \times 10^8$ m/s (speed of light in vacuum)
- $\varepsilon_0 = 8.85 \times 10^{-12}$ F/m (permittivity of free space)
- $h = 6.6 \times 10^{-34}$ J·s
- $\hbar = 1.05 \times 10^{-34}$ J·s
- $e = 1.6 \times 10^{-19}$ C