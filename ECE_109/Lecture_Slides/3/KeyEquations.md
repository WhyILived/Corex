# Key Equations: Lecture 3
> All equations from lecture slides only

## Light as Wave (Young's Double-Slit)

### Electric Field Equations
$$\vec{E}_1(\vec{r}, t) = \vec{E}_0 \cos(\vec{k} \cdot \vec{r}_1 - \omega t + \phi_1)$$

$$\vec{E}_2(\vec{r}, t) = \vec{E}_0 \cos(\vec{k} \cdot \vec{r}_2 - \omega t + \phi_2)$$

### Intensity
$$I = \frac{1}{2}c\epsilon_0|\vec{E}_1 + \vec{E}_2|^2$$

### Interference Conditions
- **Constructive**: $S1P - S2P = n\lambda$ where $n = 0, 1, 2, ...$
- **Destructive**: $S1P - S2P = (n + \frac{1}{2})\lambda$

## Photon Properties

### Energy
$$E_{photon} = hf = h\nu = \hbar\omega$$

### Momentum
$$p = \frac{E_{photon}}{c} = \frac{hf}{c} = \frac{h}{\lambda}$$

### Light Intensity
$$I = \frac{1}{2}c\epsilon_0 E_0^2$$

$$I = \Gamma_{ph}hf$$

Where $\Gamma_{ph} = \frac{\Delta N_{ph}}{A\Delta t}$

## Photoelectric Effect

$$KE_{max} = eV_0 = \frac{1}{2}m_ev^2 = hf - \Phi_{metal}$$

## Blackbody Radiation

### Planck's Law
$$I_\lambda = \frac{2\pi hc^2}{\lambda^5 \left[ \exp\left(\frac{hc}{\lambda kT}\right) - 1 \right]}$$

### Stefan-Boltzmann Law
$$P_S = \int_0^\infty I_\lambda \, d\lambda = \frac{2\pi^5 k^4}{15c^2 h^3} T^4 = \sigma T^4$$

### Wien's Displacement Law
$$\lambda_{max} \approx \frac{2.89 \times 10^{-3} \text{ m·K}}{T}$$

## De Broglie Relations

$$\lambda = \frac{h}{p} \quad \text{or} \quad p = \frac{h}{\lambda}$$

## Quantum Mechanics

### Wavefunction Properties
$$|\Psi(x,y,z,t)|^2 \, dx \, dy \, dz = \text{probability}$$

### Time-Dependent Schrödinger Equation
$$j\hbar\frac{d}{dt}|\psi\rangle = \hat{H}|\psi\rangle$$

### Hamiltonian Operator
$$\hat{H} = -\frac{\hbar^2}{2m}\nabla^2 + V(\vec{r})$$

### Time Evolution Operator
$$\hat{U}(t) = e^{-j\hat{H}t/\hbar}$$

### Stationary States
$$\hat{H}|\psi_n\rangle = E_n|\psi_n\rangle$$

$$|\psi_n(t)\rangle = e^{-jE_n t/\hbar}|\psi_n\rangle$$

### Time-Independent Schrödinger Equation
$$[-\frac{\hbar^2}{2m}\nabla^2 + V(\vec{r})]\psi_n = E_n\psi_n$$

### 1D Form
$$\frac{d^2\psi}{dx^2} + \frac{2m}{\hbar^2}(E - V)\psi = 0$$

### Full Wavefunction
$$\Psi(x, t) = \psi(x) \exp\left(-\frac{jEt}{\hbar}\right)$$

## Physical Constants

| Constant | Symbol | Value |
|----------|--------|-------|
| Planck's constant | $h$ | $6.6 \times 10^{-34}$ J·s |
| Reduced Planck's constant | $\hbar$ | $1.05 \times 10^{-34}$ J·s |
| Boltzmann constant | $k$ | $1.38 \times 10^{-23}$ J/K |
| Speed of light | $c$ | $3 \times 10^8$ m/s |
| Electron mass | $m_e$ | $9.11 \times 10^{-31}$ kg |
| Elementary charge | $e$ | $1.6 \times 10^{-19}$ C |