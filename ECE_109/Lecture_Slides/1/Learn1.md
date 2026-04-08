# Learn1: Wave Equation and Electromagnetic Waves
> Estimated time: ~30 minutes

## Wave Equation Fundamentals
A wave is a periodically repeating disturbance in space and time that propagates through a medium.

The wave equation describes how waves propagate:
$$\nabla^2 u - \frac{1}{c^2}\frac{\partial^2}{\partial t^2}u = 0$$

For the electric field in one dimension:
$$\frac{\partial^2}{\partial z^2}E(z,t) - \frac{1}{c^2}\frac{\partial^2}{\partial t^2}E(z,t) = 0$$

Where:
- $\nabla^2$ = Laplacian operator
- $u = u(x,y,z,t)$ is the wave function (can be a scalar or vector)
- $c$ = speed of wave propagation

## Key Property: Superposition Principle
The wave equation is a linear differential equation. If $f(x,y,z,t)$ and $g(x,y,z,t)$ are both solutions, then their superposition $h(x,y,z,t) = f(x,y,z,t) + g(x,y,z,t)$ is also a solution.

This means waves can pass through each other without interaction.

## Light as an Electromagnetic Wave
Light consists of oscillations of electric and magnetic field amplitudes. The wave equation describes the propagation of these electromagnetic fields.

## Vector Calculus for Waves

### Gradient
Measures the rate and direction of change in a scalar field:
$$\nabla \phi = \hat{x}\frac{\partial \phi}{\partial x} + \hat{y}\frac{\partial \phi}{\partial y} + \hat{z}\frac{\partial \phi}{\partial z}$$

Where:
- $\hat{x}, \hat{y}, \hat{z}$ are unit vectors in x, y, z directions

### Divergence
Measures the magnitude of a source or sink at a given point in a vector field:
$$\nabla \cdot \vec{A} = \frac{\partial A_x}{\partial x} + \frac{\partial A_y}{\partial y} + \frac{\partial A_z}{\partial z}$$

- Input: vector → Output: scalar

### Curl
Measures the tendency to rotate about a point in a vector field:
$$\nabla \times \vec{A} = \begin{vmatrix} \hat{x} & \hat{y} & \hat{z} \\ \frac{\partial}{\partial x} & \frac{\partial}{\partial y} & \frac{\partial}{\partial z} \\ A_x & A_y & A_z \end{vmatrix}$$

- Input: vector → Output: vector

### Scalar Laplacian
Divergence of the gradient:
$$\nabla^2 \phi = \frac{\partial^2 \phi}{\partial x^2} + \frac{\partial^2 \phi}{\partial y^2} + \frac{\partial^2 \phi}{\partial z^2}$$

- Input: scalar → Output: scalar

### Vector Laplacian
$$\nabla^2 \vec{A} = \hat{x}\nabla^2 A_x + \hat{y}\nabla^2 A_y + \hat{z}\nabla^2 A_z$$

Where each component is a scalar Laplacian. Input: vector → Output: vector

## Key Equations Summary
$$\nabla^2 u - \frac{1}{c^2}\frac{\partial^2}{\partial t^2}u = 0 \quad \text{(wave equation)}$$

$$\nabla \phi \quad \text{(gradient: scalar → vector)}$$
$$\nabla \cdot \vec{A} \quad \text{(divergence: vector → scalar)}$$
$$\nabla \times \vec{A} \quad \text{(curl: vector → vector)}$$
$$\nabla^2 \phi \quad \text{(scalar Laplacian: scalar → scalar)}$$
$$\nabla^2 \vec{A} \quad \text{(vector Laplacian: vector → vector)}$$