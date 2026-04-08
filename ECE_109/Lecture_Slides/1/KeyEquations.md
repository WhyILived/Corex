# KeyEquations: All Equations Collected
> Quick reference for Lecture 1

## Quantum Mechanics Basics

### Photon Properties
$$E = hf \quad \text{(photon energy)}$$
Where: $E$ = energy (J), $h = 6.63 \times 10^{-34}$ J·s, $f$ = frequency (Hz)

$$p = \frac{h}{\lambda} \quad \text{(photon momentum)}$$
Where: $p$ = momentum (kg·m/s), $\lambda$ = wavelength (m)

$$K_E = hf - \Phi \quad \text{(photoelectric effect)}$$
Where: $K_E$ = electron kinetic energy, $\Phi$ = work function

$$I = \Gamma_{ph}hf \quad \text{(light intensity)}$$
Where: $\Gamma_{ph} = \Delta N_{ph}/(A \Delta t)$ = photon flux density

### de Broglie Relations
$$\lambda = \frac{h}{p} \quad \text{(de Broglie wavelength)}$$
$$E = hf = \hbar\omega \quad \text{(photon energy in angular form)}$$

### Black Body Radiation
$$I_\lambda = \frac{2\pi hc^2}{\lambda^5[\exp(\frac{hc}{\lambda kT}) - 1]} \quad \text{(Planck's law)}$$
$$P_S = \sigma_S T^4 \quad \text{(Stefan-Boltzmann)}$$
Where: $\sigma_S = 5.670 \times 10^{-8}$ W/m²·K⁴

$$\lambda_{max}T \approx 2.89 \times 10^{-3} \text{ m·K} \quad \text{(Wien's displacement)}$$

## Wave Equation

### Wave Equation
$$\nabla^2 u - \frac{1}{c^2}\frac{\partial^2 u}{\partial t^2} = 0 \quad \text{(general wave equation)}$$

### Traveling Wave Solution
$$E(z,t) = E_0 \cos(kz - \omega t + \phi_0)$$
Where:
- $E_0$ = amplitude
- $k = 2\pi/\lambda$ = wavenumber
- $\omega = 2\pi f$ = angular frequency
- $\phi_0$ = phase constant

### Wave Parameters
$$\omega = \frac{2\pi}{T} \quad \text{(angular frequency)}$$
$$k = \frac{2\pi}{\lambda} \quad \text{(wavenumber)}$$
$$c = f\lambda = \frac{\omega}{k} \quad \text{(phase velocity)}$$

## Vector Calculus Operators
$$\nabla \phi = \frac{\partial \phi}{\partial x}\hat{x} + \frac{\partial \phi}{\partial y}\hat{y} + \frac{\partial \phi}{\partial z}\hat{z} \quad \text{(gradient: scalar} \rightarrow \text{vector)}$$
$$\nabla \cdot \vec{A} = \frac{\partial A_x}{\partial x} + \frac{\partial A_y}{\partial y} + \frac{\partial A_z}{\partial z} \quad \text{(divergence: vector} \rightarrow \text{scalar)}$$
$$\nabla \times \vec{A} = \left(\frac{\partial A_z}{\partial y} - \frac{\partial A_y}{\partial z}\right)\hat{x} + \ldots \quad \text{(curl: vector} \rightarrow \text{vector)}$$
$$\nabla^2 \phi = \frac{\partial^2 \phi}{\partial x^2} + \frac{\partial^2 \phi}{\partial y^2} + \frac{\partial^2 \phi}{\partial z^2} \quad \text{(scalar Laplacian)}$$

## Heisenberg Uncertainty Principle
$$\Delta x \cdot \Delta p_x \gtrsim \hbar \quad \text{(position-momentum)}$$
$$\Delta E \cdot \Delta t \gtrsim \hbar \quad \text{(energy-time)}$$
Where: $\hbar = h/(2\pi) = 1.055 \times 10^{-34}$ J·s

## Hydrogen Atom

### Quantum Numbers
| Number | Symbol | Values | Quantizes |
|--------|--------|--------|-----------|
| Principal | $n$ | 1, 2, 3, ... | Energy |
| Orbital | $\ell$ | 0, 1, 2, ..., n-1 | Angular momentum magnitude |
| Magnetic | $m_\ell$ | $-\ell, ..., +\ell$ | Angular momentum z-component |
| Spin | $m_s$ | $\pm 1/2$ | Spin z-component |

### Energy Levels
$$E_n = -\frac{13.6 \text{ eV}}{n^2} \quad \text{(hydrogen energy)}$$
$$L = \hbar\sqrt{\ell(\ell+1)} \quad \text{(orbital angular momentum)}$$
$$L_z = m_\ell\hbar \quad \text{(angular momentum z-component)}$$
$$S_z = m_s\hbar = \pm \hbar/2 \quad \text{(spin z-component)}$$

### Selection Rules
$$\Delta \ell = \pm 1$$
$$\Delta m_\ell = 0, \pm 1$$

## Constants Reference
| Constant | Symbol | Value |
|----------|--------|-------|
| Planck's constant | $h$ | $6.63 \times 10^{-34}$ J·s |
| Reduced Planck | $\hbar$ | $1.055 \times 10^{-34}$ J·s |
| Speed of light | $c$ | $3 \times 10^8$ m/s |
| Stefan constant | $\sigma_S$ | $5.670 \times 10^{-8}$ W/m²·K⁴ |
| Electron mass | $m_e$ | $9.11 \times 10^{-31}$ kg |
| Bohr radius | $a_0$ | $0.0529$ nm |
