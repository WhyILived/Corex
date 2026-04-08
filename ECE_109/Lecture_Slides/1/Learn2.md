# Learn2: Wave Equation & Electromagnetic Waves
> Estimated time: ~30 minutes

## Section 1: What is a Wave?
A wave is a periodically repeating disturbance in space and time that propagates through a medium.

Light: oscillation of the electric and magnetic field amplitude.

## Section 2: The Wave Equation
The general wave equation in three dimensions:
$$\nabla^2 u - \frac{1}{c^2}\frac{\partial^2 u}{\partial t^2} = 0$$

For the electric field in one dimension:
$$\frac{\partial^2 E}{\partial z^2} - \frac{1}{c^2}\frac{\partial^2 E}{\partial t^2} = 0$$

Where:
- $\nabla^2$ is the Laplacian operator
- $c$ is the speed of light ($3 \times 10^8$ m/s in vacuum)
- $u$ represents the wave amplitude (can be a scalar or vector)

**Important property**: The wave equation is linear - if f and g are solutions, then h = f + g is also a solution (principle of superposition).

## Section 3: General Solution to the Wave Equation
The electric field wave solution:
$$E(z,t) = E_0 \cos(kz - \omega t + \phi_0)$$

Where:
- $E_0$ = amplitude
- $k$ = wavenumber (spatial angular frequency) = $2\pi/\lambda$
- $\omega$ = angular frequency = $2\pi f$
- $\phi_0$ = initial phase
- $\lambda$ = wavelength
- $f$ = frequency

## Section 4: Vector Calculus Review
### Gradient ($\nabla \phi$)
Measures rate and direction of change in a scalar field:
$$\nabla \phi = \frac{\partial \phi}{\partial x}\hat{x} + \frac{\partial \phi}{\partial y}\hat{y} + \frac{\partial \phi}{\partial z}\hat{z}$$

Maps: scalar → vector

### Divergence ($\nabla \cdot \vec{A}$)
Measures magnitude of source or sink at a point in a vector field:
$$\nabla \cdot \vec{A} = \frac{\partial A_x}{\partial x} + \frac{\partial A_y}{\partial y} + \frac{\partial A_z}{\partial z}$$

Maps: vector → scalar

### Curl ($\nabla \times \vec{A}$)
Measures tendency to rotate about a point in a vector field:
$$\nabla \times \vec{A} = \left(\frac{\partial A_z}{\partial y} - \frac{\partial A_y}{\partial z}\right)\hat{x} + \left(\frac{\partial A_x}{\partial z} - \frac{\partial A_z}{\partial x}\right)\hat{y} + \left(\frac{\partial A_y}{\partial x} - \frac{\partial A_x}{\partial y}\right)\hat{z}$$

Maps: vector → vector

### Laplacian
**Scalar Laplacian**: $\nabla^2 \phi = \frac{\partial^2 \phi}{\partial x^2} + \frac{\partial^2 \phi}{\partial y^2} + \frac{\partial^2 \phi}{\partial z^2}$
Maps: scalar → scalar

**Vector Laplacian**: $\nabla^2 \vec{A} = \nabla^2 A_x \hat{x} + \nabla^2 A_y \hat{y} + \nabla^2 A_z \hat{z}$
Maps: vector → vector

## Section 5: Monochromatic Plane Waves
A monochromatic plane wave is a solution to the wave equation with a single frequency.

**Temporal period (T)**: Time for one complete oscillation
$$\omega = \frac{2\pi}{T}$$

**Spatial period (wavelength $\lambda$)**: Distance for one complete oscillation
$$k = \frac{2\pi}{\lambda}$$

**Relationship between $\omega$ and $k$:
$$\omega = ck \quad \text{or} \quad c = f\lambda = \frac{\omega}{k}$$

**General form in 3D:**
$$E(\vec{r}, t) = E_0 \cos(\vec{k} \cdot \vec{r} - \omega t + \phi_0)$$

Where $\vec{k} = k_x\hat{x} + k_y\hat{y} + k_z\hat{z}$ is the wavevector with magnitude $|\vec{k}| = \frac{2\pi}{\lambda}$

## Section 6: Light as EM Waves
Light is an electromagnetic wave with:
- Electric field $\vec{E}$ and magnetic field $\vec{B}$ perpendicular to each other and to direction of propagation
- Speed $c = \frac{1}{\sqrt{\varepsilon_0 \mu_0}} = 3 \times 10^8$ m/s in vacuum

## Key Equations
$$\nabla^2 u - \frac{1}{c^2}\frac{\partial^2 u}{\partial t^2} = 0 \quad \text{(wave equation)}$$
$$E(z,t) = E_0 \cos(kz - \omega t + \phi_0) \quad \text{(traveling wave)}$$
$$\omega = 2\pi f \quad \text{(angular frequency)}$$
$$k = \frac{2\pi}{\lambda} \quad \text{(wavenumber)}$$
$$c = f\lambda = \frac{\omega}{k} \quad \text{(phase velocity)}$$

## Key Definitions
- **Wave**: Periodically repeating disturbance in space and time
- **Wavefront**: Locus of points with identical wave displacement
- **Ray**: Line perpendicular to successive wavefronts; specifies energy flow direction
- **Plane wave**: Wave with constant phase over planes perpendicular to propagation
- **Monochromatic**: Single frequency/wavelength
